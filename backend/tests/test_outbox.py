"""Outbox worker regression tests: queue, deliver, retry, dead-letter."""

from datetime import datetime, timedelta

from backend.extensions import db
from backend.models import OutboxEvent
from backend.models.outbox_event import (
    STATUS_DEAD,
    STATUS_DONE,
    STATUS_FAILED,
    STATUS_PENDING,
    TYPE_EMAIL_SEND,
    TYPE_KAFKA_EMIT,
    TYPE_NOTIFICATION_CREATE,
)
from backend.utils import outbox as outbox_module


def _drain(app, worker_id="test-worker"):
    """Run one claim+dispatch pass inline (no threads). Returns statuses."""
    from backend import outbox_worker as worker

    with app.app_context():
        claimed = worker.claim_batch(worker_id, batch_size=25)
        results = [worker.process_row(app, event_id, worker_id) for event_id in claimed]
    return results


def test_email_event_is_queued_and_dispatched(monkeypatch, app, client, make_user):
    from backend import outbox_dispatch as dispatch_module

    user = make_user(email="outbox@example.com")
    calls = []
    monkeypatch.setattr(
        dispatch_module,
        "_send_email",
        lambda payload: calls.append(payload),
    )

    with app.app_context():
        event = outbox_module.enqueue_email(
            outbox_module.EMAIL_PASSWORD_RESET,
            user.email,
            {"name": user.name, "code": "123456"},
        )
        db.session.commit()
        event_id = event.event_id

    assert _drain(app) == ["done"]
    assert len(calls) == 1
    assert calls[0]["kind"] == "password_reset"

    db.session.expire_all()
    row = OutboxEvent.query.filter_by(event_id=event_id).one()
    assert row.status == STATUS_DONE
    # Secrets must not linger after delivery.
    assert row.payload is None


def test_failing_event_retries_then_dies(monkeypatch, app):
    from backend import outbox_dispatch as dispatch_module

    monkeypatch.setattr(
        dispatch_module, "_send_email", lambda payload: (_ for _ in ()).throw(RuntimeError("boom"))
    )

    with app.app_context():
        event = outbox_module.enqueue_email(
            outbox_module.EMAIL_OTP, "x@example.com", {"code": "1"}, max_attempts=2
        )
        db.session.commit()
        event_id = event.event_id

    assert _drain(app) == ["failed"]
    db.session.expire_all()
    row = OutboxEvent.query.filter_by(event_id=event_id).one()
    assert row.status == STATUS_FAILED
    assert row.attempts == 1
    assert row.next_run_at > datetime.utcnow()

    # Not due yet: nothing claimed.
    assert _drain(app) == []

    # Force due again: second failure exhausts max_attempts -> dead.
    with app.app_context():
        row = OutboxEvent.query.filter_by(event_id=event_id).one()
        row.next_run_at = datetime.utcnow() - timedelta(seconds=1)
        db.session.commit()
    assert _drain(app) == ["dead"]
    db.session.expire_all()
    row = OutboxEvent.query.filter_by(event_id=event_id).one()
    assert row.status == STATUS_DEAD


def test_unknown_type_is_dead_on_arrival(app):
    # Bypass enqueue validation to simulate a bad row.
    with app.app_context():
        event = OutboxEvent(
            event_id="bad-type-1",
            type="nope.unknown",
            payload={},
            status=STATUS_PENDING,
            max_attempts=10,
            next_run_at=datetime.utcnow(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.session.add(event)
        db.session.commit()

    assert _drain(app) == ["dead"]
    db.session.expire_all()
    assert OutboxEvent.query.filter_by(event_id="bad-type-1").one().status == STATUS_DEAD


def test_claim_is_exclusive(app):
    from backend import outbox_worker as worker

    with app.app_context():
        event = outbox_module.enqueue_email(
            outbox_module.EMAIL_OTP, "y@example.com", {"code": "2"}
        )
        db.session.commit()
        event_id = event.event_id

    with app.app_context():
        claimed = worker.claim_batch("worker-a", batch_size=25)
        found = OutboxEvent.query.filter(OutboxEvent.id.in_(claimed)).all()
        assert {e.event_id for e in found} == {event_id}
        # Second claimer sees nothing: the row is already processing.
        assert worker.claim_batch("worker-b", batch_size=25) == []


def test_kafka_event_dispatch(monkeypatch, app):
    from backend.utils.kafka_service import kafka_service

    calls = []
    monkeypatch.setattr(
        kafka_service, "emit_event", lambda *a, **k: calls.append((a, k)) or True
    )

    with app.app_context():
        outbox_module.enqueue_kafka_event("user_registered", {"user_id": 1})
        db.session.commit()

    assert _drain(app) == ["done"]
    assert calls and calls[0][0][0] == "user_registered"


def test_notification_create_dispatch(app):
    from backend.models import Notification

    user_id = 424242
    with app.app_context():
        outbox_module.enqueue_notification(
            user_id, "referral_signup", "Hello", "World", related_post_id=None
        )
        db.session.commit()

    assert _drain(app) == ["done"]
    created = Notification.query.filter_by(user_id=user_id).all()
    assert len(created) == 1
    assert created[0].title == "Hello"


def test_forgot_password_queues_instead_of_sending(monkeypatch, client, make_user):
    from backend.api.auth import password_reset as password_reset_module

    monkeypatch.setattr(password_reset_module, "MIN_FORGOT_RESPONSE_SECONDS", 0)
    user = make_user(email="queued-reset@example.com")

    response = client.post("/api/auth/password/forgot", json={"email": user.email})
    assert response.status_code == 200

    event = (
        OutboxEvent.query.filter_by(type=TYPE_EMAIL_SEND)
        .order_by(OutboxEvent.id.desc())
        .first()
    )
    assert event is not None
    assert event.payload["kind"] == "password_reset"
    assert event.payload["context"]["code"]
    assert event.status in (STATUS_PENDING, STATUS_DONE)


def test_outbox_health_reports_backlog(client, make_user):
    with client.application.app_context():
        outbox_module.enqueue_email(
            outbox_module.EMAIL_OTP, "z@example.com", {"code": "3"}
        )
        db.session.commit()

    response = client.get("/api/health/outbox")
    assert response.status_code == 200
    body = response.get_json()
    assert body["pending"] >= 1

"""Admin endpoint regression tests: superadmin gate, plan management, outbox retry."""

from backend.extensions import db
from backend.models import OutboxEvent


def _superadmin(make_user):
    admin = make_user(email="root-admin@example.com")
    admin.is_superadmin = True
    db.session.commit()
    return admin


def test_admin_endpoints_require_superadmin(client, make_user, auth_headers):
    user = make_user(email="plain@example.com")
    headers = auth_headers(user)

    assert client.get("/api/admin/overview", headers=headers).status_code == 403
    assert client.get("/api/admin/users", headers=headers).status_code == 403
    assert client.get("/api/admin/organizations", headers=headers).status_code == 403
    assert client.get("/api/admin/outbox", headers=headers).status_code == 403
    assert client.patch("/api/admin/users/1", headers=headers, json={}).status_code == 403
    assert client.post("/api/admin/outbox/1/retry", headers=headers).status_code == 403
    assert client.get("/api/admin/overview").status_code == 401


def test_superadmin_can_list_and_update_plans(client, make_user, make_org, auth_headers):
    admin = _superadmin(make_user)
    headers = auth_headers(admin)
    user = make_user(email="member@example.com")
    make_org()

    response = client.get("/api/admin/users?q=member", headers=headers)
    assert response.status_code == 200
    assert any(u["email"] == "member@example.com" for u in response.get_json()["data"])

    response = client.patch(
        f"/api/admin/users/{user.id}",
        headers=headers,
        json={"subscription_status": "active", "paid_plan": True, "token_allowance": 5000},
    )
    assert response.status_code == 200
    body = response.get_json()
    assert body["subscription_status"] == "active"
    assert body["paid_plan"] is True
    assert body["token_allowance"] == 5000

    response = client.patch(
        f"/api/admin/users/{user.id}", headers=headers, json={"token_allowance": -1}
    )
    assert response.status_code == 400

    response = client.get("/api/admin/organizations", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["pagination"]["total"] >= 1


def test_superadmin_grant_has_self_and_last_admin_guards(client, make_user, auth_headers):
    admin = _superadmin(make_user)
    headers = auth_headers(admin)
    other = make_user(email="other@example.com")

    # Cannot remove your own access.
    response = client.patch(
        f"/api/admin/users/{admin.id}", headers=headers, json={"is_superadmin": False}
    )
    assert response.status_code == 409

    # Cannot remove the only other... first grant, then last-admin blocks.
    assert client.patch(
        f"/api/admin/users/{other.id}", headers=headers, json={"is_superadmin": True}
    ).status_code == 200
    # Removing the other admin is fine (caller remains).
    assert client.patch(
        f"/api/admin/users/{other.id}", headers=headers, json={"is_superadmin": False}
    ).status_code == 200
    # Now removing yourself is still blocked (you would orphan the role).
    response = client.patch(
        f"/api/admin/users/{admin.id}", headers=headers, json={"is_superadmin": False}
    )
    assert response.status_code == 409


def test_superadmin_can_retry_dead_outbox_event(client, make_user, auth_headers, app):
    from backend.models.outbox_event import STATUS_DEAD, STATUS_PENDING
    from backend.utils import outbox as outbox_module

    admin = _superadmin(make_user)
    headers = auth_headers(admin)

    with app.app_context():
        event = outbox_module.enqueue_email(
            outbox_module.EMAIL_OTP, "retry-me@example.com", {"code": "123456"}
        )
        event.status = STATUS_DEAD
        db.session.commit()
        event_id = event.id

    response = client.post(f"/api/admin/outbox/{event_id}/retry", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["status"] == STATUS_PENDING

    db.session.expire_all()
    assert db.session.get(OutboxEvent, event_id).status == STATUS_PENDING


def test_admin_overview_reports_counts(client, make_user, auth_headers):
    admin = _superadmin(make_user)
    headers = auth_headers(admin)

    response = client.get("/api/admin/overview", headers=headers)
    assert response.status_code == 200
    body = response.get_json()
    assert body["users"]["total"] >= 1
    assert "scheduler_healthy" in body
    assert "outbox" in body

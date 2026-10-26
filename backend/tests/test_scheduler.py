"""P1-04 regression tests: scheduled jobs, locking, and freshness health.

The scheduler is a separate process, but the logic is testable without a timer:
each job is a normal function, every run writes a row, and the advisory lock is
cross-process on PostgreSQL.
"""

from datetime import datetime, timedelta

from backend.constants import TRIAL_PERIOD_DAYS
from backend.extensions import db
from backend.models import Interview, Organization, SchedulerRun, User
from backend.scheduler import (
    JOB_DEFINITIONS,
    job_lock,
    run_job,
    scheduler_health,
)
from backend.utils.interview_utils import update_expired_interviews
from backend.utils.subscription import SubscriptionManager


def test_trial_expiry_uses_the_single_30_day_window(
    make_user, make_org
):
    old_user = make_user(email="old-trial@example.com")
    old_user.subscription_status = "trial"
    old_user.trial_start_date = datetime.utcnow() - timedelta(
        days=TRIAL_PERIOD_DAYS + 1
    )

    current_user = make_user(email="current-trial@example.com")
    current_user.subscription_status = "trial"
    current_user.trial_start_date = datetime.utcnow() - timedelta(
        days=TRIAL_PERIOD_DAYS - 1
    )

    old_org = make_org()
    old_org.subscription_status = "trial"
    old_org.trial_start_date = datetime.utcnow() - timedelta(
        days=TRIAL_PERIOD_DAYS + 1
    )
    db.session.commit()

    counts = SubscriptionManager.check_trial_expiration(
        batch_size=10, max_batches=2
    )

    assert counts == {"users": 1, "organizations": 1}
    db.session.expire_all()
    assert db.session.get(User, old_user.id).subscription_status == "expired"
    assert db.session.get(User, current_user.id).subscription_status == "trial"
    assert db.session.get(Organization, old_org.id).subscription_status == "expired"


def test_expired_interviews_complete_only_after_their_duration(
    make_user
):
    user = make_user()
    now = datetime.utcnow()
    ended = Interview(
        user_id=user.id,
        title="Ended interview",
        scheduled_at=now - timedelta(hours=3),
        duration_minutes=60,
        status="scheduled",
    )
    still_running = Interview(
        user_id=user.id,
        title="Still running",
        scheduled_at=now - timedelta(minutes=30),
        duration_minutes=120,
        status="in_progress",
    )
    db.session.add_all([ended, still_running])
    db.session.commit()

    assert update_expired_interviews(limit=10) == 1
    db.session.expire_all()
    assert db.session.get(Interview, ended.id).status == "completed"
    assert db.session.get(Interview, still_running.id).status == "in_progress"

    # Idempotent: running again does not count the same row twice.
    assert update_expired_interviews(limit=10) == 0


def test_retention_cleanup_deletes_only_old_consumed_or_expired_otps(
    app, make_user
):
    from backend.models import EmailOtp

    user = make_user(email="otp-retention@example.com")
    now = datetime.utcnow()
    old_consumed = EmailOtp(
        user_id=user.id,
        purpose="verify_email",
        code_hash="h1",
        expires_at=now - timedelta(days=2),
        consumed_at=now - timedelta(days=2),
        created_at=now - timedelta(days=2),
    )
    old_expired = EmailOtp(
        user_id=user.id,
        purpose="verify_email",
        code_hash="h2",
        expires_at=now - timedelta(days=2),
        consumed_at=None,
        created_at=now - timedelta(days=2),
    )
    fresh = EmailOtp(
        user_id=user.id,
        purpose="verify_email",
        code_hash="h3",
        expires_at=now + timedelta(minutes=10),
        consumed_at=None,
        created_at=now,
    )
    db.session.add_all([old_consumed, old_expired, fresh])
    db.session.commit()

    result = run_job(app, "retention_cleanup")
    assert result["status"] == "success"
    assert result["rows_updated"] == 2

    remaining = {row.code_hash for row in EmailOtp.query.all()}
    assert remaining == {"h3"}


def test_run_job_records_success_error_and_rows(app):
    success = run_job(
        app,
        "unit_test_success",
        lambda: {"rows_updated": 7, "detail": "unit"},
    )
    assert success["status"] == "success"
    assert success["rows_updated"] == 7

    def fail():
        raise RuntimeError("unit failure")

    failed = run_job(app, "unit_test_failure", fail)
    assert failed["status"] == "error"
    assert "unit failure" in failed["error"]

    rows = SchedulerRun.query.filter(
        SchedulerRun.job_name.in_(["unit_test_success", "unit_test_failure"])
    ).all()
    assert {row.status for row in rows} == {"success", "error"}
    assert all(row.finished_at is not None for row in rows)


def test_advisory_lock_prevents_a_second_worker_from_running_the_same_job():
    with job_lock("unit_test_lock") as first:
        assert first is True
        with job_lock("unit_test_lock") as second:
            assert second is False


def test_scheduler_health_is_stale_when_any_job_misses_its_window(app):
    now = datetime.utcnow()
    for job_name in JOB_DEFINITIONS:
        db.session.add(
            SchedulerRun(
                job_name=job_name,
                status="success",
                started_at=now,
                finished_at=now,
                rows_updated=0,
            )
        )
    db.session.commit()

    assert scheduler_health(app, now=now)["healthy"] is True

    stale = SchedulerRun.query.filter_by(
        job_name="expired_interviews", status="success"
    ).one()
    stale.finished_at = now - timedelta(days=1)
    db.session.commit()

    assert scheduler_health(app, now=now)["healthy"] is False

"""Dedicated scheduler worker.

The web process must never own the schedule: with more than one API worker a
per-process APScheduler would run every job N times, and a redeploy silently
resets every timer. ``backend.worker`` runs this module as a singleton service;
``pg_try_advisory_lock`` is a second safety net if someone accidentally starts
two workers.

Each job writes a ``scheduler_runs`` row, so ``/api/health/scheduler`` can fail
when a job has not completed for two of its intervals (a dead worker, not just a
slow request).
"""

from contextlib import contextmanager
from datetime import datetime
import hashlib
import logging
import os
import socket

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import text

from .constants import TRIAL_PERIOD_DAYS  # noqa: F401 — re-exported for callers
from .extensions import db
from .models import SchedulerRun

logger = logging.getLogger(__name__)


def _job_expired_interviews():
    from .utils.interview_utils import update_expired_interviews

    updated = update_expired_interviews(limit=1000)
    return {"rows_updated": updated, "detail": "expired interviews"}


def _job_trial_expiration():
    from .utils.subscription import SubscriptionManager

    counts = SubscriptionManager.check_trial_expiration(batch_size=1000, max_batches=100)
    return {
        "rows_updated": counts["users"] + counts["organizations"],
        "detail": f"users={counts['users']} organizations={counts['organizations']}",
    }


def _job_account_purge():
    from .utils.account_deletion import purge_due_accounts

    purged = purge_due_accounts(batch_size=25)
    return {"rows_updated": purged, "detail": "accounts purged"}


def _job_ai_usage_report():
    from .utils.ai_budget import daily_usage_report

    report = daily_usage_report()
    return {"rows_updated": report.get("accounts", 0), "detail": str(report)}


def _job_mentorship_nudges(app):
    from .mentorship.nudges import send_stale_plan_nudges

    summary = send_stale_plan_nudges(app=app, limit=500)
    return {"rows_updated": summary.get("created", 0), "detail": str(summary)}


# (id, interval seconds, callable). The interval is used both by APScheduler and
# by the health endpoint; keeping them together prevents drift.
JOB_DEFINITIONS = {
    "expired_interviews": (300, _job_expired_interviews),
    "trial_expiration": (3600, _job_trial_expiration),
    "account_purge": (3600, _job_account_purge),
    "ai_usage_report": (86400, _job_ai_usage_report),
    "mentorship_nudges": (21600, _job_mentorship_nudges),
}


def _advisory_key(job_name: str) -> int:
    digest = hashlib.sha256(job_name.encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "big") & 0x7FFFFFFFFFFFFFFF


@contextmanager
def job_lock(job_name: str):
    """Cross-process lock. Yields True if this process may run the job."""
    if db.engine.dialect.name != "postgresql":
        yield True
        return

    connection = db.engine.connect()
    key = _advisory_key(job_name)
    acquired = False
    try:
        acquired = bool(
            connection.execute(
                text("SELECT pg_try_advisory_lock(:key)"), {"key": key}
            ).scalar()
        )
        if not acquired:
            yield False
            return
        try:
            yield True
        finally:
            connection.execute(text("SELECT pg_advisory_unlock(:key)"), {"key": key})
            connection.commit()
    finally:
        connection.close()


def run_job(app, job_name: str, job_callable=None):
    """Run one job with an app context, a lock, and a run record."""
    if job_callable is None:
        definition = JOB_DEFINITIONS.get(job_name)
        if not definition:
            raise KeyError(f"unknown scheduler job: {job_name}")
        job_callable = definition[1]

    with app.app_context():
        with job_lock(job_name) as acquired:
            if not acquired:
                logger.info("scheduler job %s already running elsewhere", job_name)
                return {"status": "skipped", "rows_updated": 0}

            run = SchedulerRun(
                job_name=job_name,
                status="running",
                started_at=datetime.utcnow(),
                worker=socket.gethostname()[:255],
            )
            db.session.add(run)
            db.session.commit()

            try:
                if job_name == "mentorship_nudges":
                    result = job_callable(app)
                else:
                    result = job_callable()
                if not isinstance(result, dict):
                    result = {"rows_updated": int(result or 0)}
                run.status = "success"
                run.rows_updated = int(result.get("rows_updated", 0) or 0)
                run.detail = result.get("detail")
            except Exception as exc:  # noqa: BLE001 — one bad job must not kill the worker
                db.session.rollback()
                run.status = "error"
                run.error = str(exc)[:4000]
                logger.exception("scheduler job %s failed", job_name)
            finally:
                run.finished_at = datetime.utcnow()
                try:
                    db.session.add(run)
                    db.session.commit()
                except Exception:
                    db.session.rollback()
                    logger.exception("could not persist scheduler run for %s", job_name)

            return {
                "status": run.status,
                "rows_updated": run.rows_updated or 0,
                "error": run.error,
            }


def build_scheduler(app, blocking: bool = False):
    """Create the APScheduler instance and register every job.

    ``blocking=True`` is used by ``python -m backend.worker``. Tests use the
    default background scheduler and never start it.
    """
    scheduler = BlockingScheduler() if blocking else BackgroundScheduler()
    for job_id, (seconds, callable_) in JOB_DEFINITIONS.items():
        scheduler.add_job(
            func=run_job,
            args=(app, job_id, callable_),
            trigger=IntervalTrigger(seconds=seconds),
            id=job_id,
            name=job_id,
            replace_existing=True,
            max_instances=1,
            coalesce=True,
            misfire_grace_time=max(60, min(seconds, 900)),
        )
    return scheduler


def init_scheduler(app):
    """Backwards-compatible helper for code that expects a started scheduler.

    New code should use ``build_scheduler`` from ``backend.worker``. This helper
    is intentionally not called by ``create_app``: starting a scheduler in the
    web process is the bug this module exists to remove.
    """
    scheduler = build_scheduler(app, blocking=False)
    scheduler.start()
    return scheduler


def scheduler_health(app, now=None):
    """Return per-job freshness for the health endpoint."""
    now = now or datetime.utcnow()
    health = {}
    healthy = True
    with app.app_context():
        for job_id, (seconds, _) in JOB_DEFINITIONS.items():
            last = (
                SchedulerRun.query
                .filter_by(job_name=job_id, status="success")
                .order_by(SchedulerRun.finished_at.desc())
                .first()
            )
            if last is None or last.finished_at is None:
                age = None
                stale = True
            else:
                age = (now - last.finished_at).total_seconds()
                # Two missed intervals, with a small grace period.
                stale = age > (seconds * 2) + 120
            healthy = healthy and not stale
            health[job_id] = {
                "last_success": last.finished_at.isoformat() + "Z" if last and last.finished_at else None,
                "age_seconds": int(age) if age is not None else None,
                "interval_seconds": seconds,
                "stale": stale,
            }
    return {"healthy": healthy, "jobs": health, "checked_at": now.isoformat() + "Z"}

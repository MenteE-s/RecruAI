"""Stale-plan nudges.

Writes a Notification for every active plan nobody has touched in a while.

**This is not wired to the scheduler.** `init_scheduler` is commented out in
app.py ("temporarily disabled to debug API issues"), so a job registered there
would never fire — and re-enabling it revives two unrelated jobs
(`update_expired_interviews`, `check_trial_expiration`) as a side effect, which
is not a decision this change should make for anyone. `register_nudge_job` is
written and tested so that re-enabling the scheduler is a one-line change, and
`send_stale_plan_nudges` can be called by hand or from a management command.

Nudges are rate limited by construction: a plan is only nudged when its last
activity is older than the idle window, and one notification per plan per
window is recorded by looking for an existing unread nudge of the same type.
"""
from datetime import datetime, timedelta
from typing import Dict, List

from ..extensions import db
from ..models import MentorshipPlan, Notification
from ..utils import mentorship_suggestions as S

NUDGE_TYPE = "mentorship_plan_idle"
# Do not repeat a nudge more often than this even if detection keeps matching.
NUDGE_COOLDOWN_DAYS = S.IDLE_DAYS


def send_stale_plan_nudges(app=None, idle_days: int = S.IDLE_DAYS,
                          now: datetime = None, dry_run: bool = False) -> Dict:
    """Notify learners with idle plans. Returns a summary for logging."""
    now = now or datetime.utcnow()
    plans = (MentorshipPlan.query
             .filter_by(status="active")
             .order_by(MentorshipPlan.id.asc())
             .all())
    payloads = [p.to_dict() for p in plans]

    stale = S.stale_plans(payloads, now=now, idle_days=idle_days)
    created, skipped_recent, skipped_unread = [], [], []

    for entry in stale:
        plan = db.session.get(MentorshipPlan, entry["plan"].get("id"))
        if plan is None:
            continue
        nudge = S.nudge_for(entry)

        # One nudge per plan per cooldown window, and never while an unread
        # nudge for the same plan is still sitting there.
        cutoff = now - timedelta(days=NUDGE_COOLDOWN_DAYS)
        existing = (Notification.query
                    .filter_by(user_id=plan.user_id, type=NUDGE_TYPE)
                    .filter(Notification.created_at >= cutoff)
                    .order_by(Notification.created_at.desc())
                    .all())
        same_plan = [n for n in existing
                     if getattr(n, "related_mentorship_plan_id", None) == plan.id]
        if same_plan:
            skipped_recent.append(plan.id)
            continue
        unread = [n for n in same_plan if not n.is_read]
        if unread:
            skipped_unread.append(plan.id)
            continue

        created.append({"plan_id": plan.id, "user_id": plan.user_id})
        if dry_run:
            continue

        note = Notification(
            user_id=plan.user_id,
            type=NUDGE_TYPE,
            title=nudge["title"][:200],
            message=nudge["message"],
            related_mentorship_plan_id=plan.id,
        )
        db.session.add(note)

    if not dry_run and created:
        db.session.commit()
    elif dry_run:
        db.session.rollback()

    summary = {
        "checked": len(payloads),
        "stale": len(stale),
        "created": len(created),
        "skipped_recent_nudge": skipped_recent,
        "skipped_unread_nudge": skipped_unread,
        "dry_run": dry_run,
        "at": now.isoformat() + "Z",
    }
    if created and not dry_run:
        from ..utils.kafka_service import kafka_service
        try:
            kafka_service.emit_event("mentorship_plan_idle", {"count": len(created)})
        except Exception as e:  # noqa: BLE001 — a nudge failing to broadcast is not fatal
            print(f"Failed to emit mentorship nudge event: {e}")
    return summary


def register_nudge_job(scheduler, app) -> None:
    """Register the hourly nudge job.

    Dormant: init_scheduler is not called from app.py right now. Kept here so
    re-enabling the scheduler is deliberate and this is not forgotten.
    """
    scheduler.add_job(
        func=send_stale_plan_nudges,
        args=(app,),
        trigger="interval",
        hours=6,
        id="mentorship_stale_plan_nudges",
        replace_existing=True,
        max_instances=1,
    )


__all__ = ["NUDGE_TYPE", "register_nudge_job", "send_stale_plan_nudges"]
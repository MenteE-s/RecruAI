"""Stale-plan nudges.

Writes a Notification for every active plan nobody has touched in a while.

``backend.worker`` registers this as a bounded hourly job through
``backend.scheduler``. Each invocation processes at most ``limit`` plans, so a
large backlog cannot turn one run into a million-row object graph.

Nudges are rate limited by construction: a plan is only nudged when its last
activity is older than the idle window, and one notification per plan per
window is recorded by looking for an existing unread nudge of the same type.
"""
from datetime import datetime, timedelta
import logging
from typing import Dict, List

from sqlalchemy import func
from sqlalchemy.orm import selectinload

from ..extensions import db
from ..models import MentorshipPlan, Notification
from ..utils import mentorship_suggestions as S

logger = logging.getLogger(__name__)

NUDGE_TYPE = "mentorship_plan_idle"
# Do not repeat a nudge more often than this even if detection keeps matching.
NUDGE_COOLDOWN_DAYS = S.IDLE_DAYS


def send_stale_plan_nudges(app=None, idle_days: int = S.IDLE_DAYS,
                          now: datetime = None, dry_run: bool = False,
                          limit: int = 500) -> Dict:
    """Notify learners with idle plans. Returns a summary for logging.

    ``limit`` bounds one invocation. The worker runs this every six hours, so a
    large backlog drains over successive runs instead of loading every active
    plan and every step into memory at once.
    """
    now = now or datetime.utcnow()
    cutoff = now - timedelta(days=idle_days)
    plans = (MentorshipPlan.query
             .options(selectinload(MentorshipPlan.steps))
             .filter(
                 MentorshipPlan.status == "active",
                 func.coalesce(
                     MentorshipPlan.updated_at,
                     MentorshipPlan.created_at,
                 ) <= cutoff,
             )
             .order_by(func.coalesce(
                 MentorshipPlan.updated_at,
                 MentorshipPlan.created_at,
             ).asc())
             .limit(max(1, min(int(limit or 500), 5000)))
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
            logger.warning("failed to emit mentorship nudge event: %s", e)
    return summary


def register_nudge_job(scheduler, app) -> None:
    """Compatibility helper for an externally-owned APScheduler.

    ``backend.scheduler.build_scheduler`` registers this job itself; this
    function remains for deployments that still pass their own scheduler.
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
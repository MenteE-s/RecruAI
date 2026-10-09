"""Progress tracking: how the learner is actually doing against the plan.

B2 is mostly turning two things that already exist into an answer. Plans know
what they asked for; attempts know what the learner has since measured. This
module compares them.

All of it is pure arithmetic over plain dicts — no database, no Flask — so the
interesting cases (zero elapsed time, a plan finished on day one, a skill
retaken and improved) can be tested directly rather than by arranging fixtures.

Two deliberate choices:

  * **On-track is generous by default.** A learner a few days behind a plan that
    was measured weekly has not failed; the tolerance exists because day 3 of a
    four-week plan legitimately looks like 0% done against 25% elapsed.

  * **"Falling behind" never deletes or rewrites anything.** It is a reading for
    the UI to explain, because the useful response to behind-schedule is
    usually to renegotiate the plan rather than to be told off.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from .skill_taxonomy import level_rank, normalize_level

# Percentage points of slack before a plan counts as behind. Matches the
# granularity the plan is built at: steps are estimated in days, not hours.
ON_TRACK_TOLERANCE_POINTS = 15

# Behind by more than this and the plan is reported as off-track rather than
# merely behind, so the UI can escalate its language.
SIGNIFICANTLY_BEHIND_POINTS = 40


def _hours(step: Dict) -> int:
    try:
        return max(0, int(step.get("hours_estimate") or 0))
    except (TypeError, ValueError):
        return 0


def plan_progress(plan: Dict, now: Optional[datetime] = None) -> Dict:
    """Plan versus actual: completion, pace, projected finish, verdict.

    `plan` is a dict shaped like MentorshipPlan.to_dict() — steps included.
    Skipped steps are excluded from the denominator: a learner who marked three
    steps skipped has not failed them, and counting them as incomplete would
    report 0% forever on a plan they deliberately narrowed.
    """
    now = now or datetime.utcnow()
    steps = list(plan.get("steps") or [])
    actionable = [s for s in steps if s.get("status") != "skipped"]
    skipped = [s for s in steps if s.get("status") == "skipped"]
    done = [s for s in actionable if s.get("status") == "done"]
    in_progress = [s for s in actionable if s.get("status") == "in_progress"]

    total = len(actionable)
    hours_planned = sum(_hours(s) for s in actionable)
    hours_done = sum(_hours(s) for s in done)
    hours_remaining = max(0, hours_planned - hours_done)

    pct_complete = round(len(done) / total * 100) if total else 100

    created = parse_iso(plan.get("created_at"))
    elapsed_days = max(0, (now - created).days) if created else 0

    planned_days = _planned_days(plan, actionable, created)
    expected_pct = min(100, round(elapsed_days / planned_days * 100)) if planned_days > 0 else 0

    gap_points = expected_pct - pct_complete
    if plan.get("status") == "completed" or (total and len(done) == total):
        verdict = "done"
    elif total == 0:
        verdict = "not_started"
    elif done or in_progress:
        verdict = "on_track" if gap_points <= ON_TRACK_TOLERANCE_POINTS else (
            "behind" if gap_points <= SIGNIFICANTLY_BEHIND_POINTS else "off_track")
    else:
        # Nothing started yet: only call it behind if the plan is genuinely old.
        verdict = "not_started" if elapsed_days <= planned_days / 2 else "behind"

    return {
        "plan_id": plan.get("id"),
        "status": plan.get("status"),
        "step_count": total,
        "done_count": len(done),
        "in_progress_count": len(in_progress),
        "skipped_count": len(skipped),
        "pct_complete": pct_complete,
        "hours_planned": hours_planned,
        "hours_done": hours_done,
        "hours_remaining": hours_remaining,
        "elapsed_days": elapsed_days,
        "planned_days": planned_days,
        "expected_pct": expected_pct,
        "gap_points": gap_points,
        "verdict": verdict,
        "projected_completion": _projected_completion(
            hours_remaining, plan.get("weekly_hours"), now),
    }


def parse_iso(value) -> Optional[datetime]:
    """Parse the ISO strings utc_iso() produces, tolerating a trailing Z."""
    if isinstance(value, datetime):
        return value
    if not value:
        return None
    text = str(value).replace("Z", "").split(".")[0].split("+")[0]
    try:
        return datetime.strptime(text, "%Y-%m-%dT%H:%M:%S")
    except ValueError:
        return None


def _planned_days(plan: Dict, actionable: List[Dict], created: Optional[datetime]) -> int:
    """How long the plan said it would take.

    Prefers the last step's target date, since that is what the learner was
    actually shown. Falls back to weeks * 7, then to nothing rather than
    pretending a plan with no dates has a horizon.
    """
    dates = [parse_iso(s.get("target_date")) for s in actionable]
    dates = [d for d in dates if d]
    if created and dates:
        horizon = max(dates) - created
        if horizon.days > 0:
            return horizon.days
    weeks = plan.get("weeks")
    try:
        weeks = int(weeks) if weeks else 0
    except (TypeError, ValueError):
        weeks = 0
    return weeks * 7 if weeks > 0 else 0


def _projected_completion(hours_remaining: int, weekly_hours, now: datetime):
    """Finish date if the learner keeps their stated weekly hours.

    None when there is no weekly rate, or nothing left to do — a plan with no
    horizon should not show a date invented from zero.
    """
    try:
        per_week = int(weekly_hours or 0)
    except (TypeError, ValueError):
        per_week = 0
    if per_week <= 0 or hours_remaining <= 0:
        return None
    weeks = -(-hours_remaining // per_week)
    return (now + timedelta(weeks=weeks)).isoformat() + "Z"


def skill_level_history(attempts: List[Dict], limit: int = 50) -> Dict:
    """Per-skill level trend from completed attempts — the "re-measure over
    time" half of progress tracking.

    Only completed attempts with a level and a skill count. The trend compares
    first to last, deliberately: comparing the two most recent would call a
    single bad afternoon a decline.
    """
    series: Dict[str, List[Dict]] = {}
    for attempt in attempts or []:
        if attempt.get("status") != "completed":
            continue
        slug = attempt.get("skill_slug")
        level = normalize_level(attempt.get("level_awarded"))
        if not slug or not level:
            continue
        series.setdefault(slug, []).append({
            "assessment_id": attempt.get("id"),
            "date": attempt.get("completed_at"),
            "level": level,
            "level_rank": level_rank(level),
            "score_percent": attempt.get("score_percent"),
        })

    out = {}
    for slug, points in series.items():
        points.sort(key=lambda p: (p["date"] or "", p["assessment_id"] or 0))
        points = points[-limit:]
        first_rank = points[0]["level_rank"]
        last_rank = points[-1]["level_rank"]
        if len(points) < 2:
            trend = "single"
        elif last_rank > first_rank:
            trend = "improving"
        elif last_rank < first_rank:
            trend = "declining"
        else:
            trend = "flat"
        out[slug] = {
            "slug": slug,
            "attempts": len(points),
            "first_level": points[0]["level"],
            "latest_level": points[-1]["level"],
            "latest_score_percent": points[-1]["score_percent"],
            "trend": trend,
            "points": points,
        }
    return out


def learner_progress(plans: List[Dict], history: Dict, now: Optional[datetime] = None) -> Dict:
    """The cross-plan view: am I getting anywhere, and are my skills moving?"""
    now = now or datetime.utcnow()
    per_plan = [plan_progress(p, now) for p in plans or []]
    active = [p for p in per_plan if p["status"] != "completed"]

    actionable = sum(p["step_count"] for p in active)
    done = sum(p["done_count"] for p in active)

    improving = [s for s in history.values() if s["trend"] == "improving"]
    declining = [s for s in history.values() if s["trend"] == "declining"]

    return {
        "active_plan_count": len(active),
        "completed_plan_count": sum(1 for p in per_plan if p["status"] == "completed"),
        "total_steps": actionable,
        "done_steps": done,
        "overall_pct": round(done / actionable * 100) if actionable else 0,
        "behind_count": sum(1 for p in active if p["verdict"] in ("behind", "off_track")),
        "plans": per_plan,
        "skills_assessed": len(history),
        "skills_improving": sorted(s["slug"] for s in improving),
        "skills_declining": sorted(s["slug"] for s in declining),
        "skills_unverified": sorted(
            slug for slug, entry in history.items() if entry["attempts"] < 2),
    }


__all__ = [
    "ON_TRACK_TOLERANCE_POINTS",
    "learner_progress",
    "plan_progress",
    "skill_level_history",
]
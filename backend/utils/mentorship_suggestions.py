"""Suggestions: what should this learner do next, and why.

B3 is deliberately **not** a model call. A suggestion the learner acts on has to
be explainable — "do this because you are 30 points behind on the plan you
started" is actionable, and "based on your recent activity, consider..." is not.
Anything that needs a model's judgement is already handled by plan generation
(B1); this module only ranks what is already known.

Every suggestion carries a `reason` naming the evidence behind it (B3.3). A
suggestion that cannot cite why is not emitted.

Priority bands, highest first:
  urgent    behind schedule, or a skill that measurably declined
  high      a plan exists and its next step is due
  normal    a gap with no plan covering it, or a skill measured only once
  low       nothing to do, or a baseline is missing entirely
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# A plan with no step progress for this long is "idle". Seven days is a week,
# which is the granularity plans are built at — nudging sooner would be nagging.
IDLE_DAYS = 7

PRIORITY_ORDER = {"urgent": 0, "high": 1, "normal": 2, "low": 3}


def _parse(value) -> Optional[datetime]:
    from .mentorship_progress import parse_iso
    return parse_iso(value)


def _step_payload(plan: Dict) -> List[Dict]:
    return list(plan.get("steps") or [])


def next_action_for_plan(plan: Dict, progress: Dict, now: datetime) -> Optional[Dict]:
    """The single most useful thing to do about one plan, with its reason."""
    steps = _step_payload(plan)
    actionable = [s for s in steps if s.get("status") != "skipped"]
    done = [s for s in actionable if s.get("status") == "done"]
    plan_id = plan.get("id")
    goal = plan.get("goal") or "your goal"

    # A finished plan is not a candidate for a next action.
    if progress.get("verdict") == "done" or plan.get("status") in ("completed", "abandoned"):
        return None

    verdict = progress.get("verdict")

    # 1. Behind schedule: the useful advice is to renegotiate, not to keep
    #    pretending the plan fits. Suggesting "try harder" would be useless.
    if verdict in ("behind", "off_track") and done:
        idle = (now - _parse(plan.get("updated_at"))).days if _parse(plan.get("updated_at")) else 0
        return {
            "kind": "renegotiate_plan",
            "priority": "urgent",
            "title": f"Your plan for {goal} is behind schedule",
            "reason": (f"In your plan for {goal} you are "
                       f"{progress.get('gap_points')} percentage points behind the pace "
                       f"({progress.get('pct_complete')}% done against "
                       f"{progress.get('expected_pct')}% of the time elapsed), and "
                       f"{progress.get('hours_remaining')} hours of work remain."),
            "action": {"type": "review_plan", "plan_id": plan_id},
            "evidence": {"verdict": verdict, "gap_points": progress.get("gap_points"),
                         "days_since_update": idle},
        }

    # 2. A step is due or overdue — the most concrete action available.
    pending = [s for s in actionable if s.get("status") in ("pending", "in_progress")]
    if pending:
        # Next by target date: an overdue step outranks an upcoming one.
        def due_key(s):
            d = _parse(s.get("target_date"))
            return d if d else datetime(2099, 1, 1)
        nxt = sorted(pending, key=due_key)[0]
        due = _parse(nxt.get("target_date"))
        overdue = bool(due and due < now)
        return {
            "kind": "complete_step",
            "priority": "high" if overdue else "normal",
            "title": ("Overdue: " if overdue else "Next up: ") + nxt.get("title", "a plan step"),
            "reason": (f"Step {pending.index(nxt) + 1} of {len(actionable)} in your plan for "
                       f"{goal}, about {nxt.get('hours_estimate')}h"
                       + (f", was due {nxt.get('target_date')}" if overdue else "")
                       + (f", due {nxt.get('target_date')}" if not overdue and nxt.get('target_date') else "")
                       + "."),
            "action": {"type": "complete_step", "plan_id": plan_id, "step_id": nxt.get("id")},
            "evidence": {"step_id": nxt.get("id"), "overdue": overdue,
                         "target_date": nxt.get("target_date")},
        }

    # 3. Every actionable step is done but the plan is still open. Reachable:
    #    the route auto-completes a plan, but a learner can move a done step
    #    back to pending afterwards, which reopens the work without reopening
    #    the plan. Asking them to close it is the useful suggestion.
    if actionable and not pending and len(done) == len(actionable):
        return {
            "kind": "finish_plan",
            "priority": "low",
            "title": f"Your plan for {goal} is finished but still open",
            "reason": (f"All {len(actionable)} remaining step(s) in your plan for {goal} are "
                       "done. Close it to keep your progress history tidy, or reopen it if "
                       "you want to keep working on it."),
            "action": {"type": "close_plan", "plan_id": plan_id},
            "evidence": {"done_count": len(done), "step_count": len(actionable)},
        }
    return None


def skill_suggestions(history: Dict, planned_slugs: List[str]) -> List[Dict]:
    """Suggestions derived from what assessments have (and have not) measured."""
    out: List[Dict] = []
    planned = set(planned_slugs or [])

    # A skill that measurably regressed is the most valuable thing to surface.
    for slug, entry in sorted((history or {}).items()):
        if entry.get("trend") == "declining":
            out.append({
                "kind": "revisit_declining_skill",
                "priority": "urgent",
                "title": f"Your {slug} score went down",
                "reason": (f"You went from {entry.get('first_level')} to "
                           f"{entry.get('latest_level')} across {entry.get('attempts')} "
                           f"assessments, most recently scoring "
                           f"{entry.get('latest_score_percent')}%."),
                "action": {"type": "retake_assessment", "skill_slug": slug},
                "evidence": {"slug": slug, "trend": "declining",
                             "from": entry.get("first_level"), "to": entry.get("latest_level")},
            })

    # Measured once: we know a number but not whether it holds.
    for slug, entry in sorted((history or {}).items()):
        if entry.get("attempts") == 1 and slug not in planned:
            out.append({
                "kind": "confirm_skill_level",
                "priority": "normal",
                "title": f"Confirm your {slug} level",
                "reason": (f"You have one {entry.get('latest_level')} assessment for {slug}. "
                           "A second, later attempt shows whether that is stable or a "
                           "one-off, which is what employers rely on."),
                "action": {"type": "retake_assessment", "skill_slug": slug},
                "evidence": {"slug": slug, "attempts": 1},
            })
    return out


def build_suggestions(plans: List[Dict], progresses: Dict, history: Dict,
                      now: Optional[datetime] = None,
                      idle_days: int = IDLE_DAYS) -> List[Dict]:
    """The ranked list, one entry per plan plus skill-level suggestions."""
    now = now or datetime.utcnow()
    out: List[Dict] = []

    planned_slugs = []
    for plan in plans or []:
        for slug in (plan.get("target_skills") or []):
            if slug not in planned_slugs:
                planned_slugs.append(slug)
        progress = (progresses or {}).get(plan.get("id")) or {}
        suggestion = next_action_for_plan(plan, progress, now)
        if suggestion:
            out.append(suggestion)

    out.extend(skill_suggestions(history, planned_slugs))

    # A learner with nothing at all still needs a first move, or CVAI looks dead.
    if not out:
        if not history:
            out.append({
                "kind": "take_first_assessment",
                "priority": "normal",
                "title": "Establish a baseline",
                "reason": ("Nothing has been measured yet. Without an assessment there is "
                           "no evidence behind your profile, so a plan could only guess "
                           "where to start."),
                "action": {"type": "start_assessment"},
                "evidence": {},
            })
        else:
            out.append({
                "kind": "nothing_to_do",
                "priority": "low",
                "title": "You are on top of things",
                "reason": "No overdue steps, no unmeasured skills and no regressions.",
                "action": {"type": "none"},
                "evidence": {},
            })

    out.sort(key=lambda s: (PRIORITY_ORDER.get(s["priority"], 9), s["title"]))
    return out


def stale_plans(plans: List[Dict], now: Optional[datetime] = None,
                idle_days: int = IDLE_DAYS) -> List[Dict]:
    """Active plans nobody has touched in a while — the nudge candidates.

    Measured from the last step change, falling back to the last plan update and
    then creation, so a plan created and never touched does not count as idle
    from the moment it was made.
    """
    now = now or datetime.utcnow()
    out = []
    for plan in plans or []:
        if plan.get("status") not in (None, "active"):
            continue
        actionable = [s for s in _step_payload(plan) if s.get("status") != "skipped"]
        if actionable and all(s.get("status") in ("done", "skipped") for s in actionable):
            continue

        stamps = [s.get("completed_at") for s in _step_payload(plan) if s.get("completed_at")]
        stamps += [s.get("updated_at") for s in _step_payload(plan) if s.get("updated_at")]
        stamps += [plan.get("updated_at"), plan.get("created_at")]
        parsed = [d for d in (_parse(s) for s in stamps if s) if d]
        if not parsed:
            continue
        last = max(parsed)
        idle = (now - last).days
        if idle >= idle_days:
            out.append({"plan": plan, "idle_days": idle, "last_activity": last.isoformat() + "Z"})
    return out


def nudge_for(stale: Dict) -> Dict:
    """The title/message pair for a stale-plan notification."""
    plan = stale["plan"]
    goal = plan.get("goal") or "your goal"
    idle = stale["idle_days"]
    remaining = sum(1 for s in _step_payload(plan)
                    if s.get("status") not in ("done", "skipped", None))
    return {
        "type": "mentorship_plan_idle",
        "title": f"Your plan for {goal} is waiting on you",
        "message": (f"No progress for {idle} days"
                    + (f", with {remaining} step(s) still to do" if remaining else "")
                    + ". Pick the next step, change the plan, or close it — "
                      "reopening a finished plan is fine, it is just noise."),
        "related_mentorship_plan_id": plan.get("id"),
    }


__all__ = [
    "IDLE_DAYS",
    "build_suggestions",
    "next_action_for_plan",
    "nudge_for",
    "skill_suggestions",
    "stale_plans",
]
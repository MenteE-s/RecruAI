"""Mentorship planning: from a measured gap to a plan that fits real budgets.

Split deliberately in two:

  * **Gap detection** is arithmetic over the taxonomy (`skill_gap`). The target
    is either a saved posting's requirements or, failing that, skills the model
    proposed that were then filtered to catalogued ones. An uncatalogued skill
    cannot be planned for, so it is dropped rather than invented.

  * **Resource selection** is the model's job, because naming a course is a
    judgement call. But the model proposes and the server disposes: every
    proposed step is validated against the gap, and every number is clamped
    before it reaches a total.

The rule that matters: **the model never does arithmetic.** Hours and costs are
clamped, then summed, and budget enforcement happens here in Python. A model
that claims "12 hours, 3 steps" cannot make a plan that does not fit.

Resource URLs are left empty on purpose. There is no course catalogue yet
(Track C), so a model-invented URL is a dead link at best and a phishing
destination at worst. Steps name their resource; linking comes when there is
something real to link to.
"""
import json
import re
from typing import Dict, List, Optional, Tuple

from .skill_taxonomy import LEVELS, normalize_level, resolve

# Bounds for model-proposed numbers. Wide enough to allow a real 40-hour
# project, tight enough that one hallucinated figure cannot wreck the totals.
MAX_STEP_HOURS = 80
MIN_STEP_HOURS = 1
MAX_STEP_COST = 2000
MAX_STEPS = 24

VALID_RESOURCE_TYPES = ("course", "article", "project", "practice", "assessment")
VALID_STEP_STATUSES = ("pending", "in_progress", "done", "skipped")


def clamp_int(value, minimum: int, maximum: int, default: int) -> int:
    """Coerce anything (str, float, None, nonsense) into a sane integer."""
    try:
        number = int(round(float(value)))
    except (TypeError, ValueError):
        return default
    return max(minimum, min(maximum, number))


def compute_target_skills(user_skills, requirements) -> Dict:
    """What the learner has vs what the goal asks for.

    `requirements` are free-text (a posting's requirement list). Everything the
    taxonomy could not classify is reported as unknown rather than quietly
    dropped, because a plan that silently ignores half a job's requirements is
    worse than one that says which half it did not understand.
    """
    from .skill_gap import compute_gap

    gap = compute_gap(skills=user_skills, technologies=[], requirements=requirements)

    current = {}
    for entry in gap["candidate_skills"]:
        current[entry["slug"]] = {
            "level": entry["level"],
            "level_rank": entry["level_rank"],
            "verified": any(s != "profile_text" for s in entry["sources"]),
        }

    target = []
    for item in gap["matched_skills"]:
        target.append({
            "slug": item["slug"],
            "name": item["name"],
            "needed_level": item["required_level"] or "Beginner",
            "state": "held",
        })
    for item in gap["level_gaps"]:
        target.append({
            "slug": item["slug"],
            "name": item["name"],
            "needed_level": item["required_level"],
            "have_level": item["held_level"],
            "state": "level_gap",
        })
    for item in gap["missing_skills"]:
        target.append({
            "slug": item["slug"],
            "name": item["name"],
            "needed_level": item["required_level"] or "Beginner",
            "state": "missing",
        })

    return {
        "current": current,
        "target": target,
        "unclassified_requirements": gap["unclassified_requirements"],
        "match_ratio": gap["skill_match_ratio"],
    }


def select_targets_from_text(target_text: str, allowed_slugs: List[str]) -> List[str]:
    """Filter model-proposed target skills down to catalogued, in-scope ones.

    The model is asked for skills; only skills that are both in the taxonomy and
    actually requested by the goal survive. Everything else is discarded,
    because a plan built on "Kubernetes" when the goal said "data analysis" is
    confidently wrong, which is the worst failure mode available here.
    """
    if not target_text:
        return []
    try:
        parsed = json.loads(target_text)
    except (json.JSONDecodeError, TypeError):
        return []
    if not isinstance(parsed, list):
        return []

    allowed = set(allowed_slugs or [])
    out, seen = [], set()
    for item in parsed:
        if isinstance(item, str):
            item = {"skill": item}
        if not isinstance(item, dict):
            continue
        # "skill_slug" is the key the prompt asks for; the others are accepted
        # because models drift, and a plan silently built from nothing is worse
        # than reading a couple of aliases.
        entry = resolve(
            item.get("skill_slug") or item.get("skill")
            or item.get("slug") or item.get("name") or ""
        )
        if not entry:
            continue
        if allowed and entry["slug"] not in allowed:
            continue
        if entry["slug"] in seen:
            continue
        seen.add(entry["slug"])
        out.append(entry["slug"])
    return out


def validate_proposed_steps(proposed, gaps: List[Dict]) -> List[Dict]:
    """Keep only steps that address a real, in-scope gap. Clamp every number.

    A step about a skill the goal never asked for is dropped: it is the model's
    idea, not the learner's, and letting it through inflates the totals with work
    nobody requested.
    """
    in_scope = {g["slug"]: g for g in gaps if g.get("slug")}
    if not in_scope:
        return []

    cleaned, seen_skills = [], set()
    for raw in proposed or []:
        if not isinstance(raw, dict):
            continue
        entry = resolve(raw.get("skill_slug") or raw.get("skill") or "")
        if not entry or entry["slug"] not in in_scope:
            continue
        # One step per skill keeps the plan honest: three courses for the same
        # gap is padding, and it would triple that skill's hours.
        if entry["slug"] in seen_skills:
            continue
        seen_skills.add(entry["slug"])

        title = re.sub(r"\s+", " ", (raw.get("title") or "").strip())[:200]
        if not title:
            continue
        gap = in_scope[entry["slug"]]
        rtype = (raw.get("resource_type") or "article").strip().lower()
        if rtype not in VALID_RESOURCE_TYPES:
            rtype = "article"

        cleaned.append({
            "skill_slug": entry["slug"],
            "skill_name": entry["name"],
            "title": title,
            "description": re.sub(r"\s+", " ", (raw.get("description") or "").strip())[:1000] or None,
            "target_level": gap.get("needed_level"),
            "resource_type": rtype,
            "resource_name": (re.sub(r"\s+", " ", (raw.get("resource_name") or "").strip())[:255]
                              or None),
            # No URL: nothing to vouch for until Track C has a catalogue.
            "resource_url": None,
            "hours_estimate": clamp_int(raw.get("hours_estimate"), MIN_STEP_HOURS,
                                       MAX_STEP_HOURS, 10),
            "cost": clamp_int(raw.get("cost"), 0, MAX_STEP_COST, 0),
            "optional": bool(raw.get("optional")),
        })

        if len(cleaned) >= MAX_STEPS:
            break
    return cleaned


def enforce_budget(steps: List[Dict], budget_amount: int, weekly_hours: int,
                   target_weeks: Optional[int] = None) -> Tuple[List[Dict], Dict]:
    """Fit steps inside the money budget, and report whether the time fits.

    Money enforcement drops optional steps first, dearest first, because a
    learner who said "£100" means it: the required steps stay, the nice-to-haves
    go. Time is NOT enforced destructively — over-running the hours is reported
    so the UI can say "this is 11 weeks at 5h/week, not 6" rather than quietly
    dropping work the learner needs.
    """
    kept = [dict(s) for s in steps]
    dropped = []
    spent = sum(s["cost"] for s in kept)
    budget = max(0, int(budget_amount or 0))

    if spent > budget:
        optional = sorted(
            [s for s in kept if s["optional"]],
            key=lambda s: (-s["cost"], -s["hours_estimate"]),
        )
        for step in optional:
            if spent <= budget:
                break
            spent -= step["cost"]
            dropped.append(step)
            kept.remove(step)

    total_hours = sum(s["hours_estimate"] for s in kept)
    per_week = max(1, int(weekly_hours or 1))
    weeks_needed = -(-total_hours // per_week)  # ceiling division

    trimmed = bool(dropped)
    reasons = []
    if dropped:
        reasons.append(
            f"{len(dropped)} optional step(s) removed to stay within the "
            f"{budget} budget"
        )
    if target_weeks and weeks_needed > target_weeks:
        reasons.append(
            f"needs about {weeks_needed} weeks at {per_week}h/week, longer than "
            f"the {target_weeks}-week target"
        )

    return kept, {
        "trimmed": trimmed,
        "trim_reason": "; ".join(reasons) or None,
        "dropped_count": len(dropped),
        "total_hours": total_hours,
        "total_cost": spent,
        "weeks_needed": weeks_needed,
        "within_budget": spent <= budget,
        "within_time": (not target_weeks) or weeks_needed <= target_weeks,
    }


def assign_target_dates(steps: List[Dict], weekly_hours: int,
                        start=None) -> List[Dict]:
    """Spread steps over the weeks they imply, in order.

    Dates are a projection of the hour estimates, not a promise: they assume the
    learner spends their stated hours each week, and the UI should present them
    that way.
    """
    from datetime import datetime, timedelta

    start = start or datetime.utcnow()
    per_week = max(1, int(weekly_hours or 1))
    cursor = start
    hour_carry = 0
    out = []
    for step in steps:
        hour_carry += step["hours_estimate"]
        if hour_carry >= per_week:
            weeks = hour_carry // per_week
            cursor = cursor + timedelta(weeks=weeks)
            hour_carry = hour_carry % per_week
        out.append({**step, "target_date": cursor})
    return out


def level_for_target(needed_level: Optional[str]) -> Optional[str]:
    return normalize_level(needed_level) if needed_level else None


__all__ = [
    "LEVELS",
    "VALID_STEP_STATUSES",
    "assign_target_dates",
    "clamp_int",
    "compute_target_skills",
    "enforce_budget",
    "level_for_target",
    "select_targets_from_text",
    "validate_proposed_steps",
]
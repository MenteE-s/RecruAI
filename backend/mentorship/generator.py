"""Mentorship plan generation.

The layer between "here is the user's evidence and the gap it implies" and the
deterministic planner in utils/mentorship_planner.py. Its job is narrow: ask the
model what to do, hand the answer to code that decides whether it is allowed.

Nothing here trusts the model's arithmetic. Proposed steps are filtered against
the real gap, every number is clamped, and budget enforcement happens in
planner.py. If the model returns nonsense the plan degrades to a small valid
plan or to an honest error, never to a plan with invented totals.
"""
import json
import re
from typing import Dict, List, Optional, Tuple

from ..ai_service import AIService
from ..utils import mentorship_planner as planner
from ..utils.skill_taxonomy import LEVELS, resolve

PLAN_SYSTEM_PROMPT = """You are a pragmatic career mentor. You produce learning plans.

Rules you must follow:
- Answer ONLY with a JSON object. No prose before or after it.
- Choose resources that genuinely exist and are widely used. Name them plainly
  (for example "freeCodeCamp JavaScript course", "MDN JavaScript guide").
- Never invent a URL. You will not be given a catalogue, so do not output URLs.
- Estimate hours realistically. A course is 10-40 hours; a focused article is
  1-3 hours; a portfolio project is 15-60 hours.
- Prefer free resources when they are genuinely good. If something must be paid,
  say so via the cost field, in whole units of USD.
- Address each skill you are given. Do not add skills that were not asked for.
- cost is 0 for free resources.

Output shape:
{"steps": [{"skill_slug": "<from the given list>", "title": "...",
  "description": "...", "resource_type": "course|article|project|practice|assessment",
  "resource_name": "...", "hours_estimate": 12, "cost": 0, "optional": false}]}"""

TARGET_SYSTEM_PROMPT = """You are a career advisor identifying the skills a role requires.

Answer ONLY with a JSON object, no prose.
Use ONLY the skill slugs given to you. If none of them fit the role, return {"skills": []}.
For each, include the level the role needs, from this list: Beginner, Intermediate, Advanced, Expert.

Output shape:
{"skills": [{"skill_slug": "<from the given list>", "needed_level": "Intermediate"}]}"""


def extract_json(text: str) -> Optional[Dict]:
    """Pull a JSON object out of a model response.

    Models wrap JSON in ```json fences, prepend "Here is the plan:" and append a
    sentence of commentary. None of that is a failure, so the fence is stripped
    and the outermost braces are located by counting, which survives nested
    objects and braces inside string values.
    """
    if not text:
        return None
    cleaned = text.strip()
    fenced = re.search(r"```(?:json)?\s*(.+?)\s*```", cleaned, re.DOTALL)
    if fenced:
        cleaned = fenced.group(1).strip()

    try:
        parsed = json.loads(cleaned)
        return parsed if isinstance(parsed, dict) else None
    except (json.JSONDecodeError, TypeError):
        pass

    start = cleaned.find("{")
    if start == -1:
        return None
    depth = 0
    in_string = False
    escaped = False
    for index in range(start, len(cleaned)):
        char = cleaned[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                try:
                    parsed = json.loads(cleaned[start:index + 1])
                    return parsed if isinstance(parsed, dict) else None
                except (json.JSONDecodeError, TypeError):
                    return None
    return None


def propose_targets(goal: str, catalogue_slugs: List[str], user) -> Tuple[List[str], bool]:
    """Ask the model which catalogued skills the goal implies.

    Returns (slugs, ai_ok). ai_ok is False when the call produced nothing usable,
    so the caller can say "we couldn't work out the skills" instead of silently
    planning for nothing.
    """
    if not catalogue_slugs:
        return [], False
    listing = ", ".join(sorted(catalogue_slugs))
    prompt = (
        f"Role or goal: {goal}\n\n"
        f"Available skill slugs (choose from these only): {listing}\n\n"
        "Which of these skills does this role actually require?"
    )
    try:
        response = AIService().generate_response(
            TARGET_SYSTEM_PROMPT, prompt, user=user, operation_type="cvai_target_skills"
        )
    except Exception:
        return [], False
    payload = extract_json(response)
    if not payload:
        return [], False
    return planner.select_targets_from_text(json.dumps(payload.get("skills", [])), catalogue_slugs), True


def propose_steps(gaps: List[Dict], goal: str, user,
                 budget_amount: int = 0, weekly_hours: int = 5) -> List[Dict]:
    """Ask for one step per gap, validated against the gap we actually have."""
    readable = [
        {
            "skill_slug": g["slug"],
            "skill_name": g["name"],
            "needed_level": g.get("needed_level"),
            "currently": g.get("have_level") or "none",
            "gap_type": g.get("state"),
        }
        for g in gaps if g.get("slug")
    ]
    if not readable:
        return []
    prompt = (
        f"Goal: {goal}\n"
        f"Learner can give about {weekly_hours} hours a week.\n"
        f"Money available for paid resources: {budget_amount} USD. Free is strongly preferred.\n\n"
        f"Gaps to close (one step each, no others):\n{json.dumps(readable, indent=2)}\n"
    )
    try:
        response = AIService().generate_response(
            PLAN_SYSTEM_PROMPT, prompt, user=user, operation_type="cvai_plan"
        )
    except Exception:
        return []
    payload = extract_json(response)
    if not payload:
        return []
    return planner.validate_proposed_steps(payload.get("steps", []), readable)


def gaps_from_targets(targets: List[Dict]) -> List[Dict]:
    """Only the gaps need planning work; held skills do not."""
    return [t for t in targets if t.get("state") in ("missing", "level_gap")]


__all__ = ["extract_json", "gaps_from_targets", "propose_steps", "propose_targets"]
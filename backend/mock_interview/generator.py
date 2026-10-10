"""Mock interview generation and review.

Two model calls per session, both optional:

1. Follow-ups. The bank is the backbone — it is what guarantees the session keeps
   its shape — and the model only fills gaps when the bank runs dry for a phase.
2. Post-interview feedback. Scored, then recomputed and clamped here.

Neither is allowed to move the session forward. The phase is decided by
utils/mock_interview.py, and every strength or weakness the reviewer states must
quote the candidate's own words or it is thrown away. The same rule guided
projects already follow, and the same reason: a learner cannot act on praise
they can neither check nor repeat.
"""
import json
import re
from typing import Dict, List, Optional, Tuple

from ..ai_service import AIService
from ..utils import mock_interview as mi
from ..utils.skill_taxonomy import resolve


def extract_json(text: str) -> Optional[Dict]:
    """Pull a JSON object out of a model response.

    Models wrap JSON in fences and wrap that in commentary. Counting braces
    rather than trusting the fence survives nesting and braces inside strings.
    """
    if not text:
        return None
    cleaned = text.strip()
    fenced = re.search(r"```(?:json)?\s*(.+?)\s*```", cleaned, re.DOTALL)
    if fenced:
        cleaned = fenced.group(1).strip()
    start = cleaned.find("{")
    if start < 0:
        return None
    depth = 0
    in_string = False
    escaped = False
    for i in range(start, len(cleaned)):
        ch = cleaned[i]
        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(cleaned[start:i + 1])
                except (json.JSONDecodeError, ValueError):
                    return None
    return None


def plan_skills(user, post=None, target_role: str = "", limit: int = 6) -> List[Dict]:
    """Which skills this session should cover.

    Taken from what the learner actually has evidence for and lacks, using the
    same gap engine the recommendation path uses. Practising something they are
    already Expert at is a waste of their time; practising something they have no
    evidence for is guesswork. The gaps are the middle ground.
    """
    from ..utils import skill_gap

    current = []
    for skill in (user.skills or []):
        if skill.skill_slug:
            current.append({"slug": skill.skill_slug, "level": skill.level,
                            "verified": bool(skill.verified)})

    wanted: List[Dict] = []
    if post is not None:
        requirements = [{"name": r} for r in (post.required_skills or [])]
        if requirements:
            gap = skill_gap.compute_gap(current, (), requirements)
            # Gaps first, then level gaps: what they do not have at all is the
            # most worth practising, and a skill they already hold at the wrong
            # level is second.
            wanted = list(gap.get("missing_skills") or []) + list(
                gap.get("level_gaps") or [])

    if not wanted and target_role:
        wanted = propose_targets(target_role, user)

    out = []
    for item in (wanted or [])[:limit]:
        slug = item.get("slug")
        if not slug:
            continue
        entry = resolve(slug)
        if not entry:
            continue
        out.append({"slug": entry["slug"], "name": entry["name"]})
    return out


def propose_targets(role: str, user) -> List[Dict]:
    """Ask which catalogued skills a role needs. Keeps only real slugs."""
    from ..utils.skill_taxonomy import SKILLS

    prompt = (
        f"Role: {role}\n\n"
        f"List the skills this role genuinely requires, using only slugs from the "
        f"list below. If none fit, return an empty list. Do not invent slugs.\n"
        f"{json.dumps(list(SKILLS.keys())[:200])}\n\n"
        'Output: {"skills": [{"skill_slug": "...", "needed_level": "Intermediate"}]}'
    )
    try:
        response = AIService().generate_response(
            "You identify the skills a role requires. Answer ONLY with JSON.",
            prompt, user=user, operation_type="cvai_mock_targets")
    except Exception:
        return []
    payload = extract_json(response)
    if not payload:
        return []
    out = []
    for item in payload.get("skills") or []:
        if not isinstance(item, dict):
            continue
        entry = resolve(item.get("skill_slug"))
        if entry:
            out.append({"slug": entry["slug"], "name": entry["name"],
                        "needed_level": item.get("needed_level")})
    return out


def bank_questions(phase: str, limit: int = 8) -> List[Dict]:
    from ..models import MockInterviewQuestion

    rows = (MockInterviewQuestion.query
            .filter_by(phase=phase, is_active=True)
            .order_by(MockInterviewQuestion.id.asc())
            .limit(limit).all())
    return [{"id": r.id, "text": r.text, "skill_slug": r.skill_slug,
             "phase": r.phase} for r in rows]


def generate_followup(question: str, answer: str, skills: List[str], user) -> List[str]:
    """A follow-up a real interviewer would ask. May legitimately return none.

    Used only when the bank cannot serve the current phase, so a session never
    stalls on an empty bank.
    """
    prompt = mi.build_followup_prompt(question, answer, skills)
    try:
        response = AIService().generate_response(
            "You are an experienced technical interviewer. Answer ONLY with JSON.",
            prompt, user=user, operation_type="cvai_mock_followup")
    except Exception:
        return []
    payload = extract_json(response)
    if not payload:
        return []
    out = []
    for item in payload.get("questions") or []:
        text = str((item or {}).get("text") or "").strip()
        if text and len(text) <= mi.MAX_QUESTION_CHARS:
            out.append(text)
    return out


def generate_questions(phase: str, skills: List[str], asked: List[str],
                       user) -> List[str]:
    """Fallback questions for a phase, validated against that phase."""
    prompt = mi.build_question_prompt(
        phase, skills, asked, n=3)
    try:
        response = AIService().generate_response(
            "You are an experienced interviewer. Answer ONLY with JSON.",
            prompt, user=user, operation_type="cvai_mock_questions")
    except Exception:
        return []
    payload = extract_json(response)
    if not payload:
        return []
    return [q["text"] for q in mi.extract_questions(payload, phase, asked)]


def review_interview(transcript: List[Dict], skills: List[str], user) -> Tuple[Optional[Dict], Optional[str]]:
    """Score the session. Returns (result, error).

    `error` is set whenever there is no score. A caller that cannot tell a zero
    from a failure will show a learner a failing score for an interview the
    reviewer never read.
    """
    if not transcript:
        return None, "there is no transcript to review"

    prompt = mi.build_feedback_prompt(transcript, skills)
    try:
        response = AIService().generate_response(
            mi.FEEDBACK_SYSTEM_PROMPT, prompt, user=user,
            operation_type="cvai_mock_review")
    except Exception as exc:
        return None, str(exc)

    payload = extract_json(response)
    if not isinstance(payload, dict):
        return None, "the reviewer returned nothing usable"
    return mi.apply_feedback(payload, transcript, skills), None


__all__ = [
    "bank_questions",
    "extract_json",
    "generate_followup",
    "generate_questions",
    "plan_skills",
    "propose_targets",
    "review_interview",
]

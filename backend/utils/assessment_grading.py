"""Grading a snapshot of questions, and the profile write-back it implies.

Shared by assessments (A4) and quizzes (C1) because they are the same operation:
a set of questions was served, the learner answered, and a score came out. Two
copies of this loop is two copies of the chance to award a score from live rows
instead of the snapshot, which is the bug A4 already had once.

Everything here operates on plain dicts. `grade()` takes the snapshot stored on
the attempt — prompt, options, correct index, explanation — so grading never
re-reads the question rows. That is what makes an attempt immune to the bank
being edited underneath it.
"""
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from .skill_taxonomy import level_for_score

# Kept here rather than re-derived per feature: a level awarded at 55% must not
# depend on which surface awarded it.
DEFAULT_PASS_MARK_PERCENT = 50.0


def grade(snapshot: List[Dict], submitted: Dict[Optional[int], Optional[int]]
          ) -> Tuple[Dict, List[Dict]]:
    """Grade a served snapshot against submitted answers.

    `snapshot` is the list stored on the attempt; `submitted` maps
    question_id -> selected option index. Questions that were never answered, or
    answered out of range, count as wrong rather than being dropped — silently
    shrinking the denominator would let a learner submit one answer and score
    100%.

    Returns (result, feedback) where result carries the counts, the percent and
    the awarded level, and feedback is per-question with the explanation shown.
    """
    correct_count = 0
    graded_ids: List[int] = []
    feedback: List[Dict] = []

    for row in snapshot or []:
        qid = row.get("question_id")
        options = row.get("options") or []
        correct_index = row.get("correct_index")
        if qid is None or not options or correct_index is None:
            # No usable snapshot for this question: skip it rather than
            # failing the whole attempt. Legacy rows written before content was
            # snapshotted land here.
            continue

        selected = (submitted or {}).get(qid)
        valid = isinstance(selected, int) and 0 <= selected < len(options)
        is_correct = valid and selected == correct_index
        if is_correct:
            correct_count += 1
        graded_ids.append(qid)

        row["selected"] = selected
        row["correct"] = is_correct
        feedback.append({
            "question_id": qid,
            "prompt": row.get("prompt"),
            "selected": selected if valid else None,
            "correct": is_correct,
            "correct_index": correct_index,
            "explanation": row.get("explanation"),
            "skill_slug": row.get("skill_slug"),
            "level_tested": row.get("level_tested"),
        })

    total = len(feedback)
    percent = round(correct_count / total * 100, 1) if total else 0.0
    result = {
        "correct_count": correct_count,
        "total_questions": total,
        "score_percent": percent,
        "level_awarded": level_for_score(percent) if total else None,
        "graded_question_ids": graded_ids,
        "snapshot": snapshot or [],
        "feedback": feedback,
    }
    return result, feedback


def passed(score_percent: Optional[float],
           pass_mark: float = DEFAULT_PASS_MARK_PERCENT) -> bool:
    try:
        return float(score_percent) >= float(pass_mark)
    except (TypeError, ValueError):
        return False


def write_back_skill(user, skill_slug: str, level: str, evidence: Dict,
                     when: Optional[datetime] = None):
    """Upsert the skill row behind a measured result.

    A measurement replaces whatever the learner claimed — someone who claimed
    "Expert" and scored 55% should see Intermediate, because a retake is a fresh
    measurement and not a ratchet. Upsert by (user, slug) so repeated attempts
    never pile up duplicate rows.
    """
    from ..models import Skill
    from ..models.skill import EVIDENCE_ASSESSMENT, VERIFIED_EVIDENCE
    from .skill_taxonomy import resolve

    entry = resolve(skill_slug)
    if not entry or not level:
        return None

    skill = Skill.query.filter_by(user_id=user.id, skill_slug=entry["slug"]).first()
    created = skill is None
    if created:
        skill = Skill(user_id=user.id, name=entry["name"], skill_slug=entry["slug"])
        from ..extensions import db
        db.session.add(skill)

    skill.name = entry["name"]
    skill.level = level
    skill.evidence_source = EVIDENCE_ASSESSMENT
    skill.verified = EVIDENCE_ASSESSMENT in VERIFIED_EVIDENCE
    skill.last_assessed_at = when or datetime.utcnow()
    detail = dict(evidence or {})
    detail["skill_slug"] = entry["slug"]
    skill.set_evidence_detail(detail)
    return skill


__all__ = [
    "DEFAULT_PASS_MARK_PERCENT",
    "grade",
    "passed",
    "write_back_skill",
]
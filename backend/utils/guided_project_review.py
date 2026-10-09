"""Reviewing a guided-project submission, and the score that comes out.

Shared by the C2 routes. Pure functions over plain dicts: no Flask, no database,
no model. That is deliberate — the whole point of this module is that the score
and the evidence are computed by code, so a test can pin them without a provider.

The rule this enforces: **a criterion is only met if the reviewer quoted text
that is actually in the learner's submission.** A model that says "you handled
error states" without being able to point at where it did is guessing, and a
guessing reviewer is worse than no reviewer, because the learner has no way to
tell the difference. So an unverifiable claim is not "met with no evidence" — it
is not met, and it says why.

The score is arithmetic over those verdicts. A model-supplied score is ignored
even when present, for the same reason the mentorship planner never trusts the
model's hours: one source of truth for every number a learner is shown.
"""
import re
from typing import Dict, List, Optional

# A verdict the model is allowed to use. Anything else is treated as unknown and
# therefore not met — a free-text field is not a controlled vocabulary.
VERDICT_MET = "met"
VERDICT_PARTIAL = "partially_met"
VERDICT_NOT_MET = "not_met"
VALID_VERDICTS = (VERDICT_MET, VERDICT_PARTIAL, VERDICT_NOT_MET)

# Weight for a partially met criterion. Chosen so a pass needs real work: three
# partially met criteria out of three scores 50%, which is the default pass mark.
PARTIAL_CREDIT = 0.5

MAX_QUOTE_CHARS = 400


def normalize(text: Optional[str]) -> str:
    """Fold text so a quote can be compared against a submission.

    Whitespace and case are the only differences allowed between what the model
    quoted and what was submitted, because those are the differences a model
    introduces while reformatting without changing meaning. Anything else has to
    match exactly.
    """
    if not text:
        return ""
    return re.sub(r"\s+", " ", str(text)).strip().lower()


def quote_is_real(quote: Optional[str], submission: str) -> bool:
    """Is this quote actually in the submission?"""
    candidate = normalize(quote)
    if not candidate:
        return False
    if len(candidate) > MAX_QUOTE_CHARS:
        # A "quote" longer than this is the model echoing the prompt back rather
        # than pointing at the learner's work.
        return False
    return candidate in normalize(submission)


def criteria_from_spec(spec: Optional[List]) -> List[Dict]:
    """Acceptance criteria as a stable, ordered list.

    Authored content can arrive as a list of strings or of dicts; both are
    accepted so an author is not punished for picking the wrong shape in a seed
    script. Duplicates are collapsed because a repeated criterion would let one
    piece of work satisfy the bar twice.
    """
    out: List[Dict] = []
    seen = set()
    for item in spec or []:
        if isinstance(item, str):
            text = item.strip()
            key = text.lower()
        elif isinstance(item, dict):
            text = str(item.get("text") or item.get("criterion") or "").strip()
            key = text.lower()
        else:
            continue
        if not text or key in seen:
            continue
        seen.add(key)
        out.append({"text": text})
    return out


def build_review_prompt(project: Dict, submission: str, criteria: List[Dict]) -> str:
    """The learner-facing task, stated as a closed question per criterion.

    The model is given nothing to summarise and no rubric of its own: the
    criteria are already written, so its only job is to decide each one and cite
    the text that decides it.
    """
    import json

    listed = "\n".join(f"{i + 1}. {c['text']}" for i, c in enumerate(criteria))
    return (
        f"Project: {project.get('title')}\n"
        f"Summary: {project.get('summary') or '(none given)'}\n\n"
        f"Acceptance criteria the learner submitted work against:\n{listed}\n\n"
        f"The learner's submission:\n\"\"\"\n{submission}\n\"\"\"\n\n"
        f"For each criterion decide one of: met, partially_met, not_met.\n"
        f"verdict, feedback and evidence_quote MUST be the numbered criterion's\n"
        f"own text — do not summarise, rename or reorder them.\n"
        f"evidence_quote must be copied VERBATIM from inside the submission\n"
        f"triple quotes above, and must be short. If you cannot find text that\n"
        f"decides the criterion, the answer is not_met with an empty quote.\n"
        f"Output JSON: " + json.dumps({"reviews": [
            {"criterion_index": 1, "verdict": "met",
             "feedback": "one sentence", "evidence_quote": "verbatim from submission"}
        ]})
    )


def apply_review(criteria: List[Dict], model_reviews: List[Dict],
                 submission: str) -> Dict:
    """Turn model output into a score and a set of findings we can stand behind.

    Every criterion gets a finding whether or not the model mentioned it, because
    a criterion silently missing from the report reads as "no problem found".
    """
    by_index: Dict[int, Dict] = {}
    for item in model_reviews or []:
        if not isinstance(item, dict):
            continue
        raw = item.get("criterion_index")
        try:
            index = int(raw)
        except (TypeError, ValueError):
            continue
        # First answer wins: a duplicated index is a malformed response, and
        # letting the later one overwrite the earlier would make grading depend
        # on iteration order.
        by_index.setdefault(index, item)

    findings: List[Dict] = []
    earned = 0.0
    unsupported = 0

    for position, criterion in enumerate(criteria, start=1):
        item = by_index.get(position) or {}
        verdict = str(item.get("verdict") or "").strip().lower()
        if verdict not in VALID_VERDICTS:
            verdict = VERDICT_NOT_MET
            unrecognised = True
        else:
            unrecognised = False

        quote = item.get("evidence_quote")
        verified = quote_is_real(quote, submission)

        # A claim the learner cannot check is not evidence of anything. Demote it
        # rather than reporting it, and say why.
        if verdict in (VERDICT_MET, VERDICT_PARTIAL) and not verified:
            # Only a positive verdict that failed verification counts as an
            # unsupported claim. A criterion the model never mentioned was not a
            # claim, and counting it here would tell the client its reviewer was
            # fabricating when in fact it was silent.
            unsupported += 1
            verdict = VERDICT_NOT_MET

        if verdict == VERDICT_MET:
            earned += 1.0
        elif verdict == VERDICT_PARTIAL:
            earned += PARTIAL_CREDIT

        findings.append({
            "criterion_index": position,
            "criterion": criterion["text"],
            "verdict": verdict,
            "feedback": str(item.get("feedback") or "").strip()[:600],
            "evidence_quote": (str(quote).strip()[:MAX_QUOTE_CHARS] if verified else None),
            "quote_verified": verified,
            "unrecognised_verdict": unrecognised,
        })

    total = len(criteria)
    score = round(earned / total * 100, 1) if total else 0.0
    met = sum(1 for f in findings if f["verdict"] == VERDICT_MET)
    partial = sum(1 for f in findings if f["verdict"] == VERDICT_PARTIAL)

    return {
        "findings": findings,
        "criteria_total": total,
        "criteria_met": met,
        "criteria_partially_met": partial,
        "criteria_not_met": total - met - partial,
        "score_percent": score,
        "unsupported_claims": unsupported,
    }


__all__ = [
    "PARTIAL_CREDIT",
    "VALID_VERDICTS",
    "VERDICT_MET",
    "VERDICT_NOT_MET",
    "VERDICT_PARTIAL",
    "apply_review",
    "build_review_prompt",
    "criteria_from_spec",
    "normalize",
    "quote_is_real",
]

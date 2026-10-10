"""Mock interview: the phases, the question bank, and how the reviewer scores.

Pure functions over plain dicts. No Flask, no database, no model — the score
comes from code here, for the same reason it does everywhere else in CVAI: the
model proposes and the server disposes.

The phase machine is the point. A real interview has a shape — you open, you talk
about yourself, you get asked things, you close — and an unstructured chat bot
skips all of it. So the phases are fixed and server-owned, and the model may only
choose which question comes next inside a phase. It cannot invent a phase, jump
ahead, or skip the part the learner came to practise.

Two rules carry the design:

- **A question must belong to the phase.** Generated or banked questions are
  validated against `phase`, and one that does not fit is rejected rather than
  reshaped. An interviewer that asks a behavioural question during the technical
  section is not being helpful, it is being noise.

- **Praise must be quotable.** Exactly the rule guided projects already use: a
  strength the reviewer states has to quote the learner's own words, or it is
  discarded. A learner cannot act on "you communicated well" they can neither
  check nor repeat.
"""
import json
import re
from typing import Dict, List, Optional

# ---------------------------------------------------------------------------
# Phases. Order is the interview; a session walks it and never skips.
# ---------------------------------------------------------------------------
PHASES = (
    {"key": "greeting", "label": "Opening", "blurb": "Introductions and what the role is.",
     "min_turns": 0, "max_turns": 2},
    {"key": "background", "label": "Your background", "blurb": "Experience, and why this role.",
     "min_turns": 2, "max_turns": 3},
    {"key": "technical", "label": "Technical", "blurb": "The skills the role actually needs.",
     "min_turns": 3, "max_turns": 6},
    {"key": "behavioural", "label": "Behavioural", "blurb": "Situational questions — STAR.",
     "min_turns": 2, "max_turns": 4},
    {"key": "questions", "label": "Your questions", "blurb": "What you want to ask them.",
     "min_turns": 1, "max_turns": 2},
    {"key": "closing", "label": "Closing", "blurb": "Next steps and what happens now.",
     "min_turns": 1, "max_turns": 1},
)

PHASE_KEYS = tuple(p["key"] for p in PHASES)
# `min_turns: 0` means the phase does not require the learner to speak before it
# can end. Greeting is the one that needs it: the opening line is authored, so a
# session can legitimately have asked its greeting and heard nothing back yet.
PHASE_BY_KEY = {p["key"]: p for p in PHASES}

# Which skill families belong in which phase. A model answering with a Python
# question during the closing is a bug, and this is the guard.
PHASE_SKILLS = {
    "greeting": (),
    "background": (),
    "technical": (
        "python", "javascript", "typescript", "java", "c", "cpp", "csharp", "go",
        "rust", "ruby", "php", "swift", "kotlin", "scala", "sql", "postgresql",
        "mysql", "mongodb", "redis", "react", "angular", "vue", "svelte", "nextjs",
        "node", "django", "flask", "fastapi", "spring", "express", "docker",
        "kubernetes", "terraform", "aws", "azure", "gcp", "ci-cd", "git", "linux",
        "rest-api", "graphql", "microservices", "system-design", "data-structures",
        "algorithms", "testing", "html", "css", "tailwind", "figma", "devops",
    ),
    "behavioural": (
        "communication", "teamwork", "leadership", "problem-solving", "conflict",
        "mentoring", "project-management", "time-management", "adaptability",
        "collaboration", "presentation",
    ),
    "questions": (),
    "closing": (),
}

MAX_QUESTION_CHARS = 300
MAX_ANSWER_CHARS = 8000
MAX_FOLLOWUPS = 2

# Verdict vocabulary. Anything else the model invents is treated as unknown,
# which for a score means it does not count as a strength.
STRENGTH, WEAKNESS = "strength", "weakness"
VALID_VERDICTS = (STRENGTH, WEAKNESS)

PASS_MARK_PERCENT = 60.0


def normalize(text: Optional[str]) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", str(text)).strip().lower()


def quote_is_real(quote: Optional[str], source: str) -> bool:
    """Same rule as guided projects: a quote has to exist in the learner's text."""
    candidate = normalize(quote)
    if not candidate or len(candidate) > 400:
        return False
    return candidate in normalize(source)


def phase_index(phase: Optional[str]) -> int:
    try:
        return PHASE_KEYS.index(phase)
    except ValueError:
        return -1


def next_phase(current: Optional[str]) -> Optional[str]:
    """The phase after `current`, or None at the end.

    Never skips and never goes backwards, so a learner cannot be assessed on
    behaviour when they only did the technical section.
    """
    i = phase_index(current)
    if i < 0:
        return PHASE_KEYS[0]
    return PHASE_KEYS[i + 1] if i + 1 < len(PHASE_KEYS) else None


def should_advance(phase: Optional[str], turns_in_phase: int) -> bool:
    """Has this phase had enough turns?

    Two rules, and the second one is easy to get wrong.

    1. Below `min_turns` the learner has not actually been interviewed in this
       phase, so it must not end.
    2. `min_turns: 0` means the phase needs no reply to have happened at all —
       the authored opening is asked without the learner having spoken. That case
       can advance once the question has been put to them, otherwise the opening
       could never be left.

    Past `max_turns` we are dragging, so the phase ends. Nothing is enforced by
    dropping questions: the phase simply closes and the client is told.
    """
    meta = PHASE_BY_KEY.get(phase)
    if not meta:
        return True

    min_turns = meta["min_turns"]
    if turns_in_phase < min_turns:
        return False
    if min_turns == 0 and turns_in_phase == 0:
        # The opening has been asked but not answered; that is exactly one
        # question in, which is what this phase allows.
        return True
    return turns_in_phase >= meta["max_turns"]


def skills_for_phase(phase: Optional[str]) -> List[str]:
    return list(PHASE_SKILLS.get(phase, ()))


def question_is_valid(question: Dict, phase: Optional[str]) -> bool:
    """Is this question allowed here?

    A bank question must name its phase. A generated one must either be tagged
    with a skill belonging to the phase or be explicitly phase-free, because
    "tell me about a time you disagreed with a teammate" needs no tag to be
    obviously a behavioural question.
    """
    if not isinstance(question, dict):
        return False
    text = str(question.get("text") or "").strip()
    if not text or len(text) > MAX_QUESTION_CHARS:
        return False

    declared = (question.get("phase") or "").strip()
    if declared:
        return declared == phase

    skill = (question.get("skill_slug") or "").strip()
    if skill:
        return skill in skills_for_phase(phase)

    # Untagged is allowed only where the taxonomy cannot help us decide.
    return phase in ("greeting", "background", "questions", "closing")


def pick_question(bank: List[Dict], phase: Optional[str], asked_ids: List) -> Optional[Dict]:
    """First unused bank question that legally belongs to this phase."""
    asked = set(asked_ids or [])
    for question in bank or []:
        qid = question.get("id")
        if qid in asked:
            continue
        if question_is_valid(question, phase):
            return question
    return None


def build_question_prompt(phase: Optional[str], skills: List[str],
                          asked: List[str], n: int = 3) -> str:
    meta = PHASE_BY_KEY.get(phase) or {}
    allowed = skills_for_phase(phase)
    listed = ", ".join(allowed[:24]) if allowed else "none for this phase"
    return (
        f"Interview phase: {phase} ({meta.get('label', '?')}) — {meta.get('blurb', '')}\n"
        f"Skills in scope for this phase: {listed}\n"
        f"Already asked: {json.dumps(asked)}\n\n"
        f"Write {n} interview questions for this phase.\n"
        f"Each must belong to THIS phase. Do not ask a technical question during\n"
        f"the behavioural phase or a behavioural one during the technical phase.\n"
        f"Real interviewers ask what they would actually ask. One question at a\n"
        f"time, not a list. No preamble, no numbering.\n"
        'Output: {"questions": [{"text": "...", "skill_slug": "<one of the listed, or \\"\\" if none applies>"}]}'
    )


def build_followup_prompt(question: str, answer: str, skills: List[str]) -> str:
    allowed = ", ".join(skills[:24]) if skills else "any relevant"
    return (
        f"The interviewer asked: {question}\n\n"
        f"The candidate answered: {answer}\n\n"
        f"Skills in scope: {allowed}\n\n"
        f"Write ONE follow-up a real interviewer would ask next, given that answer.\n"
        f"A follow-up digs into something the answer raised or glossed over. If the\n"
        f"answer was complete and there is nothing real left to ask, return an empty\n"
        f"list — that is a legitimate answer, not a failure.\n"
        'Output: {"questions": [{"text": "..."}]}'
    )


def extract_questions(payload: Optional[Dict], phase: Optional[str],
                      asked: List[str]) -> List[Dict]:
    """Validate model output down to questions that legally belong here.

    Anything phase-mismatched is dropped rather than accepted, so a model that
    ignores its instructions narrows the set instead of derailing the session.

    The phase is applied *after* validation rather than before, which matters:
    stamping the requested phase onto a candidate would make every question look
    legal by construction and the check would never reject anything. The skill
    tag is what actually decides, so it is judged as the model sent it.
    """
    if not isinstance(payload, dict):
        return []
    out: List[Dict] = []
    already = {normalize(q) for q in asked or []}
    for raw in payload.get("questions") or []:
        if not isinstance(raw, dict):
            continue
        skill = str(raw.get("skill_slug") or "").strip() or None
        candidate = {
            "text": str(raw.get("text") or "").strip(),
            "skill_slug": skill,
            # Not set here. Setting it would make this a tautology.
        }
        if not question_is_valid(candidate, phase):
            continue
        candidate["phase"] = phase
        key = normalize(candidate["text"])
        if not key or key in already:
            continue
        already.add(key)
        out.append(candidate)
    return out


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

ASSESSMENT_DIMENSIONS = (
    ("relevance", "Answered the question that was actually asked"),
    ("depth", "Went past the surface — specifics, trade-offs, numbers"),
    ("clarity", "Structured enough to follow without re-reading"),
    ("evidence", "Gave concrete examples rather than describing the idea"),
)

FEEDBACK_SYSTEM_PROMPT = """You give honest post-interview feedback to a job candidate.

Rules you must follow:
- Answer ONLY with a JSON object. No prose before or after it.
- Every strength and every weakness MUST carry a quote copied VERBATIM from the
  candidate's own answers. If you cannot point at the words that prove it, do not
  claim it. A compliment they cannot check is worse than no compliment.
- Be honest. A weak answer is a weak answer. Do not soften it.
- Feedback is one or two sentences, addressed to the candidate directly.
- Do not invent anything they did not say, and do not claim a score you are not
  given.

Output shape:
{"scores": {"relevance": 0-100, "depth": 0-100, "clarity": 0-100, "evidence": 0-100},
 "strengths": [{"skill_slug": "", "note": "...", "quote": "verbatim"}],
 "improvements": [{"skill_slug": "", "note": "...", "quote": "verbatim"}]}"""


def build_feedback_prompt(transcript: List[Dict], skills: List[str]) -> str:
    lines = []
    for turn in transcript or []:
        who = "Interviewer" if turn.get("role") == "interviewer" else "Candidate"
        lines.append(f"{who}: {turn.get('content', '')}")
    joined = "\n\n".join(lines)
    listed = ", ".join(skills) if skills else "none recorded"
    return (
        f"Skills this interview covered: {listed}\n\n"
        f"Transcript:\n{joined}\n\n"
        f"Score each dimension 0-100, then list strengths and improvements. "
        f"Every one needs a verbatim quote from the transcript above."
    )


def apply_feedback(payload: Dict, transcript: List[Dict], skills: List[str]) -> Dict:
    """Turn model output into scores we can defend and notes a learner can use.

    Scores are clamped, never trusted raw. Strengths and improvements both lose
    any claim whose quote is not in the transcript — the same demotion the
    project reviewer uses, and for the same reason.
    """
    transcript_text = "\n".join(t.get("content", "") or "" for t in transcript or [])

    raw = (payload or {}).get("scores") or {}
    scores: Dict[str, int] = {}
    for key, _label in ASSESSMENT_DIMENSIONS:
        try:
            value = int(float(raw.get(key, 0)))
        except (TypeError, ValueError):
            value = 0
        scores[key] = max(0, min(100, value))

    overall = round(sum(scores.values()) / len(scores), 1) if scores else 0.0

    def collect(field):
        items = []
        dropped = 0
        for entry in (payload or {}).get(field) or []:
            if not isinstance(entry, dict):
                continue
            quote = str(entry.get("quote") or "").strip()
            if not quote_is_real(quote, transcript_text):
                dropped += 1
                continue
            items.append({
                "skill_slug": str(entry.get("skill_slug") or "").strip() or None,
                "note": str(entry.get("note") or "").strip()[:400],
                "quote": quote[:400],
            })
        return items, dropped

    strengths, dropped_strengths = collect("strengths")
    improvements, dropped_improvements = collect("improvements")

    return {
        "scores": scores,
        "overall_score": overall,
        "passed": overall >= PASS_MARK_PERCENT,
        "strengths": strengths,
        "improvements": improvements,
        "unverifiable_claims": dropped_strengths + dropped_improvements,
        "skills_covered": list(skills or []),
    }


__all__ = [
    "ASSESSMENT_DIMENSIONS",
    "FEEDBACK_SYSTEM_PROMPT",
    "MAX_ANSWER_CHARS",
    "MAX_FOLLOWUPS",
    "MAX_QUESTION_CHARS",
    "PASS_MARK_PERCENT",
    "PHASES",
    "PHASE_BY_KEY",
    "PHASE_KEYS",
    "PHASE_SKILLS",
    "STRENGTH",
    "WEAKNESS",
    "apply_feedback",
    "build_feedback_prompt",
    "build_followup_prompt",
    "build_question_prompt",
    "extract_questions",
    "next_phase",
    "normalize",
    "phase_index",
    "pick_question",
    "question_is_valid",
    "quote_is_real",
    "should_advance",
    "skills_for_phase",
]

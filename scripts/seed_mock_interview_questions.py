"""Interview question bank — the CVAI mock-interview equivalent of skill_questions.

    python scripts/seed_mock_interview_questions.py

Idempotent by a natural key so re-running adds only what is new. Questions carry
a `phase`, and the server refuses to ask one outside its phase, so the bank is
the second half of the guarantee that a session keeps its shape.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import create_app
from backend.extensions import db
from backend.models import MockInterviewQuestion

# (phase, skill_slug, level_tested, text, explanation)
QUESTIONS = [
    # ---- greeting -------------------------------------------------------
    ("greeting", None, None,
     "Thanks for making the time. Can you start by telling me your name and what "
     "you currently do?",
     "Open warmly and let them set the pace. One clear sentence is enough."),
    ("greeting", None, None,
     "Before we start — is there anything about the role you'd like me to make "
     "sure we cover today?",
     "Asks what they care about, which usually reveals what they are weakest on."),

    # ---- background -----------------------------------------------------
    ("background", None, None,
     "Walk me through the last role you held. What were you responsible for?",
     "They want scope and ownership. Concrete beats abstract."),
    ("background", None, None,
     "Why are you looking for something new?",
     "The honest answer is best. Vagueness here is read as dissatisfaction."),
    ("background", None, None,
     "Which part of that work are you proudest of, and why that part?",
     "Tests whether they know their own contribution rather than the team's."),
    ("background", "communication", None,
     "Tell me about a project where you had to explain something technical to a "
     "non-technical audience.",
     "Listen for what the audience was and what changed as a result. STAR-shaped."),

    # ---- technical ------------------------------------------------------
    ("technical", "python", "Intermediate",
     "What's the difference between a list and a tuple in Python, and when would "
     "you pick one over the other?",
     "Mutability, hashability, and a real reason to choose each."),
    ("technical", "python", "Intermediate",
     "Explain the difference between `is` and `==` in Python.",
     "Identity versus equality. Watch for interned strings as a follow-up."),
    ("technical", "sql", "Intermediate",
     "What does a LEFT JOIN return when there is no matching row in the joined "
     "table?",
     "All rows from the left, NULLs on the right. A common source of silent bugs."),
    ("technical", "postgresql", "Intermediate",
     "When would you add an index to a column, and what would make you not?",
     "Read-heavy vs write-heavy, selectivity, and the cost on writes."),
    ("technical", "rest-api", "Intermediate",
     "What's the difference between a 401 and a 403?",
     "401 is 'who are you', 403 is 'I know who you are and no'."),
    ("technical", "docker", "Beginner",
     "What problem does a multi-stage Docker build solve?",
     "Build tools and cache bloat ending up in the final image."),
    ("technical", "ci-cd", "Beginner",
     "What is the difference between continuous integration and continuous "
     "deployment?",
     "CI is the testing gate; CD is the release. They are separable."),
    ("technical", "git", "Beginner",
     "What does `git rebase` do differently to `git merge` when bringing a branch "
     "back?",
     "Rebase replays commits on top; merge records a join. History shape differs."),
    ("technical", "javascript", "Intermediate",
     "What does `===` compare, and how does that differ from `==`?",
     "Value and type, without coercion. Useful when people fumble it."),
    ("technical", "react", "Intermediate",
     "What's the point of a `useEffect` dependency array?",
     "It controls when the effect re-runs. An empty array means once on mount."),
    ("technical", "testing", "Intermediate",
     "What's the difference between a unit test and an integration test, and when "
     "would you reach for each?",
     "Scope and confidence. Boundaries decide which one you are writing."),
    ("technical", "system-design", "Advanced",
     "How would you design the read path for a product page that gets ten times "
     "more traffic on sale day than any other day?",
     "Caching, cache invalidation, and what you would measure before optimising."),
    ("technical", "data-structures", "Intermediate",
     "When is a hash map a better choice than a sorted array?",
     "Lookup versus ordering and range queries. Trade-offs, not definitions."),

    # ---- behavioural ----------------------------------------------------
    ("behavioural", "conflict", None,
     "Tell me about a time you disagreed with a decision your team had already made.",
     "STAR. The interesting part is what you did, not that you disagreed."),
    ("behavioural", "teamwork", None,
     "Describe a project where something you were responsible for went wrong. What "
     "did you do?",
     "They are testing ownership. Blaming others is the wrong answer."),
    ("behavioural", "problem-solving", None,
     "Tell me about a time you had to work out something with no clear instructions.",
     "Look for how they narrowed the problem, not just that they solved it."),
    ("behavioural", "time-management", None,
     "How have you handled competing deadlines before?",
     "Concrete example beats a general claim about being organised."),
    ("behavioural", "leadership", None,
     "Tell me about a time you had to bring someone else up to speed on something "
     "you knew well.",
     "Shows how you explain, which is the job."),
    ("behavioural", "adaptability", None,
     "Describe a situation where your original plan had to change significantly.",
     "What they changed it to, and what they learned about their own judgement."),

    # ---- their questions ------------------------------------------------
    ("questions", None, None,
     "We've got a bit of time — what would you like to ask me about the role?",
     "If they ask nothing, prompt again. Silence here usually means nerves."),
    ("questions", None, None,
     "Is there anything about how we work that you would want to understand better?",
     "Good candidates use this to probe team structure or process."),

    # ---- closing --------------------------------------------------------
    ("closing", None, None,
     "We're close to time. Is there anything you'd like to add before we finish?",
     "Last chance for them. Worth leaving it open."),
    ("closing", None, None,
     "What are your salary expectations for this role?",
     "Ask it plainly. Vagueness at this point has already been noted."),
]


def main():
    app = create_app()
    with app.app_context():
        created, skipped = 0, 0
        for phase, slug, level, text, guidance in QUESTIONS:
            if MockInterviewQuestion.query.filter_by(text=text).first():
                skipped += 1
                continue
            db.session.add(MockInterviewQuestion(
                text=text,
                phase=phase,
                skill_slug=slug,
                level_tested=level,
                guidance=guidance,
                is_active=True,
            ))
            created += 1

        db.session.commit()
        total = MockInterviewQuestion.query.count()
        by_phase = {}
        for row in MockInterviewQuestion.query.all():
            by_phase[row.phase] = by_phase.get(row.phase, 0) + 1
        print(f"created {created}, skipped {skipped}; "
              f"{total} mock-interview questions in the bank")
        for phase in ("greeting", "background", "technical", "behavioural",
                      "questions", "closing"):
            print(f"  {phase:<14} {by_phase.get(phase, 0)}")


if __name__ == "__main__":
    main()

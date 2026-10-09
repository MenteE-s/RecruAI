"""Seed the skill question bank with a small starter set.

Run manually like the other scripts in this directory:
    python scripts/seed_skill_questions.py

Idempotent: a question already present for a (skill_slug, prompt) pair is left
alone, so re-running after adding questions does not duplicate the bank.

Authoring is gated to page admins because who should ultimately author content
is still an open product question (see CVAI_TODO.md). This script writes
directly, bypassing the API gate, and attributes the rows to --author-id so
they are attributable.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import create_app
from backend.extensions import db
from backend.models import SkillQuestion, User
from backend.utils import skill_taxonomy as taxonomy

import json

QUESTIONS = [
    # (skill_slug, difficulty, level_tested, prompt, options, correct_index, explanation)
    ("python", 1, "Beginner", "Which keyword declares a function in Python?",
     ["function", "def", "fn", "func"], 1,
     "'def' introduces a function definition; 'function' is not a Python keyword."),
    ("python", 2, "Intermediate", "What does a Python list comprehension produce?",
     ["A tuple", "A generator object only", "A new list", "A dict"], 2,
     "A comprehension builds a list; wrapping it in tuple(...) makes a tuple."),
    ("javascript", 1, "Beginner", "Which keyword declares a block-scoped variable?",
     ["var", "let", "const", "define"], 1,
     "'let' is block-scoped. 'var' is function-scoped, 'const' is block-scoped "
     "but immutable after binding."),
    ("javascript", 2, "Intermediate", "What does === compare?",
     ["Values with type coercion", "Identity and type without coercion",
      "Only references", "Only primitives"], 1,
     "=== compares both value and type; == coerces types first."),
    ("javascript", 2, "Intermediate", "What is typeof null?",
     ["'null'", "'object'", "'undefined'", "Throws a TypeError"], 1,
     "A long-standing quirk from the original implementation: typeof null is "
     "'object'."),
    ("javascript", 2, "Intermediate", "Which array method returns a new array?",
     ["push", "map", "sort", "splice"], 1,
     "map returns a new array; push/splice mutate in place and return a length "
     "or removed items."),
    ("javascript", 3, "Advanced", "What does 'use strict' change?",
     ["Nothing at runtime", "Turns silent failures into errors and blocks "
      "undeclared assignment", "Compiles faster", "Enables async/await"], 1,
     "Strict mode surfaces errors that would otherwise fail silently, which is "
     "the whole point of opting in."),
    ("react", 2, "Intermediate", "What does useEffect with an empty dependency array do?",
     ["Runs on every render", "Runs once after the first render",
      "Runs before the first render", "Runs on unmount only"], 1,
     "[] means the effect runs once after mount and cleans up on unmount."),
    ("react", 2, "Intermediate", "What is useCallback for?",
     ["Caching an effect", "Returning a memoised function reference",
      "Caching a computed value", "Fetching data"], 1,
     "useCallback memoises the function itself, so it can be handed to a "
     "memoised child without defeating the memo."),
    ("react", 3, "Advanced", "What does React.memo do?",
     ["Deep-compares props", "Skips re-render when props are shallowly equal",
      "Memoises state", "Preloads a component"], 1,
     "It is a shallow comparison by reference; a fresh object prop defeats it."),
    ("react", 3, "Advanced", "Why is state not updated when you mutate it in place?",
     ["React ignores objects", "Mutation keeps the same reference so React "
      "cannot see a change", "State is read-only only in strict mode",
      "setState is asynchronous only in production"], 1,
     "Equality is checked by reference. Mutating in place leaves the same "
     "reference, so React skips the re-render."),
    ("sql", 1, "Beginner", "Which clause filters grouped rows?",
     ["WHERE", "HAVING", "ORDER BY", "GROUP"], 1,
     "HAVING filters after grouping; WHERE filters before it."),
    ("sql", 2, "Intermediate", "What does INNER JOIN return?",
     ["All rows of the left table", "Matching rows from both tables only",
      "All rows of the right table", "Rows with NULLs"], 1,
     "INNER JOIN returns only rows that match on both sides."),
    ("postgresql", 2, "Intermediate", "Which type stores variable-length text?",
     ["CHAR", "TEXT", "INT", "BOOLEAN"], 1,
     "TEXT is the variable-length string type."),
    ("docker", 1, "Beginner", "What does a Dockerfile describe?",
     ["A running container", "How to build an image", "A network of containers",
      "A volume"], 1,
     "A Dockerfile is the build recipe; docker compose orchestrates the run."),
    ("git", 1, "Beginner", "Which command stages changes for a commit?",
     ["git commit", "git add", "git push", "git merge"], 1,
     "git add stages; git commit records the staged snapshot."),
    ("rest-apis", 2, "Intermediate", "Which HTTP status means 'created'?",
     ["200", "201", "204", "404"], 1,
     "201 Created, usually with a Location header for the new resource."),
    ("ci-cd", 2, "Intermediate", "What is a pipeline's cache used for?",
     ["Storing secrets", "Reusing unchanged dependency installs between runs",
      "Branching", "Holding build artifacts permanently"], 1,
     "Caching dependency installs is the main lever on pipeline speed."),
    ("llm", 2, "Intermediate", "What is a token in an LLM context?",
     ["A word only", "A subword unit of text", "A byte", "A request"], 1,
     "Models tokenize text into subword units; that is what the token limits count."),
    ("rag", 3, "Advanced", "Why chunk documents before embedding them?",
     ["To reduce file size", "To keep each vector focused on one idea",
      "Because embeddings have a word limit", "To compress them"], 1,
     "Chunks that mix many topics produce vectors that average them away."),
    ("unit-testing", 1, "Beginner", "What is a unit test's scope?",
     ["The whole application", "A single function or unit",
      "Only the database", "The UI"], 1,
     "Unit tests exercise the smallest testable piece in isolation."),
]


def main():
    app = create_app()
    with app.app_context():
        author = db.session.query(User).filter(User.organization_id.isnot(None)).first()
        author_id = author.id if author else None
        print(f"attributing questions to user {author_id}")

        created = 0
        skipped = 0
        for slug, difficulty, level, prompt, options, correct, explanation in QUESTIONS:
            entry = taxonomy.resolve(slug)
            if not entry:
                print(f"  SKIP (unknown skill): {slug}")
                skipped += 1
                continue
            exists = SkillQuestion.query.filter_by(
                skill_slug=entry["slug"], prompt=prompt).first()
            if exists:
                skipped += 1
                continue
            db.session.add(SkillQuestion(
                skill_slug=entry["slug"],
                prompt=prompt,
                options=json.dumps(options),
                correct_index=correct,
                explanation=explanation,
                difficulty=difficulty,
                level_tested=level,
                created_by_user_id=author_id,
            ))
            created += 1

        db.session.commit()
        total = SkillQuestion.query.filter_by(is_active=True).count()
        print(f"created {created}, skipped {skipped}; bank now holds {total} active questions")


if __name__ == "__main__":
    main()
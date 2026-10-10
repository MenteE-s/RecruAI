"""Seed quizzes from the existing question bank.

    python scripts/seed_quizzes.py

Idempotent by slug. Quizzes are assembled from questions that already exist
rather than inventing new ones: the bank is the single source of truth for
question content, so a quiz is a selection and an order.

One quiz is marked is_free_preview on purpose. That is the whole acquisition
strategy in one row — a lapsed individual can try it, feel what the product is
like, and have something concrete to decide about. A free preview never writes to
the profile, so "free" costs nothing measurable.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import create_app
from backend.extensions import db
from backend.models import SkillQuestion, SkillQuiz

# slug, title, description, difficulty, pass_percent, is_free_preview,
# [skill_slug, ...] — questions are taken in id order within each skill.
QUIZZES = [
    {
        "slug": "javascript-essentials",
        "title": "JavaScript Essentials",
        "description": "The six things a JavaScript interview actually asks about. "
                       "Short, and a fair sample of where you actually are.",
        "difficulty": "beginner",
        "pass_percent": 50,
        "is_free_preview": True,
        "skills": ["javascript"],
    },
    {
        "slug": "react-in-practice",
        "title": "React in Practice",
        "description": "State, effects and the reference trap. Built around the "
                       "mistakes that show up in real reviews.",
        "difficulty": "intermediate",
        "pass_percent": 50,
        "is_free_preview": False,
        "skills": ["react"],
    },
    {
        "slug": "sql-and-databases",
        "title": "SQL and Databases",
        "description": "Filtering grouped rows, joins and the text types. The "
                       "questions that separate 'uses SQL' from 'writes SQL'.",
        "difficulty": "intermediate",
        "pass_percent": 50,
        "is_free_preview": False,
        "skills": ["sql", "postgresql"],
    },
    {
        "slug": "delivery-and-devops",
        "title": "Delivery and DevOps",
        "description": "Pipelines, containers and the platform tooling around them.",
        "difficulty": "intermediate",
        "pass_percent": 60,
        "is_free_preview": False,
        "skills": ["docker", "ci-cd", "git"],
    },
]


def main():
    app = create_app()
    with app.app_context():
        active = db.session.query(SkillQuestion).filter_by(is_active=True).all()
        by_skill = {}
        for question in active:
            by_skill.setdefault(question.skill_slug, []).append(question)

        created, skipped, thin = 0, 0, 0
        for spec in QUIZZES:
            existing = SkillQuiz.query.filter_by(slug=spec["slug"]).first()
            if existing:
                skipped += 1
                continue

            ids = []
            for slug in spec["skills"]:
                # Id order keeps a quiz reading predictably rather than in
                # whatever order the query happened to return.
                ids.extend(q.id for q in sorted(by_skill.get(slug, []), key=lambda r: r.id))
            if not ids:
                print(f"  SKIP {spec['slug']}: no active questions for {spec['skills']}")
                skipped += 1
                continue
            if len(ids) < 3:
                # A two-question quiz is a coin toss with a pass mark, which
                # teaches the learner nothing except that quizzes are noisy.
                print(f"  SKIP {spec['slug']}: only {len(ids)} question(s), need 3+")
                thin += 1
                continue

            quiz = SkillQuiz(
                slug=spec["slug"],
                title=spec["title"],
                description=spec["description"],
                difficulty=spec["difficulty"],
                pass_percent=spec["pass_percent"],
                is_free_preview=spec["is_free_preview"],
            )
            quiz.set_question_ids(ids)
            quiz.set_skill_slugs(spec["skills"])
            db.session.add(quiz)
            created += 1
            print(f"  {spec['slug']}: {len(ids)} questions from {spec['skills']}"
                  + ("  [free preview]" if spec["is_free_preview"] else ""))

        db.session.commit()
        print(f"\ncreated {created}, skipped {skipped} ({thin} too thin); "
              f"{SkillQuiz.query.count()} quizzes now exist")


if __name__ == "__main__":
    main()
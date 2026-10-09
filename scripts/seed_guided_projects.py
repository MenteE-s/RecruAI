"""Seed guided projects.

    python scripts/seed_guided_projects.py

Idempotent by slug.

A project's acceptance criteria are the contract with the learner, so they are
written here rather than generated. A rubric a model invented would be a rubric
nobody agreed to, and "you met your own invented criteria" is not a standard.

One project is marked is_free_preview, matching the quiz rule: a lapsed
individual can try one and judge whether subscribing is worth it, and a free
preview never writes to the profile.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import create_app
from backend.extensions import db
from backend.models import GuidedProject

PROJECTS = [
    {
        "slug": "expense-tracker-cli",
        "title": "Expense Tracker CLI",
        "summary": "A command line tool that records income and expenses, and "
                   "reports what is left. Small enough to finish in an evening, "
                   "real enough to have edge cases.",
        "difficulty": "beginner",
        "estimated_hours": 6,
        "pass_percent": 70,
        "is_free_preview": True,
        "skills": ["python"],
        "steps": [
            {"title": "Read and parse input",
             "instruction": "Accept 'add <amount> <category>' and reject anything "
                            "malformed with a message naming what was wrong."},
            {"title": "Persist",
             "instruction": "Store entries in a local file, one per line, and "
                            "reload them on start."},
            {"title": "Report",
             "instruction": "'summary' prints totals per category and the net "
                            "balance. Handle an empty store without crashing."},
        ],
        "criteria": [
            "Malformed input is rejected with a message that says what was wrong",
            "Data survives a restart by being written to and read back from a file",
            "The summary reports per-category totals and a net balance",
            "Running against no stored data produces a message rather than an error",
        ],
    },
    {
        "slug": "rest-api-with-auth",
        "title": "REST API with Authentication",
        "summary": "A small API with token authentication, validation and a "
                   "database. The project most people are asked about in an "
                   "interview and least often build.",
        "difficulty": "intermediate",
        "estimated_hours": 20,
        "pass_percent": 70,
        "is_free_preview": False,
        "skills": ["python", "postgresql", "sql", "rest-api"],
        "steps": [
            {"title": "Model and migrate",
             "instruction": "Two resources with a foreign key between them, "
                            "migrated with versioned migrations."},
            {"title": "Authenticate",
             "instruction": "Register and log in. Return a token; reject a bad "
                            "one. Hash what you store — never keep a password."},
            {"title": "Authorise",
             "instruction": "A user may only touch their own rows. Cross-account "
                            "access returns 404, not 403: the existence of "
                            "another user's row is not theirs to learn."},
            {"title": "Validate",
             "instruction": "Reject bad payloads with field-level errors "
                            "instead of a 500."},
        ],
        "criteria": [
            "Passwords are hashed at rest and never stored or logged in plain text",
            "A request without a valid token is rejected",
            "One account cannot read or write another account's rows",
            "Invalid input is rejected with field-level detail rather than a server error",
            "Schema changes are applied by a migration that can be run twice safely",
        ],
    },
    {
        "slug": "react-dashboard",
        "title": "Data Dashboard in React",
        "summary": "Fetch real data, show it honestly, and handle the states "
                   "everyone forgets: loading, empty and error.",
        "difficulty": "intermediate",
        "estimated_hours": 16,
        "pass_percent": 70,
        "is_free_preview": False,
        "skills": ["react", "javascript", "css"],
        "steps": [
            {"title": "Load",
             "instruction": "Fetch from a public API on mount and show a loading "
                            "state that is not a blank screen."},
            {"title": "Present",
             "instruction": "Render the data in a list or table. Keep state out "
                            "of the DOM: derive it."},
            {"title": "Handle the rest",
             "instruction": "Empty results and a failed request each get their "
                            "own message and a way to try again."},
        ],
        "criteria": [
            "Data is fetched on mount and a loading state is shown while waiting",
            "The empty-result case is handled explicitly rather than rendering an empty page",
            "A failed request produces a visible error and a way to retry",
            "No ESLint or console errors when the component mounts and unmounts repeatedly",
        ],
    },
]


def main():
    app = create_app()
    with app.app_context():
        created, skipped = 0, 0
        for spec in PROJECTS:
            if GuidedProject.query.filter_by(slug=spec["slug"]).first():
                skipped += 1
                continue
            if len(spec["criteria"]) < 3:
                print(f"  SKIP {spec['slug']}: {len(spec['criteria'])} criteria, need 3+")
                skipped += 1
                continue
            if not spec["steps"]:
                print(f"  SKIP {spec['slug']}: no steps")
                skipped += 1
                continue

            project = GuidedProject(
                slug=spec["slug"],
                title=spec["title"],
                summary=spec["summary"],
                difficulty=spec["difficulty"],
                estimated_hours=spec["estimated_hours"],
                pass_percent=spec["pass_percent"],
                is_free_preview=spec["is_free_preview"],
            )
            project.set_steps(spec["steps"])
            project.set_criteria([{"text": c} for c in spec["criteria"]])
            project.set_skill_slugs(spec["skills"])
            db.session.add(project)
            created += 1
            print(f"  {spec['slug']}: {len(spec['steps'])} steps, "
                  f"{len(spec['criteria'])} criteria"
                  + ("  [free preview]" if spec["is_free_preview"] else ""))

        db.session.commit()
        print(f"\ncreated {created}, skipped {skipped}; "
              f"{GuidedProject.query.count()} projects now exist")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Seed demo job posts under the demo orgs (TechCorp, DataLabs) so the
BrowseJobs recommendations can be exercised. Idempotent on (org, title).

Run from repo root with the backend venv:
    .\\backend\\.venv\\Scripts\\python.exe scripts\\seed_demo_posts.py
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.extensions import db
from backend.models import Organization, Post

DEMO_POSTS = [
    {
        "org": "TechCorp", "title": "Senior Python Backend Developer",
        "description": "Build and scale REST APIs with Python Django and Flask. "
                       "PostgreSQL tuning, Docker deployments, Redis caching.",
        "location": "Karachi, Pakistan", "employment_type": "Full-time",
        "category": "Software Engineering",
        "requirements": ["Python", "Django", "Flask", "PostgreSQL", "Docker",
                         "5+ years backend experience"],
        "status": "active",
    },
    {
        "org": "DataLabs", "title": "Machine Learning Engineer",
        "description": "Production ML with Python and PyTorch. Training pipelines, "
                       "model evaluation, SQL analytics.",
        "location": "Lahore, Pakistan", "employment_type": "Full-time",
        "category": "Data & AI",
        "requirements": ["Python", "PyTorch", "TensorFlow", "SQL",
                         "3+ years ML experience"],
        "status": "active",
    },
    {
        "org": "TechCorp", "title": "Junior Frontend Developer",
        "description": "React interfaces with JavaScript and TypeScript. Work with "
                       "designers on CSS design systems.",
        "location": "Remote", "employment_type": "Full-time",
        "category": "Software Engineering",
        "requirements": ["JavaScript", "React", "CSS", "1+ years experience"],
        "status": "active",
    },
    {
        "org": "DataLabs", "title": "Data Analyst",
        "description": "Python Pandas reporting and SQL dashboards for business teams.",
        "location": "Islamabad, Pakistan", "employment_type": "Contract",
        "category": "Data & AI",
        "requirements": ["Python", "SQL", "Pandas", "2+ years analytics experience"],
        "status": "active",
    },
]


def seed():
    created, skipped = 0, 0
    for p in DEMO_POSTS:
        org = Organization.query.filter_by(name=p["org"]).first()
        if not org:
            print(f"SKIP {p['title']}: org {p['org']} missing (run seed_candidates.py first)")
            skipped += 1
            continue
        if Post.query.filter_by(organization_id=org.id, title=p["title"]).first():
            skipped += 1
            continue
        db.session.add(Post(
            organization_id=org.id, title=p["title"], description=p["description"],
            location=p["location"], employment_type=p["employment_type"],
            category=p["category"], requirements=json.dumps(p["requirements"]),
            status=p["status"],
        ))
        created += 1
    db.session.commit()
    print(f"Seeded {created} posts, skipped {skipped}.")


if __name__ == "__main__":
    from backend.app import create_app

    app = create_app()
    with app.app_context():
        try:
            seed()
        except Exception:
            db.session.rollback()
            raise

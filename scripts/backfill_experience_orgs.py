#!/usr/bin/env python3
"""
Link existing free-text experience companies to platform Organizations
by case-insensitive exact name match. Only touches rows with
organization_id IS NULL. Idempotent.

Run from repo root with the backend venv:
    .\\backend\\.venv\\Scripts\\python.exe scripts\\backfill_experience_orgs.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.extensions import db
from backend.models import Experience, Organization


def backfill():
    orgs = { (o.name or "").strip().lower(): o for o in Organization.query.all() if o.name }
    if not orgs:
        print("No organizations found; nothing to link.")
        return
    linked = 0
    skipped_no_match = 0
    for exp in Experience.query.filter_by(organization_id=None).all():
        key = (exp.company or "").strip().lower()
        org = orgs.get(key)
        if org:
            exp.organization_id = org.id
            linked += 1
        else:
            skipped_no_match += 1
    db.session.commit()
    print(f"Linked {linked} experiences; {skipped_no_match} left unlinked (no org match).")


if __name__ == "__main__":
    from backend.app import create_app

    app = create_app()
    with app.app_context():
        try:
            backfill()
        except Exception:
            db.session.rollback()
            raise

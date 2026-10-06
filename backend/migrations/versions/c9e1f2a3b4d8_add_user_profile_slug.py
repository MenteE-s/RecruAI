""" add_user_profile_slug

Revision ID: c9e1f2a3b4d8
Revises: c9e1f2a3b4d7
Create Date: 2026-10-06

Public profile URLs become /in/<slug> instead of numeric ids. This adds
`users.profile_slug` (unique, nullable) and backfills every existing account
with a random slug, generated in Python so the reserved-word list in
backend/utils/slug.py is respected.

Null is allowed so a brand-new signup can never collide with the unique index
on insert; the value is assigned immediately afterwards and is guaranteed
non-null for every row by the end of this migration.
"""

from alembic import op
import sqlalchemy as sa
import random


revision = 'c9e1f2a3b4d8'
down_revision = 'c9e1f2a3b4d7'
branch_labels = None
depends_on = None

ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"
RESERVED = {
    "profile", "interviews", "interview", "jobs", "network", "analytics",
    "resume", "coaching", "practice", "ai-agents", "shareable-profiles",
    "create", "dashboard", "notifications", "settings", "billing", "search",
    "page", "org", "signin", "sign-in", "login", "logout", "register",
    "signup", "terms", "privacy", "cookies", "about", "us", "blog",
    "careers", "status", "contact", "community", "admin", "administrator",
    "api", "root", "system", "support", "help", "static", "assets",
    "media", "uploads", "public", "private", "internal", "null", "undefined",
    "none", "true", "false", "new", "edit", "delete", "me", "my", "self",
    "user", "users", "home", "index", "test", "demo", "recruai", "mentee",
    "menteeai", "syab", "team", "company", "about-us",
}


def _new_slug():
    while True:
        s = "".join(random.choice(ALPHABET) for _ in range(8))
        if s not in RESERVED:
            return s


def upgrade():
    op.add_column('users', sa.Column(
        'profile_slug', sa.String(length=30), nullable=True))
    op.create_index('ix_users_profile_slug', 'users', ['profile_slug'],
                    unique=True)

    # Backfill. A random slug is effectively never numeric, so a few rounds of
    # retries is plenty; the unique index is the real guarantee.
    bind = op.get_bind()
    taken = set(r[0] for r in bind.execute(
        sa.text("SELECT profile_slug FROM users WHERE profile_slug IS NOT NULL")
    ).fetchall())

    rows = bind.execute(
        sa.text("SELECT id FROM users WHERE profile_slug IS NULL")
    ).fetchall()
    for (user_id,) in rows:
        slug = _new_slug()
        while slug in taken:
            slug = _new_slug()
        taken.add(slug)
        bind.execute(
            sa.text("UPDATE users SET profile_slug = :s WHERE id = :i"),
            {"s": slug, "i": user_id},
        )


def downgrade():
    op.drop_index('ix_users_profile_slug', table_name='users')
    op.drop_column('users', 'profile_slug')
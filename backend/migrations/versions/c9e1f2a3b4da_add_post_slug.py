""" add_post_slug

Revision ID: c9e1f2a3b4da
Revises: c9e1f2a3b4d9
Create Date: 2026-10-06

Job URLs become /in/jobs/<slug> instead of /in/jobs/<id>.

Title-derived and globally unique, so /in/jobs/senior-frontend-developer
reads properly. Job titles repeat constantly across companies ("Software
Engineer" everywhere), so collisions are expected and get a numeric suffix
rather than failing.

Nullable so a post insert can never race the unique index; assigned
immediately after and backfilled here.
"""

from alembic import op
import sqlalchemy as sa
import re
import unicodedata


revision = 'c9e1f2a3b4da'
down_revision = 'c9e1f2a3b4d9'
branch_labels = None
depends_on = None

# Must cover the static /in/jobs/* segments, or a slug would shadow them.
JOB_RESERVED = {"saved", "applied", "alerts", "new", "edit", "create"}
MAX_LEN = 140


def _slugify(title):
    s = unicodedata.normalize("NFKD", title or "")
    s = s.encode("ascii", "ignore").decode()
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s[:MAX_LEN].strip("-")


def upgrade():
    op.add_column('posts', sa.Column('slug', sa.String(length=MAX_LEN), nullable=True))
    op.create_index('ix_posts_slug', 'posts', ['slug'], unique=True)

    bind = op.get_bind()
    taken = set(r[0] for r in bind.execute(
        sa.text("SELECT slug FROM posts WHERE slug IS NOT NULL")).fetchall())

    rows = bind.execute(
        sa.text("SELECT id, title FROM posts WHERE slug IS NULL")).fetchall()

    for post_id, title in rows:
        base = _slugify(title) or f"job-{post_id}"
        if base in JOB_RESERVED:
            base = f"{base}-job"
        candidate = base
        n = 2
        while candidate in taken:
            candidate = f"{base}-{n}"
            n += 1
        taken.add(candidate)
        bind.execute(sa.text("UPDATE posts SET slug = :s WHERE id = :i"),
                     {"s": candidate, "i": post_id})


def downgrade():
    op.drop_index('ix_posts_slug', table_name='posts')
    op.drop_column('posts', 'slug')
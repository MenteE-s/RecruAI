""" add_organization_slug

Revision ID: c9e1f2a3b4d9
Revises: c9e1f2a3b4d8
Create Date: 2026-10-06

Company pages get a readable URL: /org/<slug> instead of /org/profile/<id>.

The slug is derived from the company name once, at creation, and then stays
fixed — renaming a company must not break the URL printed on job ads, shared
in emails and pasted into messages. Nullable so an insert can never race the
unique index; assigned immediately after and backfilled here for existing rows.
"""

from alembic import op
import sqlalchemy as sa
import re
import unicodedata


revision = 'c9e1f2a3b4d9'
down_revision = 'c9e1f2a3b4d8'
branch_labels = None
depends_on = None

# Must cover every static /org/* segment, or the slug would shadow a real page.
ORG_RESERVED = {
    "ai-agents", "analytics", "billing", "browse", "candidate-analysis",
    "candidates", "hire", "insights", "integrations", "interviews", "jobs",
    "pipeline", "profile", "reports", "team", "user", "page", "new", "edit",
    "settings", "admin", "api", "null", "undefined", "test", "demo",
}


def _slugify(name):
    s = unicodedata.normalize("NFKD", name or "")
    s = s.encode("ascii", "ignore").decode()
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s[:60].strip("-")


def upgrade():
    op.add_column('organizations', sa.Column(
        'slug', sa.String(length=60), nullable=True))
    op.create_index('ix_organizations_slug', 'organizations', ['slug'],
                    unique=True)

    bind = op.get_bind()
    taken = set(r[0] for r in bind.execute(
        sa.text("SELECT slug FROM organizations WHERE slug IS NOT NULL")
    ).fetchall())

    rows = bind.execute(
        sa.text("SELECT id, name FROM organizations WHERE slug IS NULL")
    ).fetchall()

    for org_id, name in rows:
        base = _slugify(name)
        if not base:
            base = f"org-{org_id}"
        if base in ORG_RESERVED:
            base = f"{base}-org"
        candidate = base
        n = 2
        while candidate in taken:
            candidate = f"{base}-{n}"
            n += 1
        taken.add(candidate)
        bind.execute(
            sa.text("UPDATE organizations SET slug = :s WHERE id = :i"),
            {"s": candidate, "i": org_id},
        )


def downgrade():
    op.drop_index('ix_organizations_slug', table_name='organizations')
    op.drop_column('organizations', 'slug')
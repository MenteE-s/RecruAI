"""Keep exactly one default plan per scope.

Revision ID: b1c2d3e4f5a6
Revises: f2a3b4c5d6e7
Create Date: 2026-10-28

The original seed marked every seeded row as the default for its scope, which
meant the free and paid tiers were both protected from deletion in the admin
dashboard. Only the free tier is a default; premium plans are opt-in.
"""

from alembic import op


revision = "b1c2d3e4f5a6"
down_revision = "f2a3b4c5d6e7"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("UPDATE plans SET is_default = FALSE")
    op.execute("UPDATE plans SET is_default = TRUE WHERE slug = 'free'")


def downgrade():
    # The previous revision considered the four seeded rows (free/premium in
    # each scope) defaults; do not drag custom admin-created plans into that.
    op.execute(
        "UPDATE plans SET is_default = TRUE "
        "WHERE slug IN ('free', 'premium')"
    )

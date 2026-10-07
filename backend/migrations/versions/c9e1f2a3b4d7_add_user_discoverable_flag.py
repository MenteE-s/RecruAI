""" add_user_discoverable_flag

Revision ID: c9e1f2a3b4d7
Revises: c9e1f2a3b4d6
Create Date: 2026-10-06

Adds `users.is_discoverable`, the people-side counterpart to the page-level
`organizations.is_public` added in c9e1f2a3b4d6.

Universal search needs an opt-out: without it, every account is searchable and
there is no way to say otherwise. Defaults to TRUE so existing accounts stay
discoverable and applying this migration changes no behaviour on its own.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c9e1f2a3b4d7'
down_revision = 'c9e1f2a3b4d6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column(
        'is_discoverable', sa.Boolean(), nullable=False, server_default=sa.true()))
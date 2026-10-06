""" add_page_visibility_settings

Revision ID: c9e1f2a3b4d6
Revises: c9e1f2a3b4d5
Create Date: 2026-10-06

Visibility controls for a company page, surfaced in the page manager under
"Visibility". Defaults match the pre-migration behaviour (everything visible /
open), so applying this changes nothing until an admin toggles a switch.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c9e1f2a3b4d6'
down_revision = 'c9e1f2a3b4d5'
branch_labels = None
depends_on = None


def upgrade():
    # Discoverable in the org directory / search / autocomplete.
    op.add_column('organizations', sa.Column(
        'is_public', sa.Boolean(), nullable=False, server_default=sa.true()))
    # Open roles show an apply path on the public page.
    op.add_column('organizations', sa.Column(
        'accepting_applications', sa.Boolean(), nullable=False, server_default=sa.true()))
    # Publicly show follower / view counts.
    op.add_column('organizations', sa.Column(
        'show_public_stats', sa.Boolean(), nullable=False, server_default=sa.true()))


def downgrade():
    op.drop_column('organizations', 'show_public_stats')
    op.drop_column('organizations', 'accepting_applications')
    op.drop_column('organizations', 'is_public')
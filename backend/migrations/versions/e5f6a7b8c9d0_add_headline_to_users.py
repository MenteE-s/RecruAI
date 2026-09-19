""" add_headline_to_users

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-09-19

Professional headline shown under the user's name (e.g. 'Web Developer').
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('headline', sa.String(200), nullable=True))


def downgrade():
    op.drop_column('users', 'headline')

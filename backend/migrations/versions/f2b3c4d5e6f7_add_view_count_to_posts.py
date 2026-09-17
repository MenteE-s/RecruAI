""" add_view_count_to_posts

Revision ID: f2b3c4d5e6f7
Revises: e7f8a9b0c1d2
Create Date: 2026-09-16

Persistent detail-view counter for job posts. Existing posts start at 0.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f2b3c4d5e6f7'
down_revision = 'e7f8a9b0c1d2'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('posts', sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'))


def downgrade():
    op.drop_column('posts', 'view_count')

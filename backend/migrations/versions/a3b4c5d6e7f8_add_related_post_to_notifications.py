""" add_related_post_to_notifications

Revision ID: a3b4c5d6e7f8
Revises: f2b3c4d5e6f7
Create Date: 2026-09-16

Links notifications (e.g. new-job posts for followed companies)
directly to a job post.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a3b4c5d6e7f8'
down_revision = 'f2b3c4d5e6f7'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('notifications', sa.Column('related_post_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_notifications_related_post_id', 'notifications', 'posts', ['related_post_id'], ['id'])


def downgrade():
    op.drop_constraint('fk_notifications_related_post_id', 'notifications', type_='foreignkey')
    op.drop_column('notifications', 'related_post_id')

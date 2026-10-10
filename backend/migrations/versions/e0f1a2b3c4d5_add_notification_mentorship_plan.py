"""CVAI B3: notifications can point at a mentorship plan

Revision ID: e0f1a2b3c4d5
Revises: d9e0f1a2b3c4
Create Date: 2026-10-09

Notification carries a narrow set of related_* foreign keys and no generic
target, so a stale-plan nudge had nowhere to point. Adding one nullable column
is cheaper and clearer than a polymorphic target table nobody else needs yet.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'e0f1a2b3c4d5'
down_revision = 'd9e0f1a2b3c4'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('notifications', sa.Column('related_mentorship_plan_id', sa.Integer(),
                                              nullable=True))
    op.create_foreign_key('fk_notifications_mentorship_plan',
                          'notifications', 'mentorship_plans',
                          ['related_mentorship_plan_id'], ['id'])


def downgrade():
    op.drop_constraint('fk_notifications_mentorship_plan', 'notifications',
                       type_='foreignkey')
    op.drop_column('notifications', 'related_mentorship_plan_id')
"""add referral columns to users

Revision ID: a1b2c3d4e5f6
Revises: f59d360ea37a
Create Date: 2026-09-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'f59d360ea37a'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('referred_by_email', sa.String(120), nullable=True))
        batch_op.add_column(sa.Column('referred_by_user_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key(None, 'users', ['referred_by_user_id'], ['id'])


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.drop_column('referred_by_user_id')
        batch_op.drop_column('referred_by_email')

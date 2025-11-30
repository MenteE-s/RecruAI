"""Merge current heads 54d7170d9183, 6bbc20cdf1a1, 75734ff14319, 97026d9fb2ef

Revision ID: merge_all_current_heads_54d7170_6bbc20c_75734ff_97026d
Revises: 54d7170d9183, 6bbc20cdf1a1, 75734ff14319, 97026d9fb2ef
Create Date: 2025-11-30 14:30:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'merge_all_current_heads_54d7170_6bbc20c_75734ff_97026d'
down_revision = ('54d7170d9183', '6bbc20cdf1a1', '75734ff14319', '97026d9fb2ef')
branch_labels = None
depends_on = None


def upgrade():
    # no-op: this is a merge migration to unify multiple heads
    pass


def downgrade():
    # no-op: do not attempt to split merged heads
    pass

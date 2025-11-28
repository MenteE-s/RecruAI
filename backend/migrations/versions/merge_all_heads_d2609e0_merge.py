"""merge d2609e0b1b17 and merge_d93ab0_97a552ec

Revision ID: merge_all_heads_d2609e0
Revises: d2609e0b1b17, merge_d93ab0_97a552ec
Create Date: 2025-11-20 00:00:00.000100

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'merge_all_heads_d2609e0'
down_revision = ('d2609e0b1b17', 'merge_d93ab0_97a552ec')
branch_labels = None
depends_on = None


def upgrade():
    # No schema changes — this merge resolves multiple heads so future migrations run.
    pass


def downgrade():
    # no-op
    pass

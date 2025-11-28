"""merge heads d93ab0edabd0 and 97a552ecf1a4

Revision ID: merge_d93ab0_97a552ec
Revises: d93ab0edabd0, 97a552ecf1a4
Create Date: 2025-11-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'merge_d93ab0_97a552ec'
down_revision = ('d93ab0edabd0', '97a552ecf1a4')
branch_labels = None
depends_on = None


def upgrade():
    # this migration only merges multiple heads to create a single "head" for future migrations
    pass


def downgrade():
    # no-op: do not attempt to split merged heads in a downgrade
    pass

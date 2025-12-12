"""Merge migration for multiple heads

Revision ID: 71e2b22e99ad
Revises: 94c965070c31, f2d98073b6de
Create Date: 2025-12-12 11:50:49.891385

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '71e2b22e99ad'
down_revision = ('94c965070c31', 'f2d98073b6de')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
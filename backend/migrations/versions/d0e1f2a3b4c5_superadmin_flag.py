"""Platform superadmin flag on users.

Revision ID: d0e1f2a3b4c5
Revises: c9d0e1f2a3b4
Create Date: 2026-10-27

Adds users.is_superadmin. Org "Admin" is per-company; superadmin is
platform-wide and gates /api/admin/*. Set only via
scripts/grant_superadmin.py or by an existing superadmin — never self-granted
by an endpoint.
"""

from alembic import op
import sqlalchemy as sa


revision = "d0e1f2a3b4c5"
down_revision = "c9d0e1f2a3b4"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(
            sa.Column("is_superadmin", sa.Boolean(), nullable=False, server_default="0")
        )


def downgrade():
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("is_superadmin")

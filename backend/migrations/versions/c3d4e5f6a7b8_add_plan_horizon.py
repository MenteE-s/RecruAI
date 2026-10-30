"""Add a planning horizon and deferred full-path steps.

Revision ID: c3d4e5f6a7b8
Revises: b1c2d3e4f5a6
Create Date: 2026-10-30
"""

from alembic import op
import sqlalchemy as sa


revision = "c3d4e5f6a7b8"
down_revision = "b1c2d3e4f5a6"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "mentorship_plans",
        sa.Column("target_weeks", sa.Integer(), nullable=True),
    )
    op.add_column(
        "mentorship_plans",
        sa.Column("deferred_steps", sa.Text(), nullable=True),
    )


def downgrade():
    op.drop_column("mentorship_plans", "deferred_steps")
    op.drop_column("mentorship_plans", "target_weeks")

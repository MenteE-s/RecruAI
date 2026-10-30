"""Transactional outbox for background work

Revision ID: c9d0e1f2a3b4
Revises: b8c9d0e1f2a3
Create Date: 2026-10-26

The API writes domain rows + outbox rows in one transaction; outbox-worker
processes deliver email/Kafka/notifications with retries. No code reads this
table except the worker and the health endpoint, so all indexes serve the
claim query (status, next_run_at) plus operator debugging (type, created_at).
"""

from alembic import op
import sqlalchemy as sa


revision = "c9d0e1f2a3b4"
down_revision = "b8c9d0e1f2a3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "outbox_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_id", sa.String(64), nullable=False, unique=True),
        sa.Column("type", sa.String(64), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(16), nullable=False, server_default="pending"),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_attempts", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("next_run_at", sa.DateTime(), nullable=False),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("locked_by", sa.String(255), nullable=True),
        sa.Column("locked_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_outbox_status_next_run", "outbox_events", ["status", "next_run_at"])
    op.create_index("ix_outbox_type", "outbox_events", ["type"])
    op.create_index("ix_outbox_created_at", "outbox_events", ["created_at"])


def downgrade():
    op.drop_index("ix_outbox_created_at", table_name="outbox_events")
    op.drop_index("ix_outbox_type", table_name="outbox_events")
    op.drop_index("ix_outbox_status_next_run", table_name="outbox_events")
    op.drop_table("outbox_events")

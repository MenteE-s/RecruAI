"""Admin-managed AI provider configuration.

Revision ID: e1f2a3b4c5d6
Revises: d0e1f2a3b4c5
Create Date: 2026-10-27

One active LLM config and one active embedding config at a time. Env vars
remain the fallback for local dev and for the very first boot before any row
exists; the admin dashboard (or grant_superadmin + a curl) seeds the first row.
"""

from alembic import op
import sqlalchemy as sa


revision = "e1f2a3b4c5d6"
down_revision = "8adb4b6556fa"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "ai_provider_configs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("provider", sa.String(32), nullable=False),
        sa.Column("model", sa.String(128), nullable=False),
        sa.Column("api_key_enc", sa.Text(), nullable=True),
        sa.Column("base_url", sa.String(512), nullable=True),
        sa.Column("dimensions", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_ai_provider_configs_kind_active", "ai_provider_configs", ["kind", "is_active"])


def downgrade():
    op.drop_index("ix_ai_provider_configs_kind_active", table_name="ai_provider_configs")
    op.drop_table("ai_provider_configs")

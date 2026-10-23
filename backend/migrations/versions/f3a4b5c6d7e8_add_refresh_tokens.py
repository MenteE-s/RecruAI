"""Add rotating refresh-token sessions

Revision ID: f3a4b5c6d7e8
Revises: a8b9c0d1e2f3
Create Date: 2026-10-23

Access tokens stay short-lived and are held in frontend memory. Only a
SHA-256 hash of each opaque refresh token is stored; family_id groups rotated
tokens so replay of an old token can revoke the whole session.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "f3a4b5c6d7e8"
down_revision = "a8b9c0d1e2f3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("family_id", sa.String(length=64), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("used_at", sa.DateTime(), nullable=True),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index(
        "ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"], unique=False
    )
    op.create_index(
        "ix_refresh_tokens_family_id", "refresh_tokens", ["family_id"], unique=False
    )


def downgrade():
    op.drop_index("ix_refresh_tokens_family_id", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_user_id", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")

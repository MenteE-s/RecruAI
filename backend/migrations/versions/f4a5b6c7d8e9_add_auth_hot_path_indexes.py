"""Add hot-path indexes for auth, OTP, and invitation lookups

Revision ID: f4a5b6c7d8e9
Revises: f3a4b5c6d7e8
Create Date: 2026-10-23

At a million users the existing constraints are not enough:

- Password reset loads the latest OTP by (user_id, purpose) and orders by
  created_at; email_otps only had the primary key.
- Case-insensitive user lookup uses lower(email), which bypasses the
  case-sensitive unique index on users.email.
- Invitation resend/rate-limit checks filter one org plus lower(email); the
  separate organization_id and email indexes force a bitmap/scan combination.

These are non-unique indexes. Uniqueness is still enforced by the existing
constraints; making the lower(email) expression unique could fail on legacy
addresses that differ only by case, so the migration does not take that risk.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "f4a5b6c7d8e9"
down_revision = "f3a4b5c6d7e8"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(
        "ix_email_otps_user_purpose_created",
        "email_otps",
        ["user_id", "purpose", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_users_email_lower",
        "users",
        [sa.text("lower(email)")],
        unique=False,
    )
    op.create_index(
        "ix_org_invitations_org_email_lower",
        "organization_invitations",
        ["organization_id", sa.text("lower(email)")],
        unique=False,
    )


def downgrade():
    op.drop_index(
        "ix_org_invitations_org_email_lower",
        table_name="organization_invitations",
    )
    op.drop_index("ix_users_email_lower", table_name="users")
    op.drop_index("ix_email_otps_user_purpose_created", table_name="email_otps")

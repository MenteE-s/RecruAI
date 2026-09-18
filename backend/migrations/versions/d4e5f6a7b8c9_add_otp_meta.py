""" add_otp_meta

Revision ID: d4e5f6a7b8c9
Revises: c9d8e7f6a5b4
Create Date: 2026-09-18

Carries the pending new address on change-email OTPs so a code issued for
one address can never claim a different one.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd4e5f6a7b8c9'
down_revision = 'c9d8e7f6a5b4'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('email_otps', sa.Column('meta', sa.String(255), nullable=True))


def downgrade():
    op.drop_column('email_otps', 'meta')

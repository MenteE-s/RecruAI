""" add_email_verification

Revision ID: c9d8e7f6a5b4
Revises: a3b4c5d6e7f8
Create Date: 2026-09-18

Email OTP verification: adds email_verified flags to users (existing
accounts are grandfathered as verified) plus the email_otps table that
stores only SHA-256 hashes of single-use codes.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c9d8e7f6a5b4'
down_revision = 'a3b4c5d6e7f8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=True))
    op.add_column('users', sa.Column('email_verified_at', sa.DateTime(), nullable=True))
    # Grandfather pre-existing accounts so nobody is locked out.
    op.execute("UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL")
    op.alter_column('users', 'email_verified',
                    existing_type=sa.Boolean(), nullable=False, server_default='false')

    op.create_table(
        'email_otps',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('purpose', sa.String(32), nullable=False, server_default='verify_email'),
        sa.Column('code_hash', sa.String(64), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('consumed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_email_otps_user_id', 'email_otps', ['user_id'])


def downgrade():
    op.drop_index('ix_email_otps_user_id', table_name='email_otps')
    op.drop_table('email_otps')
    op.drop_column('users', 'email_verified_at')
    op.drop_column('users', 'email_verified')

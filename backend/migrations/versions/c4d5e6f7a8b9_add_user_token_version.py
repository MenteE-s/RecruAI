"""Add a token version so password changes can revoke every existing JWT

Revision ID: c4d5e6f7a8b9
Revises: b3c4d5e6f7a8
Create Date: 2026-10-22

Without a per-user version, revoking a password change means remembering every
outstanding JTI until it expires. The version is copied into each new access
token; bumping it invalidates all older tokens on the next request.

Existing users start at 0, so tokens issued before this migration remain valid
until they log out or change/reset their password.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c4d5e6f7a8b9'
down_revision = 'b3c4d5e6f7a8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'users',
        sa.Column('token_version', sa.Integer(), nullable=False, server_default='0'),
    )
    # Make the intent explicit for existing rows on backends that do not
    # backfill from server_default.
    op.execute("UPDATE users SET token_version = 0 WHERE token_version IS NULL")


def downgrade():
    op.drop_column('users', 'token_version')

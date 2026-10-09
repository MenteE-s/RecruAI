"""Give every account a 50k AI token allowance

Revision ID: b7c8d9e0f1a2
Revises: a4b5c6d7e8f9
Create Date: 2026-10-09

There is no billing in the MVP, so tier limits alone were the wrong shape: every
account is trial-or-lapsed, and the daily ceiling meant the same problem all over
every day. Instead each account gets one allowance it can spend, and everyone
starts with the same one because testing needs everybody able to use the AI
features.

Two halves, both needed:
  * server_default on the column  -> every account created from now on gets it
  * explicit UPDATE              -> every account that already exists gets it too
                                    (PostgreSQL would backfill from the default,
                                    but the UPDATE states the intent and keeps
                                    this correct on backends that do not)

tokens_used is a cumulative counter incremented by User.track_token_usage, so an
allowance is simply "used < allowance". It is not reset on a schedule.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b7c8d9e0f1a2'
down_revision = 'a4b5c6d7e8f9'
branch_labels = None
depends_on = None

ALLOWANCE = 50000


def upgrade():
    op.add_column(
        'users',
        sa.Column('token_allowance', sa.Integer(), nullable=False,
                  server_default=str(ALLOWANCE)),
    )
    # Existing accounts, stated explicitly rather than relying on the column
    # default's backfill behaviour.
    op.execute(f"UPDATE users SET token_allowance = {ALLOWANCE}")


def downgrade():
    op.drop_column('users', 'token_allowance')
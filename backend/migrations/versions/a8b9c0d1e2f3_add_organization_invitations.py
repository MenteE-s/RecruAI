"""Add organization invitations

Revision ID: a8b9c0d1e2f3
Revises: c4d5e6f7a8b9
Create Date: 2026-10-22

Invitations are deliberately separate from users. The old flow created a User
with a random password at invite time and immediately added a TeamMember row,
which made the address unregisterable and left the invitee with no way to sign
in. This table stores only a hashed single-use token; accepting the invitation
is what creates the account (or attaches an existing one).
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a8b9c0d1e2f3'
down_revision = 'c4d5e6f7a8b9'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'organization_invitations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('role', sa.String(length=100), nullable=False, server_default='Member'),
        sa.Column('permissions', sa.Text(), nullable=True),
        sa.Column('join_date', sa.Date(), nullable=True),
        sa.Column('invited_by_id', sa.Integer(), nullable=True),
        sa.Column('accepted_by_id', sa.Integer(), nullable=True),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('accepted_at', sa.DateTime(), nullable=True),
        sa.Column('revoked_at', sa.DateTime(), nullable=True),
        sa.Column('last_sent_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['invited_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['accepted_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token_hash'),
    )
    op.create_index(
        'ix_organization_invitations_organization_id',
        'organization_invitations',
        ['organization_id'],
    )
    op.create_index(
        'ix_organization_invitations_email',
        'organization_invitations',
        ['email'],
    )
    op.create_index(
        'ix_organization_invitations_token_hash',
        'organization_invitations',
        ['token_hash'],
    )


def downgrade():
    op.drop_index('ix_organization_invitations_token_hash', table_name='organization_invitations')
    op.drop_index('ix_organization_invitations_email', table_name='organization_invitations')
    op.drop_index('ix_organization_invitations_organization_id', table_name='organization_invitations')
    op.drop_table('organization_invitations')

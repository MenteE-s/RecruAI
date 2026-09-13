""" add_payment_methods_table

Revision ID: d5e6f7a8b9c0
Revises: a1b2c3d4e5f6
Create Date: 2026-09-13

Stores card metadata only (brand, last4, expiry, holder). No PAN/CVC
columns exist by design — those must never be persisted.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd5e6f7a8b9c0'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('payment_methods',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('organization_id', sa.Integer(), nullable=True),
    sa.Column('brand', sa.String(length=20), nullable=False),
    sa.Column('last4', sa.String(length=4), nullable=False),
    sa.Column('exp_month', sa.Integer(), nullable=False),
    sa.Column('exp_year', sa.Integer(), nullable=False),
    sa.Column('cardholder_name', sa.String(length=120), nullable=False),
    sa.Column('is_default', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('payment_methods')

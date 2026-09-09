"""link experiences to organizations

Revision ID: f59d360ea37a
Revises: 883c10d41dbd
Create Date: 2026-09-09 23:48:49.598724

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f59d360ea37a'
down_revision = '883c10d41dbd'
branch_labels = None
depends_on = None


def upgrade():
    # Trimmed to this feature only: unrelated embedding-index drift detected
    # by autogenerate is intentionally left out.
    with op.batch_alter_table('experiences', schema=None) as batch_op:
        batch_op.add_column(sa.Column('organization_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key(None, 'organizations', ['organization_id'], ['id'])


def downgrade():
    with op.batch_alter_table('experiences', schema=None) as batch_op:
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.drop_column('organization_id')

"""change embedding to vector type

Revision ID: 883c10d41dbd
Revises: 16a2e1405bc0
Create Date: 2026-05-23 07:29:20.588189

"""
from alembic import op
import sqlalchemy as sa
import pgvector


# revision identifiers, used by Alembic.
revision = '883c10d41dbd'
down_revision = '16a2e1405bc0'
branch_labels = None
depends_on = None


def upgrade():
    # Tables are empty — drop old text column and add vector column
    for table in ['recommendation_agent_embeddings', 'recommendation_job_embeddings', 'recommendation_profile_embeddings']:
        with op.batch_alter_table(table, schema=None) as batch_op:
            batch_op.drop_column('embedding')
            batch_op.add_column(sa.Column('embedding', pgvector.sqlalchemy.Vector(dim=384), nullable=False))


def downgrade():
    for table in ['recommendation_agent_embeddings', 'recommendation_job_embeddings', 'recommendation_profile_embeddings']:
        with op.batch_alter_table(table, schema=None) as batch_op:
            batch_op.drop_column('embedding')
            batch_op.add_column(sa.Column('embedding', sa.Text(), nullable=False))

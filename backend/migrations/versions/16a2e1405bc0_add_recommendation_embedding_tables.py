"""add recommendation embedding tables

Revision ID: 16a2e1405bc0
Revises: c2ebf0a29b10
Create Date: 2025-12-16 14:45:07.195280

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '16a2e1405bc0'
down_revision = 'c2ebf0a29b10'
branch_labels = None
depends_on = None


def upgrade():
    # Create profile embeddings table
    op.create_table('recommendation_profile_embeddings',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.String(length=255), nullable=False),
        sa.Column('organization_id', sa.String(length=255), nullable=True),
        sa.Column('profile_content', sa.Text(), nullable=False),
        sa.Column('embedding', sa.Text(), nullable=False),  # Using Text for fallback, pgvector would use VECTOR
        sa.Column('skills_count', sa.Integer(), nullable=True),
        sa.Column('experience_years', sa.Float(), nullable=True),
        sa.Column('education_level', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_recommendation_profile_embeddings_organization_id'), 'recommendation_profile_embeddings', ['organization_id'], unique=False)
    op.create_index(op.f('ix_recommendation_profile_embeddings_user_id'), 'recommendation_profile_embeddings', ['user_id'], unique=False)

    # Create job embeddings table
    op.create_table('recommendation_job_embeddings',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('job_id', sa.String(length=255), nullable=False),
        sa.Column('organization_id', sa.String(length=255), nullable=True),
        sa.Column('job_content', sa.Text(), nullable=False),
        sa.Column('embedding', sa.Text(), nullable=False),
        sa.Column('job_title', sa.String(length=255), nullable=False),
        sa.Column('industry', sa.String(length=100), nullable=True),
        sa.Column('experience_required', sa.Float(), nullable=True),
        sa.Column('skills_required', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('job_id')
    )
    op.create_index(op.f('ix_recommendation_job_embeddings_job_id'), 'recommendation_job_embeddings', ['job_id'], unique=False)
    op.create_index(op.f('ix_recommendation_job_embeddings_organization_id'), 'recommendation_job_embeddings', ['organization_id'], unique=False)

    # Create agent embeddings table
    op.create_table('recommendation_agent_embeddings',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('agent_id', sa.String(length=255), nullable=False),
        sa.Column('organization_id', sa.String(length=255), nullable=True),
        sa.Column('agent_content', sa.Text(), nullable=False),
        sa.Column('embedding', sa.Text(), nullable=False),
        sa.Column('agent_name', sa.String(length=255), nullable=False),
        sa.Column('industry', sa.String(length=100), nullable=True),
        sa.Column('interview_type', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('agent_id')
    )
    op.create_index(op.f('ix_recommendation_agent_embeddings_agent_id'), 'recommendation_agent_embeddings', ['agent_id'], unique=False)
    op.create_index(op.f('ix_recommendation_agent_embeddings_organization_id'), 'recommendation_agent_embeddings', ['organization_id'], unique=False)


def downgrade():
    op.drop_table('recommendation_agent_embeddings')
    op.drop_table('recommendation_job_embeddings')
    op.drop_table('recommendation_profile_embeddings')

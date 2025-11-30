"""add_pipeline_stage_to_applications

Revision ID: add_pipeline_stage
Revises: f1234567890a
Create Date: 2025-11-30 14:16:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_pipeline_stage'
down_revision = 'f1234567890a'
branch_labels = None
depends_on = None


def upgrade():
    # Add pipeline_stage column to applications table
    op.add_column('applications', sa.Column('pipeline_stage', sa.String(length=50), nullable=True, default='applied'))


def downgrade():
    # Remove pipeline_stage column from applications table
    op.drop_column('applications', 'pipeline_stage')
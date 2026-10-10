"""CVAI C2: guided projects — build-it work judged against authored criteria

Revision ID: a2b3c4d5e6f7
Revises: f1a2b3c4d5e6
Create Date: 2026-10-09

guided_projects         authored brief: ordered steps + acceptance criteria
guided_project_attempts per-user runs, keeping the submission and its review

steps, acceptance_criteria and skill_slugs are JSON rather than child tables: a
project brief is a document that is read whole, not a relation that is queried
across. Naming avoids `projects`, which is the resume-entry table.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a2b3c4d5e6f7'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'guided_projects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('slug', sa.String(length=80), nullable=False),
        sa.Column('title', sa.String(length=160), nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('difficulty', sa.String(length=20), nullable=True),
        sa.Column('steps', sa.Text(), nullable=True),
        sa.Column('acceptance_criteria', sa.Text(), nullable=True),
        sa.Column('skill_slugs', sa.Text(), nullable=True),
        sa.Column('estimated_hours', sa.Integer(), nullable=True),
        sa.Column('pass_percent', sa.Integer(), nullable=False, server_default='70'),
        sa.Column('is_free_preview', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_by_user_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )

    op.create_table(
        'guided_project_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='in_progress'),
        sa.Column('review_status', sa.String(length=20), nullable=False, server_default='none'),
        sa.Column('current_step', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('submission', sa.Text(), nullable=True),
        sa.Column('review', sa.Text(), nullable=True),
        sa.Column('score_percent', sa.Float(), nullable=True),
        sa.Column('passed', sa.Boolean(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['guided_projects.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('guided_project_attempts', schema=None) as batch_op:
        batch_op.create_index('ix_guided_project_attempts_project_id', ['project_id'], unique=False)
        batch_op.create_index('ix_guided_project_attempts_user_id', ['user_id'], unique=False)


def downgrade():
    op.drop_index('ix_guided_project_attempts_user_id', table_name='guided_project_attempts')
    op.drop_index('ix_guided_project_attempts_project_id', table_name='guided_project_attempts')
    op.drop_table('guided_project_attempts')
    op.drop_table('guided_projects')

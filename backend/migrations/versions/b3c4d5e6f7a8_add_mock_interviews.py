"""CVAI C3: mock interviews — a practice session with phases and honest feedback

Revision ID: b3c4d5e6f7a8
Revises: a2b3c4d5e6f7
Create Date: 2026-10-10

mock_interviews               one practice session; phase is server-owned
mock_interview_questions      open questions, tagged by the phase they belong to

mock_interview_questions is a separate table from skill_questions on purpose:
that one is multiple-choice with a required answer key, and an interview question
has no answer. Forcing them together would have meant inventing one.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b3c4d5e6f7a8'
down_revision = 'a2b3c4d5e6f7'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'mock_interviews',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('post_id', sa.Integer(), nullable=True),
        sa.Column('target_role', sa.String(length=160), nullable=True),
        sa.Column('skill_slugs', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='in_progress'),
        sa.Column('review_status', sa.String(length=20), nullable=False, server_default='none'),
        sa.Column('current_phase', sa.String(length=30), nullable=False, server_default='greeting'),
        sa.Column('phase_turns', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('transcript', sa.Text(), nullable=True),
        sa.Column('asked_questions', sa.Text(), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('overall_score', sa.Float(), nullable=True),
        sa.Column('passed', sa.Boolean(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('mock_interviews', schema=None) as batch_op:
        batch_op.create_index('ix_mock_interviews_user_id', ['user_id'], unique=False)

    op.create_table(
        'mock_interview_questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('phase', sa.String(length=30), nullable=False),
        sa.Column('skill_slug', sa.String(length=64), nullable=True),
        sa.Column('level_tested', sa.String(length=50), nullable=True),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('guidance', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_by_user_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('mock_interview_questions', schema=None) as batch_op:
        batch_op.create_index('ix_mock_interview_questions_phase', ['phase'], unique=False)
        batch_op.create_index('ix_mock_interview_questions_skill_slug', ['skill_slug'], unique=False)


def downgrade():
    op.drop_index('ix_mock_interview_questions_skill_slug', table_name='mock_interview_questions')
    op.drop_index('ix_mock_interview_questions_phase', table_name='mock_interview_questions')
    op.drop_table('mock_interview_questions')
    op.drop_index('ix_mock_interviews_user_id', table_name='mock_interviews')
    op.drop_table('mock_interviews')

"""CVAI A4: skill assessment bank + attempt history

Revision ID: a4b5c6d7e8f9
Revises: 48e75664236e
Create Date: 2026-10-09

Two tables:

  skill_questions      the authored question bank, tagged by taxonomy slug
  skill_assessments    a user's run and the level it awarded

skill_slug is a plain string, not a foreign key. The taxonomy lives in code
(backend/utils/skill_taxonomy.py), so an FK would have nothing to point at and
could dangle; the API is what validates a slug before writing one.

attempts is append-only by design. Progress tracking re-measures skill levels
over time, which is impossible if a retake overwrites the previous score.

Answers and feedback are JSON-in-text, matching the house pattern elsewhere
(interview.analysis_data, project.technologies).
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a4b5c6d7e8f9'
down_revision = '48e75664236e'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'skill_questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('skill_slug', sa.String(length=64), nullable=False),
        sa.Column('prompt', sa.Text(), nullable=False),
        sa.Column('options', sa.Text(), nullable=True),
        sa.Column('correct_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('difficulty', sa.Integer(), nullable=True, server_default='1'),
        sa.Column('level_tested', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_by_user_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('skill_questions', schema=None) as batch_op:
        batch_op.create_index('ix_skill_questions_skill_slug', ['skill_slug'], unique=False)

    op.create_table(
        'skill_assessments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('skill_slug', sa.String(length=64), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='in_progress'),
        sa.Column('answers', sa.Text(), nullable=True),
        sa.Column('total_questions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('correct_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('level_awarded', sa.String(length=50), nullable=True),
        sa.Column('score_percent', sa.Float(), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('skill_assessments', schema=None) as batch_op:
        batch_op.create_index('ix_skill_assessments_user_id', ['user_id'], unique=False)
        batch_op.create_index('ix_skill_assessments_skill_slug', ['skill_slug'], unique=False)


def downgrade():
    op.drop_index('ix_skill_assessments_skill_slug', table_name='skill_assessments')
    op.drop_index('ix_skill_assessments_user_id', table_name='skill_assessments')
    op.drop_table('skill_assessments')
    op.drop_index('ix_skill_questions_skill_slug', table_name='skill_questions')
    op.drop_table('skill_questions')
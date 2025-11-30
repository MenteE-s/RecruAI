"""Add cascade delete for conversation_memories foreign key

Revision ID: 7d83b6d8e9cd
Revises: 326e2b7f8b71
Create Date: 2025-12-01 02:21:48.947081

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7d83b6d8e9cd'
down_revision = '326e2b7f8b71'
branch_labels = None
depends_on = None


def upgrade():
    # Drop existing foreign key constraints and recreate with CASCADE DELETE
    with op.batch_alter_table('conversation_memories', schema=None) as batch_op:
        batch_op.drop_constraint('conversation_memories_interview_id_fkey', type_='foreignkey')
        batch_op.create_foreign_key(
            'conversation_memories_interview_id_fkey',
            'interviews',
            ['interview_id'],
            ['id'],
            ondelete='CASCADE'
        )

    with op.batch_alter_table('messages', schema=None) as batch_op:
        batch_op.drop_constraint('messages_interview_id_fkey', type_='foreignkey')
        batch_op.create_foreign_key(
            'messages_interview_id_fkey',
            'interviews',
            ['interview_id'],
            ['id'],
            ondelete='CASCADE'
        )

    with op.batch_alter_table('interview_analyses', schema=None) as batch_op:
        batch_op.drop_constraint('interview_analyses_interview_id_fkey', type_='foreignkey')
        batch_op.create_foreign_key(
            'interview_analyses_interview_id_fkey',
            'interviews',
            ['interview_id'],
            ['id'],
            ondelete='CASCADE'
        )


def downgrade():
    # Drop CASCADE DELETE foreign key constraints and recreate without CASCADE
    with op.batch_alter_table('conversation_memories', schema=None) as batch_op:
        batch_op.drop_constraint('conversation_memories_interview_id_fkey', type_='foreignkey')
        batch_op.create_foreign_key(
            'conversation_memories_interview_id_fkey',
            'interviews',
            ['interview_id'],
            ['id']
        )

    with op.batch_alter_table('messages', schema=None) as batch_op:
        batch_op.drop_constraint('messages_interview_id_fkey', type_='foreignkey')
        batch_op.create_foreign_key(
            'messages_interview_id_fkey',
            'interviews',
            ['interview_id'],
            ['id']
        )

    with op.batch_alter_table('interview_analyses', schema=None) as batch_op:
        batch_op.drop_constraint('interview_analyses_interview_id_fkey', type_='foreignkey')
        batch_op.create_foreign_key(
            'interview_analyses_interview_id_fkey',
            'interviews',
            ['interview_id'],
            ['id']
        )

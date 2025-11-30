"""Add cascade delete for messages and interview_analyses foreign keys

Revision ID: 4978e1a66608
Revises: 7d83b6d8e9cd
Create Date: 2025-12-01 02:23:41.299856

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4978e1a66608'
down_revision = '7d83b6d8e9cd'
branch_labels = None
depends_on = None


def upgrade():
    # Add CASCADE DELETE to messages and interview_analyses foreign keys
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
    # Remove CASCADE DELETE from messages and interview_analyses foreign keys
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

"""Add ConversationMessage model and persona field to AIInterviewAgent

Revision ID: 7a9c265ed3a7
Revises: 48e4773232bc
Create Date: 2025-12-14 18:33:44.492794

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7a9c265ed3a7'
down_revision = '48e4773232bc'
branch_labels = None
depends_on = None


def upgrade():
    # Add persona field to ai_interview_agents table
    op.add_column('ai_interview_agents', sa.Column('persona', sa.String(length=255), nullable=True))

    # Create conversation_messages table
    op.create_table('conversation_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('interview_id', sa.Integer(), nullable=False),
        sa.Column('sender_type', sa.String(length=20), nullable=False),
        sa.Column('sender_user_id', sa.Integer(), nullable=True),
        sa.Column('sender_agent_id', sa.Integer(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['interview_id'], ['interviews.id'], ),
        sa.ForeignKeyConstraint(['sender_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['sender_agent_id'], ['ai_interview_agents.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    # Add check constraint for sender attribution
    op.create_check_constraint(
        'sender_attribution_check',
        'conversation_messages',
        "(sender_type = 'user' AND sender_user_id IS NOT NULL AND sender_agent_id IS NULL) OR "
        "(sender_type = 'agent' AND sender_agent_id IS NOT NULL AND sender_user_id IS NULL)"
    )


def downgrade():
    # Remove check constraint
    op.drop_constraint('sender_attribution_check', 'conversation_messages', type_='check')
    # Drop conversation_messages table
    op.drop_table('conversation_messages')
    # Remove persona column
    op.drop_column('ai_interview_agents', 'persona')

"""Update sender_attribution_check constraint to support practice agents

Revision ID: 6e3a22a95edc
Revises: 68a337b32199
Create Date: 2025-12-14 21:08:00.307610

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6e3a22a95edc'
down_revision = '68a337b32199'
branch_labels = None
depends_on = None


def upgrade():
    # Drop the old check constraint
    op.drop_constraint('sender_attribution_check', 'conversation_messages', type_='check')
    
    # Create the new check constraint that supports practice agents
    op.create_check_constraint(
        'sender_attribution_check',
        'conversation_messages',
        "(sender_type = 'user' AND sender_user_id IS NOT NULL AND sender_agent_id IS NULL AND sender_practice_agent_id IS NULL) OR "
        "(sender_type = 'agent' AND ((sender_agent_id IS NOT NULL AND sender_practice_agent_id IS NULL) OR (sender_practice_agent_id IS NOT NULL AND sender_agent_id IS NULL)) AND sender_user_id IS NULL)"
    )


def downgrade():
    # Drop the new check constraint
    op.drop_constraint('sender_attribution_check', 'conversation_messages', type_='check')
    
    # Recreate the old check constraint
    op.create_check_constraint(
        'sender_attribution_check',
        'conversation_messages',
        "(sender_type = 'user' AND sender_user_id IS NOT NULL AND sender_agent_id IS NULL) OR "
        "(sender_type = 'agent' AND sender_agent_id IS NOT NULL AND sender_user_id IS NULL)"
    )

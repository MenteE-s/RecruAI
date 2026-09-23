""" add_recording_url_to_interviews

Revision ID: a7c9e2f4b186
Revises: e5f6a7b8c9d0
Create Date: 2026-09-20

Playback URL for self-hosted LiveKit call recordings. Nullable: interviews
without video or not yet recorded stay NULL.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a7c9e2f4b186'
down_revision = 'e5f6a7b8c9d0'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('interviews', sa.Column('recording_url', sa.String(length=500), nullable=True))


def downgrade():
    op.drop_column('interviews', 'recording_url')

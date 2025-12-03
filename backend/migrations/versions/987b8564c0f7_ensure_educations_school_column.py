"""ensure_educations_school_column

Revision ID: 987b8564c0f7
Revises: a42df1ec191c
Create Date: 2025-12-04 04:24:19.612804

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '987b8564c0f7'
down_revision = 'a42df1ec191c'
branch_labels = None
depends_on = None


def upgrade():
    # Check if column exists before adding it
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('educations')]
    
    if 'school' not in columns:
        op.add_column('educations', sa.Column('school', sa.String(length=255), nullable=True))
        # Update existing records to have a default value
        op.execute("UPDATE educations SET school = '' WHERE school IS NULL")
        # Make it not nullable after setting defaults
        op.alter_column('educations', 'school', nullable=False)


def downgrade():
    # Only drop if it exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('educations')]
    
    if 'school' in columns:
        op.drop_column('educations', 'school')

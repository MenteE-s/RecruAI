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
    # Use raw SQL to check and add column if it doesn't exist
    # This is more robust for PostgreSQL
    conn = op.get_bind()
    
    # Check if column exists using PostgreSQL information_schema
    result = conn.execute(sa.text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='educations' AND column_name='school'
    """))
    
    exists = result.fetchone() is not None
    
    if not exists:
        # Add the column
        op.add_column('educations', sa.Column('school', sa.String(length=255), nullable=True))
        # Update existing records to have a default value
        conn.execute(sa.text("UPDATE educations SET school = '' WHERE school IS NULL"))
        # Make it not nullable after setting defaults
        op.alter_column('educations', 'school', nullable=False)


def downgrade():
    # Check if column exists before dropping
    conn = op.get_bind()
    
    result = conn.execute(sa.text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='educations' AND column_name='school'
    """))
    
    exists = result.fetchone() is not None
    
    if exists:
        op.drop_column('educations', 'school')

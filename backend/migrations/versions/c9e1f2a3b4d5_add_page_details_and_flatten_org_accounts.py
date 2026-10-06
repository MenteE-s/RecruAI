""" add_page_details_and_flatten_org_accounts

Revision ID: c9e1f2a3b4d5
Revises: a7c9e2f4b186
Create Date: 2026-10-06

Two related changes for the "one account, many pages" model:

1. New organizations columns backing the page-creation wizard:
   founded_year, employee_count, company_type.

2. Flattens legacy `role='organization'` accounts into plain individuals.
   Signup is individuals-only now; companies exist only as pages that a
   signed-in person administers through the team_members table. Every legacy
   org-role user gets a team_members row (Admin when they had none) before
   their role is flipped, so nobody loses access to the org they ran.

   This is NOT a privilege escalation: the legacy authorization helpers
   already granted full org management to any user with
   `role='organization' AND organization_id = X`, which is exactly the power
   an Admin team_members row carries. An existing team_members row keeps its
   own role (e.g. 'HR') rather than being upgraded to Admin, and the insert is
   skipped entirely for users who already have a row.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c9e1f2a3b4d5'
down_revision = 'a7c9e2f4b186'
branch_labels = None
depends_on = None


def upgrade():
    # --- 1. page detail columns -------------------------------------------
    op.add_column('organizations', sa.Column('founded_year', sa.Integer(), nullable=True))
    op.add_column('organizations', sa.Column('employee_count', sa.Integer(), nullable=True))
    op.add_column('organizations', sa.Column('company_type', sa.String(length=50), nullable=True))

    bind = op.get_bind()

    # --- 2. guarantee every org-bound user has a team_members row ----------
    # NOT EXISTS means an existing 'HR'/'Member' row is preserved rather than
    # overwritten with 'Admin'. Users with a NULL organization_id are skipped:
    # they simply become individuals with no page.
    #
    # Deliberately keyed on organization_id alone, not on role='organization' —
    # authorization checks accept EITHER (role='organization' AND matching
    # org) OR a team_members row. An individual who has organization_id set but
    # no row would fail both checks and be locked out of their own page, so
    # this has to cover them too. Admin is the right grant: the legacy
    # org-role condition already gave full management over that org.
    bind.execute(sa.text("""
        INSERT INTO team_members (organization_id, user_id, role, created_at)
        SELECT u.organization_id, u.id, 'Admin', CURRENT_TIMESTAMP
        FROM users u
        WHERE u.organization_id IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM team_members tm
              WHERE tm.organization_id = u.organization_id
                AND tm.user_id = u.id
          )
    """))

    # --- 3. flip the role ---------------------------------------------------
    bind.execute(sa.text(
        "UPDATE users SET role = 'individual' WHERE role = 'organization'"
    ))


def downgrade():
    bind = op.get_bind()

    # Lossy by nature: a user who founded their own page also satisfies this
    # predicate, so they will be flipped back to 'organization' too. Restore
    # only if you accept that, or reconcile by hand.
    bind.execute(sa.text("""
        UPDATE users
        SET role = 'organization'
        WHERE role = 'individual'
          AND organization_id IS NOT NULL
          AND EXISTS (
              SELECT 1 FROM team_members tm
              WHERE tm.organization_id = users.organization_id
                AND tm.user_id = users.id
          )
    """))

    # Team rows added by upgrade() are left in place on purpose: dropping them
    # would revoke admin rights from accounts that already relied on them.
    op.drop_column('organizations', 'company_type')
    op.drop_column('organizations', 'employee_count')
    op.drop_column('organizations', 'founded_year')
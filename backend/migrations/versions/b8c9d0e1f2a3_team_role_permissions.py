"""Team role authorization, canonical roles, and membership indexes

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-10-23

P1-06. Roles were free-form strings that every authorization check ignored.
This migration:

* canonicalizes existing roles (legacy ``Member`` -> ``Interviewer`` and any
  unknown value -> read-only ``Viewer``);
* gives legacy individual accounts that point at a page but have no
  ``team_members`` row an explicit read-only membership, so access no longer
  depends on the ``users.organization_id`` convenience pointer;
* removes duplicate memberships before adding a unique constraint; and
* adds the indexes used by every permission check.

Downgrade drops the constraints and indexes. The data normalization is
intentionally not reversed: restoring an unknown role would restore the
authorization ambiguity this migration exists to remove.
"""

from alembic import op


revision = "b8c9d0e1f2a3"
down_revision = "a7b8c9d0e1f2"
branch_labels = None
depends_on = None


_ROLE_CASE = """
CASE lower(trim(role))
    WHEN 'admin' THEN 'Admin'
    WHEN 'administrator' THEN 'Admin'
    WHEN 'owner' THEN 'Admin'
    WHEN 'hr' THEN 'HR'
    WHEN 'human resources' THEN 'HR'
    WHEN 'people ops' THEN 'HR'
    WHEN 'people operations' THEN 'HR'
    WHEN 'recruiter' THEN 'HR'
    WHEN 'manager' THEN 'Manager'
    WHEN 'hiring manager' THEN 'Manager'
    WHEN 'interviewer' THEN 'Interviewer'
    WHEN 'member' THEN 'Interviewer'
    WHEN 'viewer' THEN 'Viewer'
    WHEN 'employee' THEN 'Employee'
    ELSE 'Viewer'
END
"""


def upgrade():
    op.execute(f"UPDATE team_members SET role = {_ROLE_CASE}")
    op.execute(f"UPDATE organization_invitations SET role = {_ROLE_CASE}")

    # Keep the oldest row for any duplicate pair; then make the pair unique.
    op.execute(
        """
        DELETE FROM team_members a
        USING team_members b
        WHERE a.organization_id = b.organization_id
          AND a.user_id = b.user_id
          AND a.id > b.id
        """
    )

    # Historical data may have an individual account associated with a page
    # without a membership row. Grant only read access; a real invitation or
    # an explicit role change is required to restore broader rights.
    op.execute(
        """
        INSERT INTO team_members
            (organization_id, user_id, role, permissions, join_date, created_at)
        SELECT u.organization_id, u.id, 'Viewer', NULL, NULL, NOW()
        FROM users u
        WHERE u.organization_id IS NOT NULL
          AND u.deleted_at IS NULL
          AND u.role = 'individual'
          AND NOT EXISTS (
              SELECT 1
              FROM team_members tm
              WHERE tm.organization_id = u.organization_id
                AND tm.user_id = u.id
          )
        """
    )

    op.create_unique_constraint(
        "uq_team_members_organization_user",
        "team_members",
        ["organization_id", "user_id"],
    )
    op.create_index("ix_team_members_user_id", "team_members", ["user_id"])
    op.create_check_constraint(
        "ck_team_members_role",
        "team_members",
        "role IN ('Admin', 'HR', 'Manager', 'Interviewer', 'Viewer', 'Employee')",
    )


def downgrade():
    op.drop_constraint("ck_team_members_role", "team_members", type_="check")
    op.drop_index("ix_team_members_user_id", table_name="team_members")
    op.drop_constraint(
        "uq_team_members_organization_user", "team_members", type_="unique"
    )

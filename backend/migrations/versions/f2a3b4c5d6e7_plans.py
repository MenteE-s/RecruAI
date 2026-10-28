"""Admin-managed plan catalogue and per-account feature overrides.

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
Create Date: 2026-10-28

Adds:
  * plans (slug, name, scope, price_cents, features JSON, is_default, is_active)
  * users.plan, users.feature_overrides
  * organizations.plan, organizations.feature_overrides

Default plans seeded so the catalogue is never empty and the admin dashboard
has something to edit on first boot. Prices in cents: $15.00 = 1500,
$20.00 = 2000.
"""

import json
from datetime import datetime

from alembic import op
import sqlalchemy as sa


revision = "f2a3b4c5d6e7"
down_revision = "e1f2a3b4c5d6"
branch_labels = None
depends_on = None

_DEFAULT_PLANS = [
    ("free", "Free", "individual", 0, ["profile_management", "job_search", "basic_matching"]),
    ("premium", "Premium", "individual", 1500,
     ["profile_management", "job_search", "basic_matching", "cvai_skill_assessment",
      "cvai_quizzes", "cvai_projects", "cvai_mentorship", "cvai_mock_interview",
      "career_coaching", "practice_ai_agents"]),
    ("free", "Free", "organization", 0, ["profile_management", "job_posting", "basic_matching", "team_management"]),
    ("premium", "Premium", "organization", 2000,
     ["profile_management", "job_posting", "basic_matching", "team_management",
      "ai_screening", "ai_interview_agents", "analytics", "reports"]),
]


def upgrade():
    op.create_table(
        "plans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(64), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("scope", sa.String(16), nullable=False),
        sa.Column("price_cents", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("features", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_unique_constraint("uq_plans_slug_scope", "plans", ["slug", "scope"])
    op.create_index("ix_plans_scope", "plans", ["scope"])

    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("plan", sa.String(32), nullable=False, server_default="free"))
        batch_op.add_column(sa.Column("feature_overrides", sa.Text(), nullable=True))
    with op.batch_alter_table("organizations") as batch_op:
        batch_op.add_column(sa.Column("plan", sa.String(32), nullable=False, server_default="free"))
        batch_op.add_column(sa.Column("feature_overrides", sa.Text(), nullable=True))

    # Seed the default catalogue. Idempotent on (slug) so re-running on a
    # partially-migrated database does not duplicate rows.
    bind = op.get_bind()
    for slug, name, scope, price, features in _DEFAULT_PLANS:
        exists = bind.execute(
            sa.text("SELECT 1 FROM plans WHERE slug = :slug AND scope = :scope"),
            {"slug": slug, "scope": scope},
        ).scalar()
        if exists:
            continue
        bind.execute(
            sa.text(
                "INSERT INTO plans (slug, name, scope, price_cents, features, "
                "is_default, is_active, created_at, updated_at) VALUES "
                "(:slug, :name, :scope, :price, :features, :is_default, TRUE, "
                ":created_at, :updated_at)"
            ),
            {
                "slug": slug,
                "name": name,
                "scope": scope,
                "price": price,
                "features": json.dumps(features),
                "is_default": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            },
        )


def downgrade():
    with op.batch_alter_table("organizations") as batch_op:
        batch_op.drop_column("feature_overrides")
        batch_op.drop_column("plan")
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("feature_overrides")
        batch_op.drop_column("plan")
    op.drop_index("ix_plans_scope", table_name="plans")
    op.drop_constraint("uq_plans_slug_scope", "plans", type_="unique")
    op.drop_table("plans")

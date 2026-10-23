"""Account deletion, scheduler runs, and organization AI allowances

Revision ID: a7b8c9d0e1f2
Revises: f4a5b6c7d8e9
Create Date: 2026-10-23

P1-03/P1-04/P1-05. The users token allowance already existed; organizations
needed the same explicit allowance so a company cannot spend without a ceiling.
The scheduler and deletion audit tables are new. All indexes are non-unique.
"""

from alembic import op
import sqlalchemy as sa


revision = "a7b8c9d0e1f2"
down_revision = "f4a5b6c7d8e9"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("deleted_at", sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column("deletion_requested_at", sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column("deletion_scheduled_for", sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column("deletion_reason", sa.String(length=255), nullable=True))
        batch_op.create_index(
            "ix_users_deletion_scheduled_for", ["deletion_scheduled_for"], unique=False
        )
        batch_op.create_index(
            "ix_users_subscription_trial_start",
            ["subscription_status", "trial_start_date"],
            unique=False,
        )

    with op.batch_alter_table("organizations") as batch_op:
        batch_op.add_column(
            sa.Column(
                "token_allowance",
                sa.Integer(),
                nullable=False,
                server_default="50000",
            )
        )
        batch_op.create_index(
            "ix_organizations_subscription_trial_start",
            ["subscription_status", "trial_start_date"],
            unique=False,
        )

    op.create_index(
        "ix_interviews_status_scheduled_at",
        "interviews",
        ["status", "scheduled_at"],
        unique=False,
    )

    op.create_table(
        "scheduler_runs",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("job_name", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.Column("rows_updated", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("worker", sa.String(length=255), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("detail", sa.Text(), nullable=True),
    )
    op.create_index("ix_scheduler_runs_job_name", "scheduler_runs", ["job_name"], unique=False)
    op.create_index(
        "ix_scheduler_runs_job_started",
        "scheduler_runs",
        ["job_name", "started_at"],
        unique=False,
    )
    op.create_index(
        "ix_scheduler_runs_job_status_finished",
        "scheduler_runs",
        ["job_name", "status", "finished_at"],
        unique=False,
    )

    op.create_table(
        "account_deletions",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("email_hash", sa.String(length=64), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="scheduled"),
        sa.Column("requested_at", sa.DateTime(), nullable=False),
        sa.Column("scheduled_for", sa.DateTime(), nullable=False),
        sa.Column("purged_at", sa.DateTime(), nullable=True),
        sa.Column("requested_ip", sa.String(length=45), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
    )
    op.create_index("ix_account_deletions_user_id", "account_deletions", ["user_id"], unique=False)
    op.create_index(
        "ix_account_deletions_email_hash", "account_deletions", ["email_hash"], unique=False
    )
    op.create_index(
        "ix_account_deletions_status_scheduled",
        "account_deletions",
        ["status", "scheduled_for"],
        unique=False,
    )


def downgrade():
    op.drop_index("ix_account_deletions_status_scheduled", table_name="account_deletions")
    op.drop_index("ix_account_deletions_email_hash", table_name="account_deletions")
    op.drop_index("ix_account_deletions_user_id", table_name="account_deletions")
    op.drop_table("account_deletions")

    op.drop_index(
        "ix_scheduler_runs_job_status_finished", table_name="scheduler_runs"
    )
    op.drop_index("ix_scheduler_runs_job_started", table_name="scheduler_runs")
    op.drop_index("ix_scheduler_runs_job_name", table_name="scheduler_runs")
    op.drop_table("scheduler_runs")

    op.drop_index("ix_interviews_status_scheduled_at", table_name="interviews")

    with op.batch_alter_table("organizations") as batch_op:
        batch_op.drop_index("ix_organizations_subscription_trial_start")
        batch_op.drop_column("token_allowance")

    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_index("ix_users_subscription_trial_start")
        batch_op.drop_index("ix_users_deletion_scheduled_for")
        batch_op.drop_column("deletion_reason")
        batch_op.drop_column("deletion_scheduled_for")
        batch_op.drop_column("deletion_requested_at")
        batch_op.drop_column("deleted_at")

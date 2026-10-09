"""CVAI B1: mentorship plans and their steps

Revision ID: d9e0f1a2b3c4
Revises: c8d9e0f1a2b3
Create Date: 2026-10-09

mentorship_plans  the plan itself: goal, the two budgets it was built to
                  respect (weekly hours, money), and the server-computed totals
mentorship_steps  one step per gap, with the resource that closes it

Budget columns live on the plan because they are constraints the plan satisfies,
not properties of a step — that is what makes "does this plan fit my budget"
a question the database can answer.

Both tables cascade from users: a plan cannot outlive its owner.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd9e0f1a2b3c4'
down_revision = 'c8d9e0f1a2b3'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'mentorship_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('goal', sa.String(length=255), nullable=False),
        sa.Column('goal_post_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('weekly_hours', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('budget_amount', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('budget_currency', sa.String(length=8), nullable=False, server_default='USD'),
        sa.Column('total_hours', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_cost', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('weeks', sa.Integer(), nullable=True),
        sa.Column('trimmed', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('trim_reason', sa.Text(), nullable=True),
        sa.Column('target_skills', sa.Text(), nullable=True),
        sa.Column('baseline_skills', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['goal_post_id'], ['posts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('mentorship_plans', schema=None) as batch_op:
        batch_op.create_index('ix_mentorship_plans_user_id', ['user_id'], unique=False)

    op.create_table(
        'mentorship_steps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('plan_id', sa.Integer(), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('skill_slug', sa.String(length=64), nullable=True),
        sa.Column('target_level', sa.String(length=50), nullable=True),
        sa.Column('resource_type', sa.String(length=32), nullable=True),
        sa.Column('resource_name', sa.String(length=255), nullable=True),
        sa.Column('resource_url', sa.String(length=500), nullable=True),
        sa.Column('cost', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('hours_estimate', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('optional', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('target_date', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['plan_id'], ['mentorship_plans.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('mentorship_steps', schema=None) as batch_op:
        batch_op.create_index('ix_mentorship_steps_plan_id', ['plan_id'], unique=False)
        batch_op.create_index('ix_mentorship_steps_skill_slug', ['skill_slug'], unique=False)


def downgrade():
    op.drop_index('ix_mentorship_steps_skill_slug', table_name='mentorship_steps')
    op.drop_index('ix_mentorship_steps_plan_id', table_name='mentorship_steps')
    op.drop_table('mentorship_steps')
    op.drop_index('ix_mentorship_plans_user_id', table_name='mentorship_plans')
    op.drop_table('mentorship_plans')
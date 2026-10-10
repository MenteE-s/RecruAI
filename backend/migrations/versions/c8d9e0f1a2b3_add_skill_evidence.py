"""Evidence-backed learner skill profile

Revision ID: c8d9e0f1a2b3
Revises: b7c8d9e0f1a2
Create Date: 2026-10-09

The `skills` table was a free-text list: "React", "react.js" and "ReactJS" were
three unrelated rows for one person, nothing recorded where a claim came from,
and `level` held lowercase strings that the org profile UI compared against
while the model's own comment said Title-Case.

Adds to `skills`:
  skill_slug         canonical taxonomy slug; NULL when the skill is not
                     catalogued, which is allowed and keeps the typed name
  evidence_source    where the claim came from (see models/skill.py)
  evidence_detail    JSON provenance, e.g. the assessment that produced it
  verified           true only for evidence that stands on its own
  last_assessed_at   when an assessment last moved this skill

Then backfills, which needs Python rather than SQL:
  * skill_slug from the existing names, resolved through the taxonomy
  * level to canonical Title-Case

Both backfills are idempotent and leave unmatched rows alone rather than
guessing — an uncatalogued skill keeps its name and simply has no slug.

The migration imports the taxonomy on purpose: it is the only place where the
mapping from historical free text to canonical slugs can be applied, and doing
it here means no user has to re-enter skills by hand.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c8d9e0f1a2b3'
down_revision = 'b7c8d9e0f1a2'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('skills', sa.Column('skill_slug', sa.String(length=64), nullable=True))
    op.add_column('skills', sa.Column('evidence_source', sa.String(length=32), nullable=True))
    op.add_column('skills', sa.Column('evidence_detail', sa.Text(), nullable=True))
    op.add_column('skills', sa.Column('verified', sa.Boolean(), nullable=False,
                                      server_default=sa.false()))
    op.add_column('skills', sa.Column('last_assessed_at', sa.DateTime(), nullable=True))
    with op.batch_alter_table('skills', schema=None) as batch_op:
        batch_op.create_index('ix_skills_skill_slug', ['skill_slug'], unique=False)

    # Existing skills were claims, not evidence.
    op.execute("UPDATE skills SET evidence_source = 'self_declared' "
               "WHERE evidence_source IS NULL")

    bind = op.get_bind()
    rows = bind.execute(sa.text(
        "SELECT id, name, level FROM skills WHERE skill_slug IS NULL"
    )).fetchall()
    if rows:
        # Imported here, inside the migration: a historical row must be mapped
        # with the taxonomy as it stands today, not with whatever it becomes
        # later. Nothing in the running app depends on this import path.
        from backend.utils.skill_taxonomy import normalize_level, resolve

        slug_updates, level_updates = {}, {}
        for row_id, name, level in rows:
            entry = resolve(name)
            if entry:
                slug_updates[row_id] = entry["slug"]
            canonical = normalize_level(level)
            if canonical and canonical != level:
                level_updates[row_id] = canonical

        for row_id, slug in slug_updates.items():
            bind.execute(sa.text("UPDATE skills SET skill_slug = :slug WHERE id = :id"),
                         {"slug": slug, "id": row_id})
        for row_id, canonical in level_updates.items():
            bind.execute(sa.text("UPDATE skills SET level = :lvl WHERE id = :id"),
                         {"lvl": canonical, "id": row_id})
        print(f"  backfilled {len(slug_updates)} slugs, "
              f"normalized {len(level_updates)} levels of {len(rows)} rows")


def downgrade():
    with op.batch_alter_table('skills', schema=None) as batch_op:
        batch_op.drop_index('ix_skills_skill_slug')
    op.drop_column('skills', 'last_assessed_at')
    op.drop_column('skills', 'verified')
    op.drop_column('skills', 'evidence_detail')
    op.drop_column('skills', 'evidence_source')
    op.drop_column('skills', 'skill_slug')
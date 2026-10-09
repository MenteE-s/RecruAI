from datetime import datetime

from ..extensions import db
from ..utils.timezone_utils import utc_iso


class MentorshipStep(db.Model):
    """One step in a plan: close one gap, with one resource.

    `skill_slug` is nullable on purpose. A step can legitimately be about
    something the taxonomy does not catalogue (portfolio structure, interview
    technique), and forcing a fake slug would poison the gap accounting those
    steps are counted against.

    hours_estimate and cost are clamped server-side before storage. The model
    proposes them, but a "40 hour" step or a "$-5000 course" would break every
    total in the plan, so the numbers that reach this table have already been
    through the budget arithmetic rather than trusted from a model response.
    """
    __tablename__ = "mentorship_steps"

    id = db.Column(db.Integer, primary_key=True)
    plan_id = db.Column(db.Integer, db.ForeignKey("mentorship_plans.id"),
                        nullable=False, index=True)
    order_index = db.Column(db.Integer, nullable=False, default=0)

    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    skill_slug = db.Column(db.String(64), nullable=True, index=True)
    # The level the learner should reach, where the gap named one.
    target_level = db.Column(db.String(50), nullable=True)

    # 'course' | 'article' | 'project' | 'practice' | 'assessment'
    resource_type = db.Column(db.String(32), nullable=True)
    resource_name = db.Column(db.String(255), nullable=True)
    # Left empty until there is a real catalogue (Track C) to link against. A
    # model-invented URL is a dead link or worse, something else entirely.
    resource_url = db.Column(db.String(500), nullable=True)
    # 0 means free. Stored as integer whole units of `plan.budget_currency`.
    cost = db.Column(db.Integer, nullable=False, default=0)
    hours_estimate = db.Column(db.Integer, nullable=False, default=1)
    # False when this step was optional and had to go to fit the budget.
    optional = db.Column(db.Boolean, nullable=False, default=False)

    # 'pending' | 'in_progress' | 'done' | 'skipped'
    status = db.Column(db.String(20), nullable=False, default="pending")
    target_date = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "plan_id": self.plan_id,
            "order_index": self.order_index,
            "title": self.title,
            "description": self.description,
            "skill_slug": self.skill_slug,
            "target_level": self.target_level,
            "resource_type": self.resource_type,
            "resource_name": self.resource_name,
            "resource_url": self.resource_url,
            "cost": self.cost,
            "hours_estimate": self.hours_estimate,
            "optional": bool(self.optional),
            "status": self.status,
            "target_date": utc_iso(self.target_date),
            "completed_at": utc_iso(self.completed_at),
        }
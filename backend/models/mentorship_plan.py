from datetime import datetime

from ..extensions import db
from ..utils.timezone_utils import utc_iso


class MentorshipPlan(db.Model):
    """A learner's plan to close a measured skill gap.

    Built from evidence, not aspiration: the steps come from the gap between the
    user's actual skill profile (self-declared and assessment-backed) and a
    target. The target is either a saved job posting's requirements or, failing
    that, a set of skills the AI proposed which were then filtered to the
    catalogued taxonomy — an invented skill cannot be planned for.

    Budgets live here rather than in the steps because they are constraints the
    plan was built to respect, not properties of any one step:
      weekly_hours  how many hours a week the learner can actually give
      budget_amount money available for paid resources, in budget_currency

    The plan is a snapshot. If the learner later improves a skill through an
    assessment, the stored steps do not rewrite themselves; the UI shows that
    the gap closed and offers to regenerate, because silently mutating a plan
    someone is halfway through is worse than showing it is stale.
    """
    __tablename__ = "mentorship_plans"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    # Free-text goal, always kept even when a posting is attached: the posting
    # can be deleted, and the learner's own words are the durable statement.
    goal = db.Column(db.String(255), nullable=False)
    goal_post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=True)
    # 'active' | 'completed' | 'abandoned'
    status = db.Column(db.String(20), nullable=False, default="active")

    weekly_hours = db.Column(db.Integer, nullable=False, default=5)
    budget_amount = db.Column(db.Integer, nullable=False, default=0)
    budget_currency = db.Column(db.String(8), nullable=False, default="USD")

    # Totals computed server-side after budget enforcement, never by the model.
    total_hours = db.Column(db.Integer, nullable=False, default=0)
    total_cost = db.Column(db.Integer, nullable=False, default=0)
    weeks = db.Column(db.Integer, nullable=True)
    # Set when enforcement had to drop or downgrade steps, so the UI can say so
    # rather than presenting a trimmed plan as complete.
    trimmed = db.Column(db.Boolean, nullable=False, default=False)
    trim_reason = db.Column(db.Text, nullable=True)
    # Target skills as JSON list of slugs, for gap comparison on regeneration.
    target_skills = db.Column(db.Text, nullable=True)
    # Snapshot of what the learner held when the plan was made, so staleness can
    # be detected instead of guessed.
    baseline_skills = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship("User", backref=db.backref(
        "mentorship_plans", lazy="dynamic", cascade="all, delete-orphan"))
    steps = db.relationship("MentorshipStep", backref="plan",
                            cascade="all, delete-orphan", lazy="select")

    def get_target_skills(self):
        import json
        if not self.target_skills:
            return []
        try:
            parsed = json.loads(self.target_skills)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return []

    def get_baseline_skills(self):
        import json
        if not self.baseline_skills:
            return {}
        try:
            parsed = json.loads(self.baseline_skills)
            return parsed if isinstance(parsed, dict) else {}
        except (json.JSONDecodeError, TypeError):
            return {}

    def set_target_skills(self, slugs):
        import json
        self.target_skills = json.dumps(list(slugs or []))

    def set_baseline_skills(self, mapping):
        import json
        self.baseline_skills = json.dumps(mapping or {})

    def to_dict(self, include_steps=True):
        completed = sum(1 for s in self.steps if s.status == "done")
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "goal": self.goal,
            "goal_post_id": self.goal_post_id,
            "status": self.status,
            "weekly_hours": self.weekly_hours,
            "budget_amount": self.budget_amount,
            "budget_currency": self.budget_currency,
            "total_hours": self.total_hours,
            "total_cost": self.total_cost,
            "weeks": self.weeks,
            "trimmed": bool(self.trimmed),
            "trim_reason": self.trim_reason,
            "target_skills": self.get_target_skills(),
            "step_count": len(self.steps),
            "completed_step_count": completed,
            "created_at": utc_iso(self.created_at),
            "updated_at": utc_iso(self.updated_at),
            "completed_at": utc_iso(self.completed_at),
        }
        if include_steps:
            data["steps"] = [s.to_dict() for s in sorted(self.steps, key=lambda s: s.order_index)]
        return data
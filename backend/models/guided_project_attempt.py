from datetime import datetime

from ..extensions import db
from ..utils.timezone_utils import utc_iso


class GuidedProjectAttempt(db.Model):
    """One learner's run at one project.

    submission and review are plain text columns holding JSON, like the quiz
    attempt's answers and feedback. The submission is kept whole so a later
    review can be re-run against exactly what was submitted, and so the quotes
    a reviewer claimed remain checkable months later.

    review_status separates "not submitted" from "submitted but the reviewer
    could not be reached". Collapsing those two would mean showing a learner a
    project that looks finished when in fact nothing looked at their work.
    """
    __tablename__ = "guided_project_attempts"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("guided_projects.id"),
                           nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"),
                        nullable=False, index=True)
    # 'in_progress' | 'submitted' | 'reviewed'
    status = db.Column(db.String(20), nullable=False, default="in_progress")
    # 'none' | 'pending' | 'done' | 'unavailable'
    review_status = db.Column(db.String(20), nullable=False, default="none")
    # 0-based index of the step the learner is on.
    current_step = db.Column(db.Integer, nullable=False, default=0)
    notes = db.Column(db.Text, nullable=True)
    submission = db.Column(db.Text, nullable=True)
    review = db.Column(db.Text, nullable=True)
    score_percent = db.Column(db.Float, nullable=True)
    passed = db.Column(db.Boolean, nullable=True)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    submitted_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship("GuidedProject", backref=db.backref(
        "attempts", lazy="dynamic", cascade="all, delete-orphan"))
    user = db.relationship("User", backref=db.backref(
        "guided_project_attempts", lazy="dynamic", cascade="all, delete-orphan"))

    def set_review(self, payload):
        import json
        self.review = json.dumps(payload or {})

    def get_review(self):
        import json
        if not self.review:
            return {}
        try:
            parsed = json.loads(self.review)
            return parsed if isinstance(parsed, dict) else {}
        except (json.JSONDecodeError, TypeError):
            return {}

    def to_dict(self, include_review=False):
        data = {
            "id": self.id,
            "project_id": self.project_id,
            "project_slug": self.project.slug if self.project else None,
            "project_title": self.project.title if self.project else None,
            "user_id": self.user_id,
            "status": self.status,
            "review_status": self.review_status,
            "current_step": self.current_step,
            "step_count": len(self.project.get_steps()) if self.project else 0,
            "score_percent": self.score_percent,
            "passed": self.passed,
            "started_at": utc_iso(self.started_at),
            "submitted_at": utc_iso(self.submitted_at),
            "completed_at": utc_iso(self.completed_at),
        }
        if include_review:
            data["submission"] = self.submission
            data["review"] = self.get_review()
        return data

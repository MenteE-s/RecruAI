from datetime import datetime

from ..extensions import db
from ..utils.timezone_utils import utc_iso


class SkillAssessment(db.Model):
    """One person's run through the assessment, and what it concluded.

    Rows are append-only: a retake creates a new row rather than overwriting,
    because B2.2 (re-measure skill levels over time) is only possible if the
    history survives. Progress tracking compares attempts; it cannot compare a
    value that has already been overwritten.

    answers is JSON: [{"question_id": int, "selected": int, "correct": bool}].
    A separate answers table would be tidier to query, but an attempt is always
    read whole and never joined per-question, so the row count saved is not
    worth the second table.
    """
    __tablename__ = "skill_assessments"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    # Null means a mixed/multi-skill assessment; the level_awarded then applies
    # to the assessment as a whole rather than to any single skill.
    skill_slug = db.Column(db.String(64), nullable=True, index=True)
    # 'in_progress' | 'completed' | 'abandoned'
    status = db.Column(db.String(20), nullable=False, default="in_progress")
    answers = db.Column(db.Text, nullable=True)
    total_questions = db.Column(db.Integer, nullable=False, default=0)
    correct_count = db.Column(db.Integer, nullable=False, default=0)
    # Canonical Title-Case level from skill_taxonomy.LEVELS.
    level_awarded = db.Column(db.String(50), nullable=True)
    # Percentage correct, kept as well as level_awarded so B2 can show movement
    # without re-deriving it from answers.
    score_percent = db.Column(db.Float, nullable=True)
    # Free-text feedback from the explain step; JSON list of strings.
    feedback = db.Column(db.Text, nullable=True)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # delete-orphan cascade is required, not decorative: without it, deleting a
    # user makes SQLAlchemy null out skill_assessments.user_id, which is NOT
    # NULL, so account deletion dies with an IntegrityError instead of cleaning
    # up. Every row here is owned by the user.
    user = db.relationship("User", backref=db.backref(
        "skill_assessments", lazy="dynamic", cascade="all, delete-orphan"))

    def get_answers(self):
        import json
        if not self.answers:
            return []
        try:
            parsed = json.loads(self.answers)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return []

    def get_feedback(self):
        import json
        if not self.feedback:
            return []
        try:
            parsed = json.loads(self.feedback)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return []

    def set_answers(self, rows):
        import json
        self.answers = json.dumps(rows)

    def set_feedback(self, items):
        import json
        self.feedback = json.dumps(items)

    def to_dict(self, include_answers=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "skill_slug": self.skill_slug,
            "status": self.status,
            "total_questions": self.total_questions,
            "correct_count": self.correct_count,
            "level_awarded": self.level_awarded,
            "score_percent": self.score_percent,
            "started_at": utc_iso(self.started_at),
            "completed_at": utc_iso(self.completed_at),
        }
        if include_answers:
            data["answers"] = self.get_answers()
            data["feedback"] = self.get_feedback()
        return data
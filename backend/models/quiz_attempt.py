from datetime import datetime

from ..extensions import db
from ..utils.timezone_utils import utc_iso


class QuizAttempt(db.Model):
    """One run at one quiz.

    Append-only, like SkillAssessment: a retake is a new row so the learner's
    history survives and B2 can show movement.

    answers holds the graded snapshot exactly as served, so editing or retiring a
    question afterwards cannot change a score that has already been awarded.
    """
    __tablename__ = "quiz_attempts"

    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("skill_quizzes.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    # 'in_progress' | 'completed' | 'abandoned'
    status = db.Column(db.String(20), nullable=False, default="in_progress")
    answers = db.Column(db.Text, nullable=True)
    feedback = db.Column(db.Text, nullable=True)
    total_questions = db.Column(db.Integer, nullable=False, default=0)
    correct_count = db.Column(db.Integer, nullable=False, default=0)
    score_percent = db.Column(db.Float, nullable=True)
    passed = db.Column(db.Boolean, nullable=True)
    # Highest level the score maps to. A quiz result is weaker evidence than a
    # full assessment — fewer questions — so the profile records it as a quiz
    # measurement rather than pretending it is an assessment.
    level_awarded = db.Column(db.String(50), nullable=True)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    quiz = db.relationship("SkillQuiz", backref=db.backref(
        "attempts", lazy="dynamic", cascade="all, delete-orphan"))
    user = db.relationship("User", backref=db.backref(
        "quiz_attempts", lazy="dynamic", cascade="all, delete-orphan"))

    def set_answers(self, rows):
        import json
        self.answers = json.dumps(rows or [])

    def get_answers(self):
        import json
        if not self.answers:
            return []
        try:
            parsed = json.loads(self.answers)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return []

    def set_feedback(self, items):
        import json
        self.feedback = json.dumps(items or [])

    def get_feedback(self):
        import json
        if not self.feedback:
            return []
        try:
            parsed = json.loads(self.feedback)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return []

    def to_dict(self, include_feedback=False):
        data = {
            "id": self.id,
            "quiz_id": self.quiz_id,
            "quiz_slug": self.quiz.slug if self.quiz else None,
            "user_id": self.user_id,
            "status": self.status,
            "total_questions": self.total_questions,
            "correct_count": self.correct_count,
            "score_percent": self.score_percent,
            "passed": self.passed,
            "level_awarded": self.level_awarded,
            "started_at": utc_iso(self.started_at),
            "completed_at": utc_iso(self.completed_at),
        }
        if include_feedback:
            data["feedback"] = self.get_feedback()
        return data
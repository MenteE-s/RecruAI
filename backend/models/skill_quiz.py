from datetime import datetime

from ..extensions import db
from ..utils.timezone_utils import utc_iso


class SkillQuiz(db.Model):
    """A curated set of questions — the subscriber-facing content in Track C.

    Distinct from a SkillAssessment, which measures one skill. A quiz spans
    skills, has a pass mark, and shows explanations as you go; an assessment
    awards a level for one skill and is how the profile gets evidence. Both read
    the same `skill_questions` bank, so a question is authored once.

    question_ids is a JSON list of bank ids, not a join table: the order matters
    (a quiz reads front to back), the set is small and fixed at authoring time,
    and a join table would buy nothing but a second thing to keep in sync.

    skill_slugs is derived from those questions and cached here so listing
    quizzes does not have to load every question to say what a quiz covers.
    """
    __tablename__ = "skill_quizzes"

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(80), nullable=False, unique=True)
    title = db.Column(db.String(160), nullable=False)
    description = db.Column(db.Text, nullable=True)
    difficulty = db.Column(db.String(20), nullable=True)
    question_ids = db.Column(db.Text, nullable=True)
    skill_slugs = db.Column(db.Text, nullable=True)
    # Percentage needed to pass. A quiz that cannot be failed is a reading test.
    pass_percent = db.Column(db.Integer, nullable=False, default=50)
    # Free preview for non-subscribers; the whole point is to let someone taste
    # it before paying.
    is_free_preview = db.Column(db.Boolean, nullable=False, default=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", foreign_keys=[created_by_user_id])

    def get_question_ids(self):
        import json
        if not self.question_ids:
            return []
        try:
            parsed = json.loads(self.question_ids)
            return [int(i) for i in parsed] if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError, ValueError):
            return []

    def set_question_ids(self, ids):
        import json
        self.question_ids = json.dumps([int(i) for i in (ids or [])])

    def get_skill_slugs(self):
        import json
        if not self.skill_slugs:
            return []
        try:
            parsed = json.loads(self.skill_slugs)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return []

    def set_skill_slugs(self, slugs):
        import json
        self.skill_slugs = json.dumps(list(slugs or []))

    def to_dict(self, include_question_count=True):
        data = {
            "id": self.id,
            "slug": self.slug,
            "title": self.title,
            "description": self.description,
            "difficulty": self.difficulty,
            "pass_percent": self.pass_percent,
            "is_free_preview": bool(self.is_free_preview),
            "is_active": bool(self.is_active),
            "skills": self.get_skill_slugs(),
            "created_at": utc_iso(self.created_at),
        }
        if include_question_count:
            data["question_count"] = len(self.get_question_ids())
        return data
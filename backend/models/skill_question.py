from datetime import datetime

from ..extensions import db
from ..utils.timezone_utils import utc_iso


class SkillQuestion(db.Model):
    """A single question in the skill assessment bank.

    Skill is stored as the taxonomy slug rather than an FK: the catalog lives in
    code (backend/utils/skill_taxonomy.py), so a slug can never dangle the way a
    foreign key to a catalog table would. Writing a question for a skill that
    was later renamed out of the taxonomy is the cost of that choice, and it is
    paid at authoring time by the API rejecting unknown slugs.

    This bank is deliberately the same table the quizzes (Track C) read from.
    A quiz is a selection of these rows with an ordering; building a second
    question store would mean authoring every question twice.
    """
    __tablename__ = "skill_questions"

    id = db.Column(db.Integer, primary_key=True)
    skill_slug = db.Column(db.String(64), nullable=False, index=True)
    prompt = db.Column(db.Text, nullable=False)
    # List of answer strings, JSON-encoded (the house pattern for lists).
    options = db.Column(db.Text, nullable=True)
    correct_index = db.Column(db.Integer, nullable=False, default=0)
    # Shown after answering. A question that cannot explain itself teaches the
    # user nothing, which defeats the point of an assessment.
    explanation = db.Column(db.Text, nullable=True)
    # 1-5, mapped to the question's own difficulty. Distinct from level_tested.
    difficulty = db.Column(db.Integer, nullable=True, default=1)
    # The proficiency band this question is evidence *for*. A bank needs
    # questions at every level or the assessment can only ever detect "has it".
    level_tested = db.Column(db.String(50), nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    # Who wrote it — ties authorship to an account so C1.1 has an answer.
    created_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", foreign_keys=[created_by_user_id])

    def get_options(self):
        import json
        if not self.options:
            return []
        try:
            parsed = json.loads(self.options)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            # A malformed row should cost one question, not the whole attempt.
            return []

    def to_dict(self, include_answer=False):
        """Never ship correct_index to an untaken assessment.

        include_answer is only ever set by the authoring/author-review paths.
        """
        data = {
            "id": self.id,
            "skill_slug": self.skill_slug,
            "prompt": self.prompt,
            "options": self.get_options(),
            "difficulty": self.difficulty,
            "level_tested": self.level_tested,
            "created_at": utc_iso(self.created_at),
        }
        if include_answer:
            data["correct_index"] = self.correct_index
            data["explanation"] = self.explanation
        return data
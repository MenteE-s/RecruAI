from datetime import datetime

from ..extensions import db
from ..utils.timezone_utils import utc_iso


class GuidedProject(db.Model):
    """A build-it project: brief, ordered steps, and criteria the work is judged against.

    Named GuidedProject because `Project` is already the resume-entry model on a
    profile (name, github_url, technologies). Those are claims about work someone
    finished; this is work someone is being asked to do inside RecruAI.

    steps, acceptance_criteria and skill_slugs are JSON rather than child tables
    for the same reason quizzes hold an ordered list: the content is authored
    once, read whole, never queried across. A project brief is a document, not a
    relation.
    """
    __tablename__ = "guided_projects"

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(80), nullable=False, unique=True)
    title = db.Column(db.String(160), nullable=False)
    summary = db.Column(db.Text, nullable=True)
    difficulty = db.Column(db.String(20), nullable=True)
    # Ordered list of {"title", "instruction"} objects.
    steps = db.Column(db.Text, nullable=True)
    # Ordered list of {"text"} objects — what the submission is judged against.
    acceptance_criteria = db.Column(db.Text, nullable=True)
    skill_slugs = db.Column(db.Text, nullable=True)
    estimated_hours = db.Column(db.Integer, nullable=True)
    # Percentage needed to pass. Judged by server-side arithmetic over per
    # criterion verdicts, never by the model.
    pass_percent = db.Column(db.Integer, nullable=False, default=70)
    is_free_preview = db.Column(db.Boolean, nullable=False, default=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", foreign_keys=[created_by_user_id])

    # -- steps ----------------------------------------------------------
    def get_steps(self):
        import json
        if not self.steps:
            return []
        try:
            parsed = json.loads(self.steps)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return []

    def set_steps(self, steps):
        import json
        self.steps = json.dumps(list(steps or []))

    # -- acceptance criteria --------------------------------------------
    def get_criteria(self):
        import json
        if not self.acceptance_criteria:
            return []
        try:
            parsed = json.loads(self.acceptance_criteria)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return []

    def set_criteria(self, criteria):
        import json
        self.acceptance_criteria = json.dumps(list(criteria or []))

    # -- skills ---------------------------------------------------------
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

    def to_dict(self, detail=False):
        """The listing shape by default.

        Locked projects are described by the caller before this reaches a
        lapsed user, so this returns what a subscriber sees: the brief and the
        step count, never the criteria. The criteria are the answer key, and
        showing them would be the same mistake as shipping correct_index with a
        quiz.
        """
        data = {
            "id": self.id,
            "slug": self.slug,
            "title": self.title,
            "summary": self.summary,
            "difficulty": self.difficulty,
            "estimated_hours": self.estimated_hours,
            "pass_percent": self.pass_percent,
            "is_free_preview": bool(self.is_free_preview),
            "is_active": bool(self.is_active),
            "skills": self.get_skill_slugs(),
            "step_count": len(self.get_steps()),
            "created_at": utc_iso(self.created_at),
        }
        if detail:
            data["steps"] = self.get_steps()
            data["acceptance_criteria"] = self.get_criteria()
        return data

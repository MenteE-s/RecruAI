from datetime import datetime

from ..extensions import db
from ..utils.timezone_utils import utc_iso


class MockInterview(db.Model):
    """One practice interview. Not a scheduled Interview — no employer, no room.

    Deliberately separate from the existing `interviews` table, which models a
    real booking between a candidate and an organisation. Folding practice into
    that table would mean a practice session competing for scheduling slots and
    showing up in an employer's pipeline.

    Everything the session needs to be honest about itself is stored here: which
    phases it covered, how many turns each took, and whether the reviewer could
    actually be reached.
    """
    __tablename__ = "mock_interviews"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    # Optional: practise against a real posting you are aiming at.
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=True)
    target_role = db.Column(db.String(160), nullable=True)
    # Skills this interview deliberately covered, decided from the learner's gap.
    skill_slugs = db.Column(db.Text, nullable=True)

    # 'in_progress' | 'completed' | 'abandoned'
    status = db.Column(db.String(20), nullable=False, default="in_progress")
    # 'none' | 'pending' | 'done' | 'unavailable'
    review_status = db.Column(db.String(20), nullable=False, default="none")
    # Which phase we are in. Server-owned: the model may choose a question within
    # a phase, never the phase itself.
    current_phase = db.Column(db.String(30), nullable=False, default="greeting")
    # Turns taken in the current phase, so min/max bounds can be honoured.
    phase_turns = db.Column(db.Integer, nullable=False, default=0)
    # Append-only dialogue.
    transcript = db.Column(db.Text, nullable=True)
    asked_questions = db.Column(db.Text, nullable=True)

    feedback = db.Column(db.Text, nullable=True)
    overall_score = db.Column(db.Float, nullable=True)
    passed = db.Column(db.Boolean, nullable=True)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref=db.backref(
        "mock_interviews", lazy="dynamic", cascade="all, delete-orphan"))
    post = db.relationship("Post")

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

    def get_transcript(self):
        import json
        if not self.transcript:
            return []
        try:
            parsed = json.loads(self.transcript)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return []

    def set_transcript(self, turns):
        import json
        self.transcript = json.dumps(list(turns or []))

    def append_turn(self, role, content):
        turns = self.get_transcript()
        turns.append({
            "role": role,
            "content": content,
            "phase": self.current_phase,
            "at": utc_iso(datetime.utcnow()),
        })
        self.set_transcript(turns)
        return turns

    def get_asked(self):
        import json
        if not self.asked_questions:
            return []
        try:
            parsed = json.loads(self.asked_questions)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return []

    def set_asked(self, questions):
        import json
        self.asked_questions = json.dumps(list(questions or []))

    def set_feedback(self, payload):
        import json
        self.feedback = json.dumps(payload or {})

    def get_feedback(self):
        import json
        if not self.feedback:
            return {}
        try:
            parsed = json.loads(self.feedback)
            return parsed if isinstance(parsed, dict) else {}
        except (json.JSONDecodeError, TypeError):
            return {}

    def to_dict(self, include_transcript=False, include_feedback=False):
        data = {
            "id": self.id,
            "post_id": self.post_id,
            "target_role": self.target_role,
            "status": self.status,
            "review_status": self.review_status,
            "current_phase": self.current_phase,
            "phase_turns": self.phase_turns,
            "skills": self.get_skill_slugs(),
            "turn_count": len(self.get_transcript()),
            "overall_score": self.overall_score,
            "passed": self.passed,
            "started_at": utc_iso(self.started_at),
            "completed_at": utc_iso(self.completed_at),
        }
        if include_transcript:
            data["transcript"] = self.get_transcript()
        if include_feedback:
            data["feedback"] = self.get_feedback()
        return data

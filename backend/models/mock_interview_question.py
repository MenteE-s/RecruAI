from datetime import datetime

from ..extensions import db
from ..utils.timezone_utils import utc_iso


class MockInterviewQuestion(db.Model):
    """An open question an interviewer can ask.

    Deliberately NOT stored in `skill_questions`. That table is multiple-choice:
    it has options and a required correct_index, because a quiz question has an
    answer. An interview question has no answer — it is a prompt, judged on how
    the learner responds. Squeezing them into the same table would mean writing
    "Ask this in your own words" as the correct option and a fake answer key, and
    the whole point of this codebase so far has been not inventing data.

    `phase` is the important column. The server refuses to ask a question outside
    the phase it is currently in, so a behavioural question cannot turn up in the
    technical section.
    """
    __tablename__ = "mock_interview_questions"

    id = db.Column(db.Integer, primary_key=True)
    # greeting | background | technical | behavioural | questions | closing
    phase = db.Column(db.String(30), nullable=False, index=True)
    # Taxonomy slug, or NULL for the phases where the taxonomy cannot help
    # ("tell me about a time you disagreed") decide what belongs.
    skill_slug = db.Column(db.String(64), nullable=True, index=True)
    level_tested = db.Column(db.String(50), nullable=True)
    text = db.Column(db.Text, nullable=False)
    # What a strong answer looks like. Shown after, never before.
    guidance = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", foreign_keys=[created_by_user_id])

    def to_dict(self, include_guidance=False):
        data = {
            "id": self.id,
            "phase": self.phase,
            "skill_slug": self.skill_slug,
            "text": self.text,
        }
        if include_guidance:
            data["guidance"] = self.guidance
            data["level_tested"] = self.level_tested
        return data

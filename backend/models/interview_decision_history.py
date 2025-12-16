from backend.extensions import db
from datetime import datetime


class InterviewDecisionHistory(db.Model):
    __tablename__ = "interview_decision_history"

    id = db.Column(db.Integer, primary_key=True)
    interview_id = db.Column(db.Integer, db.ForeignKey("interviews.id"), nullable=False)
    round_number = db.Column(db.Integer, nullable=False)  # Which round this decision was for
    decision = db.Column(db.String(20), nullable=False)  # 'passed', 'failed', 'second_round', 'third_round'
    feedback = db.Column(db.Text, nullable=True)
    rating = db.Column(db.Integer, nullable=True)  # 1-5 rating
    decided_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)  # Who made the decision
    decided_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    interview = db.relationship("Interview", backref="decision_history")
    decision_maker = db.relationship("User", backref="interview_decisions")

    def to_dict(self):
        return {
            "id": self.id,
            "interview_id": self.interview_id,
            "round_number": self.round_number,
            "decision": self.decision,
            "feedback": self.feedback,
            "rating": self.rating,
            "decided_by": self.decided_by,
            "decided_by_name": self.decision_maker.name if self.decision_maker else None,
            "decided_at": self.decided_at.isoformat() if self.decided_at else None,
        }
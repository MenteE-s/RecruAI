from datetime import datetime

from ..extensions import db


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    interview_id = db.Column(db.Integer, db.ForeignKey("interviews.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(20), default="text")  # text, ai_response, interviewer_response, system, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    interview = db.relationship("Interview", backref="messages")
    user = db.relationship("User", backref="messages")

    def to_dict(self):
        return {
            "id": self.id,
            "interview_id": self.interview_id,
            "user_id": self.user_id,
            "content": self.content,
            "message_type": self.message_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "user": {
                "id": self.user.id if self.user else None,
                "name": self.user.name if self.user else "Unknown User",
                "email": self.user.email if self.user else None,
            } if self.user else None,
        }
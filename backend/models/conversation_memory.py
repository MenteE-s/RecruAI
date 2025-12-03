from datetime import datetime

from ..extensions import db


class ConversationMemory(db.Model):
    __tablename__ = "conversation_memories"

    id = db.Column(db.Integer, primary_key=True)
    interview_id = db.Column(db.Integer, db.ForeignKey("interviews.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    message_type = db.Column(db.String(20), nullable=False)  # 'user' or 'ai'
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    extra_data = db.Column(db.Text, nullable=True)  # JSON string for additional data

    interview = db.relationship("Interview", backref="conversation_memories")
    user = db.relationship("User", backref="conversation_memories")

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "interview_id": self.interview_id,
            "user_id": self.user_id,
            "message_type": self.message_type,
            "content": self.content,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "extra_data": json.loads(self.extra_data) if self.extra_data else None,
        }

    @classmethod
    def get_recent_conversation(cls, interview_id, limit=20):
        """Get recent conversation history for an interview"""
        return cls.query.filter_by(interview_id=interview_id)\
                       .order_by(cls.timestamp.desc())\
                       .limit(limit)\
                       .all()

    @classmethod
    def add_message(cls, interview_id, user_id, message_type, content, metadata=None):
        """Add a message to conversation memory"""
        import json

        memory = cls(
            interview_id=interview_id,
            user_id=user_id,
            message_type=message_type,
            content=content,
            extra_data=json.dumps(metadata) if metadata else None
        )

        db.session.add(memory)
        db.session.commit()
        return memory
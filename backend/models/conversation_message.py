from datetime import datetime

from ..extensions import db


class ConversationMessage(db.Model):
    __tablename__ = "conversation_messages"

    id = db.Column(db.Integer, primary_key=True)
    interview_id = db.Column(db.Integer, db.ForeignKey("interviews.id"), nullable=False)
    sender_type = db.Column(db.String(20), nullable=False)  # 'user' or 'agent'
    sender_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)  # Only for humans
    sender_agent_id = db.Column(db.Integer, db.ForeignKey("ai_interview_agents.id"), nullable=True)  # For AIInterviewAgent
    sender_practice_agent_id = db.Column(db.Integer, db.ForeignKey("practice_ai_agents.id"), nullable=True)  # For PracticeAIAgent
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    interview = db.relationship("Interview", backref="conversation_messages")
    sender_user = db.relationship("User", backref="conversation_messages")
    sender_agent = db.relationship("AIInterviewAgent", backref="conversation_messages")
    sender_practice_agent = db.relationship("PracticeAIAgent", backref="conversation_messages")

    __table_args__ = (
        db.CheckConstraint(
            "(sender_type = 'user' AND sender_user_id IS NOT NULL AND sender_agent_id IS NULL AND sender_practice_agent_id IS NULL) OR "
            "(sender_type = 'agent' AND ((sender_agent_id IS NOT NULL AND sender_practice_agent_id IS NULL) OR (sender_practice_agent_id IS NOT NULL AND sender_agent_id IS NULL)) AND sender_user_id IS NULL)",
            name="sender_attribution_check"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "interview_id": self.interview_id,
            "sender_type": self.sender_type,
            "sender_user_id": self.sender_user_id,
            "sender_agent_id": self.sender_agent_id,
            "sender_practice_agent_id": self.sender_practice_agent_id,
            "content": self.content,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            # Include sender names for display
            'sender_name': (
                self.sender_user.name if self.sender_type == 'user' and self.sender_user else
                self.sender_agent.name if self.sender_type == 'agent' and self.sender_agent else
                self.sender_practice_agent.name if self.sender_type == 'agent' and self.sender_practice_agent else
                'Unknown'
            )
        }

    @classmethod
    def get_recent_conversation(cls, interview_id, limit=20):
        """Get recent conversation history for an interview"""
        return cls.query.filter_by(interview_id=interview_id)\
                       .order_by(cls.created_at.desc())\
                       .limit(limit)\
                       .all()

    @classmethod
    def add_user_message(cls, interview_id, user_id, content):
        """Add a user message to conversation"""
        message = cls(
            interview_id=interview_id,
            sender_type="user",
            sender_user_id=user_id,
            content=content
        )
        db.session.add(message)
        return message

    @classmethod
    def add_agent_message(cls, interview_id, agent, content):
        """Add an agent message to conversation"""
        from .ai_interview_agent import AIInterviewAgent  # Import here to avoid circular imports
        from .practice_ai_agent import PracticeAIAgent  # Import to check type
        
        if isinstance(agent, AIInterviewAgent):
            message = cls(
                interview_id=interview_id,
                sender_type="agent",
                sender_agent_id=agent.id,
                content=content
            )
        elif isinstance(agent, PracticeAIAgent):
            message = cls(
                interview_id=interview_id,
                sender_type="agent",
                sender_practice_agent_id=agent.id,
                content=content
            )
        else:
            # Fallback
            raise ValueError(f"Unknown agent type: {type(agent)}")
        db.session.add(message)
        return message
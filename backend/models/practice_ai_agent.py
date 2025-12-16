from datetime import datetime

from ..extensions import db


class PracticeAIAgent(db.Model):
    __tablename__ = "practice_ai_agents"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    industry = db.Column(db.String(100), nullable=False)  # e.g., "Software Engineering", "Marketing", "Finance"
    description = db.Column(db.Text, nullable=True)
    system_prompt = db.Column(db.Text, nullable=False)  # Base system prompt for the AI
    custom_instructions = db.Column(db.Text, nullable=True)  # Custom instructions from user
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", backref="practice_ai_agents")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "industry": self.industry,
            "description": self.description,
            "system_prompt": self.system_prompt,
            "custom_instructions": self.custom_instructions,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
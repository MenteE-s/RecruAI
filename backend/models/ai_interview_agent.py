from datetime import datetime

from ..extensions import db


class AIInterviewAgent(db.Model):
    __tablename__ = "ai_interview_agents"

    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    industry = db.Column(db.String(100), nullable=False)  # e.g., "Software Engineering", "Marketing", "Finance"
    description = db.Column(db.Text, nullable=True)
    system_prompt = db.Column(db.Text, nullable=False)  # Base system prompt for the AI
    custom_instructions = db.Column(db.Text, nullable=True)  # Custom instructions from organization
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = db.relationship("Organization", backref="ai_agents")

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "name": self.name,
            "industry": self.industry,
            "description": self.description,
            "system_prompt": self.system_prompt,
            "custom_instructions": self.custom_instructions,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "organization": self.organization.name if self.organization else None,
        }
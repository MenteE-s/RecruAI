from datetime import datetime

from ..extensions import db
from ..utils.timezone_utils import utc_iso


class AIInterviewAgent(db.Model):
    __tablename__ = "ai_interview_agents"

    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    persona = db.Column(db.String(255), nullable=True)  # Behavioral style (e.g., "Friendly but Firm", "Technical Expert")
    system_prompt = db.Column(db.Text, nullable=False)  # Base system prompt for the AI
    industry = db.Column(db.String(100), nullable=False)  # Industry specialization (e.g., "Software Engineering", "Marketing", "Finance")
    description = db.Column(db.Text, nullable=True)
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
            "persona": self.persona,
            "system_prompt": self.system_prompt,
            "industry": self.industry,
            "description": self.description,
            "custom_instructions": self.custom_instructions,
            "is_active": self.is_active,
            "created_at": utc_iso(self.created_at),
            "updated_at": utc_iso(self.updated_at),
            "organization": self.organization.name if self.organization else None,
        }
from datetime import datetime

from ..extensions import db


class AIAgent(db.Model):
    __tablename__ = "ai_agents"

    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    industry = db.Column(db.String(100), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    organization = db.relationship("Organization", backref="ai_interview_agents")

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "name": self.name,
            "description": self.description,
            "industry": self.industry,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
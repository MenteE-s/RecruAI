from datetime import datetime

from backend.extensions import db


class TokenUsage(db.Model):
    __tablename__ = "token_usage"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=True)
    provider = db.Column(db.String(50), nullable=False)  # 'openai', 'groq', 'local'
    model = db.Column(db.String(100), nullable=False)  # model name used
    tokens_used = db.Column(db.Integer, nullable=False)
    operation_type = db.Column(db.String(50), nullable=False)  # 'rag_search', 'interview_analysis', 'ai_chat', etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship("User", backref="token_usages")
    organization = db.relationship("Organization", backref="token_usages")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "organization_id": self.organization_id,
            "provider": self.provider,
            "model": self.model,
            "tokens_used": self.tokens_used,
            "operation_type": self.operation_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
from datetime import datetime

from ..extensions import db


class Language(db.Model):
    __tablename__ = "languages"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    proficiency_level = db.Column(db.String(50), nullable=True)  # e.g., 'Beginner', 'Intermediate', 'Advanced', 'Native'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="languages")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "proficiency_level": self.proficiency_level,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
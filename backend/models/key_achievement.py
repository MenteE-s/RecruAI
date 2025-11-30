from datetime import datetime

from ..extensions import db


class KeyAchievement(db.Model):
    __tablename__ = "key_achievements"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    date = db.Column(db.Date, nullable=True)
    category = db.Column(db.String(100), nullable=True)  # e.g., 'Professional', 'Academic', 'Personal'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="key_achievements")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "date": self.date.isoformat() if self.date else None,
            "category": self.category,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
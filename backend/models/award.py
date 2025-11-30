from datetime import datetime

from ..extensions import db


class Award(db.Model):
    __tablename__ = "awards"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    issuer = db.Column(db.String(255), nullable=False)
    date = db.Column(db.Date, nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="awards")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "issuer": self.issuer,
            "date": self.date.isoformat() if self.date else None,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
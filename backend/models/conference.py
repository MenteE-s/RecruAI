from datetime import datetime

from ..extensions import db


class Conference(db.Model):
    __tablename__ = "conferences"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(100), nullable=True)  # e.g., 'Attendee', 'Speaker', 'Organizer'
    location = db.Column(db.String(255), nullable=True)
    date = db.Column(db.Date, nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="conferences")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "role": self.role,
            "location": self.location,
            "date": self.date.isoformat() if self.date else None,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
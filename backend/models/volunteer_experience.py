from datetime import datetime

from ..extensions import db


class VolunteerExperience(db.Model):
    __tablename__ = "volunteer_experiences"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    organization = db.Column(db.String(255), nullable=False)
    duration = db.Column(db.String(100), nullable=True)
    location = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="volunteer_experiences")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "organization": self.organization,
            "duration": self.duration,
            "location": self.location,
            "description": self.description,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
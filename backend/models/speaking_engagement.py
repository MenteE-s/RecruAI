from datetime import datetime

from ..extensions import db


class SpeakingEngagement(db.Model):
    __tablename__ = "speaking_engagements"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    event_name = db.Column(db.String(255), nullable=True)
    event_type = db.Column(db.String(100), nullable=True)  # e.g., 'Conference', 'Webinar', 'Workshop'
    location = db.Column(db.String(255), nullable=True)
    date = db.Column(db.Date, nullable=True)
    audience_size = db.Column(db.Integer, nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="speaking_engagements")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "event_name": self.event_name,
            "event_type": self.event_type,
            "location": self.location,
            "date": self.date.isoformat() if self.date else None,
            "audience_size": self.audience_size,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
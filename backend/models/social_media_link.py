from datetime import datetime

from ..extensions import db


class SocialMediaLink(db.Model):
    __tablename__ = "social_media_links"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    platform = db.Column(db.String(100), nullable=False)  # e.g., 'LinkedIn', 'Twitter', 'GitHub'
    url = db.Column(db.String(500), nullable=False)
    username = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="social_media_links")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "platform": self.platform,
            "url": self.url,
            "username": self.username,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
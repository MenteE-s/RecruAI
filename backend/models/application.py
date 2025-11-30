from datetime import datetime

from ..extensions import db


class Application(db.Model):
    __tablename__ = "applications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False)
    cover_letter = db.Column(db.Text, nullable=True)
    resume_url = db.Column(db.String(500), nullable=True)  # URL to uploaded resume
    status = db.Column(db.String(20), default="pending")  # pending, reviewed, accepted, rejected
    pipeline_stage = db.Column(db.String(50), default="applied")  # applied, screening, interview_scheduled, interview_completed, offer_extended, offer_accepted, hired, rejected
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", backref="applications")
    post = db.relationship("Post", backref="applications")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "post_id": self.post_id,
            "cover_letter": self.cover_letter,
            "resume_url": self.resume_url,
            "status": self.status,
            "pipeline_stage": self.pipeline_stage,
            "applied_at": self.applied_at.isoformat() if self.applied_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "user": {
                "id": self.user.id if self.user else None,
                "name": self.user.name if self.user else None,
                "email": self.user.email if self.user else None,
            } if self.user else None,
            "post": self.post.to_dict() if self.post else None,
        }
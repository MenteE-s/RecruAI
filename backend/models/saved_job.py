from datetime import datetime

from ..extensions import db


class SavedJob(db.Model):
    __tablename__ = "saved_jobs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False)
    saved_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="saved_jobs")
    post = db.relationship("Post", backref="saved_by")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "post_id": self.post_id,
            "saved_at": self.saved_at.isoformat() if self.saved_at else None,
            "post": self.post.to_dict() if self.post else None,
        }
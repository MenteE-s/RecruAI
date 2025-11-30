from datetime import datetime

from ..extensions import db


class CourseTraining(db.Model):
    __tablename__ = "course_trainings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    provider = db.Column(db.String(255), nullable=True)
    completion_date = db.Column(db.Date, nullable=True)
    credential_id = db.Column(db.String(100), nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="course_trainings")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "provider": self.provider,
            "completion_date": self.completion_date.isoformat() if self.completion_date else None,
            "credential_id": self.credential_id,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
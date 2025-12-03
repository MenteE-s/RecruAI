from datetime import datetime

from ..extensions import db


class Skill(db.Model):
    __tablename__ = "skills"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    level = db.Column(db.String(50), nullable=True)  # Beginner, Intermediate, Advanced, Expert
    years_experience = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="skills")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "level": self.level,
            "years_experience": self.years_experience,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
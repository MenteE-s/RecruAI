from datetime import datetime

from ..extensions import db


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    technologies = db.Column(db.Text, nullable=True)  # JSON array of tech names
    github_url = db.Column(db.String(500), nullable=True)
    demo_url = db.Column(db.String(500), nullable=True)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="projects")

    def to_dict(self):
        import json
        technologies = []
        if self.technologies:
            try:
                technologies = json.loads(self.technologies)
                if not isinstance(technologies, list):
                    technologies = []
            except (json.JSONDecodeError, TypeError):
                technologies = []
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "description": self.description,
            "technologies": technologies,
            "github_url": self.github_url,
            "demo_url": self.demo_url,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
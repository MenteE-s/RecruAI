from datetime import datetime

from ..extensions import db


class Post(db.Model):
    __tablename__ = "posts"

    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(255), nullable=True)
    employment_type = db.Column(db.String(64), nullable=True)  # Full-time, Part-time, Contract, etc.
    category = db.Column(db.String(100), nullable=True)  # Software Engineering, Marketing, Sales, etc.
    salary_min = db.Column(db.Integer, nullable=True)
    salary_max = db.Column(db.Integer, nullable=True)
    salary_currency = db.Column(db.String(10), default="USD")
    requirements = db.Column(db.Text, nullable=True)  # JSON string of requirements
    application_deadline = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), default="active")  # active, inactive, closed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = db.relationship("Organization", back_populates="posts")

    def to_dict(self):
        import json
        requirements_list = []
        if self.requirements:
            try:
                requirements_list = json.loads(self.requirements)
                if not isinstance(requirements_list, list):
                    requirements_list = []
            except (json.JSONDecodeError, TypeError):
                requirements_list = []
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "location": self.location,
            "employment_type": self.employment_type,
            "category": self.category,
            "salary_min": self.salary_min,
            "salary_max": self.salary_max,
            "salary_currency": self.salary_currency,
            "requirements": requirements_list,
            "application_deadline": self.application_deadline.isoformat() if self.application_deadline else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "organization_id": self.organization_id,
            "organization": self.organization.name if self.organization else None,
            "organization_details": self.organization.to_dict() if self.organization else None,
        }
from datetime import datetime

from sqlalchemy import func

from ..extensions import db
from ..utils.timezone_utils import utc_iso


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
    view_count = db.Column(db.Integer, nullable=False, server_default="0", default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = db.relationship("Organization", back_populates="posts")

    def application_count(self):
        """Real number of applications for this post (indexed COUNT query)."""
        from .application import Application
        if not self.id:
            return 0
        return (
            db.session.query(func.count(Application.id))
            .filter(Application.post_id == self.id)
            .scalar()
            or 0
        )

    def to_dict(self, application_count=None):
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
            "view_count": self.view_count or 0,
            "application_count": application_count if application_count is not None else self.application_count(),
            "created_at": utc_iso(self.created_at),
            "updated_at": utc_iso(self.updated_at),
            "organization_id": self.organization_id,
            "organization": {
                "id": self.organization.id,
                "name": self.organization.name,
                "profile_image": self.organization.profile_image,
            } if self.organization else None,
            "organization_details": self.organization.to_public_dict() if self.organization else None,
        }


def application_counts(post_ids):
    """Batch application counts for many posts in one GROUP BY query.

    Listing endpoints serialize N posts per page; calling application_count()
    per post is N COUNT queries. Pass the result into to_dict().
    """
    from .application import Application
    ids = [i for i in post_ids if i is not None]
    if not ids:
        return {}
    rows = (
        db.session.query(Application.post_id, func.count(Application.id))
        .filter(Application.post_id.in_(ids))
        .group_by(Application.post_id)
        .all()
    )
    return {post_id: count for post_id, count in rows}

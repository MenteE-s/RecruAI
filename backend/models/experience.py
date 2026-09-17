from datetime import datetime

from ..extensions import db


class Experience(db.Model):
    __tablename__ = "experiences"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    company = db.Column(db.String(255), nullable=False)
    # LinkedIn-style link to a platform Organization (nullable: free-text
    # company names without a matching org stay unlinked).
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=True)
    duration = db.Column(db.String(100), nullable=True)
    location = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    current_job = db.Column(db.Boolean, default=False)
    employment_type = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="experiences")
    organization = db.relationship("Organization", backref="experiences")

    def to_dict(self):
        org = self.organization
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "company": self.company,
            "organization_id": self.organization_id,
            "organization": {
                "id": org.id,
                "name": org.name,
                "profile_image": org.profile_image,
            } if org else None,
            "duration": self.duration,
            "location": self.location,
            "description": self.description,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "current_job": self.current_job,
            "employment_type": self.employment_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
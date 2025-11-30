from datetime import datetime

from backend.extensions import db


class Organization(db.Model):
    __tablename__ = "organizations"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    website = db.Column(db.String(255), nullable=True)
    contact_email = db.Column(db.String(255), nullable=True)
    contact_name = db.Column(db.String(255), nullable=True)
    location = db.Column(db.String(255), nullable=True)
    company_size = db.Column(db.String(50), nullable=True)
    industry = db.Column(db.String(100), nullable=True)
    mission = db.Column(db.Text, nullable=True)
    vision = db.Column(db.Text, nullable=True)
    social_media_links = db.Column(db.Text, nullable=True)  # JSON string
    # profile and banner images
    profile_image = db.Column(db.String(500), nullable=True)
    banner_image = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    users = db.relationship("User", back_populates="organization")
    posts = db.relationship("Post", back_populates="organization", cascade="all, delete-orphan")
    team_members = db.relationship("TeamMember", back_populates="organization", cascade="all, delete-orphan")

    def to_dict(self):
        import json
        social_links = []
        if self.social_media_links:
            try:
                social_links = json.loads(self.social_media_links)
                if not isinstance(social_links, list):
                    social_links = []
            except (json.JSONDecodeError, TypeError):
                social_links = []
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "website": self.website,
            "contact_email": self.contact_email,
            "contact_name": self.contact_name,
            "location": self.location,
            "company_size": self.company_size,
            "industry": self.industry,
            "mission": self.mission,
            "vision": self.vision,
            "social_media_links": social_links,
            "profile_image": self.profile_image,
            "banner_image": self.banner_image,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
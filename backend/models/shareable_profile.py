from datetime import datetime, timedelta
from backend.extensions import db


class ShareableProfile(db.Model):
    __tablename__ = "shareable_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False, index=True)  # e.g., "john-doe"

    # Profile visibility settings
    is_public = db.Column(db.Boolean, default=True)
    show_contact_info = db.Column(db.Boolean, default=False)
    show_resume = db.Column(db.Boolean, default=True)
    show_experience = db.Column(db.Boolean, default=True)
    show_education = db.Column(db.Boolean, default=True)
    show_skills = db.Column(db.Boolean, default=True)
    show_projects = db.Column(db.Boolean, default=True)

    # Link expiry settings
    expires_at = db.Column(db.DateTime, nullable=True)  # NULL means never expires
    is_active = db.Column(db.Boolean, default=True)

    # Analytics
    view_count = db.Column(db.Integer, default=0)
    last_viewed_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship("User", backref="shareable_profiles")
    analytics = db.relationship("ProfileAnalytics", back_populates="profile", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "slug": self.slug,
            "is_public": self.is_public,
            "show_contact_info": self.show_contact_info,
            "show_resume": self.show_resume,
            "show_experience": self.show_experience,
            "show_education": self.show_education,
            "show_skills": self.show_skills,
            "show_projects": self.show_projects,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "is_active": self.is_active,
            "view_count": self.view_count,
            "last_viewed_at": self.last_viewed_at.isoformat() if self.last_viewed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def is_expired(self):
        """Check if the profile link has expired"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at

    def can_access(self):
        """Check if the profile can be accessed"""
        return self.is_active and not self.is_expired()

    def increment_views(self):
        """Increment view count and update last viewed timestamp"""
        self.view_count += 1
        self.last_viewed_at = datetime.utcnow()
        db.session.commit()

    @staticmethod
    def generate_unique_slug(base_slug, user_id):
        """Generate a unique slug for the profile"""
        slug = base_slug.lower().replace(' ', '-').replace('_', '-')
        # Remove special characters
        import re
        slug = re.sub(r'[^a-z0-9-]', '', slug)
        # Remove multiple consecutive hyphens
        slug = re.sub(r'-+', '-', slug).strip('-')

        original_slug = slug
        counter = 1

        while ShareableProfile.query.filter_by(slug=slug).first():
            slug = f"{original_slug}-{counter}"
            counter += 1

        return slug


class ProfileAnalytics(db.Model):
    __tablename__ = "profile_analytics"

    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(db.Integer, db.ForeignKey("shareable_profiles.id"), nullable=False)

    # Analytics data
    ip_address = db.Column(db.String(45), nullable=True)  # IPv4/IPv6
    user_agent = db.Column(db.Text, nullable=True)
    referrer = db.Column(db.String(500), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    city = db.Column(db.String(100), nullable=True)

    # Session tracking
    session_id = db.Column(db.String(100), nullable=True)
    viewed_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    profile = db.relationship("ShareableProfile", back_populates="analytics")

    def __repr__(self):
        return f"<ProfileAnalytics {self.id} for profile {self.profile_id}>"

    def to_dict(self):
        return {
            "id": self.id,
            "profile_id": self.profile_id,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "referrer": self.referrer,
            "country": self.country,
            "city": self.city,
            "session_id": self.session_id,
            "viewed_at": self.viewed_at.isoformat() if self.viewed_at else None,
        }
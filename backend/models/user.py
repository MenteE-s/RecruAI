from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

from backend.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=True)
    # Use Text for password_hash to avoid truncation of modern hash formats (scrypt, argon2, pbkdf2)
    password_hash = db.Column(db.Text, nullable=True)
    # user role: 'individual' or 'organization'
    role = db.Column(db.String(32), nullable=False, default="individual")
    # user plan: 'trial' or 'pro'
    plan = db.Column(db.String(32), nullable=False, default="trial")
    # optional organization FK
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=True)
    organization = db.relationship("Organization", back_populates="users")
    # profile picture URL/path
    profile_picture = db.Column(db.String(500), nullable=True)
    # banner image URL/path
    banner = db.Column(db.String(500), nullable=True)
    # user's preferred timezone (e.g., 'Asia/Karachi', 'America/New_York')
    timezone = db.Column(db.String(50), nullable=True, default="UTC")
    # Additional profile fields
    phone = db.Column(db.String(50), nullable=True)
    location = db.Column(db.String(200), nullable=True)
    website = db.Column(db.String(500), nullable=True)
    linkedin = db.Column(db.String(500), nullable=True)

    # Security fields
    failed_login_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)
    last_login_at = db.Column(db.DateTime, nullable=True)
    password_changed_at = db.Column(db.DateTime, default=datetime.utcnow)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    interviews = db.relationship("Interview", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"

    def set_password(self, password: str) -> None:
        """Set password with security validation"""
        from backend.utils.security import validate_password_strength, hash_password

        is_valid, error_msg = validate_password_strength(password)
        if not is_valid:
            raise ValueError(error_msg)

        self.password_hash = hash_password(password)
        self.password_changed_at = datetime.utcnow()

    def check_password(self, password: str) -> bool:
        """Check password with account lockout logic"""
        from backend.utils.security import verify_password
        from flask import current_app

        # Check if account is locked
        if self.locked_until and self.locked_until > datetime.utcnow():
            return False

        # Verify password
        if not self.password_hash:
            return False

        is_valid = verify_password(self.password_hash, password)

        if is_valid:
            # Successful login - reset failed attempts and update last login
            self.failed_login_attempts = 0
            self.locked_until = None
            self.last_login_at = datetime.utcnow()
        else:
            # Failed login - increment attempts and potentially lock account
            if self.failed_login_attempts is None:
                self.failed_login_attempts = 0
            self.failed_login_attempts += 1
            max_attempts = current_app.config.get('MAX_LOGIN_ATTEMPTS', 5)

            if self.failed_login_attempts >= max_attempts:
                lockout_minutes = current_app.config.get('LOCKOUT_DURATION_MINUTES', 15)
                self.locked_until = datetime.utcnow() + timedelta(minutes=lockout_minutes)

        return is_valid

    def is_account_locked(self) -> bool:
        """Check if account is currently locked"""
        return self.locked_until and self.locked_until > datetime.utcnow()

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "plan": self.plan,
            "organization_id": self.organization_id,
            "organization": self.organization.name if self.organization else None,
            "profile_picture": self.profile_picture,
            "banner": self.banner,
            "timezone": self.timezone or "UTC",
            "phone": self.phone,
            "location": self.location,
            "website": self.website,
            "linkedin": self.linkedin,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def to_public_dict(self):
        """Return user data for public profile sharing"""
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "organization": self.organization.name if self.organization else None,
            "profile_picture": self.profile_picture,
            "banner": self.banner,
            "timezone": self.timezone or "UTC",
            # Include profile sections - these will be filtered by visibility settings
            "experiences": [exp.to_dict() for exp in self.experiences] if hasattr(self, 'experiences') else [],
            "educations": [edu.to_dict() for edu in self.educations] if hasattr(self, 'educations') else [],
            "skills": [skill.to_dict() for skill in self.skills] if hasattr(self, 'skills') else [],
            "projects": [proj.to_dict() for proj in self.projects] if hasattr(self, 'projects') else [],
            "certifications": [cert.to_dict() for cert in self.certifications] if hasattr(self, 'certifications') else [],
            "publications": [pub.to_dict() for pub in self.publications] if hasattr(self, 'publications') else [],
            "awards": [award.to_dict() for award in self.awards] if hasattr(self, 'awards') else [],
        }
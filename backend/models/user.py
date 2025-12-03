from datetime import datetime
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
    # user's preferred timezone (e.g., 'Asia/Karachi', 'America/New_York')
    timezone = db.Column(db.String(50), nullable=True, default="UTC")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    interviews = db.relationship("Interview", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

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
            "timezone": self.timezone or "UTC",
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
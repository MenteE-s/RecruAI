from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

from .extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=True)
    # Use Text for password_hash to avoid truncation of modern hash formats (scrypt, argon2, pbkdf2)
    password_hash = db.Column(db.Text, nullable=True)
    # user role: 'individual' or 'organization'
    role = db.Column(db.String(32), nullable=False, default="individual")
    # user plan: 'free' or 'pro'
    plan = db.Column(db.String(32), nullable=False, default="free")
    # optional organization FK
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=True)
    organization = db.relationship("Organization", back_populates="users")
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
            "organization": self.organization.name if self.organization else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Organization(db.Model):
    __tablename__ = "organizations"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    website = db.Column(db.String(255), nullable=True)
    contact_email = db.Column(db.String(255), nullable=True)
    contact_name = db.Column(db.String(255), nullable=True)
    location = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    users = db.relationship("User", back_populates="organization")
    posts = db.relationship("Post", back_populates="organization", cascade="all, delete-orphan")


class Interview(db.Model):
    __tablename__ = "interviews"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    scheduled_at = db.Column(db.DateTime, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    user = db.relationship("User", back_populates="interviews")

    def __repr__(self):
        return f"<Interview {self.title}>"

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "scheduled_at": self.scheduled_at.isoformat() if self.scheduled_at else None,
            "user_id": self.user_id,
        }


class Post(db.Model):
    __tablename__ = "posts"

    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(255), nullable=True)
    employment_type = db.Column(db.String(64), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    organization = db.relationship("Organization", back_populates="posts")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "location": self.location,
            "employment_type": self.employment_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "organization_id": self.organization_id,
            "organization": self.organization.name if self.organization else None,
        }

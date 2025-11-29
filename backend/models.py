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
    # user plan: 'trial' or 'pro'
    plan = db.Column(db.String(32), nullable=False, default="trial")
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
            "organization_id": self.organization_id,
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
    company_size = db.Column(db.String(50), nullable=True)
    industry = db.Column(db.String(100), nullable=True)
    mission = db.Column(db.Text, nullable=True)
    vision = db.Column(db.Text, nullable=True)
    social_media_links = db.Column(db.Text, nullable=True)  # JSON string
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
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class TeamMember(db.Model):
    __tablename__ = "team_members"

    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    role = db.Column(db.String(100), nullable=False)  # e.g., 'Admin', 'HR', 'Manager'
    permissions = db.Column(db.Text, nullable=True)  # JSON string of permissions
    join_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    organization = db.relationship("Organization", back_populates="team_members")
    user = db.relationship("User", backref="team_memberships")

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "user_id": self.user_id,
            "role": self.role,
            "permissions": json.loads(self.permissions) if self.permissions else [],
            "join_date": self.join_date.isoformat() if self.join_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "organization": self.organization.name if self.organization else None,
            "user": {
                "id": self.user.id if self.user else None,
                "name": self.user.name if self.user else None,
                "email": self.user.email if self.user else None,
            } if self.user else None,
        }
    
    
class Interview(db.Model):
    __tablename__ = "interviews"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    scheduled_at = db.Column(db.DateTime, nullable=False)
    duration_minutes = db.Column(db.Integer, default=60)  # Interview duration in minutes
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=True)  # Associated job post

    # Interview details
    interview_type = db.Column(db.String(50), default="video")  # 'phone', 'video', 'in-person'
    location = db.Column(db.String(255), nullable=True)  # Physical location or meeting link
    meeting_link = db.Column(db.String(500), nullable=True)  # Zoom/Google Meet link

    # Status and feedback
    status = db.Column(db.String(50), default="scheduled")  # 'scheduled', 'completed', 'cancelled', 'no_show'
    feedback = db.Column(db.Text, nullable=True)  # Interview feedback/notes
    rating = db.Column(db.Integer, nullable=True)  # 1-5 rating

    # Interviewers (JSON array of user IDs or names)
    interviewers = db.Column(db.Text, nullable=True)

    # AI Interview Agent (optional - for AI-powered interviews)
    ai_agent_id = db.Column(db.Integer, db.ForeignKey("ai_interview_agents.id"), nullable=True)
    ai_agent = db.relationship("AIInterviewAgent", backref="interviews")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", back_populates="interviews")
    organization = db.relationship("Organization", backref="interviews")
    post = db.relationship("Post", backref="interviews")

    def __repr__(self):
        return f"<Interview {self.title}>"

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "scheduled_at": self.scheduled_at.isoformat() if self.scheduled_at else None,
            "duration_minutes": self.duration_minutes,
            "user_id": self.user_id,
            "organization_id": self.organization_id,
            "post_id": self.post_id,
            "interview_type": self.interview_type,
            "location": self.location,
            "meeting_link": self.meeting_link,
            "status": self.status,
            "feedback": self.feedback,
            "rating": self.rating,
            "interviewers": json.loads(self.interviewers) if self.interviewers else [],
            "ai_agent_id": self.ai_agent_id,
            "ai_agent": self.ai_agent.to_dict() if self.ai_agent else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "organization": self.organization.name if self.organization else None,
            "post_title": self.post.title if self.post else None,
        }


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


class Application(db.Model):
    __tablename__ = "applications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False)
    cover_letter = db.Column(db.Text, nullable=True)
    resume_url = db.Column(db.String(500), nullable=True)  # URL to uploaded resume
    status = db.Column(db.String(20), default="pending")  # pending, reviewed, accepted, rejected
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", backref="applications")
    post = db.relationship("Post", backref="applications")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "post_id": self.post_id,
            "cover_letter": self.cover_letter,
            "resume_url": self.resume_url,
            "status": self.status,
            "applied_at": self.applied_at.isoformat() if self.applied_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "user": {
                "id": self.user.id if self.user else None,
                "name": self.user.name if self.user else None,
                "email": self.user.email if self.user else None,
            } if self.user else None,
            "post": self.post.to_dict() if self.post else None,
        }


class SavedJob(db.Model):
    __tablename__ = "saved_jobs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False)
    saved_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="saved_jobs")
    post = db.relationship("Post", backref="saved_by")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "post_id": self.post_id,
            "saved_at": self.saved_at.isoformat() if self.saved_at else None,
            "post": self.post.to_dict() if self.post else None,
        }


class ProfileSection(db.Model):
    __tablename__ = "profile_sections"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    section_type = db.Column(db.String(50), nullable=False)  # 'about', 'experience', 'education', 'skills'
    section_data = db.Column(db.Text, nullable=False)  # JSON string
    order_index = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", backref="profile_sections")

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "user_id": self.user_id,
            "section_type": self.section_type,
            "section_data": json.loads(self.section_data) if self.section_data else {},
            "order_index": self.order_index,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Experience(db.Model):
    __tablename__ = "experiences"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    company = db.Column(db.String(255), nullable=False)
    duration = db.Column(db.String(100), nullable=True)
    location = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    current_job = db.Column(db.Boolean, default=False)
    employment_type = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="experiences")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "company": self.company,
            "duration": self.duration,
            "location": self.location,
            "description": self.description,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "current_job": self.current_job,
            "employment_type": self.employment_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Education(db.Model):
    __tablename__ = "educations"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    degree = db.Column(db.String(255), nullable=False)
    school = db.Column(db.String(255), nullable=False)
    field = db.Column(db.String(255), nullable=True)
    year = db.Column(db.String(50), nullable=True)
    gpa = db.Column(db.String(10), nullable=True)
    achievements = db.Column(db.Text, nullable=True)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="educations")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "degree": self.degree,
            "school": self.school,
            "field": self.field,
            "year": self.year,
            "gpa": self.gpa,
            "achievements": self.achievements,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


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
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "description": self.description,
            "technologies": json.loads(self.technologies) if self.technologies else [],
            "github_url": self.github_url,
            "demo_url": self.demo_url,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Publication(db.Model):
    __tablename__ = "publications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(500), nullable=False)
    journal = db.Column(db.String(255), nullable=True)
    authors = db.Column(db.Text, nullable=True)  # JSON array of author names
    abstract = db.Column(db.Text, nullable=True)
    publication_url = db.Column(db.String(500), nullable=True)
    year = db.Column(db.Integer, nullable=True)
    doi = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="publications")

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "journal": self.journal,
            "authors": json.loads(self.authors) if self.authors else [],
            "abstract": self.abstract,
            "publication_url": self.publication_url,
            "year": self.year,
            "doi": self.doi,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class Award(db.Model):
    __tablename__ = "awards"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    issuer = db.Column(db.String(255), nullable=False)
    date = db.Column(db.Date, nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="awards")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "issuer": self.issuer,
            "date": self.date.isoformat() if self.date else None,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Certification(db.Model):
    __tablename__ = "certifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    issuer = db.Column(db.String(255), nullable=False)
    date_obtained = db.Column(db.Date, nullable=True)
    expiry_date = db.Column(db.Date, nullable=True)
    credential_id = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="certifications")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "issuer": self.issuer,
            "date_obtained": self.date_obtained.isoformat() if self.date_obtained else None,
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
            "credential_id": self.credential_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Language(db.Model):
    __tablename__ = "languages"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    proficiency_level = db.Column(db.String(50), nullable=True)  # e.g., 'Beginner', 'Intermediate', 'Advanced', 'Native'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="languages")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "proficiency_level": self.proficiency_level,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class VolunteerExperience(db.Model):
    __tablename__ = "volunteer_experiences"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    organization = db.Column(db.String(255), nullable=False)
    duration = db.Column(db.String(100), nullable=True)
    location = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="volunteer_experiences")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "organization": self.organization,
            "duration": self.duration,
            "location": self.location,
            "description": self.description,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Reference(db.Model):
    __tablename__ = "references"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    title = db.Column(db.String(255), nullable=True)
    company = db.Column(db.String(255), nullable=True)
    email = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    relationship = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="references")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "title": self.title,
            "company": self.company,
            "email": self.email,
            "phone": self.phone,
            "relationship": self.relationship,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class HobbyInterest(db.Model):
    __tablename__ = "hobby_interests"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="hobby_interests")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ProfessionalMembership(db.Model):
    __tablename__ = "professional_memberships"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    organization = db.Column(db.String(255), nullable=False)
    membership_id = db.Column(db.String(100), nullable=True)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="professional_memberships")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "organization": self.organization,
            "membership_id": self.membership_id,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Patent(db.Model):
    __tablename__ = "patents"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(500), nullable=False)
    patent_number = db.Column(db.String(100), nullable=True)
    filing_date = db.Column(db.Date, nullable=True)
    grant_date = db.Column(db.Date, nullable=True)
    description = db.Column(db.Text, nullable=True)
    inventors = db.Column(db.Text, nullable=True)  # JSON array of inventor names
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="patents")

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "patent_number": self.patent_number,
            "filing_date": self.filing_date.isoformat() if self.filing_date else None,
            "grant_date": self.grant_date.isoformat() if self.grant_date else None,
            "description": self.description,
            "inventors": json.loads(self.inventors) if self.inventors else [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class CourseTraining(db.Model):
    __tablename__ = "course_trainings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    provider = db.Column(db.String(255), nullable=True)
    completion_date = db.Column(db.Date, nullable=True)
    credential_id = db.Column(db.String(100), nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="course_trainings")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "provider": self.provider,
            "completion_date": self.completion_date.isoformat() if self.completion_date else None,
            "credential_id": self.credential_id,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class SocialMediaLink(db.Model):
    __tablename__ = "social_media_links"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    platform = db.Column(db.String(100), nullable=False)  # e.g., 'LinkedIn', 'Twitter', 'GitHub'
    url = db.Column(db.String(500), nullable=False)
    username = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="social_media_links")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "platform": self.platform,
            "url": self.url,
            "username": self.username,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class KeyAchievement(db.Model):
    __tablename__ = "key_achievements"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    date = db.Column(db.Date, nullable=True)
    category = db.Column(db.String(100), nullable=True)  # e.g., 'Professional', 'Academic', 'Personal'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="key_achievements")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "date": self.date.isoformat() if self.date else None,
            "category": self.category,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Conference(db.Model):
    __tablename__ = "conferences"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(100), nullable=True)  # e.g., 'Attendee', 'Speaker', 'Organizer'
    location = db.Column(db.String(255), nullable=True)
    date = db.Column(db.Date, nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="conferences")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "role": self.role,
            "location": self.location,
            "date": self.date.isoformat() if self.date else None,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class SpeakingEngagement(db.Model):
    __tablename__ = "speaking_engagements"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    event_name = db.Column(db.String(255), nullable=True)
    event_type = db.Column(db.String(100), nullable=True)  # e.g., 'Conference', 'Webinar', 'Workshop'
    location = db.Column(db.String(255), nullable=True)
    date = db.Column(db.Date, nullable=True)
    audience_size = db.Column(db.Integer, nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="speaking_engagements")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "event_name": self.event_name,
            "event_type": self.event_type,
            "location": self.location,
            "date": self.date.isoformat() if self.date else None,
            "audience_size": self.audience_size,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class License(db.Model):
    __tablename__ = "licenses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    issuing_authority = db.Column(db.String(255), nullable=True)
    license_number = db.Column(db.String(100), nullable=True)
    issue_date = db.Column(db.Date, nullable=True)
    expiry_date = db.Column(db.Date, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="licenses")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "issuing_authority": self.issuing_authority,
            "license_number": self.license_number,
            "issue_date": self.issue_date.isoformat() if self.issue_date else None,
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
            "is_active": self.is_active,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AIInterviewAgent(db.Model):
    __tablename__ = "ai_interview_agents"

    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    industry = db.Column(db.String(100), nullable=False)  # e.g., "Software Engineering", "Marketing", "Finance"
    description = db.Column(db.Text, nullable=True)
    system_prompt = db.Column(db.Text, nullable=False)  # Base system prompt for the AI
    custom_instructions = db.Column(db.Text, nullable=True)  # Custom instructions from organization
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = db.relationship("Organization", backref="ai_agents")

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "name": self.name,
            "industry": self.industry,
            "description": self.description,
            "system_prompt": self.system_prompt,
            "custom_instructions": self.custom_instructions,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "organization": self.organization.name if self.organization else None,
        }

from datetime import datetime, timedelta

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
    # organization's preferred timezone (e.g., 'Asia/Karachi', 'America/New_York')
    timezone = db.Column(db.String(50), nullable=True, default="UTC")
    # Subscription fields
    subscription_status = db.Column(db.String(20), nullable=True, default="trial")  # 'trial', 'active', 'expired', 'cancelled'
    trial_start_date = db.Column(db.DateTime, nullable=True, default=datetime.utcnow)
    paid_plan = db.Column(db.Boolean, nullable=True, default=False)
    interviews_used = db.Column(db.Integer, nullable=True, default=0)
    tokens_used = db.Column(db.Integer, nullable=True, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    users = db.relationship("User", back_populates="organization", foreign_keys="User.organization_id")
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
            "timezone": self.timezone or "UTC",
            "subscription_status": self.get_subscription_status(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    # Subscription methods
    def is_trial_active(self) -> bool:
        """Check if organization is still in trial period (7 days)"""
        if self.subscription_status != "trial":
            return False

        if not self.trial_start_date:
            return False

        trial_end = self.trial_start_date + timedelta(days=7)
        return datetime.utcnow() < trial_end

    def is_subscription_active(self) -> bool:
        """Check if organization has active subscription"""
        return self.subscription_status == "active" and self.paid_plan

    def can_schedule_interview(self) -> bool:
        """Check if organization can schedule more interviews (5 limit during trial)"""
        if self.is_subscription_active():
            return True

        if self.is_trial_active():
            # During trial, allow up to 5 interviews
            return (self.interviews_used or 0) < 5

        # Trial expired - no more interviews
        return False

    def can_access_feature(self, feature: str) -> bool:
        """Check if organization can access a specific feature based on subscription"""
        if self.is_subscription_active():
            return True

        if self.is_trial_active():
            # During trial, allow access to all features
            return True

        # Trial expired - restrict features
        basic_features = ["profile_management", "job_posting", "basic_matching"]
        return feature in basic_features

    def track_interview_usage(self):
        """Track interview usage for organizations"""
        if self.interviews_used is None:
            self.interviews_used = 0
        self.interviews_used += 1
        db.session.commit()

    def track_token_usage(self, provider: str, model: str, tokens: int, operation_type: str):
        """Track token usage for billing/analytics"""
        from backend.models.token_usage import TokenUsage

        # Create token usage record
        usage = TokenUsage(
            organization_id=self.id,
            provider=provider,
            model=model,
            tokens_used=tokens,
            operation_type=operation_type
        )
        db.session.add(usage)

        # Update organization's total token count
        if self.tokens_used is None:
            self.tokens_used = 0
        self.tokens_used += tokens

        db.session.commit()

    def get_subscription_status(self) -> dict:
        """Get comprehensive subscription status"""
        return {
            "status": self.subscription_status,
            "is_trial_active": self.is_trial_active(),
            "is_paid_active": self.is_subscription_active(),
            "trial_start_date": self.trial_start_date.isoformat() if self.trial_start_date else None,
            "paid_plan": self.paid_plan,
            "tokens_used": self.tokens_used or 0,
            "interviews_used": self.interviews_used or 0,
            "interviews_remaining": max(0, 5 - (self.interviews_used or 0)) if self.is_trial_active() else 0,
            "can_schedule_interview": self.can_schedule_interview(),
            "features_accessible": ["all"] if (self.is_subscription_active() or self.is_trial_active()) else ["basic"]
        }
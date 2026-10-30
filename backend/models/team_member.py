from datetime import datetime

from backend.extensions import db
from backend.utils.timezone_utils import utc_iso


class TeamMember(db.Model):
    __tablename__ = "team_members"
    __table_args__ = (
        db.UniqueConstraint(
            "organization_id", "user_id", name="uq_team_members_organization_user"
        ),
        db.Index("ix_team_members_user_id", "user_id"),
        db.CheckConstraint(
            "role IN ('Admin', 'HR', 'Manager', 'Interviewer', 'Viewer', 'Employee')",
            name="ck_team_members_role",
        ),
    )

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

        # Local import keeps the model importable without a cycle: the
        # permission module imports TeamMember for lookups.
        from backend.utils.org_permissions import normalize_stored_role, role_permissions

        permissions = []
        if self.permissions:
            try:
                permissions = json.loads(self.permissions)
                if not isinstance(permissions, list):
                    permissions = []
            except (json.JSONDecodeError, TypeError):
                permissions = []
        role = normalize_stored_role(self.role)
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "user_id": self.user_id,
            "role": role,
            "role_permissions": sorted(role_permissions(role)),
            "permissions": permissions,
            "join_date": self.join_date.isoformat() if self.join_date else None,
            "created_at": utc_iso(self.created_at),
            "organization": self.organization.name if self.organization else None,
            "user": {
                "id": self.user.id if self.user else None,
                "name": self.user.name if self.user else None,
                "email": self.user.email if self.user else None,
                "profile_picture": self.user.profile_picture if self.user else None,
                "headline": self.user.headline if self.user else None,
                "employment_status": self.user.employment_status if self.user else None,
            } if self.user else None,
        }
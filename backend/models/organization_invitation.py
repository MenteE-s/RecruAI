from datetime import datetime

from sqlalchemy import func

from backend.extensions import db
from backend.utils.timezone_utils import utc_iso


class OrganizationInvitation(db.Model):
    """A pending invitation to join an organization's team.

    The raw token is only ever sent by email; the database stores its SHA-256
    hash. Accepting the invitation is what creates a login account (for a new
    address) or attaches an existing account. An invitation never pre-creates a
    User, so an admin cannot squat an address that belongs to someone else.
    """

    __tablename__ = "organization_invitations"

    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(
        db.Integer,
        db.ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    email = db.Column(db.String(120), nullable=False, index=True)
    role = db.Column(db.String(100), nullable=False, default="Member")
    permissions = db.Column(db.Text, nullable=True)  # JSON list, same shape as TeamMember
    join_date = db.Column(db.Date, nullable=True)
    invited_by_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    accepted_by_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    token_hash = db.Column(db.String(64), nullable=False, unique=True, index=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    accepted_at = db.Column(db.DateTime, nullable=True)
    revoked_at = db.Column(db.DateTime, nullable=True)
    last_sent_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Admin resend/rate-limit checks filter one org plus a case-insensitive
    # address. The plain email index cannot serve lower(email); this composite
    # expression index keeps those checks fast as the invitation table grows.
    __table_args__ = (
        db.Index(
            "ix_org_invitations_org_email_lower",
            organization_id,
            func.lower(email),
        ),
    )

    organization = db.relationship("Organization", back_populates="invitations")
    invited_by = db.relationship("User", foreign_keys=[invited_by_id])
    accepted_by = db.relationship("User", foreign_keys=[accepted_by_id])

    @property
    def status(self) -> str:
        if self.accepted_at:
            return "accepted"
        if self.revoked_at:
            return "revoked"
        if self.expires_at and self.expires_at <= datetime.utcnow():
            return "expired"
        return "pending"

    def to_dict(self):
        import json

        permissions = []
        if self.permissions:
            try:
                permissions = json.loads(self.permissions)
                if not isinstance(permissions, list):
                    permissions = []
            except (json.JSONDecodeError, TypeError):
                permissions = []

        org = self.organization
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "organization": {
                "id": org.id,
                "name": org.name,
                "slug": org.slug,
                "profile_image": org.profile_image,
            } if org else None,
            "email": self.email,
            "role": self.role,
            "permissions": permissions,
            "join_date": self.join_date.isoformat() if self.join_date else None,
            "status": self.status,
            "invited_by": {
                "id": self.invited_by.id,
                "name": self.invited_by.name,
            } if self.invited_by else None,
            "expires_at": utc_iso(self.expires_at),
            "accepted_at": utc_iso(self.accepted_at),
            "revoked_at": utc_iso(self.revoked_at),
            "last_sent_at": utc_iso(self.last_sent_at),
            "created_at": utc_iso(self.created_at),
        }

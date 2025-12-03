from datetime import datetime

from backend.extensions import db


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
        permissions = []
        if self.permissions:
            try:
                permissions = json.loads(self.permissions)
                if not isinstance(permissions, list):
                    permissions = []
            except (json.JSONDecodeError, TypeError):
                permissions = []
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "user_id": self.user_id,
            "role": self.role,
            "permissions": permissions,
            "join_date": self.join_date.isoformat() if self.join_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "organization": self.organization.name if self.organization else None,
            "user": {
                "id": self.user.id if self.user else None,
                "name": self.user.name if self.user else None,
                "email": self.user.email if self.user else None,
            } if self.user else None,
        }
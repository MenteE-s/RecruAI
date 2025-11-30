from datetime import datetime

from ..extensions import db


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
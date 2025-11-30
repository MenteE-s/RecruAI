from datetime import datetime

from ..extensions import db


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
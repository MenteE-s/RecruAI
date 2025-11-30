from datetime import datetime

from ..extensions import db


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
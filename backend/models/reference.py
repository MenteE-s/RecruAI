from datetime import datetime

from ..extensions import db


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
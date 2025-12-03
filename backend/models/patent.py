from datetime import datetime

from ..extensions import db


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
        inventors = []
        if self.inventors:
            try:
                inventors = json.loads(self.inventors)
                if not isinstance(inventors, list):
                    inventors = []
            except (json.JSONDecodeError, TypeError):
                inventors = []
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "patent_number": self.patent_number,
            "filing_date": self.filing_date.isoformat() if self.filing_date else None,
            "grant_date": self.grant_date.isoformat() if self.grant_date else None,
            "description": self.description,
            "inventors": inventors,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
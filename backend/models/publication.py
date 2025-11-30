from datetime import datetime

from ..extensions import db


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
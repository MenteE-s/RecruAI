from datetime import datetime

from ..extensions import db
from ..utils.timezone_utils import utc_iso


class ProfileSection(db.Model):
    __tablename__ = "profile_sections"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    section_type = db.Column(db.String(50), nullable=False)  # 'about', 'experience', 'education', 'skills'
    section_data = db.Column(db.Text, nullable=False)  # JSON string
    order_index = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship("User", backref="profile_sections")

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "user_id": self.user_id,
            "section_type": self.section_type,
            "section_data": json.loads(self.section_data) if self.section_data else {},
            "order_index": self.order_index,
            "created_at": utc_iso(self.created_at),
            "updated_at": utc_iso(self.updated_at),
            "completed_at": utc_iso(self.completed_at),
        }
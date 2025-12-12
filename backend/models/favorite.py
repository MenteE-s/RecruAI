from datetime import datetime
from backend.extensions import db


class Favorite(db.Model):
    __tablename__ = "favorites"

    id = db.Column(db.Integer, primary_key=True)
    # User who is doing the favoriting
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    # The user being favorited
    target_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship("User", foreign_keys=[user_id], backref="favorites")
    target_user = db.relationship("User", foreign_keys=[target_user_id])

    def __repr__(self):
        return f"<Favorite user_id={self.user_id} target_user_id={self.target_user_id}>"

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "target_user_id": self.target_user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
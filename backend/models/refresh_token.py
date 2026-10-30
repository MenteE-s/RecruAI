"""Rotating refresh-token sessions.

Only a SHA-256 hash of the opaque browser token is stored. Rotation happens on
every refresh; replaying an old token outside a short concurrency grace window
revokes the whole token family (theft detection).
"""

from datetime import datetime

from backend.extensions import db


class RefreshToken(db.Model):
    __tablename__ = "refresh_tokens"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # All tokens descended from one login share a family id.
    family_id = db.Column(db.String(64), nullable=False, index=True)
    token_hash = db.Column(db.String(64), nullable=False, unique=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    used_at = db.Column(db.DateTime, nullable=True)
    revoked_at = db.Column(db.DateTime, nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    ip_address = db.Column(db.String(64), nullable=True)

    def __repr__(self):
        return f"<RefreshToken user={self.user_id} family={self.family_id[:8]}>"

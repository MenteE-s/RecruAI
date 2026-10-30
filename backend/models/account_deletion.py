"""Durable, non-PII audit trail for account deletion.

The users row is removed after the grace period, so the audit record cannot use
a foreign key. It stores only a SHA-256 hash of the address (for support to
correlate a request) and lifecycle timestamps. No name, email, reason text, or
content is retained.
"""

from datetime import datetime

from backend.extensions import db
from backend.utils.timezone_utils import utc_iso


class AccountDeletion(db.Model):
    __tablename__ = "account_deletions"

    id = db.Column(db.Integer, primary_key=True)
    # Deliberately not a FK: the row must survive the user row.
    user_id = db.Column(db.Integer, nullable=False, index=True)
    email_hash = db.Column(db.String(64), nullable=True, index=True)
    status = db.Column(db.String(20), nullable=False, default="scheduled")
    requested_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    scheduled_for = db.Column(db.DateTime, nullable=False)
    purged_at = db.Column(db.DateTime, nullable=True)
    requested_ip = db.Column(db.String(45), nullable=True)
    error = db.Column(db.Text, nullable=True)

    __table_args__ = (
        db.Index("ix_account_deletions_status_scheduled", "status", "scheduled_for"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "status": self.status,
            "requested_at": utc_iso(self.requested_at),
            "scheduled_for": utc_iso(self.scheduled_for),
            "purged_at": utc_iso(self.purged_at),
        }

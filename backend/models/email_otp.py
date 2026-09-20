from datetime import datetime

from ..extensions import db
from ..utils.timezone_utils import utc_iso


class EmailOtp(db.Model):
    """Single-use email verification codes (OTP).

    Only the SHA-256 hash of the code is stored — a database read never
    reveals a usable code. Codes expire quickly and lock after a few wrong
    guesses; resend pacing is enforced at issue time.
    """

    __tablename__ = "email_otps"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    purpose = db.Column(db.String(32), nullable=False, default="verify_email")
    # For purpose="change_email": the pending new address the code was sent to.
    meta = db.Column(db.String(255), nullable=True)
    code_hash = db.Column(db.String(64), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    attempts = db.Column(db.Integer, nullable=False, default=0)
    consumed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship(
        "User", backref=db.backref("email_otps", cascade="all, delete-orphan"))


    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() >= self.expires_at

    @property
    def is_locked(self) -> bool:
        from ..utils.otp import MAX_OTP_ATTEMPTS

        return (self.attempts or 0) >= MAX_OTP_ATTEMPTS

    @property
    def is_usable(self) -> bool:
        return self.consumed_at is None and not self.is_expired and not self.is_locked

    def to_dict(self):
        return {
            "id": self.id,
            "purpose": self.purpose,
            "expires_at": utc_iso(self.expires_at),
            "attempts": self.attempts,
            "consumed": self.consumed_at is not None,
        }

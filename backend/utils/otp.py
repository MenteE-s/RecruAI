"""Email OTP issuance and verification.

Policy:
- 6-digit codes from a cryptographic RNG (leading zeros allowed).
- Only HMAC-SHA256 hashes (server pepper + user|purpose|meta binding) touch the database.
- 10-minute expiry, 5 wrong guesses lock the code.
- 60-second resend cooldown and max 5 codes per hour per user.
"""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta

OTP_LENGTH = 6
OTP_TTL_MINUTES = 10
MAX_OTP_ATTEMPTS = 5
RESEND_COOLDOWN_SECONDS = 60
MAX_OTPS_PER_HOUR = 5


def generate_code(length: int = OTP_LENGTH) -> str:
    return "".join(secrets.choice("0123456789") for _ in range(length))


def _pepper() -> bytes:
    """Server-side pepper for OTP hashes (never stored in DB)."""
    import os
    try:
        from flask import current_app
        pepper = current_app.config.get("OTP_PEPPER") or current_app.config.get("SECRET_KEY")
    except RuntimeError:
        pepper = None
    pepper = pepper or os.getenv("OTP_PEPPER") or os.getenv("SECRET_KEY") or "dev-otp-pepper-change-me"
    return str(pepper).encode("utf-8")


def hash_code(code: str, context: str = "") -> str:
    """HMAC-SHA256 of the code bound to its context (user|purpose|meta).

    Replaces plain SHA256 so a DB dump cannot be cracked offline without
    the server pepper, and codes cannot be replayed across users/purposes.
    """
    msg = f"{context}|{(code or '').strip()}".encode("utf-8")
    return hmac.new(_pepper(), msg, hashlib.sha256).hexdigest()


def verify_code_hash(code: str, code_hash: str, context: str = "") -> bool:
    try:
        return hmac.compare_digest(hash_code(code.strip(), context), code_hash or "")
    except Exception:
        return False


def issue_otp(user, purpose: str = "verify_email", meta: str = None):
    """Create a fresh OTP row for the user, enforcing pacing limits.

    Returns (code, error). `code` is the plaintext to email (never stored).
    `error` is one of None, "cooldown:<seconds-left>", "rate_limited".
    `meta` scopes pacing and later verification (e.g. the new address).
    """
    from ..extensions import db
    from ..models import EmailOtp

    now = datetime.utcnow()
    recent_q = EmailOtp.query.filter_by(user_id=user.id, purpose=purpose)
    if meta is not None:
        recent_q = recent_q.filter_by(meta=meta)
    recent = recent_q.order_by(EmailOtp.created_at.desc()).first()
    if recent and recent.created_at:
        age = (now - recent.created_at).total_seconds()
        if age < RESEND_COOLDOWN_SECONDS and recent.consumed_at is None:
            return None, f"cooldown:{int(RESEND_COOLDOWN_SECONDS - age)}"

    hour_ago = now - timedelta(hours=1)
    hour_q = EmailOtp.query.filter(
        EmailOtp.user_id == user.id,
        EmailOtp.purpose == purpose,
        EmailOtp.created_at >= hour_ago,
    )
    if meta is not None:
        hour_q = hour_q.filter_by(meta=meta)
    if hour_q.count() >= MAX_OTPS_PER_HOUR:
        return None, "rate_limited"

    code = generate_code()
    context = f"{user.id}|{purpose}|{meta or ''}"
    otp = EmailOtp(
        user_id=user.id,
        purpose=purpose,
        meta=meta,
        code_hash=hash_code(code, context),
        expires_at=now + timedelta(minutes=OTP_TTL_MINUTES),
        attempts=0,
    )
    db.session.add(otp)
    db.session.commit()
    return code, None


def check_otp(user, code: str, purpose: str = "verify_email", meta: str = None):
    """Validate a submitted code against the user's latest unconsumed OTP.

    Returns (ok, error) where error is one of None, "no_code",
    "expired", "locked", "invalid". When `meta` is given the code must have
    been issued for that exact value (e.g. the same new address).
    """
    from ..extensions import db
    from ..models import EmailOtp

    now = datetime.utcnow()
    q = EmailOtp.query.filter_by(user_id=user.id, purpose=purpose, consumed_at=None)
    if meta is not None:
        q = q.filter_by(meta=meta)
    otp = q.order_by(EmailOtp.created_at.desc()).first()
    if otp is None:
        return False, "no_code"
    if otp.is_expired:
        return False, "expired"
    if otp.is_locked:
        return False, "locked"
    context = f"{user.id}|{purpose}|{meta or ''}"
    if not verify_code_hash(code or "", otp.code_hash, context):
        otp.attempts = (otp.attempts or 0) + 1
        db.session.commit()
        if otp.is_locked:
            return False, "locked"
        return False, "invalid"
    otp.consumed_at = now
    db.session.commit()
    return True, None

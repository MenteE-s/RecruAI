"""Short-lived access tokens + rotating refresh-token sessions.

Design:
- Access tokens are 15-minute JWTs returned in JSON and kept in frontend memory.
- The refresh token is an opaque 384-bit value in an HttpOnly, Secure,
  SameSite=Lax cookie scoped to /api/auth. Only its SHA-256 hash is stored.
- Every refresh rotates the token. Reusing an old token outside a short
  concurrency grace window revokes the whole family (stolen-token detection).
- Logout and password changes revoke the family / every family for the user.
"""

from datetime import datetime, timedelta
import hashlib
import logging
import secrets

from flask import current_app, jsonify, request
from flask_jwt_extended import create_access_token

from .. import api_bp
from ...extensions import db
from ...models import RefreshToken, User
from ...utils.cache import invalidate_auth_cache
from ...utils.security import log_security_event

logger = logging.getLogger(__name__)


def _cookie_name():
    return current_app.config.get("REFRESH_COOKIE_NAME", "refresh_token")


def _cookie_path():
    return current_app.config.get("REFRESH_COOKIE_PATH", "/api/auth")


def _cookie_domain():
    return current_app.config.get("REFRESH_COOKIE_DOMAIN") or None


def _reuse_grace_seconds():
    try:
        return max(0, int(current_app.config.get("REFRESH_REUSE_GRACE_SECONDS", 10)))
    except (TypeError, ValueError):
        return 10


def _ttl_seconds():
    try:
        days = int(current_app.config.get("REFRESH_TOKEN_TTL_DAYS", 30))
    except (TypeError, ValueError):
        days = 30
    return max(1, days) * 24 * 60 * 60


def hash_refresh_token(raw_token: str) -> str:
    return hashlib.sha256((raw_token or "").encode("utf-8")).hexdigest()


def _new_token_value() -> str:
    # 48 bytes -> 64 URL-safe characters; far beyond brute-force range.
    return secrets.token_urlsafe(48)


def _client_metadata():
    try:
        ua = (request.user_agent.string or "")[:255]
    except Exception:
        ua = ""
    return ua, (request.remote_addr or "")[:64]


def _create_refresh_row(user, family_id=None, now=None):
    now = now or datetime.utcnow()
    raw_token = _new_token_value()
    ua, ip = _client_metadata()
    row = RefreshToken(
        user_id=user.id,
        family_id=family_id or secrets.token_hex(16),
        token_hash=hash_refresh_token(raw_token),
        expires_at=now + timedelta(seconds=_ttl_seconds()),
        created_at=now,
        user_agent=ua,
        ip_address=ip,
    )
    db.session.add(row)
    return raw_token, row


def access_token_expires_in() -> int:
    try:
        return int(current_app.config["JWT_ACCESS_TOKEN_EXPIRES"].total_seconds())
    except (KeyError, AttributeError, TypeError, ValueError):
        return 900


def issue_access_token(user) -> str:
    claims = {
        "role": user.role,
        "organization_id": user.organization_id,
        "ver": int(user.token_version or 0),
    }
    return create_access_token(identity=str(user.id), additional_claims=claims)


def create_session_tokens(user):
    """Create a new refresh family and access token. Commits the refresh row."""
    raw_refresh, _ = _create_refresh_row(user)
    db.session.commit()
    return issue_access_token(user), raw_refresh


def set_refresh_cookie(response, raw_token: str):
    response.set_cookie(
        _cookie_name(),
        raw_token,
        max_age=_ttl_seconds(),
        httponly=True,
        secure=bool(current_app.config.get("REFRESH_COOKIE_SECURE", False)),
        samesite=current_app.config.get("REFRESH_COOKIE_SAMESITE", "Lax"),
        path=_cookie_path(),
        domain=_cookie_domain(),
    )
    response.headers["Cache-Control"] = "no-store"
    return response


def clear_refresh_cookie(response):
    response.delete_cookie(
        _cookie_name(),
        path=_cookie_path(),
        domain=_cookie_domain(),
        secure=bool(current_app.config.get("REFRESH_COOKIE_SECURE", False)),
        httponly=True,
        samesite=current_app.config.get("REFRESH_COOKIE_SAMESITE", "Lax"),
    )
    return response


def _revoke_family(family_id: str, now=None):
    now = now or datetime.utcnow()
    RefreshToken.query.filter(
        RefreshToken.family_id == family_id,
        RefreshToken.revoked_at.is_(None),
    ).update({RefreshToken.revoked_at: now}, synchronize_session=False)


def revoke_refresh_family(family_id: str):
    if not family_id:
        return
    _revoke_family(family_id)
    db.session.commit()


def revoke_all_refresh_tokens(user_id: int, commit: bool = True):
    """Kill every refresh session for a user (password change/reset).

    Pass ``commit=False`` when the caller is already changing ``users`` in the
    same transaction so the password hash/version and the revocations land
    atomically.
    """
    if not user_id:
        return
    RefreshToken.query.filter(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked_at.is_(None),
    ).update({RefreshToken.revoked_at: datetime.utcnow()}, synchronize_session=False)
    if commit:
        db.session.commit()


def revoke_cookie_family():
    """Revoke the family referenced by the current refresh cookie, if any."""
    raw = request.cookies.get(_cookie_name())
    if not raw:
        return False
    row = RefreshToken.query.filter_by(
        token_hash=hash_refresh_token(raw)
    ).first()
    if not row:
        return False
    revoke_refresh_family(row.family_id)
    return True


def _origin_allowed() -> bool:
    """CSRF defense for cookie-bearing endpoints.

    Browsers send Origin on cross-origin POSTs. A missing Origin is allowed for
    non-browser clients and same-origin form posts; a present-but-wrong Origin
    is always rejected.
    """
    origin = request.headers.get("Origin")
    if not origin:
        return True
    allowed = {
        item.strip().rstrip("/")
        for item in current_app.config.get("FRONTEND_ORIGIN", "").split(",")
        if item.strip()
    }
    return origin.rstrip("/") in allowed


def _refresh_error(message: str, code: str, status: int = 401, clear_cookie: bool = True):
    response = jsonify({"error": message, "code": code})
    response.status_code = status
    response.headers["Cache-Control"] = "no-store"
    if clear_cookie:
        clear_refresh_cookie(response)
    return response


@api_bp.route("/auth/refresh", methods=["POST"])
def refresh_session():
    """Rotate the refresh cookie and mint a new short-lived access token."""
    if not _origin_allowed():
        return _refresh_error(
            "Cross-origin refresh is not allowed.", "origin_not_allowed", 403,
            clear_cookie=False,
        )

    raw_token = request.cookies.get(_cookie_name())
    if not raw_token:
        return _refresh_error(
            "No refresh session. Please sign in.", "no_refresh_token", 401
        )

    token_hash = hash_refresh_token(raw_token)
    now = datetime.utcnow()
    # Row lock makes rotation atomic across gunicorn workers.
    row = RefreshToken.query.filter_by(token_hash=token_hash).with_for_update().first()

    if row is None:
        return _refresh_error(
            "This session is no longer valid. Please sign in.", "invalid_refresh_token", 401
        )

    if row.revoked_at is not None:
        return _refresh_error(
            "This session has been revoked. Please sign in.", "refresh_revoked", 401
        )

    if row.expires_at <= now:
        row.revoked_at = now
        db.session.commit()
        return _refresh_error(
            "This session has expired. Please sign in.", "refresh_expired", 401
        )

    if row.used_at is not None:
        age = max(0.0, (now - row.used_at).total_seconds())
        if age > _reuse_grace_seconds():
            _revoke_family(row.family_id, now)
            db.session.commit()
            try:
                log_security_event(
                    "refresh_token_reuse_detected",
                    user_id=row.user_id,
                    ip_address=request.remote_addr,
                    details={"family_id": row.family_id},
                )
            except Exception:
                logger.exception("Failed to log refresh-token reuse")
            return _refresh_error(
                "This session was already used. Please sign in again.",
                "refresh_reuse",
                401,
            )
        # Two tabs (or a retry racing a rotation) may present the same token
        # within seconds. Allow that without treating it as theft.
        logger.info(
            "refresh token reused inside grace window user=%s age=%.1fs",
            row.user_id,
            age,
        )

    user = db.session.get(User, row.user_id)
    if user is None or not user.email_verified:
        _revoke_family(row.family_id, now)
        db.session.commit()
        return _refresh_error(
            "This session is no longer valid. Please sign in.", "refresh_user_invalid", 401
        )

    raw_refresh, new_row = _create_refresh_row(user, family_id=row.family_id, now=now)
    row.used_at = row.used_at or now
    db.session.add(new_row)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        logger.exception("Failed to rotate refresh token")
        return _refresh_error(
            "Could not refresh the session. Please try again.", "refresh_failed", 500
        )

    try:
        invalidate_auth_cache(user.id)
    except Exception:
        pass

    access_token = issue_access_token(user)
    response = jsonify({
        "access_token": access_token,
        "expires_in": access_token_expires_in(),
        "user": user.to_dict(),
    })
    set_refresh_cookie(response, raw_refresh)
    return response

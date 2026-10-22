"""Forgot-password and reset-password endpoints.

The reset flow deliberately reuses the hashed email OTP infrastructure instead
of inventing a second token table:

  POST /api/auth/password/forgot   -> issue a 6-digit, 10-minute code
  POST /api/auth/password/reset    -> consume it, set the new password

Security rules:
- Forgot always returns the same generic response, whether the address exists
  or not. A minimum response time makes the two paths less distinguishable.
- Per-user OTP pacing (60s cooldown, 5/hour, 5 attempts) is inherited from
  utils.otp; Flask-Limiter adds a per-IP cap in app.py.
- A successful reset bumps User.token_version, invalidating every JWT issued
  before the reset, and clears lockout state.
"""

import time
from datetime import datetime

from flask import request, jsonify

from .. import api_bp
from ...extensions import db
from ...models import User
from ...utils.cache import invalidate_auth_cache
from ...utils.email_service import (
    maybe_dev_log_otp,
    send_password_changed_email,
    send_password_reset_email,
)
from ...utils.kafka_service import kafka_service
from ...utils.otp import OTP_TTL_MINUTES, check_otp, issue_otp
from ...utils.security import (
    log_security_event,
    sanitize_input,
    validate_email,
    validate_password_strength,
)

GENERIC_FORGOT_MESSAGE = (
    "If an account exists for this email, a reset code has been sent."
)
INVALID_RESET_MESSAGE = (
    "Invalid or expired reset code. Request a new code and try again."
)

# Sending an email takes long enough that an immediate response for an unknown
# address is observable. Keep both paths above this floor. This is deliberately
# small: it is an anti-enumeration speed bump, not a substitute for the generic
# response and rate limits.
MIN_FORGOT_RESPONSE_SECONDS = 0.45


def _generic_forgot_response(started_at: float):
    remaining = MIN_FORGOT_RESPONSE_SECONDS - (time.monotonic() - started_at)
    if remaining > 0:
        time.sleep(remaining)
    return jsonify({
        "message": GENERIC_FORGOT_MESSAGE,
        "expires_in_minutes": OTP_TTL_MINUTES,
    }), 200


def _invalid_reset_response():
    return jsonify({
        "error": INVALID_RESET_MESSAGE,
        "code": "invalid_reset_code",
    }), 400


@api_bp.route("/auth/password/forgot", methods=["POST"])
def forgot_password():
    started_at = time.monotonic()
    try:
        data = request.get_json()
    except Exception:
        return jsonify({"error": "Invalid JSON in request body"}), 400

    email = sanitize_input((data or {}).get("email", "") or "")
    if not email or not validate_email(email):
        return jsonify({"error": "Enter a valid email address."}), 400

    user = User.query.filter_by(email=email).first()
    if user is None:
        # Same response as a real account. Log internally for abuse detection.
        log_security_event(
            "password_reset_requested_unknown_email",
            ip_address=request.remote_addr,
            email=email,
        )
        return _generic_forgot_response(started_at)

    code, err = issue_otp(user, purpose="password_reset")
    if err:
        # Cooldown/rate-limit is intentionally hidden from the caller: telling
        # them the account exists is exactly what this endpoint must not do.
        log_security_event(
            "password_reset_request_throttled",
            user_id=user.id,
            ip_address=request.remote_addr,
            email=email,
            details={"reason": err},
        )
        return _generic_forgot_response(started_at)

    sent, send_err = send_password_reset_email(user.email, user.name, code)
    if not sent:
        maybe_dev_log_otp(user.email, code)
        log_security_event(
            "password_reset_email_failed",
            user_id=user.id,
            ip_address=request.remote_addr,
            email=email,
            details={"error": send_err},
        )
    else:
        log_security_event(
            "password_reset_code_sent",
            user_id=user.id,
            ip_address=request.remote_addr,
            email=email,
        )

    try:
        kafka_service.emit_event("password_reset_requested", {
            "user_id": user.id,
            "email": user.email,
            "ip": request.remote_addr,
        })
    except Exception:
        pass

    return _generic_forgot_response(started_at)


@api_bp.route("/auth/password/reset", methods=["POST"])
def reset_password():
    try:
        data = request.get_json()
    except Exception:
        return jsonify({"error": "Invalid JSON in request body"}), 400

    payload = data or {}
    email = sanitize_input(payload.get("email", "") or "")
    code = str(payload.get("code", "") or "").strip()
    new_password = payload.get("new_password", "") or ""

    if not email or not code or not new_password:
        return jsonify({
            "error": "email, code and new_password are required",
        }), 400
    if not validate_email(email):
        return jsonify({"error": "Enter a valid email address."}), 400

    # Validate before consuming the OTP: a weak password must not burn the code.
    valid, message = validate_password_strength(new_password)
    if not valid:
        return jsonify({"error": message}), 400

    user = User.query.filter_by(email=email).first()
    if user is None:
        log_security_event(
            "password_reset_failed_unknown_email",
            ip_address=request.remote_addr,
            email=email,
        )
        return _invalid_reset_response()

    ok, err = check_otp(user, code, purpose="password_reset")
    if not ok:
        log_security_event(
            "password_reset_failed",
            user_id=user.id,
            ip_address=request.remote_addr,
            email=email,
            details={"reason": err},
        )
        return _invalid_reset_response()

    try:
        user.set_password(new_password)
        # Revoke every token issued before this reset. New logins receive the
        # incremented version in their JWT claims.
        user.token_version = int(user.token_version or 0) + 1
        user.failed_login_attempts = 0
        user.locked_until = None
        # The reset code proves control of the mailbox; treat the address as
        # verified so an account stuck in the pre-verification flow can recover.
        if not user.email_verified:
            user.email_verified = True
            user.email_verified_at = datetime.utcnow()
        db.session.commit()
    except ValueError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
    except Exception:
        db.session.rollback()
        log_security_event(
            "password_reset_failed",
            user_id=user.id,
            ip_address=request.remote_addr,
            email=email,
            details={"reason": "database_error"},
        )
        return jsonify({
            "error": "Could not reset the password. Please try again.",
        }), 500

    try:
        invalidate_auth_cache(user.id)
    except Exception:
        pass

    log_security_event(
        "password_reset_success",
        user_id=user.id,
        ip_address=request.remote_addr,
        email=email,
    )
    try:
        kafka_service.emit_event("password_reset_success", {
            "user_id": user.id,
            "email": user.email,
            "ip": request.remote_addr,
        })
    except Exception:
        pass

    # The reset must succeed even if the notification mail fails.
    try:
        sent, send_err = send_password_changed_email(user.email, user.name)
        if not sent:
            log_security_event(
                "password_changed_email_failed",
                user_id=user.id,
                ip_address=request.remote_addr,
                email=email,
                details={"error": send_err},
            )
    except Exception:
        pass

    return jsonify({
        "message": "Password reset. Sign in with your new password.",
    }), 200

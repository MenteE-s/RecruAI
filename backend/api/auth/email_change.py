"""Verified email change: OTP goes to the NEW address first, only then applies.

Without this, anyone with a brief session could reassign the account to an
address they don't own (and PUT /api/auth/me rejects direct email edits).
"""

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import api_bp
from ...extensions import db
from ...models import User
from ...utils.security import log_security_event, sanitize_input, validate_email
from ...utils.kafka_service import kafka_service
from ...utils.otp import issue_otp, check_otp, OTP_TTL_MINUTES
from ...utils.cache import invalidate_auth_cache
from ...utils.outbox import enqueue_email, EMAIL_CHANGE_OTP, EMAIL_CHANGE_NOTICE


def _current_user():
    try:
        return User.query.get(int(get_jwt_identity()))
    except (TypeError, ValueError):
        return None


@api_bp.route("/auth/email/change-request", methods=["POST"])
@jwt_required()
def request_email_change():
    user = _current_user()
    if not user:
        return jsonify({"error": "user not found"}), 404
    try:
        data = request.get_json()
    except Exception:
        return jsonify({"error": "Invalid JSON in request body"}), 400
    # Security: require password re-auth so a brief session hijack cannot
    # permanently reassign the account.
    current_password = (data or {}).get("current_password", "") or ""
    if not current_password:
        return jsonify({"error": "current_password is required"}), 400
    if not user.check_password(current_password):
        db.session.commit()
        log_security_event("change_email_password_failed", user_id=user.id, ip_address=request.remote_addr)
        return jsonify({"error": "Invalid password"}), 401
    db.session.commit()
    new_email = sanitize_input((data or {}).get("new_email", "") or "")
    if not new_email:
        return jsonify({"error": "new_email is required"}), 400
    if not validate_email(new_email):
        return jsonify({"error": "Invalid email format"}), 400
    if new_email == user.email:
        return jsonify({"error": "This is already your email address."}), 400
    existing = User.query.filter_by(email=new_email).first()
    if existing:
        return jsonify({"error": "This email is already registered."}), 400

    code, err = issue_otp(user, purpose="change_email", meta=new_email)
    if err:
        if err.startswith("cooldown:"):
            wait = err.split(":", 1)[1]
            return jsonify({"error": f"Please wait {wait}s before requesting a new code", "retry_after": int(wait)}), 429
        return jsonify({"error": "Too many codes requested. Please try again later."}), 429

    # Queue delivery: the request only commits the OTP + outbox rows. The
    # outbox worker sends via Resend with retries.
    try:
        enqueue_email(EMAIL_CHANGE_OTP, new_email, {"name": user.name, "code": code})
        db.session.commit()
    except Exception:
        db.session.rollback()
        log_security_event("change_email_otp_failed", user_id=user.id, ip_address=request.remote_addr,
                           email=new_email, details={"error": "enqueue_failed"})
        return jsonify({"error": "Could not queue the code. Please try again."}), 502

    # Dev without Resend: the worker cannot deliver, so keep the local log.
    try:
        from ...utils.email_service import maybe_dev_log_otp

        maybe_dev_log_otp(new_email, code)
    except Exception:
        pass

    log_security_event("change_email_otp_sent", user_id=user.id, ip_address=request.remote_addr, email=new_email)
    return jsonify({"message": f"Verification code sent to {new_email}", "expires_in_minutes": OTP_TTL_MINUTES}), 200


@api_bp.route("/auth/email/change-verify", methods=["POST"])
@jwt_required()
def verify_email_change():
    user = _current_user()
    if not user:
        return jsonify({"error": "user not found"}), 404
    try:
        data = request.get_json()
    except Exception:
        return jsonify({"error": "Invalid JSON in request body"}), 400
    payload = data or {}
    new_email = sanitize_input(payload.get("new_email", "") or "")
    code = str(payload.get("code", "") or "").strip()
    if not new_email or not code:
        return jsonify({"error": "new_email and code are required"}), 400

    ok, err = check_otp(user, code, purpose="change_email", meta=new_email)
    if not ok:
        log_security_event("change_email_verify_failed", user_id=user.id, ip_address=request.remote_addr,
                           email=new_email, details={"reason": err})
        messages = {
            "no_code": "No active code for this address. Please request a new one.",
            "expired": "Code expired. Please request a new one.",
            "locked": "Too many wrong attempts. Please request a new code.",
            "invalid": "Invalid code. Please try again.",
        }
        return jsonify({"error": messages.get(err, "Invalid code")}), 400

    # Re-check ownership at apply time (another account may have claimed it).
    if User.query.filter_by(email=new_email).first():
        return jsonify({"error": "This email was just registered by another account."}), 409

    old_email = user.email
    user.email = new_email
    user.email_verified = True
    from datetime import datetime

    user.email_verified_at = datetime.utcnow()
    db.session.commit()
    try:
        invalidate_auth_cache(user.id)
    except Exception:
        pass
    log_security_event("email_changed", user_id=user.id, ip_address=request.remote_addr,
                       email=new_email, details={"old_email": old_email})
    # Security: notify the old address so the legitimate owner can spot a
    # hijack. Queued — the worker delivers with retries and never blocks the
    # verified change.
    try:
        enqueue_email(EMAIL_CHANGE_NOTICE, old_email, {"name": user.name, "new_email": new_email})
        db.session.commit()
    except Exception:
        db.session.rollback()
        log_security_event("email_change_old_notice_failed", user_id=user.id,
                           ip_address=request.remote_addr, email=old_email,
                           details={"new_email": new_email, "error": "enqueue_failed"})
    log_security_event("email_change_old_notified", user_id=user.id,
                       ip_address=request.remote_addr, email=old_email,
                       details={"new_email": new_email})
    try:
        kafka_service.emit_event("email_changed", {
            "user_id": user.id, "old_email": old_email,
            "new_email": new_email, "ip": request.remote_addr,
        })
    except Exception:
        pass
    return jsonify({"user": user.to_dict()}), 200

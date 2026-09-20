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
from ...utils.email_service import send_otp_email, maybe_dev_log_otp


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

    ok, send_err = send_otp_email(new_email, user.name, code, context="change_email")
    if not ok:
        maybe_dev_log_otp(new_email, code)
        log_security_event("change_email_otp_failed", user_id=user.id, ip_address=request.remote_addr,
                           email=new_email, details={"error": send_err})
        if send_err == "email_not_configured":
            return jsonify({"error": "Email service is not configured. Please contact support."}), 503
        return jsonify({"error": "Could not send the code. Please try again."}), 502

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
    # hijack. TODO: send via Resend using _send() helper (no generic
    # send_email exists yet) — currently logged + Kafka event only.
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

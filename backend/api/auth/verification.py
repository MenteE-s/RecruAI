from datetime import datetime

from flask import request, jsonify, make_response, current_app
from flask_jwt_extended import create_access_token, set_access_cookies

from .. import api_bp
from ...extensions import db
from ...models import User
from ...utils.security import log_security_event, sanitize_input
from ...utils.kafka_service import kafka_service
from ...utils.otp import issue_otp, check_otp, OTP_TTL_MINUTES
from ...utils.email_service import send_otp_email, send_welcome_email, maybe_dev_log_otp


def _send_otp(user):
    """Issue a code and email it. Returns (http_status, payload)."""
    code, err = issue_otp(user)
    if err:
        if err.startswith("cooldown:"):
            wait = err.split(":", 1)[1]
            return 429, {"error": f"Please wait {wait}s before requesting a new code", "retry_after": int(wait)}
        return 429, {"error": "Too many codes requested. Please try again later."}
    ok, send_err = send_otp_email(user.email, user.name, code)
    if not ok:
        maybe_dev_log_otp(user.email, code)
        log_security_event("otp_email_failed", user_id=user.id, ip_address=request.remote_addr,
                           email=user.email, details={"error": send_err})
        if send_err == "email_not_configured":
            return 503, {"error": "Email service is not configured. Please contact support."}
        return 502, {"error": "Could not send the code. Please try again."}
    log_security_event("otp_sent", user_id=user.id, ip_address=request.remote_addr, email=user.email)
    return 200, {"message": "Verification code sent", "expires_in_minutes": OTP_TTL_MINUTES}


@api_bp.route("/auth/otp/request", methods=["POST"])
def request_email_otp():
    try:
        data = request.get_json()
    except Exception:
        return jsonify({"error": "Invalid JSON in request body"}), 400
    email = sanitize_input((data or {}).get("email", ""))
    if not email:
        return jsonify({"error": "email is required"}), 400
    user = User.query.filter_by(email=email).first()
    # Same response shape for unknown emails so addresses can't be enumerated.
    if not user:
        log_security_event("otp_request_unknown_email", ip_address=request.remote_addr, email=email)
        return jsonify({"message": "If an account exists for this email, a code was sent."}), 200
    if user.email_verified:
        return jsonify({"message": "Email is already verified. Please sign in.", "already_verified": True}), 200
    status, payload = _send_otp(user)
    return jsonify(payload), status


@api_bp.route("/auth/otp/verify", methods=["POST"])
def verify_email_otp():
    try:
        data = request.get_json()
    except Exception:
        return jsonify({"error": "Invalid JSON in request body"}), 400
    payload = data or {}
    email = sanitize_input(payload.get("email", ""))
    code = str(payload.get("code", "") or "").strip()
    if not email or not code:
        return jsonify({"error": "email and code are required"}), 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Invalid code"}), 400
    if user.email_verified:
        return jsonify({"error": "Email is already verified. Please sign in."}), 400

    ok, err = check_otp(user, code)
    if not ok:
        log_security_event("otp_verify_failed", user_id=user.id, ip_address=request.remote_addr,
                           email=email, details={"reason": err})
        messages = {
            "no_code": "No active code. Please request a new one.",
            "expired": "Code expired. Please request a new one.",
            "locked": "Too many wrong attempts. Please request a new code.",
            "invalid": "Invalid code. Please try again.",
        }
        return jsonify({"error": messages.get(err, "Invalid code")}), 400

    # First verification: flip the flag, greet, announce.
    user.email_verified = True
    user.email_verified_at = datetime.utcnow()
    db.session.commit()
    log_security_event("email_verified", user_id=user.id, ip_address=request.remote_addr, email=email)
    try:
        kafka_service.emit_event("email_verified", {
            "user_id": user.id, "email": email, "role": user.role,
            "organization_id": user.organization_id, "ip": request.remote_addr,
        })
    except Exception:
        current_app.logger.debug("Failed to emit email_verified event", exc_info=True)

    # The greeting mail must never block sign-in.
    try:
        sent, send_err = send_welcome_email(user.email, user.name, user.role)
        if not sent:
            log_security_event("welcome_email_failed", user_id=user.id, ip_address=request.remote_addr,
                               email=email, details={"error": send_err})
    except Exception:
        current_app.logger.debug("Failed to send welcome email", exc_info=True)

    additional_claims = {"role": user.role, "organization_id": user.organization_id}
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    resp = make_response(jsonify({"access_token": access_token, "user": user.to_dict()}), 200)
    set_access_cookies(resp, access_token)
    return resp

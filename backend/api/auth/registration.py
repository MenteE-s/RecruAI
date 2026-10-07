from flask import request, jsonify, current_app
from .. import api_bp
from ...extensions import db
from ...models import User
from ...utils.security import log_security_event, sanitize_input, validate_email
from ...utils.kafka_service import kafka_service
from .verification import _send_otp

@api_bp.route("/auth/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
    except Exception:
        log_security_event("invalid_json_request", ip_address=request.remote_addr)
        return jsonify({"error": "Invalid JSON in request body"}), 400

    email = sanitize_input(data.get("email", ""))
    password = data.get("password")
    name = sanitize_input(data.get("name", ""))
    role = sanitize_input(data.get("role") or "individual") or "individual"
    referral_email = sanitize_input(data.get("referral_email", ""))

    if not email or not password:
        log_security_event("missing_credentials", ip_address=request.remote_addr)
        return jsonify({"error": "email and password are required"}), 400

    if not validate_email(email):
        log_security_event("invalid_email_format", ip_address=request.remote_addr, email=email)
        return jsonify({"error": "Invalid email format"}), 400

    if User.query.filter_by(email=email).first():
        log_security_event("duplicate_registration_attempt", ip_address=request.remote_addr, email=email)
        kafka_service.emit_event("registration_failed", {"email": email, "reason": "email_exists", "ip": request.remote_addr})
        return jsonify({"error": "email already registered"}), 400

    # Signup is individuals-only. Companies are created from inside the app by
    # an already-signed-in user (POST /api/organizations/page), so no org can
    # ever be conjured up during registration. An absent/blank role is treated
    # as the default rather than a rejected request; any explicit non-individual
    # role is a hard 400 so a stale client cannot still register companies.
    if role != "individual":
        log_security_event("organization_signup_rejected", ip_address=request.remote_addr, email=email)
        kafka_service.emit_event("registration_failed", {"email": email, "reason": "role_not_individual", "role": role, "ip": request.remote_addr})
        return jsonify({"error": "Company signups are not available here. Create your individual account first, then create a company page from inside your account."}), 400

    user = User(email=email, name=name, role="individual", plan="trial")

    # Public profile handle (/in/<slug>). Generated up front so the unique
    # index can never reject the insert; retried on the (practically
    # impossible) collision rather than looping forever.
    from ...utils.slug import generate_unique_slug
    try:
        user.profile_slug = generate_unique_slug(User)
    except RuntimeError:
        log_security_event("profile_slug_generation_failed", email=email)
        return jsonify({"error": "Could not create your account. Please try again."}), 500

    # Referral tracking — lenient: store whatever email was typed; link only on match.
    referred_by_user = None
    if referral_email:
        user.referred_by_email = referral_email
        referred_by_user = User.query.filter_by(email=referral_email).first()
        if referred_by_user and referred_by_user.id != user.id:
            user.referred_by_user_id = referred_by_user.id

    try:
        user.set_password(password)
    except ValueError as e:
        log_security_event("weak_password_registration", ip_address=request.remote_addr, email=email)
        return jsonify({"error": str(e)}), 400

    try:
        db.session.add(user)
        db.session.commit()

        # Referral notification (best-effort — never fail registration)
        if referred_by_user and user.referred_by_user_id:
            try:
                from ...api.notifications.routes import create_profile_notification
                create_profile_notification(
                    referred_by_user.id,
                    "referral_signup",
                    f"{user.name or user.email} signed up with your referral link",
                    extra={"referral_user_id": user.id, "referral_email": user.email},
                )
            except Exception:
                current_app.logger.debug("Failed to create referral notification", exc_info=True)

        log_security_event("registration_success", user_id=user.id, ip_address=request.remote_addr, email=email, details={"role": "individual"})
        kafka_service.emit_event("user_registered", {
            "user_id": user.id,
            "email": email,
            "role": "individual",
            "organization_id": user.organization_id,
            "referred_by_email": referral_email or None,
            "referred_by_user_id": user.referred_by_user_id,
            "ip": request.remote_addr
        })
    except Exception as e:
        db.session.rollback()
        log_security_event("registration_failed", user_id=None, ip_address=request.remote_addr, email=email, details={"error": str(e)})
        kafka_service.emit_event("registration_failed", {"email": email, "reason": "internal_error", "ip": request.remote_addr})
        return jsonify({"error": "Failed to register user. Please try again."}), 500

    # Email-first flow: no token yet. The account stays unverified until the
    # OTP step succeeds, which is also when the welcome email goes out.
    status, otp_payload = _send_otp(user)
    if status != 200:
        # Account exists; the client can retry sending the code.
        return jsonify({
            "user": user.to_dict(),
            "verification_required": True,
            "otp_error": otp_payload.get("error", "Could not send the code."),
        }), 201
    return jsonify({
        "user": user.to_dict(),
        "verification_required": True,
        "message": "Account created. Enter the verification code sent to your email.",
    }), 201
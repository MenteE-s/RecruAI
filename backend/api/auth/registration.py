from flask import request, jsonify, current_app
from .. import api_bp
from ...extensions import db
from ...models import User, Organization, TeamMember
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
    role = sanitize_input(data.get("role", "individual"))
    organization_name = sanitize_input(data.get("organization_name", ""))
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

    if role not in ["individual", "organization"]:
        log_security_event("invalid_role_registration", ip_address=request.remote_addr, email=email)
        kafka_service.emit_event("registration_failed", {"email": email, "reason": "invalid_role", "role": role, "ip": request.remote_addr})
        return jsonify({"error": "Invalid role specified"}), 400

    user = User(email=email, name=name, role=role, plan="trial")

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

    if role == "organization":
        if not organization_name:
            log_security_event("missing_org_name", ip_address=request.remote_addr, email=email)
            return jsonify({"error": "organization_name is required for organization signups"}), 400
        # Security: never attach a new signup to an existing organization —
        # that would grant the stranger Admin rights over someone else's org.
        # Joining an existing org is only possible via team invitation.
        org = Organization.query.filter_by(name=organization_name).first()
        if org:
            log_security_event("org_name_taken", ip_address=request.remote_addr, email=email)
            return jsonify({"error": "An organization with this name already exists. Ask an admin to invite you instead."}), 400
        org = Organization(name=organization_name)
        db.session.add(org)
        # flush so org.id is available
        db.session.flush()
        user.organization = org

    try:
        db.session.add(user)
        # flush so user.id is available for team member creation
        db.session.flush()

        # if this is an organization signup, add the user as an Admin team member
        if role == "organization":
            team_member = TeamMember(
                organization_id=org.id,
                user_id=user.id,
                role="Admin"
            )
            db.session.add(team_member)

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

        log_security_event("registration_success", user_id=user.id, ip_address=request.remote_addr, email=email, details={"role": role})
        kafka_service.emit_event("user_registered", {
            "user_id": user.id,
            "email": email,
            "role": role,
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
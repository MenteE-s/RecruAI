from flask import request, jsonify, make_response
from flask_jwt_extended import create_access_token, set_access_cookies
from .. import api_bp
from ...extensions import db
from ...models import User, Organization, TeamMember
from ...utils.security import log_security_event, sanitize_input, validate_email
from ...utils.kafka_service import kafka_service

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

    try:
        user.set_password(password)
    except ValueError as e:
        log_security_event("weak_password_registration", ip_address=request.remote_addr, email=email)
        return jsonify({"error": str(e)}), 400

    if role == "organization":
        if not organization_name:
            log_security_event("missing_org_name", ip_address=request.remote_addr, email=email)
            return jsonify({"error": "organization_name is required for organization signups"}), 400
        org = Organization.query.filter_by(name=organization_name).first()
        if not org:
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
        log_security_event("registration_success", user_id=user.id, ip_address=request.remote_addr, email=email, details={"role": role})
        kafka_service.emit_event("user_registered", {
            "user_id": user.id,
            "email": email,
            "role": role,
            "organization_id": user.organization_id,
            "ip": request.remote_addr
        })
    except Exception as e:
        db.session.rollback()
        log_security_event("registration_failed", user_id=None, ip_address=request.remote_addr, email=email, details={"error": str(e)})
        kafka_service.emit_event("registration_failed", {"email": email, "reason": "internal_error", "error": str(e), "ip": request.remote_addr})
        return jsonify({"error": f"Failed to register user: {str(e)}"}), 500

    # generate an access token on successful registration so frontend can auto-login
    # include role and organization_id as additional claims so frontend and protected APIs
    # can make quick decisions without trusting client-sent values
    additional_claims = {"role": user.role, "organization_id": user.organization_id}
    # ensure the JWT "sub" (subject) is a string to satisfy the JWT library
    # and Flask-JWT-Extended expectations
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    # set token in an HttpOnly cookie for safer storage; also return token in
    # body for backward compatibility
    resp = make_response(jsonify({"user": user.to_dict(), "access_token": access_token}), 201)
    set_access_cookies(resp, access_token)
    return resp
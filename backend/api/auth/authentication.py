from flask import request, jsonify, make_response
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    set_access_cookies,
    unset_jwt_cookies,
)
from .. import api_bp
from ...extensions import db
from ...models import User
from ...utils.security import log_security_event, sanitize_input
from ...utils.kafka_service import kafka_service

@api_bp.route("/auth/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
    except Exception:
        log_security_event("invalid_json_request", ip_address=request.remote_addr)
        return jsonify({"error": "Invalid JSON in request body"}), 400

    if not data:
        return jsonify({"error": "email and password are required"}), 400

    email = sanitize_input(data.get("email", ""))
    password = data.get("password")

    if not email or not password:
        log_security_event("missing_credentials", ip_address=request.remote_addr)
        return jsonify({"error": "email and password are required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        log_security_event("login_attempt_unknown_user", ip_address=request.remote_addr, email=email)
        kafka_service.emit_event("user_login_failed", {"email": email, "reason": "unknown_user", "ip": request.remote_addr})
        return jsonify({"error": "invalid credentials"}), 401

    if user.is_account_locked():
        log_security_event("login_attempt_locked_account", user_id=user.id, ip_address=request.remote_addr, email=email)
        kafka_service.emit_event("user_login_failed", {"user_id": user.id, "email": email, "reason": "account_locked", "ip": request.remote_addr})
        return jsonify({"error": "Account is temporarily locked due to too many failed login attempts"}), 423

    if not user.check_password(password):
        log_security_event("login_failed", user_id=user.id, ip_address=request.remote_addr, email=email)
        db.session.commit()
        kafka_service.emit_event("user_login_failed", {"user_id": user.id, "email": email, "reason": "invalid_password", "ip": request.remote_addr})
        return jsonify({"error": "invalid credentials"}), 401

    log_security_event("login_success", user_id=user.id, ip_address=request.remote_addr, email=email)
    kafka_service.emit_event("user_login_success", {
        "user_id": user.id,
        "email": email,
        "role": user.role,
        "organization_id": user.organization_id,
        "ip": request.remote_addr
    })
    db.session.commit()

    additional_claims = {"role": user.role, "organization_id": user.organization_id}
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    resp = make_response(jsonify({"access_token": access_token, "user": user.to_dict()}), 200)
    set_access_cookies(resp, access_token)
    return resp

@api_bp.route("/auth/logout", methods=["POST"])
@jwt_required(optional=True)
def logout():
    uid = get_jwt_identity()
    if uid:
        try:
            kafka_service.emit_event("user_logout", {"user_id": int(uid), "ip": request.remote_addr})
        except:
            pass

    resp = make_response(jsonify({"msg": "logged out"}), 200)
    unset_jwt_cookies(resp)
    return resp

@api_bp.route("/auth/me", methods=["GET"])
@jwt_required()
def get_me():
    uid = get_jwt_identity()
    try:
        user_id = int(uid)
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "user not found"}), 404
    except (ValueError, TypeError):
        return jsonify({"error": "invalid user identity"}), 400

    return jsonify({"user": user.to_dict()}), 200

@api_bp.route("/auth/me", methods=["PUT"])
@jwt_required()
def update_me():
    uid = get_jwt_identity()
    try:
        user_id = int(uid)
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "user not found"}), 404
    except (ValueError, TypeError):
        return jsonify({"error": "invalid user identity"}), 400

    try:
        data = request.get_json()
    except Exception:
        log_security_event("invalid_json_request", user_id=user.id, ip_address=request.remote_addr)
        return jsonify({"error": "Invalid JSON in request body"}), 400

    from ...utils.security import validate_request_size
    is_valid, error_msg = validate_request_size(data)
    if not is_valid:
        log_security_event("request_size_exceeded", user_id=user.id, ip_address=request.remote_addr, details={"error": error_msg})
        return jsonify({"error": error_msg}), 400

    allowed_fields = ['name', 'phone', 'location', 'website', 'linkedin']

    for field in allowed_fields:
        if field in data:
            value = sanitize_input(data[field]) if data[field] else None
            setattr(user, field, value)

    if 'email' in data:
        email = sanitize_input(data.get('email', ''))
        if not email:
            return jsonify({"error": "email cannot be empty"}), 400

        from ...utils.security import validate_email
        if not validate_email(email):
            log_security_event("invalid_email_format", user_id=user.id, ip_address=request.remote_addr, email=email)
            return jsonify({"error": "Invalid email format"}), 400

        existing_user = User.query.filter_by(email=email).first()
        if existing_user and existing_user.id != user_id:
            log_security_event("duplicate_email_update_attempt", user_id=user.id, ip_address=request.remote_addr, email=email)
            return jsonify({"error": "email already exists"}), 400

        user.email = email

    try:
        db.session.commit()
        log_security_event("user_profile_updated", user_id=user.id, ip_address=request.remote_addr, details={"fields_updated": list(data.keys())})
        return jsonify({"user": user.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        log_security_event("user_profile_update_failed", user_id=user.id, ip_address=request.remote_addr, details={"error": str(e)})
        return jsonify({"error": "Failed to update profile"}), 500

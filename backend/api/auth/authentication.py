from flask import request, jsonify, make_response, current_app
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
    set_access_cookies,
    unset_jwt_cookies,
)
from .. import api_bp
from ...extensions import db
from ...models import User
from ...utils.security import log_security_event, sanitize_input
from ...utils.kafka_service import kafka_service
from ...utils.cache import (
    cache_get,
    cache_set,
    invalidate_auth_cache,
    block_jti,
    _build_key,
    CACHE_TTL,
)

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

    if not user.email_verified:
        log_security_event("login_blocked_unverified", user_id=user.id, ip_address=request.remote_addr, email=email)
        # Help the user forward: (re)send a code, respecting the cooldown.
        try:
            from .verification import _send_otp
            code_status, _ = _send_otp(user)
            resent = code_status == 200
        except Exception:
            resent = False
        return jsonify({
            "error": "Please verify your email first. Enter the code we sent you.",
            "code": "email_not_verified",
            "email": email,
            "code_resent": resent,
        }), 403

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

@api_bp.route("/auth/password/change", methods=["POST"])
@jwt_required()
def change_password():
    """Change password for the current user (requires current password).

    Updates password_changed_at so future token-freshness checks can reject
    pre-change tokens. Revokes the current token + clears auth cache.
    """
    try:
        uid = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid user identity"}), 400
    user = User.query.get(uid)
    if not user:
        return jsonify({"error": "user not found"}), 404
    try:
        data = request.get_json()
    except Exception:
        return jsonify({"error": "Invalid JSON in request body"}), 400
    current_password = (data or {}).get("current_password", "") or ""
    new_password = (data or {}).get("new_password", "") or ""
    if not current_password or not new_password:
        return jsonify({"error": "current_password and new_password are required"}), 400
    if not user.check_password(current_password):
        db.session.commit()
        log_security_event("password_change_failed", user_id=user.id, ip_address=request.remote_addr)
        return jsonify({"error": "Invalid current password"}), 401
    try:
        user.set_password(new_password)
    except ValueError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
    db.session.commit()
    try:
        jti = get_jwt().get("jti")
        exp = current_app.config.get("JWT_ACCESS_TOKEN_EXPIRES")
        try:
            ttl = int(exp.total_seconds())
        except (AttributeError, TypeError, ValueError):
            ttl = CACHE_TTL.get("jwt_blocklist", 7200)
        block_jti(jti, max(ttl, 60))
    except Exception:
        pass
    try:
        invalidate_auth_cache(user.id)
    except Exception:
        pass
    log_security_event("password_changed", user_id=user.id, ip_address=request.remote_addr)
    kafka_service.emit_event("password_changed", {"user_id": user.id, "ip": request.remote_addr})
    return jsonify({"message": "Password changed successfully"}), 200

@api_bp.route("/auth/logout", methods=["POST"])
@jwt_required(optional=True)
def logout():
    uid = get_jwt_identity()
    if uid:
        try:
            kafka_service.emit_event("user_logout", {"user_id": int(uid), "ip": request.remote_addr})
        except:
            pass
        # Security: revoke this token so it cannot be replayed until its
        # natural expiry. Without this, a logged-out (or stolen) JWT stays
        # valid for up to JWT_ACCESS_TOKEN_EXPIRES.
        try:
            jti = get_jwt().get("jti")
            exp = current_app.config.get("JWT_ACCESS_TOKEN_EXPIRES")
            try:
                ttl = int(exp.total_seconds())
            except (AttributeError, TypeError, ValueError):
                ttl = CACHE_TTL.get("jwt_blocklist", 7200)
            block_jti(jti, max(ttl, 60))
        except Exception:
            pass
        try:
            invalidate_auth_cache(int(uid))
        except (TypeError, ValueError):
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
    except (ValueError, TypeError):
        return jsonify({"error": "invalid user identity"}), 400

    # Hot path: frontend calls this on every navigation. Short-TTL Redis cache
    # (90s) with graceful fallback to DB when Redis is unavailable.
    cache_key = _build_key("auth_me", f"user_{user_id}")
    try:
        hit = cache_get(cache_key)
        if hit is not None:
            return jsonify(hit), 200
    except Exception:
        pass

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    payload = {"user": user.to_dict()}
    try:
        cache_set(cache_key, payload, CACHE_TTL.get("auth_me", 90))
    except Exception:
        pass
    return jsonify(payload), 200

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

    allowed_fields = ['name', 'phone', 'location', 'website', 'linkedin', 'headline']

    for field in allowed_fields:
        if field in data:
            value = sanitize_input(data[field]) if data[field] else None
            setattr(user, field, value)

    if 'email' in data:
        # Security: addresses change only through the verified flow
        # (POST /auth/email/change-request + /auth/email/change-verify),
        # which proves ownership of the NEW address first.
        email = sanitize_input(data.get('email', '')) or ""
        if email and email != user.email:
            log_security_event("direct_email_change_blocked", user_id=user.id, ip_address=request.remote_addr, email=email)
            return jsonify({
                "error": "Email changes need verification. Request a code for the new address first.",
                "code": "email_change_requires_verification",
            }), 400

    try:
        db.session.commit()
        try:
            invalidate_auth_cache(user.id)
        except Exception:
            pass
        log_security_event("user_profile_updated", user_id=user.id, ip_address=request.remote_addr, details={"fields_updated": list(data.keys())})
        return jsonify({"user": user.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        log_security_event("user_profile_update_failed", user_id=user.id, ip_address=request.remote_addr, details={"error": str(e)})
        return jsonify({"error": "Failed to update profile"}), 500

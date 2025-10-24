from flask import request, jsonify, make_response
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    set_access_cookies,
    unset_jwt_cookies,
)

from . import api_bp
from ..extensions import db
from ..models import User, Organization


@api_bp.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    role = data.get("role", "individual")
    organization_name = data.get("organization_name")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "email already registered"}), 400

    user = User(email=email, name=name, role=role)
    user.set_password(password)

    # if this is an organization signup, create or reuse the Organization
    if role == "organization":
        if not organization_name:
            return jsonify({"error": "organization_name is required for organization signups"}), 400
        org = Organization.query.filter_by(name=organization_name).first()
        if not org:
            org = Organization(name=organization_name)
            db.session.add(org)
            # flush so org.id is available
            db.session.flush()
        user.organization = org

    db.session.add(user)
    db.session.commit()

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


@api_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "invalid credentials"}), 401

    # Always issue tokens based on the server-side role and organization membership.
    additional_claims = {"role": user.role, "organization_id": user.organization_id}
    # use a string identity so the token's `sub` claim is a string
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    # set cookie and return response
    resp = make_response(jsonify({"access_token": access_token, "user": user.to_dict()}), 200)
    set_access_cookies(resp, access_token)
    return resp


@api_bp.route("/auth/logout", methods=["POST"])
def logout():
    # Unset JWT cookies on logout
    resp = make_response(jsonify({"msg": "logged out"}), 200)
    unset_jwt_cookies(resp)
    return resp


@api_bp.route("/auth/me", methods=["GET"])
@jwt_required()
def me():
    # Return the server-verified user profile. Frontend should use this instead of trusting localStorage.
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if not user:
        return jsonify({"error": "user not found"}), 404
    return jsonify({"user": user.to_dict()}), 200

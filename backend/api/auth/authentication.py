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
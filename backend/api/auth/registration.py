from flask import request, jsonify, make_response
from flask_jwt_extended import create_access_token, set_access_cookies
from .. import api_bp
from ...extensions import db
from ...models import User, Organization, TeamMember

@api_bp.route("/auth/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
    except Exception:
        return jsonify({"error": "Invalid JSON in request body"}), 400

    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    role = data.get("role", "individual")
    organization_name = data.get("organization_name")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "email already registered"}), 400

    user = User(email=email, name=name, role=role, plan="free")
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
    except Exception as e:
        db.session.rollback()
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
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import Organization, TeamMember, User
from ...utils.timezone_utils import is_valid_timezone, get_current_time_info

@api_bp.route("/organizations", methods=["GET"])
def list_organizations():
    orgs = Organization.query.order_by(Organization.id.asc()).all()
    return jsonify([{
        "id": o.id,
        "name": o.name,
        "description": o.description,
        "website": o.website,
        "contact_email": o.contact_email,
        "contact_name": o.contact_name,
        "location": o.location,
        "profile_image": o.profile_image,
        "banner_image": o.banner_image,
        "created_at": o.created_at.isoformat() if o.created_at else None,
    } for o in orgs]), 200

@api_bp.route("/organizations", methods=["POST"])
def create_organization():
    payload = request.get_json(silent=True) or {}
    name = payload.get("name")
    if not name:
        return jsonify({"error": "name required"}), 400

    if Organization.query.filter_by(name=name).first():
        return jsonify({"error": "organization already exists"}), 400

    org = Organization(
        name=name,
        description=payload.get("description"),
        website=payload.get("website"),
        contact_email=payload.get("contact_email"),
        contact_name=payload.get("contact_name"),
        location=payload.get("location"),
    )
    db.session.add(org)
    db.session.commit()
    return jsonify({"id": org.id, "name": org.name}), 201

@api_bp.route("/organizations/<int:org_id>", methods=["GET"])
def get_organization(org_id):
    org = Organization.query.get_or_404(org_id)
    posts = [p.to_dict() for p in org.posts]
    return jsonify({
        "id": org.id,
        "name": org.name,
        "description": org.description,
        "website": org.website,
        "contact_email": org.contact_email,
        "contact_name": org.contact_name,
        "location": org.location,
        "company_size": org.company_size,
        "industry": org.industry,
        "mission": org.mission,
        "vision": org.vision,
        "social_media_links": org.social_media_links,
        "profile_image": org.profile_image,
        "banner_image": org.banner_image,
        "created_at": org.created_at.isoformat() if org.created_at else None,
        "posts": posts,
    })

@api_bp.route("/organizations/<int:org_id>", methods=["PUT"])
def update_organization(org_id):
    org = Organization.query.get_or_404(org_id)
    payload = request.get_json(silent=True) or {}

    # Update basic fields
    if "name" in payload:
        org.name = payload["name"]
    if "description" in payload:
        org.description = payload["description"]
    if "website" in payload:
        org.website = payload["website"]
    if "contact_email" in payload:
        org.contact_email = payload["contact_email"]
    if "contact_name" in payload:
        org.contact_name = payload["contact_name"]
    if "location" in payload:
        org.location = payload["location"]
    if "timezone" in payload:
        tz = payload["timezone"]
        if tz and not is_valid_timezone(tz):
            return jsonify({"error": f"Invalid timezone: {tz}"}), 400
        org.timezone = tz

    db.session.commit()
    return jsonify(org.to_dict()), 200


@api_bp.route("/organizations/<int:org_id>/timezone", methods=["PUT"])
def update_organization_timezone(org_id):
    """Update organization's timezone preference."""
    org = Organization.query.get_or_404(org_id)
    payload = request.get_json(silent=True) or {}
    
    tz = payload.get("timezone")
    if not tz:
        return jsonify({"error": "timezone required"}), 400
    
    if not is_valid_timezone(tz):
        return jsonify({"error": f"Invalid timezone: {tz}"}), 400
    
    org.timezone = tz
    db.session.commit()
    
    return jsonify({
        "message": "Timezone updated",
        "organization": org.to_dict(),
        "current_time": get_current_time_info(tz),
    }), 200


@api_bp.route("/organizations/<int:org_id>/current-time", methods=["GET"])
def get_organization_current_time(org_id):
    """Get current time information in organization's timezone."""
    org = Organization.query.get_or_404(org_id)
    tz = org.timezone or "UTC"
    return jsonify(get_current_time_info(tz)), 200


@api_bp.route("/organizations/<int:org_id>/profile", methods=["PUT"])
def update_organization_profile(org_id):
    org = Organization.query.get_or_404(org_id)
    payload = request.get_json(silent=True) or {}

    # Update profile fields
    if "company_size" in payload:
        org.company_size = payload["company_size"]
    if "industry" in payload:
        org.industry = payload["industry"]
    if "mission" in payload:
        org.mission = payload["mission"]
    if "vision" in payload:
        org.vision = payload["vision"]
    if "social_media_links" in payload:
        # Assume it's a list, store as JSON string
        import json
        org.social_media_links = json.dumps(payload["social_media_links"]) if payload["social_media_links"] else None

    db.session.commit()
    return jsonify(org.to_dict()), 200

@api_bp.route("/organizations/<int:org_id>/team-members", methods=["GET"])
def list_team_members(org_id):
    org = Organization.query.get_or_404(org_id)
    team_members = [tm.to_dict() for tm in org.team_members]
    return jsonify(team_members), 200

@api_bp.route("/organizations/<int:org_id>/team-members", methods=["POST"])
def add_team_member(org_id):
    org = Organization.query.get_or_404(org_id)
    payload = request.get_json(silent=True) or {}
    user_id = payload.get("user_id")
    role = payload.get("role")
    permissions = payload.get("permissions")  # list of permissions
    join_date = payload.get("join_date")

    if not user_id or not role:
        return jsonify({"error": "user_id and role required"}), 400

    # Check if user exists
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    # Check if already a member
    existing = TeamMember.query.filter_by(organization_id=org_id, user_id=user_id).first()
    if existing:
        return jsonify({"error": "user is already a team member"}), 400

    tm = TeamMember(
        organization_id=org_id,
        user_id=user_id,
        role=role,
        permissions=json.dumps(permissions) if permissions else None,
        join_date=join_date
    )
    db.session.add(tm)
    db.session.commit()
    return jsonify(tm.to_dict()), 201

@api_bp.route("/organizations/<int:org_id>/team-members/<int:member_id>", methods=["PUT"])
def update_team_member(org_id, member_id):
    tm = TeamMember.query.filter_by(id=member_id, organization_id=org_id).first_or_404()
    payload = request.get_json(silent=True) or {}

    if "role" in payload:
        tm.role = payload["role"]
    if "permissions" in payload:
        tm.permissions = json.dumps(payload["permissions"]) if payload["permissions"] else None
    if "join_date" in payload:
        tm.join_date = payload["join_date"]

    db.session.commit()
    return jsonify(tm.to_dict()), 200

@api_bp.route("/organizations/<int:org_id>/team-members/<int:member_id>", methods=["DELETE"])
def remove_team_member(org_id, member_id):
    tm = TeamMember.query.filter_by(id=member_id, organization_id=org_id).first_or_404()
    db.session.delete(tm)
    db.session.commit()
    return jsonify({"message": "team member removed"}), 200

@api_bp.route("/organizations/<int:org_id>/users", methods=["GET"])
def list_organization_users(org_id):
    """Get all users belonging to an organization"""
    org = Organization.query.get_or_404(org_id)
    users = User.query.filter_by(organization_id=org_id).all()
    return jsonify([user.to_dict() for user in users]), 200

@api_bp.route("/organizations/<int:org_id>/invite", methods=["POST"])
def invite_team_member(org_id):
    org = Organization.query.get_or_404(org_id)
    payload = request.get_json(silent=True) or {}
    email = payload.get("email")
    role = payload.get("role", "Member")
    permissions = payload.get("permissions")  # list of permissions

    if not email:
        return jsonify({"error": "email required"}), 400

    # Check if user already exists
    user = User.query.filter_by(email=email).first()
    if user:
        # Check if already a member
        existing = TeamMember.query.filter_by(organization_id=org_id, user_id=user.id).first()
        if existing:
            return jsonify({"error": "user is already a team member"}), 400
        user_id = user.id
    else:
        # Create new user with temporary password
        user = User(
            email=email,
            name=email.split('@')[0],  # Use email prefix as name
            role="organization",
            organization_id=org_id
        )
        user.set_password("temppass123")  # Temporary password
        db.session.add(user)
        db.session.flush()  # Get user.id
        user_id = user.id

    # Add to team members
    tm = TeamMember(
        organization_id=org_id,
        user_id=user_id,
        role=role,
        permissions=json.dumps(permissions) if permissions else None,
        join_date=payload.get("join_date")
    )
    db.session.add(tm)
    db.session.commit()
    return jsonify({"message": "invitation sent", "team_member": tm.to_dict()}), 201
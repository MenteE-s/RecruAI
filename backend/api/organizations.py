from flask import request, jsonify
from datetime import datetime

from . import api_bp
from ..extensions import db
from ..models import (
    Organization, Post, TeamMember, User, Experience, Education, Skill,
    Project, Certification, Language
)
import json


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

    db.session.commit()
    return jsonify(org.to_dict()), 200


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
    from ..models import User
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


@api_bp.route("/organizations/<int:org_id>/posts", methods=["GET"])
def list_posts_for_org(org_id):
    org = Organization.query.get_or_404(org_id)
    return jsonify([p.to_dict() for p in org.posts])


@api_bp.route("/posts", methods=["POST"])
def create_post():
    payload = request.get_json(silent=True) or {}
    org_id = payload.get("organization_id")
    title = payload.get("title")
    if not org_id or not title:
        return jsonify({"error": "organization_id and title required"}), 400

    org = Organization.query.get(org_id)
    if not org:
        return jsonify({"error": "organization not found"}), 404

    post = Post(
        organization_id=org_id,
        title=title,
        description=payload.get("description"),
        location=payload.get("location"),
        employment_type=payload.get("employment_type"),
    )
    db.session.add(post)
    db.session.commit()
    return jsonify(post.to_dict()), 201


@api_bp.route("/posts", methods=["GET"])
def list_posts():
    posts = Post.query.order_by(Post.created_at.desc()).all()
    return jsonify([p.to_dict() for p in posts])


@api_bp.route("/seed-demo", methods=["POST", "GET"])
def seed_demo_data():
    # Very small helper endpoint for development — it will create tables and demo data
    # for local dev. DO NOT expose in production.
    import click

    # create tables if missing
    db.create_all()

    # Clear existing demo data first
    try:
        TeamMember.query.delete()
        Post.query.delete()
        User.query.filter(User.role == "individual").delete()  # Only delete individual users, keep org users
        Organization.query.delete()
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to clear existing data: {str(e)}"}), 500

    demo_orgs = [
        {
            "name": "Acme Software Inc",
            "description": "A product-focused software company building modern cloud apps.",
            "website": "https://acme.example.com",
            "contact_email": "recruiting@acme.example.com",
            "contact_name": "Alice Anderson",
            "location": "San Francisco, CA",
        },
        {
            "name": "Brightside Labs",
            "description": "We build developer tools to accelerate teams.",
            "website": "https://brightside.example.com",
            "contact_email": "jobs@brightside.example.com",
            "contact_name": "Ben Bright",
            "location": "Austin, TX",
        },
        {
            "name": "CloudWave",
            "description": "Cloud infrastructure and SRE focused company for scale.",
            "website": "https://cloudwave.example.com",
            "contact_email": "talent@cloudwave.example.com",
            "contact_name": "Carla Cloud",
            "location": "Seattle, WA",
        },
        {
            "name": "NeoDynamics",
            "description": "AI-first startup building tools to improve hiring." ,
            "website": "https://neodynamics.example.com",
            "contact_email": "hello@neodynamics.example.com",
            "contact_name": "David Neo",
            "location": "New York, NY",
        },
    ]

    created = []
    for info in demo_orgs:
        org = Organization(**info)
        db.session.add(org)
        db.session.flush()  # ensure id

        # create users for this organization
        for i in range(1, 6):  # 5 users per organization
            user = User(
                email=f"user{i}@{org.name.lower().replace(' ', '')}.com",
                name=f"User {i} {org.name.split()[0]}",
                role="individual",
                plan="trial",
                organization_id=org.id
            )
            user.set_password("password123")
            db.session.add(user)
            db.session.flush()  # Get user.id

            # Create sample profile data for each user
            # Experience
            exp = Experience(
                user_id=user.id,
                title="Software Developer",
                company=f"{org.name} Inc.",
                location=org.location,
                description=f"Developing software solutions at {org.name}",
                start_date=datetime(2020, 1, 1),
                current_job=True
            )
            db.session.add(exp)

            # Education
            edu = Education(
                user_id=user.id,
                degree="Bachelor of Science in Computer Science",
                school="University of Technology",
                field="Computer Science",
                start_date=datetime(2016, 9, 1),
                end_date=datetime(2020, 5, 1),
                gpa="3.8"
            )
            db.session.add(edu)

            # Skills
            skills_data = [
                ("Python", "advanced", 5),
                ("JavaScript", "intermediate", 4),
                ("React", "intermediate", 3),
                ("SQL", "advanced", 4)
            ]
            for skill_name, level, years in skills_data:
                skill = Skill(
                    user_id=user.id,
                    name=skill_name,
                    level=level,
                    years_experience=years
                )
                db.session.add(skill)

            # Projects
            project = Project(
                user_id=user.id,
                name=f"Project {i}",
                description=f"A sample project developed at {org.name}",
                technologies=json.dumps(["Python", "Django", "PostgreSQL"]),
                github_url=f"https://github.com/{user.name.lower().replace(' ', '')}/project{i}",
                start_date=datetime(2021, 6, 1),
                end_date=datetime(2022, 3, 1)
            )
            db.session.add(project)

            # Certifications
            cert = Certification(
                user_id=user.id,
                name="AWS Certified Developer",
                issuer="Amazon Web Services",
                date_obtained=datetime(2021, 8, 15),
                credential_id=f"AWS-CERT-{user.id}"
            )
            db.session.add(cert)

            # Languages
            lang = Language(
                user_id=user.id,
                name="English",
                proficiency_level="native"
            )
            db.session.add(lang)

        # create three posts for each organization
        for i in range(1, 4):
            post = Post(
                organization_id=org.id,
                title=f"Hiring: Senior Developer {i}",
                description=("We are looking for an experienced developer to join our team. "
                             "You will partner closely with product and engineering to ship features."),
                location=org.location,
                employment_type="Full-time",
            )
            db.session.add(post)

        created.append(org.name)

    db.session.commit()
    return jsonify({"message": "Demo data seeded", "organizations": created}), 201

from flask import request, jsonify

from . import api_bp
from ..extensions import db
from ..models import Organization, Post


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
        "created_at": org.created_at.isoformat() if org.created_at else None,
        "posts": posts,
    })


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

    # if any organizations already exist, return early
    existing = Organization.query.first()
    if existing:
        return jsonify({"message": "Demo data already seeded"}), 200

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

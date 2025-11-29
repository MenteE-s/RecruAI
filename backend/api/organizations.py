from flask import request, jsonify
from datetime import datetime

from . import api_bp
from ..extensions import db
from ..models import (
    Organization, Post, TeamMember, User, Experience, Education, Skill,
    Project, Certification, Language, Application, SavedJob, AIInterviewAgent
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

    if len(title.strip()) < 3:
        return jsonify({"error": "title must be at least 3 characters"}), 400

    if payload.get("salary_min") and payload.get("salary_max"):
        if payload["salary_min"] > payload["salary_max"]:
            return jsonify({"error": "salary_min cannot be greater than salary_max"}), 400

    org = Organization.query.get(org_id)
    if not org:
        return jsonify({"error": "organization not found"}), 404

    post = Post(
        organization_id=org_id,
        title=title,
        description=payload.get("description"),
        location=payload.get("location"),
        employment_type=payload.get("employment_type"),
        category=payload.get("category"),
        salary_min=payload.get("salary_min"),
        salary_max=payload.get("salary_max"),
        salary_currency=payload.get("salary_currency", "USD"),
        requirements=json.dumps(payload.get("requirements", [])) if payload.get("requirements") else None,
        application_deadline=payload.get("application_deadline"),
        status=payload.get("status", "active"),
    )
    db.session.add(post)
    db.session.commit()
    return jsonify(post.to_dict()), 201


@api_bp.route("/posts/<int:post_id>", methods=["PUT"])
def update_post(post_id):
    post = Post.query.get_or_404(post_id)

    # TODO: Add authentication check - ensure user is part of the organization
    # For now, allowing all updates

    payload = request.get_json(silent=True) or {}

    # Update fields
    if "title" in payload:
        post.title = payload["title"]
    if "description" in payload:
        post.description = payload["description"]
    if "location" in payload:
        post.location = payload["location"]
    if "employment_type" in payload:
        post.employment_type = payload["employment_type"]
    if "category" in payload:
        post.category = payload["category"]
    if "salary_min" in payload:
        post.salary_min = payload["salary_min"]
    if "salary_max" in payload:
        post.salary_max = payload["salary_max"]
    if "salary_currency" in payload:
        post.salary_currency = payload["salary_currency"]
    if "requirements" in payload:
        post.requirements = json.dumps(payload["requirements"]) if payload["requirements"] else None
    if "application_deadline" in payload:
        post.application_deadline = payload["application_deadline"]
    if "status" in payload:
        post.status = payload["status"]

    db.session.commit()
    return jsonify(post.to_dict()), 200


@api_bp.route("/posts/<int:post_id>", methods=["DELETE"])
def delete_post(post_id):
    post = Post.query.get_or_404(post_id)
    db.session.delete(post)
    db.session.commit()
    return jsonify({"message": "post deleted"}), 200


@api_bp.route("/posts", methods=["GET"])
def list_posts():
    posts = Post.query.order_by(Post.created_at.desc()).all()
    return jsonify([p.to_dict() for p in posts])


@api_bp.route("/posts/<int:post_id>", methods=["GET"])
def get_post(post_id):
    post = Post.query.get_or_404(post_id)
    return jsonify(post.to_dict())


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


# Application endpoints
@api_bp.route("/applications", methods=["GET"])
def get_applications():
    """Get applications for current user's organization posts"""
    # TODO: Add JWT authentication to get current user
    # For now, return all applications (will be filtered by organization later)
    applications = Application.query.order_by(Application.applied_at.desc()).all()
    return jsonify([app.to_dict() for app in applications]), 200


@api_bp.route("/applications", methods=["POST"])
def create_application():
    payload = request.get_json(silent=True) or {}
    user_id = payload.get("user_id")
    post_id = payload.get("post_id")
    if not user_id or not post_id:
        return jsonify({"error": "user_id and post_id required"}), 400

    # Check if user already applied
    existing = Application.query.filter_by(user_id=user_id, post_id=post_id).first()
    if existing:
        return jsonify({"error": "already applied to this job"}), 400

    application = Application(
        user_id=user_id,
        post_id=post_id,
        cover_letter=payload.get("cover_letter"),
        resume_url=payload.get("resume_url"),
    )
    db.session.add(application)
    db.session.commit()
    return jsonify(application.to_dict()), 201


@api_bp.route("/applications/user/<int:user_id>", methods=["GET"])
def list_user_applications(user_id):
    applications = Application.query.filter_by(user_id=user_id).order_by(Application.applied_at.desc()).all()
    return jsonify([app.to_dict() for app in applications]), 200


@api_bp.route("/applications/post/<int:post_id>", methods=["GET"])
def list_post_applications(post_id):
    applications = Application.query.filter_by(post_id=post_id).order_by(Application.applied_at.desc()).all()
    return jsonify([app.to_dict() for app in applications]), 200


@api_bp.route("/applications/<int:app_id>", methods=["PUT"])
def update_application_status(app_id):
    application = Application.query.get_or_404(app_id)
    payload = request.get_json(silent=True) or {}
    if "status" in payload:
        application.status = payload["status"]
    db.session.commit()
    return jsonify(application.to_dict()), 200


# Saved jobs endpoints
@api_bp.route("/saved-jobs", methods=["POST"])
def save_job():
    payload = request.get_json(silent=True) or {}
    user_id = payload.get("user_id")
    post_id = payload.get("post_id")
    if not user_id or not post_id:
        return jsonify({"error": "user_id and post_id required"}), 400

    # Check if already saved
    existing = SavedJob.query.filter_by(user_id=user_id, post_id=post_id).first()
    if existing:
        return jsonify({"error": "job already saved"}), 400

    saved_job = SavedJob(user_id=user_id, post_id=post_id)
    db.session.add(saved_job)
    db.session.commit()
    return jsonify(saved_job.to_dict()), 201


@api_bp.route("/saved-jobs/<int:saved_id>", methods=["DELETE"])
def unsave_job(saved_id):
    saved_job = SavedJob.query.get_or_404(saved_id)
    db.session.delete(saved_job)
    db.session.commit()
    return jsonify({"message": "job unsaved"}), 200


@api_bp.route("/saved-jobs/user/<int:user_id>", methods=["GET"])
def list_saved_jobs(user_id):
    saved_jobs = SavedJob.query.filter_by(user_id=user_id).order_by(SavedJob.saved_at.desc()).all()
    return jsonify([sj.to_dict() for sj in saved_jobs]), 200


@api_bp.route("/saved-jobs/check", methods=["GET"])
def check_saved():
    user_id = request.args.get("user_id", type=int)
    post_id = request.args.get("post_id", type=int)
    if not user_id or not post_id:
        return jsonify({"error": "user_id and post_id required"}), 400

    saved = SavedJob.query.filter_by(user_id=user_id, post_id=post_id).first()
    return jsonify({"saved": saved is not None, "saved_id": saved.id if saved else None}), 200


# AI Interview Agent endpoints
@api_bp.route("/organizations/<int:org_id>/ai-agents", methods=["GET"])
def list_ai_agents(org_id):
    """Get all AI agents for an organization"""
    org = Organization.query.get_or_404(org_id)
    agents = AIInterviewAgent.query.filter_by(organization_id=org_id).all()
    return jsonify([agent.to_dict() for agent in agents]), 200


@api_bp.route("/organizations/<int:org_id>/ai-agents", methods=["POST"])
def create_ai_agent(org_id):
    """Create a new AI interview agent"""
    org = Organization.query.get_or_404(org_id)
    payload = request.get_json(silent=True) or {}

    name = payload.get("name")
    industry = payload.get("industry")
    if not name or not industry:
        return jsonify({"error": "name and industry required"}), 400

    # Create default system prompt based on industry
    default_system_prompt = f"""You are an expert interviewer for {industry} positions. Your role is to conduct professional, insightful interviews that assess candidates' skills, experience, and fit for the role.

Key responsibilities:
1. Ask relevant, technical questions appropriate for the {industry} field
2. Evaluate candidates based on their responses, experience, and problem-solving abilities
3. Provide constructive feedback and maintain a professional tone
4. Assess both technical skills and soft skills like communication and critical thinking
5. Be encouraging while maintaining high standards

Remember to:
- Start with easier questions and progress to more challenging ones
- Give candidates time to think and explain their answers
- Ask follow-up questions to dive deeper into their responses
- Be fair, unbiased, and professional throughout the interview"""

    agent = AIInterviewAgent(
        organization_id=org_id,
        name=name,
        industry=industry,
        description=payload.get("description"),
        system_prompt=default_system_prompt,
        custom_instructions=payload.get("custom_instructions"),
        is_active=payload.get("is_active", True),
    )
    db.session.add(agent)
    db.session.commit()
    return jsonify(agent.to_dict()), 201


@api_bp.route("/ai-agents/<int:agent_id>", methods=["GET"])
def get_ai_agent(agent_id):
    """Get a specific AI agent"""
    agent = AIInterviewAgent.query.get_or_404(agent_id)
    return jsonify(agent.to_dict()), 200


@api_bp.route("/ai-agents/<int:agent_id>", methods=["PUT"])
def update_ai_agent(agent_id):
    """Update an AI agent"""
    agent = AIInterviewAgent.query.get_or_404(agent_id)
    payload = request.get_json(silent=True) or {}

    if "name" in payload:
        agent.name = payload["name"]
    if "industry" in payload:
        agent.industry = payload["industry"]
    if "description" in payload:
        agent.description = payload["description"]
    if "system_prompt" in payload:
        agent.system_prompt = payload["system_prompt"]
    if "custom_instructions" in payload:
        agent.custom_instructions = payload["custom_instructions"]
    if "is_active" in payload:
        agent.is_active = payload["is_active"]

    db.session.commit()
    return jsonify(agent.to_dict()), 200


@api_bp.route("/ai-agents/<int:agent_id>", methods=["DELETE"])
def delete_ai_agent(agent_id):
    """Delete an AI agent"""
    agent = AIInterviewAgent.query.get_or_404(agent_id)
    db.session.delete(agent)
    db.session.commit()
    return jsonify({"message": "AI agent deleted"}), 200


@api_bp.route("/ai-agents/<int:agent_id>/test", methods=["POST"])
def test_ai_agent(agent_id):
    """Test an AI agent with a sample conversation"""
    agent = AIInterviewAgent.query.get_or_404(agent_id)
    payload = request.get_json(silent=True) or {}

    test_message = payload.get("message", "Hello, I'm here for the interview.")

    try:
        # Import AI service
        from ..ai_service import get_ai_service

        ai_service = get_ai_service()

        # Debug: Check if API key is loaded
        import os
        groq_key = os.getenv("GROQ_API_KEY", "")
        print(f"DEBUG: GROQ_API_KEY loaded: {'Yes' if groq_key else 'No'} (length: {len(groq_key)})")

        # Build system prompt for testing
        system_prompt = agent.system_prompt
        if agent.custom_instructions:
            system_prompt += f"\n\nCustom Instructions: {agent.custom_instructions}"

        print(f"DEBUG: System prompt length: {len(system_prompt)}")
        print(f"DEBUG: Test message: {test_message}")

        # Get AI response
        ai_response = ai_service.generate_response(system_prompt, test_message)

        print(f"DEBUG: AI response received: {len(ai_response)} characters")

        return jsonify({
            "agent": agent.to_dict(),
            "response": ai_response,
            "test_mode": False,
            "success": True
        }), 200

    except Exception as e:
        print(f"AI test error: {str(e)}")
        # Fallback to mock response if AI fails
        mock_response = f"Thank you for your response: '{test_message}'. This is a test response from the {agent.name} AI agent specializing in {agent.industry}."

        return jsonify({
            "agent": agent.to_dict(),
            "response": mock_response,
            "test_mode": True,
            "error": str(e),
            "success": False
        }), 200


# AI Interview execution endpoints
@api_bp.route("/interviews/<int:interview_id>/ai-start", methods=["POST"])
def start_ai_interview(interview_id):
    """Start an AI-powered interview"""
    interview = Interview.query.get_or_404(interview_id)

    if not interview.ai_agent_id:
        return jsonify({"error": "This interview is not assigned to an AI agent"}), 400

    agent = AIInterviewAgent.query.get(interview.ai_agent_id)
    if not agent or not agent.is_active:
        return jsonify({"error": "AI agent not found or inactive"}), 400

    # Initialize interview conversation
    initial_message = f"Hello! I'm {agent.name}, your AI interviewer for this {agent.industry} position. I'm excited to learn more about your background and experience. Let's start with you telling me a bit about yourself and why you're interested in this role."

    # Store initial AI message in interview feedback/notes
    interview.feedback = json.dumps([{
        "role": "assistant",
        "content": initial_message,
        "timestamp": datetime.utcnow().isoformat()
    }])

    db.session.commit()

    return jsonify({
        "interview": interview.to_dict(),
        "initial_message": initial_message,
        "agent": agent.to_dict()
    }), 200


@api_bp.route("/interviews/<int:interview_id>/ai-message", methods=["POST"])
def send_ai_message(interview_id):
    """Send a message to the AI interviewer and get response"""
    interview = Interview.query.get_or_404(interview_id)
    payload = request.get_json(silent=True) or {}

    candidate_message = payload.get("message", "").strip()
    if not candidate_message:
        return jsonify({"error": "Message is required"}), 400

    if not interview.ai_agent_id:
        return jsonify({"error": "This interview is not assigned to an AI agent"}), 400

    agent = AIInterviewAgent.query.get(interview.ai_agent_id)
    if not agent or not agent.is_active:
        return jsonify({"error": "AI agent not found or inactive"}), 400

    try:
        from ..ai_service import get_ai_service
        ai_service = get_ai_service()

        # Build system prompt
        system_prompt = agent.system_prompt
        if agent.custom_instructions:
            system_prompt += f"\n\nCustom Instructions: {agent.custom_instructions}"

        # Get conversation history
        conversation_history = []
        if interview.feedback:
            try:
                history = json.loads(interview.feedback)
                # Convert to the format expected by AI service
                for msg in history:
                    conversation_history.append({
                        "role": msg.get("role", "assistant"),
                        "content": msg.get("content", "")
                    })
            except:
                pass

        # Get AI response
        ai_response = ai_service.generate_response(system_prompt, candidate_message, conversation_history)

        # Update conversation history
        new_history = conversation_history + [
            {"role": "user", "content": candidate_message, "timestamp": datetime.utcnow().isoformat()},
            {"role": "assistant", "content": ai_response, "timestamp": datetime.utcnow().isoformat()}
        ]

        interview.feedback = json.dumps(new_history)
        interview.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            "ai_response": ai_response,
            "conversation_history": new_history,
            "interview_status": interview.status
        }), 200

    except Exception as e:
        print(f"AI interview error: {str(e)}")
        return jsonify({
            "error": "Failed to process AI response",
            "fallback_message": "I apologize, but I'm experiencing technical difficulties. Please try again."
        }), 500


@api_bp.route("/interviews/<int:interview_id>/ai-history", methods=["GET"])
def get_ai_interview_history(interview_id):
    """Get the conversation history of an AI interview"""
    interview = Interview.query.get_or_404(interview_id)

    if not interview.ai_agent_id:
        return jsonify({"error": "This interview is not assigned to an AI agent"}), 400

    conversation_history = []
    if interview.feedback:
        try:
            conversation_history = json.loads(interview.feedback)
        except:
            pass

    return jsonify({
        "interview_id": interview_id,
        "conversation_history": conversation_history,
        "agent_id": interview.ai_agent_id
    }), 200


@api_bp.route("/interviews/<int:interview_id>/assign-agent", methods=["POST"])
def assign_ai_agent_to_interview(interview_id):
    """Assign an AI agent to an interview"""
    interview = Interview.query.get_or_404(interview_id)
    payload = request.get_json(silent=True) or {}

    agent_id = payload.get("agent_id")
    if not agent_id:
        return jsonify({"error": "agent_id required"}), 400

    agent = AIInterviewAgent.query.get(agent_id)
    if not agent or not agent.is_active:
        return jsonify({"error": "AI agent not found or inactive"}), 400

    # Check if agent belongs to the same organization as the interview
    if agent.organization_id != interview.organization_id:
        return jsonify({"error": "Agent does not belong to the same organization"}), 400

    interview.ai_agent_id = agent_id
    db.session.commit()

    return jsonify({
        "interview": interview.to_dict(),
        "agent": agent.to_dict(),
        "message": "AI agent assigned successfully"
    }), 200


@api_bp.route("/ai-test", methods=["GET"])
def test_ai_service():
    """Test AI service connection"""
    from ..ai_service import test_ai_connection
    result = test_ai_connection()
    return jsonify(result), 200 if result["success"] else 500


# Dashboard statistics endpoints
@api_bp.route("/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    """Get dashboard statistics for organizations"""
    # TODO: Add organization filtering based on authenticated user
    # For now, return global stats

    # Team members count (across all organizations for demo)
    team_members_count = TeamMember.query.count()

    # Open requisitions (active posts)
    open_reqs_count = Post.query.filter_by(status='active').count()

    # Pipeline (total applications)
    pipeline_count = Application.query.count()

    # New applications (pending status)
    new_applications_count = Application.query.filter_by(status='pending').count()

    return jsonify({
        "team_members": team_members_count,
        "open_requisitions": open_reqs_count,
        "pipeline": pipeline_count,
        "new_applications": new_applications_count
    }), 200


@api_bp.route("/analytics/overview", methods=["GET"])
def get_analytics_overview():
    """Get analytics data for organization dashboard"""
    # TODO: Filter by organization
    total_posts = Post.query.count()
    total_applications = Application.query.count()
    total_interviews = Interview.query.count()
    active_posts = Post.query.filter_by(status='active').count()

    # Applications by status
    applications_by_status = {}
    for status in ['pending', 'reviewed', 'accepted', 'rejected']:
        count = Application.query.filter_by(status=status).count()
        applications_by_status[status] = count

    # Posts by category
    posts_by_category = {}
    categories = db.session.query(Post.category).distinct().all()
    for (category,) in categories:
        if category:
            count = Post.query.filter_by(category=category).count()
            posts_by_category[category] = count

    return jsonify({
        "total_posts": total_posts,
        "total_applications": total_applications,
        "total_interviews": total_interviews,
        "active_posts": active_posts,
        "applications_by_status": applications_by_status,
        "posts_by_category": posts_by_category
    }), 200

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from .. import api_bp
from ...extensions import db
from ...models import Organization, TeamMember, User, AIInterviewAgent
from ...utils.timezone_utils import is_valid_timezone, get_current_time_info, utc_iso, utc_now_iso
from ...utils.kafka_service import kafka_service as kafka
from ...utils.cache import cached, invalidate_org_cache
from ...utils.security import sanitize_input, log_security_event
from ...utils.slug import slugify_company, ORG_RESERVED
import json
import secrets
from datetime import datetime


def _manages_org(org_id):
    """Caller may administer this org: its org account or a team member."""
    from flask_jwt_extended import get_jwt_identity
    try:
        uid = int(get_jwt_identity())
    except (TypeError, ValueError):
        return False
    user = User.query.get(uid)
    if not user:
        return False
    try:
        org_id = int(org_id)
    except (TypeError, ValueError):
        return False
    if user.role == "organization" and user.organization_id == org_id:
        return True
    return TeamMember.query.filter_by(organization_id=org_id, user_id=user.id).first() is not None


ALLOWED_TEAM_ROLES = frozenset({"Admin", "HR", "Manager", "Member", "Employee"})


def _is_org_admin(org_id):
    """Caller may grant/revoke the Admin role: org owner account or Admin member."""
    from flask_jwt_extended import get_jwt_identity
    try:
        uid = int(get_jwt_identity())
    except (TypeError, ValueError):
        return False
    user = User.query.get(uid)
    if not user:
        return False
    try:
        org_id = int(org_id)
    except (TypeError, ValueError):
        return False
    if user.role == "organization" and user.organization_id == org_id:
        return True
    tm = TeamMember.query.filter_by(organization_id=org_id, user_id=user.id).first()
    return tm is not None and tm.role == "Admin"


def _validate_permissions(permissions):
    if permissions is None:
        return True
    if not isinstance(permissions, list) or len(permissions) > 50:
        return False
    return all(isinstance(p, str) and 1 <= len(p) <= 100 for p in permissions)


def _parse_join_date(value):
    """Parse an optional join_date (YYYY-MM-DD or full ISO datetime) to a date.

    Returns (date_or_None, error_response_or_None). Accepts full ISO strings
    by taking the calendar date portion.
    """
    if value is None or value == "":
        return None, None
    if not isinstance(value, str):
        return None, (jsonify({"error": "Invalid join_date. Use YYYY-MM-DD"}), 400)
    text = value.strip()
    try:
        if "T" in text:
            return datetime.fromisoformat(text.replace("Z", "+00:00")).date(), None
        return datetime.strptime(text, "%Y-%m-%d").date(), None
    except (ValueError, TypeError):
        return None, (jsonify({"error": "Invalid join_date. Use YYYY-MM-DD"}), 400)

# Default AI agents to create for new organizations
DEFAULT_AI_AGENTS = [
    {
        "name": "Shah Saib",
        "industry": "Software Engineering",
        "persona": "Technical Expert",
        "system_prompt": """You are Shah Saib, a SENIOR AI ENGINEER INTERVIEWER conducting a professional job interview. Your role is to:

**BE DOMINANT AND TECHNICAL:**
- You control the entire conversation - candidates follow YOUR lead
- Ask direct, probing questions that test the candidate's technical abilities
- Challenge vague answers and demand specific examples of AI/ML implementations
- Show confidence and authority in your questioning
- Maintain strict professional standards throughout

**INTERVIEW CONDUCT:**
- Start with structured questions about background and experience RELEVANT TO AI/ML roles
- Ask behavioral questions that reveal problem-solving and leadership in the CONTEXT OF AI PROJECTS
- Probe technical skills with scenario-based questions SPECIFIC TO AI/ML technologies (TensorFlow, PyTorch, ML algorithms, etc.)
- Test cultural fit and motivation for THIS SPECIFIC AI POSITION AND COMPANY
- Always follow up with "Tell me more about..." or "Give me a specific example..." RELATED TO AI/ML WORK
- Keep the candidate focused on relevant experience and achievements FOR THIS AI ROLE

**RESPONSE STYLE:**
- Be direct and authoritative, not conversational
- Use phrases like "For this AI role, tell me specifically...", "Given the ML requirements, give me an example of...", "Walk me through..."
- REFERENCE THE JOB DESCRIPTION AND REQUIREMENTS in your questions
- Show genuine interest but maintain interviewer control
- Keep responses focused and purposeful
- End every response with 1-2 strategic follow-up questions TARGETED TO AI/ML SKILLS AND EXPERIENCE

**CANDIDATE MANAGEMENT:**
- If candidate asks questions, redirect back to their AI/ML qualifications
- Correct inappropriate questions politely but firmly
- Keep interview on track and time-efficient
- Demand concrete examples, not general statements

Remember: You are Shah Saib, the SENIOR AI ENGINEER evaluating this candidate for THIS SPECIFIC AI POSITION. You have all the job details - USE THEM to ask targeted, relevant questions that assess fit for this exact AI role.""",
        "description": "Senior AI Engineer specializing in machine learning and AI systems",
        "custom_instructions": "Focus on technical depth in AI/ML, algorithms, frameworks, and real-world applications."
    },
    {
        "name": "Mr. John",
        "industry": "Software Engineering",
        "persona": "Technical Expert",
        "system_prompt": """You are Mr. John, a SENIOR SOFTWARE DEVELOPER INTERVIEWER conducting a professional job interview. Your role is to:

**BE DOMINANT AND TECHNICAL:**
- You control the entire conversation - candidates follow YOUR lead
- Ask direct, probing questions that test the candidate's coding abilities
- Challenge vague answers and demand specific examples of software development
- Show confidence and authority in your questioning
- Maintain strict professional standards throughout

**INTERVIEW CONDUCT:**
- Start with structured questions about background and experience RELEVANT TO SOFTWARE DEVELOPMENT roles
- Ask behavioral questions that reveal problem-solving and leadership in the CONTEXT OF DEVELOPMENT PROJECTS
- Probe technical skills with scenario-based questions SPECIFIC TO programming languages, frameworks, and methodologies
- Test cultural fit and motivation for THIS SPECIFIC DEVELOPMENT POSITION AND COMPANY
- Always follow up with "Tell me more about..." or "Give me a specific example..." RELATED TO CODING WORK
- Keep the candidate focused on relevant experience and achievements FOR THIS DEVELOPMENT ROLE

**RESPONSE STYLE:**
- Be direct and authoritative, not conversational
- Use phrases like "For this development role, tell me specifically...", "Given the technical requirements, give me an example of...", "Walk me through..."
- REFERENCE THE JOB DESCRIPTION AND REQUIREMENTS in your questions
- Show genuine interest but maintain interviewer control
- Keep responses focused and purposeful
- End every response with 1-2 strategic follow-up questions TARGETED TO DEVELOPMENT SKILLS AND EXPERIENCE

**CANDIDATE MANAGEMENT:**
- If candidate asks questions, redirect back to their development qualifications
- Correct inappropriate questions politely but firmly
- Keep interview on track and time-efficient
- Demand concrete examples, not general statements

Remember: You are Mr. John, the SENIOR SOFTWARE DEVELOPER evaluating this candidate for THIS SPECIFIC DEVELOPMENT POSITION. You have all the job details - USE THEM to ask targeted, relevant questions that assess fit for this exact development role.""",
        "description": "Senior Software Developer with expertise in full-stack development",
        "custom_instructions": "Focus on coding skills, architecture, best practices, and development methodologies."
    },
    {
        "name": "Tom",
        "industry": "Data Science",
        "persona": "Analytical Expert",
        "system_prompt": """You are Tom, a SENIOR DATA ANALYST INTERVIEWER conducting a professional job interview. Your role is to:

**BE DOMINANT AND ANALYTICAL:**
- You control the entire conversation - candidates follow YOUR lead
- Ask direct, probing questions that test the candidate's analytical abilities
- Challenge vague answers and demand specific examples of data analysis
- Show confidence and authority in your questioning
- Maintain strict professional standards throughout

**INTERVIEW CONDUCT:**
- Start with structured questions about background and experience RELEVANT TO DATA ANALYSIS roles
- Ask behavioral questions that reveal problem-solving and leadership in the CONTEXT OF DATA PROJECTS
- Probe technical skills with scenario-based questions SPECIFIC TO data tools, SQL, visualization, and statistics
- Test cultural fit and motivation for THIS SPECIFIC DATA POSITION AND COMPANY
- Always follow up with "Tell me more about..." or "Give me a specific example..." RELATED TO DATA WORK
- Keep the candidate focused on relevant experience and achievements FOR THIS DATA ROLE

**RESPONSE STYLE:**
- Be direct and authoritative, not conversational
- Use phrases like "For this data role, tell me specifically...", "Given the analytical requirements, give me an example of...", "Walk me through..."
- REFERENCE THE JOB DESCRIPTION AND REQUIREMENTS in your questions
- Show genuine interest but maintain interviewer control
- Keep responses focused and purposeful
- End every response with 1-2 strategic follow-up questions TARGETED TO DATA SKILLS AND EXPERIENCE

**CANDIDATE MANAGEMENT:**
- If candidate asks questions, redirect back to their data qualifications
- Correct inappropriate questions politely but firmly
- Keep interview on track and time-efficient
- Demand concrete examples, not general statements

Remember: You are Tom, the SENIOR DATA ANALYST evaluating this candidate for THIS SPECIFIC DATA POSITION. You have all the job details - USE THEM to ask targeted, relevant questions that assess fit for this exact data role.""",
        "description": "Senior Data Analyst specializing in business intelligence and analytics",
        "custom_instructions": "Focus on SQL, data visualization, statistical analysis, and business intelligence."
    },
    {
        "name": "Syed",
        "industry": "Software Engineering",
        "persona": "Creative Developer",
        "system_prompt": """You are Syed, a CREATIVE VIBE CODER INTERVIEWER conducting a professional job interview. Your role is to:

**BE DOMINANT AND CREATIVE:**
- You control the entire conversation - candidates follow YOUR lead
- Ask direct, probing questions that test the candidate's creative coding abilities
- Challenge vague answers and demand specific examples of innovative solutions
- Show confidence and authority in your questioning
- Maintain strict professional standards throughout

**INTERVIEW CONDUCT:**
- Start with structured questions about background and experience RELEVANT TO CREATIVE CODING roles
- Ask behavioral questions that reveal problem-solving and leadership in the CONTEXT OF INNOVATIVE PROJECTS
- Probe technical skills with scenario-based questions SPECIFIC TO modern frameworks, creative coding, and user experience
- Test cultural fit and motivation for THIS SPECIFIC CREATIVE POSITION AND COMPANY
- Always follow up with "Tell me more about..." or "Give me a specific example..." RELATED TO CREATIVE WORK
- Keep the candidate focused on relevant experience and achievements FOR THIS CREATIVE ROLE

**RESPONSE STYLE:**
- Be direct and authoritative, not conversational
- Use phrases like "For this creative role, tell me specifically...", "Given the innovation requirements, give me an example of...", "Walk me through..."
- REFERENCE THE JOB DESCRIPTION AND REQUIREMENTS in your questions
- Show genuine interest but maintain interviewer control
- Keep responses focused and purposeful
- End every response with 1-2 strategic follow-up questions TARGETED TO CREATIVE SKILLS AND EXPERIENCE

**CANDIDATE MANAGEMENT:**
- If candidate asks questions, redirect back to their creative qualifications
- Correct inappropriate questions politely but firmly
- Keep interview on track and time-efficient
- Demand concrete examples, not general statements

Remember: You are Syed, the CREATIVE VIBE CODER evaluating this candidate for THIS SPECIFIC CREATIVE POSITION. You have all the job details - USE THEM to ask targeted, relevant questions that assess fit for this exact creative role.""",
        "description": "Creative Developer specializing in innovative solutions and user experience",
        "custom_instructions": "Focus on creativity, user experience, modern frameworks, and innovative problem-solving."
    },
    {
        "name": "Dr. Sarah",
        "industry": "Software Engineering",
        "persona": "Code Quality Expert",
        "system_prompt": """You are Dr. Sarah, a CODE QUALITY SPECIALIST INTERVIEWER conducting a professional job interview. Your role is to:

**BE DOMINANT AND QUALITY-FOCUSED:**
- You control the entire conversation - candidates follow YOUR lead
- Ask direct, probing questions that test the candidate's code quality and maintenance abilities
- Challenge vague answers and demand specific examples of code improvement
- Show confidence and authority in your questioning
- Maintain strict professional standards throughout

**INTERVIEW CONDUCT:**
- Start with structured questions about background and experience RELEVANT TO CODE QUALITY roles
- Ask behavioral questions that reveal problem-solving and leadership in the CONTEXT OF CODE MAINTENANCE PROJECTS
- Probe technical skills with scenario-based questions SPECIFIC TO refactoring, testing, and code standards
- Test cultural fit and motivation for THIS SPECIFIC QUALITY POSITION AND COMPANY
- Always follow up with "Tell me more about..." or "Give me a specific example..." RELATED TO QUALITY WORK
- Keep the candidate focused on relevant experience and achievements FOR THIS QUALITY ROLE

**RESPONSE STYLE:**
- Be direct and authoritative, not conversational
- Use phrases like "For this quality role, tell me specifically...", "Given the standards requirements, give me an example of...", "Walk me through..."
- REFERENCE THE JOB DESCRIPTION AND REQUIREMENTS in your questions
- Show genuine interest but maintain interviewer control
- Keep responses focused and purposeful
- End every response with 1-2 strategic follow-up questions TARGETED TO QUALITY SKILLS AND EXPERIENCE

**CANDIDATE MANAGEMENT:**
- If candidate asks questions, redirect back to their quality qualifications
- Correct inappropriate questions politely but firmly
- Keep interview on track and time-efficient
- Demand concrete examples, not general statements

Remember: You are Dr. Sarah, the CODE QUALITY SPECIALIST evaluating this candidate for THIS SPECIFIC QUALITY POSITION. You have all the job details - USE THEM to ask targeted, relevant questions that assess fit for this exact quality role.""",
        "description": "Code Quality Specialist with expertise in refactoring and testing",
        "custom_instructions": "Focus on code reviews, refactoring, testing, and maintaining high-quality codebases."
    },
    {
        "name": "Ms. Linda",
        "industry": "Human Resources",
        "persona": "Strategic Leader",
        "system_prompt": """You are Ms. Linda, a SENIOR HIRING MANAGER INTERVIEWER conducting a professional job interview. Your role is to:

**BE DOMINANT AND STRATEGIC:**
- You control the entire conversation - candidates follow YOUR lead
- Ask direct, probing questions that test the candidate's strategic thinking and leadership
- Challenge vague answers and demand specific examples of business impact
- Show confidence and authority in your questioning
- Maintain strict professional standards throughout

**INTERVIEW CONDUCT:**
- Start with structured questions about background and experience RELEVANT TO MANAGEMENT roles
- Ask behavioral questions that reveal problem-solving and leadership in the CONTEXT OF BUSINESS PROJECTS
- Probe strategic skills with scenario-based questions SPECIFIC TO team management, business strategy, and organizational impact
- Test cultural fit and motivation for THIS SPECIFIC MANAGEMENT POSITION AND COMPANY
- Always follow up with "Tell me more about..." or "Give me a specific example..." RELATED TO MANAGEMENT WORK
- Keep the candidate focused on relevant experience and achievements FOR THIS MANAGEMENT ROLE

**RESPONSE STYLE:**
- Be direct and authoritative, not conversational
- Use phrases like "For this management role, tell me specifically...", "Given the strategic requirements, give me an example of...", "Walk me through..."
- REFERENCE THE JOB DESCRIPTION AND REQUIREMENTS in your questions
- Show genuine interest but maintain interviewer control
- Keep responses focused and purposeful
- End every response with 1-2 strategic follow-up questions TARGETED TO MANAGEMENT SKILLS AND EXPERIENCE

**CANDIDATE MANAGEMENT:**
- If candidate asks questions, redirect back to their management qualifications
- Correct inappropriate questions politely but firmly
- Keep interview on track and time-efficient
- Demand concrete examples, not general statements

Remember: You are Ms. Linda, the SENIOR HIRING MANAGER evaluating this candidate for THIS SPECIFIC MANAGEMENT POSITION. You have all the job details - USE THEM to ask targeted, relevant questions that assess fit for this exact management role.""",
        "description": "Senior Hiring Manager with expertise in talent acquisition and leadership",
        "custom_instructions": "Focus on leadership, team management, strategic thinking, and business impact."
    },
    {
        "name": "Prof. Ahmed",
        "industry": "Computer Vision",
        "persona": "Technical Vision Expert",
        "system_prompt": """You are Prof. Ahmed, a SENIOR VISION ENGINEER INTERVIEWER conducting a professional job interview. Your role is to:

**BE DOMINANT AND TECHNICAL:**
- You control the entire conversation - candidates follow YOUR lead
- Ask direct, probing questions that test the candidate's computer vision abilities
- Challenge vague answers and demand specific examples of vision system implementations
- Show confidence and authority in your questioning
- Maintain strict professional standards throughout

**INTERVIEW CONDUCT:**
- Start with structured questions about background and experience RELEVANT TO COMPUTER VISION roles
- Ask behavioral questions that reveal problem-solving and leadership in the CONTEXT OF VISION PROJECTS
- Probe technical skills with scenario-based questions SPECIFIC TO computer vision algorithms, OpenCV, deep learning for vision, etc.
- Test cultural fit and motivation for THIS SPECIFIC VISION POSITION AND COMPANY
- Always follow up with "Tell me more about..." or "Give me a specific example..." RELATED TO VISION WORK
- Keep the candidate focused on relevant experience and achievements FOR THIS VISION ROLE

**RESPONSE STYLE:**
- Be direct and authoritative, not conversational
- Use phrases like "For this vision role, tell me specifically...", "Given the technical requirements, give me an example of...", "Walk me through..."
- REFERENCE THE JOB DESCRIPTION AND REQUIREMENTS in your questions
- Show genuine interest but maintain interviewer control
- Keep responses focused and purposeful
- End every response with 1-2 strategic follow-up questions TARGETED TO VISION SKILLS AND EXPERIENCE

**CANDIDATE MANAGEMENT:**
- If candidate asks questions, redirect back to their vision qualifications
- Correct inappropriate questions politely but firmly
- Keep interview on track and time-efficient
- Demand concrete examples, not general statements

Remember: You are Prof. Ahmed, the SENIOR VISION ENGINEER evaluating this candidate for THIS SPECIFIC VISION POSITION. You have all the job details - USE THEM to ask targeted, relevant questions that assess fit for this exact vision role.""",
        "description": "Computer Vision Expert specializing in image processing and AI vision systems",
        "custom_instructions": "Focus on computer vision algorithms, image processing, deep learning for vision, and practical applications."
    },
    {
        "name": "Rachel",
        "industry": "Product Management",
        "persona": "Product Strategy Expert",
        "system_prompt": """You are Rachel, a SENIOR PRODUCT MANAGER INTERVIEWER conducting a professional job interview. Your role is to:

**BE DOMINANT AND STRATEGIC:**
- You control the entire conversation - candidates follow YOUR lead
- Ask direct, probing questions that test the candidate's product management abilities
- Challenge vague answers and demand specific examples of product strategy and execution
- Show confidence and authority in your questioning
- Maintain strict professional standards throughout

**INTERVIEW CONDUCT:**
- Start with structured questions about background and experience RELEVANT TO PRODUCT MANAGEMENT roles
- Ask behavioral questions that reveal problem-solving and leadership in the CONTEXT OF PRODUCT PROJECTS
- Probe strategic skills with scenario-based questions SPECIFIC TO product strategy, roadmapping, and user experience
- Test cultural fit and motivation for THIS SPECIFIC PRODUCT POSITION AND COMPANY
- Always follow up with "Tell me more about..." or "Give me a specific example..." RELATED TO PRODUCT WORK
- Keep the candidate focused on relevant experience and achievements FOR THIS PRODUCT ROLE

**RESPONSE STYLE:**
- Be direct and authoritative, not conversational
- Use phrases like "For this product role, tell me specifically...", "Given the strategy requirements, give me an example of...", "Walk me through..."
- REFERENCE THE JOB DESCRIPTION AND REQUIREMENTS in your questions
- Show genuine interest but maintain interviewer control
- Keep responses focused and purposeful
- End every response with 1-2 strategic follow-up questions TARGETED TO PRODUCT SKILLS AND EXPERIENCE

**CANDIDATE MANAGEMENT:**
- If candidate asks questions, redirect back to their product qualifications
- Correct inappropriate questions politely but firmly
- Keep interview on track and time-efficient
- Demand concrete examples, not general statements

Remember: You are Rachel, the SENIOR PRODUCT MANAGER evaluating this candidate for THIS SPECIFIC PRODUCT POSITION. You have all the job details - USE THEM to ask targeted, relevant questions that assess fit for this exact product role.""",
        "description": "Senior Product Manager with expertise in strategy and user experience",
        "custom_instructions": "Focus on product strategy, user experience, roadmapping, and cross-functional collaboration."
    },
    {
        "name": "Mike",
        "industry": "DevOps",
        "persona": "Infrastructure Expert",
        "system_prompt": """You are Mike, a SENIOR DEVOPS ENGINEER INTERVIEWER conducting a professional job interview. Your role is to:

**BE DOMINANT AND TECHNICAL:**
- You control the entire conversation - candidates follow YOUR lead
- Ask direct, probing questions that test the candidate's DevOps and infrastructure abilities
- Challenge vague answers and demand specific examples of system deployments and automation
- Show confidence and authority in your questioning
- Maintain strict professional standards throughout

**INTERVIEW CONDUCT:**
- Start with structured questions about background and experience RELEVANT TO DEVOPS roles
- Ask behavioral questions that reveal problem-solving and leadership in the CONTEXT OF INFRASTRUCTURE PROJECTS
- Probe technical skills with scenario-based questions SPECIFIC TO CI/CD, cloud platforms, containers, and automation
- Test cultural fit and motivation for THIS SPECIFIC DEVOPS POSITION AND COMPANY
- Always follow up with "Tell me more about..." or "Give me a specific example..." RELATED TO DEVOPS WORK
- Keep the candidate focused on relevant experience and achievements FOR THIS DEVOPS ROLE

**RESPONSE STYLE:**
- Be direct and authoritative, not conversational
- Use phrases like "For this DevOps role, tell me specifically...", "Given the infrastructure requirements, give me an example of...", "Walk me through..."
- REFERENCE THE JOB DESCRIPTION AND REQUIREMENTS in your questions
- Show genuine interest but maintain interviewer control
- Keep responses focused and purposeful
- End every response with 1-2 strategic follow-up questions TARGETED TO DEVOPS SKILLS AND EXPERIENCE

**CANDIDATE MANAGEMENT:**
- If candidate asks questions, redirect back to their DevOps qualifications
- Correct inappropriate questions politely but firmly
- Keep interview on track and time-efficient
- Demand concrete examples, not general statements

Remember: You are Mike, the SENIOR DEVOPS ENGINEER evaluating this candidate for THIS SPECIFIC DEVOPS POSITION. You have all the job details - USE THEM to ask targeted, relevant questions that assess fit for this exact DevOps role.""",
        "description": "Senior DevOps Engineer specializing in infrastructure and automation",
        "custom_instructions": "Focus on CI/CD, cloud platforms, containerization, automation, and system reliability."
    },
    {
        "name": "Emma",
        "industry": "Design",
        "persona": "Design Expert",
        "system_prompt": """You are Emma, a SENIOR UX/UI DESIGNER INTERVIEWER conducting a professional job interview. Your role is to:

**BE DOMINANT AND CREATIVE:**
- You control the entire conversation - candidates follow YOUR lead
- Ask direct, probing questions that test the candidate's design abilities
- Challenge vague answers and demand specific examples of user experience and interface design
- Show confidence and authority in your questioning
- Maintain strict professional standards throughout

**INTERVIEW CONDUCT:**
- Start with structured questions about background and experience RELEVANT TO DESIGN roles
- Ask behavioral questions that reveal problem-solving and leadership in the CONTEXT OF DESIGN PROJECTS
- Probe design skills with scenario-based questions SPECIFIC TO user research, prototyping, and design systems
- Test cultural fit and motivation for THIS SPECIFIC DESIGN POSITION AND COMPANY
- Always follow up with "Tell me more about..." or "Give me a specific example..." RELATED TO DESIGN WORK
- Keep the candidate focused on relevant experience and achievements FOR THIS DESIGN ROLE

**RESPONSE STYLE:**
- Be direct and authoritative, not conversational
- Use phrases like "For this design role, tell me specifically...", "Given the user requirements, give me an example of...", "Walk me through..."
- REFERENCE THE JOB DESCRIPTION AND REQUIREMENTS in your questions
- Show genuine interest but maintain interviewer control
- Keep responses focused and purposeful
- End every response with 1-2 strategic follow-up questions TARGETED TO DESIGN SKILLS AND EXPERIENCE

**CANDIDATE MANAGEMENT:**
- If candidate asks questions, redirect back to their design qualifications
- Correct inappropriate questions politely but firmly
- Keep interview on track and time-efficient
- Demand concrete examples, not general statements

Remember: You are Emma, the SENIOR UX/UI DESIGNER evaluating this candidate for THIS SPECIFIC DESIGN POSITION. You have all the job details - USE THEM to ask targeted, relevant questions that assess fit for this exact design role.""",
        "description": "Senior UX/UI Designer specializing in user experience and interface design",
        "custom_instructions": "Focus on user research, prototyping, design systems, and user-centered design principles."
    }
]

def create_default_ai_agents_for_org(org_id: int):
    """Create default AI agents for a new organization."""
    for agent_data in DEFAULT_AI_AGENTS:
        agent = AIInterviewAgent(
            organization_id=org_id,
            name=agent_data["name"],
            industry=agent_data["industry"],
            persona=agent_data["persona"],
            system_prompt=agent_data["system_prompt"],
            description=agent_data["description"],
            custom_instructions=agent_data["custom_instructions"],
            is_active=True
        )
        db.session.add(agent)
    db.session.commit()

@api_bp.route("/organizations/suggest", methods=["GET"])
@jwt_required()
def suggest_organizations():
    """LinkedIn-style company autocomplete: exact matches first, then prefix, then substring."""
    from sqlalchemy import func
    q = (request.args.get("q") or "").strip()
    try:
        limit = min(max(int(request.args.get("limit", 8)), 1), 20)
    except (TypeError, ValueError):
        limit = 8
    if len(q) < 2:
        return jsonify([]), 200
    ql = q.lower()
    exact = func.lower(Organization.name) == ql
    prefix = func.lower(Organization.name).like(ql + "%")
    # A page whose admin set it to private must not surface in autocomplete.
    orgs = (Organization.query
            .filter(Organization.name.ilike(f"%{q}%"))
            .filter(Organization.is_public.is_(True))
            .order_by(exact.desc(), prefix.desc(), Organization.name.asc())
            .limit(limit).all())
    return jsonify([{
        "id": o.id,
        "name": o.name,
        "slug": o.slug,
        "profile_image": o.profile_image,
        "industry": o.industry,
        "location": o.location,
    } for o in orgs]), 200


@api_bp.route("/organizations", methods=["GET"])
@jwt_required()
@cached("org_listings", ttl=600)
def list_organizations():
    # Directory listing only ever shows public pages.
    orgs = (Organization.query
            .filter(Organization.is_public.is_(True))
            .order_by(Organization.id.asc()).all())
    return jsonify([{
        "id": o.id,
        "name": o.name,
        "slug": o.slug,
        "description": o.description,
        "website": o.website,
        "location": o.location,
        "profile_image": o.profile_image,
        "banner_image": o.banner_image,
        "created_at": utc_iso(o.created_at),
    } for o in orgs]), 200

# NOTE: there is deliberately no `POST /organizations`. Company creation is
# individuals-only-then-internal: an authenticated person creates their own
# page via `POST /organizations/page`, which also grants them Admin. A generic
# create endpoint would let any caller spawn unowned orgs with no admin at all.

# Canonical option sets for the page wizard. The frontend renders these exact
# values so the picker and the validator can never disagree.
COMPANY_SIZE_OPTIONS = (
    "1-10", "11-50", "51-200", "201-500",
    "501-1000", "1000+", "1001-5000", "5001-10000", "10000+",
)
# "1000+" is legacy: it was the only option offered before the wizard split the
# range into 1001-5000 / 5001-10000 / 10000+. It stays valid so editing an
# existing page doesn't 400 on its own stored value.
COMPANY_TYPE_OPTIONS = (
    "startup", "private", "public", "nonprofit",
    "agency", "education", "government",
)
MIN_FOUNDED_YEAR = 1800
MAX_EMPLOYEES = 10_000_000


@api_bp.route("/organizations/page/options", methods=["GET"])
@jwt_required()
def organization_page_options():
    """Option lists + defaults for the page-creation wizard."""
    return jsonify({
        "company_size_options": list(COMPANY_SIZE_OPTIONS),
        "company_type_options": list(COMPANY_TYPE_OPTIONS),
        "current_year": datetime.utcnow().year,
        "min_founded_year": MIN_FOUNDED_YEAR,
    }), 200


def _parse_int(value, field, minimum, maximum):
    """Parse an optional int field. Returns (value, None) or (None, error)."""
    if value is None or value == "":
        return None, None
    try:
        n = int(value)
    except (TypeError, ValueError):
        return None, f"{field} must be a whole number."
    if n < minimum or n > maximum:
        return None, f"{field} must be between {minimum} and {maximum}."
    return n, None


@api_bp.route("/organizations/page", methods=["POST"])
@jwt_required()
def create_organization_page():
    """Create a company page for the signed-in user, who becomes its Admin.

    This is the ONLY way an organization comes into existence now that signup
    is individuals-only. It mirrors the LinkedIn model: a person signs up once
    and later opens a page for themselves or their company. The creator keeps
    their individual account and gains Admin rights over the page via a
    TeamMember row.

    The logo is uploaded separately (POST /organizations/<id>/upload-profile-image)
    so a failed image never costs the user the page they just filled in.
    """
    from flask import request as _req
    from sqlalchemy import func
    from ...utils.security import sanitize_input, log_security_event, validate_email
    from ...utils.free_email import contact_email_warning
    from sqlalchemy import func

    payload = request.get_json(silent=True) or {}

    try:
        caller = User.query.get(int(get_jwt_identity()))
    except (TypeError, ValueError):
        caller = None
    if not caller:
        return jsonify({"error": "User not found"}), 404

    # Security: an org account is a company delegate, not a founder. Only a
    # real person can found a page — otherwise a company admin could spawn
    # competitor pages from inside another company's account.
    if caller.role != "individual":
        return jsonify({"error": "Only individual accounts can create a company page."}), 403

    def clean(key, max_length=255):
        return sanitize_input(payload.get(key, "") or "", max_length=max_length).strip() or None

    name = clean("name")
    if not name or len(name) < 2:
        return jsonify({"error": "Company name required (min 2 characters)"}), 400

    contact_email = clean("contact_email")
    if contact_email and not validate_email(contact_email):
        return jsonify({"error": "That doesn't look like a valid email address."}), 400

    founded_year, err = _parse_int(
        payload.get("founded_year"), "Founded year", MIN_FOUNDED_YEAR, datetime.utcnow().year)
    if err:
        return jsonify({"error": err}), 400

    employee_count, err = _parse_int(
        payload.get("employee_count"), "Employee count", 1, MAX_EMPLOYEES)
    if err:
        return jsonify({"error": err}), 400

    company_size = clean("company_size", 50)
    if company_size and company_size not in COMPANY_SIZE_OPTIONS:
        return jsonify({"error": "Unrecognised company size."}), 400

    company_type = clean("company_type", 50)
    if company_type and company_type not in COMPANY_TYPE_OPTIONS:
        return jsonify({"error": "Unrecognised company type."}), 400

    # Security: never let a claim silently attach the caller to an existing org
    # — that would hand a stranger Admin rights over it. Joining an existing
    # company is only possible via team invitation.
    if Organization.query.filter(func.lower(Organization.name) == name.lower()).first():
        log_security_event("org_name_taken", ip_address=_req.remote_addr, email=caller.email)
        return jsonify({"error": "A company with this name already exists. Ask an admin to invite you instead."}), 400

    warnings = []
    if contact_email:
        free_warn = contact_email_warning(contact_email)
        if free_warn:
            warnings.append(free_warn)

    org = Organization(
        name=name,
        description=clean("description", 2000),
        website=clean("website"),
        contact_email=contact_email,
        contact_name=clean("contact_name"),
        location=clean("location"),
        industry=clean("industry"),
        company_size=company_size,
        company_type=company_type,
        employee_count=employee_count,
        founded_year=founded_year,
    )
    db.session.add(org)
    db.session.flush()

    # Page URL (/org/<slug>). Name-derived and fixed from here on, so renaming
    # the company later can't break the URL shared on job ads.
    from ...utils.slug import unique_org_slug
    try:
        org.slug = unique_org_slug(org.name, Organization)
    except RuntimeError:
        db.session.rollback()
        log_security_event("org_slug_generation_failed", ip_address=_req.remote_addr, email=caller.email)
        return jsonify({"error": "Could not create the page. Please try again."}), 500

    # Founder = Admin of the page they just created.
    db.session.add(TeamMember(organization_id=org.id, user_id=caller.id, role="Admin"))

    # Point the founder's own account at the new page so every org surface
    # (profile, jobs, pipeline, analytics) resolves an org id for them. Their
    # role stays "individual" — the page rides alongside their personal profile.
    if not caller.organization_id:
        caller.organization_id = org.id

    db.session.commit()

    log_security_event("organization_page_created", user_id=caller.id,
                       ip_address=_req.remote_addr,
                       details={"org_id": org.id, "name": org.name})

    kafka.emit_event('organization_created', {
        'org_id': org.id,
        'name': org.name,
        'created_by': caller.id,
        'timestamp': utc_now_iso(),
    })

    invalidate_org_cache()
    create_default_ai_agents_for_org(org.id)

    return jsonify({
        "id": org.id,
        "name": org.name,
        "organization": org.to_dict(),
        "user": caller.to_dict(),
        "warnings": warnings,
    }), 201


@api_bp.route("/organizations/mine", methods=["GET"])
@jwt_required()
def list_my_organization_pages():
    """Pages the signed-in user administers (founded + invited to)."""
    try:
        caller = User.query.get(int(get_jwt_identity()))
    except (TypeError, ValueError):
        caller = None
    if not caller:
        return jsonify({"error": "User not found"}), 404

    rows = {}
    if caller.organization_id:
        org = Organization.query.get(caller.organization_id)
        if org:
            rows[org.id] = org
    for tm in TeamMember.query.filter_by(user_id=caller.id).all():
        if tm.organization_id not in rows:
            org = Organization.query.get(tm.organization_id)
            if org:
                rows[org.id] = org

    return jsonify([{
        "id": o.id,
        "name": o.name,
        "slug": o.slug,
        "industry": o.industry,
        "location": o.location,
        "profile_image": o.profile_image,
        "company_size": o.company_size,
        "is_primary": o.id == caller.organization_id,
    } for o in rows.values()]), 200


@api_bp.route("/organizations/by-slug/<slug>", methods=["GET"])
@jwt_required()
def get_organization_by_slug(slug):
    """Resolve /org/<slug> to an organization id.

    Kept separate from the id-based route so the public page URL never has to
    know about numeric ids. Managers get the full record; everyone else gets
    the public-safe view, and a private page is invisible either way.
    """
    clean = sanitize_input(slug or "", max_length=60).strip().lower()
    if not clean:
        return jsonify({"error": "Not found"}), 404

    org = Organization.query.filter(func.lower(Organization.slug) == clean).first()
    if not org:
        return jsonify({"error": "Not found"}), 404
    if not _manages_org(org.id) and not org.is_public:
        return jsonify({"error": "Not found"}), 404

    # Reuse the id-based handler so manager/private/cache behaviour stays in
    # exactly one place instead of drifting between two copies.
    return get_organization(org.id)


@api_bp.route("/organizations/<int:org_id>", methods=["GET"])
@jwt_required()
# Security: response differs for managers vs non-managers, so requester must
# be part of cache key. A target-only key would serve a manager's private
# response (contacts + inactive posts) to an unrelated requester on HIT.
@cached("org_details", ttl=300, key_func=lambda org_id: f"{get_jwt_identity()}:org_{org_id}")
def get_organization(org_id):
    org = Organization.query.get_or_404(org_id)
    is_manager = _manages_org(org_id)
    if is_manager:
        posts = [p.to_dict() for p in org.posts]
        return jsonify({
            "id": org.id,
            "name": org.name,
            "slug": org.slug,
            "description": org.description,
            "website": org.website,
            "contact_email": org.contact_email,
            "contact_name": org.contact_name,
            "location": org.location,
            "company_size": org.company_size,
            "industry": org.industry,
            "employee_count": org.employee_count,
            "founded_year": org.founded_year,
            "company_type": org.company_type,
            "mission": org.mission,
            "vision": org.vision,
            "social_media_links": org.social_media_links,
            "profile_image": org.profile_image,
            "banner_image": org.banner_image,
            "is_public": bool(org.is_public),
            "accepting_applications": bool(org.accepting_applications),
            "show_public_stats": bool(org.show_public_stats),
            "created_at": utc_iso(org.created_at),
            "posts": posts,
        })
    # A private page is invisible to everyone who doesn't administer it.
    # 404 rather than 403 so existence isn't confirmed to outsiders.
    if not org.is_public:
        return jsonify({"error": "Not found"}), 404
    # Non-managers get public-safe view: no contacts, active posts only.
    public = org.to_public_dict()
    active_posts = [p.to_dict() for p in org.posts if p.status == "active"]
    public["posts"] = active_posts
    return jsonify(public)

@api_bp.route("/organizations/<int:org_id>", methods=["PUT"])
@jwt_required()
def update_organization(org_id):
    if not _manages_org(org_id):
        return jsonify({"error": "Forbidden for this organization"}), 403
    org = Organization.query.get_or_404(org_id)
    payload = request.get_json(silent=True) or {}

    # Update basic fields
    if "name" in payload:
        new_name = sanitize_input(payload["name"] or "", max_length=255).strip()
        if len(new_name) < 2:
            return jsonify({"error": "Company name must be at least 2 characters."}), 400
        # Case-insensitive, matching the check at creation time. Without this the
        # unique index rejects the write and the caller sees a 500 plus a leaked
        # database traceback instead of a message they can act on.
        clash = Organization.query.filter(
            func.lower(Organization.name) == new_name.lower()
        ).filter(Organization.id != org.id).first()
        if clash:
            return jsonify({
                "error": "A company with this name already exists. Ask an admin to invite you instead."
            }), 400
        org.name = new_name
    if "description" in payload:
        org.description = sanitize_input(payload["description"] or "", max_length=2000).strip() or None
    if "website" in payload:
        org.website = sanitize_input(payload["website"] or "", max_length=255).strip() or None
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

    # Invalidate org caches
    invalidate_org_cache(org_id)

    return jsonify(org.to_dict()), 200


@api_bp.route("/organizations/<int:org_id>/timezone", methods=["PUT"])
@jwt_required()
def update_organization_timezone(org_id):
    """Update organization's timezone preference."""
    if not _manages_org(org_id):
        return jsonify({"error": "Forbidden for this organization"}), 403
    org = Organization.query.get_or_404(org_id)
    payload = request.get_json(silent=True) or {}
    
    tz = payload.get("timezone")
    if not tz:
        return jsonify({"error": "timezone required"}), 400
    
    if not is_valid_timezone(tz):
        return jsonify({"error": f"Invalid timezone: {tz}"}), 400
    
    org.timezone = tz
    db.session.commit()
    
    # Emit Kafka event for organization timezone update
    kafka.emit_event('organization_timezone_updated', {
        'org_id': org.id,
        'timezone': tz,
        'timestamp': utc_now_iso()
    })
    
    return jsonify({
        "message": "Timezone updated",
        "organization": org.to_dict(),
        "current_time": get_current_time_info(tz),
    }), 200


@api_bp.route("/organizations/<int:org_id>/current-time", methods=["GET"])
@jwt_required()
def get_organization_current_time(org_id):
    """Get current time information in organization's timezone (auth required to prevent ID enumeration)."""
    org = Organization.query.get_or_404(org_id)
    tz = org.timezone or "UTC"
    return jsonify(get_current_time_info(tz)), 200


@api_bp.route("/organizations/<int:org_id>/profile", methods=["PUT"])
@jwt_required()
def update_organization_profile(org_id):
    if not _manages_org(org_id):
        return jsonify({"error": "Forbidden for this organization"}), 403
    org = Organization.query.get_or_404(org_id)
    payload = request.get_json(silent=True) or {}

    # Same validation as page creation — otherwise editing a page would be a
    # way to store values the create endpoint rejects.
    if "company_size" in payload:
        value = (payload["company_size"] or "").strip()
        if value and value not in COMPANY_SIZE_OPTIONS:
            return jsonify({"error": "Unrecognised company size."}), 400
        org.company_size = value or None

    if "company_type" in payload:
        value = (payload["company_type"] or "").strip()
        if value and value not in COMPANY_TYPE_OPTIONS:
            return jsonify({"error": "Unrecognised company type."}), 400
        org.company_type = value or None

    if "founded_year" in payload:
        value, err = _parse_int(
            payload["founded_year"], "Founded year", MIN_FOUNDED_YEAR, datetime.utcnow().year)
        if err:
            return jsonify({"error": err}), 400
        org.founded_year = value

    if "employee_count" in payload:
        value, err = _parse_int(
            payload["employee_count"], "Employee count", 1, MAX_EMPLOYEES)
        if err:
            return jsonify({"error": err}), 400
        org.employee_count = value

    # Update profile fields
    if "industry" in payload:
        org.industry = payload["industry"]
    if "location" in payload:
        org.location = payload["location"]
    if "contact_email" in payload:
        from ...utils.security import sanitize_input, validate_email
        value = sanitize_input(payload["contact_email"] or "", max_length=255).strip()
        if value and not validate_email(value):
            return jsonify({"error": "That doesn't look like a valid email address."}), 400
        org.contact_email = value or None
    if "mission" in payload:
        org.mission = payload["mission"]
    if "vision" in payload:
        org.vision = payload["vision"]
    if "social_media_links" in payload:
        # Assume it's a list, store as JSON string
        import json
        org.social_media_links = json.dumps(payload["social_media_links"]) if payload["social_media_links"] else None

    db.session.commit()

    # Invalidate org caches
    invalidate_org_cache(org_id)

    return jsonify(org.to_dict()), 200

@api_bp.route("/organizations/<int:org_id>/slug", methods=["PUT"])
@jwt_required()
def update_organization_slug(org_id):
    """Change the page URL: /org/<slug>.

    Separate from the name on purpose. The name is a display label and the slug
    is a permanent address — renaming "Acme" to "Acme Corp" should not silently
    break a URL that has already been printed on a job ad or pasted into an
    email, so the admin opts in to the move.
    """
    if not _manages_org(org_id):
        return jsonify({"error": "Forbidden for this organization"}), 403
    org = Organization.query.get_or_404(org_id)
    payload = request.get_json(silent=True) or {}

    requested = sanitize_input(payload.get("slug", "") or "", max_length=60).strip().lower()
    if not requested:
        return jsonify({"error": "Enter a page address."}), 400

    base = slugify_company(requested)
    if not base:
        return jsonify({"error": "Use lowercase letters, numbers and hyphens."}), 400
    if base in ORG_RESERVED:
        return jsonify({"error": "That address is reserved. Pick something else."}), 400

    clash = Organization.query.filter(
        func.lower(Organization.slug) == base
    ).filter(Organization.id != org.id).first()
    if clash:
        return jsonify({"error": "That page address is already taken."}), 409

    previous = org.slug
    org.slug = base
    try:
        db.session.commit()
    except Exception:
        # Lost the race against a concurrent claim; the unique index caught it.
        db.session.rollback()
        log_security_event("org_slug_collision", ip_address=request.remote_addr,
                           details={"slug": base})
        return jsonify({"error": "That page address is already taken."}), 409

    invalidate_org_cache()
    log_security_event("organization_slug_changed", details={
        "org_id": org.id, "from": previous, "to": base,
    })
    return jsonify({"slug": org.slug, "organization": org.to_dict()}), 200


@api_bp.route("/organizations/<int:org_id>/visibility", methods=["PUT"])
@jwt_required()
def update_organization_visibility(org_id):
    """Toggle how a page appears to people who don't administer it."""
    if not _manages_org(org_id):
        return jsonify({"error": "Forbidden for this organization"}), 403
    org = Organization.query.get_or_404(org_id)
    payload = request.get_json(silent=True) or {}

    # Explicit `is True/False` only: a missing key means "leave unchanged", and
    # a truthy string like "false" must not read as True.
    for field in ("is_public", "accepting_applications", "show_public_stats"):
        if field in payload:
            value = payload[field]
            if not isinstance(value, bool):
                return jsonify({"error": f"{field} must be true or false"}), 400
            setattr(org, field, value)

    db.session.commit()
    # Public listings and the org directory are cached — a visibility change has
    # to drop them or a newly-private page keeps leaking from cache.
    invalidate_org_cache()
    invalidate_org_cache(org_id)

    return jsonify({
        "is_public": bool(org.is_public),
        "accepting_applications": bool(org.accepting_applications),
        "show_public_stats": bool(org.show_public_stats),
    }), 200


@api_bp.route("/organizations/<int:org_id>/team-members", methods=["GET"])
@jwt_required()
def list_team_members(org_id):
    if not _manages_org(org_id):
        return jsonify({"error": "Forbidden for this organization"}), 403
    org = Organization.query.get_or_404(org_id)
    team_members = [tm.to_dict() for tm in org.team_members]
    return jsonify(team_members), 200

@api_bp.route("/organizations/<int:org_id>/team-members", methods=["POST"])
@jwt_required()
def add_team_member(org_id):
    if not _manages_org(org_id):
        return jsonify({"error": "Forbidden for this organization"}), 403
    org = Organization.query.get_or_404(org_id)
    payload = request.get_json(silent=True) or {}
    user_id = payload.get("user_id")
    role = payload.get("role")
    permissions = payload.get("permissions")  # list of permissions
    join_date = payload.get("join_date")

    if not user_id or not role:
        return jsonify({"error": "user_id and role required"}), 400
    if role not in ALLOWED_TEAM_ROLES:
        return jsonify({"error": f"Invalid role. Allowed: {sorted(ALLOWED_TEAM_ROLES)}"}), 400
    if role == "Admin" and not _is_org_admin(org_id):
        return jsonify({"error": "Only Admins can grant the Admin role"}), 403
    if not _validate_permissions(permissions):
        return jsonify({"error": "Invalid permissions (must be a list of <=50 strings)"}), 400
    join_date, join_err = _parse_join_date(join_date)
    if join_err:
        return join_err

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
    
    # Emit Kafka event for team member added
    kafka.emit_event('team_member_added', {
        'org_id': org_id,
        'user_id': user_id,
        'role': role,
        'timestamp': utc_now_iso()
    })
    
    return jsonify(tm.to_dict()), 201

@api_bp.route("/organizations/<int:org_id>/team-members/<int:member_id>", methods=["PUT"])
@jwt_required()
def update_team_member(org_id, member_id):
    if not _manages_org(org_id):
        return jsonify({"error": "Forbidden for this organization"}), 403
    tm = TeamMember.query.filter_by(id=member_id, organization_id=org_id).first_or_404()
    payload = request.get_json(silent=True) or {}

    if "role" in payload:
        new_role = payload["role"]
        if new_role not in ALLOWED_TEAM_ROLES:
            return jsonify({"error": f"Invalid role. Allowed: {sorted(ALLOWED_TEAM_ROLES)}"}), 400
        if new_role == "Admin" and not _is_org_admin(org_id):
            return jsonify({"error": "Only Admins can grant the Admin role"}), 403
        tm.role = new_role
    if "permissions" in payload:
        if not _validate_permissions(payload["permissions"]):
            return jsonify({"error": "Invalid permissions (must be a list of <=50 strings)"}), 400
        tm.permissions = json.dumps(payload["permissions"]) if payload["permissions"] else None
    if "join_date" in payload:
        parsed, join_err = _parse_join_date(payload["join_date"])
        if join_err:
            return join_err
        tm.join_date = parsed

    db.session.commit()
    return jsonify(tm.to_dict()), 200

@api_bp.route("/organizations/<int:org_id>/team-members/<int:member_id>", methods=["DELETE"])
@jwt_required()
def remove_team_member(org_id, member_id):
    if not _manages_org(org_id):
        return jsonify({"error": "Forbidden for this organization"}), 403
    tm = TeamMember.query.filter_by(id=member_id, organization_id=org_id).first_or_404()
    db.session.delete(tm)
    db.session.commit()
    
    # Emit Kafka event for team member removed
    kafka.emit_event('team_member_removed', {
        'org_id': org_id,
        'member_id': member_id,
        'timestamp': utc_now_iso()
    })
    
    return jsonify({"message": "team member removed"}), 200

@api_bp.route("/organizations/<int:org_id>/users", methods=["GET"])
@jwt_required()
def list_organization_users(org_id):
    """Get all users belonging to an organization (managers only)."""
    if not _manages_org(org_id):
        return jsonify({"error": "Forbidden for this organization"}), 403
    org = Organization.query.get_or_404(org_id)
    users = User.query.filter_by(organization_id=org_id).all()
    return jsonify([user.to_dict() for user in users]), 200


@api_bp.route("/organizations/<int:org_id>/people", methods=["GET"])
@jwt_required()
def list_organization_people(org_id):
    """People connected to this org through work experience (linked FK or
    case-insensitive exact company-name match), split into current/past.
    Managers of the org only."""
    if not _manages_org(org_id):
        return jsonify({"error": "Forbidden for this organization"}), 403
    from datetime import date, datetime, timezone
    from sqlalchemy import func, or_
    from ...models import Experience
    org = Organization.query.get_or_404(org_id)
    # UTC calendar date (not server-local): consistent for viewers worldwide.
    today = datetime.now(timezone.utc).date()
    rows = (db.session.query(Experience, User)
            .join(User, User.id == Experience.user_id)
            .filter(or_(
                Experience.organization_id == org_id,
                func.lower(Experience.company) == org.name.lower(),
            ))
            .order_by(Experience.start_date.desc()).all())

    def person(exp, user):
        return {
            "user_id": user.id,
            "name": user.name,
            "profile_picture": user.profile_picture,
            "title": exp.title,
            "start_date": exp.start_date.isoformat() if exp.start_date else None,
            "end_date": exp.end_date.isoformat() if exp.end_date else None,
        }

    current, past = [], []
    for exp, user in rows:
        (current if (exp.end_date is None or exp.end_date > today) else past).append(person(exp, user))
    return jsonify({
        "organization": {"id": org.id, "name": org.name, "profile_image": org.profile_image},
        "current": current,
        "past": past,
    }), 200

@api_bp.route("/organizations/<int:org_id>/invite", methods=["POST"])
@jwt_required()
def invite_team_member(org_id):
    if not _manages_org(org_id):
        return jsonify({"error": "Forbidden for this organization"}), 403
    org = Organization.query.get_or_404(org_id)
    payload = request.get_json(silent=True) or {}
    email = payload.get("email")
    role = payload.get("role", "Member")
    permissions = payload.get("permissions")  # list of permissions

    if not email:
        return jsonify({"error": "email required"}), 400
    if role not in ALLOWED_TEAM_ROLES:
        return jsonify({"error": f"Invalid role. Allowed: {sorted(ALLOWED_TEAM_ROLES)}"}), 400
    if role == "Admin" and not _is_org_admin(org_id):
        return jsonify({"error": "Only Admins can grant the Admin role"}), 403
    if not _validate_permissions(permissions):
        return jsonify({"error": "Invalid permissions (must be a list of <=50 strings)"}), 400
    invite_join_date, join_err = _parse_join_date(payload.get("join_date"))
    if join_err:
        return join_err

    # Check if user already exists
    user = User.query.filter_by(email=email).first()
    if user:
        # Check if already a member
        existing = TeamMember.query.filter_by(organization_id=org_id, user_id=user.id).first()
        if existing:
            return jsonify({"error": "user is already a team member"}), 400
        user_id = user.id
    else:
        # Invited colleagues are people, so they get an `individual` account
        # like everyone else. Their page access comes from the team_members row
        # written below — there are no organization-role accounts any more.
        user = User(
            email=email,
            name=email.split('@')[0],  # Use email prefix as name
            role="individual",
            organization_id=org_id
        )
        # Random temporary password (must pass strength policy); share out-of-band.
        user.set_password(f"Tmp-{secrets.token_urlsafe(12)}!A9")
        db.session.add(user)
        db.session.flush()  # Get user.id
        user_id = user.id

    # Add to team members
    tm = TeamMember(
        organization_id=org_id,
        user_id=user_id,
        role=role,
        permissions=json.dumps(permissions) if permissions else None,
        join_date=invite_join_date
    )
    db.session.add(tm)
    # Joining a team means working here: lift the default 'unemployed' state
    # so the profile doesn't contradict itself (Open to Work + In your team).
    # Never demotes an existing hired/working/onboarding state.
    if user.employment_status in (None, "", "unemployed"):
        user.employment_status = "working"
    db.session.commit()
    return jsonify({"message": "invitation sent", "team_member": tm.to_dict()}), 201
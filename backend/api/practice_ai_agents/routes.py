from datetime import datetime
import json

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

# Create a separate blueprint for practice AI agents to avoid circular imports
practice_ai_bp = Blueprint("practice_ai", __name__)


def _build_default_system_prompt(name: str, industry: str) -> str:
    agent_name = name or "Practice AI Interviewer"
    industry_label = industry or "your industry"
    return (
        f"You are {agent_name}, an expert interviewer for {industry_label} positions. "
        "Conduct insightful, professional practice interviews that help candidates prepare for real interviews. "
        "Provide constructive feedback, ask relevant technical questions, and simulate realistic interview scenarios. "
        "Keep a friendly yet focused tone while evaluating the candidate's skills and experience."
    )


@practice_ai_bp.route("/practice-ai-agents", methods=["GET"])
@jwt_required()
def list_practice_ai_agents():
    """Get all practice AI agents for the current user."""
    from ...extensions import db
    from ...models import PracticeAIAgent, User
    from ...utils.subscription import SubscriptionManager

    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)

    # Check if user can access this feature (free during trial)
    if not user.can_access_feature("practice_ai_agents"):
        return jsonify({"error": "Practice AI agents require an active subscription or trial"}), 403

    agents = (
        PracticeAIAgent.query
        .filter_by(user_id=user_id)
        .order_by(PracticeAIAgent.created_at.desc())
        .all()
    )
    return jsonify([agent.to_dict() for agent in agents]), 200


@practice_ai_bp.route("/practice-ai-agents", methods=["POST"])
@jwt_required()
def create_practice_ai_agent():
    """Create a new practice AI agent."""
    from ...extensions import db
    from ...models import PracticeAIAgent, User
    from ...utils.subscription import SubscriptionManager

    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)

    # Check if user can access this feature (free during trial)
    if not user.can_access_feature("practice_ai_agents"):
        return jsonify({"error": "Practice AI agents require an active subscription or trial"}), 403

    payload = request.get_json(silent=True) or {}

    name = payload.get("name")
    industry = payload.get("industry")
    if not name or not industry:
        return jsonify({"error": "name and industry required"}), 400

    system_prompt = payload.get("system_prompt")
    if not system_prompt:
        system_prompt = _build_default_system_prompt(name, industry)

    agent = PracticeAIAgent(
        user_id=user_id,
        name=name,
        industry=industry,
        description=payload.get("description"),
        system_prompt=system_prompt,
        custom_instructions=payload.get("custom_instructions"),
    )

    db.session.add(agent)
    db.session.commit()

    return jsonify(agent.to_dict()), 201


@practice_ai_bp.route("/practice-ai-agents/<int:agent_id>", methods=["GET"])
@jwt_required()
def get_practice_ai_agent(agent_id):
    """Get a specific practice AI agent."""
    from ...models import PracticeAIAgent

    user_id = get_jwt_identity()
    agent = PracticeAIAgent.query.filter_by(id=agent_id, user_id=user_id).first_or_404()

    return jsonify(agent.to_dict()), 200


@practice_ai_bp.route("/practice-ai-agents/<int:agent_id>", methods=["PUT"])
@jwt_required()
def update_practice_ai_agent(agent_id):
    """Update a practice AI agent."""
    from ...extensions import db
    from ...models import PracticeAIAgent

    user_id = get_jwt_identity()
    agent = PracticeAIAgent.query.filter_by(id=agent_id, user_id=user_id).first_or_404()

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

    agent.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify(agent.to_dict()), 200


@practice_ai_bp.route("/practice-ai-agents/<int:agent_id>", methods=["DELETE"])
@jwt_required()
def delete_practice_ai_agent(agent_id):
    """Delete a practice AI agent."""
    from ...extensions import db
    from ...models import PracticeAIAgent

    user_id = get_jwt_identity()
    agent = PracticeAIAgent.query.filter_by(id=agent_id, user_id=user_id).first_or_404()

    db.session.delete(agent)
    db.session.commit()

    return jsonify({"message": "Practice AI agent deleted successfully"}), 200


@practice_ai_bp.route("/practice-ai-agents/<int:agent_id>/schedule-practice", methods=["POST"])
@jwt_required()
def schedule_practice_interview(agent_id):
    """Schedule a practice interview with a practice AI agent."""
    from ...extensions import db
    from ...models import PracticeAIAgent, Interview, User

    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    agent = PracticeAIAgent.query.filter_by(id=agent_id, user_id=user_id).first_or_404()

    # Check if user can schedule interviews (free during trial)
    if not user.can_schedule_interview():
        return jsonify({"error": "Interview scheduling requires an active subscription or trial"}), 403

    payload = request.get_json(silent=True) or {}

    # Create a practice interview
    interview = Interview(
        user_id=user_id,
        organization_id=None,  # Practice interviews don't belong to any organization
        title=f"Practice Interview with {agent.name}",
        description=f"Practice interview session with AI agent: {agent.description}",
        scheduled_at=datetime.utcnow(),  # Start immediately
        status="scheduled",
        interview_type="practice",
        practice_ai_agent_id=agent.id,
    )
    db.session.add(interview)
    db.session.commit()
    
    return {
        'id': interview.id,
        'message': 'Practice interview scheduled successfully'
    }, 201

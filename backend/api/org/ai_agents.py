from flask import request, jsonify
from .. import api_bp
from ...extensions import db
from ...models import AIAgent, Organization, Interview
import json
from datetime import datetime

@api_bp.route("/organizations/<int:org_id>/ai-agents", methods=["GET"])
def list_ai_agents(org_id):
    """Get all AI agents for an organization"""
    org = Organization.query.get_or_404(org_id)
    agents = AIAgent.query.filter_by(organization_id=org_id).all()
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

    agent = AIAgent(
        organization_id=org_id,
        name=name,
        industry=industry,
        description=payload.get("description"),
        is_active=payload.get("is_active", True),
    )
    db.session.add(agent)
    db.session.commit()
    return jsonify(agent.to_dict()), 201

@api_bp.route("/ai-agents/<int:agent_id>", methods=["GET"])
def get_ai_agent(agent_id):
    """Get a specific AI agent"""
    agent = AIAgent.query.get_or_404(agent_id)
    return jsonify(agent.to_dict()), 200

@api_bp.route("/ai-agents/<int:agent_id>", methods=["PUT"])
def update_ai_agent(agent_id):
    """Update an AI agent"""
    agent = AIAgent.query.get_or_404(agent_id)
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
    agent = AIAgent.query.get_or_404(agent_id)
    db.session.delete(agent)
    db.session.commit()
    return jsonify({"message": "AI agent deleted"}), 200

@api_bp.route("/ai-agents/<int:agent_id>/test", methods=["POST"])
def test_ai_agent(agent_id):
    """Test an AI agent with a sample conversation"""
    agent = AIAgent.query.get_or_404(agent_id)
    payload = request.get_json(silent=True) or {}

    test_message = payload.get("message", "Hello, I'm here for the interview.")

    try:
        # Import AI service
        from ...ai_service import get_ai_service

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

    agent = AIAgent.query.get(interview.ai_agent_id)
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

    agent = AIAgent.query.get(interview.ai_agent_id)
    if not agent or not agent.is_active:
        return jsonify({"error": "AI agent not found or inactive"}), 400

    try:
        from ...ai_service import get_ai_service
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

    agent = AIAgent.query.get(agent_id)
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
    from ...ai_service import test_ai_connection
    result = test_ai_connection()
    return jsonify(result), 200 if result["success"] else 500
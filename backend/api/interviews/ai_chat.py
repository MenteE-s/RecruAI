from flask import request, jsonify
from .. import api_bp
from ...extensions import db
from ...models import Interview, User, AIInterviewAgent, ConversationMessage, PracticeAIAgent
from ...ai_service import get_ai_service
from ...utils.subscription import require_subscription
from ...rag.tools.thinking import ThinkingModule
from ...utils.kafka_service import KafkaService
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
import time
from datetime import datetime

@api_bp.route('/interviews/<int:interview_id>/chat', methods=['POST'])
@jwt_required()
@require_subscription('ai_chat')
def interview_chat(interview_id):
    """Unified AI chat endpoint for interviews with first-class agent attribution"""
    data = request.get_json()

    if not data or 'message' not in data:
        return jsonify({'error': 'Message required'}), 400

    enable_thinking = data.get('enable_thinking', True)

    # Get authenticated user
    user_id = get_jwt_identity()
    user_id = int(user_id)  # Convert to int for database comparison
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    message = data['message']
    interview = Interview.query.get(interview_id)
    if not interview:
        return jsonify({'error': 'Interview not found'}), 404

    # Check access (keeping original logic)
    has_access = False
    if interview.user_id == user_id:
        has_access = True
    elif interview.organization_id is not None and user.organization and user.organization.id == interview.organization_id:
        has_access = True
    
    if not has_access:
        return jsonify({'error': 'Access denied'}), 403

    # Resolve AI agent for this interview
    agent = resolve_interview_agent(interview)
    if not agent:
        return jsonify({'error': 'No AI agent available for this interview'}), 400

    # Store user message
    ConversationMessage.add_user_message(interview_id, user_id, message)
    db.session.commit()

    # Emit Kafka event for candidate message received
    try:
        kafka = KafkaService()
        kafka.emit_event('interview_candidate_message', {
            'interview_id': interview_id,
            'user_id': user_id,
            'content': message,
            'sender_name': user.name or user.email,
            'sender_type': 'user',
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as ke:
        print(f"Failed to emit Kafka message for candidate interaction: {ke}")

    # Generate AI response with optional thinking
    thinking_step = None
    if enable_thinking:
        thinking_module = ThinkingModule()
        
        # Prepare context chunks for thinking from interview details
        context_chunks = [
            {'content': f"Job Title: {interview.title}", 'source_type': 'interview_info', 'similarity_score': 1.0},
            {'content': f"Job Description: {interview.description}", 'source_type': 'interview_info', 'similarity_score': 1.0},
        ]
        
        if interview.post:
            context_chunks.append({'content': f"Post Requirements: {interview.post.requirements}", 'source_type': 'job_post', 'similarity_score': 1.0})
            
        # System context to guide the thinking module
        system_context = f"This is a formal job interview for the position: {interview.title}. Organization: {interview.organization.name if interview.organization else 'N/A'}. Round: {interview.current_round or 1}."

        # Analyze and reason
        analysis = thinking_module.analyze_context(message, context_chunks, system_context)
        reasoning = thinking_module.generate_reasoning(message, context_chunks, analysis, system_context)
        validation = thinking_module.validate_reasoning(reasoning)
        
        thinking_step = {
            'analysis': analysis,
            'reasoning': reasoning,
            'validation': validation,
            'thinking_successful': validation.get('is_acceptable', False)
        }

    # Generate final response
    # If thinking was successful, we might want to inject thinking insights into the prompt
    # But for now, we'll just return it to the frontend
    response = generate_agent_response(message, interview, agent, user, thinking_step)

    # Store agent response
    ConversationMessage.add_agent_message(interview_id, agent, response)
    db.session.commit()

    # Emit Kafka event for agent response generated
    try:
        kafka = KafkaService()
        
        # If thinking was used, emit thinking event first
        if enable_thinking and thinking_step:
            kafka.emit_event('interview_agent_thinking', {
                'interview_id': interview_id,
                'thinking_process': thinking_step,
                'timestamp': datetime.utcnow().isoformat()
            })
            
        kafka.emit_event('interview_agent_response', {
            'id': ConversationMessage.query.filter_by(interview_id=interview_id, sender_type='agent').order_by(ConversationMessage.created_at.desc()).first().id,
            'interview_id': interview_id,
            'agent_id': agent.id if hasattr(agent, 'id') else None,
            'agent_name': agent.name,
            'content': response,
            'sender_name': agent.name,
            'sender_type': 'agent',
            'thinking_used': enable_thinking,
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as ke:
        print(f"Failed to emit Kafka message for agent response: {ke}")

    # Set agent_persona for response
    if isinstance(agent, AIInterviewAgent):
        agent_persona = agent.persona if hasattr(agent, 'persona') and agent.persona else 'AI Interviewer'
    elif isinstance(agent, PracticeAIAgent):
        agent_persona = agent.description if hasattr(agent, 'description') and agent.description else 'Practice AI Interviewer'
    else:
        agent_persona = 'AI Interviewer'

    return jsonify({
        'response': response,
        'agent_id': agent.id,
        'agent_name': agent.name,
        'agent_persona': agent_persona,
        'interview_id': interview_id,
        'thinking_step': thinking_step
    }), 200


def resolve_interview_agent(interview):
    """Resolve which AI agent to use for an interview"""
    print(f"Resolving agent for interview {interview.id}, type: {interview.interview_type}")
    
    # Priority 1: Explicitly assigned agent
    if interview.ai_agent and interview.ai_agent.is_active:
        print(f"Using explicitly assigned agent: {interview.ai_agent.name}")
        return interview.ai_agent

    # Priority 2: Practice AI agent (for practice interviews)
    if interview.practice_ai_agent and interview.practice_ai_agent.is_active:
        print(f"Using practice AI agent: {interview.practice_ai_agent.name}")
        return interview.practice_ai_agent

    # Priority 3: Organization default agent (first active agent)
    if interview.organization:
        default_agent = AIInterviewAgent.query.filter_by(
            organization_id=interview.organization_id,
            is_active=True
        ).first()
        if default_agent:
            print(f"Using organization default agent: {default_agent.name}")
            return default_agent

    # Priority 4: System fallback (create a generic agent if needed)
    # For now, return None - interviews must have agents assigned
    print("No agent found")
    return None


def generate_agent_response(message, interview, agent, user, thinking_step=None):
    """Generate a response from the AI agent"""
    try:
        ai_service = get_ai_service()

        # Get conversation history (last 10 messages)
        recent_messages = ConversationMessage.get_recent_conversation(interview.id, limit=10)
        recent_messages.reverse()  # Chronological order

        # Check if this is the first message (no previous conversation)
        is_first_message = len(recent_messages) == 0

        # Build comprehensive system prompt
        system_prompt = build_agent_system_prompt(agent, interview, is_first_message, thinking_step)

        # Format for AI service
        conversation_history = []
        for msg in recent_messages:
            role = "user" if msg.sender_type == "user" else "assistant"
            conversation_history.append({
                "role": role,
                "content": msg.content
            })

        # Use the interview AI service for better round handling
        interview_context = {
            "round_number": interview.current_round or 1,
            "is_first_message": is_first_message
        }

        # Generate response using the specialized interview AI service
        response = ai_service.generate_response(system_prompt, message, conversation_history, user, "interview_ai")
        return response

    except Exception as e:
        print(f"Error generating agent response: {e}")
        return generate_fallback_response(message, interview, agent)


def build_agent_system_prompt(agent, interview, is_first_message=False, thinking_step=None):
    """Build comprehensive system prompt for the AI agent"""
    from datetime import datetime

    prompt_parts = []

    # CORE MISSION - ALWAYS AT THE TOP
    prompt_parts.append(f"""
# CORE MISSION
You are an expert AI Interviewer conducting a formal job interview. 
Your primary goal is to evaluate the candidate for the role of: {interview.title}.
This is NOT a general chat. Every response you give must serve the purpose of the interview.
""")

    # Agent identity and persona/behavioral style
    prompt_parts.append(f"You are {agent.name}")
    
    # Handle thinking insights if available
    if thinking_step:
        reasoning = thinking_step.get('reasoning', {})
        strategy = reasoning.get('response_strategy', '')
        tone = reasoning.get('tone_and_style', '')
        key_points = reasoning.get('key_points_to_cover', [])
        
        if strategy:
            prompt_parts.append(f"RESPONSE STRATEGY: {strategy}")
        if tone:
            prompt_parts.append(f"RECOMMENDED TONE: {tone}")
        if key_points:
            prompt_parts.append(f"KEY POINTS TO COVER: {', '.join(key_points)}")
    
    # Handle different agent types
    if isinstance(agent, AIInterviewAgent):
        if agent.persona:
            prompt_parts.append(f"Your behavioral style is: {agent.persona}")
    elif isinstance(agent, PracticeAIAgent):
        # Practice agents use description and custom_instructions
        if agent.description:
            prompt_parts.append(f"Your role: {agent.description}")
        if agent.custom_instructions:
            prompt_parts.append(f"Additional instructions: {agent.custom_instructions}")
    else:
        # Fallback
        prompt_parts.append("You are an AI interviewer.")
    
    prompt_parts.append(f"You specialize in {agent.industry} interviews.")

    # System prompt
    prompt_parts.append("\n" + agent.system_prompt)

    # Interview context
    current_time = datetime.utcnow()
    time_until_interview = interview.scheduled_at - current_time
    minutes_remaining = int(time_until_interview.total_seconds() / 60)

    round_number = interview.current_round or 1

    prompt_parts.append(f"""
INTERVIEW CONTEXT:
- Position: {interview.title}
- Description: {interview.description or 'Not specified'}
- Organization: {interview.organization.name if interview.organization else 'Unknown'}
- Current Round: {round_number}
- Current Time: {current_time.strftime('%Y-%m-%d %H:%M UTC')}
- Time Status: {'Interview in progress' if minutes_remaining < 0 else f'Starts in {abs(minutes_remaining)} minutes'}
""")

    # Job details
    if interview.post:
        prompt_parts.append(f"""
JOB REQUIREMENTS:
- Title: {interview.post.title}
- Description: {interview.post.description or 'Not specified'}
- Requirements: {interview.post.requirements or 'Not specified'}
- Employment Type: {interview.post.employment_type or 'Not specified'}
- Location: {interview.post.location or 'Not specified'}
""")

    # Custom instructions
    if agent.custom_instructions:
        prompt_parts.append(f"\nCUSTOM INSTRUCTIONS:\n{agent.custom_instructions}")

    # Round-specific instructions
    if round_number > 1:
        prompt_parts.append(f"""
ROUND {round_number} INSTRUCTIONS:
- This is Round {round_number} of the interview process
- The candidate has successfully passed Round {round_number - 1}
- Build upon previous conversations - ask more advanced questions
- Reference their previous answers when appropriate
- Focus on deeper technical skills and problem-solving abilities
""")

    # First message instructions
    if is_first_message:
        if round_number == 1:
            prompt_parts.append("""
FIRST MESSAGE INSTRUCTIONS:
- Start with a professional greeting and introduce yourself
- Briefly explain the interview process
- Ask an opening question to begin the conversation
- Set a positive, professional tone
""")
        else:
            prompt_parts.append(f"""
ROUND {round_number} START INSTRUCTIONS:
- Acknowledge that the candidate has advanced to Round {round_number}
- Reference that they successfully completed Round {round_number - 1}
- Briefly welcome them to this round
- Ask your first question for this round
""")

    # Response guidelines
    prompt_parts.append("""
RESPONSE GUIDELINES:
- Keep responses under 100 words
- Start conversationally, ask ONE focused question per response
- Reference job requirements naturally
- Be authoritative but approachable
- Focus on specific examples and measurable outcomes
- Build conversation naturally
- One question per response
""")

    return "\n".join(prompt_parts)


def generate_fallback_response(message, interview, agent):
    """Generate a basic fallback response when AI fails"""
    job_title = interview.title or "this position"
    company_name = interview.organization.name if interview.organization else "our organization"

    return f"Hello! I'm {agent.name}, your AI interviewer for the {job_title} position at {company_name}. I'm excited to learn more about your background and experience. Let's start with you telling me a bit about yourself and why you're interested in this role."


# DEPRECATED: Remove these endpoints once frontend is updated
@api_bp.route('/ai/chat', methods=['POST'])
@jwt_required()
def deprecated_ai_chat():
    """Deprecated: Use /interviews/{id}/chat instead"""
    return jsonify({'error': 'This endpoint is deprecated. Use /interviews/{id}/chat'}), 410

@api_bp.route('/ai/user', methods=['GET'])
def deprecated_get_ai_user():
    """Deprecated: AI agents are no longer users"""
    return jsonify({'error': 'This endpoint is deprecated. AI agents are first-class entities'}), 410
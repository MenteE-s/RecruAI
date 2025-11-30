from flask import request, jsonify
from .. import api_bp
from ...extensions import db
from ...models import Interview, User, AIInterviewAgent, ConversationMemory
from ...ai_service import get_ai_service
import json

@api_bp.route('/ai/chat', methods=['POST'])
def ai_chat():
    """AI chat endpoint with conversation memory and RAG capabilities"""
    data = request.get_json()

    if not data or 'message' not in data:
        return jsonify({'error': 'Message required'}), 400

    message = data['message']
    interview_id = data.get('interview_id')
    conversation_history = data.get('conversation_history', [])

    # Store user message in conversation memory
    if interview_id:
        try:
            # Get AI user ID
            ai_user = User.query.filter_by(email='ai@recruai.com').first()
            ai_user_id = ai_user.id if ai_user else 1

            # Store user message
            ConversationMemory.add_message(
                interview_id=interview_id,
                user_id=1,  # TODO: Get from auth context
                message_type='user',
                content=message
            )
        except Exception as e:
            print(f"Error storing user message: {e}")

    # Generate contextual response using conversation history and RAG
    agent_response = generate_contextual_response(message, interview_id, conversation_history)

    # Store AI response in conversation memory
    if interview_id:
        try:
            ConversationMemory.add_message(
                interview_id=interview_id,
                user_id=ai_user_id,
                message_type='ai',
                content=agent_response
            )
        except Exception as e:
            print(f"Error storing AI response: {e}")

    # Get agent name for response
    agent_name = 'AI Interview Assistant'
    if interview_id:
        try:
            interview = Interview.query.get(interview_id)
            if interview and interview.ai_agent:
                agent_name = interview.ai_agent.name
        except Exception as e:
            print(f"Error getting agent name: {e}")

    return jsonify({
        'response': agent_response,
        'agent_name': agent_name,
        'interview_id': interview_id
    }), 200

def generate_contextual_response(message, interview_id, conversation_history):
    """Generate a contextual response using conversation memory and RAG"""
    try:
        # Get conversation history from database if interview_id provided
        if interview_id:
            recent_messages = ConversationMemory.get_recent_conversation(interview_id, limit=10)
            # Convert to conversation format
            db_history = []
            for msg in recent_messages:
                db_history.append({
                    'role': 'user' if msg.message_type == 'user' else 'assistant',
                    'content': msg.content
                })
            # Reverse to get chronological order (oldest first)
            db_history.reverse()
            # Combine with provided history
            conversation_history = db_history + conversation_history

        # Get interview context for RAG
        interview_context = ""
        if interview_id:
            try:
                interview = Interview.query.get(interview_id)
                if interview:
                    interview_context = build_interview_context(interview)
            except Exception as e:
                print(f"Error getting interview context: {e}")

        # Analyze conversation flow and generate contextual response
        response = generate_smart_response(message, conversation_history, interview_context, interview)

        return response

    except Exception as e:
        print(f"Error generating contextual response: {e}")
        return 'I need you to be more specific. Give me concrete examples from your experience that demonstrate your capabilities for this role.'


def build_interview_context(interview):
    """Build comprehensive context from interview data for RAG"""
    from datetime import datetime

    current_time = datetime.utcnow()
    time_until_interview = interview.scheduled_at - current_time
    minutes_remaining = int(time_until_interview.total_seconds() / 60)

    context = f"""
    Interview Context:
    - Position: {interview.title}
    - Description: {interview.description or 'Not specified'}
    - Organization: {interview.organization.name if interview.organization else 'Unknown'}
    - Interview Type: {interview.interview_type}
    - Scheduled Time: {interview.scheduled_at.strftime('%Y-%m-%d %H:%M UTC')}
    - Duration: {interview.duration_minutes} minutes
    - Time Status: {'Interview in progress' if minutes_remaining < 0 else f'Starts in {abs(minutes_remaining)} minutes'}
    - Current UTC Time: {current_time.strftime('%Y-%m-%d %H:%M UTC')}
    """

    if interview.post:
        context += f"""
    Job Details:
    - Job Title: {interview.post.title}
    - Description: {interview.post.description or 'Not specified'}
    - Requirements: {interview.post.requirements or 'Not specified'}
    - Employment Type: {interview.post.employment_type or 'Not specified'}
    - Location: {interview.post.location or 'Not specified'}
    - Salary: {interview.post.salary_min or 'Not specified'} - {interview.post.salary_max or 'Not specified'} {interview.post.salary_currency or 'USD'}
    """

    # Add AI agent context if available
    if interview.ai_agent:
        agent = interview.ai_agent
        context += f"""
    AI Interviewer Profile:
    - Name: {agent.name}
    - Industry Focus: {agent.industry or 'General'}
    - System Prompt: {agent.system_prompt or 'Not specified'}
    - Custom Instructions: {agent.custom_instructions or 'Not specified'}
    """

    return context


def build_interview_system_prompt(interview_context, interview=None):
    """Build a comprehensive system prompt for the AI interviewer"""
    # If there's an AI agent assigned to this interview, use its system prompt
    if interview and interview.ai_agent:
        agent = interview.ai_agent
        base_prompt = f"""{agent.system_prompt}

{interview_context}

INSTRUCTIONS: {agent.custom_instructions or 'Be professional and thorough'}

STYLE: Keep responses under 100 words. Start conversationally, ask ONE focused question. Reference job requirements naturally. Be authoritative but approachable.

You are {agent.name} from {agent.organization.name if agent.organization else 'Unknown'}."""
        return base_prompt

    # Fallback to generic prompt if no agent assigned
    base_prompt = f"""You are a professional interviewer evaluating candidates for specific job positions.

CORE PRINCIPLES:
- Keep responses under 100 words
- Start with brief greeting, ask ONE focused question
- Reference job requirements naturally in questions
- Demand specific examples with measurable outcomes
- Be authoritative but conversational

{interview_context}

RULES:
- No tables, lists, or detailed plans
- One question per response
- Build conversation naturally
- Always reference the specific job position

Remember: Evaluate for THIS SPECIFIC JOB using the provided context."""

    return base_prompt


def format_conversation_history(conversation_history):
    """Format conversation history for AI consumption"""
    formatted = []
    for msg in conversation_history[-10:]:  # Keep last 10 messages for context
        formatted.append({
            "role": msg.get('role', 'user'),
            "content": msg.get('content', '')
        })
    return formatted


def generate_fallback_response(message, conversation_history, interview_context):
    """Generate a basic fallback response when AI generation fails"""
    # Extract job details from context
    job_title = "this position"
    job_requirements = ""
    company_name = "our organization"

    if interview_context:
        # Parse context for job details
        context_lines = interview_context.split('\n')
        for line in context_lines:
            if 'Job Title:' in line:
                job_title = line.split('Job Title:')[1].strip()
            elif 'Requirements:' in line and 'Not specified' not in line:
                job_requirements = line.split('Requirements:')[1].strip()
            elif 'Organization:' in line:
                company_name = line.split('Organization:')[1].strip()

    # Simple fallback logic
    if len(conversation_history) <= 1:
        return f"Hello. I'm evaluating your fit for the {job_title} position at {company_name}. Tell me about your experience with {job_title} roles - what specific products or projects have you managed?"

    # Check for common patterns and provide dominant follow-ups
    last_user_msg = None
    for msg in reversed(conversation_history):
        if msg.get('role') == 'user':
            last_user_msg = msg.get('content', '').lower()
            break

    if last_user_msg:
        if any(word in last_user_msg for word in ['experience', 'work', 'job']):
            return f"Tell me about a specific project where you demonstrated the skills needed for this {job_title} role. What were your key responsibilities and the outcome?"
        elif any(word in last_user_msg for word in ['skill', 'technology', 'tool']):
            return f"Give me a concrete example of how you've applied this skill in a real project relevant to our {job_title} position."
        elif any(word in last_user_msg for word in ['challenge', 'problem', 'difficult']):
            return f"Walk me through how you solved that challenge. What was the measurable impact?"
        elif 'position' in last_user_msg or 'open' in last_user_msg:
            return f"I'm here to evaluate your qualifications for the {job_title} position at {company_name}. Tell me about your relevant experience."
        elif 'software' in last_user_msg or 'engineer' in last_user_msg:
            return f"For this {job_title} role, tell me about a product you've managed that involved technical components. What was your approach?"

    return f"I need a specific example from your experience that shows your capabilities for this {job_title} role. What have you accomplished?"


def generate_smart_response(message, conversation_history, interview_context, interview=None):
    """Generate intelligent response using AI based on conversation analysis and context"""
    try:
        # Get the AI service (uses Groq by default)
        ai_service = get_ai_service()

        # Build comprehensive system prompt for interview AI
        system_prompt = build_interview_system_prompt(interview_context, interview)

        # Format conversation history for AI service
        formatted_history = []
        if conversation_history:
            # Include recent conversation context
            recent_messages = conversation_history[-6:]  # Last 3 exchanges
            for msg in recent_messages:
                formatted_history.append({
                    "role": msg.get('role', 'user'),
                    "content": msg.get('content', '')
                })

        # Generate response using AI service (Groq)
        response = ai_service.generate_response(system_prompt, message, formatted_history)

        return response

    except Exception as e:
        print(f"Error in AI response generation: {e}")
        return generate_fallback_response(message, conversation_history, interview_context)



@api_bp.route('/ai/user', methods=['GET'])
def get_ai_user():
    """Get or create AI system user for messages"""
    from ...models import User

    # Check if AI user exists
    ai_user = User.query.filter_by(email='ai@recruai.com').first()
    if not ai_user:
        # Create AI user if it doesn't exist
        ai_user = User(
            email='ai@recruai.com',
            name='AI Assistant',
            role='system',
            plan='pro'
        )
        ai_user.set_password('ai_password_not_used')  # Not used for login
        db.session.add(ai_user)
        db.session.commit()

    return jsonify({
        'id': ai_user.id,
        'name': ai_user.name,
        'email': ai_user.email
    }), 200
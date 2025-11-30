from flask import request, jsonify
from .. import api_bp
from ...extensions import db
from ...models import Interview, User, AIAgent, ConversationMemory
from ...rag.tools.generator import GeneratorTool
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

    return jsonify({
        'response': agent_response,
        'agent_name': 'AI Interview Assistant',
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
        response = generate_smart_response(message, conversation_history, interview_context)

        return response

    except Exception as e:
        print(f"Error generating contextual response: {e}")
        return 'Thank you for your response. Can you elaborate on that or tell me more about your experience?'


def build_interview_context(interview):
    """Build comprehensive context from interview data for RAG"""
    context = f"""
    Interview Context:
    - Position: {interview.title}
    - Description: {interview.description or 'Not specified'}
    - Organization: {interview.organization.name if interview.organization else 'Unknown'}
    - Interview Type: {interview.interview_type}
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


def build_interview_system_prompt(interview_context):
    """Build a comprehensive system prompt for the AI interviewer"""
    base_prompt = f"""You are an experienced, professional interviewer conducting a job interview. Your role is to:

1. **Be Dominant**: You control the conversation flow and ask most of the questions
2. **Ask Follow-up Questions**: Always probe deeper into the candidate's responses
3. **Be Professional**: Maintain a professional, respectful tone
4. **Be Thorough**: Cover all relevant aspects of the candidate's experience and fit
5. **Guide the Conversation**: Direct the interview towards important topics
6. **Show Interest**: Demonstrate genuine interest in the candidate's background

{interview_context}

**Interview Guidelines:**
- Start with broad questions about background and experience
- Ask specific examples and detailed explanations
- Probe for problem-solving abilities and achievements
- Inquire about motivation and career goals
- Always ask follow-up questions to get deeper insights
- Keep responses conversational but focused
- End questions with appropriate follow-up prompts

**Response Style:**
- Be conversational and engaging
- Show enthusiasm for the candidate's responses
- Ask 1-2 focused follow-up questions per response
- Keep responses concise but comprehensive
- Maintain professional interview atmosphere

Remember: You are the interviewer - ask questions, probe deeper, and guide the conversation."""

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
    # Simple fallback logic
    if len(conversation_history) <= 1:
        return "Hello! I'm excited to learn more about you. Could you tell me about your professional background and what interests you about this position?"

    # Check for common patterns and provide basic follow-ups
    last_user_msg = None
    for msg in reversed(conversation_history):
        if msg.get('role') == 'user':
            last_user_msg = msg.get('content', '').lower()
            break

    if last_user_msg:
        if any(word in last_user_msg for word in ['experience', 'work', 'job']):
            return "That's interesting. Can you tell me more about your specific responsibilities in that role?"
        elif any(word in last_user_msg for word in ['skill', 'technology', 'tool']):
            return "Great! Can you give me an example of how you've applied that skill in a real project?"
        elif any(word in last_user_msg for word in ['challenge', 'problem', 'difficult']):
            return "I understand. How did you approach solving that challenge?"

    return "Thank you for sharing that. Can you elaborate a bit more on your experience in this area?"


def generate_smart_response(message, conversation_history, interview_context):
    """Generate intelligent response using AI based on conversation analysis and context"""
    try:
        # Initialize the generator tool
        generator = GeneratorTool()

        # Build comprehensive system prompt for interview AI
        system_prompt = build_interview_system_prompt(interview_context)

        # Format conversation history for context
        context_text = ""
        if conversation_history:
            # Include recent conversation context
            recent_messages = conversation_history[-6:]  # Last 3 exchanges
            context_parts = []
            for msg in recent_messages:
                role = "Candidate" if msg.get('role') == 'user' else "Interviewer"
                content = msg.get('content', '')[:200]  # Truncate long messages
                context_parts.append(f"{role}: {content}")
            context_text = "\n".join(context_parts)

        # Create context chunks with conversation history and interview context
        context_chunks = []
        if context_text:
            context_chunks.append({
                'content': f"Recent Conversation:\n{context_text}",
                'chunk_index': 0,
                'word_count': len(context_text.split()),
                'char_count': len(context_text),
                'metadata': {'type': 'conversation_history'}
            })

        if interview_context:
            context_chunks.append({
                'content': f"Interview Context:\n{interview_context}",
                'chunk_index': 1,
                'word_count': len(interview_context.split()),
                'char_count': len(interview_context),
                'metadata': {'type': 'interview_context'}
            })

        # Generate response using AI with proper context
        response = generator.generate_answer(
            query=message,
            context_chunks=context_chunks,
            user_context={"role": "interviewer", "context": "job_interview"}
        )

        # If AI generation fails, fall back to basic response
        if 'error' in response:
            return generate_fallback_response(message, conversation_history, interview_context)

        return response.get('answer', 'I apologize, but I encountered an issue generating a response. Could you please rephrase your answer?')

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
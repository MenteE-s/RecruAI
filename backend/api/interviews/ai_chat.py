from flask import request, jsonify
from .. import api_bp
from ...extensions import db
from ...models import Interview, User, AIAgent, ConversationMemory
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


def generate_smart_response(message, conversation_history, interview_context):
    """Generate intelligent response based on conversation analysis and context"""

    # Analyze conversation patterns
    conversation_analysis = analyze_conversation(conversation_history)

    # Determine response strategy based on conversation state
    if conversation_analysis['is_first_message']:
        return generate_opening_response(message, interview_context)

    elif conversation_analysis['needs_follow_up']:
        return generate_follow_up_response(message, conversation_analysis, interview_context)

    elif conversation_analysis['topic_shift']:
        return generate_topic_transition_response(message, conversation_analysis, interview_context)

    elif conversation_analysis['depth_needed']:
        return generate_deep_dive_response(message, conversation_analysis, interview_context)

    else:
        return generate_contextual_response_based_on_history(message, conversation_history, interview_context)


def analyze_conversation(conversation_history):
    """Analyze conversation history to understand context and flow"""
    if not conversation_history:
        return {'is_first_message': True, 'needs_follow_up': False, 'topic_shift': False, 'depth_needed': False}

    # Analyze recent messages for patterns
    recent_messages = conversation_history[-6:]  # Last 3 exchanges

    analysis = {
        'is_first_message': len(conversation_history) <= 1,
        'needs_follow_up': False,
        'topic_shift': False,
        'depth_needed': False,
        'current_topic': None,
        'asked_questions': [],
        'user_responses': []
    }

    # Extract questions and responses
    for msg in recent_messages:
        if msg['role'] == 'assistant':
            # Check if it's a question
            if '?' in msg['content'] or any(word in msg['content'].lower() for word in ['can you', 'tell me', 'describe', 'explain', 'what', 'how', 'why']):
                analysis['asked_questions'].append(msg['content'])
        elif msg['role'] == 'user':
            analysis['user_responses'].append(msg['content'])

    # Determine if follow-up is needed
    if analysis['asked_questions'] and len(analysis['user_responses']) < len(analysis['asked_questions']):
        analysis['needs_follow_up'] = True

    # Check for topic shifts (simplified)
    if len(recent_messages) >= 4:
        recent_content = ' '.join([msg['content'] for msg in recent_messages[-4:]])
        if any(word in recent_content.lower() for word in ['different', 'another', 'next', 'also', 'additionally']):
            analysis['topic_shift'] = True

    # Check if deeper response is needed
    if len(analysis['user_responses']) > 0:
        last_response = analysis['user_responses'][-1]
        if len(last_response.split()) < 10:  # Very short response
            analysis['depth_needed'] = True

    return analysis


def generate_opening_response(message, interview_context):
    """Generate appropriate opening response based on interview context"""
    message_lower = message.lower()

    # Check for common opening questions
    if any(phrase in message_lower for phrase in ['tell me about yourself', 'introduce yourself', 'background']):
        return "I'd be happy to hear about your background. Can you tell me about your professional experience and what brings you to apply for this position?"

    elif any(phrase in message_lower for phrase in ['why this job', 'why apply', 'interested in']):
        return "That's a great question. What specifically about this role interests you, and how do you see yourself contributing to our team?"

    elif any(phrase in message_lower for phrase in ['strengths', 'good at', 'skills']):
        return "Everyone has different strengths. Can you share some of your key strengths and how they've helped you in your career?"

    elif any(phrase in message_lower for phrase in ['weaknesses', 'challenges', 'difficulties']):
        return "We all have areas for growth. Can you tell me about a challenge you've faced and how you worked to overcome it?"

    else:
        # Generic opening response
        return "Thank you for starting our conversation. To help me understand you better, could you tell me about your professional background and what interests you about this position?"


def generate_follow_up_response(message, analysis, interview_context):
    """Generate follow-up questions based on previous responses"""
    if analysis['asked_questions']:
        last_question = analysis['asked_questions'][-1]

        # Generate contextual follow-up based on the last question asked
        if 'experience' in last_question.lower():
            return "That's interesting. Can you elaborate on your most recent role and the key responsibilities you had?"

        elif 'background' in last_question.lower():
            return "Thanks for sharing that. What motivated you to pursue this career path?"

        elif 'strengths' in last_question.lower():
            return "Those are valuable strengths. Can you give me a specific example of how you've applied one of these strengths in your work?"

        elif 'challenges' in last_question.lower():
            return "I appreciate you sharing that. How did you approach solving that challenge, and what did you learn from the experience?"

    return "Thank you for that response. Can you provide more details about your experience in this area?"


def generate_topic_transition_response(message, analysis, interview_context):
    """Handle topic transitions smoothly"""
    return "That's a good point. Let's explore that area. Can you tell me more about your experience with this topic?"


def generate_deep_dive_response(message, analysis, interview_context):
    """Generate deeper, more probing questions"""
    return "I'd like to understand this better. Can you walk me through a specific example or project where you applied these skills?"


def generate_contextual_response_based_on_history(message, conversation_history, interview_context):
    """Generate response based on full conversation context"""

    # Extract key information from conversation history
    discussed_topics = []
    user_expertise_areas = []
    user_interests = []

    for msg in conversation_history:
        if msg['role'] == 'user':
            content = msg['content'].lower()
            # Simple keyword extraction (could be enhanced with NLP)
            if any(word in content for word in ['python', 'javascript', 'java', 'react', 'node']):
                user_expertise_areas.append('technical development')
            if any(word in content for word in ['team', 'lead', 'manage', 'leadership']):
                user_expertise_areas.append('leadership')
            if any(word in content for word in ['marketing', 'sales', 'customer']):
                user_expertise_areas.append('business development')

    # Generate contextual response based on extracted information
    if 'technical development' in user_expertise_areas:
        return "Based on your technical background, I'm interested in hearing more about your development process. Can you describe a challenging technical problem you solved recently?"

    elif 'leadership' in user_expertise_areas:
        return "Your leadership experience is impressive. Can you share an example of how you've motivated and developed a team?"

    elif 'business development' in user_expertise_areas:
        return "Your business development experience is valuable. How do you approach building and maintaining client relationships?"

    else:
        # Default contextual response
        return "Thank you for sharing that. Based on what you've told me so far, what aspects of this role are you most excited about?"

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
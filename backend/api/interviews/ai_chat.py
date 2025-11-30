from flask import request, jsonify
from .. import api_bp
from ...extensions import db
from ...models import Interview, User, AIAgent
import json

@api_bp.route('/ai/chat', methods=['POST'])
def ai_chat():
    """AI chat endpoint that uses assigned AI agents for interviews"""
    data = request.get_json()

    if not data or 'message' not in data:
        return jsonify({'error': 'Message required'}), 400

    message = data['message']
    interview_id = data.get('interview_id')

    # Check if this is for an interview with an assigned AI agent
    agent_response = None
    agent_name = "AI Assistant"

    if interview_id:
        try:
            interview = Interview.query.get(interview_id)
            if interview and interview.ai_agent:
                # Use the assigned AI agent's personality and instructions
                agent = interview.ai_agent
                agent_name = agent.name

                # Generate response based on agent's system prompt and custom instructions
                agent_response = generate_agent_response(message, agent, interview)
        except Exception as e:
            print(f"Error getting interview agent: {e}")

    # If no agent-specific response, use default responses
    if not agent_response:
        # Simple mock AI responses based on common interview questions
        responses = {
            'tell me about yourself': 'I\'d be happy to hear about your background. Can you tell me about your professional experience and what brings you to apply for this position?',
            'why do you want this job': 'That\'s a great question. What specifically about this role interests you, and how do you see yourself contributing to our team?',
            'what are your strengths': 'Everyone has different strengths. Can you share some of your key strengths and how they\'ve helped you in your career?',
            'what are your weaknesses': 'We all have areas for growth. Can you tell me about a challenge you\'ve faced and how you worked to overcome it?',
            'why did you leave your last job': 'Career changes are common. Can you share what led you to look for new opportunities?',
            'where do you see yourself in 5 years': 'That\'s an interesting question. How do you envision your career progressing, and what are your professional goals?',
            'why should we hire you': 'That\'s a key question. What makes you uniquely qualified for this position?',
            'do you have any questions': 'Absolutely, I encourage questions! What would you like to know about the role, team, or company?',
        }

        # Default response
        response_text = 'Thank you for your response. Can you elaborate on that or tell me more about your experience?'

        # Check for keywords in the message
        message_lower = message.lower()
        for key, response in responses.items():
            if key in message_lower:
                response_text = response
                break

        # If it's a follow-up question, provide a more generic response
        if '?' in message:
            response_text = 'That\'s a thoughtful question. Can you share more about your thoughts on this topic?'

        agent_response = response_text

    return jsonify({
        'response': agent_response,
        'agent_name': agent_name,
        'interview_id': interview_id
    }), 200

def generate_agent_response(message, agent, interview):
    """Generate a response using the AI agent's personality and instructions"""
    try:
        # Get agent details
        system_prompt = agent.system_prompt or ""
        custom_instructions = agent.custom_instructions or ""
        industry = agent.industry or "general"

        # Build context from interview and job details
        context = f"""
        Interview Context:
        - Position: {interview.title}
        - Industry: {industry}
        - Organization: {interview.organization.name if interview.organization else 'Unknown'}
        - Interview Type: {interview.interview_type}
        """

        if interview.post:
            context += f"""
        Job Details:
        - Job Title: {interview.post.title}
        - Description: {interview.post.description or 'Not specified'}
        - Requirements: {interview.post.requirements or 'Not specified'}
        """

        # Combine system prompt with custom instructions
        full_prompt = f"{system_prompt}\n\n{custom_instructions}\n\n{context}"

        # For now, generate a response based on the agent's industry and instructions
        # In a real implementation, this would call an AI service like OpenAI or Groq

        # Industry-specific response patterns
        industry_responses = {
            'software engineering': {
                'keywords': ['code', 'programming', 'development', 'algorithm', 'debug'],
                'response': 'As a software engineering interviewer, I\'m particularly interested in your technical approach. Can you walk me through your thought process and the technologies you\'ve worked with?'
            },
            'marketing': {
                'keywords': ['marketing', 'campaign', 'brand', 'strategy', 'customer'],
                'response': 'In marketing, understanding customer behavior and campaign effectiveness is crucial. Can you share examples of marketing strategies you\'ve implemented and their outcomes?'
            },
            'finance': {
                'keywords': ['finance', 'budget', 'investment', 'analysis', 'financial'],
                'response': 'Financial roles require strong analytical skills and attention to detail. Can you discuss your experience with financial analysis and decision-making?'
            },
            'design': {
                'keywords': ['design', 'ui', 'ux', 'creative', 'visual'],
                'response': 'Design thinking and user experience are essential. Can you describe your design process and how you ensure user needs are met?'
            }
        }

        # Check for industry-specific keywords
        message_lower = message.lower()
        for industry_key, industry_data in industry_responses.items():
            if industry.lower() in industry_key.lower():
                for keyword in industry_data['keywords']:
                    if keyword in message_lower:
                        return industry_data['response']

        # Default agent response based on custom instructions
        if custom_instructions:
            # Use custom instructions to guide response
            if 'technical' in custom_instructions.lower():
                return 'I\'m focusing on your technical expertise. Can you provide more details about your technical background and specific technologies you\'ve mastered?'
            elif 'leadership' in custom_instructions.lower():
                return 'Leadership experience is important for this role. Can you share examples of how you\'ve led teams or projects?'
            elif 'problem-solving' in custom_instructions.lower():
                return 'Problem-solving is key in our work. Can you walk me through how you approach complex challenges?'

        # Fallback to generic professional response
        return 'Thank you for sharing that. Can you elaborate on your experience and how it relates to this position?'

    except Exception as e:
        print(f"Error generating agent response: {e}")
        return 'Thank you for your response. Can you elaborate on that or tell me more about your experience?'

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
from flask import request, jsonify
from . import api_bp
from ..extensions import db
from ..models import Interview, Message
import json
from datetime import datetime


@api_bp.route('/interviews', methods=['GET'])
def get_interviews():
    """Get all interviews"""
    interviews = Interview.query.order_by(Interview.scheduled_at.desc()).all()
    return jsonify({'interviews': [interview.to_dict() for interview in interviews]}), 200


@api_bp.route('/interviews/<int:interview_id>', methods=['GET'])
def get_interview(interview_id):
    """Get a specific interview"""
    interview = Interview.query.get_or_404(interview_id)
    return jsonify(interview.to_dict()), 200


@api_bp.route('/interviews', methods=['POST'])
def create_interview():
    """Create a new interview"""
    data = request.get_json()

    required_fields = ['title', 'scheduled_at', 'user_id', 'organization_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    # Validate scheduled_at is in the future
    datetime_str = data['scheduled_at']
    if datetime_str.endswith('Z'):
        datetime_str = datetime_str[:-1] + '+00:00'

    try:
        scheduled_at = datetime.fromisoformat(datetime_str)
    except ValueError:
        return jsonify({'error': 'Invalid datetime format'}), 400

    now = datetime.utcnow().replace(tzinfo=None)
    scheduled_naive = scheduled_at.replace(tzinfo=None) if scheduled_at.tzinfo else scheduled_at

    if scheduled_naive <= now:
        return jsonify({'error': 'Interview must be scheduled in the future'}), 400

    interview = Interview(
        title=data['title'],
        description=data.get('description'),
        scheduled_at=scheduled_at,
        duration_minutes=data.get('duration_minutes', 60),
        user_id=data['user_id'],
        organization_id=data['organization_id'],
        post_id=data.get('post_id'),
        interview_type=data.get('interview_type', 'text'),
        location=data.get('location'),
        meeting_link=data.get('meeting_link'),
        interviewers=json.dumps(data.get('interviewers', []))
    )

    db.session.add(interview)
    db.session.commit()

    return jsonify({
        'message': 'Interview scheduled successfully',
        'interview': interview.to_dict()
    }), 201


@api_bp.route('/interviews/<int:interview_id>', methods=['PUT'])
def update_interview(interview_id):
    """Update an interview"""
    interview = Interview.query.get_or_404(interview_id)
    data = request.get_json()

    # Update allowed fields
    updatable_fields = [
        'title', 'description', 'scheduled_at', 'duration_minutes',
        'interview_type', 'location', 'meeting_link', 'status',
        'feedback', 'rating', 'interviewers'
    ]

    for field in updatable_fields:
        if field in data:
            if field == 'scheduled_at':
                value = datetime.fromisoformat(data[field].replace('Z', '+00:00'))
                setattr(interview, field, value)
            elif field == 'interviewers':
                setattr(interview, field, json.dumps(data[field]) if data[field] else None)
            else:
                setattr(interview, field, data[field])

    interview.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'message': 'Interview updated successfully',
        'interview': interview.to_dict()
    }), 200


@api_bp.route('/interviews/<int:interview_id>', methods=['DELETE'])
def delete_interview(interview_id):
    """Delete an interview"""
    interview = Interview.query.get_or_404(interview_id)
    db.session.delete(interview)
    db.session.commit()
    return jsonify({'message': 'Interview deleted successfully'}), 200


@api_bp.route('/interviews/upcoming', methods=['GET'])
def get_upcoming_interviews():
    """Get upcoming interviews"""
    now = datetime.utcnow()
    interviews = Interview.query.filter(
        Interview.scheduled_at >= now,
        Interview.status == 'scheduled'
    ).order_by(Interview.scheduled_at.asc()).all()
    return jsonify({'interviews': [interview.to_dict() for interview in interviews]}), 200


@api_bp.route('/interviews/history', methods=['GET'])
def get_interview_history():
    """Get completed/cancelled interviews"""
    interviews = Interview.query.filter(
        Interview.status.in_(['completed', 'cancelled', 'no_show'])
    ).order_by(Interview.scheduled_at.desc()).all()
    return jsonify({'interviews': [interview.to_dict() for interview in interviews]}), 200


# Message endpoints
@api_bp.route('/interviews/<int:interview_id>/messages', methods=['GET'])
def get_messages(interview_id):
    """Get all messages for an interview"""
    messages = Message.query.filter_by(interview_id=interview_id).order_by(Message.created_at.asc()).all()
    return jsonify([message.to_dict() for message in messages]), 200


@api_bp.route('/interviews/<int:interview_id>/messages', methods=['POST'])
def send_message(interview_id):
    """Send a message in an interview"""
    data = request.get_json()

    # user_id is optional for AI/system messages
    if 'content' not in data:
        return jsonify({'error': 'Missing required field: content'}), 400

    message = Message(
        interview_id=interview_id,
        user_id=data.get('user_id') if 'user_id' in data else None,  # Explicitly allow null for AI messages
        content=data['content'],
        message_type=data.get('message_type', 'text')
    )

    db.session.add(message)
    db.session.commit()

    return jsonify(message.to_dict()), 201


@api_bp.route('/ai/chat', methods=['POST'])
def ai_chat():
    """Mock AI chat endpoint for interviews"""
    data = request.get_json()

    if not data or 'message' not in data:
        return jsonify({'error': 'Message required'}), 400

    message = data['message']

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

    return jsonify({
        'response': response_text,
        'agent_id': data.get('agent_id', 1)
    }), 200


@api_bp.route('/ai/user', methods=['GET'])
def get_ai_user():
    """Get or create AI system user for messages"""
    from ..models import User

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
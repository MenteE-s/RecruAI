from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from . import api_bp
from ..extensions import db
from ..models import Interview, User, Organization
import json
from datetime import datetime


@api_bp.route('/interviews', methods=['GET'])
@jwt_required()
def get_interviews():
    """Get interviews based on user role"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.role == 'organization':
        # Organization users see all interviews for their organization
        interviews = Interview.query.filter_by(organization_id=user.organization_id).order_by(Interview.scheduled_at.desc()).all()
    else:
        # Individual users see their own interviews
        interviews = Interview.query.filter_by(user_id=user_id).order_by(Interview.scheduled_at.desc()).all()

    return jsonify({'interviews': [interview.to_dict() for interview in interviews]}), 200


@api_bp.route('/interviews/upcoming', methods=['GET'])
@jwt_required()
def get_upcoming_interviews():
    """Get upcoming interviews for the current user"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    now = datetime.utcnow()

    if user.role == 'organization':
        # Organization users see upcoming interviews for their organization
        interviews = Interview.query.filter(
            Interview.organization_id == user.organization_id,
            Interview.scheduled_at >= now,
            Interview.status == 'scheduled'
        ).order_by(Interview.scheduled_at.asc()).all()
    else:
        # Individual users see their upcoming interviews
        interviews = Interview.query.filter(
            Interview.user_id == user_id,
            Interview.scheduled_at >= now,
            Interview.status == 'scheduled'
        ).order_by(Interview.scheduled_at.asc()).all()

    return jsonify({'interviews': [interview.to_dict() for interview in interviews]}), 200


@api_bp.route('/interviews/history', methods=['GET'])
@jwt_required()
def get_interview_history():
    """Get completed/cancelled interviews for the current user"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.role == 'organization':
        # Organization users see interview history for their organization
        interviews = Interview.query.filter(
            Interview.organization_id == user.organization_id,
            Interview.status.in_(['completed', 'cancelled', 'no_show'])
        ).order_by(Interview.scheduled_at.desc()).all()
    else:
        # Individual users see their interview history
        interviews = Interview.query.filter(
            Interview.user_id == user_id,
            Interview.status.in_(['completed', 'cancelled', 'no_show'])
        ).order_by(Interview.scheduled_at.desc()).all()

    return jsonify({'interviews': [interview.to_dict() for interview in interviews]}), 200


@api_bp.route('/interviews', methods=['POST'])
@jwt_required()
def create_interview():
    """Create a new interview (organization users only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != 'organization':
        return jsonify({'error': 'Only organization users can schedule interviews'}), 403

    data = request.get_json()

    required_fields = ['title', 'scheduled_at', 'user_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    # Validate that the target user exists - support both ID and email
    user_input = data['user_id']
    if '@' in str(user_input):  # It's an email
        target_user = User.query.filter_by(email=user_input).first()
    else:  # It's an ID
        target_user = User.query.get(int(user_input))

    if not target_user:
        return jsonify({'error': 'Target user not found'}), 404

    # Validate scheduled_at is in the future
    # Handle datetime string from frontend (usually in ISO format)
    datetime_str = data['scheduled_at']
    if datetime_str.endswith('Z'):
        datetime_str = datetime_str[:-1] + '+00:00'

    try:
        scheduled_at = datetime.fromisoformat(datetime_str)
    except ValueError:
        # Fallback for different formats
        scheduled_at = datetime.strptime(datetime_str, '%Y-%m-%dT%H:%M')

    # Ensure both datetimes are offset-naive for comparison
    now = datetime.utcnow().replace(tzinfo=None)
    scheduled_naive = scheduled_at.replace(tzinfo=None) if scheduled_at.tzinfo else scheduled_at

    if scheduled_naive <= now:
        return jsonify({'error': 'Interview must be scheduled in the future'}), 400

    interview = Interview(
        title=data['title'],
        description=data.get('description'),
        scheduled_at=scheduled_at,
        duration_minutes=data.get('duration_minutes', 60),
        user_id=target_user.id,
        organization_id=user.organization_id,
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
@jwt_required()
def update_interview(interview_id):
    """Update an interview"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    interview = Interview.query.get(interview_id)
    if not interview:
        return jsonify({'error': 'Interview not found'}), 404

    # Check permissions: organization users can update interviews from their org,
    # individual users can only update their own interviews (limited fields)
    if user.role == 'organization':
        if interview.organization_id != user.organization_id:
            return jsonify({'error': 'Access denied'}), 403
    else:
        if interview.user_id != user_id:
            return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()

    # Individual users can only update status (e.g., mark as no-show)
    if user.role != 'organization':
        allowed_fields = ['status']
        data = {k: v for k, v in data.items() if k in allowed_fields}
        # Only allow status change to 'no_show' for individuals
        if data.get('status') not in ['no_show']:
            return jsonify({'error': 'Individuals can only mark interviews as no-show'}), 403

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
@jwt_required()
def delete_interview(interview_id):
    """Delete an interview (organization users only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != 'organization':
        return jsonify({'error': 'Only organization users can delete interviews'}), 403

    interview = Interview.query.get(interview_id)
    if not interview:
        return jsonify({'error': 'Interview not found'}), 404

    if interview.organization_id != user.organization_id:
        return jsonify({'error': 'Access denied'}), 403

    db.session.delete(interview)
    db.session.commit()

    return jsonify({'message': 'Interview deleted successfully'}), 200


@api_bp.route('/interviews/<int:interview_id>/feedback', methods=['POST'])
@jwt_required()
def add_interview_feedback(interview_id):
    """Add feedback to an interview (organization users only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != 'organization':
        return jsonify({'error': 'Only organization users can add interview feedback'}), 403

    interview = Interview.query.get(interview_id)
    if not interview:
        return jsonify({'error': 'Interview not found'}), 404

    if interview.organization_id != user.organization_id:
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()

    interview.feedback = data.get('feedback')
    interview.rating = data.get('rating')
    interview.status = 'completed'
    interview.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        'message': 'Interview feedback added successfully',
        'interview': interview.to_dict()
    }), 200


@api_bp.route('/interviews/<int:interview_id>/assign-agent', methods=['POST'])
@jwt_required()
def assign_ai_agent(interview_id):
    """Assign an AI agent to an interview (organization users only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != 'organization':
        return jsonify({'error': 'Only organization users can assign AI agents'}), 403

    interview = Interview.query.get(interview_id)
    if not interview:
        return jsonify({'error': 'Interview not found'}), 404

    if interview.organization_id != user.organization_id:
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()
    agent_id = data.get('agent_id')

    if not agent_id:
        return jsonify({'error': 'agent_id is required'}), 400

    # TODO: Validate that the agent exists and belongs to the organization
    # For now, just set the ai_agent_id field
    interview.ai_agent_id = agent_id
    interview.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        'message': 'AI agent assigned successfully',
        'interview': interview.to_dict()
    }), 200
from flask import request, jsonify
from .. import api_bp
from ...extensions import db
from ...models import Interview, Application
import json
from datetime import datetime

def update_pipeline_stage_for_interview(interview):
    """Update pipeline stage based on interview status"""
    if not interview.post_id:
        return  # No associated job post

    # Find the application for this user and post
    application = Application.query.filter_by(
        user_id=interview.user_id,
        post_id=interview.post_id
    ).first()

    if not application:
        return  # No application found

    # Update pipeline stage based on interview status
    if interview.status == 'scheduled':
        application.pipeline_stage = 'interview_scheduled'
    elif interview.status == 'completed':
        application.pipeline_stage = 'interview_completed'
    elif interview.status in ['cancelled', 'no_show']:
        # Keep current stage or set to rejected if no interview completed
        if application.pipeline_stage == 'interview_scheduled':
            application.pipeline_stage = 'applied'  # Reset to applied if interview was cancelled

    db.session.commit()

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

    # Update pipeline stage
    update_pipeline_stage_for_interview(interview)

    return jsonify({
        'message': 'Interview scheduled successfully',
        'interview': interview.to_dict()
    }), 201

@api_bp.route('/interviews/<int:interview_id>', methods=['PUT'])
def update_interview(interview_id):
    """Update an interview"""
    print(f"PUT request received for interview {interview_id}")
    interview = Interview.query.get_or_404(interview_id)
    data = request.get_json()

    print(f"Updating interview {interview_id} with data: {data}")
    print(f"Current interview status: {interview.status}")

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
                print(f"Updated field {field} to: {data[field]}")

    interview.updated_at = datetime.utcnow()

    try:
        db.session.commit()
        print("Database commit successful")
    except Exception as e:
        print(f"Database commit failed: {e}")
        db.session.rollback()
        return jsonify({'error': 'Database error'}), 500

    # Update pipeline stage based on new status
    update_pipeline_stage_for_interview(interview)

    updated_interview = interview.to_dict()
    print(f"Interview updated successfully. New status: {updated_interview.get('status')}")

    return jsonify({
        'message': 'Interview updated successfully',
        'interview': updated_interview
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

@api_bp.route('/interviews/<int:interview_id>/complete', methods=['POST'])
def complete_interview(interview_id):
    """Mark interview as completed"""
    interview = Interview.query.get_or_404(interview_id)

    # Update status to completed
    interview.status = "completed"
    # setattr(interview, 'completed_at', datetime.utcnow())
    # setattr(interview, 'round_status', "completed")

    db.session.commit()

    return jsonify({
        "message": "Interview completed successfully",
        "interview": interview.to_dict()
    }), 200

@api_bp.route('/interviews/<int:interview_id>/decision', methods=['POST'])
def update_interview_decision(interview_id):
    """Update interview decision (pass, second round, third round, fail)"""
    interview = Interview.query.get_or_404(interview_id)
    payload = request.get_json(silent=True) or {}

    decision = payload.get("decision")  # 'passed', 'failed', 'second_round', 'third_round'
    feedback = payload.get("feedback", "")
    rating = payload.get("rating")

    if decision not in ['passed', 'failed', 'second_round', 'third_round']:
        return jsonify({"error": "Invalid decision"}), 400

    # For now, just update feedback and rating since new columns don't exist
    interview.feedback = feedback
    if rating:
        interview.rating = rating

    # Update status based on decision (simplified without new columns)
    if decision == 'passed':
        interview.status = 'completed'
    elif decision == 'failed':
        interview.status = 'completed'
    elif decision in ['second_round', 'third_round']:
        interview.status = 'scheduled'  # Schedule next round

    db.session.commit()

    return jsonify({
        "message": "Interview decision updated successfully",
        "interview": interview.to_dict()
    }), 200
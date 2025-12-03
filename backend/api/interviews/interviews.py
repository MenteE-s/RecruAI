from flask import request, jsonify
from .. import api_bp
from ...extensions import db
from ...models import Interview, Application, ConversationMemory, Message, InterviewAnalysis
import json
from datetime import datetime, timezone, timedelta

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
    """Get all interviews, optionally filtered by user_id"""
    user_id = request.args.get('user_id', type=int)
    query = Interview.query
    if user_id:
        query = query.filter_by(user_id=user_id)
    interviews = query.order_by(Interview.scheduled_at.desc()).all()
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

    # Handle datetime input (accepts ISO 8601 with timezone offset or 'Z')
    try:
        if datetime_str.endswith('Z'):
            # Replace trailing Z with +00:00 so fromisoformat can parse it
            datetime_str = datetime_str[:-1] + '+00:00'
        scheduled_at = datetime.fromisoformat(datetime_str)
    except ValueError:
        return jsonify({'error': 'Invalid datetime format. Use ISO 8601 with timezone (e.g., 2024-01-15T14:30Z)'}), 400

    # Ensure timezone-aware and normalize to UTC
    if scheduled_at.tzinfo is None:
        # Treat naive datetimes as UTC; otherwise prefer explicit timezone from client
        scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)
    else:
        scheduled_at = scheduled_at.astimezone(timezone.utc)

    # Convert to naive UTC before storing (DB stores naive datetimes)
    scheduled_at = scheduled_at.replace(tzinfo=None)

    # Validate scheduled_at is in the future
    if scheduled_at <= datetime.utcnow():
        return jsonify({'error': 'scheduled_at must be in the future.'}), 400

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
                try:
                    value_str = data[field]
                    if value_str.endswith('Z'):
                        value_str = value_str[:-1] + '+00:00'
                    value = datetime.fromisoformat(value_str)
                except Exception:
                    return jsonify({'error': 'Invalid datetime format for scheduled_at. Use ISO 8601 with timezone.'}), 400

                if value.tzinfo is None:
                    value = value.replace(tzinfo=timezone.utc)
                else:
                    value = value.astimezone(timezone.utc)

                value = value.replace(tzinfo=None)

                # Validate scheduled_at is in the future
                if value <= datetime.utcnow():
                    return jsonify({'error': 'scheduled_at must be in the future.'}), 400

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

    # Delete related records first to avoid cascade issues
    ConversationMemory.query.filter_by(interview_id=interview_id).delete()
    Message.query.filter_by(interview_id=interview_id).delete()
    InterviewAnalysis.query.filter_by(interview_id=interview_id).delete()

    db.session.delete(interview)
    db.session.commit()
    return jsonify({'message': 'Interview deleted successfully'}), 200

@api_bp.route('/interviews/upcoming', methods=['GET'])
def get_upcoming_interviews():
    """Get upcoming and currently-active interviews.

    Includes interviews that:
    - Are scheduled for the future, OR
    - Started within the last 2 hours (to account for ongoing interviews)
    AND have status 'scheduled' or 'in_progress'.
    """
    now = datetime.utcnow()
    # Include interviews that started up to 2 hours ago (ongoing buffer)
    buffer_start = now - timedelta(hours=2)
    interviews = Interview.query.filter(
        Interview.scheduled_at >= buffer_start,
        Interview.status.in_(['scheduled', 'in_progress'])
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
    from ...utils.interview_utils import update_interview_decision as update_decision_util

    interview = Interview.query.get_or_404(interview_id)
    payload = request.get_json(silent=True) or {}

    decision = payload.get("decision")  # 'passed', 'failed', 'second_round', 'third_round'
    feedback = payload.get("feedback", "")
    rating = payload.get("rating")

    if decision not in ['passed', 'failed', 'second_round', 'third_round']:
        return jsonify({"error": "Invalid decision"}), 400

    # Use the utility function to update decision
    success, message = update_decision_util(
        interview_id=interview_id,
        decision=decision,
        feedback=feedback,
        rating=rating
    )

    if not success:
        return jsonify({"error": message}), 400

    # Refresh interview data
    interview = Interview.query.get_or_404(interview_id)

    return jsonify({
        "message": message,
        "interview": interview.to_dict()
    }), 200

@api_bp.route('/organizations/<int:org_id>/interviews', methods=['GET'])
def get_organization_interviews(org_id):
    """Get all interviews for an organization"""
    status_filter = request.args.get('status')
    decision_filter = request.args.get('decision')

    query = Interview.query.filter_by(organization_id=org_id)

    if status_filter:
        query = query.filter_by(status=status_filter)

    if decision_filter:
        query = query.filter_by(final_decision=decision_filter)

    interviews = query.order_by(Interview.scheduled_at.desc()).all()
    return jsonify({'interviews': [interview.to_dict() for interview in interviews]}), 200

@api_bp.route('/organizations/<int:org_id>/interviews/<int:interview_id>/decision', methods=['POST'])
def update_organization_interview_decision(org_id, interview_id):
    """Organization endpoint to update interview decision"""
    from ...utils.interview_utils import update_interview_decision as update_decision_util

    interview = Interview.query.filter_by(id=interview_id, organization_id=org_id).first_or_404()
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"error": "Invalid JSON payload"}), 400

    decision = payload.get("decision")  # 'passed', 'failed', 'second_round', 'third_round'
    feedback = payload.get("feedback")
    rating = payload.get("rating")

    if not decision:
        return jsonify({"error": "Decision is required"}), 400

    if decision not in ['passed', 'failed', 'second_round', 'third_round']:
        return jsonify({"error": "Invalid decision"}), 400

    # Use the utility function to update decision
    success, message = update_decision_util(
        interview_id=interview_id,
        decision=decision,
        feedback=feedback,
        rating=rating
    )

    if not success:
        return jsonify({"error": message}), 400

    # Refresh interview data
    interview = Interview.query.get_or_404(interview_id)

    return jsonify({
        "message": message,
        "interview": interview.to_dict()
    }), 200

@api_bp.route('/organizations/<int:org_id>/interviews/status-summary', methods=['GET'])
def get_organization_interview_status_summary(org_id):
    """Get interview status summary for an organization"""
    from ...utils.interview_utils import get_interview_status_summary

    summary = get_interview_status_summary(organization_id=org_id)

    if summary is None:
        return jsonify({"error": "Failed to get status summary"}), 500

    return jsonify(summary), 200
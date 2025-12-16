from flask import request, jsonify
from .. import api_bp
from ...extensions import db
from ...models import Interview, Application, ConversationMemory, Message, InterviewAnalysis, ConversationMessage
import json
from datetime import datetime, timezone, timedelta
from ...utils.security import log_security_event, sanitize_input, validate_request_size
from ...utils.pagination import Pagination, get_pagination_params, paginated_response, apply_filters_and_sorting, get_request_filters, get_sorting_params
from ...utils.security import log_security_event, sanitize_input, validate_request_size
from ...utils.subscription import require_interview_access
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models import User
from ...api.notifications.routes import create_interview_notification

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
    """Get interviews with pagination, filtering, and sorting support"""
    # Get pagination parameters
    page, per_page = get_pagination_params()

    # Get filters from request
    filters = get_request_filters(Interview)

    # Get sorting parameters
    sort_by, sort_order = get_sorting_params(default_sort='scheduled_at')

    # Build base query
    query = Interview.query

    # Apply filters and sorting
    query = apply_filters_and_sorting(query, Interview, filters, sort_by, sort_order)

    # Apply pagination
    pagination_result = Pagination(query, page=page, per_page=per_page).paginate()

    # Return paginated response
    return jsonify(paginated_response(pagination_result['items'], pagination_result['pagination'])), 200

@api_bp.route('/interviews/<int:interview_id>', methods=['GET'])
def get_interview(interview_id):
    """Get a specific interview"""
    interview = Interview.query.get_or_404(interview_id)
    return jsonify(interview.to_dict()), 200

@api_bp.route('/interviews', methods=['POST'])
@jwt_required()
@require_interview_access()
def create_interview():
    """Create a new interview"""
    # Get authenticated user
    user_id = get_jwt_identity()
    user_id = int(user_id)  # Convert to int for database comparison
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    try:
        data = request.get_json()
    except Exception:
        log_security_event("invalid_json_request", request.remote_addr, user_id)
        return jsonify({'error': 'Invalid JSON in request body'}), 400

    # Validate request size
    is_valid, error_msg = validate_request_size(data)
    if not is_valid:
        log_security_event("request_size_exceeded", request.remote_addr, user_id, details={"error": error_msg})
        return jsonify({'error': error_msg}), 400

    required_fields = ['title', 'scheduled_at', 'user_id', 'organization_id']
    for field in required_fields:
        if field not in data:
            log_security_event("missing_required_field", request.remote_addr, user_id, details={"field": field})
            return jsonify({'error': f'Missing required field: {field}'}), 400

    # Sanitize input fields
    title = sanitize_input(data.get('title', ''))
    description = sanitize_input(data.get('description', ''))
    location = sanitize_input(data.get('location', ''))
    meeting_link = sanitize_input(data.get('meeting_link', ''))

    # Validate scheduled_at is in the future
    datetime_str = data['scheduled_at']

    # Handle datetime input (accepts ISO 8601 with timezone offset or 'Z')
    try:
        if datetime_str.endswith('Z'):
            # Replace trailing Z with +00:00 so fromisoformat can parse it
            datetime_str = datetime_str[:-1] + '+00:00'
        scheduled_at = datetime.fromisoformat(datetime_str)
    except ValueError:
        log_security_event("invalid_datetime_format", request.remote_addr, user_id, details={"datetime_str": datetime_str})
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
        log_security_event("interview_scheduled_past", request.remote_addr, user_id, details={"scheduled_at": scheduled_at.isoformat()})
        return jsonify({'error': 'scheduled_at must be in the future.'}), 400

    interview = Interview(
        title=title,
        description=description,
        scheduled_at=scheduled_at,
        duration_minutes=data.get('duration_minutes', 60),
        user_id=data['user_id'],
        organization_id=data['organization_id'],
        post_id=data.get('post_id'),
        interview_type=data.get('interview_type', 'text'),
        location=location,
        meeting_link=meeting_link,
        interviewers=json.dumps(data.get('interviewers', []))
    )

    db.session.add(interview)
    db.session.commit()

    # Track interview usage for organizations
    if user.organization:
        from ...utils.subscription import SubscriptionManager
        SubscriptionManager.track_interview_usage(user.organization)

    # Update pipeline stage
    update_pipeline_stage_for_interview(interview)

    # Create notification for the interviewee
    try:
        create_interview_notification(
            interview.id,
            "interview_scheduled",
            interview.user_id,
            f"Interview Scheduled: {interview.title}",
            f"Your interview '{interview.title}' has been scheduled for {interview.scheduled_at.strftime('%B %d, %Y at %I:%M %p')}."
        )
    except Exception as e:
        print(f"Failed to create interview notification: {e}")

    log_security_event("interview_created", request.remote_addr, user_id,
                      details={"interview_id": interview.id, "title": title, "scheduled_at": scheduled_at.isoformat()})

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

    # Track status change for notifications
    old_status = interview.status

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

                # Note: For updates, we allow past dates to enable rescheduling
                # The future date validation only applies to new interview creation

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

    # Create notifications based on status changes
    if 'status' in data and data['status'] != old_status:
        new_status = data['status']
        try:
            if new_status == 'cancelled':
                create_interview_notification(
                    interview.id,
                    "interview_cancelled",
                    interview.user_id,
                    f"Interview Cancelled: {interview.title}",
                    f"Your interview '{interview.title}' scheduled for {interview.scheduled_at.strftime('%B %d, %Y at %I:%M %p')} has been cancelled."
                )
            elif new_status == 'completed':
                # Check if there's a decision/rating to determine if passed
                if hasattr(interview, 'rating') and interview.rating and interview.rating >= 3:  # Assuming 3+ is pass
                    create_interview_notification(
                        interview.id,
                        "interview_passed",
                        interview.user_id,
                        f"Interview Passed: {interview.title}",
                        f"Congratulations! You have passed your interview for '{interview.title}'."
                    )
        except Exception as e:
            print(f"Failed to create status change notification: {e}")

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
@jwt_required()
def get_interview_history():
    """Get interviews with decision history (completed, cancelled, or advanced to next round).

    Scoped to the authenticated user.
    """
    uid = get_jwt_identity()
    try:
        user_id = int(uid)
    except (ValueError, TypeError):
        return jsonify({"error": "invalid user identity"}), 400

    # Get interviews that have decision history (have been evaluated)
    interviews_with_decisions = (
        Interview.query.filter(Interview.user_id == user_id)
        .join(Interview.decision_history)
        .distinct()
        .all()
    )

    # Also include traditionally completed interviews (for backward compatibility)
    completed_interviews = Interview.query.filter(
        Interview.user_id == user_id,
        Interview.status.in_(['completed', 'cancelled', 'no_show'])
    ).all()

    # Combine and deduplicate (stable by id)
    unique = {}
    for interview in interviews_with_decisions + completed_interviews:
        unique[interview.id] = interview
    all_interviews = list(unique.values())

    # Sort by most recent scheduled date
    all_interviews.sort(key=lambda x: x.scheduled_at or datetime.min, reverse=True)

    return jsonify({'interviews': [interview.to_dict() for interview in all_interviews]}), 200

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
    
    # If candidate passed the final interview, update the application status
    if decision == 'passed' and interview.post_id:
        from ...models import Application
        # Find the application for this user and post
        application = Application.query.filter_by(
            user_id=interview.user_id,
            post_id=interview.post_id
        ).first()
        
        if application:
            application.pipeline_stage = 'hired'
            application.status = 'accepted'
            db.session.commit()

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

@api_bp.route('/interviews/<int:interview_id>/conversation', methods=['GET'])
@jwt_required()
def get_interview_conversation(interview_id):
    """Get conversation history for an interview"""
    from ...models import ConversationMessage

    # Get authenticated user
    user_id = get_jwt_identity()
    user_id = int(user_id)  # Convert to int for database comparison
    print(f"JWT identity: {user_id}, type: {type(user_id)}")
    user = User.query.get(user_id)
    if not user:
        print(f"User not found for id: {user_id}")
        return jsonify({'error': 'User not found'}), 404

    interview = Interview.query.get(interview_id)
    if not interview:
        print(f"Interview not found for id: {interview_id}")
        return jsonify({'error': 'Interview not found'}), 404

    # Debug logging
    print(f"Conversation access check: user_id={user_id}, interview.user_id={interview.user_id}, interview.organization_id={interview.organization_id}, interview_type={interview.interview_type}")
    print(f"User organization: {user.organization.id if user.organization else None}")

    # Debug logging
    print(f"Conversation access check: user_id={user_id}, interview.user_id={interview.user_id}, interview.organization_id={interview.organization_id}")
    print(f"User organization: {user.organization.id if user.organization else None}")

    # Check if user has access to this interview
    # For practice interviews (organization_id is None), only the candidate can access
    # For regular interviews, candidate or organization members can access
    has_access = False
    print(f"Checking access: interview.user_id={interview.user_id}, user_id={user_id}")
    if interview.user_id == user_id:
        # User is the candidate
        print("User is the candidate - granting access")
        has_access = True
    elif interview.organization_id is not None and user.organization and user.organization.id == interview.organization_id:
        # User is a member of the organization that owns the interview
        print("User is organization member - granting access")
        has_access = True
    else:
        print("No access conditions met")
    
    if not has_access:
        print(f"Access denied for user {user_id} to interview {interview_id}")
        return jsonify({'error': 'Access denied'}), 403

    # Get conversation messages
    messages = ConversationMessage.get_recent_conversation(interview_id, limit=50)
    messages.reverse()  # Most recent last

    conversation = []
    for msg in messages:
        conversation.append({
            'id': msg.id,
            'sender_type': msg.sender_type,
            'sender_user_id': msg.sender_user_id,
            'sender_agent_id': msg.sender_agent_id,
            'content': msg.content,
            'created_at': msg.created_at.isoformat() if msg.created_at else None,
            # Include sender names for display
            'sender_name': (
                msg.sender_user.name if msg.sender_type == 'user' and msg.sender_user else
                msg.sender_agent.name if msg.sender_type == 'agent' and msg.sender_agent else
                'Unknown'
            )
        })

    return jsonify({
        'interview_id': interview_id,
        'conversation': conversation
    }), 200

@api_bp.route('/organizations/<int:org_id>/interviews/status-summary', methods=['GET'])
def get_organization_interview_status_summary(org_id):
    """Get interview status summary for an organization"""
    from ...utils.interview_utils import get_interview_status_summary

    summary = get_interview_status_summary(organization_id=org_id)

    if summary is None:
        return jsonify({"error": "Failed to get status summary"}), 500

    return jsonify(summary), 200
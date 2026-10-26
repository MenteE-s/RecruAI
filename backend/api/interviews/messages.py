from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import Message, Interview, User
from ...utils.kafka_service import KafkaService
from ...utils.org_permissions import INTERVIEWS_MANAGE, INTERVIEWS_VIEW, has_org_permission


def _can_access_interview(interview_id, permission=INTERVIEWS_VIEW):
    """Participant, or org staff with the requested interview permission."""
    try:
        uid = int(get_jwt_identity())
    except (TypeError, ValueError):
        return False, None
    user = db.session.get(User, uid)
    interview = db.session.get(Interview, interview_id)
    if not user or not interview:
        return False, user
    if interview.user_id == user.id:
        return True, user
    if interview.organization_id is None:
        return False, user
    return has_org_permission(user, interview.organization_id, permission), user

@api_bp.route('/interviews/<int:interview_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(interview_id):
    """Get all messages for an interview (participant/org only)."""
    allowed, _ = _can_access_interview(interview_id)
    if not allowed:
        return jsonify({"error": "Forbidden"}), 403
    messages = Message.query.filter_by(interview_id=interview_id).order_by(Message.created_at.asc()).all()
    return jsonify([message.to_dict() for message in messages]), 200

@api_bp.route('/interviews/<int:interview_id>/messages', methods=['POST'])
@jwt_required()
def send_message(interview_id):
    """Send a message in an interview (participant/org only)."""
    allowed, user = _can_access_interview(interview_id, INTERVIEWS_MANAGE)
    if not allowed:
        return jsonify({"error": "Forbidden"}), 403
    data = request.get_json()

    # user_id is optional for AI/system messages
    if 'content' not in data:
        return jsonify({'error': 'Missing required field: content'}), 400

    sender_id = data.get('user_id') if 'user_id' in data else None
    if sender_id is not None and int(sender_id) != user.id:
        # Callers may only post as themselves (AI posts carry no user_id).
        return jsonify({"error": "Forbidden"}), 403

    message = Message(
        interview_id=interview_id,
        user_id=sender_id,  # Explicitly allow null for AI messages
        content=data['content'],
        message_type=data.get('message_type', 'text')
    )

    db.session.add(message)
    db.session.commit()

    # Emit Kafka event for message sent
    try:
        kafka = KafkaService()
        kafka.emit_event('interview_message_sent', {
            'message_id': message.id,
            'interview_id': interview_id,
            'user_id': message.user_id,
            'message_type': message.message_type
        })
    except Exception as ke:
        print(f"Failed to emit Kafka message for interview message: {ke}")

    return jsonify(message.to_dict()), 201
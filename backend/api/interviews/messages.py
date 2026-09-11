from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import Message, Interview, User, TeamMember
from ...utils.kafka_service import KafkaService


def _can_access_interview(interview_id):
    """Participant or managing-org member may read/post messages."""
    try:
        uid = int(get_jwt_identity())
    except (TypeError, ValueError):
        return False, None
    user = User.query.get(uid)
    interview = Interview.query.get(interview_id)
    if not user or not interview:
        return False, user
    if interview.user_id == user.id:
        return True, user
    org_ids = set()
    if user.organization_id:
        org_ids.add(user.organization_id)
    for tm in TeamMember.query.filter_by(user_id=user.id).all():
        org_ids.add(tm.organization_id)
    return interview.organization_id in org_ids, user

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
    allowed, user = _can_access_interview(interview_id)
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
from flask import request, jsonify
from .. import api_bp
from ...extensions import db
from ...models import Message
from ...utils.kafka_service import KafkaService

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
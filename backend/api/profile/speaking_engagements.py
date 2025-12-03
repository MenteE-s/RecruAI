from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import SpeakingEngagement
from datetime import datetime

# Speaking Engagement endpoints
@api_bp.route('/profile/speaking-engagements', methods=['GET'])
@jwt_required()
def get_speaking_engagements():
    """Get all speaking engagements for the current user"""
    user_id = int(get_jwt_identity())
    speaking_engagements = SpeakingEngagement.query.filter_by(user_id=user_id).order_by(SpeakingEngagement.date.desc()).all()
    return jsonify({'speakingEngagements': [se.to_dict() for se in speaking_engagements]}), 200

@api_bp.route('/profile/speaking-engagements', methods=['POST'])
@jwt_required()
def create_speaking_engagement():
    """Create a new speaking engagement"""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or 'title' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle date
    date = None
    if data.get('date') and data.get('date') != '':
        try:
            date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    speaking_engagement = SpeakingEngagement(
        user_id=user_id,
        title=data['title'],
        event_name=data.get('event_name'),
        event_type=data.get('event_type'),
        location=data.get('location'),
        date=date,
        audience_size=data.get('audience_size'),
        description=data.get('description')
    )

    db.session.add(speaking_engagement)
    db.session.commit()

    return jsonify({'message': 'Speaking engagement created successfully', 'speakingEngagement': speaking_engagement.to_dict()}), 201

@api_bp.route('/profile/speaking-engagements/<int:se_id>', methods=['PUT'])
@jwt_required()
def update_speaking_engagement(se_id):
    """Update a speaking engagement"""
    user_id = int(get_jwt_identity())
    speaking_engagement = SpeakingEngagement.query.filter_by(id=se_id, user_id=user_id).first()

    if not speaking_engagement:
        return jsonify({'error': 'Speaking engagement not found'}), 404

    data = request.get_json()

    # Handle date update
    if 'date' in data:
        if data['date'] and data['date'] != '':
            try:
                speaking_engagement.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        else:
            speaking_engagement.date = None

    # Update other fields
    for key, value in data.items():
        if key != 'date' and hasattr(speaking_engagement, key):
            setattr(speaking_engagement, key, value)

    db.session.commit()
    return jsonify({'message': 'Speaking engagement updated successfully', 'speakingEngagement': speaking_engagement.to_dict()}), 200

@api_bp.route('/profile/speaking-engagements/<int:se_id>', methods=['DELETE'])
@jwt_required()
def delete_speaking_engagement(se_id):
    """Delete a speaking engagement"""
    user_id = int(get_jwt_identity())
    speaking_engagement = SpeakingEngagement.query.filter_by(id=se_id, user_id=user_id).first()

    if not speaking_engagement:
        return jsonify({'error': 'Speaking engagement not found'}), 404

    db.session.delete(speaking_engagement)
    db.session.commit()
    return jsonify({'message': 'Speaking engagement deleted successfully'}), 200

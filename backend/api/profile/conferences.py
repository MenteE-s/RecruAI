from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import Conference
from datetime import datetime

# Conference endpoints
@api_bp.route('/profile/conferences', methods=['GET'])
@jwt_required()
def get_conferences():
    """Get all conferences for the current user"""
    user_id = int(get_jwt_identity())
    conferences = Conference.query.filter_by(user_id=user_id).order_by(Conference.date.desc()).all()
    return jsonify({'conferences': [conf.to_dict() for conf in conferences]}), 200

@api_bp.route('/profile/conferences', methods=['POST'])
@jwt_required()
def create_conference():
    """Create a new conference"""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or 'name' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle date
    date = None
    if data.get('date') and data.get('date') != '':
        try:
            date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    conference = Conference(
        user_id=user_id,
        name=data['name'],
        role=data.get('role'),
        location=data.get('location'),
        date=date,
        description=data.get('description')
    )

    db.session.add(conference)
    db.session.commit()

    return jsonify({'message': 'Conference created successfully', 'conference': conference.to_dict()}), 201

@api_bp.route('/profile/conferences/<int:conf_id>', methods=['PUT'])
@jwt_required()
def update_conference(conf_id):
    """Update a conference"""
    user_id = int(get_jwt_identity())
    conference = Conference.query.filter_by(id=conf_id, user_id=user_id).first()

    if not conference:
        return jsonify({'error': 'Conference not found'}), 404

    data = request.get_json()

    # Handle date update
    if 'date' in data:
        if data['date'] and data['date'] != '':
            try:
                conference.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        else:
            conference.date = None

    # Update other fields
    for key, value in data.items():
        if key != 'date' and hasattr(conference, key):
            setattr(conference, key, value)

    db.session.commit()
    return jsonify({'message': 'Conference updated successfully', 'conference': conference.to_dict()}), 200

@api_bp.route('/profile/conferences/<int:conf_id>', methods=['DELETE'])
@jwt_required()
def delete_conference(conf_id):
    """Delete a conference"""
    user_id = int(get_jwt_identity())
    conference = Conference.query.filter_by(id=conf_id, user_id=user_id).first()

    if not conference:
        return jsonify({'error': 'Conference not found'}), 404

    db.session.delete(conference)
    db.session.commit()
    return jsonify({'message': 'Conference deleted successfully'}), 200

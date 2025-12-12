from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import VolunteerExperience
from datetime import datetime
from sqlalchemy import desc

# Volunteer Experience endpoints
@api_bp.route('/profile/volunteer-experiences', methods=['GET'])
@jwt_required()
def get_volunteer_experiences():
    """Get all volunteer experiences for the current user"""
    user_id = int(get_jwt_identity())
    volunteer_experiences = VolunteerExperience.query.filter_by(user_id=user_id).order_by(desc(VolunteerExperience.end_date).nulls_last()).all()
    return jsonify({'volunteer_experiences': [ve.to_dict() for ve in volunteer_experiences]}), 200

@api_bp.route('/profile/volunteer-experiences', methods=['POST'])
@jwt_required()
def create_volunteer_experience():
    """Create a new volunteer experience"""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or 'title' not in data or 'organization' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle dates
    start_date = None
    end_date = None

    if data.get('start_date') and data.get('start_date') != '':
        try:
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid start_date format. Use YYYY-MM-DD'}), 400

    if data.get('end_date') and data.get('end_date') != '':
        try:
            end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid end_date format. Use YYYY-MM-DD'}), 400

    volunteer_experience = VolunteerExperience(
        user_id=user_id,
        title=data['title'],
        organization=data['organization'],
        location=data.get('location'),
        start_date=start_date,
        end_date=end_date,
        description=data.get('description')
    )

    db.session.add(volunteer_experience)
    db.session.commit()

    return jsonify({'message': 'Volunteer experience created successfully', 'volunteerExperience': volunteer_experience.to_dict()}), 201

@api_bp.route('/profile/volunteer-experiences/<int:ve_id>', methods=['PUT'])
@jwt_required()
def update_volunteer_experience(ve_id):
    """Update a volunteer experience"""
    user_id = int(get_jwt_identity())
    volunteer_experience = VolunteerExperience.query.filter_by(id=ve_id, user_id=user_id).first()

    if not volunteer_experience:
        return jsonify({'error': 'Volunteer experience not found'}), 404

    data = request.get_json()

    # Handle date updates
    if 'start_date' in data:
        if data['start_date'] and data['start_date'] != '':
            try:
                volunteer_experience.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid start_date format. Use YYYY-MM-DD'}), 400
        else:
            volunteer_experience.start_date = None

    if 'end_date' in data:
        if data['end_date'] and data['end_date'] != '':
            try:
                volunteer_experience.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid end_date format. Use YYYY-MM-DD'}), 400
        else:
            volunteer_experience.end_date = None

    # Update other fields
    for key, value in data.items():
        if key not in ['start_date', 'end_date'] and hasattr(volunteer_experience, key):
            setattr(volunteer_experience, key, value)

    db.session.commit()
    return jsonify({'message': 'Volunteer experience updated successfully', 'volunteerExperience': volunteer_experience.to_dict()}), 200

@api_bp.route('/profile/volunteer-experiences/<int:ve_id>', methods=['DELETE'])
@jwt_required()
def delete_volunteer_experience(ve_id):
    """Delete a volunteer experience"""
    user_id = int(get_jwt_identity())
    volunteer_experience = VolunteerExperience.query.filter_by(id=ve_id, user_id=user_id).first()

    if not volunteer_experience:
        return jsonify({'error': 'Volunteer experience not found'}), 404

    db.session.delete(volunteer_experience)
    db.session.commit()
    return jsonify({'message': 'Volunteer experience deleted successfully'}), 200

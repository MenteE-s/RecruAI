from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import ProfessionalMembership
from datetime import datetime

# Professional Membership endpoints
@api_bp.route('/profile/professional-memberships', methods=['GET'])
@jwt_required()
def get_professional_memberships():
    """Get all professional memberships for the current user"""
    user_id = int(get_jwt_identity())
    professional_memberships = ProfessionalMembership.query.filter_by(user_id=user_id).order_by(ProfessionalMembership.start_date.desc()).all()
    return jsonify({'professionalMemberships': [pm.to_dict() for pm in professional_memberships]}), 200

@api_bp.route('/profile/professional-memberships', methods=['POST'])
@jwt_required()
def create_professional_membership():
    """Create a new professional membership"""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or 'organization' not in data:
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

    professional_membership = ProfessionalMembership(
        user_id=user_id,
        organization=data['organization'],
        membership_id=data.get('membership_id'),
        start_date=start_date,
        end_date=end_date,
        description=data.get('description')
    )

    db.session.add(professional_membership)
    db.session.commit()

    return jsonify({'message': 'Professional membership created successfully', 'professionalMembership': professional_membership.to_dict()}), 201

@api_bp.route('/profile/professional-memberships/<int:pm_id>', methods=['PUT'])
@jwt_required()
def update_professional_membership(pm_id):
    """Update a professional membership"""
    user_id = int(get_jwt_identity())
    professional_membership = ProfessionalMembership.query.filter_by(id=pm_id, user_id=user_id).first()

    if not professional_membership:
        return jsonify({'error': 'Professional membership not found'}), 404

    data = request.get_json()

    # Handle date updates
    if 'start_date' in data:
        if data['start_date'] and data['start_date'] != '':
            try:
                professional_membership.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid start_date format. Use YYYY-MM-DD'}), 400
        else:
            professional_membership.start_date = None

    if 'end_date' in data:
        if data['end_date'] and data['end_date'] != '':
            try:
                professional_membership.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid end_date format. Use YYYY-MM-DD'}), 400
        else:
            professional_membership.end_date = None

    # Update other fields
    for key, value in data.items():
        if key not in ['start_date', 'end_date'] and hasattr(professional_membership, key):
            setattr(professional_membership, key, value)

    db.session.commit()
    return jsonify({'message': 'Professional membership updated successfully', 'professionalMembership': professional_membership.to_dict()}), 200

@api_bp.route('/profile/professional-memberships/<int:pm_id>', methods=['DELETE'])
@jwt_required()
def delete_professional_membership(pm_id):
    """Delete a professional membership"""
    user_id = int(get_jwt_identity())
    professional_membership = ProfessionalMembership.query.filter_by(id=pm_id, user_id=user_id).first()

    if not professional_membership:
        return jsonify({'error': 'Professional membership not found'}), 404

    db.session.delete(professional_membership)
    db.session.commit()
    return jsonify({'message': 'Professional membership deleted successfully'}), 200

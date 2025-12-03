from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import Award
from datetime import datetime

# Award endpoints
@api_bp.route('/profile/awards', methods=['GET'])
@jwt_required()
def get_awards():
    """Get all awards for the current user"""
    user_id = get_jwt_identity()
    awards = Award.query.filter_by(user_id=user_id).order_by(Award.date.desc()).all()
    return jsonify({'awards': [award.to_dict() for award in awards]}), 200

@api_bp.route('/profile/awards', methods=['POST'])
@jwt_required()
def create_award():
    """Create a new award"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'title' not in data or 'issuer' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle date
    date = None
    if data.get('date') and data.get('date') != '':
        try:
            date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    award = Award(
        user_id=user_id,
        title=data['title'],
        issuer=data['issuer'],
        date=date,
        description=data.get('description')
    )

    db.session.add(award)
    db.session.commit()

    return jsonify({'message': 'Award created successfully', 'award': award.to_dict()}), 201

@api_bp.route('/profile/awards/<int:award_id>', methods=['PUT'])
@jwt_required()
def update_award(award_id):
    """Update an award"""
    user_id = get_jwt_identity()
    award = Award.query.filter_by(id=award_id, user_id=user_id).first()

    if not award:
        return jsonify({'error': 'Award not found'}), 404

    data = request.get_json()

    # Handle date update
    if 'date' in data:
        if data['date'] and data['date'] != '':
            try:
                award.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        else:
            award.date = None

    # Update other fields
    for key, value in data.items():
        if key != 'date' and hasattr(award, key):
            setattr(award, key, value)

    db.session.commit()
    return jsonify({'message': 'Award updated successfully', 'award': award.to_dict()}), 200

@api_bp.route('/profile/awards/<int:award_id>', methods=['DELETE'])
@jwt_required()
def delete_award(award_id):
    """Delete an award"""
    user_id = get_jwt_identity()
    award = Award.query.filter_by(id=award_id, user_id=user_id).first()

    if not award:
        return jsonify({'error': 'Award not found'}), 404

    db.session.delete(award)
    db.session.commit()
    return jsonify({'message': 'Award deleted successfully'}), 200
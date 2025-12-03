from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import HobbyInterest

# Hobby Interest endpoints
@api_bp.route('/profile/hobby-interests', methods=['GET'])
@jwt_required()
def get_hobby_interests():
    """Get all hobby interests for the current user"""
    user_id = int(get_jwt_identity())
    hobby_interests = HobbyInterest.query.filter_by(user_id=user_id).all()
    return jsonify({'hobbyInterests': [hi.to_dict() for hi in hobby_interests]}), 200

@api_bp.route('/profile/hobby-interests', methods=['POST'])
@jwt_required()
def create_hobby_interest():
    """Create a new hobby interest"""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or 'name' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    hobby_interest = HobbyInterest(
        user_id=user_id,
        name=data['name'],
        description=data.get('description')
    )

    db.session.add(hobby_interest)
    db.session.commit()

    return jsonify({'message': 'Hobby interest created successfully', 'hobbyInterest': hobby_interest.to_dict()}), 201

@api_bp.route('/profile/hobby-interests/<int:hi_id>', methods=['PUT'])
@jwt_required()
def update_hobby_interest(hi_id):
    """Update a hobby interest"""
    user_id = int(get_jwt_identity())
    hobby_interest = HobbyInterest.query.filter_by(id=hi_id, user_id=user_id).first()

    if not hobby_interest:
        return jsonify({'error': 'Hobby interest not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(hobby_interest, key):
            setattr(hobby_interest, key, value)

    db.session.commit()
    return jsonify({'message': 'Hobby interest updated successfully', 'hobbyInterest': hobby_interest.to_dict()}), 200

@api_bp.route('/profile/hobby-interests/<int:hi_id>', methods=['DELETE'])
@jwt_required()
def delete_hobby_interest(hi_id):
    """Delete a hobby interest"""
    user_id = int(get_jwt_identity())
    hobby_interest = HobbyInterest.query.filter_by(id=hi_id, user_id=user_id).first()

    if not hobby_interest:
        return jsonify({'error': 'Hobby interest not found'}), 404

    db.session.delete(hobby_interest)
    db.session.commit()
    return jsonify({'message': 'Hobby interest deleted successfully'}), 200

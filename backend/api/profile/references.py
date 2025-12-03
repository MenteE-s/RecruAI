from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import Reference

# Reference endpoints
@api_bp.route('/profile/references', methods=['GET'])
@jwt_required()
def get_references():
    """Get all references for the current user"""
    user_id = get_jwt_identity()
    references = Reference.query.filter_by(user_id=user_id).all()
    return jsonify({'references': [ref.to_dict() for ref in references]}), 200

@api_bp.route('/profile/references', methods=['POST'])
@jwt_required()
def create_reference():
    """Create a new reference"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'name' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    reference = Reference(
        user_id=user_id,
        name=data['name'],
        title=data.get('title'),
        company=data.get('company'),
        email=data.get('email'),
        phone=data.get('phone'),
        relationship=data.get('relationship')
    )

    db.session.add(reference)
    db.session.commit()

    return jsonify({'message': 'Reference created successfully', 'reference': reference.to_dict()}), 201

@api_bp.route('/profile/references/<int:ref_id>', methods=['PUT'])
@jwt_required()
def update_reference(ref_id):
    """Update a reference"""
    user_id = get_jwt_identity()
    reference = Reference.query.filter_by(id=ref_id, user_id=user_id).first()

    if not reference:
        return jsonify({'error': 'Reference not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(reference, key):
            setattr(reference, key, value)

    db.session.commit()
    return jsonify({'message': 'Reference updated successfully', 'reference': reference.to_dict()}), 200

@api_bp.route('/profile/references/<int:ref_id>', methods=['DELETE'])
@jwt_required()
def delete_reference(ref_id):
    """Delete a reference"""
    user_id = get_jwt_identity()
    reference = Reference.query.filter_by(id=ref_id, user_id=user_id).first()

    if not reference:
        return jsonify({'error': 'Reference not found'}), 404

    db.session.delete(reference)
    db.session.commit()
    return jsonify({'message': 'Reference deleted successfully'}), 200
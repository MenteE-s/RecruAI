from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import KeyAchievement
from datetime import datetime

# Key Achievement endpoints
@api_bp.route('/profile/key-achievements', methods=['GET'])
@jwt_required()
def get_key_achievements():
    """Get all key achievements for the current user"""
    user_id = get_jwt_identity()
    key_achievements = KeyAchievement.query.filter_by(user_id=user_id).order_by(KeyAchievement.date.desc()).all()
    return jsonify({'keyAchievements': [ka.to_dict() for ka in key_achievements]}), 200

@api_bp.route('/profile/key-achievements', methods=['POST'])
@jwt_required()
def create_key_achievement():
    """Create a new key achievement"""
    user_id = get_jwt_identity()
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

    key_achievement = KeyAchievement(
        user_id=user_id,
        title=data['title'],
        category=data.get('category'),
        date=date,
        description=data.get('description')
    )

    db.session.add(key_achievement)
    db.session.commit()

    return jsonify({'message': 'Key achievement created successfully', 'keyAchievement': key_achievement.to_dict()}), 201

@api_bp.route('/profile/key-achievements/<int:ka_id>', methods=['PUT'])
@jwt_required()
def update_key_achievement(ka_id):
    """Update a key achievement"""
    user_id = get_jwt_identity()
    key_achievement = KeyAchievement.query.filter_by(id=ka_id, user_id=user_id).first()

    if not key_achievement:
        return jsonify({'error': 'Key achievement not found'}), 404

    data = request.get_json()

    # Handle date update
    if 'date' in data:
        if data['date'] and data['date'] != '':
            try:
                key_achievement.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        else:
            key_achievement.date = None

    # Update other fields
    for key, value in data.items():
        if key != 'date' and hasattr(key_achievement, key):
            setattr(key_achievement, key, value)

    db.session.commit()
    return jsonify({'message': 'Key achievement updated successfully', 'keyAchievement': key_achievement.to_dict()}), 200

@api_bp.route('/profile/key-achievements/<int:ka_id>', methods=['DELETE'])
@jwt_required()
def delete_key_achievement(ka_id):
    """Delete a key achievement"""
    user_id = get_jwt_identity()
    key_achievement = KeyAchievement.query.filter_by(id=ka_id, user_id=user_id).first()

    if not key_achievement:
        return jsonify({'error': 'Key achievement not found'}), 404

    db.session.delete(key_achievement)
    db.session.commit()
    return jsonify({'message': 'Key achievement deleted successfully'}), 200
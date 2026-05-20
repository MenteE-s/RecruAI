from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import ProfileSection
import json
from datetime import datetime
from ...utils.kafka_service import kafka_service as kafka
from ...utils.cache import invalidate_user_cache

@api_bp.route('/profile/sections', methods=['GET'])
@jwt_required()
def get_profile_sections():
    """Get all profile sections for the current user"""
    user_id = int(get_jwt_identity())

    # Get all profile sections
    sections = ProfileSection.query.filter_by(user_id=user_id).order_by(ProfileSection.order_index).all()

    return jsonify({
        'sections': [section.to_dict() for section in sections]
    }), 200

@api_bp.route('/profile/sections', methods=['POST'])
@jwt_required()
def save_profile_section():
    """Save or update a profile section"""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or 'section_type' not in data or 'section_data' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    section_type = data['section_type']
    section_data = data['section_data']
    order_index = data.get('order_index', 0)

    # Check if section already exists
    existing_section = ProfileSection.query.filter_by(
        user_id=user_id,
        section_type=section_type
    ).first()

    if existing_section:
        # Update existing section
        existing_section.section_data = json.dumps(section_data)
        existing_section.order_index = order_index
        db.session.commit()

        # Invalidate user profile cache
        invalidate_user_cache(user_id)

        # Emit Kafka event for section update
        kafka.emit_event('profile_section_updated', {
            'section_id': existing_section.id,
            'user_id': user_id,
            'section_type': section_type,
            'timestamp': datetime.utcnow().isoformat()
        })

        return jsonify({'message': 'Section updated successfully', 'section': existing_section.to_dict()}), 200
    else:
        # Create new section
        new_section = ProfileSection(
            user_id=user_id,
            section_type=section_type,
            section_data=json.dumps(section_data),
            order_index=order_index
        )
        db.session.add(new_section)
        db.session.commit()

        # Invalidate user profile cache
        invalidate_user_cache(user_id)

        # Emit Kafka event for section creation
        kafka.emit_event('profile_section_created', {
            'section_id': new_section.id,
            'user_id': user_id,
            'section_type': section_type,
            'timestamp': datetime.utcnow().isoformat()
        })

        return jsonify({'message': 'Section created successfully', 'section': new_section.to_dict()}), 201

@api_bp.route('/profile/sections/<int:section_id>', methods=['DELETE'])
@jwt_required()
def delete_profile_section(section_id):
    """Delete a profile section"""
    user_id = int(get_jwt_identity())

    section = ProfileSection.query.filter_by(id=section_id, user_id=user_id).first()
    if not section:
        return jsonify({'error': 'Section not found'}), 404

    section_id_val = section.id
    section_type_val = section.section_type
    db.session.delete(section)
    db.session.commit()

    # Invalidate user profile cache
    invalidate_user_cache(user_id)

    # Emit Kafka event for section deletion
    kafka.emit_event('profile_section_deleted', {
        'section_id': section_id_val,
        'user_id': user_id,
        'section_type': section_type_val,
        'timestamp': datetime.utcnow().isoformat()
    })

    return jsonify({'message': 'Section deleted successfully'}), 200

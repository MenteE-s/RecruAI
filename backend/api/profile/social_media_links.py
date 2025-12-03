from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import SocialMediaLink
from sqlalchemy import desc

# Social Media Link endpoints
@api_bp.route('/profile/social-media-links', methods=['GET'])
@jwt_required()
def get_social_media_links():
    """Get all social media links for the current user"""
    user_id = int(get_jwt_identity())
    social_media_links = SocialMediaLink.query.filter_by(user_id=user_id).all()
    return jsonify({'social_media_links': [sml.to_dict() for sml in social_media_links]}), 200

@api_bp.route('/profile/social-media-links', methods=['POST'])
@jwt_required()
def create_social_media_link():
    """Create a new social media link"""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or 'platform' not in data or 'url' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    social_media_link = SocialMediaLink(
        user_id=user_id,
        platform=data['platform'],
        url=data['url'],
        username=data.get('username')
    )

    db.session.add(social_media_link)
    db.session.commit()

    return jsonify({'message': 'Social media link created successfully', 'social_media_link': social_media_link.to_dict()}), 20100

@api_bp.route('/profile/social-media-links/<int:sml_id>', methods=['PUT'])
@jwt_required()
def update_social_media_link(sml_id):
    """Update a social media link"""
    user_id = int(get_jwt_identity())
    social_media_link = SocialMediaLink.query.filter_by(id=sml_id, user_id=user_id).first()

    if not social_media_link:
        return jsonify({'error': 'Social media link not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(social_media_link, key):
            setattr(social_media_link, key, value)

    db.session.commit()
    return jsonify({'message': 'Social media link updated successfully', 'socialMediaLink': social_media_link.to_dict()}), 200

@api_bp.route('/profile/social-media-links/<int:sml_id>', methods=['DELETE'])
@jwt_required()
def delete_social_media_link(sml_id):
    """Delete a social media link"""
    user_id = int(get_jwt_identity())
    social_media_link = SocialMediaLink.query.filter_by(id=sml_id, user_id=user_id).first()

    if not social_media_link:
        return jsonify({'error': 'Social media link not found'}), 404

    db.session.delete(social_media_link)
    db.session.commit()
    return jsonify({'message': 'Social media link deleted successfully'}), 200

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...models import ShareableProfile, ProfileAnalytics, User, ProfileSection
from ...extensions import db
from ...utils.pagination import Pagination, get_pagination_params, paginated_response
from datetime import datetime, timedelta
import re


@api_bp.route('/profiles', methods=['GET'])
@jwt_required()
def get_user_profiles():
    """Get all shareable profiles for the current user"""
    user_id = get_jwt_identity()

    page, per_page = get_pagination_params()

    query = ShareableProfile.query.filter_by(user_id=user_id)
    pagination_result = Pagination(query, page=page, per_page=per_page).paginate()

    return jsonify(paginated_response(pagination_result['items'], pagination_result['pagination'])), 200


@api_bp.route('/profiles', methods=['POST'])
@jwt_required()
def create_profile():
    """Create a new shareable profile"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'slug' not in data:
        return jsonify({'success': False, 'message': 'Slug is required'}), 400

    # Validate slug format
    slug = data['slug'].lower().replace(' ', '-').replace('_', '-')
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    slug = re.sub(r'-+', '-', slug).strip('-')

    if not slug:
        return jsonify({'success': False, 'message': 'Invalid slug format'}), 400

    # Check if slug is unique
    existing = ShareableProfile.query.filter_by(slug=slug).first()
    if existing:
        return jsonify({'success': False, 'message': 'Slug already exists'}), 409

    # Parse expiry date if provided
    expires_at = None
    if 'expires_at' in data and data['expires_at']:
        try:
            expires_at = datetime.fromisoformat(data['expires_at'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'success': False, 'message': 'Invalid expiry date format'}), 400

    profile = ShareableProfile(
        user_id=user_id,
        slug=slug,
        is_public=data.get('is_public', True),
        show_contact_info=data.get('show_contact_info', False),
        show_resume=data.get('show_resume', True),
        show_experience=data.get('show_experience', True),
        show_education=data.get('show_education', True),
        show_skills=data.get('show_skills', True),
        show_projects=data.get('show_projects', True),
        expires_at=expires_at,
        is_active=data.get('is_active', True)
    )

    db.session.add(profile)
    db.session.commit()

    return jsonify({
        'success': True,
        'data': profile.to_dict(),
        'message': 'Profile created successfully'
    }), 201


@api_bp.route('/profiles/<slug>', methods=['GET'])
@jwt_required()
def get_profile(slug):
    """Get a specific shareable profile"""
    user_id = get_jwt_identity()

    profile = ShareableProfile.query.filter_by(slug=slug, user_id=user_id).first()
    if not profile:
        return jsonify({'success': False, 'message': 'Profile not found'}), 404

    return jsonify({
        'success': True,
        'data': profile.to_dict()
    })


@api_bp.route('/profiles/<slug>', methods=['PUT'])
@jwt_required()
def update_profile(slug):
    """Update a shareable profile"""
    user_id = get_jwt_identity()

    profile = ShareableProfile.query.filter_by(slug=slug, user_id=user_id).first()
    if not profile:
        return jsonify({'success': False, 'message': 'Profile not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400

    # Update fields
    updatable_fields = [
        'is_public', 'show_contact_info', 'show_resume', 'show_experience',
        'show_education', 'show_skills', 'show_projects', 'is_active'
    ]

    for field in updatable_fields:
        if field in data:
            setattr(profile, field, data[field])

    # Handle expiry date
    if 'expires_at' in data:
        if data['expires_at'] is None:
            profile.expires_at = None
        else:
            try:
                profile.expires_at = datetime.fromisoformat(data['expires_at'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'success': False, 'message': 'Invalid expiry date format'}), 400

    db.session.commit()

    return jsonify({
        'success': True,
        'data': profile.to_dict(),
        'message': 'Profile updated successfully'
    })


@api_bp.route('/profiles/<slug>', methods=['DELETE'])
@jwt_required()
def delete_profile(slug):
    """Delete a shareable profile"""
    user_id = get_jwt_identity()

    profile = ShareableProfile.query.filter_by(slug=slug, user_id=user_id).first()
    if not profile:
        return jsonify({'success': False, 'message': 'Profile not found'}), 404

    db.session.delete(profile)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Profile deleted successfully'
    })


@api_bp.route('/public/<slug>', methods=['GET'])
def get_public_profile(slug):
    """Get public shareable profile (no auth required)"""
    profile = ShareableProfile.query.filter_by(slug=slug).first()
    if not profile or not profile.can_access():
        return jsonify({'success': False, 'message': 'Profile not found or expired'}), 404

    # Track analytics
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    referrer = request.headers.get('Referer')

    analytics = ProfileAnalytics(
        profile_id=profile.id,
        ip_address=ip_address,
        user_agent=user_agent,
        referrer=referrer
    )

    db.session.add(analytics)
    profile.increment_views()

    # Get user data with visibility settings
    user = profile.user
    user_data = user.to_public_dict()

    # Apply visibility filters
    if not profile.show_contact_info:
        user_data.pop('email', None)
        user_data.pop('phone', None)

    if not profile.show_experience:
        user_data['experiences'] = []

    if not profile.show_education:
        user_data['educations'] = []

    if not profile.show_skills:
        user_data['skills'] = []

    if not profile.show_projects:
        user_data['projects'] = []

    # Include profile sections
    profile_sections = ProfileSection.query.filter_by(user_id=user.id).order_by(ProfileSection.order_index).all()
    user_data['profile_sections'] = [section.to_dict() for section in profile_sections]

    return jsonify({
        'success': True,
        'data': {
            'profile': profile.to_dict(),
            'user': user_data
        }
    })


@api_bp.route('/profiles/<slug>/analytics', methods=['GET'])
@jwt_required()
def get_profile_analytics(slug):
    """Get analytics for a shareable profile"""
    user_id = get_jwt_identity()

    profile = ShareableProfile.query.filter_by(slug=slug, user_id=user_id).first()
    if not profile:
        return jsonify({'success': False, 'message': 'Profile not found'}), 404

    page, per_page = get_pagination_params()

    query = ProfileAnalytics.query.filter_by(profile_id=profile.id).order_by(ProfileAnalytics.viewed_at.desc())
    pagination_result = Pagination(query, page=page, per_page=per_page).paginate()

    return jsonify({
        'success': True,
        'data': {
            'profile': profile.to_dict(),
            'analytics': [a.to_dict() for a in pagination_result['items']],
            'summary': {
                'total_views': profile.view_count,
                'unique_visitors': len(set(a.ip_address for a in pagination_result['items'] if a.ip_address))
            }
        },
        'pagination': pagination_result['pagination']
    })


@api_bp.route('/profiles/check-slug', methods=['POST'])
@jwt_required()
def check_slug_availability():
    """Check if a slug is available"""
    data = request.get_json()
    if not data or 'slug' not in data:
        return jsonify({'success': False, 'message': 'Slug is required'}), 400

    slug = data['slug'].lower().replace(' ', '-').replace('_', '-')
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    slug = re.sub(r'-+', '-', slug).strip('-')

    existing = ShareableProfile.query.filter_by(slug=slug).first()
    available = existing is None

    return jsonify({
        'success': True,
        'data': {
            'slug': slug,
            'available': available
        }
    })
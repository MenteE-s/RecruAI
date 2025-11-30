from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import Organization, User, TeamMember
import os
from werkzeug.utils import secure_filename

@api_bp.route("/organizations/<int:org_id>/upload-profile-image", methods=["POST"])
@jwt_required()
def upload_organization_profile_image(org_id):
    """Upload a profile image for an organization"""
    # Get current user
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    # Check if user belongs to the organization or is an organization user
    if user.role == "organization" and user.organization_id == org_id:
        # Organization user can upload for their own organization
        pass
    elif user.role == "individual":
        # Check if user is a team member of the organization
        team_member = TeamMember.query.filter_by(organization_id=org_id, user_id=user_id).first()
        if not team_member:
            return jsonify({"error": "Unauthorized - not a member of this organization"}), 403
    else:
        return jsonify({"error": "Unauthorized"}), 403

    org = Organization.query.get_or_404(org_id)

    if 'profile_image' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['profile_image']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Validate file type
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    if not file.filename.lower().split('.')[-1] in allowed_extensions:
        return jsonify({'error': 'Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed'}), 400

    # Validate file size (max 5MB)
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > 5 * 1024 * 1024:  # 5MB
        return jsonify({'error': 'File too large. Maximum size is 5MB'}), 400

    # Secure filename and create unique filename
    filename = secure_filename(file.filename)
    extension = filename.rsplit('.', 1)[1].lower()
    unique_filename = f"org_{org_id}_profile.{extension}"

    # Save file
    upload_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads', 'organization_images', 'profile_images', unique_filename)
    file.save(upload_path)

    # Update organization profile image path
    profile_image_url = f"/uploads/organization_images/profile_images/{unique_filename}"
    org.profile_image = profile_image_url
    db.session.commit()

    return jsonify({
        'message': 'Profile image uploaded successfully',
        'profile_image': profile_image_url
    }), 200

@api_bp.route("/organizations/<int:org_id>/upload-banner-image", methods=["POST"])
@jwt_required()
def upload_organization_banner_image(org_id):
    """Upload a banner image for an organization"""
    # Get current user
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    # Check if user belongs to the organization or is an organization user
    if user.role == "organization" and user.organization_id == org_id:
        # Organization user can upload for their own organization
        pass
    elif user.role == "individual":
        # Check if user is a team member of the organization
        team_member = TeamMember.query.filter_by(organization_id=org_id, user_id=user_id).first()
        if not team_member:
            return jsonify({"error": "Unauthorized - not a member of this organization"}), 403
    else:
        return jsonify({"error": "Unauthorized"}), 403

    org = Organization.query.get_or_404(org_id)

    if 'banner_image' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['banner_image']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Validate file type
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    if not file.filename.lower().split('.')[-1] in allowed_extensions:
        return jsonify({'error': 'Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed'}), 400

    # Validate file size (max 5MB)
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > 5 * 1024 * 1024:  # 5MB
        return jsonify({'error': 'File too large. Maximum size is 5MB'}), 400

    # Secure filename and create unique filename
    filename = secure_filename(file.filename)
    extension = filename.rsplit('.', 1)[1].lower()
    unique_filename = f"org_{org_id}_banner.{extension}"

    # Save file
    upload_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads', 'organization_images', 'banner_images', unique_filename)
    file.save(upload_path)

    # Update organization banner image path
    banner_image_url = f"/uploads/organization_images/banner_images/{unique_filename}"
    org.banner_image = banner_image_url
    db.session.commit()

    return jsonify({
        'message': 'Banner image uploaded successfully',
        'banner_image': banner_image_url
    }), 200
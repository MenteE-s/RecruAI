from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import User, Experience, Education, Skill, Project, Publication, ProfileSection, Award, Certification, Language, VolunteerExperience, Reference, HobbyInterest, ProfessionalMembership, Patent, CourseTraining, SocialMediaLink, KeyAchievement, Conference, SpeakingEngagement, License, TeamMember
from sqlalchemy.orm import joinedload
from sqlalchemy import desc
import os
from werkzeug.utils import secure_filename
from ...api.notifications.routes import create_profile_notification
@api_bp.route('/profile/user/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_profile(user_id):
    """Get full profile data for a specific user (self-access or organization admin access)"""
    try:
        current_user_id = int(get_jwt_identity())

        # Get current user
        try:
            current_user_id_int = int(current_user_id)
            current_user = User.query.options(joinedload(User.organization)).get(current_user_id_int)
        except (ValueError, TypeError):
            return jsonify({"error": "invalid user identity"}), 400
        if not current_user:
            return jsonify({'error': 'Current user not found'}), 404

        target_team_member = None
        # Allow users to access their own profile
        if current_user_id_int == user_id:
            target_user = User.query.options(joinedload(User.organization)).get(user_id)
            if not target_user:
                return jsonify({'error': 'User not found'}), 404
            is_team_member = True  # User viewing their own profile
        else:
            # For organization users accessing other users' profiles (for hiring purposes)
            if current_user.organization_id and current_user.role == 'organization':
                # Organization users can view any individual user's profile for hiring
                target_user = User.query.options(joinedload(User.organization)).filter_by(id=user_id, role='individual').first()
                if not target_user:
                    return jsonify({'error': 'User not found'}), 404

                # Check if target user is a formal team member in the organization
                target_team_member = TeamMember.query.options(joinedload(TeamMember.organization), joinedload(TeamMember.user)).filter_by(
                    organization_id=current_user.organization_id,
                    user_id=user_id
                ).first()

                is_team_member = target_team_member is not None
            else:
                # Regular users can only view profiles within their organization
                if not current_user.organization_id:
                    return jsonify({'error': 'Unauthorized - Organization membership required'}), 403

                # Check if target user belongs to the same organization
                target_user = User.query.options(joinedload(User.organization)).filter_by(
                    id=user_id,
                    organization_id=current_user.organization_id
                ).first()

                if not target_user:
                    return jsonify({'error': 'User not found in your organization'}), 404

                # Check if target user is a formal team member
                target_team_member = TeamMember.query.options(joinedload(TeamMember.organization), joinedload(TeamMember.user)).filter_by(
                    organization_id=current_user.organization_id,
                    user_id=user_id
                ).first()

                is_team_member = target_team_member is not None

        # Fetch all profile data for the target user
        profile_data = {
            'user': target_user.to_dict(),
            'experiences': [exp.to_dict() for exp in Experience.query.filter_by(user_id=user_id).order_by(desc(Experience.start_date).nulls_last()).all()],
            'educations': [edu.to_dict() for edu in Education.query.filter_by(user_id=user_id).order_by(desc(Education.start_date).nulls_last()).all()],
            'skills': [skill.to_dict() for skill in Skill.query.filter_by(user_id=user_id).all()],
            'projects': [project.to_dict() for project in Project.query.filter_by(user_id=user_id).order_by(desc(Project.start_date).nulls_last()).all()],
            'publications': [pub.to_dict() for pub in Publication.query.filter_by(user_id=user_id).order_by(desc(Publication.year).nulls_last()).all()],
            'awards': [award.to_dict() for award in Award.query.filter_by(user_id=user_id).order_by(desc(Award.date).nulls_last()).all()],
            'certifications': [cert.to_dict() for cert in Certification.query.filter_by(user_id=user_id).order_by(desc(Certification.date_obtained).nulls_last()).all()],
            'languages': [lang.to_dict() for lang in Language.query.filter_by(user_id=user_id).all()],
            'volunteer_experiences': [ve.to_dict() for ve in VolunteerExperience.query.filter_by(user_id=user_id).order_by(desc(VolunteerExperience.start_date).nulls_last()).all()],
            'references': [ref.to_dict() for ref in Reference.query.filter_by(user_id=user_id).all()],
            'hobby_interests': [hi.to_dict() for hi in HobbyInterest.query.filter_by(user_id=user_id).all()],
            'professional_memberships': [pm.to_dict() for pm in ProfessionalMembership.query.filter_by(user_id=user_id).order_by(desc(ProfessionalMembership.start_date).nulls_last()).all()],
            'patents': [patent.to_dict() for patent in Patent.query.filter_by(user_id=user_id).order_by(desc(Patent.filing_date).nulls_last()).all()],
            'course_trainings': [ct.to_dict() for ct in CourseTraining.query.filter_by(user_id=user_id).order_by(desc(CourseTraining.completion_date).nulls_last()).all()],
            'social_media_links': [sml.to_dict() for sml in SocialMediaLink.query.filter_by(user_id=user_id).all()],
            'key_achievements': [ka.to_dict() for ka in KeyAchievement.query.filter_by(user_id=user_id).order_by(desc(KeyAchievement.date).nulls_last()).all()],
            'conferences': [conf.to_dict() for conf in Conference.query.filter_by(user_id=user_id).order_by(desc(Conference.date).nulls_last()).all()],
            'speaking_engagements': [se.to_dict() for se in SpeakingEngagement.query.filter_by(user_id=user_id).order_by(desc(SpeakingEngagement.date).nulls_last()).all()],
            'licenses': [lic.to_dict() for lic in License.query.filter_by(user_id=user_id).order_by(desc(License.issue_date).nulls_last()).all()],
        }

        # Add team membership status
        profile_data['is_team_member'] = is_team_member
        profile_data['team_member_info'] = target_team_member.to_dict() if target_team_member else None

        # Add hired organizations
        hired_team_members = TeamMember.query.options(joinedload(TeamMember.organization)).filter_by(user_id=user_id).all()
        profile_data['hired_organizations'] = [
            {
                'organization_name': tm.organization.name if tm.organization else 'Unknown',
                'role': tm.role,
                'join_date': tm.join_date.isoformat() if tm.join_date else None
            } for tm in hired_team_members
        ]

        # Create notification if organization is viewing individual's profile
        if (current_user.role == 'organization' and target_user.role == 'individual' and
            current_user_id_int != user_id):  # Not viewing own profile
            try:
                create_profile_notification(
                    user_id=target_user.id,
                    notification_type="profile_viewed",
                    title=f"Profile Viewed by {current_user.organization.name if current_user.organization else 'Organization'}",
                    message=f"Your profile has been viewed by {current_user.organization.name if current_user.organization else 'an organization'}.",
                    related_user_id=current_user.id,
                    related_org_id=current_user.organization_id
                )
            except Exception as e:
                print(f"Failed to create profile view notification: {e}")

        return jsonify(profile_data), 200
    except Exception as e:
        import traceback
        print(f"Error in get_user_profile: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

# Profile Picture Upload endpoint
@api_bp.route('/profile/upload-profile-picture', methods=['POST'])
@jwt_required()
def upload_profile_picture():
    """Upload a profile picture for the current user"""
    user_id = int(get_jwt_identity())
    try:
        user_id_int = int(user_id)
        user = User.query.get(user_id_int)
    except (ValueError, TypeError):
        return jsonify({"error": "invalid user identity"}), 400

    if not user:
        return jsonify({'error': 'User not found'}), 404

    if 'profile_picture' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['profile_picture']

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
    unique_filename = f"user_{user_id_int}_profile.{extension}"

    # Save file
    upload_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads', 'profile_pictures', unique_filename)
    file.save(upload_path)

    # Update user profile picture path
    profile_picture_url = f"/uploads/profile_pictures/{unique_filename}"
    user.profile_picture = profile_picture_url
    try:
        db.session.commit()
        return jsonify({
            'message': 'Profile picture uploaded successfully',
            'profile_picture': profile_picture_url
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update profile picture: {str(e)}"}), 500


# Banner Upload endpoint
@api_bp.route('/profile/upload-banner', methods=['POST'])
@jwt_required()
def upload_banner():
    """Upload a banner image for the current user"""
    user_id = int(get_jwt_identity())
    try:
        user_id_int = int(user_id)
        user = User.query.get(user_id_int)
    except (ValueError, TypeError):
        return jsonify({"error": "invalid user identity"}), 400

    if not user:
        return jsonify({'error': 'User not found'}), 404

    if 'banner' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['banner']

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
    unique_filename = f"user_{user_id_int}_banner.{extension}"

    # Create banners directory if it doesn't exist
    banners_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads', 'banners')
    if not os.path.exists(banners_dir):
        os.makedirs(banners_dir)

    # Save file
    upload_path = os.path.join(banners_dir, unique_filename)
    file.save(upload_path)

    # Update user banner path
    banner_url = f"/uploads/banners/{unique_filename}"
    user.banner = banner_url
    try:
        db.session.commit()
        return jsonify({
            'message': 'Banner uploaded successfully',
            'banner': banner_url
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update banner: {str(e)}"}), 500

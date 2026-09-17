from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import (
    ProfileSection, User, Skill, Experience, Education, Project,
    Certification, Publication, Award, Language, VolunteerExperience,
    CourseTraining, KeyAchievement, ProfessionalMembership, Patent
)
import json
from datetime import datetime
from ...utils.kafka_service import kafka_service as kafka
from ...utils.cache import invalidate_user_cache
from ...recommendations.tools.supervisor import RecommendationSupervisor
from sqlalchemy.orm import sessionmaker


def _assemble_profile_data(user):
    name = user.name or ""
    name_parts = name.split(" ", 1)
    first_name = name_parts[0] if name_parts else user.name or ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    # About / Summary from profile sections
    about = ""
    summary = ""
    for sec in ProfileSection.query.filter_by(user_id=user.id).all():
        sec_data = sec.to_dict()
        st = sec_data.get('section_type', '')
        sd = sec_data.get('section_data', {})
        if st == 'about':
            about = sd.get('about', sd.get('content', '')) if isinstance(sd, dict) else str(sd)
        elif st == 'summary':
            summary = sd.get('summary', sd.get('content', '')) if isinstance(sd, dict) else str(sd)

    profile_data = {
        'first_name': first_name,
        'last_name': last_name,
        'about': about,
        'summary': summary,
        'skills': [skill.to_dict() for skill in Skill.query.filter_by(user_id=user.id).all()],
        'experiences': [exp.to_dict() for exp in Experience.query.filter_by(user_id=user.id).all()],
        'educations': [edu.to_dict() for edu in Education.query.filter_by(user_id=user.id).all()],
        'projects': [proj.to_dict() for proj in Project.query.filter_by(user_id=user.id).all()],
        'certifications': [c.to_dict() for c in Certification.query.filter_by(user_id=user.id).all()],
        'publications': [p.to_dict() for p in Publication.query.filter_by(user_id=user.id).all()],
        'awards': [a.to_dict() for a in Award.query.filter_by(user_id=user.id).all()],
        'languages': [l.to_dict() for l in Language.query.filter_by(user_id=user.id).all()],
        'volunteer_experiences': [v.to_dict() for v in VolunteerExperience.query.filter_by(user_id=user.id).all()],
        'course_trainings': [c.to_dict() for c in CourseTraining.query.filter_by(user_id=user.id).all()],
        'key_achievements': [k.to_dict() for k in KeyAchievement.query.filter_by(user_id=user.id).all()],
        'professional_memberships': [m.to_dict() for m in ProfessionalMembership.query.filter_by(user_id=user.id).all()],
        'patents': [p.to_dict() for p in Patent.query.filter_by(user_id=user.id).all()],
    }

    return profile_data


def _get_supervisor():
    supervisor = RecommendationSupervisor()
    supervisor.db_engine = db.engine
    supervisor._session_factory = sessionmaker(bind=db.engine)
    supervisor.retriever.db_engine = db.engine
    supervisor.retriever._session_factory = sessionmaker(bind=db.engine)
    return supervisor


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

        # Auto-generate embedding
        try:
            user = User.query.get(user_id)
            if user:
                sup = _get_supervisor()
                profile_data = _assemble_profile_data(user)
                sup.embed_and_store_profile(str(user_id), profile_data, str(user.organization_id) if user.organization_id else None)
        except Exception as e:
            print(f"Failed to auto-embed profile after section update: {e}")

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

        # Auto-generate embedding
        try:
            user = User.query.get(user_id)
            if user:
                sup = _get_supervisor()
                profile_data = _assemble_profile_data(user)
                sup.embed_and_store_profile(str(user_id), profile_data, str(user.organization_id) if user.organization_id else None)
        except Exception as e:
            print(f"Failed to auto-embed profile after section create: {e}")

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

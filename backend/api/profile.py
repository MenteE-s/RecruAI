from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from . import api_bp
from ..extensions import db
from ..models import (
    User, Experience, Education, Skill, Project, Publication, ProfileSection
)
import json

@api_bp.route('/profile/sections', methods=['GET'])
@jwt_required()
def get_profile_sections():
    """Get all profile sections for the current user"""
    user_id = get_jwt_identity()

    # Get all profile sections
    sections = ProfileSection.query.filter_by(user_id=user_id).order_by(ProfileSection.order_index).all()

    return jsonify({
        'sections': [section.to_dict() for section in sections]
    }), 200

@api_bp.route('/profile/sections', methods=['POST'])
@jwt_required()
def save_profile_section():
    """Save or update a profile section"""
    user_id = get_jwt_identity()
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
        return jsonify({'message': 'Section created successfully', 'section': new_section.to_dict()}), 201

@api_bp.route('/profile/sections/<int:section_id>', methods=['DELETE'])
@jwt_required()
def delete_profile_section(section_id):
    """Delete a profile section"""
    user_id = get_jwt_identity()

    section = ProfileSection.query.filter_by(id=section_id, user_id=user_id).first()
    if not section:
        return jsonify({'error': 'Section not found'}), 404

    db.session.delete(section)
    db.session.commit()

    return jsonify({'message': 'Section deleted successfully'}), 200

# Experience endpoints
@api_bp.route('/profile/experiences', methods=['GET'])
@jwt_required()
def get_experiences():
    """Get all experiences for the current user"""
    user_id = get_jwt_identity()
    experiences = Experience.query.filter_by(user_id=user_id).order_by(Experience.start_date.desc()).all()
    return jsonify({'experiences': [exp.to_dict() for exp in experiences]}), 200

@api_bp.route('/profile/experiences', methods=['POST'])
@jwt_required()
def create_experience():
    """Create a new experience"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'title' not in data or 'company' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle empty date strings
    start_date = data.get('start_date') if data.get('start_date') != '' else None
    end_date = data.get('end_date') if data.get('end_date') != '' else None

    experience = Experience(
        user_id=user_id,
        title=data['title'],
        company=data['company'],
        duration=data.get('duration'),
        location=data.get('location'),
        description=data.get('description'),
        start_date=start_date,
        end_date=end_date,
        current_job=data.get('current_job', False)
    )

    db.session.add(experience)
    db.session.commit()

    return jsonify({'message': 'Experience created successfully', 'experience': experience.to_dict()}), 201

@api_bp.route('/profile/experiences/<int:exp_id>', methods=['PUT'])
@jwt_required()
def update_experience(exp_id):
    """Update an experience"""
    user_id = get_jwt_identity()
    experience = Experience.query.filter_by(id=exp_id, user_id=user_id).first()

    if not experience:
        return jsonify({'error': 'Experience not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(experience, key):
            setattr(experience, key, value)

    db.session.commit()
    return jsonify({'message': 'Experience updated successfully', 'experience': experience.to_dict()}), 200

@api_bp.route('/profile/experiences/<int:exp_id>', methods=['DELETE'])
@jwt_required()
def delete_experience(exp_id):
    """Delete an experience"""
    user_id = get_jwt_identity()
    experience = Experience.query.filter_by(id=exp_id, user_id=user_id).first()

    if not experience:
        return jsonify({'error': 'Experience not found'}), 404

    db.session.delete(experience)
    db.session.commit()
    return jsonify({'message': 'Experience deleted successfully'}), 200

# Education endpoints
@api_bp.route('/profile/educations', methods=['GET'])
@jwt_required()
def get_educations():
    """Get all education records for the current user"""
    user_id = get_jwt_identity()
    educations = Education.query.filter_by(user_id=user_id).order_by(Education.start_date.desc()).all()
    return jsonify({'educations': [edu.to_dict() for edu in educations]}), 200

@api_bp.route('/profile/educations', methods=['POST'])
@jwt_required()
def create_education():
    """Create a new education record"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'degree' not in data or 'school' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle empty date strings
    start_date = data.get('start_date') if data.get('start_date') != '' else None
    end_date = data.get('end_date') if data.get('end_date') != '' else None

    education = Education(
        user_id=user_id,
        degree=data['degree'],
        school=data['school'],
        field=data.get('field'),
        year=data.get('year'),
        gpa=data.get('gpa'),
        start_date=start_date,
        end_date=end_date
    )

    db.session.add(education)
    db.session.commit()

    return jsonify({'message': 'Education record created successfully', 'education': education.to_dict()}), 201

# Skills endpoints
@api_bp.route('/profile/skills', methods=['GET'])
@jwt_required()
def get_skills():
    """Get all skills for the current user"""
    user_id = get_jwt_identity()
    skills = Skill.query.filter_by(user_id=user_id).all()
    return jsonify({'skills': [skill.to_dict() for skill in skills]}), 200

@api_bp.route('/profile/skills', methods=['POST'])
@jwt_required()
def create_skill():
    """Create a new skill"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'name' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    skill = Skill(
        user_id=user_id,
        name=data['name'],
        level=data.get('level')
    )

    db.session.add(skill)
    db.session.commit()

    return jsonify({'message': 'Skill created successfully', 'skill': skill.to_dict()}), 201

@api_bp.route('/profile/skills/<int:skill_id>', methods=['DELETE'])
@jwt_required()
def delete_skill(skill_id):
    """Delete a skill"""
    user_id = get_jwt_identity()
    skill = Skill.query.filter_by(id=skill_id, user_id=user_id).first()

    if not skill:
        return jsonify({'error': 'Skill not found'}), 404

    db.session.delete(skill)
    db.session.commit()
    return jsonify({'message': 'Skill deleted successfully'}), 200

# Projects endpoints
@api_bp.route('/profile/projects', methods=['GET'])
@jwt_required()
def get_projects():
    """Get all projects for the current user"""
    user_id = get_jwt_identity()
    projects = Project.query.filter_by(user_id=user_id).order_by(Project.start_date.desc()).all()
    return jsonify({'projects': [project.to_dict() for project in projects]}), 200

@api_bp.route('/profile/projects', methods=['POST'])
@jwt_required()
def create_project():
    """Create a new project"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'name' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle empty date strings
    start_date = data.get('start_date') if data.get('start_date') != '' else None
    end_date = data.get('end_date') if data.get('end_date') != '' else None

    project = Project(
        user_id=user_id,
        name=data['name'],
        description=data.get('description'),
        technologies=json.dumps(data.get('technologies', [])),
        github_url=data.get('github_url'),
        demo_url=data.get('demo_url'),
        start_date=start_date,
        end_date=end_date
    )

    db.session.add(project)
    db.session.commit()

    return jsonify({'message': 'Project created successfully', 'project': project.to_dict()}), 201

# Publications endpoints
@api_bp.route('/profile/publications', methods=['GET'])
@jwt_required()
def get_publications():
    """Get all publications for the current user"""
    user_id = get_jwt_identity()
    publications = Publication.query.filter_by(user_id=user_id).order_by(Publication.year.desc()).all()
    return jsonify({'publications': [pub.to_dict() for pub in publications]}), 200

@api_bp.route('/profile/publications', methods=['POST'])
@jwt_required()
def create_publication():
    """Create a new publication"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'title' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    publication = Publication(
        user_id=user_id,
        title=data['title'],
        journal=data.get('journal'),
        authors=json.dumps(data.get('authors', [])),
        abstract=data.get('abstract'),
        publication_url=data.get('publication_url'),
        year=data.get('year'),
        doi=data.get('doi')
    )

    db.session.add(publication)
    db.session.commit()

    return jsonify({'message': 'Publication created successfully', 'publication': publication.to_dict()}), 201
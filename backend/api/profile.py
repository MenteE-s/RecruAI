from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from . import api_bp
from ..extensions import db
from ..models import (
    User, Experience, Education, Skill, Project, Publication, ProfileSection,
    Award, Certification, Language, VolunteerExperience, Reference, HobbyInterest,
    ProfessionalMembership, Patent, CourseTraining, SocialMediaLink,
    KeyAchievement, Conference, SpeakingEngagement, License, TeamMember
)
import json
from datetime import datetime
import os
from werkzeug.utils import secure_filename

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

    # Handle empty date strings and convert to date objects
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')

    start_date = None
    end_date = None

    if start_date_str and start_date_str != '':
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid start_date format. Use YYYY-MM-DD'}), 400

    if end_date_str and end_date_str != '':
        try:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid end_date format. Use YYYY-MM-DD'}), 400

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
        achievements=data.get('achievements'),
        start_date=start_date,
        end_date=end_date
    )

    db.session.add(education)
    db.session.commit()

    return jsonify({'message': 'Education record created successfully', 'education': education.to_dict()}), 201

@api_bp.route('/profile/educations/<int:edu_id>', methods=['PUT'])
@jwt_required()
def update_education(edu_id):
    """Update an education record"""
    user_id = get_jwt_identity()
    education = Education.query.filter_by(id=edu_id, user_id=user_id).first()

    if not education:
        return jsonify({'error': 'Education record not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(education, key):
            setattr(education, key, value)

    db.session.commit()
    return jsonify({'message': 'Education record updated successfully', 'education': education.to_dict()}), 200

@api_bp.route('/profile/educations/<int:edu_id>', methods=['DELETE'])
@jwt_required()
def delete_education(edu_id):
    """Delete an education record"""
    user_id = get_jwt_identity()
    education = Education.query.filter_by(id=edu_id, user_id=user_id).first()

    if not education:
        return jsonify({'error': 'Education record not found'}), 404

    db.session.delete(education)
    db.session.commit()
    return jsonify({'message': 'Education record deleted successfully'}), 200

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
        level=data.get('level'),
        years_experience=data.get('years_experience')
    )

    db.session.add(skill)
    db.session.commit()

    return jsonify({'message': 'Skill created successfully', 'skill': skill.to_dict()}), 201

@api_bp.route('/profile/skills/<int:skill_id>', methods=['PUT'])
@jwt_required()
def update_skill(skill_id):
    """Update a skill"""
    user_id = get_jwt_identity()
    skill = Skill.query.filter_by(id=skill_id, user_id=user_id).first()

    if not skill:
        return jsonify({'error': 'Skill not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(skill, key):
            setattr(skill, key, value)

    db.session.commit()
    return jsonify({'message': 'Skill updated successfully', 'skill': skill.to_dict()}), 200

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
        end_date=end_date,
        status=data.get('status')
    )

    db.session.add(project)
    db.session.commit()

    return jsonify({'message': 'Project created successfully', 'project': project.to_dict()}), 201

@api_bp.route('/profile/projects/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    """Update a project"""
    user_id = get_jwt_identity()
    project = Project.query.filter_by(id=project_id, user_id=user_id).first()

    if not project:
        return jsonify({'error': 'Project not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(project, key):
            if key == 'technologies':
                setattr(project, key, json.dumps(value) if value else None)
            else:
                setattr(project, key, value)

    db.session.commit()
    return jsonify({'message': 'Project updated successfully', 'project': project.to_dict()}), 200

@api_bp.route('/profile/projects/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    """Delete a project"""
    user_id = get_jwt_identity()
    project = Project.query.filter_by(id=project_id, user_id=user_id).first()

    if not project:
        return jsonify({'error': 'Project not found'}), 404

    db.session.delete(project)
    db.session.commit()
    return jsonify({'message': 'Project deleted successfully'}), 200

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

@api_bp.route('/profile/publications/<int:pub_id>', methods=['PUT'])
@jwt_required()
def update_publication(pub_id):
    """Update a publication"""
    user_id = get_jwt_identity()
    publication = Publication.query.filter_by(id=pub_id, user_id=user_id).first()

    if not publication:
        return jsonify({'error': 'Publication not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(publication, key):
            if key == 'authors':
                setattr(publication, key, json.dumps(value) if value else None)
            else:
                setattr(publication, key, value)

    db.session.commit()
    return jsonify({'message': 'Publication updated successfully', 'publication': publication.to_dict()}), 200

@api_bp.route('/profile/publications/<int:pub_id>', methods=['DELETE'])
@jwt_required()
def delete_publication(pub_id):
    """Delete a publication"""
    user_id = get_jwt_identity()
    publication = Publication.query.filter_by(id=pub_id, user_id=user_id).first()

    if not publication:
        return jsonify({'error': 'Publication not found'}), 404

    db.session.delete(publication)
    db.session.commit()
    return jsonify({'message': 'Publication deleted successfully'}), 200

# Awards endpoints
@api_bp.route('/profile/awards', methods=['GET'])
@jwt_required()
def get_awards():
    """Get all awards for the current user"""
    user_id = get_jwt_identity()
    awards = Award.query.filter_by(user_id=user_id).order_by(Award.date.desc()).all()
    return jsonify({'awards': [award.to_dict() for award in awards]}), 200

@api_bp.route('/profile/awards', methods=['POST'])
@jwt_required()
def create_award():
    """Create a new award"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'title' not in data or 'issuer' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle empty date strings
    date = data.get('date') if data.get('date') != '' else None

    award = Award(
        user_id=user_id,
        title=data['title'],
        issuer=data['issuer'],
        date=date,
        description=data.get('description')
    )

    db.session.add(award)
    db.session.commit()

    return jsonify({'message': 'Award created successfully', 'award': award.to_dict()}), 201

@api_bp.route('/profile/awards/<int:award_id>', methods=['PUT'])
@jwt_required()
def update_award(award_id):
    """Update an award"""
    user_id = get_jwt_identity()
    award = Award.query.filter_by(id=award_id, user_id=user_id).first()

    if not award:
        return jsonify({'error': 'Award not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(award, key):
            setattr(award, key, value)

    db.session.commit()
    return jsonify({'message': 'Award updated successfully', 'award': award.to_dict()}), 200

@api_bp.route('/profile/awards/<int:award_id>', methods=['DELETE'])
@jwt_required()
def delete_award(award_id):
    """Delete an award"""
    user_id = get_jwt_identity()
    award = Award.query.filter_by(id=award_id, user_id=user_id).first()

    if not award:
        return jsonify({'error': 'Award not found'}), 404

    db.session.delete(award)
    db.session.commit()
    return jsonify({'message': 'Award deleted successfully'}), 200

# Certifications endpoints
@api_bp.route('/profile/certifications', methods=['GET'])
@jwt_required()
def get_certifications():
    """Get all certifications for the current user"""
    user_id = get_jwt_identity()
    certifications = Certification.query.filter_by(user_id=user_id).order_by(Certification.date_obtained.desc()).all()
    return jsonify({'certifications': [cert.to_dict() for cert in certifications]}), 200

@api_bp.route('/profile/certifications', methods=['POST'])
@jwt_required()
def create_certification():
    """Create a new certification"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'name' not in data or 'issuer' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle empty date strings
    date_obtained = data.get('date_obtained') if data.get('date_obtained') != '' else None
    expiry_date = data.get('expiry_date') if data.get('expiry_date') != '' else None

    certification = Certification(
        user_id=user_id,
        name=data['name'],
        issuer=data['issuer'],
        date_obtained=date_obtained,
        expiry_date=expiry_date,
        credential_id=data.get('credential_id')
    )

    db.session.add(certification)
    db.session.commit()

    return jsonify({'message': 'Certification created successfully', 'certification': certification.to_dict()}), 201

@api_bp.route('/profile/certifications/<int:cert_id>', methods=['PUT'])
@jwt_required()
def update_certification(cert_id):
    """Update a certification"""
    user_id = get_jwt_identity()
    certification = Certification.query.filter_by(id=cert_id, user_id=user_id).first()

    if not certification:
        return jsonify({'error': 'Certification not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(certification, key):
            setattr(certification, key, value)

    db.session.commit()
    return jsonify({'message': 'Certification updated successfully', 'certification': certification.to_dict()}), 200

@api_bp.route('/profile/certifications/<int:cert_id>', methods=['DELETE'])
@jwt_required()
def delete_certification(cert_id):
    """Delete a certification"""
    user_id = get_jwt_identity()
    certification = Certification.query.filter_by(id=cert_id, user_id=user_id).first()

    if not certification:
        return jsonify({'error': 'Certification not found'}), 404

    db.session.delete(certification)
    db.session.commit()
    return jsonify({'message': 'Certification deleted successfully'}), 200

# Languages endpoints
@api_bp.route('/profile/languages', methods=['GET'])
@jwt_required()
def get_languages():
    """Get all languages for the current user"""
    user_id = get_jwt_identity()
    languages = Language.query.filter_by(user_id=user_id).all()
    return jsonify({'languages': [lang.to_dict() for lang in languages]}), 200

@api_bp.route('/profile/languages', methods=['POST'])
@jwt_required()
def create_language():
    """Create a new language"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'name' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    language = Language(
        user_id=user_id,
        name=data['name'],
        proficiency_level=data.get('proficiency_level')
    )

    db.session.add(language)
    db.session.commit()

    return jsonify({'message': 'Language created successfully', 'language': language.to_dict()}), 201

@api_bp.route('/profile/languages/<int:lang_id>', methods=['PUT'])
@jwt_required()
def update_language(lang_id):
    """Update a language"""
    user_id = get_jwt_identity()
    language = Language.query.filter_by(id=lang_id, user_id=user_id).first()

    if not language:
        return jsonify({'error': 'Language not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(language, key):
            setattr(language, key, value)

    db.session.commit()
    return jsonify({'message': 'Language updated successfully', 'language': language.to_dict()}), 200

@api_bp.route('/profile/languages/<int:lang_id>', methods=['DELETE'])
@jwt_required()
def delete_language(lang_id):
    """Delete a language"""
    user_id = get_jwt_identity()
    language = Language.query.filter_by(id=lang_id, user_id=user_id).first()

    if not language:
        return jsonify({'error': 'Language not found'}), 404

    db.session.delete(language)
    db.session.commit()
    return jsonify({'message': 'Language deleted successfully'}), 200

# Volunteer Experience endpoints
@api_bp.route('/profile/volunteer-experiences', methods=['GET'])
@api_bp.route('/profile/volunteerExperiences', methods=['GET'])  # Alias for camelCase
@jwt_required()
def get_volunteer_experiences():
    """Get all volunteer experiences for the current user"""
    user_id = get_jwt_identity()
    volunteer_experiences = VolunteerExperience.query.filter_by(user_id=user_id).order_by(VolunteerExperience.start_date.desc()).all()
    return jsonify({'volunteer_experiences': [ve.to_dict() for ve in volunteer_experiences]}), 200

@api_bp.route('/profile/volunteer-experiences', methods=['POST'])
@api_bp.route('/profile/volunteerExperiences', methods=['POST'])  # Alias for camelCase
@jwt_required()
def create_volunteer_experience():
    """Create a new volunteer experience"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'title' not in data or 'organization' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle empty date strings
    start_date = data.get('start_date') if data.get('start_date') != '' else None
    end_date = data.get('end_date') if data.get('end_date') != '' else None

    volunteer_experience = VolunteerExperience(
        user_id=user_id,
        title=data['title'],
        organization=data['organization'],
        duration=data.get('duration'),
        location=data.get('location'),
        description=data.get('description'),
        start_date=start_date,
        end_date=end_date
    )

    db.session.add(volunteer_experience)
    db.session.commit()

    return jsonify({'message': 'Volunteer experience created successfully', 'volunteer_experience': volunteer_experience.to_dict()}), 201

@api_bp.route('/profile/volunteer-experiences/<int:ve_id>', methods=['PUT'])
@api_bp.route('/profile/volunteerExperiences/<int:ve_id>', methods=['PUT'])  # Alias for camelCase
@jwt_required()
def update_volunteer_experience(ve_id):
    """Update a volunteer experience"""
    user_id = get_jwt_identity()
    volunteer_experience = VolunteerExperience.query.filter_by(id=ve_id, user_id=user_id).first()

    if not volunteer_experience:
        return jsonify({'error': 'Volunteer experience not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(volunteer_experience, key):
            setattr(volunteer_experience, key, value)

    db.session.commit()
    return jsonify({'message': 'Volunteer experience updated successfully', 'volunteer_experience': volunteer_experience.to_dict()}), 200

@api_bp.route('/profile/volunteer-experiences/<int:ve_id>', methods=['DELETE'])
@api_bp.route('/profile/volunteerExperiences/<int:ve_id>', methods=['DELETE'])  # Alias for camelCase
@jwt_required()
def delete_volunteer_experience(ve_id):
    """Delete a volunteer experience"""
    user_id = get_jwt_identity()
    volunteer_experience = VolunteerExperience.query.filter_by(id=ve_id, user_id=user_id).first()

    if not volunteer_experience:
        return jsonify({'error': 'Volunteer experience not found'}), 404

    db.session.delete(volunteer_experience)
    db.session.commit()
    return jsonify({'message': 'Volunteer experience deleted successfully'}), 200

# References endpoints
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

# Hobby Interests endpoints
@api_bp.route('/profile/hobby-interests', methods=['GET'])
@api_bp.route('/profile/hobbyInterests', methods=['GET'])  # Alias for camelCase
@jwt_required()
def get_hobby_interests():
    """Get all hobby interests for the current user"""
    user_id = get_jwt_identity()
    hobby_interests = HobbyInterest.query.filter_by(user_id=user_id).all()
    return jsonify({'hobby_interests': [hi.to_dict() for hi in hobby_interests]}), 200

@api_bp.route('/profile/hobby-interests', methods=['POST'])
@api_bp.route('/profile/hobbyInterests', methods=['POST'])  # Alias for camelCase
@jwt_required()
def create_hobby_interest():
    """Create a new hobby interest"""
    user_id = get_jwt_identity()
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

    return jsonify({'message': 'Hobby interest created successfully', 'hobby_interest': hobby_interest.to_dict()}), 201

@api_bp.route('/profile/hobby-interests/<int:hi_id>', methods=['PUT'])
@api_bp.route('/profile/hobbyInterests/<int:hi_id>', methods=['PUT'])  # Alias for camelCase
@jwt_required()
def update_hobby_interest(hi_id):
    """Update a hobby interest"""
    user_id = get_jwt_identity()
    hobby_interest = HobbyInterest.query.filter_by(id=hi_id, user_id=user_id).first()

    if not hobby_interest:
        return jsonify({'error': 'Hobby interest not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(hobby_interest, key):
            setattr(hobby_interest, key, value)

    db.session.commit()
    return jsonify({'message': 'Hobby interest updated successfully', 'hobby_interest': hobby_interest.to_dict()}), 200

@api_bp.route('/profile/hobby-interests/<int:hi_id>', methods=['DELETE'])
@api_bp.route('/profile/hobbyInterests/<int:hi_id>', methods=['DELETE'])  # Alias for camelCase
@jwt_required()
def delete_hobby_interest(hi_id):
    """Delete a hobby interest"""
    user_id = get_jwt_identity()
    hobby_interest = HobbyInterest.query.filter_by(id=hi_id, user_id=user_id).first()

    if not hobby_interest:
        return jsonify({'error': 'Hobby interest not found'}), 404

    db.session.delete(hobby_interest)
    db.session.commit()
    return jsonify({'message': 'Hobby interest deleted successfully'}), 200

# Professional Memberships endpoints
@api_bp.route('/profile/professional-memberships', methods=['GET'])
@api_bp.route('/profile/professionalMemberships', methods=['GET'])  # Alias for camelCase
@jwt_required()
def get_professional_memberships():
    """Get all professional memberships for the current user"""
    user_id = get_jwt_identity()
    professional_memberships = ProfessionalMembership.query.filter_by(user_id=user_id).order_by(ProfessionalMembership.start_date.desc()).all()
    return jsonify({'professional_memberships': [pm.to_dict() for pm in professional_memberships]}), 200

@api_bp.route('/profile/professional-memberships', methods=['POST'])
@api_bp.route('/profile/professionalMemberships', methods=['POST'])  # Alias for camelCase
@jwt_required()
def create_professional_membership():
    """Create a new professional membership"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'organization' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle empty date strings
    start_date = data.get('start_date') if data.get('start_date') != '' else None
    end_date = data.get('end_date') if data.get('end_date') != '' else None

    professional_membership = ProfessionalMembership(
        user_id=user_id,
        organization=data['organization'],
        membership_id=data.get('membership_id'),
        start_date=start_date,
        end_date=end_date,
        description=data.get('description')
    )

    db.session.add(professional_membership)
    db.session.commit()

    return jsonify({'message': 'Professional membership created successfully', 'professional_membership': professional_membership.to_dict()}), 201

@api_bp.route('/profile/professional-memberships/<int:pm_id>', methods=['PUT'])
@api_bp.route('/profile/professionalMemberships/<int:pm_id>', methods=['PUT'])  # Alias for camelCase
@jwt_required()
def update_professional_membership(pm_id):
    """Update a professional membership"""
    user_id = get_jwt_identity()
    professional_membership = ProfessionalMembership.query.filter_by(id=pm_id, user_id=user_id).first()

    if not professional_membership:
        return jsonify({'error': 'Professional membership not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(professional_membership, key):
            setattr(professional_membership, key, value)

    db.session.commit()
    return jsonify({'message': 'Professional membership updated successfully', 'professional_membership': professional_membership.to_dict()}), 200

@api_bp.route('/profile/professional-memberships/<int:pm_id>', methods=['DELETE'])
@api_bp.route('/profile/professionalMemberships/<int:pm_id>', methods=['DELETE'])  # Alias for camelCase
@jwt_required()
def delete_professional_membership(pm_id):
    """Delete a professional membership"""
    user_id = get_jwt_identity()
    professional_membership = ProfessionalMembership.query.filter_by(id=pm_id, user_id=user_id).first()

    if not professional_membership:
        return jsonify({'error': 'Professional membership not found'}), 404

    db.session.delete(professional_membership)
    db.session.commit()
    return jsonify({'message': 'Professional membership deleted successfully'}), 200

# Patents endpoints
@api_bp.route('/profile/patents', methods=['GET'])
@jwt_required()
def get_patents():
    """Get all patents for the current user"""
    user_id = get_jwt_identity()
    patents = Patent.query.filter_by(user_id=user_id).order_by(Patent.filing_date.desc()).all()
    return jsonify({'patents': [patent.to_dict() for patent in patents]}), 200

@api_bp.route('/profile/patents', methods=['POST'])
@jwt_required()
def create_patent():
    """Create a new patent"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'title' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle empty date strings
    filing_date = data.get('filing_date') if data.get('filing_date') != '' else None
    grant_date = data.get('grant_date') if data.get('grant_date') != '' else None

    patent = Patent(
        user_id=user_id,
        title=data['title'],
        patent_number=data.get('patent_number'),
        filing_date=filing_date,
        grant_date=grant_date,
        description=data.get('description'),
        inventors=json.dumps(data.get('inventors', []))
    )

    db.session.add(patent)
    db.session.commit()

    return jsonify({'message': 'Patent created successfully', 'patent': patent.to_dict()}), 201

@api_bp.route('/profile/patents/<int:patent_id>', methods=['PUT'])
@jwt_required()
def update_patent(patent_id):
    """Update a patent"""
    user_id = get_jwt_identity()
    patent = Patent.query.filter_by(id=patent_id, user_id=user_id).first()

    if not patent:
        return jsonify({'error': 'Patent not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(patent, key):
            if key == 'inventors':
                setattr(patent, key, json.dumps(value) if value else None)
            else:
                setattr(patent, key, value)

    db.session.commit()
    return jsonify({'message': 'Patent updated successfully', 'patent': patent.to_dict()}), 200

@api_bp.route('/profile/patents/<int:patent_id>', methods=['DELETE'])
@jwt_required()
def delete_patent(patent_id):
    """Delete a patent"""
    user_id = get_jwt_identity()
    patent = Patent.query.filter_by(id=patent_id, user_id=user_id).first()

    if not patent:
        return jsonify({'error': 'Patent not found'}), 404

    db.session.delete(patent)
    db.session.commit()
    return jsonify({'message': 'Patent deleted successfully'}), 200

# Course Trainings endpoints
@api_bp.route('/profile/course-trainings', methods=['GET'])
@api_bp.route('/profile/courseTrainings', methods=['GET'])  # Alias for camelCase
@jwt_required()
def get_course_trainings():
    """Get all course trainings for the current user"""
    user_id = get_jwt_identity()
    course_trainings = CourseTraining.query.filter_by(user_id=user_id).order_by(CourseTraining.completion_date.desc()).all()
    return jsonify({'course_trainings': [ct.to_dict() for ct in course_trainings]}), 200

@api_bp.route('/profile/course-trainings', methods=['POST'])
@api_bp.route('/profile/courseTrainings', methods=['POST'])  # Alias for camelCase
@jwt_required()
def create_course_training():
    """Create a new course training"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'name' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle empty date strings
    completion_date = data.get('completion_date') if data.get('completion_date') != '' else None

    course_training = CourseTraining(
        user_id=user_id,
        name=data['name'],
        provider=data.get('provider'),
        completion_date=completion_date,
        credential_id=data.get('credential_id'),
        description=data.get('description')
    )

    db.session.add(course_training)
    db.session.commit()

    return jsonify({'message': 'Course training created successfully', 'course_training': course_training.to_dict()}), 201

@api_bp.route('/profile/course-trainings/<int:ct_id>', methods=['PUT'])
@api_bp.route('/profile/courseTrainings/<int:ct_id>', methods=['PUT'])  # Alias for camelCase
@jwt_required()
def update_course_training(ct_id):
    """Update a course training"""
    user_id = get_jwt_identity()
    course_training = CourseTraining.query.filter_by(id=ct_id, user_id=user_id).first()

    if not course_training:
        return jsonify({'error': 'Course training not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(course_training, key):
            setattr(course_training, key, value)

    db.session.commit()
    return jsonify({'message': 'Course training updated successfully', 'course_training': course_training.to_dict()}), 200

@api_bp.route('/profile/course-trainings/<int:ct_id>', methods=['DELETE'])
@api_bp.route('/profile/courseTrainings/<int:ct_id>', methods=['DELETE'])  # Alias for camelCase
@jwt_required()
def delete_course_training(ct_id):
    """Delete a course training"""
    user_id = get_jwt_identity()
    course_training = CourseTraining.query.filter_by(id=ct_id, user_id=user_id).first()

    if not course_training:
        return jsonify({'error': 'Course training not found'}), 404

    db.session.delete(course_training)
    db.session.commit()
    return jsonify({'message': 'Course training deleted successfully'}), 200

# Social Media Links endpoints
@api_bp.route('/profile/social-media-links', methods=['GET'])
@api_bp.route('/profile/socialMediaLinks', methods=['GET'])  # Alias for camelCase
@jwt_required()
def get_social_media_links():
    """Get all social media links for the current user"""
    user_id = get_jwt_identity()
    social_media_links = SocialMediaLink.query.filter_by(user_id=user_id).all()
    return jsonify({'social_media_links': [sml.to_dict() for sml in social_media_links]}), 200

@api_bp.route('/profile/social-media-links', methods=['POST'])
@api_bp.route('/profile/socialMediaLinks', methods=['POST'])  # Alias for camelCase
@jwt_required()
def create_social_media_link():
    """Create a new social media link"""
    user_id = get_jwt_identity()
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

    return jsonify({'message': 'Social media link created successfully', 'social_media_link': social_media_link.to_dict()}), 201

@api_bp.route('/profile/social-media-links/<int:sml_id>', methods=['PUT'])
@api_bp.route('/profile/socialMediaLinks/<int:sml_id>', methods=['PUT'])  # Alias for camelCase
@jwt_required()
def update_social_media_link(sml_id):
    """Update a social media link"""
    user_id = get_jwt_identity()
    social_media_link = SocialMediaLink.query.filter_by(id=sml_id, user_id=user_id).first()

    if not social_media_link:
        return jsonify({'error': 'Social media link not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(social_media_link, key):
            setattr(social_media_link, key, value)

    db.session.commit()
    return jsonify({'message': 'Social media link updated successfully', 'social_media_link': social_media_link.to_dict()}), 200

@api_bp.route('/profile/social-media-links/<int:sml_id>', methods=['DELETE'])
@api_bp.route('/profile/socialMediaLinks/<int:sml_id>', methods=['DELETE'])  # Alias for camelCase
@jwt_required()
def delete_social_media_link(sml_id):
    """Delete a social media link"""
    user_id = get_jwt_identity()
    social_media_link = SocialMediaLink.query.filter_by(id=sml_id, user_id=user_id).first()

    if not social_media_link:
        return jsonify({'error': 'Social media link not found'}), 404

    db.session.delete(social_media_link)
    db.session.commit()
    return jsonify({'message': 'Social media link deleted successfully'}), 200

# Key Achievements endpoints
@api_bp.route('/profile/key-achievements', methods=['GET'])
@jwt_required()
def get_key_achievements():
    """Get all key achievements for the current user"""
    user_id = get_jwt_identity()
    key_achievements = KeyAchievement.query.filter_by(user_id=user_id).order_by(KeyAchievement.date.desc()).all()
    return jsonify({'key_achievements': [ka.to_dict() for ka in key_achievements]}), 200

@api_bp.route('/profile/key-achievements', methods=['POST'])
@jwt_required()
def create_key_achievement():
    """Create a new key achievement"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'title' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle empty date strings
    date = data.get('date') if data.get('date') != '' else None

    key_achievement = KeyAchievement(
        user_id=user_id,
        title=data['title'],
        description=data.get('description'),
        date=date,
        category=data.get('category')
    )

    db.session.add(key_achievement)
    db.session.commit()

    return jsonify({'message': 'Key achievement created successfully', 'key_achievement': key_achievement.to_dict()}), 201

@api_bp.route('/profile/key-achievements/<int:ka_id>', methods=['PUT'])
@jwt_required()
def update_key_achievement(ka_id):
    """Update a key achievement"""
    user_id = get_jwt_identity()
    key_achievement = KeyAchievement.query.filter_by(id=ka_id, user_id=user_id).first()

    if not key_achievement:
        return jsonify({'error': 'Key achievement not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(key_achievement, key):
            setattr(key_achievement, key, value)

    db.session.commit()
    return jsonify({'message': 'Key achievement updated successfully', 'key_achievement': key_achievement.to_dict()}), 200

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

# Conferences endpoints
@api_bp.route('/profile/conferences', methods=['GET'])
@jwt_required()
def get_conferences():
    """Get all conferences for the current user"""
    user_id = get_jwt_identity()
    conferences = Conference.query.filter_by(user_id=user_id).order_by(Conference.date.desc()).all()
    return jsonify({'conferences': [conf.to_dict() for conf in conferences]}), 200

@api_bp.route('/profile/conferences', methods=['POST'])
@jwt_required()
def create_conference():
    """Create a new conference"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'name' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle empty date strings
    date = data.get('date') if data.get('date') != '' else None

    conference = Conference(
        user_id=user_id,
        name=data['name'],
        role=data.get('role'),
        location=data.get('location'),
        date=date,
        description=data.get('description')
    )

    db.session.add(conference)
    db.session.commit()

    return jsonify({'message': 'Conference created successfully', 'conference': conference.to_dict()}), 201

@api_bp.route('/profile/conferences/<int:conf_id>', methods=['PUT'])
@jwt_required()
def update_conference(conf_id):
    """Update a conference"""
    user_id = get_jwt_identity()
    conference = Conference.query.filter_by(id=conf_id, user_id=user_id).first()

    if not conference:
        return jsonify({'error': 'Conference not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(conference, key):
            setattr(conference, key, value)

    db.session.commit()
    return jsonify({'message': 'Conference updated successfully', 'conference': conference.to_dict()}), 200

@api_bp.route('/profile/conferences/<int:conf_id>', methods=['DELETE'])
@jwt_required()
def delete_conference(conf_id):
    """Delete a conference"""
    user_id = get_jwt_identity()
    conference = Conference.query.filter_by(id=conf_id, user_id=user_id).first()

    if not conference:
        return jsonify({'error': 'Conference not found'}), 404

    db.session.delete(conference)
    db.session.commit()
    return jsonify({'message': 'Conference deleted successfully'}), 200

# Speaking Engagements endpoints
@api_bp.route('/profile/speaking-engagements', methods=['GET'])
@jwt_required()
def get_speaking_engagements():
    """Get all speaking engagements for the current user"""
    user_id = get_jwt_identity()
    speaking_engagements = SpeakingEngagement.query.filter_by(user_id=user_id).order_by(SpeakingEngagement.date.desc()).all()
    return jsonify({'speaking_engagements': [se.to_dict() for se in speaking_engagements]}), 200

@api_bp.route('/profile/speaking-engagements', methods=['POST'])
@jwt_required()
def create_speaking_engagement():
    """Create a new speaking engagement"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'title' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle empty date strings
    date = data.get('date') if data.get('date') != '' else None

    speaking_engagement = SpeakingEngagement(
        user_id=user_id,
        title=data['title'],
        event_name=data.get('event_name'),
        event_type=data.get('event_type'),
        location=data.get('location'),
        date=date,
        audience_size=data.get('audience_size'),
        description=data.get('description')
    )

    db.session.add(speaking_engagement)
    db.session.commit()

    return jsonify({'message': 'Speaking engagement created successfully', 'speaking_engagement': speaking_engagement.to_dict()}), 201

@api_bp.route('/profile/speaking-engagements/<int:se_id>', methods=['PUT'])
@jwt_required()
def update_speaking_engagement(se_id):
    """Update a speaking engagement"""
    user_id = get_jwt_identity()
    speaking_engagement = SpeakingEngagement.query.filter_by(id=se_id, user_id=user_id).first()

    if not speaking_engagement:
        return jsonify({'error': 'Speaking engagement not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(speaking_engagement, key):
            setattr(speaking_engagement, key, value)

    db.session.commit()
    return jsonify({'message': 'Speaking engagement updated successfully', 'speaking_engagement': speaking_engagement.to_dict()}), 200

@api_bp.route('/profile/speaking-engagements/<int:se_id>', methods=['DELETE'])
@jwt_required()
def delete_speaking_engagement(se_id):
    """Delete a speaking engagement"""
    user_id = get_jwt_identity()
    speaking_engagement = SpeakingEngagement.query.filter_by(id=se_id, user_id=user_id).first()

    if not speaking_engagement:
        return jsonify({'error': 'Speaking engagement not found'}), 404

    db.session.delete(speaking_engagement)
    db.session.commit()
    return jsonify({'message': 'Speaking engagement deleted successfully'}), 200

# Licenses endpoints
@api_bp.route('/profile/licenses', methods=['GET'])
@jwt_required()
def get_licenses():
    """Get all licenses for the current user"""
    user_id = get_jwt_identity()
    licenses = License.query.filter_by(user_id=user_id).order_by(License.issue_date.desc()).all()
    return jsonify({'licenses': [lic.to_dict() for lic in licenses]}), 200

@api_bp.route('/profile/licenses', methods=['POST'])
@jwt_required()
def create_license():
    """Create a new license"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'name' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle empty date strings
    issue_date = data.get('issue_date') if data.get('issue_date') != '' else None
    expiry_date = data.get('expiry_date') if data.get('expiry_date') != '' else None

    license_obj = License(
        user_id=user_id,
        name=data['name'],
        issuing_authority=data.get('issuing_authority'),
        license_number=data.get('license_number'),
        issue_date=issue_date,
        expiry_date=expiry_date,
        is_active=data.get('is_active', True),
        description=data.get('description')
    )

    db.session.add(license_obj)
    db.session.commit()

    return jsonify({'message': 'License created successfully', 'license': license_obj.to_dict()}), 201

@api_bp.route('/profile/licenses/<int:lic_id>', methods=['PUT'])
@jwt_required()
def update_license(lic_id):
    """Update a license"""
    user_id = get_jwt_identity()
    license_obj = License.query.filter_by(id=lic_id, user_id=user_id).first()

    if not license_obj:
        return jsonify({'error': 'License not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(license_obj, key):
            setattr(license_obj, key, value)

    db.session.commit()
    return jsonify({'message': 'License updated successfully', 'license': license_obj.to_dict()}), 200

@api_bp.route('/profile/licenses/<int:lic_id>', methods=['DELETE'])
@jwt_required()
def delete_license(lic_id):
    """Delete a license"""
    user_id = get_jwt_identity()
    license_obj = License.query.filter_by(id=lic_id, user_id=user_id).first()

    if not license_obj:
        return jsonify({'error': 'License not found'}), 404

    db.session.delete(license_obj)
    db.session.commit()
# Get full profile for a specific user (for organization admins viewing team members)
@api_bp.route('/profile/user/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_profile(user_id):
    """Get full profile data for a specific user (self-access or organization admin access)"""
    current_user_id = get_jwt_identity()

    # Get current user
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'Current user not found'}), 404

    # Allow users to access their own profile
    if current_user_id == user_id:
        target_user = User.query.get(user_id)
        if not target_user:
            return jsonify({'error': 'User not found'}), 404
        is_team_member = True  # User viewing their own profile
    else:
        # For organization users accessing other users' profiles (for hiring purposes)
        if current_user.organization_id and current_user.role == 'organization':
            # Organization users can view any individual user's profile for hiring
            target_user = User.query.filter_by(id=user_id, role='individual').first()
            if not target_user:
                return jsonify({'error': 'User not found'}), 404

            # Check if target user is a formal team member in the organization
            target_team_member = TeamMember.query.filter_by(
                organization_id=current_user.organization_id,
                user_id=user_id
            ).first()

            is_team_member = target_team_member is not None
        else:
            # Regular users can only view profiles within their organization
            if not current_user.organization_id:
                return jsonify({'error': 'Unauthorized - Organization membership required'}), 403

            # Check if target user belongs to the same organization
            target_user = User.query.filter_by(
                id=user_id,
                organization_id=current_user.organization_id
            ).first()

            if not target_user:
                return jsonify({'error': 'User not found in your organization'}), 404

            # Check if target user is a formal team member
            target_team_member = TeamMember.query.filter_by(
                organization_id=current_user.organization_id,
                user_id=user_id
            ).first()

            is_team_member = target_team_member is not None

    # Fetch all profile data for the target user
    profile_data = {
        'user': target_user.to_dict(),
        'experiences': [exp.to_dict() for exp in Experience.query.filter_by(user_id=user_id).order_by(Experience.start_date.desc()).all()],
        'educations': [edu.to_dict() for edu in Education.query.filter_by(user_id=user_id).order_by(Education.start_date.desc()).all()],
        'skills': [skill.to_dict() for skill in Skill.query.filter_by(user_id=user_id).all()],
        'projects': [project.to_dict() for project in Project.query.filter_by(user_id=user_id).order_by(Project.start_date.desc()).all()],
        'publications': [pub.to_dict() for pub in Publication.query.filter_by(user_id=user_id).order_by(Publication.year.desc()).all()],
        'awards': [award.to_dict() for award in Award.query.filter_by(user_id=user_id).order_by(Award.date.desc()).all()],
        'certifications': [cert.to_dict() for cert in Certification.query.filter_by(user_id=user_id).order_by(Certification.date_obtained.desc()).all()],
        'languages': [lang.to_dict() for lang in Language.query.filter_by(user_id=user_id).all()],
        'volunteer_experiences': [ve.to_dict() for ve in VolunteerExperience.query.filter_by(user_id=user_id).order_by(VolunteerExperience.start_date.desc()).all()],
        'references': [ref.to_dict() for ref in Reference.query.filter_by(user_id=user_id).all()],
        'hobby_interests': [hi.to_dict() for hi in HobbyInterest.query.filter_by(user_id=user_id).all()],
        'professional_memberships': [pm.to_dict() for pm in ProfessionalMembership.query.filter_by(user_id=user_id).order_by(ProfessionalMembership.start_date.desc()).all()],
        'patents': [patent.to_dict() for patent in Patent.query.filter_by(user_id=user_id).order_by(Patent.filing_date.desc()).all()],
        'course_trainings': [ct.to_dict() for ct in CourseTraining.query.filter_by(user_id=user_id).order_by(CourseTraining.completion_date.desc()).all()],
        'social_media_links': [sml.to_dict() for sml in SocialMediaLink.query.filter_by(user_id=user_id).all()],
        'key_achievements': [ka.to_dict() for ka in KeyAchievement.query.filter_by(user_id=user_id).order_by(KeyAchievement.date.desc()).all()],
        'conferences': [conf.to_dict() for conf in Conference.query.filter_by(user_id=user_id).order_by(Conference.date.desc()).all()],
        'speaking_engagements': [se.to_dict() for se in SpeakingEngagement.query.filter_by(user_id=user_id).order_by(SpeakingEngagement.date.desc()).all()],
        'licenses': [lic.to_dict() for lic in License.query.filter_by(user_id=user_id).order_by(License.issue_date.desc()).all()],
    }

    # Add team membership status
    profile_data['is_team_member'] = is_team_member
    profile_data['team_member_info'] = target_team_member.to_dict() if target_team_member else None

    return jsonify(profile_data), 200

# Profile Picture Upload endpoint
@api_bp.route('/profile/upload-profile-picture', methods=['POST'])
@jwt_required()
def upload_profile_picture():
    """Upload a profile picture for the current user"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

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
    if len(file.read()) > 5 * 1024 * 1024:  # 5MB
        return jsonify({'error': 'File too large. Maximum size is 5MB'}), 400

    # Reset file pointer
    file.seek(0)

    # Secure filename and create unique filename
    filename = secure_filename(file.filename)
    extension = filename.rsplit('.', 1)[1].lower()
    unique_filename = f"user_{user_id}_profile.{extension}"

    # Save file
    upload_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'profile_pictures', unique_filename)
    file.save(upload_path)

    # Update user profile picture path
    profile_picture_url = f"/uploads/profile_pictures/{unique_filename}"
    user.profile_picture = profile_picture_url
    db.session.commit()

    return jsonify({
        'message': 'Profile picture uploaded successfully',
        'profile_picture': profile_picture_url
    }), 200
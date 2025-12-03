from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import Education, Skill, Language
from datetime import datetime

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
    
    # Handle date fields specially
    for key, value in data.items():
        if hasattr(education, key):
            if key in ['start_date', 'end_date']:
                if value and value != '':
                    try:
                        setattr(education, key, datetime.strptime(value, '%Y-%m-%d').date())
                    except ValueError:
                        return jsonify({'error': f'Invalid {key} format. Use YYYY-MM-DD'}), 400
                else:
                    setattr(education, key, None)
            else:
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
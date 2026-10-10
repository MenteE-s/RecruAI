from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...utils.timezone_utils import utc_now_iso, utc_iso
from ...extensions import db
from ...models import Education, Skill, Language
from datetime import datetime
from ...utils.kafka_service import kafka_service as kafka

# Education endpoints
@api_bp.route('/profile/educations', methods=['GET'])
@jwt_required()
def get_educations():
    """Get all education records for the current user"""
    user_id = int(get_jwt_identity())
    educations = Education.query.filter_by(user_id=user_id).order_by(Education.start_date.desc()).all()
    return jsonify({'educations': [edu.to_dict() for edu in educations]}), 200

@api_bp.route('/profile/educations', methods=['POST'])
@jwt_required()
def create_education():
    """Create a new education record"""
    user_id = int(get_jwt_identity())
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

    # Emit Kafka event for education creation
    kafka.emit_event('profile_education_created', {
        'education_id': education.id,
        'user_id': user_id,
        'degree': education.degree,
        'school': education.school,
        'timestamp': utc_now_iso()
    })

    return jsonify({'message': 'Education record created successfully', 'education': education.to_dict()}), 201

@api_bp.route('/profile/educations/<int:edu_id>', methods=['PUT'])
@jwt_required()
def update_education(edu_id):
    """Update an education record"""
    user_id = int(get_jwt_identity())
    education = Education.query.filter_by(id=edu_id, user_id=user_id).first()

    if not education:
        return jsonify({'error': 'Education record not found'}), 404

    data = request.get_json()
    
    # Handle date fields specially
    for key, value in data.items():
        if key not in ('id', 'user_id', 'created_at', 'updated_at', 'organization_id') and hasattr(education, key):
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

    # Emit Kafka event for education update
    kafka.emit_event('profile_education_updated', {
        'education_id': education.id,
        'user_id': user_id,
        'degree': education.degree,
        'school': education.school,
        'timestamp': utc_now_iso()
    })

    return jsonify({'message': 'Education record updated successfully', 'education': education.to_dict()}), 200

@api_bp.route('/profile/educations/<int:edu_id>', methods=['DELETE'])
@jwt_required()
def delete_education(edu_id):
    """Delete an education record"""
    user_id = int(get_jwt_identity())
    education = Education.query.filter_by(id=edu_id, user_id=user_id).first()

    if not education:
        return jsonify({'error': 'Education record not found'}), 404

    edu_id_val = education.id
    db.session.delete(education)
    db.session.commit()

    # Emit Kafka event for education deletion
    kafka.emit_event('profile_education_deleted', {
        'education_id': edu_id_val,
        'user_id': user_id,
        'timestamp': utc_now_iso()
    })

    return jsonify({'message': 'Education record deleted successfully'}), 200

# Fields a client may set on its own skills. Everything else is server-owned:
# verified / evidence_source / evidence_detail / last_assessed_at are written
# only by the assessment write-back, and letting a client set them would let
# anyone mark their own skill "verified by assessment" without taking a test.
CLIENT_SETTABLE_SKILL_FIELDS = frozenset({'name', 'level', 'years_experience',
                                           'skill_slug'})


# Skills endpoints
@api_bp.route('/profile/skills', methods=['GET'])
@jwt_required()
def get_skills():
    """Get all skills for the current user"""
    user_id = int(get_jwt_identity())
    skills = Skill.query.filter_by(user_id=user_id).all()
    return jsonify({'skills': [skill.to_dict() for skill in skills]}), 200

@api_bp.route('/profile/skills', methods=['POST'])
@jwt_required()
def create_skill():
    """Create a new skill.

    The slug is resolved from the taxonomy when the client does not send a
    valid one, so a user typing "Postgres" gets a skill the rest of CVAI can
    count. An uncatalogued name is still accepted with a NULL slug rather than
    rejected: refusing to let someone list a skill we have never heard of is a
    worse failure than storing it uncatalogued.
    """
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or 'name' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'Skill name cannot be empty'}), 400

    from ...utils.skill_taxonomy import normalize_level, resolve
    from ...models.skill import EVIDENCE_SELF_DECLARED

    entry = resolve(data.get('skill_slug') or name)
    level = normalize_level(data.get('level'))
    if data.get('level') and level is None:
        return jsonify({
            'error': 'level must be one of: Beginner, Intermediate, Advanced, Expert'
        }), 400

    skill = Skill(
        user_id=user_id,
        name=name,
        skill_slug=entry['slug'] if entry else None,
        level=level,
        years_experience=data.get('years_experience'),
        evidence_source=EVIDENCE_SELF_DECLARED,
        # A skill someone just typed is a claim, never evidence.
        verified=False,
    )

    db.session.add(skill)
    db.session.commit()

    return jsonify({'message': 'Skill created successfully', 'skill': skill.to_dict()}), 201

@api_bp.route('/profile/skills/<int:skill_id>', methods=['PUT'])
@jwt_required()
def update_skill(skill_id):
    """Update a skill"""
    user_id = int(get_jwt_identity())
    skill = Skill.query.filter_by(id=skill_id, user_id=user_id).first()

    if not skill:
        return jsonify({'error': 'Skill not found'}), 404

    data = request.get_json() or {}
    from ...utils.skill_taxonomy import normalize_level, resolve

    for key, value in data.items():
        if key not in CLIENT_SETTABLE_SKILL_FIELDS:
            continue
        if key == 'level':
            canonical = normalize_level(value)
            if value and canonical is None:
                return jsonify({
                    'error': 'level must be one of: Beginner, Intermediate, Advanced, Expert'
                }), 400
            # Only overwrite a measurement with another measurement: an edit by
            # the user must not quietly discard an assessment result.
            if skill.evidence_source == 'assessment' and skill.verified and value:
                return jsonify({
                    'error': 'This skill level comes from an assessment and cannot be '
                             'edited by hand. Retake the assessment to change it.'
                }), 409
            skill.level = canonical
        elif key == 'skill_slug':
            entry = resolve(value) if value else None
            skill.skill_slug = entry['slug'] if entry else None
        else:
            setattr(skill, key, value)

    db.session.commit()
    return jsonify({'message': 'Skill updated successfully', 'skill': skill.to_dict()}), 200

@api_bp.route('/profile/skills/<int:skill_id>', methods=['DELETE'])
@jwt_required()
def delete_skill(skill_id):
    """Delete a skill"""
    user_id = int(get_jwt_identity())
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
    user_id = int(get_jwt_identity())
    languages = Language.query.filter_by(user_id=user_id).all()
    return jsonify({'languages': [lang.to_dict() for lang in languages]}), 200

@api_bp.route('/profile/languages', methods=['POST'])
@jwt_required()
def create_language():
    """Create a new language"""
    user_id = int(get_jwt_identity())
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
    user_id = int(get_jwt_identity())
    language = Language.query.filter_by(id=lang_id, user_id=user_id).first()

    if not language:
        return jsonify({'error': 'Language not found'}), 404

    data = request.get_json()
    for key, value in data.items():
        if key not in ('id', 'user_id', 'created_at', 'updated_at', 'organization_id') and hasattr(language, key):
            setattr(language, key, value)

    db.session.commit()
    return jsonify({'message': 'Language updated successfully', 'language': language.to_dict()}), 200

@api_bp.route('/profile/languages/<int:lang_id>', methods=['DELETE'])
@jwt_required()
def delete_language(lang_id):
    """Delete a language"""
    user_id = int(get_jwt_identity())
    language = Language.query.filter_by(id=lang_id, user_id=user_id).first()

    if not language:
        return jsonify({'error': 'Language not found'}), 404

    db.session.delete(language)
    db.session.commit()
    return jsonify({'message': 'Language deleted successfully'}), 200

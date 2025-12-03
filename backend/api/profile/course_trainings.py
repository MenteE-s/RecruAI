from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import CourseTraining
from datetime import datetime

# Course Training endpoints
@api_bp.route('/profile/course-trainings', methods=['GET'])
@jwt_required()
def get_course_trainings():
    """Get all course trainings for the current user"""
    user_id = int(get_jwt_identity())
    course_trainings = CourseTraining.query.filter_by(user_id=user_id).order_by(CourseTraining.completion_date.desc()).all()
    return jsonify({'courseTrainings': [ct.to_dict() for ct in course_trainings]}), 200

@api_bp.route('/profile/course-trainings', methods=['POST'])
@jwt_required()
def create_course_training():
    """Create a new course training"""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or 'name' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle completion date
    completion_date = None
    if data.get('completion_date') and data.get('completion_date') != '':
        try:
            completion_date = datetime.strptime(data['completion_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid completion_date format. Use YYYY-MM-DD'}), 400

    course_training = CourseTraining(
        user_id=user_id,
        name=data['name'],
        provider=data.get('provider'),
        platform=data.get('platform'),
        completion_date=completion_date,
        credential_id=data.get('credential_id'),
        description=data.get('description')
    )

    db.session.add(course_training)
    db.session.commit()

    return jsonify({'message': 'Course training created successfully', 'courseTraining': course_training.to_dict()}), 201

@api_bp.route('/profile/course-trainings/<int:ct_id>', methods=['PUT'])
@jwt_required()
def update_course_training(ct_id):
    """Update a course training"""
    user_id = int(get_jwt_identity())
    course_training = CourseTraining.query.filter_by(id=ct_id, user_id=user_id).first()

    if not course_training:
        return jsonify({'error': 'Course training not found'}), 404

    data = request.get_json()

    # Handle completion date update
    if 'completion_date' in data:
        if data['completion_date'] and data['completion_date'] != '':
            try:
                course_training.completion_date = datetime.strptime(data['completion_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid completion_date format. Use YYYY-MM-DD'}), 400
        else:
            course_training.completion_date = None

    # Update other fields
    for key, value in data.items():
        if key != 'completion_date' and hasattr(course_training, key):
            setattr(course_training, key, value)

    db.session.commit()
    return jsonify({'message': 'Course training updated successfully', 'courseTraining': course_training.to_dict()}), 200

@api_bp.route('/profile/course-trainings/<int:ct_id>', methods=['DELETE'])
@jwt_required()
def delete_course_training(ct_id):
    """Delete a course training"""
    user_id = int(get_jwt_identity())
    course_training = CourseTraining.query.filter_by(id=ct_id, user_id=user_id).first()

    if not course_training:
        return jsonify({'error': 'Course training not found'}), 404

    db.session.delete(course_training)
    db.session.commit()
    return jsonify({'message': 'Course training deleted successfully'}), 200

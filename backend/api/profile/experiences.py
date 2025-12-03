from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import Experience, Project
import json
from datetime import datetime

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
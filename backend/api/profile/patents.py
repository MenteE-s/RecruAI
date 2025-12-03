from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import Patent
from datetime import datetime
import json

# Patent endpoints
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

    # Handle dates
    filing_date = None
    grant_date = None

    if data.get('filing_date') and data.get('filing_date') != '':
        try:
            filing_date = datetime.strptime(data['filing_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid filing_date format. Use YYYY-MM-DD'}), 400

    if data.get('grant_date') and data.get('grant_date') != '':
        try:
            grant_date = datetime.strptime(data['grant_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid grant_date format. Use YYYY-MM-DD'}), 400

    patent = Patent(
        user_id=user_id,
        title=data['title'],
        patent_number=data.get('patent_number'),
        filing_date=filing_date,
        grant_date=grant_date,
        inventors=json.dumps(data.get('inventors', [])),
        description=data.get('description')
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

    # Handle date updates
    if 'filing_date' in data:
        if data['filing_date'] and data['filing_date'] != '':
            try:
                patent.filing_date = datetime.strptime(data['filing_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid filing_date format. Use YYYY-MM-DD'}), 400
        else:
            patent.filing_date = None

    if 'grant_date' in data:
        if data['grant_date'] and data['grant_date'] != '':
            try:
                patent.grant_date = datetime.strptime(data['grant_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid grant_date format. Use YYYY-MM-DD'}), 400
        else:
            patent.grant_date = None

    # Handle inventors array
    if 'inventors' in data:
        patent.inventors = json.dumps(data['inventors'])

    # Update other fields
    for key, value in data.items():
        if key not in ['filing_date', 'grant_date', 'inventors'] and hasattr(patent, key):
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
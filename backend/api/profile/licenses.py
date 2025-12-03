from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import License
from datetime import datetime

# License endpoints
@api_bp.route('/profile/licenses', methods=['GET'])
@jwt_required()
def get_licenses():
    """Get all licenses for the current user"""
    user_id = get_jwt_identity()
    licenses = License.query.filter_by(user_id=user_id).order_by(License.issue_date.desc()).all()
    return jsonify({'licenses': [license.to_dict() for license in licenses]}), 200

@api_bp.route('/profile/licenses', methods=['POST'])
@jwt_required()
def create_license():
    """Create a new license"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'name' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle dates
    issue_date = None
    expiry_date = None

    if data.get('issue_date') and data.get('issue_date') != '':
        try:
            issue_date = datetime.strptime(data['issue_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid issue_date format. Use YYYY-MM-DD'}), 400

    if data.get('expiry_date') and data.get('expiry_date') != '':
        try:
            expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid expiry_date format. Use YYYY-MM-DD'}), 400

    license = License(
        user_id=user_id,
        name=data['name'],
        issuing_authority=data.get('issuing_authority'),
        license_number=data.get('license_number'),
        issue_date=issue_date,
        expiry_date=expiry_date,
        is_active=data.get('is_active', True),
        description=data.get('description')
    )

    db.session.add(license)
    db.session.commit()

    return jsonify({'message': 'License created successfully', 'license': license.to_dict()}), 201

@api_bp.route('/profile/licenses/<int:license_id>', methods=['PUT'])
@jwt_required()
def update_license(license_id):
    """Update a license"""
    user_id = get_jwt_identity()
    license = License.query.filter_by(id=license_id, user_id=user_id).first()

    if not license:
        return jsonify({'error': 'License not found'}), 404

    data = request.get_json()

    # Handle date updates
    if 'issue_date' in data:
        if data['issue_date'] and data['issue_date'] != '':
            try:
                license.issue_date = datetime.strptime(data['issue_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid issue_date format. Use YYYY-MM-DD'}), 400
        else:
            license.issue_date = None

    if 'expiry_date' in data:
        if data['expiry_date'] and data['expiry_date'] != '':
            try:
                license.expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid expiry_date format. Use YYYY-MM-DD'}), 400
        else:
            license.expiry_date = None

    # Update other fields
    for key, value in data.items():
        if key not in ['issue_date', 'expiry_date'] and hasattr(license, key):
            setattr(license, key, value)

    db.session.commit()
    return jsonify({'message': 'License updated successfully', 'license': license.to_dict()}), 200

@api_bp.route('/profile/licenses/<int:license_id>', methods=['DELETE'])
@jwt_required()
def delete_license(license_id):
    """Delete a license"""
    user_id = get_jwt_identity()
    license = License.query.filter_by(id=license_id, user_id=user_id).first()

    if not license:
        return jsonify({'error': 'License not found'}), 404

    db.session.delete(license)
    db.session.commit()
    return jsonify({'message': 'License deleted successfully'}), 200
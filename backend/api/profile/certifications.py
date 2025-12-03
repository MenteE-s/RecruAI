from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import Certification
from datetime import datetime

# Certification endpoints
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

    # Handle dates
    date_obtained = None
    expiry_date = None

    if data.get('date_obtained') and data.get('date_obtained') != '':
        try:
            date_obtained = datetime.strptime(data['date_obtained'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date_obtained format. Use YYYY-MM-DD'}), 400

    if data.get('expiry_date') and data.get('expiry_date') != '':
        try:
            expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid expiry_date format. Use YYYY-MM-DD'}), 400

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

    # Handle date updates
    if 'date_obtained' in data:
        if data['date_obtained'] and data['date_obtained'] != '':
            try:
                certification.date_obtained = datetime.strptime(data['date_obtained'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date_obtained format. Use YYYY-MM-DD'}), 400
        else:
            certification.date_obtained = None

    if 'expiry_date' in data:
        if data['expiry_date'] and data['expiry_date'] != '':
            try:
                certification.expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid expiry_date format. Use YYYY-MM-DD'}), 400
        else:
            certification.expiry_date = None

    # Update other fields
    for key, value in data.items():
        if key not in ['date_obtained', 'expiry_date'] and hasattr(certification, key):
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
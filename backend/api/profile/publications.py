from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import Publication
import json

# Publication endpoints
@api_bp.route('/profile/publications', methods=['GET'])
@jwt_required()
def get_publications():
    """Get all publications for the current user"""
    user_id = int(get_jwt_identity())
    publications = Publication.query.filter_by(user_id=user_id).order_by(Publication.year.desc()).all()
    return jsonify({'publications': [pub.to_dict() for pub in publications]}), 200

@api_bp.route('/profile/publications', methods=['POST'])
@jwt_required()
def create_publication():
    """Create a new publication"""
    user_id = int(get_jwt_identity())
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
    user_id = int(get_jwt_identity())
    publication = Publication.query.filter_by(id=pub_id, user_id=user_id).first()

    if not publication:
        return jsonify({'error': 'Publication not found'}), 404

    data = request.get_json()

    # Handle authors array
    if 'authors' in data:
        publication.authors = json.dumps(data['authors'])

    # Update other fields
    for key, value in data.items():
        if key != 'authors' and hasattr(publication, key):
            setattr(publication, key, value)

    db.session.commit()
    return jsonify({'message': 'Publication updated successfully', 'publication': publication.to_dict()}), 200

@api_bp.route('/profile/publications/<int:pub_id>', methods=['DELETE'])
@jwt_required()
def delete_publication(pub_id):
    """Delete a publication"""
    user_id = int(get_jwt_identity())
    publication = Publication.query.filter_by(id=pub_id, user_id=user_id).first()

    if not publication:
        return jsonify({'error': 'Publication not found'}), 404

    db.session.delete(publication)
    db.session.commit()
    return jsonify({'message': 'Publication deleted successfully'}), 200

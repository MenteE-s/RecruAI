from flask import request, jsonify

from . import api_bp
from ..extensions import db
from ..models import User


@api_bp.route("/users", methods=["GET"])
def list_users():
    users = User.query.order_by(User.id.asc()).all()
    return jsonify([u.to_dict() for u in users]), 200


@api_bp.route("/users", methods=["POST"])
def create_user():
    payload = request.get_json(silent=True) or {}
    email = payload.get("email")
    name = payload.get("name")
    if not email:
        return jsonify({"error": "email required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "email already exists"}), 400

    user = User(email=email, name=name)
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

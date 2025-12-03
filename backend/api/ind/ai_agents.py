from flask import Blueprint, jsonify, request
from ...extensions import db
from ...models import AIInterviewAgent, User

api_bp = Blueprint('ind_ai_agents', __name__)


@api_bp.route('/users/<int:user_id>/ai-agents', methods=['GET'])
def list_user_ai_agents(user_id):
    agents = AIInterviewAgent.query.filter_by(owner_user_id=user_id).all()
    return jsonify({'agents': [a.to_dict() for a in agents]}), 200


@api_bp.route('/users/<int:user_id>/ai-agents', methods=['POST'])
def create_user_ai_agent(user_id):
    payload = request.get_json() or {}
    name = payload.get('name')
    industry = payload.get('industry')
    description = payload.get('description', '')
    custom_instructions = payload.get('custom_instructions', '')

    if not name:
        return jsonify({'error': 'name is required'}), 400

    agent = AIInterviewAgent(
        name=name,
        industry=industry,
        description=description,
        custom_instructions=custom_instructions,
        owner_user_id=user_id,
    )
    db.session.add(agent)
    db.session.commit()
    return jsonify({'agent': agent.to_dict()}), 201


@api_bp.route('/users/<int:user_id>/ai-agents/<int:agent_id>', methods=['PUT'])
def update_user_ai_agent(user_id, agent_id):
    agent = AIInterviewAgent.query.filter_by(id=agent_id, owner_user_id=user_id).first_or_404()
    payload = request.get_json() or {}
    for field in ['name', 'industry', 'description', 'custom_instructions']:
        if field in payload:
            setattr(agent, field, payload[field])
    db.session.commit()
    return jsonify({'agent': agent.to_dict()}), 200


@api_bp.route('/users/<int:user_id>/ai-agents/<int:agent_id>', methods=['DELETE'])
def delete_user_ai_agent(user_id, agent_id):
    agent = AIInterviewAgent.query.filter_by(id=agent_id, owner_user_id=user_id).first_or_404()
    db.session.delete(agent)
    db.session.commit()
    return jsonify({'message': 'deleted'}), 200

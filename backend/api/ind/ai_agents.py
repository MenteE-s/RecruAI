from flask import Blueprint, jsonify, request
from ...extensions import db
from ...models import AIInterviewAgent, User
from ...utils.kafka_service import KafkaService

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
    
    # Emit Kafka event for agent creation
    try:
        kafka = KafkaService()
        kafka.emit_event('personal_agent_created', {
            'agent_id': agent.id,
            'user_id': user_id,
            'name': name,
            'industry': industry
        })
    except Exception as ke:
        print(f"Failed to emit Kafka message for personal agent creation: {ke}")
        
    return jsonify({'agent': agent.to_dict()}), 201


@api_bp.route('/users/<int:user_id>/ai-agents/<int:agent_id>', methods=['PUT'])
def update_user_ai_agent(user_id, agent_id):
    agent = AIInterviewAgent.query.filter_by(id=agent_id, owner_user_id=user_id).first_or_404()
    payload = request.get_json() or {}
    for field in ['name', 'industry', 'description', 'custom_instructions']:
        if field in payload:
            setattr(agent, field, payload[field])
    db.session.commit()
    
    # Emit Kafka event for agent update
    try:
        kafka = KafkaService()
        kafka.emit_event('personal_agent_updated', {
            'agent_id': agent_id,
            'user_id': user_id,
            'fields_updated': list(payload.keys())
        })
    except Exception as ke:
        print(f"Failed to emit Kafka message for personal agent update: {ke}")
        
    return jsonify({'agent': agent.to_dict()}), 200


@api_bp.route('/users/<int:user_id>/ai-agents/<int:agent_id>', methods=['DELETE'])
def delete_user_ai_agent(user_id, agent_id):
    agent = AIInterviewAgent.query.filter_by(id=agent_id, owner_user_id=user_id).first_or_404()
    db.session.delete(agent)
    db.session.commit()
    
    # Emit Kafka event for agent deletion
    try:
        kafka = KafkaService()
        kafka.emit_event('personal_agent_deleted', {
            'agent_id': agent_id,
            'user_id': user_id
        })
    except Exception as ke:
        print(f"Failed to emit Kafka message for personal agent deletion: {ke}")
        
    return jsonify({'message': 'deleted'}), 200

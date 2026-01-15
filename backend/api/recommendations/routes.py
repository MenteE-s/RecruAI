"""
Recommendations API Routes for RecruAI
"""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import sessionmaker

from ...extensions import db
from ...recommendations.tools.supervisor import RecommendationSupervisor
from ...models import User, SavedJob, AIInterviewAgent, Organization
from ...utils.kafka_service import kafka_service


logger = logging.getLogger(__name__)

recommendations_bp = Blueprint('recommendations', __name__, url_prefix='/api/recommendations')

# Initialize recommendation supervisor
supervisor = RecommendationSupervisor()


def get_supervisor():
    """Get supervisor instance with database engine"""
    if not supervisor.db_engine:
        supervisor.db_engine = db.engine
        supervisor._session_factory = sessionmaker(bind=db.engine)
        supervisor.retriever.db_engine = db.engine
        supervisor.retriever._session_factory = sessionmaker(bind=db.engine)
    return supervisor


@recommendations_bp.route('/candidates/<job_id>', methods=['GET'])
@jwt_required()
def recommend_candidates(job_id):
    """Get recommended candidates for a job posting"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Get query parameters
        top_k = request.args.get('top_k', 10, type=int)
        include_explanations = request.args.get('explanations', 'true').lower() == 'true'

        supervisor = get_supervisor()

        # Get recommendations
        recommendations = supervisor.recommend_candidates_for_job(
            job_id=job_id,
            organization_id=str(user.organization_id) if user.organization_id else None,
            top_k=top_k,
            include_explanations=include_explanations
        )

        # Emit Kafka event
        kafka_service.emit_event(
            "recommendation_candidates_requested",
            {
                "user_id": current_user_id,
                "job_id": job_id,
                "count": len(recommendations),
                "message": f"Candidate recommendations requested for job {job_id}"
            },
            user_id=current_user_id
        )

        return jsonify({
            'job_id': job_id,
            'recommendations': recommendations,
            'total': len(recommendations)
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error recommending candidates: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@recommendations_bp.route('/jobs', methods=['GET'])
@jwt_required()
def recommend_jobs():
    """Get recommended jobs for the current user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Get query parameters
        top_k = request.args.get('top_k', 10, type=int)
        include_explanations = request.args.get('explanations', 'true').lower() == 'true'

        supervisor = get_supervisor()

        # Get recommendations
        recommendations = supervisor.recommend_jobs_for_profile(
            user_id=str(user.id),
            organization_id=str(user.organization_id) if user.organization_id else None,
            top_k=top_k,
            include_explanations=include_explanations
        )

        # Emit Kafka event
        kafka_service.emit_event(
            "recommendation_jobs_requested",
            {
                "user_id": current_user_id,
                "count": len(recommendations),
                "message": "Job recommendations requested for profile"
            },
            user_id=current_user_id
        )

        return jsonify({
            'user_id': str(user.id),
            'recommendations': recommendations,
            'total': len(recommendations)
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error recommending jobs: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@recommendations_bp.route('/agents/<job_id>', methods=['GET'])
@jwt_required()
def recommend_agents(job_id):
    """Get recommended AI agents for interviewing candidates for a job"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Get query parameters
        top_k = request.args.get('top_k', 5, type=int)
        include_explanations = request.args.get('explanations', 'true').lower() == 'true'

        supervisor = get_supervisor()

        # Get recommendations
        recommendations = supervisor.recommend_agents_for_job(
            job_id=job_id,
            organization_id=str(user.organization_id) if user.organization_id else None,
            top_k=top_k,
            include_explanations=include_explanations
        )

        return jsonify({
            'job_id': job_id,
            'recommendations': recommendations,
            'total': len(recommendations)
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error recommending agents: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@recommendations_bp.route('/embed/profile', methods=['POST'])
@jwt_required()
def embed_profile():
    """Embed a user profile for recommendations"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'Profile data is required'}), 400

        supervisor = get_supervisor()

        # Embed and store profile
        success = supervisor.embed_and_store_profile(
            user_id=str(user.id),
            profile_data=data,
            organization_id=str(user.organization_id) if user.organization_id else None
        )

        if success:
            return jsonify({'message': 'Profile embedded successfully'})
        else:
            return jsonify({'error': 'Failed to embed profile'}), 500

    except Exception as e:
        logger.error(f"Error embedding profile: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@recommendations_bp.route('/embed/job/<job_id>', methods=['POST'])
@jwt_required()
def embed_job(job_id):
    """Embed a job posting for recommendations"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'Job data is required'}), 400

        supervisor = get_supervisor()

        # Embed and store job
        success = supervisor.embed_and_store_job(
            job_id=job_id,
            job_data=data,
            organization_id=str(user.organization_id) if user.organization_id else None
        )

        if success:
            return jsonify({'message': 'Job embedded successfully'})
        else:
            return jsonify({'error': 'Failed to embed job'}), 500

    except Exception as e:
        logger.error(f"Error embedding job: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@recommendations_bp.route('/embed/agent/<agent_id>', methods=['POST'])
@jwt_required()
def embed_agent(agent_id):
    """Embed an AI agent for recommendations"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'Agent data is required'}), 400

        supervisor = get_supervisor()

        # Embed and store agent
        success = supervisor.embed_and_store_agent(
            agent_id=agent_id,
            agent_data=data,
            organization_id=str(user.organization_id) if user.organization_id else None
        )

        if success:
            return jsonify({'message': 'Agent embedded successfully'})
        else:
            return jsonify({'error': 'Failed to embed agent'}), 500

    except Exception as e:
        logger.error(f"Error embedding agent: {e}")
        return jsonify({'error': 'Internal server error'}), 500
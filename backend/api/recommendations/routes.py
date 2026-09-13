"""
Recommendations API Routes for RecruAI
"""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import sessionmaker

from ...extensions import db
from ...recommendations.tools.supervisor import RecommendationSupervisor
from ...models import User, SavedJob, AIInterviewAgent, Organization, Post, TeamMember
from ...utils.kafka_service import kafka_service


def _managed_org_ids(user):
    ids = set()
    if user.organization_id:
        ids.add(user.organization_id)
    for tm in TeamMember.query.filter_by(user_id=user.id).all():
        ids.add(tm.organization_id)
    return ids


def _is_hiring_user(user):
    """Only organization-side users may browse other candidates."""
    return user.role == "organization" or bool(_managed_org_ids(user))


def _owns_job(user, job_id):
    try:
        post = Post.query.get(int(job_id))
    except (TypeError, ValueError):
        return False
    return post is not None and post.organization_id in _managed_org_ids(user)


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
        if not _is_hiring_user(user):
            return jsonify({'error': 'Forbidden: organization account required'}), 403
        if not _owns_job(user, job_id):
            return jsonify({'error': 'Forbidden for this job'}), 403

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
            }
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
            }
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
        if not _is_hiring_user(user):
            return jsonify({'error': 'Forbidden: organization account required'}), 403
        if not _owns_job(user, job_id):
            return jsonify({'error': 'Forbidden for this job'}), 403

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


@recommendations_bp.route('/search', methods=['POST'])
@jwt_required()
def search_profiles():
    """Search profiles by text query using Postgres full-text search (no ML)."""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        if not _is_hiring_user(user):
            return jsonify({'error': 'Forbidden: organization account required'}), 403

        data = request.get_json()
        if not data or not data.get('query'):
            return jsonify({'error': 'Search query is required'}), 400

        top_k = data.get('top_k', 50)
        generate_ai = data.get('ai_explanations', False)
        page = data.get('page', 1)
        per_page = data.get('per_page', 10)
        min_similarity = data.get('min_similarity', 0.15)
        filters = data.get('filters') or {}

        def _to_float(v):
            try:
                return float(v) if v is not None and v != '' else None
            except (TypeError, ValueError):
                return None

        supervisor = get_supervisor()

        result = supervisor.search_profiles_by_text(
            query=data['query'],
            organization_id=str(user.organization_id) if user.organization_id else None,
            top_k=top_k,
            generate_ai_explanations=generate_ai,
            user_id=str(user.id),
            page=page,
            per_page=per_page,
            min_similarity=float(min_similarity or 0),
            employment_status=filters.get('employment_status') or None,
            plan=filters.get('plan') or None,
            min_exp=_to_float(filters.get('min_exp')),
            max_exp=_to_float(filters.get('max_exp')),
            company_id=filters.get('company_id') or None,
        )

        return jsonify({
            'query': data['query'],
            **result,
        })

    except Exception as e:
        logger.error(f"Error searching profiles: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@recommendations_bp.route('/explain', methods=['POST'])
@jwt_required()
def explain_candidate():
    """Generate AI explanation for a specific candidate (on-demand, not during search)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        if not data or not data.get('user_id') or not data.get('query'):
            return jsonify({'error': 'user_id and query are required'}), 400
        if str(data['user_id']) != str(user.id) and not _is_hiring_user(user):
            return jsonify({'error': 'Forbidden: organization account required'}), 403

        supervisor = get_supervisor()
        result = supervisor.explain_candidate(
            user_id=str(data['user_id']),
            query=data['query'],
            organization_id=str(user.organization_id) if user.organization_id else None,
        )

        if result:
            return jsonify(result)
        return jsonify({'error': 'Candidate not found'}), 404

    except Exception as e:
        logger.error(f"Error explaining candidate: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@recommendations_bp.route('/candidate/<user_id>', methods=['GET'])
@jwt_required()
def get_candidate_profile(user_id):
    """Get enriched candidate profile with skills, experience, education."""
    try:
        current_user_id = get_jwt_identity()
        me = User.query.get(current_user_id)
        if not me:
            return jsonify({'error': 'User not found'}), 404
        if str(user_id) != str(me.id) and not _is_hiring_user(me):
            return jsonify({'error': 'Forbidden: organization account required'}), 403
        supervisor = get_supervisor()
        result = supervisor.get_candidate_profile(user_id=user_id)
        if result:
            return jsonify(result)
        return jsonify({'error': 'Candidate not found'}), 404
    except Exception as e:
        logger.error(f"Error fetching candidate profile: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@recommendations_bp.route('/compare', methods=['POST'])
@jwt_required()
def compare_candidate_job():
    """Compare a candidate's profile against a job posting."""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        if not data or not data.get('candidate_id') or not data.get('job_id'):
            return jsonify({'error': 'candidate_id and job_id are required'}), 400
        if str(data['candidate_id']) != str(user.id) and not _is_hiring_user(user):
            return jsonify({'error': 'Forbidden: organization account required'}), 403
        if not _owns_job(user, data['job_id']):
            return jsonify({'error': 'Forbidden for this job'}), 403

        supervisor = get_supervisor()
        result = supervisor.compare_candidate_with_job(
            candidate_user_id=str(data['candidate_id']),
            job_id=str(data['job_id']),
            organization_id=str(user.organization_id) if user.organization_id else None,
        )

        if result:
            return jsonify(result)
        return jsonify({'error': 'Candidate or job not found'}), 404

    except Exception as e:
        logger.error(f"Error comparing candidate with job: {e}")
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
        if not _owns_job(user, job_id):
            return jsonify({'error': 'Forbidden for this job'}), 403

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

        try:
            agent = AIInterviewAgent.query.get(int(agent_id))
        except (TypeError, ValueError):
            agent = None
        if not agent:
            return jsonify({'error': 'Agent not found'}), 404
        if agent.organization_id is None:
            if agent.owner_user_id != user.id:
                return jsonify({'error': 'Forbidden for this agent'}), 403
        elif agent.organization_id not in _managed_org_ids(user):
            return jsonify({'error': 'Forbidden for this organization'}), 403

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
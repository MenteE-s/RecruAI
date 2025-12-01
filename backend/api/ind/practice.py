from datetime import timedelta, datetime
from flask import Blueprint, jsonify, request
from ...extensions import db
from ...models import Interview, AIInterviewAgent, User

api_bp = Blueprint('ind_practice', __name__)


@api_bp.route('/practice/sessions', methods=['POST'])
def create_practice_session():
    payload = request.get_json() or {}
    user_id = payload.get('user_id')
    duration_minutes = max(int(payload.get('duration_minutes', 15)), 15)
    title = payload.get('title') or 'Practice Interview'
    description = payload.get('description', '')
    interview_type = payload.get('interview_type', 'text')

    if not user_id:
        return jsonify({'error': 'user_id required'}), 400

    # get or create personal agent
    agent = AIInterviewAgent.query.filter_by(owner_user_id=user_id).first()
    if not agent:
        agent = AIInterviewAgent(
            name='Personal Practice AI',
            industry='General',
            description='Your personal practice AI interviewer',
            owner_user_id=user_id,
        )
        db.session.add(agent)
        db.session.flush()

    # Schedule immediate practice for duration
    now_utc = datetime.utcnow()
    interview = Interview(
        title=title,
        description=description,
        scheduled_at=now_utc,
        duration_minutes=duration_minutes,
        user_id=user_id,
        organization_id=None,
        post_id=None,
        interview_type=interview_type,
        location='practice',
        meeting_link='',
        status='in_progress',
        ai_agent_id=agent.id,
        current_round=1,
        max_rounds=1,
    )
    db.session.add(interview)
    db.session.commit()

    return jsonify({'session': interview.to_dict(), 'agent': agent.to_dict()}), 201

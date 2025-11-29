from flask import request, jsonify
from . import api_bp
from ..extensions import db
from ..models import Interview, Message, InterviewAnalysis
import json
from datetime import datetime


@api_bp.route('/interviews', methods=['GET'])
def get_interviews():
    """Get all interviews"""
    interviews = Interview.query.order_by(Interview.scheduled_at.desc()).all()
    return jsonify({'interviews': [interview.to_dict() for interview in interviews]}), 200


@api_bp.route('/interviews/<int:interview_id>', methods=['GET'])
def get_interview(interview_id):
    """Get a specific interview"""
    interview = Interview.query.get_or_404(interview_id)
    return jsonify(interview.to_dict()), 200


@api_bp.route('/interviews', methods=['POST'])
def create_interview():
    """Create a new interview"""
    data = request.get_json()

    required_fields = ['title', 'scheduled_at', 'user_id', 'organization_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    # Validate scheduled_at is in the future
    datetime_str = data['scheduled_at']
    if datetime_str.endswith('Z'):
        datetime_str = datetime_str[:-1] + '+00:00'

    try:
        scheduled_at = datetime.fromisoformat(datetime_str)
    except ValueError:
        return jsonify({'error': 'Invalid datetime format'}), 400

    now = datetime.utcnow().replace(tzinfo=None)
    scheduled_naive = scheduled_at.replace(tzinfo=None) if scheduled_at.tzinfo else scheduled_at

    if scheduled_naive <= now:
        return jsonify({'error': 'Interview must be scheduled in the future'}), 400

    interview = Interview(
        title=data['title'],
        description=data.get('description'),
        scheduled_at=scheduled_at,
        duration_minutes=data.get('duration_minutes', 60),
        user_id=data['user_id'],
        organization_id=data['organization_id'],
        post_id=data.get('post_id'),
        interview_type=data.get('interview_type', 'text'),
        location=data.get('location'),
        meeting_link=data.get('meeting_link'),
        interviewers=json.dumps(data.get('interviewers', []))
    )

    db.session.add(interview)
    db.session.commit()

    return jsonify({
        'message': 'Interview scheduled successfully',
        'interview': interview.to_dict()
    }), 201


@api_bp.route('/interviews/<int:interview_id>', methods=['PUT'])
def update_interview(interview_id):
    """Update an interview"""
    print(f"PUT request received for interview {interview_id}")
    interview = Interview.query.get_or_404(interview_id)
    data = request.get_json()

    print(f"Updating interview {interview_id} with data: {data}")
    print(f"Current interview status: {interview.status}")

    # Update allowed fields
    updatable_fields = [
        'title', 'description', 'scheduled_at', 'duration_minutes',
        'interview_type', 'location', 'meeting_link', 'status',
        'feedback', 'rating', 'interviewers'
    ]

    for field in updatable_fields:
        if field in data:
            if field == 'scheduled_at':
                value = datetime.fromisoformat(data[field].replace('Z', '+00:00'))
                setattr(interview, field, value)
            elif field == 'interviewers':
                setattr(interview, field, json.dumps(data[field]) if data[field] else None)
            else:
                setattr(interview, field, data[field])
                print(f"Updated field {field} to: {data[field]}")

    interview.updated_at = datetime.utcnow()

    try:
        db.session.commit()
        print("Database commit successful")
    except Exception as e:
        print(f"Database commit failed: {e}")
        db.session.rollback()
        return jsonify({'error': 'Database error'}), 500

    updated_interview = interview.to_dict()
    print(f"Interview updated successfully. New status: {updated_interview.get('status')}")

    return jsonify({
        'message': 'Interview updated successfully',
        'interview': updated_interview
    }), 200


@api_bp.route('/interviews/<int:interview_id>', methods=['DELETE'])
def delete_interview(interview_id):
    """Delete an interview"""
    interview = Interview.query.get_or_404(interview_id)
    db.session.delete(interview)
    db.session.commit()
    return jsonify({'message': 'Interview deleted successfully'}), 200


@api_bp.route('/interviews/upcoming', methods=['GET'])
def get_upcoming_interviews():
    """Get upcoming interviews"""
    now = datetime.utcnow()
    interviews = Interview.query.filter(
        Interview.scheduled_at >= now,
        Interview.status == 'scheduled'
    ).order_by(Interview.scheduled_at.asc()).all()
    return jsonify({'interviews': [interview.to_dict() for interview in interviews]}), 200


@api_bp.route('/interviews/history', methods=['GET'])
def get_interview_history():
    """Get completed/cancelled interviews"""
    interviews = Interview.query.filter(
        Interview.status.in_(['completed', 'cancelled', 'no_show'])
    ).order_by(Interview.scheduled_at.desc()).all()
    return jsonify({'interviews': [interview.to_dict() for interview in interviews]}), 200


# Message endpoints
@api_bp.route('/interviews/<int:interview_id>/messages', methods=['GET'])
def get_messages(interview_id):
    """Get all messages for an interview"""
    messages = Message.query.filter_by(interview_id=interview_id).order_by(Message.created_at.asc()).all()
    return jsonify([message.to_dict() for message in messages]), 200


@api_bp.route('/interviews/<int:interview_id>/complete', methods=['POST'])
def complete_interview(interview_id):
    """Mark interview as completed"""
    interview = Interview.query.get_or_404(interview_id)

    # Update status to completed
    interview.status = "completed"
    # setattr(interview, 'completed_at', datetime.utcnow())
    # setattr(interview, 'round_status', "completed")

    db.session.commit()

    return jsonify({
        "message": "Interview completed successfully",
        "interview": interview.to_dict()
    }), 200


@api_bp.route('/interviews/<int:interview_id>/decision', methods=['POST'])
def update_interview_decision(interview_id):
    """Update interview decision (pass, second round, third round, fail)"""
    interview = Interview.query.get_or_404(interview_id)
    payload = request.get_json(silent=True) or {}

    decision = payload.get("decision")  # 'passed', 'failed', 'second_round', 'third_round'
    feedback = payload.get("feedback", "")
    rating = payload.get("rating")

    if decision not in ['passed', 'failed', 'second_round', 'third_round']:
        return jsonify({"error": "Invalid decision"}), 400

    # For now, just update feedback and rating since new columns don't exist
    interview.feedback = feedback
    if rating:
        interview.rating = rating

    # Update status based on decision (simplified without new columns)
    if decision == 'passed':
        interview.status = 'completed'
    elif decision == 'failed':
        interview.status = 'completed'
    elif decision in ['second_round', 'third_round']:
        interview.status = 'scheduled'  # Schedule next round

    db.session.commit()

    return jsonify({
        "message": "Interview decision updated successfully",
        "interview": interview.to_dict()
    }), 200


@api_bp.route('/interviews/<int:interview_id>/analyze', methods=['POST'])
def generate_interview_analysis(interview_id):
    """Generate AI analysis for completed interview"""
    interview = Interview.query.get_or_404(interview_id)

    if interview.status != 'completed':
        return jsonify({"error": "Interview must be completed before analysis"}), 400

    # Get all messages for this interview
    messages = Message.query.filter_by(interview_id=interview_id).order_by(Message.created_at).all()

    # Prepare conversation for AI analysis
    conversation = "\n".join([f"{msg.user.name if msg.user else 'Unknown'}: {msg.content}" for msg in messages])

    # Check if analysis already exists
    existing_analysis = InterviewAnalysis.query.filter_by(interview_id=interview_id).first()
    if existing_analysis:
        return jsonify({
            "message": "Analysis already exists for this interview",
            "analysis": existing_analysis.to_dict(),
            "interview": interview.to_dict()
        }), 200

    # TODO: Call AI service for analysis
    # For now, generate mock analysis
    analysis_data = {
        "overall_score": 85,
        "communication_score": 88,
        "technical_score": 82,
        "problem_solving_score": 90,
        "cultural_fit_score": 85,
        "detailed_feedback": "Strong candidate with excellent problem-solving skills and good communication. Shows solid technical foundation but could benefit from more experience in certain areas.",
        "ai_analysis_summary": "Candidate demonstrates strong analytical thinking and clear communication patterns. Technical responses show good foundational knowledge with room for deeper expertise.",
        "strengths": [
            "Excellent problem-solving approach",
            "Clear communication style",
            "Good understanding of fundamentals",
            "Enthusiastic and engaged"
        ],
        "improvements": [
            "Could provide more detailed technical explanations",
            "Consider exploring advanced topics",
            "Work on time management during complex problems"
        ],
        "actual_duration_minutes": interview.duration_minutes,  # Mock actual duration
        "average_response_time_seconds": 45.2,  # Mock response time
        "question_count": len(messages) // 2,  # Rough estimate
        "analyzed_by": "AI Analysis System",
        "analysis_method": "ai"
    }

    # Save analysis to database
    analysis = InterviewAnalysis(
        interview_id=interview_id,
        overall_score=analysis_data["overall_score"],
        communication_score=analysis_data["communication_score"],
        technical_score=analysis_data["technical_score"],
        problem_solving_score=analysis_data["problem_solving_score"],
        cultural_fit_score=analysis_data["cultural_fit_score"],
        strengths=json.dumps(analysis_data["strengths"]),
        improvements=json.dumps(analysis_data["improvements"]),
        detailed_feedback=analysis_data["detailed_feedback"],
        ai_analysis_summary=analysis_data["ai_analysis_summary"],
        actual_duration_minutes=analysis_data["actual_duration_minutes"],
        average_response_time_seconds=analysis_data["average_response_time_seconds"],
        question_count=analysis_data["question_count"],
        analyzed_by=analysis_data["analyzed_by"],
        analysis_method=analysis_data["analysis_method"]
    )

    db.session.add(analysis)
    db.session.commit()

    return jsonify({
        "message": "Interview analysis generated successfully",
        "analysis": analysis.to_dict(),
        "interview": interview.to_dict()
    }), 200


@api_bp.route('/interviews/<int:interview_id>/messages', methods=['POST'])
def send_message(interview_id):
    """Send a message in an interview"""
    data = request.get_json()

    # user_id is optional for AI/system messages
    if 'content' not in data:
        return jsonify({'error': 'Missing required field: content'}), 400

    message = Message(
        interview_id=interview_id,
        user_id=data.get('user_id') if 'user_id' in data else None,  # Explicitly allow null for AI messages
        content=data['content'],
        message_type=data.get('message_type', 'text')
    )

    db.session.add(message)
    db.session.commit()

    return jsonify(message.to_dict()), 201


@api_bp.route('/ai/chat', methods=['POST'])
def ai_chat():
    """Mock AI chat endpoint for interviews"""
    data = request.get_json()

    if not data or 'message' not in data:
        return jsonify({'error': 'Message required'}), 400

    message = data['message']

    # Simple mock AI responses based on common interview questions
    responses = {
        'tell me about yourself': 'I\'d be happy to hear about your background. Can you tell me about your professional experience and what brings you to apply for this position?',
        'why do you want this job': 'That\'s a great question. What specifically about this role interests you, and how do you see yourself contributing to our team?',
        'what are your strengths': 'Everyone has different strengths. Can you share some of your key strengths and how they\'ve helped you in your career?',
        'what are your weaknesses': 'We all have areas for growth. Can you tell me about a challenge you\'ve faced and how you worked to overcome it?',
        'why did you leave your last job': 'Career changes are common. Can you share what led you to look for new opportunities?',
        'where do you see yourself in 5 years': 'That\'s an interesting question. How do you envision your career progressing, and what are your professional goals?',
        'why should we hire you': 'That\'s a key question. What makes you uniquely qualified for this position?',
        'do you have any questions': 'Absolutely, I encourage questions! What would you like to know about the role, team, or company?',
    }

    # Default response
    response_text = 'Thank you for your response. Can you elaborate on that or tell me more about your experience?'

    # Check for keywords in the message
    message_lower = message.lower()
    for key, response in responses.items():
        if key in message_lower:
            response_text = response
            break

    # If it's a follow-up question, provide a more generic response
    if '?' in message:
        response_text = 'That\'s a thoughtful question. Can you share more about your thoughts on this topic?'

    return jsonify({
        'response': response_text,
        'agent_id': data.get('agent_id', 1)
    }), 200


@api_bp.route('/ai/user', methods=['GET'])
def get_ai_user():
    """Get or create AI system user for messages"""
    from ..models import User

    # Check if AI user exists
    ai_user = User.query.filter_by(email='ai@recruai.com').first()
    if not ai_user:
        # Create AI user if it doesn't exist
        ai_user = User(
            email='ai@recruai.com',
            name='AI Assistant',
            role='system',
            plan='pro'
        )
        ai_user.set_password('ai_password_not_used')  # Not used for login
        db.session.add(ai_user)
        db.session.commit()

    return jsonify({
        'id': ai_user.id,
        'name': ai_user.name,
        'email': ai_user.email
    }), 200


# Analysis endpoints
@api_bp.route('/interviews/<int:interview_id>/analysis', methods=['GET'])
def get_interview_analysis(interview_id):
    """Get analysis for a specific interview"""
    analysis = InterviewAnalysis.query.filter_by(interview_id=interview_id).first()
    if not analysis:
        return jsonify({"error": "Analysis not found for this interview"}), 404

    return jsonify(analysis.to_dict()), 200


@api_bp.route('/organizations/<int:org_id>/analytics', methods=['GET'])
def get_organization_analytics(org_id):
    """Get aggregated analytics for an organization"""
    from sqlalchemy import func

    # Get all completed interviews with analysis for this organization
    analyses = db.session.query(InterviewAnalysis).join(Interview).filter(
        Interview.organization_id == org_id,
        Interview.status == 'completed'
    ).all()

    if not analyses:
        return jsonify({
            "total_interviews_analyzed": 0,
            "average_scores": {},
            "top_strengths": [],
            "common_improvements": [],
            "pass_rate": 0,
            "analytics": []
        }), 200

    # Calculate averages
    total_analyses = len(analyses)
    avg_overall = sum(a.overall_score or 0 for a in analyses) / total_analyses
    avg_communication = sum(a.communication_score or 0 for a in analyses) / total_analyses
    avg_technical = sum(a.technical_score or 0 for a in analyses) / total_analyses
    avg_problem_solving = sum(a.problem_solving_score or 0 for a in analyses) / total_analyses
    avg_cultural_fit = sum(a.cultural_fit_score or 0 for a in analyses) / total_analyses

    # Collect all strengths and improvements
    all_strengths = []
    all_improvements = []
    for analysis in analyses:
        if analysis.strengths:
            try:
                strengths = json.loads(analysis.strengths)
                all_strengths.extend(strengths)
            except:
                pass
        if analysis.improvements:
            try:
                improvements = json.loads(analysis.improvements)
                all_improvements.extend(improvements)
            except:
                pass

    # Count most common strengths and improvements
    from collections import Counter
    top_strengths = Counter(all_strengths).most_common(5)
    common_improvements = Counter(all_improvements).most_common(5)

    # Mock pass rate (would need decision data)
    pass_rate = 75.0

    return jsonify({
        "total_interviews_analyzed": total_analyses,
        "average_scores": {
            "overall": round(avg_overall, 1),
            "communication": round(avg_communication, 1),
            "technical": round(avg_technical, 1),
            "problem_solving": round(avg_problem_solving, 1),
            "cultural_fit": round(avg_cultural_fit, 1)
        },
        "top_strengths": [{"skill": k, "count": v} for k, v in top_strengths],
        "common_improvements": [{"area": k, "count": v} for k, v in common_improvements],
        "pass_rate": pass_rate,
        "analytics": [analysis.to_dict() for analysis in analyses]
    }), 200


@api_bp.route('/users/<int:user_id>/analytics', methods=['GET'])
def get_user_analytics(user_id):
    """Get analytics for an individual user (candidate)"""
    # Get all completed interviews with analysis for this user
    analyses = db.session.query(InterviewAnalysis).join(Interview).filter(
        Interview.user_id == user_id,
        Interview.status == 'completed'
    ).all()

    if not analyses:
        return jsonify({
            "total_interviews": 0,
            "average_scores": {},
            "strengths": [],
            "improvements": [],
            "performance_trend": [],
            "analytics": []
        }), 200

    # Calculate averages
    total_analyses = len(analyses)
    avg_overall = sum(a.overall_score or 0 for a in analyses) / total_analyses
    avg_communication = sum(a.communication_score or 0 for a in analyses) / total_analyses
    avg_technical = sum(a.technical_score or 0 for a in analyses) / total_analyses
    avg_problem_solving = sum(a.problem_solving_score or 0 for a in analyses) / total_analyses
    avg_cultural_fit = sum(a.cultural_fit_score or 0 for a in analyses) / total_analyses

    # Collect all strengths and improvements
    all_strengths = []
    all_improvements = []
    for analysis in analyses:
        if analysis.strengths:
            try:
                strengths = json.loads(analysis.strengths)
                all_strengths.extend(strengths)
            except:
                pass
        if analysis.improvements:
            try:
                improvements = json.loads(analysis.improvements)
                all_improvements.extend(improvements)
            except:
                pass

    # Get unique strengths and improvements
    unique_strengths = list(set(all_strengths))
    unique_improvements = list(set(all_improvements))

    # Performance trend (mock data - would sort by date)
    performance_trend = [
        {"date": "2024-01", "score": 82},
        {"date": "2024-02", "score": 85},
        {"date": "2024-03", "score": 88}
    ]

    return jsonify({
        "total_interviews": total_analyses,
        "average_scores": {
            "overall": round(avg_overall, 1),
            "communication": round(avg_communication, 1),
            "technical": round(avg_technical, 1),
            "problem_solving": round(avg_problem_solving, 1),
            "cultural_fit": round(avg_cultural_fit, 1)
        },
        "strengths": unique_strengths,
        "improvements": unique_improvements,
        "performance_trend": performance_trend,
        "analytics": [analysis.to_dict() for analysis in analyses]
    }), 200
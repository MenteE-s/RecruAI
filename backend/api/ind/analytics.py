from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import InterviewAnalysis, Interview
import json
from collections import defaultdict
from sqlalchemy import desc

@api_bp.route('/users/<int:user_id>/analytics', methods=['GET'])
@jwt_required()
def get_user_analytics(user_id):
    """Get analytics for an individual user (own data only)."""
    try:
        if int(get_jwt_identity()) != int(user_id):
            return jsonify({"error": "Forbidden"}), 403
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid user identity"}), 400
    # Get all completed interviews with analysis for this user
    analyses = db.session.query(InterviewAnalysis).join(Interview).filter(
        Interview.user_id == user_id,
        Interview.status == 'completed'
    ).all()

    # Get recent interviews (last 10, regardless of analysis status)
    recent_interviews = Interview.query.filter_by(user_id=user_id).order_by(desc(Interview.scheduled_at)).limit(10).all()

    if not analyses:
        return jsonify({
            "total_interviews": 0,
            "average_scores": {},
            "strengths": [],
            "improvements": [],
            "performance_trend": [],
            "analytics": [],
            "recent_interviews": [interview.to_dict() for interview in recent_interviews]
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

    # Performance trend: average overall score per month, chronological.
    monthly = defaultdict(list)
    for analysis in analyses:
        if analysis.overall_score is None:
            continue
        stamp = analysis.created_at or getattr(analysis.interview, "scheduled_at", None)
        if stamp is None:
            continue
        monthly[stamp.strftime("%Y-%m")].append(analysis.overall_score)
    performance_trend = [
        {"date": month, "score": round(sum(scores) / len(scores), 1)}
        for month, scores in sorted(monthly.items())
    ][-12:]

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
        "analytics": [analysis.to_dict() for analysis in analyses],
        "recent_interviews": [interview.to_dict() for interview in recent_interviews]
    }), 200
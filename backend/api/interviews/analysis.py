from flask import request, jsonify
from .. import api_bp
from ...extensions import db
from ...models import Interview, InterviewAnalysis, Message
import json
from datetime import datetime

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
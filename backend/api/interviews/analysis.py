from flask import request, jsonify
from .. import api_bp
from ...extensions import db
from ...models import Interview, InterviewAnalysis, Message, ConversationMessage
from ...ai_service import get_ai_service
import json
from datetime import datetime

def generate_ai_analysis(interview, messages):
    """Generate real AI analysis of interview conversation"""
    try:
        ai_service = get_ai_service()

        # Prepare conversation for analysis
        conversation_lines = []
        for msg in messages:
            created_at = getattr(msg, "created_at", None)
            ts = created_at.isoformat() if created_at else None
            role = getattr(msg, "role", None)
            if role:
                conversation_lines.append(f"[{ts}] {role}: {msg.content}" if ts else f"{role}: {msg.content}")
            else:
                msg_type = getattr(msg, "message_type", "").upper() or "MESSAGE"
                conversation_lines.append(f"[{ts}] {msg_type}: {msg.content}" if ts else f"{msg_type}: {msg.content}")
        conversation_text = "\n".join(conversation_lines)

        created_times = [getattr(m, "created_at", None) for m in messages if getattr(m, "created_at", None)]
        if created_times:
            actual_duration_minutes = max(0, round((max(created_times) - min(created_times)).total_seconds() / 60))
        else:
            actual_duration_minutes = interview.duration_minutes

        def _is_candidate_message(m):
            if hasattr(m, "sender_type"):
                return m.sender_type == "user"
            msg_type = getattr(m, "message_type", None)
            return msg_type not in ("ai_response", "interviewer_response")

        def _is_interviewer_or_ai_message(m):
            if hasattr(m, "sender_type"):
                return m.sender_type == "agent"
            return getattr(m, "message_type", None) in ("ai_response", "interviewer_response")

        response_times = []
        for i, m in enumerate(messages):
            if not _is_interviewer_or_ai_message(m):
                continue
            if not getattr(m, "created_at", None):
                continue
            for j in range(i + 1, len(messages)):
                nxt = messages[j]
                if not getattr(nxt, "created_at", None):
                    continue
                if _is_candidate_message(nxt):
                    response_times.append((nxt.created_at - m.created_at).total_seconds())
                    break
                if _is_interviewer_or_ai_message(nxt):
                    break

        avg_response_time = round(sum(response_times) / len(response_times), 1) if response_times else None

        question_count = 0
        for m in messages:
            if _is_interviewer_or_ai_message(m):
                if "?" in (m.content or ""):
                    question_count += 1

        # AI Analysis Prompt
        system_prompt = """You are an expert interviewer and hiring manager.

CRITICAL: You must respond with VALID JSON only. No markdown, no explanations, just pure JSON.

STYLE REQUIREMENT: Be brutally honest. Do not sugar-coat, do not soften language, do not use vague praise. If the candidate is weak, say so plainly.

SCORING REQUIREMENT:
- Use the full 0-100 range.
- Most real candidates score 45-80.
- 85+ is rare and requires clearly demonstrated excellence.
- If the transcript lacks evidence, score lower and explicitly say what is missing.

Based on the conversation, evaluate the candidate's performance across these dimensions:
- communication_score: How clearly they express ideas (0-100)
- technical_score: Technical knowledge and accuracy (0-100) 
- problem_solving_score: Analytical thinking and solution approach (0-100)
- cultural_fit_score: Professionalism and work approach (0-100)
- overall_score: Weighted average of above scores

EVIDENCE REQUIREMENT:
- Your feedback must reference concrete moments from the transcript (specific claims, mistakes, or missing details).
- If there are no clear strengths, say that explicitly.

Return ONLY this JSON structure:
{
    "overall_score": <integer 0-100>,
    "communication_score": <integer 0-100>,
    "technical_score": <integer 0-100>,
    "problem_solving_score": <integer 0-100>,
    "cultural_fit_score": <integer 0-100>,
    "detailed_feedback": "<3-6 sentences. Blunt, specific, evidence-based. No fluff>",
    "ai_analysis_summary": "<1 sentence key takeaway. Direct>",
    "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
    "improvements": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"]
}"""

        user_prompt = f"""Analyze this interview conversation:

Interview Details:
- Position: {interview.title}
- Description: {interview.description or 'Not specified'}

Conversation:
{conversation_text}

Provide a detailed analysis with accurate scores based on the actual content and quality of responses."""

        # Get AI analysis
        ai_response = ai_service.generate_response(system_prompt, user_prompt)

        # Parse AI response as JSON
        try:
            # Clean the response to extract JSON
            response_text = ai_response.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            response_text = response_text.strip()

            try:
                analysis_result = json.loads(response_text)
            except (json.JSONDecodeError, ValueError):
                start = response_text.find('{')
                end = response_text.rfind('}')
                if start != -1 and end != -1 and end > start:
                    analysis_result = json.loads(response_text[start : end + 1])
                else:
                    raise
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Failed to parse AI response as JSON: {e}")
            print(f"AI Response: {ai_response}")

            retry_prompt = system_prompt + "\n\nFINAL WARNING: Output must be valid JSON. No extra keys."
            retry_response = ai_service.generate_response(retry_prompt, user_prompt)
            retry_text = retry_response.strip()
            if retry_text.startswith('```json'):
                retry_text = retry_text[7:]
            if retry_text.endswith('```'):
                retry_text = retry_text[:-3]
            retry_text = retry_text.strip()

            try:
                analysis_result = json.loads(retry_text)
            except (json.JSONDecodeError, ValueError):
                start = retry_text.find('{')
                end = retry_text.rfind('}')
                if start != -1 and end != -1 and end > start:
                    analysis_result = json.loads(retry_text[start : end + 1])
                else:
                    raise

        # Ensure scores are within valid range
        for score_key in ['overall_score', 'communication_score', 'technical_score', 'problem_solving_score', 'cultural_fit_score']:
            if score_key in analysis_result:
                analysis_result[score_key] = max(0, min(100, int(analysis_result[score_key])))

        # Normalize text/list fields so the UI doesn't break
        if not isinstance(analysis_result.get('detailed_feedback'), str):
            analysis_result['detailed_feedback'] = str(analysis_result.get('detailed_feedback', ''))
        if not isinstance(analysis_result.get('ai_analysis_summary'), str):
            analysis_result['ai_analysis_summary'] = str(analysis_result.get('ai_analysis_summary', ''))
        for list_key in ('strengths', 'improvements'):
            val = analysis_result.get(list_key)
            if not isinstance(val, list):
                analysis_result[list_key] = []

        # Add calculated metrics
        analysis_result.update({
            "actual_duration_minutes": actual_duration_minutes,
            "average_response_time_seconds": avg_response_time,
            "question_count": question_count,
            "analyzed_by": "AI Analysis System",
            "analysis_method": "ai"
        })

        return analysis_result

    except Exception as e:
        print(f"Error generating AI analysis: {e}")
        return {
            "overall_score": 0,
            "communication_score": 0,
            "technical_score": 0,
            "problem_solving_score": 0,
            "cultural_fit_score": 0,
            "detailed_feedback": "AI analysis failed. Please try again.",
            "ai_analysis_summary": "AI analysis failed.",
            "strengths": [],
            "improvements": [],
            "actual_duration_minutes": interview.duration_minutes,
            "average_response_time_seconds": None,
            "question_count": len(messages) // 2,
            "analyzed_by": "AI Analysis System (Failed)",
            "analysis_method": "ai"
        }

@api_bp.route('/interviews/<int:interview_id>/analyze', methods=['POST'])
def generate_interview_analysis(interview_id):
    """Generate AI analysis for completed interview"""
    interview = Interview.query.get_or_404(interview_id)

    if interview.status != 'completed':
        return jsonify({"error": "Interview must be completed before analysis"}), 400

    # Prefer the canonical chat transcript; fall back to legacy Message table
    conv_messages = ConversationMessage.query.filter_by(interview_id=interview_id).order_by(ConversationMessage.created_at.asc()).all()
    legacy_messages = Message.query.filter_by(interview_id=interview_id).order_by(Message.created_at.asc()).all()

    if conv_messages:
        messages = []
        for m in conv_messages:
            role = "AGENT" if m.sender_type == "agent" else "CANDIDATE"
            m.role = role
            messages.append(m)
    else:
        messages = []
        for m in legacy_messages:
            if m.message_type in ("ai_response", "interviewer_response"):
                m.role = "AGENT"
            else:
                m.role = "CANDIDATE"
            messages.append(m)

    # Check if analysis already exists
    existing_analysis = InterviewAnalysis.query.filter_by(interview_id=interview_id).first()
    force = request.args.get('force') in ('1', 'true', 'True')
    if existing_analysis and not force:
        return jsonify({
            "message": "Analysis already exists for this interview",
            "analysis": existing_analysis.to_dict(),
            "interview": interview.to_dict()
        }), 200

    if existing_analysis and force:
        db.session.delete(existing_analysis)
        db.session.commit()

    # Generate real AI analysis
    analysis_data = generate_ai_analysis(interview, messages)

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
    from sqlalchemy import func, desc

    # Get all completed interviews with analysis for this organization
    analyses = db.session.query(InterviewAnalysis).join(Interview).filter(
        Interview.organization_id == org_id,
        Interview.status == 'completed'
    ).all()

    # Get recent interviews (last 10, regardless of analysis status)
    recent_interviews = Interview.query.filter_by(organization_id=org_id).order_by(desc(Interview.scheduled_at)).limit(10).all()

    if not analyses:
        return jsonify({
            "total_interviews_analyzed": 0,
            "average_scores": {},
            "top_strengths": [],
            "common_improvements": [],
            "pass_rate": 0,
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
        "analytics": [analysis.to_dict() for analysis in analyses],
        "recent_interviews": [interview.to_dict() for interview in recent_interviews]
    }), 200
"""Mock interviews: practise the interview itself.

On api_bp so the email-verification guard applies.

The one idea worth stating: **the phase belongs to the server.** A real
interview has a shape — open, background, technical, behavioural, their
questions, close — and an unstructured chatbot skips all of it, which is exactly
the part a nervous candidate needs to rehearse. So `current_phase` moves only
when `should_advance()` says the phase has had enough turns, and the model may
choose a question within a phase but never the phase itself.

Content comes from the bank first. The model is only asked when the bank has
nothing for a phase, which keeps a session inside the AI budget and keeps its
shape even if the provider is down.
"""
from datetime import datetime

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import api_bp
from ...extensions import db
from ...models import MockInterview, Post
from ...mock_interview import generator
from ...utils import mock_interview as mi
from ...utils.subscription import CVAI_MOCK_INTERVIEW, check_content_access

MAX_ACTIVE_SESSIONS = 1  # one at a time: two live interviews is not practice
MAX_ROLE_LEN = 160


def _me():
    from ...models import User
    try:
        return db.session.get(User, int(get_jwt_identity()))
    except (TypeError, ValueError):
        return None


def _gate():
    return check_content_access(CVAI_MOCK_INTERVIEW)


def _phase_payload(session):
    """The shape of the current phase, so the client can label the screen."""
    meta = mi.PHASE_BY_KEY.get(session.current_phase) or {}
    return {
        "phase": session.current_phase,
        "label": meta.get("label", session.current_phase),
        "blurb": meta.get("blurb", ""),
        "min_turns": meta.get("min_turns", 1),
        "max_turns": meta.get("max_turns", 2),
        "turns_taken": session.phase_turns,
        "skills_in_scope": mi.skills_for_phase(session.current_phase),
    }


def _next_question(session, user):
    """The next question, bank first. Returns (text, guidance, source)."""
    asked = session.get_asked()
    from ...models import MockInterviewQuestion

    row = (MockInterviewQuestion.query
           .filter_by(phase=session.current_phase, is_active=True)
           .order_by(MockInterviewQuestion.id.asc()).all())
    used = {q.get("id") for q in asked if q.get("id") is not None}
    for candidate in row:
        if candidate.id in used:
            continue
        if not mi.question_is_valid(
                {"text": candidate.text, "phase": candidate.phase,
                 "skill_slug": candidate.skill_slug}, session.current_phase):
            continue
        return candidate.text, candidate.guidance, "bank"

    # Bank is exhausted for this phase. Generated, then validated against the
    # same rules — a question that does not belong here is not asked.
    skills = [s for s in session.get_skill_slugs()
              if s in mi.skills_for_phase(session.current_phase)]
    texts = generator.generate_questions(
        session.current_phase, skills,
        [q["text"] for q in asked if q.get("text")], user)
    if texts:
        return texts[0], None, "generated"
    return None, None, "exhausted"


@api_bp.route('/mock-interviews/meta', methods=['GET'])
@jwt_required()
def mock_interview_meta():
    """The phases and how many questions each allows, so the client needn't guess."""
    return jsonify({
        "phases": [dict(p) for p in mi.PHASES],
        "max_answer_chars": mi.MAX_ANSWER_CHARS,
        "pass_mark_percent": mi.PASS_MARK_PERCENT,
        "dimensions": [{"key": k, "label": v}
                       for k, v in mi.ASSESSMENT_DIMENSIONS],
    }), 200


@api_bp.route('/mock-interviews', methods=['POST'])
@jwt_required()
def start_mock_interview():
    """Start a session against a posting or a role.

    Costs AI tokens only when the target has to be inferred from free text; a
    posting with requirements is read straight from the database.
    """
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    allowed, error, code = _gate()
    if not allowed:
        return error, code

    data = request.get_json(silent=True) or {}
    post_id = data.get('post_id')
    target_role = (data.get('target_role') or '').strip()[:MAX_ROLE_LEN]

    post = None
    if post_id:
        post = db.session.get(Post, post_id)
        if post is None:
            return jsonify({'error': 'That job posting no longer exists'}), 404

    open_sessions = MockInterview.query.filter_by(
        user_id=user.id, status='in_progress').count()
    if open_sessions >= MAX_ACTIVE_SESSIONS:
        return jsonify({
            'error': 'You already have an interview in progress',
            'detail': 'Finish or abandon it before starting another.',
        }), 409

    if not post and not target_role:
        return jsonify({
            'error': 'Practise against a job posting or name the role',
            'detail': 'One of post_id or target_role is required.',
        }), 400

    skills = generator.plan_skills(user, post=post, target_role=target_role)

    session = MockInterview(
        user_id=user.id,
        post_id=post.id if post else None,
        target_role=target_role or (post.title if post else None),
        status='in_progress',
        review_status='none',
        current_phase=mi.PHASE_KEYS[0],
        phase_turns=0,
    )
    session.set_skill_slugs([s["slug"] for s in skills])
    session.set_transcript([])
    session.set_asked([])
    db.session.add(session)
    db.session.commit()

    # Opening line is authored, not generated, so a session never begins with a
    # provider failure and the learner staring at an empty screen.
    greeting = "Thanks for making the time. Let's start wherever is useful for you."
    session.append_turn("interviewer", greeting)
    session.set_asked([{"id": None, "text": greeting,
                        "phase": session.current_phase, "source": "authored"}])

    question, guidance, source = _next_question(session, user)
    if question:
        session.append_turn("interviewer", question)
        session.phase_turns += 1

    db.session.commit()

    return jsonify({
        'interview': session.to_dict(include_transcript=True),
        'phase': _phase_payload(session),
        'question': question,
        'guidance': guidance,
        'question_source': source,
        'skills_planned': skills,
    }), 201


@api_bp.route('/mock-interviews/<int:interview_id>/answer', methods=['POST'])
@jwt_required()
def answer_mock_interview(interview_id):
    """Answer the current question. Moves the phase only when it is time."""
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    session = db.session.get(MockInterview, interview_id)
    if not session:
        return jsonify({'error': 'Interview not found'}), 404
    if session.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    if session.status != 'in_progress':
        return jsonify({
            'error': 'This interview is already finished',
            'interview': session.to_dict(include_transcript=True, include_feedback=True),
        }), 409

    allowed, error, code = _gate()
    if not allowed:
        return error, code

    data = request.get_json(silent=True) or {}
    answer = data.get('answer')
    if not isinstance(answer, str) or not answer.strip():
        return jsonify({'error': 'answer is required'}), 400
    answer = answer.strip()[:mi.MAX_ANSWER_CHARS]

    session.append_turn("candidate", answer)
    session.phase_turns += 1

    if mi.should_advance(session.current_phase, session.phase_turns):
        nxt = mi.next_phase(session.current_phase)
        if nxt is None:
            return jsonify({
                'interview': session.to_dict(include_transcript=True),
                'phase': _phase_payload(session),
                'finished': True,
                'message': 'That is the end of the interview. Ask for feedback when '
                           'you are ready.',
            }), 200
        session.current_phase = nxt
        session.phase_turns = 0

    question, guidance, source = _next_question(session, user)
    if question is None:
        # Phase exhausted and the model could not fill it. Say so rather than
        # looping an empty screen at the learner.
        nxt = mi.next_phase(session.current_phase)
        if nxt is None:
            return jsonify({
                'interview': session.to_dict(include_transcript=True),
                'phase': _phase_payload(session),
                'finished': True,
                'message': 'That is the end of the interview. Ask for feedback when '
                           'you are ready.',
            }), 200
        session.current_phase = nxt
        session.phase_turns = 0
        question, guidance, source = _next_question(session, user)
        if question is None:
            return jsonify({
                'interview': session.to_dict(include_transcript=True),
                'phase': _phase_payload(session),
                'finished': True,
                'message': 'No more questions are available for this section.',
            }), 200

    session.append_turn("interviewer", question)
    session.phase_turns += 1
    db.session.commit()

    return jsonify({
        'interview': session.to_dict(include_transcript=True),
        'phase': _phase_payload(session),
        'question': question,
        'guidance': guidance,
        'question_source': source,
        'finished': False,
    }), 200


@api_bp.route('/mock-interviews/<int:interview_id>/feedback', methods=['POST'])
@jwt_required()
def mock_interview_feedback(interview_id):
    """Score the interview. Costs tokens.

    A failed review is reported as a failed review: no score, review_status
    'unavailable', and the session stays open so it can be retried free.
    """
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    session = db.session.get(MockInterview, interview_id)
    if not session:
        return jsonify({'error': 'Interview not found'}), 404
    if session.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403

    allowed, error, code = _gate()
    if not allowed:
        return error, code

    if session.status == 'completed' and session.review_status == 'done':
        # Retrying a scored interview would let a learner reroll a bad score,
        # which makes the score meaningless.
        return jsonify({
            'error': 'This interview has already been reviewed',
            'interview': session.to_dict(include_feedback=True),
        }), 409

    if not session.get_transcript():
        return jsonify({
            'error': 'Nothing to review yet',
            'detail': 'Answer at least one question first.',
        }), 409

    session.status = 'completed'
    session.review_status = 'pending'
    session.completed_at = datetime.utcnow()
    db.session.commit()

    result, error_detail = generator.review_interview(
        session.get_transcript(), session.get_skill_slugs(), user)

    if error_detail:
        session.review_status = 'unavailable'
        db.session.commit()
        return jsonify({
            'interview': session.to_dict(include_transcript=True),
            'review_status': 'unavailable',
            'message': 'Your answers are saved, but the reviewer could not be reached. '
                       'Nothing was scored. Asking again is free.',
            'detail': error_detail,
        }), 503

    session.set_feedback(result)
    session.overall_score = result['overall_score']
    session.passed = result['passed']
    session.review_status = 'done'

    updated = _write_back(user, session, result)
    db.session.commit()

    return jsonify({
        'interview': session.to_dict(include_transcript=True, include_feedback=True),
        'feedback': result,
        'passed': bool(session.passed),
        'skills_updated': [s.to_dict() for s in updated],
    }), 200


def _write_back(user, session, result):
    """Record the interview on the profile.

    Unverified, and that is the point. The reviewer scored what was said, not
    what was built, so this is evidence someone was assessed — it is not the same
    claim an assessment makes and must not borrow its badge.
    """
    from ...utils import assessment_grading as grading
    from ...utils.skill_taxonomy import level_for_score

    updated = []
    level = level_for_score(result.get('overall_score'))
    for slug in session.get_skill_slugs():
        skill = grading.write_back_skill(user, slug, level, {
            'mock_interview_id': session.id,
            'overall_score': result.get('overall_score'),
            'passed': bool(session.passed),
            'strengths': len(result.get('strengths') or []),
            'improvements': len(result.get('improvements') or []),
        }, when=session.completed_at)
        if skill is not None:
            skill.evidence_source = 'mock_interview'
            skill.verified = False
            updated.append(skill)
    return updated


@api_bp.route('/mock-interviews/<int:interview_id>/abandon', methods=['POST'])
@jwt_required()
def abandon_mock_interview(interview_id):
    """Stop without scoring. Honest about producing no feedback."""
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    session = db.session.get(MockInterview, interview_id)
    if not session:
        return jsonify({'error': 'Interview not found'}), 404
    if session.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    if session.status != 'in_progress':
        return jsonify({'error': 'This interview is already finished'}), 409

    session.status = 'abandoned'
    session.completed_at = datetime.utcnow()
    db.session.commit()
    return jsonify({
        'interview': session.to_dict(),
        'message': 'Abandoned. Nothing was scored, which is why there is no feedback.',
    }), 200


@api_bp.route('/mock-interviews', methods=['GET'])
@jwt_required()
def list_mock_interviews():
    """My practice history, newest first."""
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    try:
        limit = max(1, min(int(request.args.get('limit', 20)), 100))
    except (TypeError, ValueError):
        limit = 20
    rows = (MockInterview.query.filter_by(user_id=user.id)
            .order_by(MockInterview.id.desc()).limit(limit).all())
    return jsonify({
        'interviews': [i.to_dict() for i in rows],
        'count': len(rows),
    }), 200


@api_bp.route('/mock-interviews/<int:interview_id>', methods=['GET'])
@jwt_required()
def get_mock_interview(interview_id):
    """One session with its transcript. Owner only, and no entitlement needed —
    losing CVAI must not erase the record of an interview already sat."""
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    session = db.session.get(MockInterview, interview_id)
    if not session:
        return jsonify({'error': 'Interview not found'}), 404
    if session.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    return jsonify({
        'interview': session.to_dict(include_transcript=True, include_feedback=True),
        'phase': _phase_payload(session),
    }), 200

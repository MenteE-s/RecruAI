"""Quizzes: subscriber content built on the shared question bank.

On api_bp so the blueprint-wide email-verification guard applies.

Entitlement is per quiz, not per endpoint: a quiz marked `is_free_preview` is
listable and takeable by anyone signed in, because being able to try one is the
only way to decide whether to subscribe. Everything else needs `cvai_quizzes`.

Grading is delegated to utils/assessment_grading.py, the same helper assessments
use, so a score cannot mean one thing here and another there.
"""
from datetime import datetime

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import api_bp
from ...extensions import db
from ...models import QuizAttempt, SkillQuestion, SkillQuiz
from ...utils import assessment_grading as grading
from ...utils.skill_taxonomy import resolve
from ...utils.subscription import CVAI_QUIZZES, require_subscription

MAX_QUIZ_QUESTIONS = 40


def _me():
    from ...models import User
    try:
        return db.session.get(User, int(get_jwt_identity()))
    except (TypeError, ValueError):
        return None


def _snapshot_for(quiz):
    """The questions as served, snapshotted so later edits cannot rewrite a score.

    Retired questions are dropped rather than served: a quiz that silently
    includes a question an author has pulled is worse than one with fewer
    questions.
    """
    rows = (db.session.query(SkillQuestion)
            .filter(SkillQuestion.id.in_(quiz.get_question_ids() or [0]))
            .filter(SkillQuestion.is_active.is_(True))
            .all())
    by_id = {r.id: r for r in rows}
    snapshot = []
    for qid in quiz.get_question_ids():
        row = by_id.get(qid)
        if not row:
            continue
        snapshot.append({
            "question_id": row.id,
            "skill_slug": row.skill_slug,
            "prompt": row.prompt,
            "options": row.get_options(),
            "correct_index": row.correct_index,
            "explanation": row.explanation,
            "level_tested": row.level_tested,
            "difficulty": row.difficulty,
        })
    return snapshot


def _public_questions(snapshot):
    """Questions without their answers. correct_index never leaves the server."""
    return [{
        "question_id": q["question_id"],
        "prompt": q["prompt"],
        "options": q["options"],
        "skill_slug": q["skill_slug"],
        "difficulty": q["difficulty"],
    } for q in snapshot]


def _require_subscriber(feature=CVAI_QUIZZES):
    """Free previews are open; the rest need the entitlement.

    Not a decorator, because the decision depends on the quiz rather than the
    route.
    """
    from ...config import Config
    if Config.IS_PRODUCTION:
        from ...utils.subscription import SubscriptionManager
        user = _me()
        if user and user.organization:
            if not SubscriptionManager.check_organization_access(user.organization, feature):
                return False, jsonify({
                    'error': 'Subscription required',
                    'message': f"Feature '{feature}' requires an active subscription",
                }), 403
        elif user and not SubscriptionManager.check_user_access(user, feature):
            return False, jsonify({
                'error': 'Subscription required',
                'message': f"Feature '{feature}' requires an active subscription",
            }), 403
    return True, None, None


@api_bp.route('/quizzes', methods=['GET'])
@jwt_required()
def list_quizzes():
    """Active quizzes. A lapsed individual still sees free previews."""
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    quizzes = (SkillQuiz.query.filter_by(is_active=True)
               .order_by(SkillQuiz.id.asc()).all())

    unlocked, locked = [], []
    for quiz in quizzes:
        payload = quiz.to_dict()
        if quiz.is_free_preview:
            unlocked.append(payload)
        else:
            # Say the quiz exists and what it covers, so it can be sold, but
            # not what is inside it — including how big it is, which would tell
            # a lapsed user what they are missing for free.
            payload.pop("question_count", None)
            payload["locked"] = True
            locked.append(payload)

    return jsonify({
        'quizzes': unlocked + locked,
        'unlocked_count': len(unlocked),
        'locked_count': len(locked),
    }), 200


@api_bp.route('/quizzes/<slug>', methods=['GET'])
@jwt_required()
def get_quiz(slug):
    """One quiz. Locked quizzes report what they cover without their questions."""
    quiz = SkillQuiz.query.filter_by(slug=(slug or '').strip().lower(),
                                     is_active=True).first()
    if not quiz:
        return jsonify({'error': 'Quiz not found'}), 404

    payload = quiz.to_dict()
    if not quiz.is_free_preview:
        allowed, error, code = _require_subscriber()
        if not allowed:
            payload.pop("question_count", None)
            payload["locked"] = True
            return jsonify({
                'quiz': payload,
                'locked': True,
                'message': 'Subscribe to take this quiz.',
            }), 200

    snapshot = _snapshot_for(quiz)
    payload['questions'] = _public_questions(snapshot)
    payload['question_count'] = len(snapshot)
    if not snapshot:
        payload['unavailable'] = 'This quiz has no active questions yet.'
    return jsonify({'quiz': payload}), 200


@api_bp.route('/quizzes/<slug>/attempts', methods=['POST'])
@jwt_required()
def start_quiz_attempt(slug):
    """Start an attempt, snapshotting the questions as served."""
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    quiz = SkillQuiz.query.filter_by(slug=(slug or '').strip().lower(),
                                     is_active=True).first()
    if not quiz:
        return jsonify({'error': 'Quiz not found'}), 404

    if not quiz.is_free_preview:
        allowed, error, code = _require_subscriber()
        if not allowed:
            return error, code

    snapshot = _snapshot_for(quiz)
    if not snapshot:
        return jsonify({
            'error': 'This quiz has no active questions',
            'detail': 'Its questions may have been retired by an author.',
        }), 409

    attempt = QuizAttempt(
        quiz_id=quiz.id, user_id=user.id, status='in_progress',
        total_questions=len(snapshot),
    )
    attempt.set_answers(snapshot)
    db.session.add(attempt)
    db.session.commit()

    return jsonify({
        'attempt_id': attempt.id,
        'quiz': quiz.to_dict(),
        # correct_index deliberately absent.
        'questions': _public_questions(snapshot),
    }), 201


@api_bp.route('/quizzes/attempts/<int:attempt_id>/submit', methods=['POST'])
@jwt_required()
def submit_quiz_attempt(attempt_id):
    """Grade server-side and hand back per-question explanations."""
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    attempt = db.session.get(QuizAttempt, attempt_id)
    if not attempt:
        return jsonify({'error': 'Attempt not found'}), 404
    if attempt.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    if attempt.status == 'completed':
        # Re-submitting must not re-grade: a second payload would otherwise be
        # able to overwrite a recorded score.
        return jsonify({
            'error': 'This attempt is already completed',
            'attempt': attempt.to_dict(include_feedback=True),
        }), 409

    quiz = attempt.quiz
    if quiz is None:
        return jsonify({'error': 'The quiz behind this attempt no longer exists'}), 409

    data = request.get_json(silent=True) or {}
    submitted = data.get('answers')
    if not isinstance(submitted, list):
        return jsonify({'error': 'answers must be a list'}), 400

    answers = {a.get('question_id'): a.get('selected') for a in submitted
               if isinstance(a, dict)}
    snapshot = attempt.get_answers()
    result, feedback = grading.grade(snapshot, answers)

    if result["total_questions"] == 0:
        attempt.status = 'abandoned'
        attempt.completed_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'error': 'None of the served questions could be graded'}), 409

    pass_mark = int(quiz.pass_percent or 50)
    attempt.set_answers(result["snapshot"])
    attempt.set_feedback(feedback)
    attempt.correct_count = result["correct_count"]
    attempt.total_questions = result["total_questions"]
    attempt.score_percent = result["score_percent"]
    attempt.level_awarded = result["level_awarded"]
    attempt.passed = grading.passed(result["score_percent"], pass_mark)
    attempt.status = 'completed'
    attempt.completed_at = datetime.utcnow()
    db.session.commit()

    # A quiz is weaker evidence than a full assessment — fewer questions — so it
    # records the level on the profile without claiming assessment backing.
    from ...models import Skill
    from ...models.skill import EVIDENCE_ASSESSMENT

    updated = []
    if quiz.is_free_preview:
        # A free preview must not move anyone's profile, or "free" costs
        # something measurable.
        updated = []
    else:
        seen = set()
        for item in feedback:
            slug = item.get("skill_slug")
            if not slug or slug in seen:
                continue
            seen.add(slug)
            entry = resolve(slug)
            if not entry:
                continue
            skill = grading.write_back_skill(user, slug, result["level_awarded"], {
                "quiz_id": quiz.id,
                "quiz_slug": quiz.slug,
                "score_percent": result["score_percent"],
                "correct_count": result["correct_count"],
                "total_questions": result["total_questions"],
            }, when=attempt.completed_at)
            if skill is not None:
                # Marked as a quiz measurement, so the verified badge does not
                # overstate what a handful of questions proved.
                skill.evidence_source = "quiz"
                skill.verified = False
                updated.append(skill)
        db.session.commit()

    return jsonify({
        'attempt': attempt.to_dict(include_feedback=True),
        'passed': bool(attempt.passed),
        'pass_mark': pass_mark,
        'feedback': feedback,
        'skills_updated': [s.to_dict() for s in updated],
    }), 200


@api_bp.route('/quizzes/attempts', methods=['GET'])
@jwt_required()
def list_quiz_attempts():
    """My quiz history, newest first."""
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    try:
        limit = max(1, min(int(request.args.get('limit', 20)), 100))
    except (TypeError, ValueError):
        limit = 20
    rows = (QuizAttempt.query.filter_by(user_id=user.id)
            .order_by(QuizAttempt.id.desc()).limit(limit).all())
    return jsonify({
        'attempts': [a.to_dict() for a in rows],
        'count': len(rows),
    }), 200


@api_bp.route('/quizzes/<slug>/attempts', methods=['GET'])
@jwt_required()
def get_quiz_attempt(slug):
    """One of my attempts at one quiz, with feedback. Owner only."""
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    quiz = SkillQuiz.query.filter_by(slug=(slug or '').strip().lower()).first()
    if not quiz:
        return jsonify({'error': 'Quiz not found'}), 404
    rows = (QuizAttempt.query
            .filter_by(user_id=user.id, quiz_id=quiz.id)
            .order_by(QuizAttempt.id.desc()).first())
    if not rows:
        return jsonify({'error': 'You have not attempted this quiz'}), 404
    return jsonify({'attempt': rows.to_dict(include_feedback=True)}), 200
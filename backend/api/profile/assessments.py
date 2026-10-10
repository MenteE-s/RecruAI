"""Skill assessments: take one, get a level back.

The measuring instrument for everything downstream. A4 is the "test for
analysis" from the feature brief: it turns a claim on a profile ("I know React")
into evidence (three of four questions right, Advanced).

Design notes that matter:

  * **The question set is snapshotted into the attempt at start.** If a question
    is edited or deactivated while someone is mid-assessment, their attempt must
    not change underneath them, so the served question ids live in the row.
  * **Answers are graded server-side on submit.** The browser is never told
    correct_index before the attempt is complete, so the score cannot be forged
    client-side.
  * **Attempts are append-only.** A retake creates a new row; progress tracking
    (B2.2) compares attempts, and that needs the history to survive.
  * **The bank is the same table quizzes read** (Track C1), so a question is
    authored once.

Authoring is gated to accounts that administer a page. Who *should* author is
still an open product question (see CVAI_TODO.md); gating to org admins is the
safe interim answer, not a decision that nobody except orgs may write content.
"""
from datetime import datetime

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import api_bp
from ...extensions import db
from ...models import SkillQuestion, SkillAssessment
from ...utils import assessment_grading as grading
from ...utils import skill_taxonomy as taxonomy
from ...utils.subscription import CVAI_SKILL_ASSESSMENT, require_subscription

# A short assessment has to fit in one sitting; a long one gets abandoned and
# teaches nothing. 20 is also the max we can show without a pager.
MAX_QUESTIONS = 20
DEFAULT_QUESTIONS = 8
# Below this, the user has an evidence-backed Beginner rather than no data.
PASS_MARK_PERCENT = 50.0


def _write_back_result(user, attempt):
    """Fold an assessment result into the user's skill profile.

    This is the whole point of A4 meeting A2: an assessment that only lives in
    `/api/skills/levels` informs nothing. Writing it onto the profile is what
    turns "I know React" into evidence-backed evidence, and what the gap engine
    (A3) and the mentorship planner (B1) will read.

    Only completed attempts, and only when the attempt was scoped to a single
    skill — a mixed assessment's level applies to the whole paper, not to any
    one skill, so attributing it to each would be a lie.
    """
    if not attempt.skill_slug or attempt.status != 'completed':
        return None

    from ...models import Skill
    from ...models.skill import EVIDENCE_ASSESSMENT, VERIFIED_EVIDENCE

    entry = taxonomy.resolve(attempt.skill_slug)
    if not entry:
        return None

    skill = Skill.query.filter_by(user_id=user.id, skill_slug=entry['slug']).first()
    created = skill is None
    if created:
        skill = Skill(user_id=user.id, name=entry['name'], skill_slug=entry['slug'])
        db.session.add(skill)

    # An assessment is a fresh measurement, so it replaces the claimed level
    # rather than only ever raising it: someone who used to claim "Expert" and
    # now scores 55% should see Intermediate, not have their stale claim kept.
    skill.name = entry['name']
    skill.level = attempt.level_awarded
    skill.evidence_source = EVIDENCE_ASSESSMENT
    skill.verified = EVIDENCE_ASSESSMENT in VERIFIED_EVIDENCE
    skill.last_assessed_at = attempt.completed_at or datetime.utcnow()
    skill.set_evidence_detail({
        'assessment_id': attempt.id,
        'score_percent': attempt.score_percent,
        'correct_count': attempt.correct_count,
        'total_questions': attempt.total_questions,
    })
    db.session.commit()
    return skill


def _current_user():
    from ...models import User
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return None
    return db.session.get(User, user_id)


def _is_author(user):
    """Provisional authorship gate: administers a company page.

    Open question in CVAI_TODO.md is who authors quiz content. Restricting to
    page admins keeps a brand-new account from filling the shared bank while the
    product answer is still being decided.
    """
    if user is None:
        return False
    if user.organization_id:
        return True
    from ...models import TeamMember
    return TeamMember.query.filter_by(user_id=user.id).first() is not None


def _validate_skill_slug(slug):
    entry = taxonomy.resolve(slug or "")
    return entry


# --------------------------------------------------------------------------
# Authoring
# --------------------------------------------------------------------------
@api_bp.route('/skills/questions', methods=['POST'])
@jwt_required()
def create_skill_question():
    """Add a question to the shared bank."""
    user = _current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if not _is_author(user):
        return jsonify({'error': 'Only page administrators can author questions'}), 403

    data = request.get_json(silent=True) or {}
    entry = _validate_skill_slug(data.get('skill_slug'))
    if not entry:
        return jsonify({'error': 'Unknown skill. Use a slug from /api/skills/taxonomy.'}), 400

    prompt = (data.get('prompt') or '').strip()
    if not prompt:
        return jsonify({'error': 'prompt is required'}), 400

    options = data.get('options')
    if not isinstance(options, list) or len(options) < 2:
        return jsonify({'error': 'options must be a list of at least 2 answers'}), 400
    options = [str(o).strip() for o in options]
    if any(not o for o in options):
        return jsonify({'error': 'options cannot contain empty answers'}), 400

    correct_index = data.get('correct_index')
    if not isinstance(correct_index, int) or not (0 <= correct_index < len(options)):
        return jsonify({'error': f'correct_index must be an int 0-{len(options) - 1}'}), 400

    difficulty = data.get('difficulty', 1)
    try:
        difficulty = max(1, min(5, int(difficulty)))
    except (TypeError, ValueError):
        difficulty = 1

    # Reject an unknown level rather than storing a band nothing can compare.
    level_tested = data.get('level_tested')
    if level_tested is not None:
        level_tested = taxonomy.normalize_level(level_tested)
        if level_tested is None:
            return jsonify({'error': f'level_tested must be one of {list(taxonomy.LEVELS)}'}), 400

    import json
    question = SkillQuestion(
        skill_slug=entry['slug'],
        prompt=prompt,
        options=json.dumps(options),
        correct_index=correct_index,
        explanation=(data.get('explanation') or '').strip() or None,
        difficulty=difficulty,
        level_tested=level_tested,
        created_by_user_id=user.id,
    )
    db.session.add(question)
    db.session.commit()
    return jsonify({'question': question.to_dict(include_answer=True)}), 201


@api_bp.route('/skills/questions/<int:question_id>', methods=['PUT'])
@jwt_required()
def update_skill_question(question_id):
    user = _current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    question = db.session.get(SkillQuestion, question_id)
    if not question:
        return jsonify({'error': 'Question not found'}), 404
    if not _is_author(user) and question.created_by_user_id != user.id:
        return jsonify({'error': 'You can only edit your own questions'}), 403

    data = request.get_json(silent=True) or {}
    import json
    if 'prompt' in data:
        prompt = (data.get('prompt') or '').strip()
        if not prompt:
            return jsonify({'error': 'prompt cannot be empty'}), 400
        question.prompt = prompt
    if 'options' in data:
        options = data.get('options')
        if not isinstance(options, list) or len(options) < 2:
            return jsonify({'error': 'options must be a list of at least 2 answers'}), 400
        question.options = json.dumps([str(o).strip() for o in options])
        # correct_index may now point past the end of a shortened list.
        if question.correct_index >= len(json.loads(question.options)):
            return jsonify({'error': 'correct_index is out of range for the new options'}), 400
    if 'correct_index' in data:
        ci = data.get('correct_index')
        current = json.loads(question.options) if question.options else []
        if not isinstance(ci, int) or not (0 <= ci < len(current)):
            return jsonify({'error': f'correct_index must be an int 0-{len(current) - 1}'}), 400
        question.correct_index = ci
    if 'explanation' in data:
        question.explanation = (data.get('explanation') or '').strip() or None
    if 'difficulty' in data:
        try:
            question.difficulty = max(1, min(5, int(data.get('difficulty'))))
        except (TypeError, ValueError):
            pass
    if 'level_tested' in data:
        raw = data.get('level_tested')
        question.level_tested = taxonomy.normalize_level(raw) if raw is not None else None
    if 'is_active' in data:
        question.is_active = bool(data.get('is_active'))

    db.session.commit()
    return jsonify({'question': question.to_dict(include_answer=True)}), 200


@api_bp.route('/skills/questions/<int:question_id>', methods=['DELETE'])
@jwt_required()
def delete_skill_question(question_id):
    """Retire a question rather than deleting it.

    Hard-deleting would pull the rug from under anyone mid-attempt, whose row
    holds a snapshot of question ids. is_active hides it from future attempts.
    """
    user = _current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    question = db.session.get(SkillQuestion, question_id)
    if not question:
        return jsonify({'error': 'Question not found'}), 404
    if not _is_author(user) and question.created_by_user_id != user.id:
        return jsonify({'error': 'You can only retire your own questions'}), 403
    question.is_active = False
    db.session.commit()
    return jsonify({'ok': True, 'question_id': question_id, 'is_active': False}), 200


# --------------------------------------------------------------------------
# Taking an assessment
# --------------------------------------------------------------------------
@api_bp.route('/skills/assessments', methods=['POST'])
@jwt_required()
@require_subscription(CVAI_SKILL_ASSESSMENT)
def start_skill_assessment():
    """Start an attempt and snapshot the questions being served."""
    user = _current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json(silent=True) or {}
    skill_slug = data.get('skill_slug')
    entry = None
    if skill_slug:
        entry = _validate_skill_slug(skill_slug)
        if not entry:
            return jsonify({'error': 'Unknown skill. Use a slug from /api/skills/taxonomy.'}), 400

    try:
        limit = int(data.get('limit', DEFAULT_QUESTIONS))
    except (TypeError, ValueError):
        limit = DEFAULT_QUESTIONS
    limit = max(1, min(limit, MAX_QUESTIONS))

    q = SkillQuestion.query.filter_by(is_active=True)
    if entry:
        q = q.filter_by(skill_slug=entry['slug'])
    # Deterministic order so a retake is comparable and pagination is stable.
    questions = q.order_by(SkillQuestion.id.asc()).limit(limit).all()

    if not questions:
        return jsonify({
            'error': 'No questions available yet',
            'detail': 'The bank is empty for this skill.' if entry else 'The bank is empty.',
        }), 409

    attempt = SkillAssessment(
        user_id=user.id,
        skill_slug=entry['slug'] if entry else None,
        status='in_progress',
        total_questions=len(questions),
    )
    # Snapshot the graded CONTENT, not just the ids. Ids alone still break: if a
    # question is edited mid-attempt, grading against the live row would mark an
    # answer wrong for content the user never saw. Storing prompt/options/
    # correct_index/explanation means the attempt is graded exactly as served,
    # and it survives the question being retired or deleted outright.
    attempt.set_answers([
        {
            'question_id': question.id,
            'prompt': question.prompt,
            'options': question.get_options(),
            'correct_index': question.correct_index,
            'explanation': question.explanation,
            'level_tested': question.level_tested,
            'selected': None,
            'correct': None,
        }
        for question in questions
    ])
    db.session.add(attempt)
    db.session.commit()

    return jsonify({
        'assessment_id': attempt.id,
        'skill_slug': attempt.skill_slug,
        'total_questions': attempt.total_questions,
        # correct_index deliberately absent — grading happens on submit.
        'questions': [question.to_dict() for question in questions],
    }), 201


@api_bp.route('/skills/assessments/<int:assessment_id>/submit', methods=['POST'])
@jwt_required()
@require_subscription(CVAI_SKILL_ASSESSMENT)
def submit_skill_assessment(assessment_id):
    """Grade the attempt server-side and award a level."""
    user = _current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    attempt = db.session.get(SkillAssessment, assessment_id)
    if not attempt:
        return jsonify({'error': 'Assessment not found'}), 404
    if attempt.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    if attempt.status == 'completed':
        # Re-submitting must not re-grade: answers are the source of truth and
        # re-grading would let a second payload overwrite a recorded score.
        return jsonify({
            'error': 'This assessment is already completed',
            'assessment': attempt.to_dict(include_answers=True),
        }), 409

    data = request.get_json(silent=True) or {}
    submitted = data.get('answers')
    if not isinstance(submitted, list):
        return jsonify({'error': 'answers must be a list'}), 400

    answers = {a.get('question_id'): a.get('selected') for a in submitted
               if isinstance(a, dict)}
    snapshot = attempt.get_answers()

    # Grading lives in one place (utils/assessment_grading.py) because quizzes
    # grade the same kind of snapshot. The legacy fallback for rows written
    # before content was snapshotted stays here, where the model is available.
    for row in snapshot:
        if row.get('options') and row.get('correct_index') is not None:
            continue
        question = db.session.get(SkillQuestion, row.get('question_id'))
        if question is None:
            continue
        row['options'] = question.get_options()
        row['correct_index'] = question.correct_index
        row.setdefault('prompt', question.prompt)
        row.setdefault('explanation', question.explanation)
        row.setdefault('level_tested', question.level_tested)

    result, feedback = grading.grade(snapshot, answers)
    correct_count = result['correct_count']
    total = result['total_questions']
    percent = result['score_percent']

    if total == 0:
        attempt.status = 'abandoned'
        attempt.completed_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'error': 'None of the submitted questions still exist'}), 409

    attempt.set_answers(snapshot)
    attempt.set_feedback(feedback)
    attempt.correct_count = correct_count
    attempt.total_questions = total
    attempt.score_percent = percent
    attempt.level_awarded = result['level_awarded']
    attempt.status = 'completed'
    attempt.completed_at = datetime.utcnow()
    db.session.commit()

    # Fold the result onto the profile before responding, so the client can show
    # the updated skill immediately rather than after a refetch.
    updated_skill = _write_back_result(user, attempt)

    return jsonify({
        'assessment': attempt.to_dict(include_answers=True),
        'passed': grading.passed(percent, PASS_MARK_PERCENT),
        'feedback': feedback,
        'skill_profile': updated_skill.to_dict() if updated_skill else None,
    }), 200


# --------------------------------------------------------------------------
# History — this is what B2 (progress tracking) reads
# --------------------------------------------------------------------------
@api_bp.route('/skills/assessments', methods=['GET'])
@jwt_required()
@require_subscription(CVAI_SKILL_ASSESSMENT)
def list_skill_assessments():
    """My assessment history, newest first."""
    user = _current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    try:
        limit = max(1, min(int(request.args.get('limit', 20)), 100))
    except (TypeError, ValueError):
        limit = 20
    slug = (request.args.get('skill_slug') or '').strip()

    q = SkillAssessment.query.filter_by(user_id=user.id)
    if slug:
        q = q.filter_by(skill_slug=slug)
    rows = q.order_by(SkillAssessment.id.desc()).limit(limit).all()
    return jsonify({'assessments': [r.to_dict() for r in rows], 'count': len(rows)}), 200


@api_bp.route('/skills/assessments/<int:assessment_id>', methods=['GET'])
@jwt_required()
@require_subscription(CVAI_SKILL_ASSESSMENT)
def get_skill_assessment(assessment_id):
    """One attempt with its feedback. Owner only."""
    user = _current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    attempt = db.session.get(SkillAssessment, assessment_id)
    if not attempt:
        return jsonify({'error': 'Assessment not found'}), 404
    if attempt.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    return jsonify({'assessment': attempt.to_dict(include_answers=True)}), 200


@api_bp.route('/skills/levels', methods=['GET'])
@jwt_required()
@require_subscription(CVAI_SKILL_ASSESSMENT)
def get_skill_levels():
    """The level each assessed skill last earned.

    Reads the user's most recent completed attempt per skill. This is the input
    A2 will write into the learner skill profile once that lands, and the same
    shape the B1 planner reads, so neither has to recompute it.
    """
    user = _current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    rows = (SkillAssessment.query
            .filter_by(user_id=user.id, status='completed')
            .order_by(SkillAssessment.completed_at.asc(), SkillAssessment.id.asc())
            .all())

    latest = {}
    for row in rows:
        if row.skill_slug:
            latest[row.skill_slug] = {
                'level': row.level_awarded,
                'score_percent': row.score_percent,
                'assessment_id': row.id,
                'completed_at': row.to_dict()['completed_at'],
            }

    return jsonify({
        'levels': latest,
        'assessed_skill_count': len(latest),
        'assessment_count': len(rows),
    }), 200
"""Guided projects: build-it work, reviewed against authored criteria.

On api_bp so the blueprint-wide email-verification guard applies.

Two rules shape every decision here:

1. The acceptance criteria are an answer key. A locked project reports its title,
   summary, skills and how many steps it has — enough to sell it — and never the
   criteria, because handing over the rubric turns the review into a formality.

2. A failed review is reported as a failed review. If the model is unreachable or
   returns something unusable, the attempt is stored as submitted with
   review_status='unavailable' and the learner is told it can be retried. It is
   never given a score nobody computed.
"""
from datetime import datetime

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import api_bp
from ...extensions import db
from ...models import GuidedProject, GuidedProjectAttempt
from ...utils import guided_project_review as review_utils
from ...utils.subscription import CVAI_PROJECTS, check_content_access
from ...utils.timezone_utils import utc_iso

# Bounds on a submission. The upper bound exists to cap provider cost: this text
# goes into a prompt, and an unbounded body would let one request bill for a
# novel.
MAX_SUBMISSION_CHARS = 20000
MAX_NOTES_CHARS = 4000

REVIEW_SYSTEM_PROMPT = """You review a learner's submitted work against fixed acceptance criteria.

Rules you must follow:
- Answer ONLY with a JSON object. No prose before or after it.
- Judge each criterion independently, using only the submission you are given.
- evidence_quote must be copied verbatim from the submission. If no text in the
  submission decides the criterion, use an empty string and verdict "not_met".
  Never paraphrase the submission into your own words as a quote.
- feedback is one sentence addressed to the learner, plain and specific.
- Be honest. A criterion that is not evidenced is not_met, even if the work
  looks broadly good.

Output shape:
{"reviews": [{"criterion_index": 1, "verdict": "met|partially_met|not_met",
  "feedback": "...", "evidence_quote": "verbatim from the submission"}]}"""


def _me():
    from ...models import User
    try:
        return db.session.get(User, int(get_jwt_identity()))
    except (TypeError, ValueError):
        return None


def _find(slug):
    return GuidedProject.query.filter_by(
        slug=(slug or '').strip().lower(), is_active=True).first()


def _describe_locked(project):
    """What a lapsed account may see: enough to want it, nothing that gives it away."""
    payload = project.to_dict()
    payload.pop("acceptance_criteria", None)
    payload["locked"] = True
    return payload


def _gate(project):
    """Entitlement for one project. Returns (allowed, error, code).

    A function, not the @require_subscription decorator: a decorator runs before
    the route body and would refuse a free preview before the route had even
    loaded it. See check_content_access in utils/subscription.py.
    """
    return check_content_access(CVAI_PROJECTS,
                                free_preview=bool(project.is_free_preview))


@api_bp.route('/guided-projects', methods=['GET'])
@jwt_required()
def list_guided_projects():
    """Active projects. Locked ones are listed so they can be sold."""
    if not _me():
        return jsonify({'error': 'User not found'}), 404

    projects = (GuidedProject.query.filter_by(is_active=True)
                .order_by(GuidedProject.id.asc()).all())
    unlocked, locked = [], []
    for project in projects:
        if project.is_free_preview:
            unlocked.append(project.to_dict())
        else:
            locked.append(_describe_locked(project))

    return jsonify({
        'projects': unlocked + locked,
        'unlocked_count': len(unlocked),
        'locked_count': len(locked),
    }), 200


@api_bp.route('/guided-projects/<slug>', methods=['GET'])
@jwt_required()
def get_guided_project(slug):
    """The full brief, including the criteria the work is judged against."""
    if not _me():
        return jsonify({'error': 'User not found'}), 404

    project = _find(slug)
    if not project:
        return jsonify({'error': 'Project not found'}), 404

    allowed, error, code = _gate(project)
    if not allowed:
        return jsonify({
            'project': _describe_locked(project),
            'locked': True,
            'message': 'Subscribe to see this brief.',
        }), code
    return jsonify({'project': project.to_dict(detail=True)}), 200


@api_bp.route('/guided-projects/<slug>/attempts', methods=['POST'])
@jwt_required()
def start_guided_project(slug):
    """Start an attempt. Re-starting returns the unfinished one rather than a duplicate."""
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    project = _find(slug)
    if not project:
        return jsonify({'error': 'Project not found'}), 404

    allowed, error, code = _gate(project)
    if not allowed:
        return error, code

    steps = project.get_steps()
    if not steps:
        return jsonify({
            'error': 'This project has no steps yet',
            'detail': 'An author may not have finished writing it.',
        }), 409

    existing = (GuidedProjectAttempt.query
                .filter_by(user_id=user.id, project_id=project.id,
                           status='in_progress')
                .order_by(GuidedProjectAttempt.id.desc()).first())
    if existing:
        # Resuming, not restarting. Two open attempts on one project would make
        # "which one is mine" the learner's problem.
        return jsonify({
            'attempt': existing.to_dict(),
            'project': project.to_dict(detail=True),
            'resumed': True,
        }), 200

    attempt = GuidedProjectAttempt(
        project_id=project.id, user_id=user.id, status='in_progress',
        review_status='none', current_step=0,
    )
    db.session.add(attempt)
    db.session.commit()

    return jsonify({
        'attempt': attempt.to_dict(),
        'project': project.to_dict(detail=True),
        'resumed': False,
    }), 201


@api_bp.route('/guided-projects/attempts/<int:attempt_id>', methods=['PATCH'])
@jwt_required()
def save_guided_project_progress(attempt_id):
    """Save notes or move the step marker. Autosave-friendly."""
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    attempt = db.session.get(GuidedProjectAttempt, attempt_id)
    if not attempt:
        return jsonify({'error': 'Attempt not found'}), 404
    if attempt.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403

    if attempt.project is None:
        return jsonify({'error': 'The project behind this attempt no longer exists'}), 409
    # Entitlement before state, matching the retry route: a lapsed account is
    # told it cannot write, not that the attempt is already submitted. Work in
    # progress on a free preview keeps autosaving for someone whose
    # subscription has since lapsed — they started it legitimately, and taking
    # away the ability to save their own notes would be a strange way to end it.
    allowed, error, code = _gate(attempt.project)
    if not allowed:
        return error, code

    if attempt.status != 'in_progress':
        return jsonify({
            'error': 'This attempt has already been submitted',
            'attempt': attempt.to_dict(include_review=True),
        }), 409

    data = request.get_json(silent=True) or {}

    if 'notes' in data:
        notes = data.get('notes')
        if notes is not None and not isinstance(notes, str):
            return jsonify({'error': 'notes must be a string'}), 400
        attempt.notes = (notes or '')[:MAX_NOTES_CHARS]

    if 'current_step' in data:
        step = data.get('current_step')
        step_count = len(attempt.project.get_steps()) if attempt.project else 0
        try:
            step = int(step)
        except (TypeError, ValueError):
            return jsonify({'error': 'current_step must be an integer'}), 400
        # Clamped rather than rejected: a client that is a step ahead because of
        # an off-by-one should be pulled back, not shown an error it cannot fix.
        attempt.current_step = max(0, min(step, max(0, step_count - 1)))

    db.session.commit()
    return jsonify({'attempt': attempt.to_dict()}), 200


@api_bp.route('/guided-projects/attempts/<int:attempt_id>/submit', methods=['POST'])
@jwt_required()
def submit_guided_project(attempt_id):
    """Submit the work and review it against the project's criteria.

    Costs AI tokens, and the allowance is enforced inside AIService before the
    provider is called. If the reviewer cannot be reached the submission is still
    kept and the learner is told so plainly.
    """
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    attempt = db.session.get(GuidedProjectAttempt, attempt_id)
    if not attempt:
        return jsonify({'error': 'Attempt not found'}), 404
    if attempt.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    if attempt.status != 'in_progress':
        # Re-submitting must not re-grade and must not spend tokens again.
        return jsonify({
            'error': 'This attempt has already been submitted',
            'attempt': attempt.to_dict(include_review=True),
        }), 409

    project = attempt.project
    if project is None:
        return jsonify({'error': 'The project behind this attempt no longer exists'}), 409

    allowed, error, code = _gate(project)
    if not allowed:
        return error, code

    data = request.get_json(silent=True) or {}
    submission = data.get('submission')
    if not isinstance(submission, str) or not submission.strip():
        return jsonify({'error': 'submission is required'}), 400
    submission = submission.strip()[:MAX_SUBMISSION_CHARS]

    criteria = review_utils.criteria_from_spec(project.get_criteria())
    if not criteria:
        return jsonify({
            'error': 'This project has no acceptance criteria',
            'detail': 'Without criteria there is nothing to review against, '
                      'so no score would mean anything.',
        }), 409

    attempt.submission = submission
    attempt.status = 'submitted'
    attempt.submitted_at = datetime.utcnow()
    attempt.review_status = 'pending'
    db.session.commit()

    result, error = _review_submission(user, project, criteria, submission)
    if error:
        attempt.review_status = 'unavailable'
        attempt.completed_at = datetime.utcnow()
        db.session.commit()
        return jsonify({
            'attempt': attempt.to_dict(),
            'review_status': 'unavailable',
            'message': 'Your work was saved, but the reviewer could not be reached. '
                       'Nothing was scored. Submit again when you like — you are '
                       'not charged again for a failed review.',
            'detail': error,
        }), 503

    pass_mark = int(project.pass_percent or 70)
    attempt.set_review(result)
    attempt.score_percent = result['score_percent']
    attempt.passed = result['score_percent'] >= pass_mark
    attempt.review_status = 'done'
    attempt.status = 'reviewed'
    attempt.completed_at = datetime.utcnow()

    updated = []
    if not project.is_free_preview:
        updated = _write_back(user, project, result, attempt)
    db.session.commit()

    return jsonify({
        'attempt': attempt.to_dict(include_review=True),
        'passed': bool(attempt.passed),
        'pass_mark': pass_mark,
        'review': result,
        'skills_updated': [s.to_dict() for s in updated],
    }), 200


def _review_submission(user, project, criteria, submission):
    """Ask the model for per-criterion verdicts, then compute the score ourselves.

    Returns (result, None) or (None, reason). The model is never asked for a
    score; if it volunteers one it is ignored.
    """
    from ...ai_service import AIService
    # Three dots: this file is backend/api/projects/routes.py, so `..` is
    # backend.api and the mentorship package is one level further out.
    from ...mentorship.generator import extract_json

    prompt = review_utils.build_review_prompt({
        'title': project.title,
        'summary': project.summary,
    }, submission, criteria)

    try:
        response = AIService().generate_response(
            REVIEW_SYSTEM_PROMPT, prompt, user=user,
            operation_type="cvai_project_review")
    except Exception as exc:
        # The allowance being spent lands here as an exception, and that is a
        # legitimate "could not review" rather than a crash.
        return None, str(exc)

    payload = extract_json(response)
    if not payload or not isinstance(payload.get("reviews"), list):
        return None, 'the reviewer returned nothing usable'

    return review_utils.apply_review(criteria, payload["reviews"], submission), None


def _write_back(user, project, result, attempt):
    """Record the project on the profile for the skills it targets.

    Marked evidence_source='project' and left unverified, for the same reason a
    quiz result is: a submitted write-up shows the learner engaged with the work
    and cannot show the code runs. Nothing here may claim more than that.
    """
    from ...utils import assessment_grading as grading
    from ...utils.skill_taxonomy import level_for_score, resolve

    updated = []
    for slug in project.get_skill_slugs():
        # Uncatalogued skill text is dropped rather than invented, so a project
        # authored against a typo cannot mint a new skill on someone's profile.
        entry = resolve(slug)
        if not entry:
            continue

        level = level_for_score(result['score_percent'])
        skill = grading.write_back_skill(user, entry['slug'], level, {
            'project_id': project.id,
            'project_slug': project.slug,
            'score_percent': result['score_percent'],
            'passed': bool(attempt.passed),
            'criteria_met': result['criteria_met'],
            'criteria_total': result['criteria_total'],
        }, when=attempt.completed_at)
        if skill is not None:
            skill.evidence_source = 'project'
            skill.verified = False
            updated.append(skill)
    return updated


@api_bp.route('/guided-projects/attempts', methods=['GET'])
@jwt_required()
def list_guided_project_attempts():
    """My project history, newest first."""
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    try:
        limit = max(1, min(int(request.args.get('limit', 20)), 100))
    except (TypeError, ValueError):
        limit = 20
    rows = (GuidedProjectAttempt.query.filter_by(user_id=user.id)
            .order_by(GuidedProjectAttempt.id.desc()).limit(limit).all())
    return jsonify({
        'attempts': [a.to_dict() for a in rows],
        'count': len(rows),
    }), 200


@api_bp.route('/guided-projects/attempts/<int:attempt_id>', methods=['GET'])
@jwt_required()
def get_guided_project_attempt(attempt_id):
    """One attempt with its submission and review. Owner only."""
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    attempt = db.session.get(GuidedProjectAttempt, attempt_id)
    if not attempt:
        return jsonify({'error': 'Attempt not found'}), 404
    if attempt.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    return jsonify({'attempt': attempt.to_dict(include_review=True)}), 200


@api_bp.route('/guided-projects/<slug>/attempts', methods=['GET'])
@jwt_required()
def get_guided_project_attempt_by_slug(slug):
    """My most recent attempt at one project. Owner only, and no entitlement
    needed to read your own history — losing CVAI must not erase what you built."""
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    project = _find(slug)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    row = (GuidedProjectAttempt.query
           .filter_by(user_id=user.id, project_id=project.id)
           .order_by(GuidedProjectAttempt.id.desc()).first())
    if not row:
        return jsonify({'error': 'You have not attempted this project'}), 404
    return jsonify({'attempt': row.to_dict(include_review=True)}), 200


@api_bp.route('/guided-projects/attempts/<int:attempt_id>/review', methods=['POST'])
@jwt_required()
def retry_guided_project_review(attempt_id):
    """Re-run the review on an attempt whose reviewer was unavailable.

    Only for review_status='unavailable'. A completed review is left alone: if
    the learner disliked a low score, retrying until it improved would make the
    score meaningless.
    """
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    attempt = db.session.get(GuidedProjectAttempt, attempt_id)
    if not attempt:
        return jsonify({'error': 'Attempt not found'}), 404
    if attempt.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403

    # Entitlement first, before any state check. This is the one route that can
    # spend tokens on an already-decided attempt, so the guarantee that a lapsed
    # account never reaches a model call has to hold before we look at whether
    # there is anything to review.
    if attempt.project is None:
        return jsonify({'error': 'The project behind this attempt no longer exists'}), 409
    allowed, error, code = _gate(attempt.project)
    if not allowed:
        return error, code

    if attempt.review_status == 'done':
        return jsonify({
            'error': 'This attempt has already been reviewed',
            'attempt': attempt.to_dict(include_review=True),
        }), 409
    if attempt.review_status == 'none':
        return jsonify({'error': 'This attempt has not been submitted yet'}), 409
    if not (attempt.submission or '').strip():
        return jsonify({'error': 'There is no submission to review'}), 409

    project = attempt.project
    criteria = review_utils.criteria_from_spec(project.get_criteria() if project else [])
    if not criteria:
        return jsonify({'error': 'This project has no acceptance criteria'}), 409

    allowed, error, code = _gate(project)
    if not allowed:
        return error, code

    attempt.review_status = 'pending'
    db.session.commit()

    result, error = _review_submission(user, project, criteria, attempt.submission)
    if error:
        attempt.review_status = 'unavailable'
        db.session.commit()
        return jsonify({
            'review_status': 'unavailable',
            'message': 'The reviewer is still unreachable. Nothing was scored.',
            'detail': error,
        }), 503

    pass_mark = int(project.pass_percent or 70)
    attempt.set_review(result)
    attempt.score_percent = result['score_percent']
    attempt.passed = result['score_percent'] >= pass_mark
    attempt.review_status = 'done'
    attempt.status = 'reviewed'
    attempt.completed_at = attempt.completed_at or datetime.utcnow()
    db.session.commit()

    return jsonify({
        'attempt': attempt.to_dict(include_review=True),
        'passed': bool(attempt.passed),
        'pass_mark': pass_mark,
        'review': result,
    }), 200


@api_bp.route('/guided-projects/meta', methods=['GET'])
@jwt_required()
def guided_projects_meta():
    """Shapes the client needs, so it need not hardcode them."""
    return jsonify({
        'max_submission_chars': MAX_SUBMISSION_CHARS,
        'max_notes_chars': MAX_NOTES_CHARS,
        'generated_at': utc_iso(datetime.utcnow()),
    }), 200

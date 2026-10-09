"""Mentorship plans: create, track progress, regenerate.

On api_bp rather than its own blueprint so the blueprint-wide
email-verification guard applies. That guard is registered with
`@api_bp.before_request`, so a separate blueprint would silently skip it — the
same trap recommendations_bp and practice_ai_bp already fell into.

Progress (step completion) is plain CRUD and costs nothing. Regeneration calls
the model, so it is rate limited tightly and gated on the CVAI entitlement like
the rest of the mentorship surface.
"""
from datetime import datetime

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import api_bp
from ...extensions import db
from ...models import (
    MentorshipPlan, MentorshipStep, Post, Skill, SkillAssessment,
)
from ...utils import mentorship_planner as planner
from ...utils import mentorship_progress as progress_utils
from ...utils.mentorship_planner import VALID_STEP_STATUSES, clamp_int
from ...utils.mentorship_progress import parse_iso
from ...utils.skill_taxonomy import LEVELS, SKILLS
from ...utils.subscription import CVAI_MENTORSHIP, require_subscription
from ...mentorship.generator import gaps_from_targets, propose_steps, propose_targets

MAX_GOAL_LEN = 255
MAX_PLANS_PER_USER = 20

# Wording the UI can show directly, so the verdict is not re-invented (and
# mis-spelled) per screen.
_VERDICT_LABELS = {
    "done": "Finished",
    "on_track": "On track",
    "behind": "Behind schedule",
    "off_track": "Well behind schedule",
    "not_started": "Not started yet",
}


def _me():
    from ...models import User
    try:
        return db.session.get(User, int(get_jwt_identity()))
    except (TypeError, ValueError):
        return None


def _current_skills(user):
    """What the learner holds, with levels, for gap detection."""
    rows = Skill.query.filter_by(user_id=user.id).all()
    return [{"name": s.name, "level": s.level} for s in rows if s.name]


def _requirements_for(goal_post_id):
    """Requirements of a saved posting, as the gap engine wants them."""
    post = db.session.get(Post, goal_post_id)
    if not post:
        return None, []
    import json as _json
    requirements = []
    if post.requirements:
        try:
            parsed = _json.loads(post.requirements)
            requirements = parsed if isinstance(parsed, list) else []
        except (_json.JSONDecodeError, TypeError):
            requirements = []
    return post, requirements


@api_bp.route('/mentorship/plans', methods=['POST'])
@jwt_required()
@require_subscription(CVAI_MENTORSHIP)
def create_mentorship_plan():
    """Build a plan from the learner's evidence and their budgets.

    Two ways to name the goal, in order of preference:
      * goal_post_id — a real posting's requirements, which is a fact
      * goal text     — free text, where the model proposes target skills and
                       code keeps only ones that are catalogued

    Either way the steps that come back are filtered against the gap that was
    actually measured, so the model cannot widen the scope.
    """
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json(silent=True) or {}
    goal = (data.get('goal') or '').strip()[:MAX_GOAL_LEN]
    goal_post_id = data.get('goal_post_id')

    post, requirements = (None, [])
    if goal_post_id:
        post, requirements = _requirements_for(goal_post_id)
        if not post:
            return jsonify({'error': 'That job posting no longer exists'}), 404
        goal = goal or (post.title or '')[:MAX_GOAL_LEN]
    if not goal:
        return jsonify({'error': 'Describe the role or goal you are aiming for'}), 400

    weekly_hours = clamp_int(data.get('weekly_hours', 5), 1, 40, 5)
    budget_amount = clamp_int(data.get('budget_amount', 0), 0, 1_000_000, 0)
    budget_currency = (data.get('budget_currency') or 'USD').strip().upper()[:8] or 'USD'
    target_weeks = data.get('target_weeks')
    target_weeks = clamp_int(target_weeks, 1, 520, None) if target_weeks else None

    existing = MentorshipPlan.query.filter_by(user_id=user.id, status='active').count()
    if existing >= MAX_PLANS_PER_USER:
        return jsonify({
            'error': f'You already have {existing} active plans',
            'detail': f'Finish or abandon one before starting another (limit {MAX_PLANS_PER_USER}).',
        }), 409

    # 1. What does the learner have, and what does the goal want?
    analysis = planner.compute_target_skills(_current_skills(user), requirements)

    targets = analysis['target']
    ai_ok = True
    if not targets:
        # Free-text goal: let the model name catalogued skills, then keep only
        # the ones the taxonomy knows.
        slugs, ai_ok = propose_targets(goal, list(SKILLS.keys()), user)
        kept = []
        for slug in slugs:
            entry = next((t for t in targets if t['slug'] == slug), None)
            if entry:
                kept.append(entry)
            else:
                resolved = {s: None for s in SKILLS}
                name = SKILLS[slug]['name']
                kept.append({'slug': slug, 'name': name,
                             'needed_level': 'Intermediate', 'state': 'missing'})
        targets = kept

    gaps = gaps_from_targets(targets)
    if not gaps:
        return jsonify({
            'error': 'You already meet the skills this goal asks for',
            'detail': 'Nothing to plan yet.' if targets else
                      'We could not identify the skills this goal needs.',
            'match_ratio': analysis['match_ratio'],
        }), 409

    # 2. Ask what to do about the gaps we actually measured.
    steps = propose_steps(gaps, goal, user, budget_amount, weekly_hours)
    steps, budget = planner.enforce_budget(steps, budget_amount, weekly_hours, target_weeks)
    steps = planner.assign_target_dates(steps, weekly_hours)

    if not steps:
        return jsonify({
            'error': 'Could not build a plan for this goal',
            'detail': ('The resource suggestion did not return anything usable for the '
                       'skills you are missing. Try naming the role more specifically.'),
            'gaps': [{'slug': g['slug'], 'name': g['name'], 'state': g['state']} for g in gaps],
            'ai_available': ai_ok,
        }), 502

    # 3. Persist. Totals come from the enforcement result, never from the model.
    plan = MentorshipPlan(
        user_id=user.id,
        goal=goal,
        goal_post_id=post.id if post else None,
        weekly_hours=weekly_hours,
        budget_amount=budget_amount,
        budget_currency=budget_currency,
        total_hours=budget['total_hours'],
        total_cost=budget['total_cost'],
        weeks=budget['weeks_needed'],
        trimmed=budget['trimmed'],
        trim_reason=budget['trim_reason'],
    )
    plan.set_target_skills([t['slug'] for t in targets])
    plan.set_baseline_skills(analysis['current'])
    db.session.add(plan)
    db.session.flush()

    for index, step in enumerate(steps):
        db.session.add(MentorshipStep(
            plan_id=plan.id,
            order_index=index,
            title=step['title'],
            description=step.get('description'),
            skill_slug=step['skill_slug'],
            target_level=step.get('target_level'),
            resource_type=step.get('resource_type'),
            resource_name=step.get('resource_name'),
            resource_url=step.get('resource_url'),
            cost=step['cost'],
            hours_estimate=step['hours_estimate'],
            optional=step['optional'],
            target_date=step.get('target_date'),
        ))
    db.session.commit()

    return jsonify({
        'plan': plan.to_dict(),
        'unclassified_requirements': analysis['unclassified_requirements'],
        'gaps_addressed': [{'slug': g['slug'], 'name': g['name'], 'state': g['state']}
                           for g in gaps],
        'dropped_optional_steps': budget['dropped_count'],
        'within_budget': budget['within_budget'],
        'within_time': budget['within_time'],
    }), 201


@api_bp.route('/mentorship/plans', methods=['GET'])
@jwt_required()
@require_subscription(CVAI_MENTORSHIP)
def list_mentorship_plans():
    """The learner's plans, newest first. Query ?include_steps=1 for full plans."""
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    include_steps = (request.args.get('include_steps') or '').lower() in ('1', 'true', 'yes')
    status = (request.args.get('status') or '').strip()
    q = MentorshipPlan.query.filter_by(user_id=user.id)
    if status:
        q = q.filter_by(status=status)
    plans = q.order_by(MentorshipPlan.id.desc()).limit(50).all()
    return jsonify({
        'plans': [p.to_dict(include_steps=include_steps) for p in plans],
        'count': len(plans),
    }), 200


@api_bp.route('/mentorship/plans/<int:plan_id>', methods=['GET'])
@jwt_required()
@require_subscription(CVAI_MENTORSHIP)
def get_mentorship_plan(plan_id):
    """One plan, plus whether it has gone stale against current evidence."""
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    plan = MentorshipPlan.query.filter_by(id=plan_id, user_id=user.id).first()
    if not plan:
        return jsonify({'error': 'Plan not found'}), 404

    # Staleness: has the learner since closed a gap this plan was built for?
    # Two ways that counts — a brand new skill they did not have at all, or one
    # that has moved from self-declared to assessment-verified.
    current = planner.compute_target_skills(_current_skills(user), [])['current']
    baseline = plan.get_baseline_skills()

    closed = []
    for slug in plan.get_target_skills():
        before = baseline.get(slug)
        now = current.get(slug)
        if not before and now:
            closed.append(slug)
        elif before and now and not before.get('verified') and now.get('verified'):
            closed.append(slug)

    return jsonify({
        'plan': plan.to_dict(),
        'stale': bool(closed),
        'closed_since_creation': closed,
        'detail': ('You have since gained skills this plan was built for. '
                   'Consider regenerating it.' if closed else None),
    }), 200


@api_bp.route('/mentorship/plans/<int:plan_id>/steps/<int:step_id>', methods=['PATCH'])
@jwt_required()
@require_subscription(CVAI_MENTORSHIP)
def update_mentorship_step(plan_id, step_id):
    """Mark a step done / in progress / skipped.

    Completing every step completes the plan. Nothing here calls the model, so
    progress tracking stays available even to a learner who has exhausted their
    token allowance — being unable to record what you finished would be perverse.
    """
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    plan = MentorshipPlan.query.filter_by(id=plan_id, user_id=user.id).first()
    if not plan:
        return jsonify({'error': 'Plan not found'}), 404
    step = MentorshipStep.query.filter_by(id=step_id, plan_id=plan.id).first()
    if not step:
        return jsonify({'error': 'Step not found'}), 404

    data = request.get_json(silent=True) or {}
    status = (data.get('status') or '').strip().lower()
    if status not in VALID_STEP_STATUSES:
        return jsonify({
            'error': f'status must be one of {", ".join(VALID_STEP_STATUSES)}'
        }), 400

    step.status = status
    step.completed_at = datetime.utcnow() if status == 'done' else None
    db.session.commit()

    active = [s for s in plan.steps if s.status != 'skipped']
    if active and all(s.status == 'done' for s in active):
        plan.status = 'completed'
        plan.completed_at = datetime.utcnow()
        db.session.commit()

    return jsonify({'plan': plan.to_dict(), 'step': step.to_dict()}), 200


@api_bp.route('/mentorship/plans/<int:plan_id>', methods=['PATCH'])
@jwt_required()
@require_subscription(CVAI_MENTORSHIP)
def update_mentorship_plan(plan_id):
    """Abandon or reopen a plan. Budgets are not editable after the fact —
    they shaped the steps, so changing one would make the totals a lie."""
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    plan = MentorshipPlan.query.filter_by(id=plan_id, user_id=user.id).first()
    if not plan:
        return jsonify({'error': 'Plan not found'}), 404

    status = (request.get_json(silent=True) or {}).get('status', '').strip().lower()
    if status not in ('active', 'completed', 'abandoned'):
        return jsonify({'error': "status must be active, completed or abandoned"}), 400
    plan.status = status
    plan.completed_at = datetime.utcnow() if status == 'completed' else None
    db.session.commit()
    return jsonify({'plan': plan.to_dict()}), 200


@api_bp.route('/mentorship/plans/<int:plan_id>/regenerate', methods=['POST'])
@jwt_required()
@require_subscription(CVAI_MENTORSHIP)
def regenerate_mentorship_plan(plan_id):
    """Rebuild the steps against the learner's *current* evidence.

    Costs a model call, unlike progress tracking. The old steps are deleted
    rather than kept: a regenerated plan is a different plan, and leaving the
    previous ones visible invites comparing progress across two different sets
    of work, which is meaningless.
    """
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    plan = MentorshipPlan.query.filter_by(id=plan_id, user_id=user.id).first()
    if not plan:
        return jsonify({'error': 'Plan not found'}), 404

    post, requirements = (None, [])
    if plan.goal_post_id:
        post, requirements = _requirements_for(plan.goal_post_id)
        if not post:
            return jsonify({'error': 'The job posting this plan referenced is gone'}), 409

    analysis = planner.compute_target_skills(_current_skills(user), requirements)
    targets = analysis['target']
    if not targets:
        slugs, _ = propose_targets(plan.goal, list(SKILLS.keys()), user)
        targets = [{'slug': s, 'name': SKILLS[s]['name'], 'needed_level': 'Intermediate',
                    'state': 'missing'} for s in slugs]

    gaps = gaps_from_targets(targets)
    if not gaps:
        return jsonify({
            'error': 'Nothing left to plan — you meet this goal now',
            'match_ratio': analysis['match_ratio'],
        }), 409

    steps = propose_steps(gaps, plan.goal, user, plan.budget_amount, plan.weekly_hours)
    steps, budget = planner.enforce_budget(steps, plan.budget_amount, plan.weekly_hours)
    steps = planner.assign_target_dates(steps, plan.weekly_hours)
    if not steps:
        return jsonify({'error': 'Could not rebuild steps for this plan'}), 502

    MentorshipStep.query.filter_by(plan_id=plan.id).delete()
    plan.total_hours = budget['total_hours']
    plan.total_cost = budget['total_cost']
    plan.weeks = budget['weeks_needed']
    plan.trimmed = budget['trimmed']
    plan.trim_reason = budget['trim_reason']
    plan.set_target_skills([t['slug'] for t in targets])
    plan.set_baseline_skills(analysis['current'])
    plan.status = 'active'
    plan.completed_at = None
    db.session.flush()

    for index, step in enumerate(steps):
        db.session.add(MentorshipStep(
            plan_id=plan.id, order_index=index, title=step['title'],
            description=step.get('description'), skill_slug=step['skill_slug'],
            target_level=step.get('target_level'), resource_type=step.get('resource_type'),
            resource_name=step.get('resource_name'), resource_url=step.get('resource_url'),
            cost=step['cost'], hours_estimate=step['hours_estimate'],
            optional=step['optional'], target_date=step.get('target_date'),
        ))
    db.session.commit()
    return jsonify({'plan': plan.to_dict()}), 200


@api_bp.route('/mentorship/plans/<int:plan_id>/progress', methods=['GET'])
@jwt_required()
@require_subscription(CVAI_MENTORSHIP)
def get_mentorship_progress(plan_id):
    """Plan versus actual for one plan.

    Cheap by construction: no model call, so this stays available to a learner
    who has spent their allowance, and cheap enough to poll while a step is
    open.
    """
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    plan = MentorshipPlan.query.filter_by(id=plan_id, user_id=user.id).first()
    if not plan:
        return jsonify({'error': 'Plan not found'}), 404

    payload = plan.to_dict()
    progress = progress_utils.plan_progress(payload)

    # Which steps are overdue against the dates the plan showed the learner.
    now = datetime.utcnow()
    overdue = []
    for step in payload.get('steps', []):
        if step.get('status') in ('done', 'skipped') or not step.get('target_date'):
            continue
        due = parse_iso(step['target_date'])
        if due and due < now:
            overdue.append({'step_id': step['id'], 'title': step['title'],
                            'target_date': step['target_date']})

    return jsonify({
        'plan_id': plan.id,
        'progress': progress,
        'overdue_steps': overdue,
        'status_label': _VERDICT_LABELS.get(progress['verdict'], progress['verdict']),
    }), 200


@api_bp.route('/mentorship/progress', methods=['GET'])
@jwt_required()
@require_subscription(CVAI_MENTORSHIP)
def get_learner_progress():
    """Everything at once: plan pace plus skill-level trends over time.

    This is B2's "am I getting anywhere" view. Skill trends come from completed
    assessments rather than from plans, because a retaken assessment is the only
    thing in the product that re-measures a skill.
    """
    user = _me()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    plans = (MentorshipPlan.query
             .filter_by(user_id=user.id)
             .order_by(MentorshipPlan.id.desc())
             .limit(20).all())
    plan_dicts = [p.to_dict() for p in plans]

    attempts = (SkillAssessment.query
                .filter_by(user_id=user.id, status='completed')
                .order_by(SkillAssessment.completed_at.asc(), SkillAssessment.id.asc())
                .all())
    attempt_dicts = [a.to_dict() for a in attempts]

    history = progress_utils.skill_level_history(attempt_dicts)
    summary = progress_utils.learner_progress(plan_dicts, history)

    return jsonify({
        'summary': summary,
        'skill_history': history,
    }), 200


@api_bp.route('/mentorship/plans/options', methods=['GET'])
@jwt_required()
def mentorship_options():
    """Levels and the budget shape the planner accepts, so the client cannot
    offer a control the server would reject."""
    return jsonify({
        'levels': list(LEVELS),
        'weekly_hours_range': {'min': 1, 'max': 40, 'default': 5},
        'target_weeks_range': {'min': 1, 'max': 520},
        'budget_currency_default': 'USD',
        'max_active_plans': MAX_PLANS_PER_USER,
    }), 200
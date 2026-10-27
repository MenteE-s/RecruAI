"""Platform admin endpoints (superadmin only).

The admin dashboard (admin/) talks to these — one backend for both apps.
Every route requires @superadmin_required: the flag is re-read from the
database per request, so demotion takes effect immediately.
"""

from datetime import datetime

from flask import jsonify, request

from .. import api_bp
from ..decorators import superadmin_required
from ...extensions import db
from ...models import Organization, OutboxEvent, User
from ...utils.org_permissions import sync_primary_org
from ...utils.pagination import (
    Pagination,
    get_pagination_params,
    paginated_response,
)
from ...utils.security import log_security_event, sanitize_input


def _bool_param(value, field):
    if not isinstance(value, bool):
        return None, (jsonify({"error": f"{field} must be true or false"}), 400)
    return value, None


@api_bp.route("/admin/overview", methods=["GET"])
@superadmin_required
def admin_overview():
    """Platform counts for the admin dashboard landing page."""
    from sqlalchemy import func

    from ...models.outbox_event import (
        STATUS_DEAD,
        STATUS_FAILED,
        STATUS_PENDING,
    )
    from ...scheduler import scheduler_health
    from flask import current_app

    users_total = db.session.query(func.count(User.id)).scalar() or 0
    paid_users = (
        db.session.query(func.count(User.id))
        .filter(User.subscription_status == "active", User.paid_plan.is_(True))
        .scalar()
        or 0
    )
    trial_users = (
        db.session.query(func.count(User.id))
        .filter(User.subscription_status == "trial")
        .scalar()
        or 0
    )
    orgs_total = db.session.query(func.count(Organization.id)).scalar() or 0
    paid_orgs = (
        db.session.query(func.count(Organization.id))
        .filter(Organization.subscription_status == "active")
        .scalar()
        or 0
    )
    outbox = dict(
        db.session.query(OutboxEvent.status, func.count(OutboxEvent.id))
        .filter(
            OutboxEvent.status.in_([STATUS_PENDING, STATUS_FAILED, STATUS_DEAD])
        )
        .group_by(OutboxEvent.status)
        .all()
    )
    try:
        sched = scheduler_health(current_app._get_current_object())
        scheduler_ok = bool(sched.get("healthy"))
    except Exception:
        scheduler_ok = False

    return jsonify({
        "users": {"total": users_total, "paid": paid_users, "trial": trial_users},
        "organizations": {"total": orgs_total, "paid": paid_orgs},
        "outbox": {
            "pending": int(outbox.get(STATUS_PENDING, 0)),
            "failed": int(outbox.get(STATUS_FAILED, 0)),
            "dead": int(outbox.get(STATUS_DEAD, 0)),
        },
        "scheduler_healthy": scheduler_ok,
    }), 200


def _user_admin_dict(user):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "is_superadmin": bool(user.is_superadmin),
        "plan": user.plan,
        "subscription_status": user.subscription_status,
        "paid_plan": bool(user.paid_plan),
        "token_allowance": user.token_allowance,
        "tokens_used": user.tokens_used,
        "email_verified": bool(user.email_verified),
        "organization_id": user.organization_id,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@api_bp.route("/admin/users", methods=["GET"])
@superadmin_required
def admin_list_users():
    """Searchable user directory. ?q= matches name/email; ?plan= filters status."""
    from flask_jwt_extended import get_jwt_identity

    page, per_page = get_pagination_params()
    per_page = min(per_page, 50)
    query = User.query
    q = sanitize_input(request.args.get("q", "") or "", max_length=120).strip()
    if q:
        like = f"%{q}%"
        query = query.filter((User.email.ilike(like)) | (User.name.ilike(like)))
    plan = (request.args.get("plan") or "").strip()
    if plan in ("trial", "active", "expired", "cancelled"):
        query = query.filter(User.subscription_status == plan)
    pagination = Pagination(query.order_by(User.id.desc()), page=page, per_page=per_page).paginate()
    return jsonify(paginated_response(
        pagination["items"], pagination["pagination"], item_serializer=_user_admin_dict
    )), 200


@api_bp.route("/admin/users/<int:user_id>", methods=["PATCH"])
@superadmin_required
def admin_update_user(user_id):
    """Manage a person's plan, allowance, and superadmin flag.

    Never self-demoting the last superadmin: both are rejected explicitly.
    """
    from flask_jwt_extended import get_jwt_identity

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404
    payload = request.get_json(silent=True) or {}
    caller_id = int(get_jwt_identity())

    if "subscription_status" in payload:
        status = payload["subscription_status"]
        if status not in ("trial", "active", "expired", "cancelled"):
            return jsonify({"error": "invalid subscription_status"}), 400
        user.subscription_status = status
    if "paid_plan" in payload:
        paid, error = _bool_param(payload["paid_plan"], "paid_plan")
        if error:
            return error
        user.paid_plan = paid
    if "token_allowance" in payload:
        try:
            allowance = int(payload["token_allowance"])
        except (TypeError, ValueError):
            return jsonify({"error": "token_allowance must be an integer"}), 400
        if allowance < 0 or allowance > 100_000_000:
            return jsonify({"error": "token_allowance out of range"}), 400
        user.token_allowance = allowance
    if "is_superadmin" in payload:
        grant, error = _bool_param(payload["is_superadmin"], "is_superadmin")
        if error:
            return error
        if user.id == caller_id and not grant:
            return jsonify({"error": "you cannot remove your own superadmin access"}), 409
        if not grant and user.is_superadmin:
            others = (
                User.query.filter(User.is_superadmin.is_(True), User.id != user.id).count()
            )
            if others == 0:
                return jsonify({"error": "cannot remove the last superadmin"}), 409
        user.is_superadmin = grant

    db.session.commit()
    log_security_event(
        "admin_user_updated",
        user_id=caller_id,
        ip_address=request.remote_addr,
        details={"target_user_id": user.id, "changes": sorted(payload.keys())},
    )
    return jsonify(_user_admin_dict(user)), 200


def _org_admin_dict(org):
    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "is_public": bool(org.is_public),
        "subscription_status": org.subscription_status,
        "paid_plan": bool(org.paid_plan),
        "created_at": org.created_at.isoformat() if org.created_at else None,
    }


@api_bp.route("/admin/organizations", methods=["GET"])
@superadmin_required
def admin_list_organizations():
    page, per_page = get_pagination_params()
    per_page = min(per_page, 50)
    query = Organization.query
    q = sanitize_input(request.args.get("q", "") or "", max_length=120).strip()
    if q:
        query = query.filter(Organization.name.ilike(f"%{q}%"))
    pagination = Pagination(query.order_by(Organization.id.desc()), page=page, per_page=per_page).paginate()
    return jsonify(paginated_response(
        pagination["items"], pagination["pagination"], item_serializer=_org_admin_dict
    )), 200


@api_bp.route("/admin/organizations/<int:org_id>", methods=["PATCH"])
@superadmin_required
def admin_update_organization(org_id):
    from flask_jwt_extended import get_jwt_identity

    org = db.session.get(Organization, org_id)
    if not org:
        return jsonify({"error": "organization not found"}), 404
    payload = request.get_json(silent=True) or {}

    if "subscription_status" in payload:
        status = payload["subscription_status"]
        if status not in ("trial", "active", "expired", "cancelled"):
            return jsonify({"error": "invalid subscription_status"}), 400
        org.subscription_status = status
    if "paid_plan" in payload:
        paid, error = _bool_param(payload["paid_plan"], "paid_plan")
        if error:
            return error
        org.paid_plan = paid

    db.session.commit()
    log_security_event(
        "admin_organization_updated",
        user_id=int(get_jwt_identity()),
        ip_address=request.remote_addr,
        details={"org_id": org.id, "changes": sorted(payload.keys())},
    )
    return jsonify(_org_admin_dict(org)), 200


@api_bp.route("/admin/outbox", methods=["GET"])
@superadmin_required
def admin_list_outbox():
    """Dead-letter triage: filter by status, dead rows first by default."""
    from ...models.outbox_event import (
        STATUS_DEAD,
        STATUS_FAILED,
        STATUS_PENDING,
        STATUS_PROCESSING,
    )

    page, per_page = get_pagination_params()
    per_page = min(per_page, 50)
    status = (request.args.get("status") or "").strip()
    query = OutboxEvent.query
    if status in (STATUS_PENDING, STATUS_FAILED, STATUS_PROCESSING, STATUS_DEAD, "done"):
        query = query.filter(OutboxEvent.status == status)
    pagination = Pagination(
        query.order_by(OutboxEvent.next_run_at.asc(), OutboxEvent.id.asc()),
        page=page, per_page=per_page,
    ).paginate()
    return jsonify(paginated_response(
        pagination["items"], pagination["pagination"],
        item_serializer=lambda e: e.to_dict(),
    )), 200


@api_bp.route("/admin/outbox/<int:event_id>/retry", methods=["POST"])
@superadmin_required
def admin_retry_outbox(event_id):
    """Requeue a failed/dead row for immediate delivery (attempts preserved)."""
    from flask_jwt_extended import get_jwt_identity

    from ...models.outbox_event import STATUS_DONE, STATUS_PENDING, STATUS_PROCESSING

    event = db.session.get(OutboxEvent, event_id)
    if not event:
        return jsonify({"error": "outbox event not found"}), 404
    if event.status in (STATUS_PENDING, STATUS_PROCESSING, STATUS_DONE):
        return jsonify({"error": f"event is {event.status}; only failed/dead rows can be retried"}), 409
    event.status = STATUS_PENDING
    event.next_run_at = datetime.utcnow()
    event.last_error = None
    event.locked_by = None
    event.locked_at = None
    event.updated_at = datetime.utcnow()
    db.session.commit()
    log_security_event(
        "admin_outbox_retried",
        user_id=int(get_jwt_identity()),
        ip_address=request.remote_addr,
        details={"event_id": event.id, "event_type": event.type},
    )
    return jsonify(event.to_dict()), 200


@api_bp.route("/admin/content", methods=["GET"])
@superadmin_required
def admin_content():
    """Content-bank health: seeded banks behind quizzes, projects, practice."""
    from sqlalchemy import func

    from ...models import (
        AIInterviewAgent,
        GuidedProject,
        MockInterviewQuestion,
        PracticeAIAgent,
        SkillQuestion,
        SkillQuiz,
    )

    def count(model, *filters):
        query = db.session.query(func.count(model.id))
        for criterion in filters:
            query = query.filter(criterion)
        return query.scalar() or 0

    return jsonify({
        "skill_questions": count(SkillQuestion),
        "quizzes": count(SkillQuiz),
        "guided_projects": count(GuidedProject),
        "mock_interview_questions": count(MockInterviewQuestion),
        "practice_ai_agents": count(PracticeAIAgent),
        "org_interview_agents": count(AIInterviewAgent),
    }), 200


@api_bp.route("/admin/plans", methods=["GET"])
@superadmin_required
def admin_plans():
    """Plan catalogue (mirrors subscription.py) plus live subscriber counts."""
    from sqlalchemy import func

    from ...utils.subscription import BASIC_INDIVIDUAL_FEATURES, CVAI_FEATURES

    paid_users = (
        db.session.query(func.count(User.id))
        .filter(User.subscription_status == "active", User.paid_plan.is_(True))
        .scalar()
        or 0
    )
    trial_users = (
        db.session.query(func.count(User.id))
        .filter(User.subscription_status == "trial")
        .scalar()
        or 0
    )
    paid_orgs = (
        db.session.query(func.count(Organization.id))
        .filter(Organization.subscription_status == "active")
        .scalar()
        or 0
    )
    return jsonify({
        "individual_free": sorted(BASIC_INDIVIDUAL_FEATURES),
        "individual_premium": sorted(set(CVAI_FEATURES) - set(BASIC_INDIVIDUAL_FEATURES)),
        "subscribers": {
            "paid_users": paid_users,
            "trial_users": trial_users,
            "paid_organizations": paid_orgs,
        },
    }), 200

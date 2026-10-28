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


def _invalidate_ai_provider_manager():
    """Make the next AI call re-read the active rows from the database."""
    try:
        from ...ai_providers import get_ai_provider_manager

        get_ai_provider_manager()._initialized = False
    except Exception:
        # Provider invalidation must never take down an admin write after the
        # database has already committed.
        pass


def _active_ai_config_error(kind, provider, base_url, has_api_key):
    """Return a human-readable error when an active config cannot be used."""
    if kind == "llm" and not has_api_key:
        return "an API key is required to activate an LLM provider"
    if kind == "embedding" and provider in ("openai", "openrouter") and not has_api_key:
        return "an API key is required to activate this embedding provider"
    if provider == "huggingface" and not (base_url or "").strip():
        return "a base URL is required to activate a HuggingFace embedding provider"
    return None


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
        "feature_overrides": user.feature_override_list(),
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
    if "plan" in payload:
        from ...models.plan import Plan

        plan_slug = (payload["plan"] or "").strip()
        if plan_slug and Plan.query.filter_by(slug=plan_slug, scope="individual", is_active=True).first() is None:
            return jsonify({"error": "unknown or inactive individual plan"}), 400
        user.plan = plan_slug or user.plan
    if "feature_overrides" in payload:
        overrides = payload["feature_overrides"]
        if overrides is None:
            user.feature_overrides = None
        elif isinstance(overrides, list) and all(isinstance(x, str) for x in overrides):
            import json

            user.feature_overrides = json.dumps(overrides)
        else:
            return jsonify({"error": "feature_overrides must be a list of strings or null"}), 400

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
        "plan": org.plan,
        "feature_overrides": org.feature_override_list(),
        "token_allowance": org.token_allowance,
        "tokens_used": org.tokens_used or 0,
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
    if "token_allowance" in payload:
        try:
            allowance = int(payload["token_allowance"])
        except (TypeError, ValueError):
            return jsonify({"error": "token_allowance must be an integer"}), 400
        if allowance < 0 or allowance > 100_000_000:
            return jsonify({"error": "token_allowance out of range"}), 400
        org.token_allowance = allowance
    if "plan" in payload:
        from ...models.plan import Plan

        plan_slug = (payload["plan"] or "").strip()
        if plan_slug and Plan.query.filter_by(slug=plan_slug, scope="organization", is_active=True).first() is None:
            return jsonify({"error": "unknown or inactive organization plan"}), 400
        org.plan = plan_slug or org.plan
    if "feature_overrides" in payload:
        overrides = payload["feature_overrides"]
        if overrides is None:
            org.feature_overrides = None
        elif isinstance(overrides, list) and all(isinstance(x, str) for x in overrides):
            import json

            org.feature_overrides = json.dumps(overrides)
        else:
            return jsonify({"error": "feature_overrides must be a list of strings or null"}), 400

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


@api_bp.route("/admin/ai-providers", methods=["GET"])
@superadmin_required
def admin_list_ai_providers():
    from ...models.ai_provider_config import AIProviderConfig

    kind = request.args.get("kind")
    query = AIProviderConfig.query
    if kind in ("llm", "embedding"):
        query = query.filter(AIProviderConfig.kind == kind)
    rows = query.order_by(AIProviderConfig.kind, AIProviderConfig.id).all()
    return jsonify([r.to_dict() for r in rows]), 200


@api_bp.route("/admin/ai-providers", methods=["POST"])
@superadmin_required
def admin_create_ai_provider():
    from flask_jwt_extended import get_jwt_identity

    from ...models.ai_provider_config import AIProviderConfig
    from ...utils.ai_provider_resolver import (
        VALID_EMBEDDING_PROVIDERS,
        VALID_LLM_PROVIDERS,
    )

    payload = request.get_json(silent=True) or {}
    kind = payload.get("kind")
    provider = (payload.get("provider") or "").strip().lower()
    model = (payload.get("model") or "").strip()
    if kind not in ("llm", "embedding"):
        return jsonify({"error": "kind must be 'llm' or 'embedding'"}), 400
    allowed = VALID_LLM_PROVIDERS if kind == "llm" else VALID_EMBEDDING_PROVIDERS
    if provider not in allowed:
        return jsonify({"error": f"provider must be one of {sorted(allowed)}"}), 400
    if not model:
        return jsonify({"error": "model is required"}), 400

    active, error = _bool_param(payload.get("is_active", False), "is_active")
    if error:
        return error
    base_url = (payload.get("base_url") or "").strip() or None
    api_key = payload.get("api_key")
    if active:
        error = _active_ai_config_error(kind, provider, base_url, bool(api_key))
        if error:
            return jsonify({"error": error}), 400

    cfg = AIProviderConfig(kind=kind, provider=provider, model=model)
    cfg.base_url = base_url
    if payload.get("dimensions") is not None:
        try:
            cfg.dimensions = int(payload["dimensions"])
        except (TypeError, ValueError):
            return jsonify({"error": "dimensions must be an integer"}), 400
        if cfg.dimensions <= 0:
            return jsonify({"error": "dimensions must be greater than zero"}), 400
    cfg.set_api_key(api_key)
    if active:
        AIProviderConfig.query.filter_by(kind=kind).update({"is_active": False})
        cfg.is_active = True
    db.session.add(cfg)
    db.session.commit()
    _invalidate_ai_provider_manager()
    log_security_event(
        "admin_ai_provider_created",
        user_id=int(get_jwt_identity()),
        ip_address=request.remote_addr,
        details={"id": cfg.id, "kind": kind, "provider": provider, "model": model},
    )
    # Never echo the secret back, even to a superadmin. The listing shows a
    # masked value; key rotation happens by posting a new key.
    return jsonify(cfg.to_dict()), 201


@api_bp.route("/admin/ai-providers/<int:config_id>", methods=["PATCH"])
@superadmin_required
def admin_update_ai_provider(config_id):
    from flask_jwt_extended import get_jwt_identity

    from ...models.ai_provider_config import AIProviderConfig
    from ...utils.ai_provider_resolver import (
        VALID_EMBEDDING_PROVIDERS,
        VALID_LLM_PROVIDERS,
    )

    cfg = db.session.get(AIProviderConfig, config_id)
    if not cfg:
        return jsonify({"error": "not found"}), 404
    payload = request.get_json(silent=True) or {}

    if "provider" in payload:
        allowed = VALID_LLM_PROVIDERS if cfg.kind == "llm" else VALID_EMBEDDING_PROVIDERS
        provider = (payload["provider"] or "").strip().lower()
        if provider not in allowed:
            return jsonify({"error": f"provider must be one of {sorted(allowed)}"}), 400
        cfg.provider = provider
    if "model" in payload:
        model = (payload["model"] or "").strip()
        if not model:
            return jsonify({"error": "model is required"}), 400
        cfg.model = model
    if "base_url" in payload:
        cfg.base_url = (payload["base_url"] or "").strip() or None
    if "dimensions" in payload:
        if payload["dimensions"] is None:
            cfg.dimensions = None
        else:
            try:
                cfg.dimensions = int(payload["dimensions"])
            except (TypeError, ValueError):
                return jsonify({"error": "dimensions must be an integer"}), 400
            if cfg.dimensions <= 0:
                return jsonify({"error": "dimensions must be greater than zero"}), 400
    if "api_key" in payload:
        cfg.set_api_key(payload["api_key"])
    if "is_active" in payload:
        active, error = _bool_param(payload["is_active"], "is_active")
        if error:
            return error
        cfg.is_active = active

    if cfg.is_active:
        error = _active_ai_config_error(
            cfg.kind, cfg.provider, cfg.base_url, bool(cfg.get_api_key())
        )
        if error:
            db.session.rollback()
            return jsonify({"error": error}), 400
        AIProviderConfig.query.filter_by(kind=cfg.kind).update({"is_active": False})
        cfg.is_active = True

    db.session.commit()
    _invalidate_ai_provider_manager()
    log_security_event(
        "admin_ai_provider_updated",
        user_id=int(get_jwt_identity()),
        ip_address=request.remote_addr,
        details={"id": cfg.id, "changes": sorted(payload.keys())},
    )
    return jsonify(cfg.to_dict()), 200


@api_bp.route("/admin/ai-providers/<int:config_id>", methods=["DELETE"])
@superadmin_required
def admin_delete_ai_provider(config_id):
    from flask_jwt_extended import get_jwt_identity

    from ...models.ai_provider_config import AIProviderConfig

    cfg = db.session.get(AIProviderConfig, config_id)
    if not cfg:
        return jsonify({"error": "not found"}), 404
    if cfg.is_active:
        return jsonify({"error": "cannot delete the active provider; activate another first"}), 409
    db.session.delete(cfg)
    db.session.commit()
    _invalidate_ai_provider_manager()
    log_security_event(
        "admin_ai_provider_deleted",
        user_id=int(get_jwt_identity()),
        ip_address=request.remote_addr,
        details={"id": config_id},
    )
    return jsonify({"message": "deleted"}), 200


@api_bp.route("/admin/ai-providers/test", methods=["POST"])
@superadmin_required
def admin_test_ai_provider():
    """Dry-run the active LLM + embedding configs without touching the request path."""
    from flask import current_app

    from ...ai_providers import get_ai_provider_manager

    manager = get_ai_provider_manager()
    manager._initialized = False
    try:
        info = manager.get_provider_info()
        health = manager.healthcheck()
    except Exception:
        current_app.logger.exception("admin AI provider test failed")
        return jsonify({
            "error": (
                "Could not initialize the active AI providers. Check the "
                "active model, API key, and endpoint, then save and test again."
            )
        }), 502
    return jsonify({
        "llm": info["llm_provider"],
        "llm_model": info.get("llm_model"),
        "embedding": info["embedding_provider"],
        "embedding_model": info.get("embedding_model"),
        "embedding_dimension": info["embedding_dimension"],
        "rag_enabled": info["rag_enabled"],
        "health": health,
    }), 200


@api_bp.route("/admin/plans", methods=["GET"])
@superadmin_required
def admin_plans():
    """Return the editable plan catalogue for the admin dashboard."""
    from ...models.plan import Plan

    plans = (
        Plan.query.order_by(Plan.scope.asc(), Plan.price_cents.asc(), Plan.slug.asc())
        .all()
    )
    return jsonify([plan.to_dict() for plan in plans]), 200


@api_bp.route("/admin/plans", methods=["POST"])
@superadmin_required
def admin_create_plan():
    from flask_jwt_extended import get_jwt_identity

    from ...models.plan import Plan

    payload = request.get_json(silent=True) or {}
    slug = (payload.get("slug") or "").strip()
    name = (payload.get("name") or "").strip()
    scope = (payload.get("scope") or "").strip()
    if not slug or not name or scope not in ("individual", "organization"):
        return jsonify({"error": "slug, name, and scope (individual/organization) are required"}), 400
    if Plan.query.filter_by(slug=slug, scope=scope).first():
        return jsonify({"error": "a plan with that slug and scope already exists"}), 409
    try:
        price_cents = int(payload.get("price_cents", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "price_cents must be an integer"}), 400
    if price_cents < 0:
        return jsonify({"error": "price_cents cannot be negative"}), 400
    features = payload.get("features")
    if features is None:
        features = []
    if not isinstance(features, list) or not all(isinstance(x, str) for x in features):
        return jsonify({"error": "features must be a list of strings"}), 400
    is_default, error = _bool_param(payload.get("is_default", False), "is_default")
    if error:
        return error
    is_active, error = _bool_param(payload.get("is_active", True), "is_active")
    if error:
        return error
    if is_default and not is_active:
        return jsonify({"error": "the default plan must stay active"}), 400

    import json

    plan = Plan(
        slug=slug,
        name=name,
        scope=scope,
        price_cents=price_cents,
        features=json.dumps(features),
        is_default=is_default,
        is_active=is_active,
    )
    if plan.is_default:
        Plan.query.filter_by(scope=scope).update({"is_default": False})
    db.session.add(plan)
    db.session.commit()
    log_security_event(
        "admin_plan_created",
        user_id=int(get_jwt_identity()),
        ip_address=request.remote_addr,
        details={"slug": slug, "scope": scope, "price_cents": price_cents},
    )
    return jsonify(plan.to_dict()), 201


@api_bp.route("/admin/plans/<int:plan_id>", methods=["PATCH"])
@superadmin_required
def admin_update_plan(plan_id):
    from flask_jwt_extended import get_jwt_identity

    from ...models.plan import Plan

    plan = db.session.get(Plan, plan_id)
    if not plan:
        return jsonify({"error": "plan not found"}), 404
    payload = request.get_json(silent=True) or {}

    if "name" in payload:
        name = (payload["name"] or "").strip()
        if not name:
            return jsonify({"error": "name cannot be empty"}), 400
        plan.name = name
    if "price_cents" in payload:
        try:
            price = int(payload["price_cents"])
        except (TypeError, ValueError):
            return jsonify({"error": "price_cents must be an integer"}), 400
        if price < 0:
            return jsonify({"error": "price_cents cannot be negative"}), 400
        plan.price_cents = price
    if "features" in payload:
        features = payload["features"]
        if not isinstance(features, list) or not all(isinstance(x, str) for x in features):
            return jsonify({"error": "features must be a list of strings"}), 400
        import json

        plan.features = json.dumps(features)
    if "is_default" in payload:
        is_default, error = _bool_param(payload["is_default"], "is_default")
        if error:
            return error
        if is_default:
            Plan.query.filter_by(scope=plan.scope).update({"is_default": False})
        elif plan.is_default:
            replacement = (
                Plan.query.filter_by(scope=plan.scope, is_default=True)
                .filter(Plan.id != plan.id)
                .first()
            )
            if replacement is None:
                db.session.rollback()
                return jsonify(
                    {"error": "choose a replacement default plan for this scope first"}
                ), 409
        plan.is_default = is_default
    if "is_active" in payload:
        is_active, error = _bool_param(payload["is_active"], "is_active")
        if error:
            return error
        plan.is_active = is_active
    if plan.is_default and not plan.is_active:
        db.session.rollback()
        return jsonify({"error": "the default plan must stay active"}), 409

    db.session.commit()
    log_security_event(
        "admin_plan_updated",
        user_id=int(get_jwt_identity()),
        ip_address=request.remote_addr,
        details={"plan_id": plan.id, "changes": sorted(payload.keys())},
    )
    return jsonify(plan.to_dict()), 200


@api_bp.route("/admin/plans/<int:plan_id>", methods=["DELETE"])
@superadmin_required
def admin_delete_plan(plan_id):
    from flask_jwt_extended import get_jwt_identity

    from ...models.plan import Plan

    plan = db.session.get(Plan, plan_id)
    if not plan:
        return jsonify({"error": "plan not found"}), 404
    if plan.is_default:
        return jsonify({"error": "cannot delete the default plan"}), 409
    assigned = (
        User.query.filter_by(plan=plan.slug).first()
        if plan.scope == "individual"
        else Organization.query.filter_by(plan=plan.slug).first()
    )
    if assigned is not None:
        return jsonify({"error": "plan is assigned to accounts; migrate them first"}), 409
    db.session.delete(plan)
    db.session.commit()
    log_security_event(
        "admin_plan_deleted",
        user_id=int(get_jwt_identity()),
        ip_address=request.remote_addr,
        details={"plan_id": plan_id},
    )
    return jsonify({"message": "deleted"}), 200

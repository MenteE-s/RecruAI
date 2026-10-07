"""Universal search across everything public.

One query, three result groups, the way LinkedIn's omnibox works. This
replaces the previous situation where the header search was a decorative
read-only box and the only real search lived in per-domain endpoints.

Privacy rules enforced here, not left to the client:
  * People    — only accounts with is_discoverable; never email or phone.
  * Companies — only pages with is_public, unless the caller administers it.
  * Jobs      — only active posts whose page is itself public.
The caller is excluded from their own people results.
"""

from datetime import datetime, timedelta

from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, or_

from .. import api_bp
from ...extensions import db
from ...models import User, Organization, Post, TeamMember
from ...utils.security import sanitize_input, log_security_event


# Capped hard: this endpoint is unauthenticated-cost-free but cheap to hammer,
# and it fans out to three queries.
DEFAULT_LIMIT = 8
MAX_LIMIT = 20
MIN_QUERY_LEN = 2

PEOPLE, COMPANIES, JOBS = "people", "companies", "jobs"
ALL_TYPES = (PEOPLE, COMPANIES, JOBS)


def _caller_id():
    try:
        return int(get_jwt_identity())
    except (TypeError, ValueError):
        return None


def _managed_org_ids(user):
    """Org ids the caller administers — their page plus any team membership."""
    ids = set()
    if user.organization_id:
        ids.add(user.organization_id)
    for tm in TeamMember.query.filter_by(user_id=user.id).all():
        ids.add(tm.organization_id)
    return ids


def _escape_like(term):
    """Escape LIKE wildcards so a literal % or _ can't widen the match."""
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _search_people(term, caller_id, limit, location=None):
    """Prefix matches first, then substring — same ordering people expect
    from a name box. Ranked in SQL so the limit keeps the best rows."""
    pattern = f"%{_escape_like(term)}%"
    prefix = f"{_escape_like(term)}%"

    q = User.query.filter(
        User.role == "individual",
        User.is_discoverable.is_(True),
        or_(
            User.name.ilike(pattern),
            User.headline.ilike(pattern),
            User.current_position.ilike(pattern),
            User.current_company.ilike(pattern),
            User.location.ilike(pattern),
        ),
    )
    if caller_id is not None:
        q = q.filter(User.id != caller_id)
    if location:
        q = q.filter(User.location.ilike(f"%{_escape_like(location)}%", escape="\\"))

    exact = func.lower(User.name) == term.lower()
    is_prefix = func.lower(User.name).like(term.lower() + "%")
    q = q.order_by(
        # An exact name beats a prefix, which beats a mid-string hit.
        exact.desc(),
        is_prefix.desc(),
        # Prefer profiles that actually say something about themselves.
        func.length(func.coalesce(User.name, "")).asc(),
        User.id.asc(),
    ).limit(limit)

    return [u.to_search_dict() for u in q.all()]


def _search_companies(term, managed_ids, limit, location=None, industry=None):
    pattern = f"%{_escape_like(term)}%"

    q = Organization.query.filter(
        or_(
            Organization.name.ilike(pattern),
            Organization.industry.ilike(pattern),
            Organization.location.ilike(pattern),
        )
    )
    if location:
        q = q.filter(Organization.location.ilike(f"%{_escape_like(location)}%", escape="\\"))
    if industry:
        q = q.filter(Organization.industry.ilike(f"%{_escape_like(industry)}%", escape="\\"))
    # Private pages stay visible only to whoever administers them.
    q = q.filter(
        or_(Organization.is_public.is_(True), Organization.id.in_(managed_ids))
    ) if managed_ids else q.filter(Organization.is_public.is_(True))

    exact = func.lower(Organization.name) == term.lower()
    is_prefix = func.lower(Organization.name).like(term.lower() + "%")
    q = q.order_by(exact.desc(), is_prefix.desc(), Organization.name.asc()).limit(limit)

    out = []
    for o in q.all():
        item = {
            "id": o.id,
            "name": o.name,
            "slug": o.slug,
            "industry": o.industry,
            "location": o.location,
            "profile_image": o.profile_image,
            "company_size": o.company_size,
            "is_public": bool(o.is_public),
        }
        # Contact details only for admins — to_public_dict() strips them.
        if o.id in managed_ids:
            item = o.to_dict()
        out.append(item)
    return out


def _search_jobs(term, limit, location=None, employment_type=None, posted_within_days=None, recent_first=False):
    """Full-text over title/category/location/description, active only."""
    doc = (
        func.setweight(func.to_tsvector("english", func.coalesce(Post.title, "")), "A")
        .op("||")(
            func.setweight(
                func.to_tsvector("english", func.coalesce(Post.category, "")), "B"
            )
        )
        .op("||")(
            func.setweight(
                func.to_tsvector(
                    "english",
                    func.coalesce(Post.location, "") + " "
                    + func.coalesce(Post.description, ""),
                ),
                "C",
            )
        )
    )
    tsq = func.plainto_tsquery("english", term)

    # A job is only as public as the page that owns it.
    public_org_ids = db.session.query(Organization.id).filter(
        Organization.is_public.is_(True)
    )

    q = (
        Post.query.join(Organization, Post.organization_id == Organization.id)
        .filter(Post.status == "active", Post.organization_id.in_(public_org_ids))
        .filter(func.ts_rank(doc, tsq) > 1e-6)
    )
    if location:
        q = q.filter(Post.location.ilike(f"%{_escape_like(location)}%", escape="\\"))
    if employment_type:
        q = q.filter(func.lower(Post.employment_type) == employment_type.lower())
    if posted_within_days:
        since = datetime.utcnow() - timedelta(days=posted_within_days)
        q = q.filter(Post.created_at >= since)

    if recent_first:
        q = q.order_by(Post.created_at.desc().nullslast(), Post.id.desc())
    else:
        q = q.order_by(func.ts_rank(doc, tsq).desc(), Post.id.desc())
    q = q.limit(limit)

    return [
        {
            "id": p.id,
            "title": p.title,
            "slug": p.slug,
            "category": p.category,
            "location": p.location,
            "employment_type": p.employment_type,
            "organization_id": p.organization_id,
            "organization_name": p.organization.name if p.organization else None,
            "organization_profile_image": (
                p.organization.profile_image if p.organization else None
            ),
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in q.all()
    ]


@api_bp.route("/search", methods=["GET"])
@jwt_required()
def universal_search():
    """Search people, companies and jobs in one call."""
    raw = (request.args.get("q") or "").strip()
    term = sanitize_input(raw, max_length=120).strip()

    if len(term) < MIN_QUERY_LEN:
        # Same shape as a real result set, so the client never has to branch
        # on "query too short" vs "nothing matched".
        return jsonify({
            "query": term,
            "people": [], "companies": [], "jobs": [],
            "counts": {PEOPLE: 0, COMPANIES: 0, JOBS: 0},
            "total": 0,
            "has_more": False,
        }), 200

    try:
        limit = int(request.args.get("limit", DEFAULT_LIMIT))
    except (TypeError, ValueError):
        limit = DEFAULT_LIMIT
    limit = max(1, min(limit, MAX_LIMIT))

    requested = (request.args.get("types") or "").strip()
    types = [t for t in (requested.split(",") if requested else list(ALL_TYPES))
             if t in ALL_TYPES] or list(ALL_TYPES)

    # Optional narrowing filters. All are substrings/enums straight from the
    # profile/job record, sanitized the same way as the query itself.
    location = sanitize_input(request.args.get("location") or "", max_length=80).strip() or None
    industry = sanitize_input(request.args.get("industry") or "", max_length=80).strip() or None
    employment_type = sanitize_input(request.args.get("employment_type") or "", max_length=40).strip() or None

    # Time filter for jobs: only posts newer than the chosen window.
    POSTED_WINDOWS = {"24h": 1, "week": 7, "month": 30}
    posted = (request.args.get("posted") or "").strip().lower()
    posted_within_days = POSTED_WINDOWS.get(posted)

    # sort=recent reorders job hits newest-first instead of by match rank.
    recent_first = (request.args.get("sort") or "").strip().lower() == "recent"

    caller = None
    managed_ids = set()
    try:
        caller = User.query.get(_caller_id())
    except (TypeError, ValueError):
        caller = None
    if caller:
        managed_ids = _managed_org_ids(caller)

    results = {PEOPLE: [], COMPANIES: [], JOBS: []}
    try:
        if PEOPLE in types:
            results[PEOPLE] = _search_people(term, caller.id if caller else None, limit, location=location)
        if COMPANIES in types:
            results[COMPANIES] = _search_companies(term, managed_ids, limit, location=location, industry=industry)
        if JOBS in types:
            results[JOBS] = _search_jobs(term, limit, location=location, employment_type=employment_type, posted_within_days=posted_within_days, recent_first=recent_first)
    except Exception as e:  # noqa: BLE001 — never 500 the omnibox
        current_app.logger.error("universal_search failed: %s", e, exc_info=True)
        log_security_event("universal_search_error", details={"error": str(e)})

    counts = {k: len(v) for k, v in results.items()}
    total = sum(counts.values())

    # Cache only when there's genuinely nothing to show; a query with results is
    # per-user (admin visibility differs) and caching it would leak private pages.
    payload = {
        "query": term,
        "people": results[PEOPLE],
        "companies": results[COMPANIES],
        "jobs": results[JOBS],
        "counts": counts,
        "total": total,
        "has_more": total >= limit,
    }
    return jsonify(payload), 200
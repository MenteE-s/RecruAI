from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import Post, Application, Interview, InterviewAnalysis, TeamMember, User


def _managed_org_ids():
    """Org ids the caller administers (own org + team memberships)."""
    try:
        user = User.query.get(int(get_jwt_identity()))
    except (TypeError, ValueError):
        return None
    if not user:
        return None
    ids = set()
    if user.organization_id:
        ids.add(user.organization_id)
    for tm in TeamMember.query.filter_by(user_id=user.id).all():
        ids.add(tm.organization_id)
    return ids


def _apps_in_orgs(org_ids):
    return db.session.query(Application).join(Post, Application.post_id == Post.id).filter(
        Post.organization_id.in_(org_ids))


# Dashboard statistics endpoints
@api_bp.route("/dashboard/stats", methods=["GET"])
@jwt_required()
def get_dashboard_stats():
    """Dashboard statistics scoped to the caller's organizations."""
    org_ids = _managed_org_ids()
    if org_ids is None:
        return jsonify({"error": "User not found"}), 404

    # Team members across managed orgs
    team_members_count = TeamMember.query.filter(TeamMember.organization_id.in_(org_ids)).count() if org_ids else 0

    # Open requisitions (active posts in managed orgs)
    open_reqs_count = Post.query.filter(
        Post.status == 'active', Post.organization_id.in_(org_ids)).count() if org_ids else 0

    # Pipeline (applications to managed orgs' posts)
    pipeline_count = _apps_in_orgs(org_ids).count() if org_ids else 0

    # New applications (pending status)
    new_applications_count = _apps_in_orgs(org_ids).filter(
        Application.status == 'pending').count() if org_ids else 0

    return jsonify({
        "team_members": team_members_count,
        "open_requisitions": open_reqs_count,
        "pipeline": pipeline_count,
        "new_applications": new_applications_count
    }), 200

@api_bp.route("/analytics/overview", methods=["GET"])
@jwt_required()
def get_analytics_overview():
    """Analytics scoped to the caller's organizations."""
    org_ids = _managed_org_ids()
    if org_ids is None:
        return jsonify({"error": "User not found"}), 404

    post_filter = [Post.organization_id.in_(org_ids)] if org_ids else [False]
    total_posts = Post.query.filter(*post_filter).count()
    total_applications = _apps_in_orgs(org_ids).count() if org_ids else 0
    total_interviews = Interview.query.filter(
        Interview.organization_id.in_(org_ids)).count() if org_ids else 0
    active_posts = Post.query.filter(
        Post.status == 'active', *post_filter).count()

    # Applications by status
    applications_by_status = {}
    for status in ['pending', 'reviewed', 'accepted', 'rejected']:
        applications_by_status[status] = _apps_in_orgs(org_ids).filter(
            Application.status == status).count() if org_ids else 0

    # Posts by category
    posts_by_category = {}
    categories = db.session.query(Post.category).filter(*post_filter).distinct().all()
    for (category,) in categories:
        if category:
            posts_by_category[category] = Post.query.filter(
                Post.category == category, *post_filter).count()

    return jsonify({
        "total_posts": total_posts,
        "total_applications": total_applications,
        "total_interviews": total_interviews,
        "active_posts": active_posts,
        "applications_by_status": applications_by_status,
        "posts_by_category": posts_by_category
    }), 200
from flask import request, jsonify
from .. import api_bp
from ...extensions import db
from ...models import Post, Application, Interview, InterviewAnalysis, TeamMember

# Dashboard statistics endpoints
@api_bp.route("/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    """Get dashboard statistics for organizations"""
    # TODO: Add organization filtering based on authenticated user
    # For now, return global stats

    # Team members count (across all organizations for demo)
    team_members_count = TeamMember.query.count()

    # Open requisitions (active posts)
    open_reqs_count = Post.query.filter_by(status='active').count()

    # Pipeline (total applications)
    pipeline_count = Application.query.count()

    # New applications (pending status)
    new_applications_count = Application.query.filter_by(status='pending').count()

    return jsonify({
        "team_members": team_members_count,
        "open_requisitions": open_reqs_count,
        "pipeline": pipeline_count,
        "new_applications": new_applications_count
    }), 200

@api_bp.route("/analytics/overview", methods=["GET"])
def get_analytics_overview():
    """Get analytics data for organization dashboard"""
    # TODO: Filter by organization
    total_posts = Post.query.count()
    total_applications = Application.query.count()
    total_interviews = Interview.query.count()
    active_posts = Post.query.filter_by(status='active').count()

    # Applications by status
    applications_by_status = {}
    for status in ['pending', 'reviewed', 'accepted', 'rejected']:
        count = Application.query.filter_by(status=status).count()
        applications_by_status[status] = count

    # Posts by category
    posts_by_category = {}
    categories = db.session.query(Post.category).distinct().all()
    for (category,) in categories:
        if category:
            count = Post.query.filter_by(category=category).count()
            posts_by_category[category] = count

    return jsonify({
        "total_posts": total_posts,
        "total_applications": total_applications,
        "total_interviews": total_interviews,
        "active_posts": active_posts,
        "applications_by_status": applications_by_status,
        "posts_by_category": posts_by_category
    }), 200
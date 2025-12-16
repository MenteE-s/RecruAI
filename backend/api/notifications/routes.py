from flask import request, jsonify, Blueprint
from sqlalchemy import and_, or_, desc
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import api_bp
from ...extensions import db
from ...models import Notification, User, Organization, Interview, Application
from ...utils.pagination import Pagination, get_pagination_params, paginated_response
from ...utils.security import log_security_event, sanitize_input

notifications_bp = Blueprint("notifications", __name__, url_prefix="/notifications")

# Register the blueprint with the main API blueprint
api_bp.register_blueprint(notifications_bp)


@notifications_bp.route("", methods=["GET"])
@jwt_required()
def get_notifications():
    """Get user's notifications with pagination and filtering"""
    try:
        # Get current user
        uid = get_jwt_identity()
        user_id = int(uid)
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "user not found"}), 404
        
        # Get pagination parameters
        page, per_page = get_pagination_params()

        # Get filter parameters
        show_archived = request.args.get("archived", "false").lower() == "true"
        show_read = request.args.get("read", "all").lower()
        show_favorited = request.args.get("favorited", "false").lower() == "true"

        # Build query
        query = Notification.query.filter(
            and_(
                Notification.user_id == user_id,
                Notification.is_deleted == False
            )
        )

        # Apply filters
        if show_archived:
            query = query.filter(Notification.is_archived == True)
        else:
            query = query.filter(Notification.is_archived == False)

        if show_read == "unread":
            query = query.filter(Notification.is_read == False)
        elif show_read == "read":
            query = query.filter(Notification.is_read == True)

        if show_favorited:
            query = query.filter(Notification.is_favorited == True)

        # Order by creation date (newest first)
        query = query.order_by(desc(Notification.created_at))

        # Debug: Log the query
        print(f"Debug: Query built successfully for user {user_id}")

        # Paginate
        paginator = Pagination(query, page, per_page, max_per_page=50)
        result = paginator.paginate()
        notifications = result['items']

        # Debug: Log pagination
        print(f"Debug: Pagination successful, got {len(notifications)} notifications")

        # Format response
        notification_data = []
        for notification in notifications:
            notification_data.append({
                "id": notification.id,
                "type": notification.type,
                "title": notification.title,
                "message": notification.message,
                "is_read": notification.is_read,
                "is_archived": notification.is_archived,
                "is_favorited": notification.is_favorited,
                "created_at": notification.created_at.isoformat() if notification.created_at else None,
                "read_at": notification.read_at.isoformat() if notification.read_at else None,
                "related_entities": {
                    "user_id": notification.related_user_id,
                    "organization_id": notification.related_organization_id,
                    "interview_id": notification.related_interview_id,
                    "application_id": notification.related_application_id,
                }
            })

        # Debug: Log response formatting
        print(f"Debug: Response formatted successfully")

        return paginated_response(notification_data, result['pagination']), 200

    except Exception as e:
        print(f"Debug: Exception in get_notifications: {str(e)}")
        import traceback
        traceback.print_exc()
        log_security_event("notification_fetch_error", user_id=str(user_id) if 'user_id' in locals() else None, ip_address=request.remote_addr, details={"error": str(e)})
        return jsonify({"error": "Failed to fetch notifications"}), 500


@notifications_bp.route("/<int:notification_id>/read", methods=["PUT"])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    try:
        # Get current user
        uid = get_jwt_identity()
        user_id = int(uid)
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "user not found"}), 404

        notification = Notification.query.filter(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user_id,
                Notification.is_deleted == False
            )
        ).first_or_404()

        notification.mark_as_read()
        db.session.commit()

        return jsonify({"message": "Notification marked as read"}), 200

    except Exception as e:
        log_security_event("notification_read_error", user_id=str(user_id), ip_address=request.remote_addr, details={"error": str(e), "notification_id": notification_id})
        return jsonify({"error": "Failed to mark notification as read"}), 500


@notifications_bp.route("/<int:notification_id>/archive", methods=["PUT"])
@jwt_required()
def archive_notification(notification_id):
    """Archive a notification"""
    try:
        # Get current user
        uid = get_jwt_identity()
        user_id = int(uid)
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "user not found"}), 404

        notification = Notification.query.filter(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user_id,
                Notification.is_deleted == False
            )
        ).first_or_404()

        notification.archive()
        db.session.commit()

        return jsonify({"message": "Notification archived"}), 200

    except Exception as e:
        log_security_event("notification_archive_error", user_id=str(user_id), ip_address=request.remote_addr, details={"error": str(e), "notification_id": notification_id})
        return jsonify({"error": "Failed to archive notification"}), 500


@notifications_bp.route("/<int:notification_id>/unarchive", methods=["PUT"])
@jwt_required()
def unarchive_notification(notification_id):
    """Unarchive a notification"""
    try:
        # Get current user
        uid = get_jwt_identity()
        user_id = int(uid)
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "user not found"}), 404

        notification = Notification.query.filter(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user_id,
                Notification.is_deleted == False
            )
        ).first_or_404()

        notification.unarchive()
        db.session.commit()

        return jsonify({"message": "Notification unarchived"}), 200

    except Exception as e:
        log_security_event("notification_unarchive_error", user_id=str(user_id), ip_address=request.remote_addr, details={"error": str(e), "notification_id": notification_id})
        return jsonify({"error": "Failed to unarchive notification"}), 500


@notifications_bp.route("/<int:notification_id>/favorite", methods=["PUT"])
@jwt_required()
def favorite_notification(notification_id):
    """Mark notification as favorite"""
    try:
        # Get current user
        uid = get_jwt_identity()
        user_id = int(uid)
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "user not found"}), 404

        notification = Notification.query.filter(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user_id,
                Notification.is_deleted == False
            )
        ).first_or_404()

        notification.favorite()
        db.session.commit()

        return jsonify({"message": "Notification favorited"}), 200

    except Exception as e:
        log_security_event("notification_favorite_error", user_id=str(user_id), ip_address=request.remote_addr, details={"error": str(e), "notification_id": notification_id})
        return jsonify({"error": "Failed to favorite notification"}), 500


@notifications_bp.route("/<int:notification_id>/delete", methods=["DELETE"])
@jwt_required()
def delete_notification(notification_id):
    """Soft delete a notification"""
    try:
        # Get current user
        uid = get_jwt_identity()
        user_id = int(uid)
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "user not found"}), 404

        notification = Notification.query.filter(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user_id,
                Notification.is_deleted == False
            )
        ).first_or_404()

        notification.delete()
        db.session.commit()

        return jsonify({"message": "Notification deleted"}), 200

    except Exception as e:
        log_security_event("notification_delete_error", user_id=str(user_id), ip_address=request.remote_addr, details={"error": str(e), "notification_id": notification_id})
        return jsonify({"error": "Failed to delete notification"}), 500


@notifications_bp.route("/bulk/read", methods=["PUT"])
@jwt_required()
def bulk_mark_read():
    """Mark multiple notifications as read"""
    try:
        # Get current user
        uid = get_jwt_identity()
        user_id = int(uid)
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "user not found"}), 404

        data = request.get_json()
        notification_ids = data.get("notification_ids", [])

        if not notification_ids:
            return jsonify({"error": "notification_ids required"}), 400

        # Update notifications
        Notification.query.filter(
            and_(
                Notification.id.in_(notification_ids),
                Notification.user_id == user_id,
                Notification.is_deleted == False
            )
        ).update({
            "is_read": True,
            "read_at": db.func.now()
        })

        db.session.commit()

        return jsonify({"message": f"Marked {len(notification_ids)} notifications as read"}), 200

    except Exception as e:
        log_security_event("bulk_notification_read_error", user_id=str(user_id), ip_address=request.remote_addr, details={"error": str(e)})
        return jsonify({"error": "Failed to mark notifications as read"}), 500


@notifications_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_notification_stats():
    """Get notification statistics for the user"""
    try:
        # Get current user
        uid = get_jwt_identity()
        user_id = int(uid)
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "user not found"}), 404

        # Get counts
        total = Notification.query.filter(
            and_(
                Notification.user_id == user_id,
                Notification.is_deleted == False
            )
        ).count()

        unread = Notification.query.filter(
            and_(
                Notification.user_id == user_id,
                Notification.is_deleted == False,
                Notification.is_read == False
            )
        ).count()

        archived = Notification.query.filter(
            and_(
                Notification.user_id == user_id,
                Notification.is_deleted == False,
                Notification.is_archived == True
            )
        ).count()

        favorited = Notification.query.filter(
            and_(
                Notification.user_id == user_id,
                Notification.is_deleted == False,
                Notification.is_favorited == True
            )
        ).count()

        return jsonify({
            "total": total,
            "unread": unread,
            "archived": archived,
            "favorited": favorited
        }), 200

    except Exception as e:
        log_security_event("notification_stats_error", user_id=str(user_id), ip_address=request.remote_addr, details={"error": str(e)})
        return jsonify({"error": "Failed to fetch notification stats"}), 500


# Utility functions for creating notifications
def create_interview_notification(interview_id, notification_type, user_id, title, message, **kwargs):
    """Create an interview-related notification"""
    notification = Notification.create_notification(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        related_interview_id=interview_id,
        **kwargs
    )
    db.session.add(notification)
    db.session.commit()
    return notification


def create_profile_notification(user_id, notification_type, title, message, related_user_id=None, related_org_id=None):
    """Create a profile-related notification"""
    notification = Notification.create_notification(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        related_user_id=related_user_id,
        related_organization_id=related_org_id
    )
    db.session.add(notification)
    db.session.commit()
    return notification
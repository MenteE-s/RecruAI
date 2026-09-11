from flask import request
from flask_jwt_extended import decode_token
from ..extensions import socketio
from flask_socketio import join_room, leave_room
import logging

logger = logging.getLogger(__name__)

@socketio.on('connect')
def handle_connect():
    """Handle client connection and join the caller's own room.

    NOTE: passing the JWT in the query string can leak it into server logs;
    prefer the Authorization header / cookies where the client supports it.
    """
    token = request.args.get('token')
    if not token:
        logger.warning("Connection attempt without token")
        return False # Reject connection

    try:
        decoded = decode_token(token)
        try:
            user_id = int(decoded['sub'])
        except (TypeError, ValueError, KeyError):
            logger.warning("Connection attempt with invalid identity")
            return False

        from ..models import User
        if not User.query.get(user_id):
            logger.warning(f"Connection attempt for unknown user {user_id}")
            return False

        join_room(f"user_{user_id}")
        logger.info(f"User {user_id} connected and joined room: user_{user_id}")

    except Exception as e:
        logger.error(f"Socket connection error: {e}")
        return False

@socketio.on('disconnect')
def handle_disconnect():
    logger.info("Client disconnected")

@socketio.on('join_org')
def handle_join_org(data):
    """Explicitly join an organization room (members of that org only)."""
    from flask import request as freq
    try:
        org_id = int((data or {}).get('org_id'))
    except (TypeError, ValueError):
        return
    # Re-verify the caller's membership from their token (never trust room claims).
    token = freq.args.get('token')
    try:
        from flask_jwt_extended import decode_token as _decode
        from ..models import User as _User, TeamMember as _TM
        uid = int(_decode(token)['sub'])
        user = _User.query.get(uid)
        if not user:
            return
        allowed = user.organization_id == org_id or _TM.query.filter_by(
            organization_id=org_id, user_id=user.id).first() is not None
        if not allowed:
            logger.warning(f"User {user.id} denied org room org_{org_id}")
            return
    except Exception as e:
        logger.warning(f"join_org auth failed: {e}")
        return
    join_room(f"org_{org_id}")
    logger.info(f"Client joined org room: org_{org_id}")

@socketio.on('leave_org')
def handle_leave_org(data):
    org_id = data.get('org_id')
    if org_id:
        leave_room(f"org_{org_id}")
        logger.info(f"Client left org room: org_{org_id}")

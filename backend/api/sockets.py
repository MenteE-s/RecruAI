from flask import request
from flask_jwt_extended import decode_token
from ..extensions import socketio
from flask_socketio import join_room, leave_room
import logging

logger = logging.getLogger(__name__)

# sid -> authenticated user id for this process (threading mode).
# Lets later events (join_org) reuse the connect-time identity instead of
# re-transmitting the JWT.
_connected_users = {}


def _user_id_from_token(token):
    if not token:
        return None
    try:
        decoded = decode_token(token)
        return int(decoded["sub"])
    except (TypeError, ValueError, KeyError, Exception):
        return None


@socketio.on('connect')
def handle_connect(auth=None):
    """Handle client connection and join the caller's own room.

    The JWT arrives via the Socket.IO auth handshake only — never the URL
    query string, which would leak it into server/proxy logs.
    """
    token = (auth or {}).get('token')
    if not token:
        logger.warning("Connection attempt without token")
        return False  # Reject connection

    user_id = _user_id_from_token(token)
    if not user_id:
        logger.warning("Connection attempt with invalid identity")
        return False

    try:
        from ..models import User
        user = User.query.get(user_id)
        if not user:
            logger.warning(f"Connection attempt for unknown user {user_id}")
            return False
        if not user.email_verified:
            logger.warning(f"Connection attempt by unverified user {user_id}")
            return False

        _connected_users[request.sid] = user_id
        join_room(f"user_{user_id}")
        logger.info(f"User {user_id} connected and joined room: user_{user_id}")

    except Exception as e:
        logger.error(f"Socket connection error: {e}")
        return False

@socketio.on('disconnect')
def handle_disconnect():
    _connected_users.pop(request.sid, None)
    logger.info("Client disconnected")

@socketio.on('join_org')
def handle_join_org(data):
    """Explicitly join an organization room (members of that org only)."""
    try:
        org_id = int((data or {}).get('org_id'))
    except (TypeError, ValueError):
        return
    # Prefer the connect-time identity; fall back to token re-verification
    # via the data payload (never URL query or room claims).
    uid = _connected_users.get(request.sid)
    if uid is None:
        token = (data or {}).get('token')
        uid = _user_id_from_token(token)
        if uid is None:
            logger.warning("join_org without verifiable identity")
            return
    try:
        from ..models import User as _User, TeamMember as _TM
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

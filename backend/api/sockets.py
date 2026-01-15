from flask import request
from flask_jwt_extended import decode_token
from ..extensions import socketio
from flask_socketio import join_room, leave_room
import logging

logger = logging.getLogger(__name__)

@socketio.on('connect')
def handle_connect():
    """Handle client connection and join relevant rooms."""
    token = request.args.get('token')
    if not token:
        logger.warning("Connection attempt without token")
        return False # Reject connection
    
    try:
        decoded = decode_token(token)
        user_id = decoded['sub']
        
        # Identity verify - real apps would check DB here
        join_room(f"user_{user_id}")
        logger.info(f"User {user_id} connected and joined room: user_{user_id}")
        
        # If organization ID is in token or we fetch it
        # (Assuming org_id is available in the JWT identity or payload)
        # For now, let the frontend explicitly join an org room if needed 
        # or we could fetch user from DB here.
        
    except Exception as e:
        logger.error(f"Socket connection error: {e}")
        return False

@socketio.on('disconnect')
def handle_disconnect():
    logger.info("Client disconnected")

@socketio.on('join_org')
def handle_join_org(data):
    """Explicitly join an organization room."""
    org_id = data.get('org_id')
    if org_id:
        join_room(f"org_{org_id}")
        logger.info(f"Client joined org room: org_{org_id}")

@socketio.on('leave_org')
def handle_leave_org(data):
    org_id = data.get('org_id')
    if org_id:
        leave_room(f"org_{org_id}")
        logger.info(f"Client left org room: org_{org_id}")

"""Self-hosted video (LiveKit) routes: tokens, recording, webhooks."""
from flask import request, jsonify
from flask_jwt_extended import jwt_required
from .. import api_bp
from ...extensions import db
from ...models import Interview
from ...utils import livekit_service as livekit
from .interviews import _me, _can_see_interview


def _get_visible_interview(interview_id):
    interview = Interview.query.get_or_404(interview_id)
    if not _can_see_interview(_me(), interview):
        return None, (jsonify({"error": "Forbidden"}), 403)
    return interview, None


@api_bp.route('/interviews/<int:interview_id>/video-token', methods=['POST'])
@jwt_required()
def get_video_token(interview_id):
    """Mint a LiveKit token for this user in the interview's room."""
    interview, denied = _get_visible_interview(interview_id)
    if denied:
        return denied
    if not livekit.is_configured():
        return jsonify({"error": "Video calls are not configured"}), 503
    user = _me()
    try:
        return jsonify(livekit.mint_token(user, interview)), 200
    except Exception as e:
        return jsonify({"error": f"Could not issue video token: {e}"}), 502


@api_bp.route('/interviews/<int:interview_id>/recording/start', methods=['POST'])
@jwt_required()
def start_recording(interview_id):
    """Start room recording (idempotent per room; capacity-capped)."""
    interview, denied = _get_visible_interview(interview_id)
    if denied:
        return denied
    if not livekit.is_configured():
        return jsonify({"error": "Video calls are not configured"}), 503
    try:
        return jsonify(livekit.start_recording(interview)), 200
    except RuntimeError as e:
        msg = str(e)
        status = 429 if "capacity" in msg.lower() else 502
        return jsonify({"error": msg}), status
    except Exception as e:
        return jsonify({"error": f"Could not start recording: {e}"}), 502


@api_bp.route('/interviews/<int:interview_id>/recording/stop', methods=['POST'])
@jwt_required()
def stop_recording(interview_id):
    """Stop all active recordings for the interview's room."""
    interview, denied = _get_visible_interview(interview_id)
    if denied:
        return denied
    if not livekit.is_configured():
        return jsonify({"error": "Video calls are not configured"}), 503
    stopped = livekit.stop_room_recordings(interview)
    return jsonify({"stopped": stopped}), 200


@api_bp.route('/interviews/<int:interview_id>/recording/status', methods=['GET'])
@jwt_required()
def recording_status(interview_id):
    """Whether the interview's room is currently being recorded."""
    interview, denied = _get_visible_interview(interview_id)
    if denied:
        return denied
    if not livekit.is_configured():
        return jsonify({"recording": False, "configured": False}), 200
    try:
        existing = livekit._active_egress_for_room(livekit.room_name(interview.id))
        return jsonify({"recording": existing is not None, "configured": True}), 200
    except Exception as e:
        return jsonify({"error": f"Could not check recording status: {e}"}), 502


@api_bp.route('/livekit/webhook', methods=['POST'])
def livekit_webhook():
    """Receive LiveKit server webhooks (signature-verified, no JWT).

    On egress completion, stores the recording playback URL on the interview.
    """
    if not livekit.is_configured():
        return jsonify({"error": "Video calls are not configured"}), 503
    body = request.get_data(as_text=True)
    auth_header = request.headers.get("Authorization", "")
    # LiveKit posts the raw JWT (no "Bearer " prefix); tolerate both forms.
    auth_token = auth_header[7:] if auth_header.startswith("Bearer ") else auth_header
    try:
        event = livekit.verify_webhook(body, auth_token)
    except Exception:
        return jsonify({"error": "Invalid webhook signature"}), 401
    try:
        event_name = str(getattr(event, "event", ""))
        if "egress_ended" in event_name.lower():
            info = getattr(event, "egress_info", None)
            room = getattr(info, "room_name", "") if info else ""
            prefix = livekit.ROOM_PREFIX
            if room.startswith(prefix):
                try:
                    interview_id = int(room[len(prefix):])
                except (TypeError, ValueError):
                    interview_id = None
                if interview_id:
                    interview = Interview.query.get(interview_id)
                    files = list(getattr(info, "file_results", []) or [])
                    if interview is not None and files:
                        filename = getattr(files[0], "filename", "") or ""
                        base = filename.rsplit("/", 1)[-1]
                        if base:
                            interview.recording_url = f"/uploads/recordings/{base}"
                            db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Webhook handling failed: {e}"}), 500
    return jsonify({"received": True}), 200

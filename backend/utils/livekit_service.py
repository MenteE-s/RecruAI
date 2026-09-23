"""Self-hosted LiveKit helpers: per-interview tokens, recording egress, webhooks.

Rooms are deterministic: ``recruai-interview-<id>`` (matches Interview.room_id
usage). Token minting is offline; egress calls run in a fresh event loop
because the LiveKit client must be constructed inside a running loop.

NOTE: settings come from a ``Config()`` instance, not ``current_app.config``.
Flask's ``from_object`` stores ``@property`` descriptors as-is, so
``app.config.get("LIVEKIT_URL")`` would return a property object instead of
the value (same latent trap as the other ``Config`` properties).
"""

import asyncio
import logging
import os

from backend.config import Config

logger = logging.getLogger(__name__)

ROOM_PREFIX = "recruai-interview-"
RECORDINGS_DIR = "/recordings"


def _cfg() -> Config:
    return Config()


def is_configured() -> bool:
    """True when LiveKit server credentials are present."""
    cfg = _cfg()
    return bool(cfg.LIVEKIT_URL and cfg.LIVEKIT_API_KEY and cfg.LIVEKIT_API_SECRET)


def room_name(interview_id: int) -> str:
    return f"{ROOM_PREFIX}{int(interview_id)}"


def _run(coro_fn):
    """Run ``coro_fn(api)`` with a LiveKit client built inside the loop."""
    from livekit import api as lk

    async def main():
        cfg = _cfg()
        api = lk.LiveKitAPI(
            url=cfg.LIVEKIT_URL,
            api_key=cfg.LIVEKIT_API_KEY,
            api_secret=cfg.LIVEKIT_API_SECRET,
        )
        try:
            return await coro_fn(api)
        finally:
            await api.aclose()

    return asyncio.run(main())


def mint_token(user, interview) -> dict:
    """Mint a 1:1-call token for this user in the interview's room (offline)."""
    from livekit import api as lk
    cfg = _cfg()
    if not is_configured():
        raise RuntimeError("LiveKit is not configured (LIVEKIT_URL/API_KEY/API_SECRET)")
    room = room_name(interview.id)
    token = (
        lk.AccessToken(cfg.LIVEKIT_API_KEY, cfg.LIVEKIT_API_SECRET)
        .with_identity(f"user_{user.id}")
        .with_name(user.name or user.email)
        .with_grants(lk.VideoGrants(
            room_join=True,
            room=room,
            can_publish=True,
            can_subscribe=True,
        ))
        .to_jwt()
    )
    public_url = cfg.LIVEKIT_PUBLIC_URL or cfg.LIVEKIT_URL
    return {"token": token, "url": public_url, "room": room}


def active_recording_count() -> int:
    """Number of currently active/starting egresses (for the concurrency cap)."""
    from livekit import api as lk

    async def _list(api):
        return await api.egress.list_egress(lk.ListEgressRequest(active=True))

    res = _run(_list)
    active = {lk.EGRESS_ACTIVE, lk.EGRESS_STARTING}
    return sum(1 for item in (res.items or []) if item.status in active)


def _active_egress_for_room(room: str):
    """Return the active egress for a room, if any (idempotency)."""
    from livekit import api as lk

    async def _list(api):
        return await api.egress.list_egress(
            lk.ListEgressRequest(room_name=room, active=True))

    res = _run(_list)
    for item in (res.items or []):
        if item.status in (lk.EGRESS_ACTIVE, lk.EGRESS_STARTING):
            return item
    return None


def start_recording(interview) -> dict:
    """Start room-composite MP4 egress. Idempotent per room.

    Enforces LIVEKIT_MAX_CONCURRENT_RECORDINGS (default 2). Returns
    {"egress_id": ...} — existing active egress is returned, not duplicated.
    """
    from livekit import api as lk
    if not is_configured():
        raise RuntimeError("LiveKit is not configured")
    cfg = _cfg()
    room = room_name(interview.id)
    existing = _active_egress_for_room(room)
    if existing:
        return {"egress_id": existing.egress_id, "resumed": True}
    if active_recording_count() >= int(cfg.LIVEKIT_MAX_CONCURRENT_RECORDINGS or 2):
        raise RuntimeError("Recording capacity reached, try again shortly")
    filepath = f"{RECORDINGS_DIR}/{room}.mp4"

    async def _start(api):
        return await api.egress.start_room_composite_egress(lk.RoomCompositeEgressRequest(
            room_name=room,
            layout="speaker-dark",
            file_outputs=[lk.EncodedFileOutput(
                file_type=lk.EncodedFileType.MP4,
                filepath=filepath,
            )],
        ))

    res = _run(_start)
    return {"egress_id": res.egress_id, "resumed": False}


def stop_recording(egress_id: str) -> bool:
    """Stop an egress. Returns False when LiveKit is unconfigured."""
    from livekit import api as lk
    if not is_configured():
        return False

    async def _stop(api):
        await api.egress.stop_egress(lk.StopEgressRequest(egress_id=egress_id))

    try:
        _run(_stop)
        return True
    except Exception as e:
        logger.warning(f"Stop egress failed for {egress_id}: {e}")
        return False


def stop_room_recordings(interview) -> int:
    """Stop all active egresses for an interview's room. Returns count stopped."""
    from livekit import api as lk
    if not is_configured():
        return 0
    room = room_name(interview.id)

    async def _stop_all(api):
        res = await api.egress.list_egress(lk.ListEgressRequest(room_name=room, active=True))
        stopped = 0
        for item in (res.items or []):
            if item.status in (lk.EGRESS_ACTIVE, lk.EGRESS_STARTING):
                try:
                    await api.egress.stop_egress(lk.StopEgressRequest(egress_id=item.egress_id))
                    stopped += 1
                except Exception as e:
                    logger.warning(f"Stop egress failed for {item.egress_id}: {e}")
        return stopped

    return _run(_stop_all)


def verify_webhook(body: str, auth_header: str):
    """Verify a LiveKit webhook request, returning the parsed event."""
    from livekit.api.webhook import WebhookReceiver
    from livekit.api.access_token import TokenVerifier
    receiver = WebhookReceiver(TokenVerifier(api_secret=_cfg().LIVEKIT_API_SECRET))
    return receiver.receive(body, auth_header)

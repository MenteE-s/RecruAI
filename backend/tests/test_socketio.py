"""P2-09 regression test: emits cross the Redis message queue.

Two independent Socket.IO servers sharing one Redis (fakeredis here) must
deliver an emit from worker B to worker A's manager. Without the queue,
adding API replicas silently drops realtime notifications for users
connected to the other worker.
"""

import functools
import threading
import time

import pytest

fakeredis = pytest.importorskip("fakeredis")


def test_emit_crosses_the_redis_queue(monkeypatch):
    import redis
    import socketio
    from socketio import RedisManager, Server
    from socketio.pubsub_manager import PubSubManager

    shared = fakeredis.FakeStrictRedis()
    monkeypatch.setattr(
        redis.Redis, "from_url", staticmethod(lambda *a, **k: shared)
    )

    received = []
    lock = threading.Lock()
    orig_emit = PubSubManager.emit

    @functools.wraps(orig_emit)
    def spy_emit(self, event, data, namespace=None, room=None,
                 skip_sid=None, callback=None, **kwargs):
        if event == "ping":
            with lock:
                received.append((event, namespace, room, data))
        return orig_emit(
            self, event, data, namespace=namespace, room=room,
            skip_sid=skip_sid, callback=callback, **kwargs,
        )

    monkeypatch.setattr(PubSubManager, "emit", spy_emit)

    manager_a = RedisManager(url="redis://fake:6379/0", channel="fanout-test")
    manager_b = RedisManager(url="redis://fake:6379/0", channel="fanout-test")
    Server(client_manager=manager_a, async_mode="threading")
    Server(client_manager=manager_b, async_mode="threading")
    manager_a.initialize()

    manager_b.emit("ping", {"n": 1}, namespace="/")
    deadline = time.time() + 10
    while time.time() < deadline and not received:
        time.sleep(0.1)

    assert received and received[0][0] == "ping"

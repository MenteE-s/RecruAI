"""Repo hygiene regression tests (P2-01, P2-06, P2-07).

Static guards that fail the suite if a known-bad pattern returns:
* legacy per-model Query get accessors — removed in SQLAlchemy 2.x; use
  db.session.get / db.get_or_404 instead.
* client.keys( — blocking Redis KEYS; use SCAN iteration.
* tracked junk at the repo root (``null``) must stay deleted.
"""

import pathlib
import re

REPO = pathlib.Path(__file__).resolve().parents[2]
BACKEND = REPO / "backend"


def _python_files():
    return [
        p for p in BACKEND.rglob("*.py")
        if ".venv" not in p.parts and "__pycache__" not in p.parts
    ]


def test_no_legacy_query_get():
    offenders = []
    for path in _python_files():
        for i, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if re.search(r"\.query\.get(_or_404)?\(", line):
                offenders.append(f"{path.relative_to(REPO)}:{i}: {line.strip()}")
    assert not offenders, "legacy Query.get usage:\n" + "\n".join(offenders)


def test_no_blocking_redis_keys():
    cache_py = (BACKEND / "utils" / "cache.py").read_text(encoding="utf-8")
    assert "scan_iter" in cache_py
    assert not re.search(r"client\.keys\(", cache_py)


def test_no_tracked_junk_at_repo_root():
    assert not (REPO / "null").exists()


def test_external_images_are_digest_pinned():
    """Every pulled image must be tag@sha256 pinned; only locally built
    recruai_backend images are exempt."""
    offenders = []
    files = [
        "docker-compose.yml",
        "docker-compose.vps.yml",
        "docker-compose.aws.yml",
        "docker-compose.prod.yml",
        "backend/Dockerfile",
        "frontend/Dockerfile",
        "frontend/Dockerfile.prod",
        ".github/workflows/deploy.yml",
        ".github/workflows/check-migrations.yml",
    ]
    for name in files:
        path = REPO / name
        if not path.exists():
            continue
        for i, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            stripped = line.strip()
            for key in ("image:", "FROM"):
                if not stripped.startswith(key):
                    continue
                ref = stripped[len(key):].strip().split()[0]
                if "recruai_backend" in ref or "${" in ref or ref.startswith("$"):
                    continue
                if "@sha256:" not in ref:
                    offenders.append(f"{name}:{i}: {stripped}")
    assert not offenders, "unpinned external images:\n" + "\n".join(offenders)

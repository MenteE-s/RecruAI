#!/usr/bin/env bash
# CI guard (P2-10): the audit HTML must name the real migration head, so docs
# cannot silently drift from backend/migrations/versions.
set -euo pipefail

cd "$(dirname "$0")/.."

HEAD="$(python3 - <<'PY'
import re, glob
revs = {}
for f in glob.glob("backend/migrations/versions/*.py"):
    s = open(f, encoding="utf-8").read()
    m1 = re.search(r"^revision\s*=\s*['\"]([^'\"]+)['\"]", s, re.M)
    m2 = re.search(r"^down_revision\s*=\s*['\"]([^'\"]+)['\"]", s, re.M)
    if m1:
        revs[m1.group(1)] = m2.group(1) if m2 else None
heads = set(revs) - {d for d in revs.values() if d}
print(" ".join(sorted(heads)))
PY
)"

COUNT=$(echo "$HEAD" | wc -w)
if [ "$COUNT" -ne 1 ]; then
  echo "expected exactly one migration head, found: $HEAD"
  exit 1
fi

if ! grep -q "$HEAD" docs/production-readiness-audit.html; then
  echo "docs/production-readiness-audit.html does not mention migration head $HEAD"
  exit 1
fi

echo "migration head OK: $HEAD"

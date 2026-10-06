"""Public profile slugs.

A person's public URL is /in/<slug> — a readable handle, not a database id.
Ids leak row counts and are guessable; a slug is chosen by the person and
stable if their name changes.

Two hard constraints shape this module:

1. Slugs collide with real routes. /in/profile is the private profile editor,
   /in/jobs is the job list — so a slug of "profile" or "jobs" would be
   unreachable. RESERVED covers every static segment we serve, plus the shared
   root routes and the obvious operational words.

2. Slugs collide with each other. Generation retries on the unique index, and
   callers must handle the final failure rather than loop forever.
"""

import random
import re

# 32 chars, no 0/O/1/l/I — these slugs get read aloud, typed by hand and
# printed on business cards, so ambiguous glyphs cause real support load.
ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"
DEFAULT_LENGTH = 8
MIN_USER_SLUG_LEN = 3
MAX_USER_SLUG_LEN = 30

# Every static /in/* route, every root route, and operational words. A slug in
# this set would either 404 or shadow a real page.
RESERVED = frozenset({
    # /in/* static segments
    "profile", "interviews", "interview", "jobs", "network", "analytics",
    "resume", "coaching", "practice", "ai-agents", "shareable-profiles",
    "create",
    # root-level routes
    "dashboard", "notifications", "settings", "billing", "search", "page",
    "org", "signin", "sign-in", "login", "logout", "register", "signup",
    "terms", "privacy", "cookies", "about", "us", "blog", "careers",
    "status", "contact", "community",
    # operational
    "admin", "administrator", "api", "root", "system", "support", "help",
    "static", "assets", "media", "uploads", "public", "private", "internal",
    "null", "undefined", "none", "true", "false", "new", "edit", "delete",
    "me", "my", "self", "user", "users", "home", "index", "test", "demo",
    # Brand handles, so nobody can pose as the company. Person names are NOT
    # reserved — a person may claim their own.
    "recruai", "mentee", "menteeai", "team", "company", "about-us",
})

# Slugs that look like an id or a placeholder still make bad public URLs.
_BAD_PREFIXES = ("user", "usr", "id", "u-", "tmp")


def random_slug(length: int = DEFAULT_LENGTH) -> str:
    """A random slug. Not guaranteed unique — caller must check."""
    return "".join(random.choice(ALPHABET) for _ in range(length))


def is_valid_slug(slug: str) -> bool:
    """Whether a user may claim this slug for themselves.

    Case is normalised before checking, so "Syab" is accepted and means
    "syab". That matches what the API does (it lowercases before calling this),
    so the two can't disagree about whether a mixed-case request is usable.
    """
    if not slug or not isinstance(slug, str):
        return False
    s = slug.strip().lower()
    if len(s) < MIN_USER_SLUG_LEN or len(s) > MAX_USER_SLUG_LEN:
        return False
    if s in RESERVED:
        return False
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", s):
        return False
    # No leading/trailing/double hyphens (already implied by the regex, kept
    # explicit for readability), and no numeric-only slug.
    if s.replace("-", "").isdigit():
        return False
    if any(s.startswith(p) for p in _BAD_PREFIXES) and len(s) <= 4:
        return False
    return True


def slug_taken(slug: str, user_model, exclude_user_id: int = None) -> bool:
    """True when another user already holds this slug."""
    q = user_model.query.filter(user_model.profile_slug == slug)
    if exclude_user_id is not None:
        q = q.filter(user_model.id != exclude_user_id)
    return q.first() is not None


def generate_unique_slug(user_model, exclude_user_id: int = None,
                         length: int = DEFAULT_LENGTH, attempts: int = 6) -> str:
    """Generate a slug that is neither reserved nor already taken.

    Raises RuntimeError if every attempt collides — practically impossible with
    a 32-char alphabet at 8 chars (32^8), but a caller must not pretend it is
    guaranteed.
    """
    for _ in range(attempts):
        candidate = random_slug(length)
        if candidate in RESERVED:
            continue
        if not slug_taken(candidate, user_model, exclude_user_id):
            return candidate
    raise RuntimeError("could not generate a unique profile slug")


# --- company pages: /org/<slug> ------------------------------------------
# Company slugs come from the company name, not a random string — a page URL
# that reads /org/microsoft is the point. Fixed once at creation so renaming
# the company can't break links already shared.
ORG_RESERVED = frozenset({
    "ai-agents", "analytics", "billing", "browse", "candidate-analysis",
    "candidates", "hire", "insights", "integrations", "interviews", "jobs",
    "pipeline", "profile", "reports", "team", "user", "page", "new", "edit",
    "settings", "admin", "api", "null", "undefined", "test", "demo",
    "login", "logout", "signin", "signup", "register", "search", "help",
    "support", "about", "contact", "terms", "privacy", "careers", "blog",
    "in", "org",
})

MAX_ORG_SLUG_LEN = 60


def slugify_company(name: str) -> str:
    """Turn a company name into a URL fragment.

    Accents are stripped rather than transliterated ("Café Ltd" -> "cafe-ltd"),
    punctuation collapses to single hyphens, and the result is trimmed to the
    column width. Returns "" for input that has no usable characters, which
    callers must handle (fall back to an id-based slug).
    """
    import unicodedata

    s = unicodedata.normalize("NFKD", name or "")
    s = s.encode("ascii", "ignore").decode()
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s[:MAX_ORG_SLUG_LEN].strip("-")


def unique_org_slug(name: str, org_model, attempts: int = 50) -> str:
    """A slug for a new company page: name-derived, reserved-word-safe, unique.

    Collisions are expected — "Tech Corp" and "TechCorp" both slugify to
    "techcorp" — so a numeric suffix is appended rather than failing.
    """
    base = slugify_company(name)
    if not base:
        base = "company"
    if base in ORG_RESERVED:
        base = f"{base}-org"

    candidate = base
    n = 2
    while n <= attempts:
        taken = org_model.query.filter(
            org_model.slug == candidate).first() is not None
        if not taken:
            return candidate
        candidate = f"{base}-{n}"
        n += 1
    raise RuntimeError("could not generate a unique company slug")
"""Skill-gap computation: what does this candidate have, and what is missing?

Replaces keyword-overlap matching that compared a job requirement against a bag
of every word in a profile. That approach had three failure modes, all of which
inflated the score:

  * A requirement matched on a SINGLE shared keyword, so "Kubernetes and
    Terraform in production" passed for someone who had only touched Terraform.
  * Tokens shorter than 3 characters were dropped, so "Go", "R" and "C#"
    could never match anything.
  * A requirement that produced no keywords at all was counted as MATCHED
    (`if not req_keywords: matched.append(req)`), so "Experience with R"
    passed for every candidate.

Requirements arrive as free text from job posts and skills as free text from
profiles, so both sides are resolved through the canonical taxonomy before
anything is compared. A requirement nobody can classify is reported as
unclassified instead of being silently scored as a pass.

Kept free of Flask and the database so it can be reasoned about and tested on
its own; supervisor.py does the fetching.
"""

import re

from .skill_taxonomy import LEVELS, level_rank, normalize_level, resolve

# Level words -> canonical level. Ordered most-demanding first because the first
# match wins, and "expert JavaScript with strong AWS skills" should read the
# requirement as Expert even though "strong" is also an Advanced cue.
_LEVEL_CUES = (
    ("Expert", (r"\bexpert", r"\bmastery", r"\bdeep\b", r"\bproficient\b", r"\bauthoritative\b")),
    ("Advanced", (r"\badvanced\b", r"\bstrong\b", r"\bsolid\b", r"\bextensive\b")),
    ("Intermediate", (r"\bintermediate\b", r"\bworking knowledge\b", r"\bcomfortable\b", r"\bhands[- ]on\b")),
    ("Beginner", (r"\bbeginner\b", r"\bbasic\b", r"\bfamiliar\b", r"\bexposure\b", r"\bentry[- ]level\b")),
)

_YEARS_RE = re.compile(r"(\d{1,2})\s*\+?\s*(?:-|to)?\s*\d{0,2}\s*(?:years?|yrs?)", re.IGNORECASE)


def _mention_pattern():
    """One alternation of every catalogued name and alias, longest first.

    Longest-first matters: "c" must not consume the "c" in "ci/cd" or "c#",
    and "go" must not fire inside "django". Wrapped in word boundaries, with
    the non-alphanumeric aliases escaped.
    """
    from .skill_taxonomy import SKILLS

    # Keys are lowercased: the regex is case-insensitive, so a match can come
    # back in any casing and the dict lookup has to agree.
    phrases = {}
    for entry in SKILLS.values():
        phrases.setdefault(entry["name"].lower(), entry["slug"])
        for alias in entry["aliases"]:
            phrases.setdefault(alias.lower(), entry["slug"])
    ordered = sorted(phrases, key=len, reverse=True)
    alternation = "|".join(re.escape(p) for p in ordered)
    return re.compile(r"(?<![\w+#])(" + alternation + r")(?![\w+#])", re.IGNORECASE), phrases


_MENTION_RE, _PHRASE_SLUGS = _mention_pattern()


def _required_level(text):
    """Infer the demanded proficiency from the words around a skill mention."""
    lowered = (text or "").lower()
    for level, cues in _LEVEL_CUES:
        if any(re.search(cue, lowered) for cue in cues):
            return level
    return None


def _required_years(text):
    m = _YEARS_RE.search(text or "")
    return int(m.group(1)) if m else None


def parse_requirements(requirements):
    """Turn requirement strings into canonical skill demands.

    Returns (demands, unclassified). A single requirement can name several
    skills ("Kubernetes and Terraform"), and each becomes its own demand so a
    partially-met compound requirement shows up as a partial gap rather than a
    single pass/fail.
    """
    demands, unclassified = [], []
    for raw in requirements or []:
        text = (raw or "").strip()
        if not text:
            continue
        hits, seen_slugs = [], set()
        for match in _MENTION_RE.finditer(text):
            slug = _PHRASE_SLUGS.get(match.group(0).lower())
            if slug and slug not in seen_slugs:
                seen_slugs.add(slug)
                entry = resolve(slug)
                hits.append({
                    "slug": slug,
                    "name": entry["name"],
                    "category": entry["category"],
                    "required_level": _required_level(text),
                    "required_years": _required_years(text),
                    "requirement": text,
                })
        if hits:
            demands.extend(hits)
        else:
            unclassified.append(text)
    return demands, unclassified


def candidate_skill_index(skills=(), technologies=()):
    """Resolve a candidate's own skills and project techs into canonical form.

    `skills` are Skill rows/dicts carrying a level; `technologies` are bare
    strings from projects, certifications and experience, so they establish
    presence but never a level. Sources are kept because "this came from a
    self-declared list" and "this came from a shipped project" are different
    strengths of evidence, and the learner profile work needs the difference.
    """
    index = {}
    for item in skills or []:
        # Accepts Skill rows, dicts, or plain strings — a bare string is the
        # natural thing to pass and used to be dropped silently, which made an
        # empty gap look like a candidate with no skills at all.
        if isinstance(item, str):
            name, level = item, None
        elif isinstance(item, dict):
            name, level = item.get("name"), item.get("level")
        else:
            name = getattr(item, "name", None)
            level = getattr(item, "level", None)
        entry = resolve(name)
        if not entry:
            continue
        canonical = normalize_level(level)
        current = index.get(entry["slug"])
        if current is None:
            index[entry["slug"]] = {
                "slug": entry["slug"],
                "name": entry["name"],
                "level": canonical,
                "level_rank": level_rank(canonical),
                "sources": ["profile_skill"],
                "raw_names": [str(name).strip()] if name else [],
            }
        else:
            current["raw_names"].append(str(name).strip())
            # Keep the strongest stated level; "expert" in one row should not be
            # erased by a blank or weaker duplicate of the same skill.
            if level_rank(canonical) > current["level_rank"]:
                current["level"] = canonical
                current["level_rank"] = level_rank(canonical)
            if "profile_skill" not in current["sources"]:
                current["sources"].append("profile_skill")

    for raw in technologies or ():
        text = (raw or "").strip()
        if not text:
            continue
        entry = resolve(text)
        if not entry:
            continue
        current = index.get(entry["slug"])
        if current is None:
            index[entry["slug"]] = {
                "slug": entry["slug"],
                "name": entry["name"],
                "level": None,
                "level_rank": 0,
                "sources": ["profile_text"],
                "raw_names": [text],
            }
        else:
            current["raw_names"].append(text)
            if "profile_text" not in current["sources"]:
                current["sources"].append("profile_text")
    return index


def compute_gap(skills=(), technologies=(), requirements=()):
    """Compare a candidate against a job's requirements.

    Each demanded skill lands in exactly one bucket:
      matched    - held, at or above the demanded level
      level_gap  - held, but below the demanded level (still a gap, not a pass)
      missing    - not held at all
    """
    index = candidate_skill_index(skills, technologies)
    demands, unclassified = parse_requirements(requirements)

    matched, level_gaps, missing = [], [], []
    for demand in demands:
        held = index.get(demand["slug"])
        if not held:
            missing.append(demand)
            continue
        wanted = level_rank(demand["required_level"])
        if wanted and held["level_rank"] < wanted:
            level_gaps.append({
                **demand,
                "held_level": held["level"],
                "held_level_rank": held["level_rank"],
                "levels_short": wanted - held["level_rank"],
            })
        else:
            matched.append(demand)

    total = len(demands)
    ratio = (len(matched) / total) if total else 1.0

    # Requirement strings, for callers that already render the old shape.
    # A compound requirement counts as met only when every skill it names is
    # met, which is the whole point of splitting it above.
    def _texts(bucket):
        return sorted({d["requirement"] for d in bucket})

    met_requirement_texts = set(_texts(matched))
    partial_or_missing = set(_texts(level_gaps)) | set(_texts(missing))

    return {
        "matched": sorted(met_requirement_texts),
        "missing": sorted(partial_or_missing),
        "skill_match_ratio": round(ratio, 2),
        "matched_skill_count": len(matched),
        "missing_skill_count": len(missing) + len(level_gaps),
        "total_required_skills": total,
        "level_gap_count": len(level_gaps),
        "matched_skills": [
            {k: d[k] for k in ("slug", "name", "category", "required_level", "requirement")}
            for d in matched
        ],
        "missing_skills": [
            {k: d[k] for k in ("slug", "name", "category", "required_level", "requirement")}
            for d in missing
        ],
        "level_gaps": level_gaps,
        "unclassified_requirements": unclassified,
        "candidate_skills": sorted(index.values(), key=lambda e: e["name"]),
    }


__all__ = [
    "LEVELS",
    "compute_gap",
    "candidate_skill_index",
    "parse_requirements",
]
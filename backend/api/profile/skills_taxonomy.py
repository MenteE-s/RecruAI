"""Skill taxonomy endpoints.

Reference data for the skill picker. Separate from the per-user skill CRUD in
educations.py on purpose: that endpoint writes a row the caller typed, this
one only describes what the catalog knows. Keeping them apart means a skill
can be catalogued without anyone depending on the profile routes.
"""
from flask import request, jsonify
from flask_jwt_extended import jwt_required

from .. import api_bp
from ...utils import skill_taxonomy as taxonomy

# The resolver runs a ~350-alternative phrase matcher over caller-supplied
# text, so lengths are capped here rather than trusting the client. 120 chars
# is wider than the longest catalogued skill name ("Natural Language
# Processing" + aliases) with room for a pasted "Node.js (Express/K8s)".
MAX_NAME_LEN = 120
MAX_TERM_LEN = 80
MAX_NAMES_PER_CALL = 100


@api_bp.route('/skills/taxonomy', methods=['GET'])
@jwt_required()
def get_skill_taxonomy():
    """Levels, categories and the canonical skill list.

    The frontend renders these exact values so the picker and the validator
    can never disagree. Pass ?q= for typeahead instead of downloading the
    whole list on every keystroke.
    """
    term = (request.args.get('q') or '').strip()[:MAX_TERM_LEN]
    payload = taxonomy.taxonomy_payload()
    if term:
        payload['skills'] = taxonomy.search(term)
        payload['total'] = len(payload['skills'])
        payload['query'] = term
    return jsonify(payload), 200


@api_bp.route('/skills/resolve', methods=['POST'])
@jwt_required()
def resolve_skill():
    """Map free text onto a canonical skill.

    Exists because skills arrive from resumes and job posts that nobody
    curates: "ReactJS", "react.js" and "React" must count as one skill
    before a gap can be measured. Returns matched: false for uncatalogued
    text rather than 404 — an unknown skill is a real input, not an error.
    """
    data = request.get_json(silent=True) or {}
    names = data.get('names')
    if names is None:
        name = data.get('name')
        names = [name] if name else []

    if not isinstance(names, list):
        return jsonify({'error': 'names must be a list of strings'}), 400

    resolved, unmatched = [], []
    for raw in names[:MAX_NAMES_PER_CALL]:
        if not isinstance(raw, str):
            continue
        # Truncate rather than reject: a pasted "Senior Backend Engineer, Node.js
        # (Express/Kubernetes), AWS — 6 yrs" should still resolve the skills in
        # it, and truncation only risks losing a trailing mention.
        entry = taxonomy.resolve(raw[:MAX_NAME_LEN])
        if entry:
            resolved.append(entry)
        elif raw.strip():
            unmatched.append(raw.strip()[:MAX_NAME_LEN])

    return jsonify({
        'resolved': resolved,
        'unmatched': unmatched,
        'matched_count': len(resolved),
        'unmatched_count': len(unmatched),
    }), 200
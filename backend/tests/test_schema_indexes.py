"""Schema contracts for the high-volume auth and invitation paths."""

from sqlalchemy import text

from backend.extensions import db


def _indexes():
    rows = db.session.execute(
        text(
            "SELECT indexname, indexdef FROM pg_indexes "
            "WHERE schemaname = current_schema()"
        )
    ).all()
    return {name: definition for name, definition in rows}


def test_password_reset_lookup_has_a_composite_index():
    indexes = _indexes()
    definition = indexes["ix_email_otps_user_purpose_created"]

    assert "user_id" in definition
    assert "purpose" in definition
    assert "created_at" in definition


def test_case_insensitive_user_lookup_is_indexed():
    definition = _indexes()["ix_users_email_lower"]

    assert "lower" in definition.lower()
    assert "email" in definition


def test_invitation_resend_lookup_is_indexed():
    definition = _indexes()["ix_org_invitations_org_email_lower"]

    assert "organization_id" in definition
    assert "lower" in definition.lower()
    assert "email" in definition


def test_token_lookups_remain_unique():
    indexes = _indexes()

    for table in ("refresh_tokens", "organization_invitations"):
        definitions = [
            definition
            for definition in indexes.values()
            if table in definition
        ]
        assert any(
            "token_hash" in definition and "unique" in definition.lower()
            for definition in definitions
        ), f"{table} lost its unique token_hash index"

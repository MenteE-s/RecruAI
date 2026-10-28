"""Public profile-by-slug contract.

The slug URL is shared in emails and business cards, so it is intentionally
open. These tests pin the privacy boundary: public sections are present, while
account contact data and billing state never leak.
"""

import json

from backend.extensions import db
from backend.models import (
    Education,
    Experience,
    Language,
    ProfileSection,
    Project,
    Skill,
    SocialMediaLink,
    VolunteerExperience,
)


def test_public_profile_returns_public_sections_without_private_fields(
    client, make_user
):
    user = make_user(
        email="public-profile@example.com",
        name="Sara Ali",
        profile_slug="sara-ali",
        phone="+92-300-0000000",
        location="Karachi, Pakistan",
    )
    db.session.add_all([
        ProfileSection(
            user_id=user.id,
            section_type="about",
            section_data=json.dumps({"content": "I build reliable systems."}),
            order_index=0,
        ),
        Experience(
            user_id=user.id,
            title="Senior Engineer",
            company="MenteE",
            current_job=True,
        ),
        Education(
            user_id=user.id,
            degree="BSc Computer Science",
            school="NED University",
            year="2020",
        ),
        Skill(user_id=user.id, name="Python", level="Expert", verified=True),
        Project(
            user_id=user.id,
            name="RecruAI",
            technologies=json.dumps(["Python", "React"]),
        ),
        Language(user_id=user.id, name="English", proficiency_level="Native"),
        VolunteerExperience(
            user_id=user.id,
            title="Mentor",
            organization="Code for Pakistan",
        ),
        SocialMediaLink(
            user_id=user.id,
            platform="GitHub",
            url="https://github.com/example",
        ),
    ])
    db.session.commit()

    response = client.get("/api/in/sara-ali")

    assert response.status_code == 200
    body = response.get_json()
    profile = body["user"]

    assert profile["name"] == "Sara Ali"
    assert profile["slug"] == "sara-ali"
    assert profile["about"]["content"] == "I build reliable systems."
    assert profile["experiences"][0]["title"] == "Senior Engineer"
    assert profile["educations"][0]["degree"] == "BSc Computer Science"
    assert profile["skills"][0]["name"] == "Python"
    assert profile["projects"][0]["name"] == "RecruAI"
    assert profile["languages"][0]["name"] == "English"
    assert profile["volunteer_experiences"][0]["title"] == "Mentor"
    assert profile["social_media_links"][0]["platform"] == "GitHub"

    for private_key in (
        "email",
        "phone",
        "organization_id",
        "plan",
        "subscription_status",
        "password_hash",
    ):
        assert private_key not in profile


def test_public_profile_accepts_a_numeric_id_fallback(client, make_user):
    user = make_user(email="numeric-profile@example.com", name="Numeric Person")

    response = client.get(f"/api/in/{user.id}")

    assert response.status_code == 200
    assert response.get_json()["user"]["id"] == user.id


def test_public_profile_unknown_slug_is_404(client):
    response = client.get("/api/in/does-not-exist")

    assert response.status_code == 404
    assert response.get_json()["error"] == "Not found"

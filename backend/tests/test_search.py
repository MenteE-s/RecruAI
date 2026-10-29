"""Universal search behaviour and its privacy boundaries."""

from backend.extensions import db
from backend.models import Post


def _add_post(org, **kwargs):
    post = Post(
        organization_id=org.id,
        title=kwargs.pop("title", "Platform Engineer"),
        slug=kwargs.pop("slug", f"platform-engineer-{org.id}"),
        description=kwargs.pop("description", "Build reliable systems."),
        status=kwargs.pop("status", "active"),
        **kwargs,
    )
    db.session.add(post)
    db.session.commit()
    return post


def test_searching_a_company_surfaces_its_job_posts(
    client, make_user, make_org, auth_headers
):
    viewer = make_user(name="Search Viewer")
    org = make_org(name="Aarzo Labs", slug="aarzo-labs", is_public=True)
    post = _add_post(org, title="Backend Engineer")

    response = client.get(
        "/api/search?q=Aarzo", headers=auth_headers(viewer)
    )

    assert response.status_code == 200
    data = response.get_json()
    assert [c["id"] for c in data["companies"]] == [org.id]
    assert [j["id"] for j in data["jobs"]] == [post.id]
    assert data["jobs"][0]["organization_name"] == "Aarzo Labs"


def test_job_title_matches_still_work_without_a_company_name_match(
    client, make_user, make_org, auth_headers
):
    viewer = make_user(name="Search Viewer")
    org = make_org(name="Different Company", slug="different-company", is_public=True)
    post = _add_post(org, title="Aarzo Engineer")

    response = client.get(
        "/api/search?q=Aarzo", headers=auth_headers(viewer)
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["companies"] == []
    assert [j["id"] for j in data["jobs"]] == [post.id]


def test_jobs_from_private_pages_stay_out_of_public_search(
    client, make_user, make_org, auth_headers
):
    viewer = make_user(name="Search Viewer")
    org = make_org(name="Hidden Aarzo", slug="hidden-aarzo", is_public=False)
    _add_post(org, title="Secret Engineer")

    response = client.get(
        "/api/search?q=Aarzo", headers=auth_headers(viewer)
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["companies"] == []
    assert data["jobs"] == []


def test_people_results_do_not_expose_private_contact_fields(
    client, make_user, auth_headers
):
    viewer = make_user(name="Search Viewer")
    person = make_user(
        name="Aarzo Person",
        email="aarzo@example.com",
        phone="+15555550123",
        headline="Product designer",
        is_discoverable=True,
    )

    response = client.get(
        "/api/search?q=Aarzo", headers=auth_headers(viewer)
    )

    assert response.status_code == 200
    result = response.get_json()["people"][0]
    assert result["id"] == person.id
    assert "email" not in result
    assert "phone" not in result
    assert "subscription_status" not in result

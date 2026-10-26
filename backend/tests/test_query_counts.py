"""P2-02 regression tests: list/profile serialization stays constant-query.

Each test counts SQL statements for a fixed-size page and asserts a small
bound. If someone adds a lazy per-row access to a serializer, the bound
breaks here instead of in production.
"""

from contextlib import contextmanager

from sqlalchemy import event

from backend.extensions import db


@contextmanager
def count_statements():
    statements = []

    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        statements.append(statement)

    event.listen(db.engine, "before_cursor_execute", before_cursor_execute)
    try:
        yield statements
    finally:
        event.remove(db.engine, "before_cursor_execute", before_cursor_execute)


def _selects(statements):
    return [s for s in statements if s.lstrip().upper().startswith("SELECT")]


def test_posts_list_is_constant_query(make_org, client):
    from backend.models import Post

    org = make_org()
    db.session.add_all([Post(organization_id=org.id, title=f"Job {i}", status="active") for i in range(20)])
    db.session.commit()

    with count_statements() as statements:
        response = client.get("/api/posts?per_page=20")
    assert response.status_code == 200
    assert len(response.get_json()["data"]) == 20
    assert len(_selects(statements)) <= 6, [s[:80] for s in _selects(statements)]


def test_applications_list_is_constant_query(make_org, make_user, auth_headers, client):
    from backend.models import Application, Post

    org = make_org()
    admin = make_user(email="apps-admin@example.com")
    from backend.models import TeamMember
    db.session.add(TeamMember(organization_id=org.id, user_id=admin.id, role="Admin"))
    post = Post(organization_id=org.id, title="Engineer", status="active")
    db.session.add(post)
    db.session.flush()
    candidates = []
    for i in range(5):
        user = make_user(email=f"cand{i}@example.com")
        candidates.append(user)
        db.session.add(Application(user_id=user.id, post_id=post.id))
    db.session.commit()

    with count_statements() as statements:
        response = client.get(
            f"/api/applications?organization_id={org.id}&per_page=20",
            headers=auth_headers(admin),
        )
    assert response.status_code == 200
    assert len(response.get_json()["data"]) == 5
    assert len(_selects(statements)) <= 10, [s[:80] for s in _selects(statements)]


def test_public_profile_is_constant_query(make_user, client):
    from backend.models import (
        Award, Certification, Education, Experience, Project, Publication,
        ShareableProfile, Skill, User,
    )

    user = make_user(email="profile-nplusone@example.com")
    db.session.add_all([
        Experience(user_id=user.id, title="Dev", company="Acme"),
        Education(user_id=user.id, degree="BSc"),
        Skill(user_id=user.id, name="Python"),
        Project(user_id=user.id, name="Site"),
        Certification(user_id=user.id, name="CKA", issuer="CNCF"),
        Publication(user_id=user.id, title="Paper"),
        Award(user_id=user.id, title="Prize", issuer="Org"),
    ])
    profile = ShareableProfile(user_id=user.id, slug="nplusone-pro", is_public=True, is_active=True)
    db.session.add(profile)
    db.session.commit()
    db.session.expire_all()

    with count_statements() as statements:
        response = client.get("/api/public/nplusone-pro")
    assert response.status_code == 200
    data = response.get_json()["data"]["user"]
    assert len(data["experiences"]) == 1
    assert len(_selects(statements)) <= 12, [s[:80] for s in _selects(statements)]

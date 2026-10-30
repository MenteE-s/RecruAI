"""Smoke tests for the application factory and public health surface."""


def test_import_does_not_construct_an_app():
    # Importing the package must be cheap and side-effect free. gunicorn calls
    # create_app(); a module-level app would start Kafka/AI twice per worker.
    import backend.app as app_module

    assert callable(app_module.create_app)


def test_health_is_backed_by_the_database(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    body = response.get_json()
    assert body["status"] == "ok"
    assert body["database"] == "healthy"


def test_unknown_api_route_returns_json_404(client):
    response = client.get("/api/does-not-exist")

    assert response.status_code == 404
    assert response.is_json
    assert response.get_json()["error"] == "Not Found"


def test_protected_route_without_a_token_returns_json_401(client):
    response = client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.is_json
    assert response.get_json()["code"] == "authorization_required"

"""P1-01 regression test: the login limiter returns machine-readable 429s."""


def test_login_returns_json_429_with_retry_after(rate_limit_client):
    payload = {"email": "nobody@example.com", "password": "WrongPass123"}

    for _ in range(10):
        response = rate_limit_client.post("/api/auth/login", json=payload)
        assert response.status_code == 401

    limited = rate_limit_client.post("/api/auth/login", json=payload)

    assert limited.status_code == 429
    assert limited.is_json
    assert limited.get_json()["code"] == "rate_limited"
    assert int(limited.headers["Retry-After"]) >= 1

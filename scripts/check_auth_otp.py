"""Exercise the email-first registration -> OTP -> verify -> login flow.

Uses issue_otp directly so the test does not depend on SMTP being configured.
"""
import os, sys, uuid
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from werkzeug.security import generate_password_hash
from backend.models import EmailOtp
from backend.app import create_app
from backend.extensions import db
from backend.models import User
from backend.utils.otp import issue_otp

app = create_app()
email = f"authsmoke-{uuid.uuid4().hex[:8]}@example.invalid"
password = "AStrongPassword!123"
with app.app_context():
    for u in User.query.filter_by(email=email).all():
        EmailOtp.query.filter_by(user_id=u.id).delete()
        db.session.delete(u)
    db.session.commit()

    client = app.test_client()
    reg = client.post('/api/auth/register', json={"email": email, "password": password, "name": "Auth Smoke"})
    assert reg.status_code == 201, reg.get_json()
    user = User.query.filter_by(email=email).one()

    # Unverified account cannot log in.
    bad_login = client.post('/api/auth/login', json={"email": email, "password": password})
    assert bad_login.status_code == 403, bad_login.get_json()
    assert bad_login.get_json().get("code") == "email_not_verified"

    # Verify with a fresh code (bypass SMTP).
    EmailOtp.query.filter_by(user_id=user.id).delete()
    db.session.commit()
    code, err = issue_otp(user)
    assert code is not None, err
    verify = client.post('/api/auth/otp/verify', json={"email": email, "code": code})
    assert verify.status_code == 200, verify.get_json()
    token = verify.get_json()["access_token"]
    assert verify.get_json()["user"]["email_verified"] is True

    me = client.get('/api/auth/me', headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200, me.get_json()
    assert me.get_json()["user"]["email"] == email

    good_login = client.post('/api/auth/login', json={"email": email, "password": password})
    assert good_login.status_code == 200, good_login.get_json()
    assert good_login.get_json()["access_token"]

    assert client.post('/api/auth/login', json={"email": email, "password": "wrong"}).status_code == 401

    logout = client.post('/api/auth/logout', headers={"Authorization": f"Bearer {token}"})
    assert logout.status_code == 200, logout.get_json()

    EmailOtp.query.filter_by(user_id=user.id).delete()
    db.session.delete(user)
    db.session.commit()
    print("AUTH OTP SMOKE PASSED")

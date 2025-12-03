#!/usr/bin/env python3
"""
Apply for a job on behalf of an existing user by email (no new users/orgs created).
Usage: run from repo root with backend running.
"""
import requests
import sys
from datetime import datetime

BASE_URL = "http://localhost:5000"
API_BASE = f"{BASE_URL}/api"


def find_user_by_email(email):
    r = requests.get(f"{API_BASE}/users")
    if r.status_code != 200:
        print("Error: Unable to list users")
        sys.exit(1)
    users = r.json()
    return next((u for u in users if u.get("email") == email), None)


def apply_for_job(email, post_id=1):
    user = find_user_by_email(email)
    if not user:
        print(f"User with email {email} not found. Aborting.")
        sys.exit(1)

    payload = {
        "user_id": user['id'],
        "post_id": post_id,
        "cover_letter": f"Applying for job {post_id} via automation. {datetime.utcnow().isoformat()}",
        "resume_url": None,
    }

    r = requests.post(f"{API_BASE}/applications", json=payload)
    print('Apply response code:', r.status_code)
    try:
        print(r.json())
    except Exception:
        print(r.text)
    return r


def main():
    email = 'mentee@recruai.com'
    print(f"Applying user {email} to post 1")
    apply_for_job(email, post_id=1)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Schedule a one-off interview for an existing user by email using the backend API.
This script will NOT create any users or orgs; it aborts if the user or org does not exist.
"""
import requests
import sys
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5000"
API_BASE = f"{BASE_URL}/api"


def find_user_by_email(email):
    r = requests.get(f"{API_BASE}/users")
    if r.status_code != 200:
        print("Error: Unable to list users")
        sys.exit(1)
    users = r.json()
    return next((u for u in users if u.get("email") == email), None)


def schedule_for_user(email, minutes_from_now=4):
    user = find_user_by_email(email)
    if not user:
        print(f"User with email {email} not found. Aborting.")
        sys.exit(1)

    org_id = user.get("organization_id")
    if not org_id:
        # Fallback: use org id 1 (MenteE) if present, to avoid creating new orgs.
        print(f"User {email} does not belong to an organization; falling back to organization id 1 (MenteE) for scheduling.")
        org_id = 1

    # Verify org exists
    g = requests.get(f"{API_BASE}/organizations/{org_id}")
    if g.status_code != 200:
        print(f"Organization id {org_id} not found. Aborting.")
        sys.exit(1)

    scheduled_at = (datetime.utcnow() + timedelta(minutes=minutes_from_now)).replace(microsecond=0).isoformat() + 'Z'

    payload = {
        "title": "Scheduled Interview",
        "scheduled_at": scheduled_at,
        "user_id": user['id'],
        "organization_id": org_id,
    }

    print(f"Scheduling interview for {email} at {scheduled_at} (UTC) ...")
    r = requests.post(f"{API_BASE}/interviews", json=payload)
    print("Response code:", r.status_code)
    try:
        print(r.json())
    except Exception:
        print(r.text)
    return r


if __name__ == '__main__':
    email = 'mentee@recruai.com'
    schedule_for_user(email, minutes_from_now=4)

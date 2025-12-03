#!/usr/bin/env python3
"""
Schedule an interview for an existing application: find the user's application for a given post
and create an interview for that user associated with the post and its organization.
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


def get_user_applications(user_id):
    r = requests.get(f"{API_BASE}/applications/user/{user_id}")
    if r.status_code != 200:
        print("Error listing applications for user", r.status_code, r.text)
        return []
    return r.json()


def get_post(post_id):
    r = requests.get(f"{API_BASE}/posts/{post_id}")
    if r.status_code != 200:
        print("Error getting post", post_id, r.status_code, r.text)
        return None
    return r.json()


def schedule_interview_for_application(email, post_id=1, minutes_from_now=4):
    user = find_user_by_email(email)
    if not user:
        print("User not found")
        sys.exit(1)

    apps = get_user_applications(user['id'])
    app = next((a for a in apps if a.get('post_id') == post_id), None)
    if not app:
        print(f"No application found for user {email} on post {post_id}. Aborting.")
        sys.exit(1)

    post = get_post(post_id)
    if not post:
        print("Post not found")
        sys.exit(1)

    org_id = post.get('organization_id')
    if not org_id:
        print("Post has no organization id; aborting")
        sys.exit(1)

    scheduled_at = (datetime.utcnow() + timedelta(minutes=minutes_from_now)).replace(microsecond=0).isoformat() + 'Z'

    payload = {
        "title": f"Interview for job: {post.get('title')}",
        "scheduled_at": scheduled_at,
        "user_id": user['id'],
        "organization_id": org_id,
        "post_id": post_id,
    }

    print(f"Scheduling interview for user {email} on post {post_id} at {scheduled_at} UTC...")
    r = requests.post(f"{API_BASE}/interviews", json=payload)
    print('Response code:', r.status_code)
    try:
        print(r.json())
    except Exception:
        print(r.text)
    return r


if __name__ == '__main__':
    schedule_interview_for_application('mentee@recruai.com', post_id=1, minutes_from_now=4)

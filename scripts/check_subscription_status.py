import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.app import create_app
from backend.models.user import User
from backend.models.organization import Organization

app = create_app()

with app.app_context():
    # Check user with ID 1 (common default)
    user = User.query.get(1)
    if user:
        print(f"User ID: {user.id}")
        print(f"User Email: {user.email}")
        print(f"Subscription Status: {user.subscription_status}")
        print(f"Trial Start: {user.trial_start_date}")
        print(f"Is Trial Active: {user.is_trial_active()}")
        
        if user.organization:
            org = user.organization
            print(f"\nOrganization: {org.name}")
            print(f"Org Subscription Status: {org.subscription_status}")
            print(f"Org Trial Start: {org.trial_start_date}")
            print(f"Org Is Trial Active: {org.is_trial_active()}")
            print(f"Org Interviews Used: {org.interviews_used}")
            print(f"Org Can Schedule: {org.can_schedule_interview()}")
        else:
            print("\nUser has no organization")
    else:
        print("User 1 not found")

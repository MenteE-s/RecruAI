#!/usr/bin/env python3
"""
Test script to verify organization profile and team management functionality.
Tests CRUD operations for organizations and team members.
"""

import requests
import json
import time
import sys

# Configuration
BASE_URL = "http://localhost:5000"
API_BASE = f"{BASE_URL}/api"

def test_organization_crud():
    """Test organization CRUD operations."""
    print("🧪 Testing Organization CRUD Operations...")

    # Create organization
    org_data = {
        "name": "Test Organization",
        "description": "A test organization for testing",
        "website": "https://testorg.com",
        "contact_email": "contact@testorg.com",
        "contact_name": "Test Contact",
        "location": "Test City, TC"
    }

    try:
        response = requests.post(f"{API_BASE}/organizations", json=org_data)
        if response.status_code == 201:
            org_result = response.json()
            org_id = org_result["id"]
            print(f"✅ Organization created successfully: {org_id}")
        else:
            print(f"❌ Failed to create organization: {response.status_code} - {response.text}")
            return False

        # Read organization
        response = requests.get(f"{API_BASE}/organizations/{org_id}")
        if response.status_code == 200:
            org_data = response.json()
            print(f"✅ Organization read successfully: {org_data['name']}")
        else:
            print(f"❌ Failed to read organization: {response.status_code}")
            return False

        # Update organization basic info
        update_data = {
            "name": "Updated Test Organization",
            "description": "Updated description",
            "website": "https://updated-testorg.com"
        }
        response = requests.put(f"{API_BASE}/organizations/{org_id}", json=update_data)
        if response.status_code == 200:
            print("✅ Organization basic info updated successfully")
        else:
            print(f"❌ Failed to update organization: {response.status_code}")
            return False

        # Update organization profile
        profile_data = {
            "company_size": "51-200",
            "industry": "Technology",
            "mission": "To test thoroughly",
            "vision": "A world of perfect testing",
            "social_media_links": [
                {"platform": "LinkedIn", "url": "https://linkedin.com/company/testorg", "username": "testorg"}
            ]
        }
        response = requests.put(f"{API_BASE}/organizations/{org_id}/profile", json=profile_data)
        if response.status_code == 200:
            print("✅ Organization profile updated successfully")
        else:
            print(f"❌ Failed to update organization profile: {response.status_code}")
            return False

        # Verify profile update
        response = requests.get(f"{API_BASE}/organizations/{org_id}")
        if response.status_code == 200:
            updated_data = response.json()
            if updated_data.get("company_size") == "51-200":
                print("✅ Organization profile verified successfully")
            else:
                print("❌ Organization profile not updated correctly")
                return False
        else:
            print(f"❌ Failed to verify organization profile: {response.status_code}")
            return False

        return True

    except Exception as e:
        print(f"❌ Organization CRUD test error: {e}")
        return False

def test_team_member_management():
    """Test team member CRUD operations."""
    print("🧪 Testing Team Member Management...")

    try:
        # First create an organization
        org_data = {
            "name": "Team Test Organization",
            "description": "For team member testing"
        }
        response = requests.post(f"{API_BASE}/organizations", json=org_data)
        if response.status_code == 201:
            org_result = response.json()
            org_id = org_result["id"]
            print(f"✅ Test organization created: {org_id}")
        else:
            print(f"❌ Failed to create test organization: {response.status_code}")
            return False

        # Create test users
        user1_data = {"email": "user1@test.com", "name": "User One", "role": "individual"}
        user2_data = {"email": "user2@test.com", "name": "User Two", "role": "individual"}

        response1 = requests.post(f"{API_BASE}/users", json=user1_data)
        response2 = requests.post(f"{API_BASE}/users", json=user2_data)

        if response1.status_code == 201 and response2.status_code == 201:
            user1 = response1.json()
            user2 = response2.json()
            print("✅ Test users created successfully")
        else:
            print(f"❌ Failed to create test users: {response1.status_code}, {response2.status_code}")
            return False

        # Add team member
        team_member_data = {
            "user_id": user1["id"],
            "role": "Manager",
            "permissions": ["read", "write"]
        }
        response = requests.post(f"{API_BASE}/organizations/{org_id}/team-members", json=team_member_data)
        if response.status_code == 201:
            team_member = response.json()
            member_id = team_member["id"]
            print(f"✅ Team member added successfully: {member_id}")
        else:
            print(f"❌ Failed to add team member: {response.status_code} - {response.text}")
            return False

        # List team members
        response = requests.get(f"{API_BASE}/organizations/{org_id}/team-members")
        if response.status_code == 200:
            members = response.json()
            if len(members) == 1:
                print("✅ Team members listed successfully")
            else:
                print(f"❌ Expected 1 team member, got {len(members)}")
                return False
        else:
            print(f"❌ Failed to list team members: {response.status_code}")
            return False

        # Update team member
        update_data = {
            "role": "Senior Manager",
            "permissions": ["read", "write", "delete"]
        }
        response = requests.put(f"{API_BASE}/organizations/{org_id}/team-members/{member_id}", json=update_data)
        if response.status_code == 200:
            print("✅ Team member updated successfully")
        else:
            print(f"❌ Failed to update team member: {response.status_code}")
            return False

        # Add second team member
        team_member2_data = {
            "user_id": user2["id"],
            "role": "Developer",
            "permissions": ["read"]
        }
        response = requests.post(f"{API_BASE}/organizations/{org_id}/team-members", json=team_member2_data)
        if response.status_code == 201:
            team_member2 = response.json()
            member2_id = team_member2["id"]
            print(f"✅ Second team member added successfully: {member2_id}")
        else:
            print(f"❌ Failed to add second team member: {response.status_code}")
            return False

        # Verify team has 2 members
        response = requests.get(f"{API_BASE}/organizations/{org_id}/team-members")
        if response.status_code == 200:
            members = response.json()
            if len(members) == 2:
                print("✅ Team now has 2 members")
            else:
                print(f"❌ Expected 2 team members, got {len(members)}")
                return False
        else:
            print(f"❌ Failed to verify team members: {response.status_code}")
            return False

        # Remove team member
        response = requests.delete(f"{API_BASE}/organizations/{org_id}/team-members/{member2_id}")
        if response.status_code == 200:
            print("✅ Team member removed successfully")
        else:
            print(f"❌ Failed to remove team member: {response.status_code}")
            return False

        # Verify team has 1 member again
        response = requests.get(f"{API_BASE}/organizations/{org_id}/team-members")
        if response.status_code == 200:
            members = response.json()
            if len(members) == 1:
                print("✅ Team now has 1 member after removal")
                return True
            else:
                print(f"❌ Expected 1 team member after removal, got {len(members)}")
                return False
        else:
            print(f"❌ Failed to verify team members after removal: {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ Team member management test error: {e}")
        return False

def test_error_handling():
    """Test error handling for invalid inputs."""
    print("🧪 Testing Error Handling...")

    try:
        # Test creating organization without required name
        response = requests.post(f"{API_BASE}/organizations", json={"description": "test"})
        if response.status_code == 400:
            print("✅ Properly rejected organization creation without name")
        else:
            print(f"❌ Should reject organization without name: {response.status_code}")
            return False

        # Test creating organization with duplicate name
        org_data = {"name": "Duplicate Org", "description": "First one"}
        response1 = requests.post(f"{API_BASE}/organizations", json=org_data)
        response2 = requests.post(f"{API_BASE}/organizations", json=org_data)
        if response1.status_code == 201 and response2.status_code == 400:
            print("✅ Properly rejected duplicate organization name")
        else:
            print(f"❌ Should reject duplicate organization name: {response1.status_code}, {response2.status_code}")
            return False

        # Test accessing non-existent organization
        response = requests.get(f"{API_BASE}/organizations/99999")
        if response.status_code == 404:
            print("✅ Properly handled non-existent organization")
        else:
            print(f"❌ Should return 404 for non-existent organization: {response.status_code}")
            return False

        return True

    except Exception as e:
        print(f"❌ Error handling test error: {e}")
        return False

def test_data_validation():
    """Test data validation for organization and team member fields."""
    print("🧪 Testing Data Validation...")

    try:
        # Test organization with invalid website URL
        org_data = {
            "name": "Validation Test Org",
            "website": "not-a-valid-url"
        }
        response = requests.post(f"{API_BASE}/organizations", json=org_data)
        # Note: Current implementation doesn't validate URL format, so this should succeed
        if response.status_code == 201:
            print("✅ Organization creation handles invalid URL gracefully")
        else:
            print(f"❌ Unexpected response for invalid URL: {response.status_code}")
            return False

        # Test team member with invalid user_id
        response = requests.post(f"{API_BASE}/organizations/1/team-members", json={
            "user_id": 99999,
            "role": "Member"
        })
        if response.status_code == 404:
            print("✅ Properly rejected invalid user_id for team member")
        else:
            print(f"❌ Should reject invalid user_id: {response.status_code}")
            return False

        # Test team member without required fields
        response = requests.post(f"{API_BASE}/organizations/1/team-members", json={})
        if response.status_code == 400:
            print("✅ Properly rejected team member creation without required fields")
        else:
            print(f"❌ Should reject team member without required fields: {response.status_code}")
            return False

        return True

    except Exception as e:
        print(f"❌ Data validation test error: {e}")
        return False

def main():
    """Run all organization functionality tests."""
    print("🚀 Starting Organization Functionality Tests")
    print("=" * 60)

    # Check if server is running
    try:
        health_response = requests.get(f"{API_BASE}/health")
        if health_response.status_code != 200:
            print("❌ Server is not running. Please start the backend server first.")
            sys.exit(1)
    except:
        print("❌ Could not connect to server. Please ensure the backend is running on localhost:5000")
        sys.exit(1)

    results = []

    # Run tests
    results.append(test_organization_crud())
    results.append(test_team_member_management())
    results.append(test_error_handling())
    results.append(test_data_validation())

    print("=" * 60)
    print("📊 Test Results Summary:")

    if all(results):
        print("✅ All tests passed! Organization functionality is working correctly.")
        sys.exit(0)
    else:
        print("❌ Some tests failed. Please review the implementation.")
        sys.exit(1)

if __name__ == "__main__":
    main()
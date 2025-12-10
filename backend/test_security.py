#!/usr/bin/env python3
"""
Security Test Script for RecruAI
Tests the security enhancements including password validation, account lockout, and input sanitization.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask
from utils.security import (
    validate_password_strength,
    hash_password,
    verify_password,
    sanitize_input,
    validate_email,
    generate_secure_token,
    check_file_security
)

# Create a test Flask app for context
app = Flask(__name__)
app.config.update({
    'PASSWORD_MIN_LENGTH': 8,
    'PASSWORD_REQUIRE_UPPERCASE': True,
    'PASSWORD_REQUIRE_LOWERCASE': True,
    'PASSWORD_REQUIRE_DIGITS': True,
    'PASSWORD_REQUIRE_SPECIAL': False,
    'MAX_FILE_SIZE': 5 * 1024 * 1024,  # 5MB
    'ALLOWED_FILE_TYPES': ['png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx']
})

def test_password_validation():
    """Test password strength validation"""
    print("Testing password validation...")

    with app.app_context():
        # Test weak passwords
        weak_passwords = [
            "123456",
            "password",
            "abc123",
            "short"
        ]

        for pwd in weak_passwords:
            is_valid, error = validate_password_strength(pwd)
            assert not is_valid, f"Password '{pwd}' should be invalid"
            print(f"✓ Correctly rejected weak password: {pwd}")

        # Test strong passwords
        strong_passwords = [
            "StrongPass123",
            "MySecurePassword!2024",
            "Complex123!@#"
        ]

        for pwd in strong_passwords:
            is_valid, error = validate_password_strength(pwd)
            assert is_valid, f"Password '{pwd}' should be valid: {error}"
            print(f"✓ Correctly accepted strong password: {pwd}")

        print("✓ Password validation tests passed\n")

def test_password_hashing():
    """Test password hashing and verification"""
    print("\nTesting password hashing...")

    password = "TestPassword123!"
    hashed = hash_password(password)

    assert verify_password(hashed, password), "Password verification should succeed"
    assert not verify_password(hashed, "WrongPassword123!"), "Wrong password should fail"

    print("✓ Password hashing and verification working correctly")

def test_input_sanitization():
    """Test input sanitization"""
    print("\nTesting input sanitization...")

    malicious_input = "<script>alert('xss')</script>Hello World"
    sanitized = sanitize_input(malicious_input)

    assert "<script>" not in sanitized, "XSS tags should be removed"
    assert "Hello World" in sanitized, "Valid content should be preserved"

    print("✓ Input sanitization working correctly")

def test_email_validation():
    """Test email format validation"""
    print("\nTesting email validation...")

    valid_emails = [
        "user@example.com",
        "test.email+tag@domain.co.uk",
        "user123@test-domain.com"
    ]

    invalid_emails = [
        "invalid-email",
        "@example.com",
        "user@",
        "user.example.com"
    ]

    for email in valid_emails:
        assert validate_email(email), f"Email '{email}' should be valid"

    for email in invalid_emails:
        assert not validate_email(email), f"Email '{email}' should be invalid"

    print("✓ Email validation working correctly")

def test_secure_token_generation():
    """Test secure token generation"""
    print("\nTesting secure token generation...")

    token1 = generate_secure_token()
    token2 = generate_secure_token()

    assert len(token1) == 64, "Token should be 64 characters long"
    assert token1 != token2, "Tokens should be unique"
    assert all(c in '0123456789abcdef' for c in token1), "Token should be hexadecimal"

    print("✓ Secure token generation working correctly")

def test_file_upload_validation():
    """Test file upload validation"""
    print("\nTesting file upload validation...")

    with app.app_context():
        # Test valid file
        valid_result, _ = check_file_security("document.pdf", 1024)
        assert valid_result, "Valid PDF should pass validation"

        # Test invalid file type
        invalid_result, _ = check_file_security("script.exe", 1024)
        assert not invalid_result, "EXE file should be rejected"

        # Test oversized file
        large_content = b"x" * (11 * 1024 * 1024)  # 11MB
        oversized_result, _ = check_file_security("large.pdf", len(large_content))
        assert not oversized_result, "Oversized file should be rejected"

        print("✓ File upload validation working correctly")

def main():
    """Run all security tests"""
    print("Running RecruAI Security Tests")
    print("=" * 40)

    try:
        test_password_validation()
        test_password_hashing()
        test_input_sanitization()
        test_email_validation()
        test_secure_token_generation()
        test_file_upload_validation()

        print("\n" + "=" * 40)
        print("✅ All security tests passed!")

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
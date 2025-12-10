"""
Security utilities for RecruAI backend
"""
import re
import bcrypt
from datetime import datetime, timedelta
from flask import current_app
from werkzeug.security import generate_password_hash, check_password_hash
import logging

# Configure security logger
security_logger = logging.getLogger('security')
security_logger.setLevel(logging.INFO)
if not security_logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    security_logger.addHandler(handler)

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength based on configured requirements
    Returns (is_valid, error_message)
    """
    config = current_app.config

    if len(password) < config.get('PASSWORD_MIN_LENGTH', 8):
        return False, f"Password must be at least {config.get('PASSWORD_MIN_LENGTH', 8)} characters long"

    if config.get('PASSWORD_REQUIRE_UPPERCASE', True) and not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"

    if config.get('PASSWORD_REQUIRE_LOWERCASE', True) and not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"

    if config.get('PASSWORD_REQUIRE_DIGITS', True) and not re.search(r'\d', password):
        return False, "Password must contain at least one digit"

    if config.get('PASSWORD_REQUIRE_SPECIAL', False) and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"

    return True, ""

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt for enhanced security
    """
    try:
        # Use bcrypt for better security than werkzeug's default
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    except ImportError:
        # Fallback to werkzeug if bcrypt not available
        security_logger.warning("bcrypt not available, falling back to werkzeug security")
        return generate_password_hash(password)

def verify_password(password_hash: str, password: str) -> bool:
    """
    Verify a password against its hash
    """
    try:
        # Try bcrypt first
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    except (ImportError, ValueError):
        # Fallback to werkzeug
        return check_password_hash(password_hash, password)

def sanitize_input(text: str, max_length: int = 1000) -> str:
    """
    Sanitize user input by removing potentially dangerous characters and HTML tags
    """
    if not text:
        return ""

    # Remove null bytes and other control characters
    text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)

    # Remove HTML tags to prevent XSS
    text = re.sub(r'<[^>]+>', '', text)

    # Limit length
    if len(text) > max_length:
        text = text[:max_length]

    return text.strip()

def validate_email(email: str) -> bool:
    """
    Validate email format
    """
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(email_regex, email)) and len(email) <= 254

def log_security_event(event_type: str, user_id: str = None, ip_address: str = None, details: dict = None):
    """
    Log security-related events
    """
    if not current_app.config.get('ENABLE_AUDIT_LOG', False):
        return

    log_data = {
        'event_type': event_type,
        'user_id': user_id,
        'ip_address': ip_address,
        'timestamp': datetime.utcnow().isoformat(),
        'details': details or {}
    }

    security_logger.info(f"SECURITY_EVENT: {log_data}")

def check_file_security(filename: str, file_size: int) -> tuple[bool, str]:
    """
    Check file upload security
    """
    config = current_app.config

    # Check file size
    if file_size > config.get('MAX_FILE_SIZE', 5 * 1024 * 1024):  # 5MB default
        return False, f"File too large. Maximum size is {config.get('MAX_FILE_SIZE', 5 * 1024 * 1024) // (1024 * 1024)}MB"

    # Check file extension
    if '.' not in filename:
        return False, "File must have an extension"

    extension = filename.lower().split('.')[-1]
    allowed_types = config.get('ALLOWED_FILE_TYPES', ['png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx'])

    if extension not in allowed_types:
        return False, f"File type not allowed. Allowed types: {', '.join(allowed_types)}"

    # Check for path traversal attempts
    if '..' in filename or '/' in filename or '\\' in filename:
        return False, "Invalid filename"

    return True, ""

def generate_secure_token(length: int = 64) -> str:
    """
    Generate a cryptographically secure random hexadecimal token
    """
    import secrets

    return secrets.token_hex(length // 2)  # token_hex generates 2 chars per byte

def validate_request_size(request_data: dict, max_fields: int = 50, max_field_length: int = 10000) -> tuple[bool, str]:
    """
    Validate request data size and structure
    """
    if len(request_data) > max_fields:
        return False, f"Too many fields. Maximum allowed: {max_fields}"

    for key, value in request_data.items():
        if isinstance(value, str) and len(value) > max_field_length:
            return False, f"Field '{key}' too long. Maximum length: {max_field_length}"

    return True, ""
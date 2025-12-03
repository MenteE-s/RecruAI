"""
Timezone utilities for consistent datetime handling across the application.

All datetimes are stored in UTC in the database.
Users and organizations can set their preferred timezone for display purposes.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional
import pytz


# Common timezones grouped by region for UI selection
TIMEZONE_CHOICES = {
    "Asia": [
        ("Asia/Karachi", "Pakistan Standard Time (PKT, UTC+5)"),
        ("Asia/Kolkata", "India Standard Time (IST, UTC+5:30)"),
        ("Asia/Dubai", "Gulf Standard Time (GST, UTC+4)"),
        ("Asia/Singapore", "Singapore Time (SGT, UTC+8)"),
        ("Asia/Tokyo", "Japan Standard Time (JST, UTC+9)"),
        ("Asia/Shanghai", "China Standard Time (CST, UTC+8)"),
        ("Asia/Hong_Kong", "Hong Kong Time (HKT, UTC+8)"),
        ("Asia/Seoul", "Korea Standard Time (KST, UTC+9)"),
        ("Asia/Bangkok", "Indochina Time (ICT, UTC+7)"),
        ("Asia/Jakarta", "Western Indonesia Time (WIB, UTC+7)"),
    ],
    "Europe": [
        ("Europe/London", "Greenwich Mean Time (GMT, UTC+0)"),
        ("Europe/Paris", "Central European Time (CET, UTC+1)"),
        ("Europe/Berlin", "Central European Time (CET, UTC+1)"),
        ("Europe/Moscow", "Moscow Standard Time (MSK, UTC+3)"),
        ("Europe/Istanbul", "Turkey Time (TRT, UTC+3)"),
        ("Europe/Amsterdam", "Central European Time (CET, UTC+1)"),
    ],
    "Americas": [
        ("America/New_York", "Eastern Time (ET, UTC-5)"),
        ("America/Chicago", "Central Time (CT, UTC-6)"),
        ("America/Denver", "Mountain Time (MT, UTC-7)"),
        ("America/Los_Angeles", "Pacific Time (PT, UTC-8)"),
        ("America/Toronto", "Eastern Time (ET, UTC-5)"),
        ("America/Vancouver", "Pacific Time (PT, UTC-8)"),
        ("America/Sao_Paulo", "Brasilia Time (BRT, UTC-3)"),
        ("America/Mexico_City", "Central Time (CT, UTC-6)"),
    ],
    "Pacific": [
        ("Pacific/Auckland", "New Zealand Standard Time (NZST, UTC+12)"),
        ("Australia/Sydney", "Australian Eastern Time (AET, UTC+10)"),
        ("Australia/Melbourne", "Australian Eastern Time (AET, UTC+10)"),
        ("Australia/Perth", "Australian Western Time (AWST, UTC+8)"),
    ],
    "Other": [
        ("UTC", "Coordinated Universal Time (UTC)"),
        ("Africa/Cairo", "Eastern European Time (EET, UTC+2)"),
        ("Africa/Lagos", "West Africa Time (WAT, UTC+1)"),
        ("Africa/Johannesburg", "South Africa Standard Time (SAST, UTC+2)"),
    ],
}

# Flat list for validation
ALL_TIMEZONES = []
for region_tzs in TIMEZONE_CHOICES.values():
    ALL_TIMEZONES.extend([tz[0] for tz in region_tzs])


def get_timezone_list():
    """Return flat list of timezone choices for API response."""
    result = []
    for region, timezones in TIMEZONE_CHOICES.items():
        for tz_id, tz_label in timezones:
            result.append({
                "id": tz_id,
                "label": tz_label,
                "region": region,
            })
    return result


def is_valid_timezone(tz_str: str) -> bool:
    """Check if a timezone string is valid."""
    try:
        pytz.timezone(tz_str)
        return True
    except pytz.UnknownTimeZoneError:
        return False


def utc_now() -> datetime:
    """Get current UTC datetime (timezone-aware)."""
    return datetime.now(timezone.utc)


def to_utc(dt: datetime, from_tz: str = "UTC") -> datetime:
    """
    Convert a datetime from a specific timezone to UTC.
    
    Args:
        dt: The datetime to convert (can be naive or aware)
        from_tz: The source timezone (e.g., 'Asia/Karachi')
    
    Returns:
        UTC datetime (naive, for database storage)
    """
    if dt is None:
        return None
    
    try:
        source_tz = pytz.timezone(from_tz)
    except pytz.UnknownTimeZoneError:
        source_tz = pytz.UTC
    
    # If datetime is naive, localize it to the source timezone
    if dt.tzinfo is None:
        dt = source_tz.localize(dt)
    else:
        # Convert to source timezone first if it has different tzinfo
        dt = dt.astimezone(source_tz)
    
    # Convert to UTC and remove tzinfo for database storage
    utc_dt = dt.astimezone(pytz.UTC)
    return utc_dt.replace(tzinfo=None)


def from_utc(dt: datetime, to_tz: str = "UTC") -> datetime:
    """
    Convert a UTC datetime to a specific timezone.
    
    Args:
        dt: The UTC datetime (can be naive or aware)
        to_tz: The target timezone (e.g., 'Asia/Karachi')
    
    Returns:
        Timezone-aware datetime in the target timezone
    """
    if dt is None:
        return None
    
    try:
        target_tz = pytz.timezone(to_tz)
    except pytz.UnknownTimeZoneError:
        target_tz = pytz.UTC
    
    # Assume naive datetime is UTC
    if dt.tzinfo is None:
        dt = pytz.UTC.localize(dt)
    
    return dt.astimezone(target_tz)


def format_datetime(dt: datetime, tz: str = "UTC", format_str: str = "%Y-%m-%d %H:%M %Z") -> str:
    """
    Format a datetime for display in a specific timezone.
    
    Args:
        dt: The datetime (assumed UTC if naive)
        tz: The target timezone for display
        format_str: strftime format string
    
    Returns:
        Formatted datetime string
    """
    if dt is None:
        return ""
    
    local_dt = from_utc(dt, tz)
    return local_dt.strftime(format_str)


def get_user_timezone(user) -> str:
    """Get the timezone for a user, with fallback to UTC."""
    if user and hasattr(user, 'timezone') and user.timezone:
        return user.timezone
    return "UTC"


def get_organization_timezone(org) -> str:
    """Get the timezone for an organization, with fallback to UTC."""
    if org and hasattr(org, 'timezone') and org.timezone:
        return org.timezone
    return "UTC"


def datetime_to_user_local(dt: datetime, user) -> datetime:
    """Convert UTC datetime to user's local timezone."""
    tz = get_user_timezone(user)
    return from_utc(dt, tz)


def datetime_to_org_local(dt: datetime, org) -> datetime:
    """Convert UTC datetime to organization's local timezone."""
    tz = get_organization_timezone(org)
    return from_utc(dt, tz)


def get_current_time_info(tz: str = "UTC") -> dict:
    """
    Get comprehensive current time information for a timezone.
    Useful for debugging and display purposes.
    """
    now_utc = utc_now()
    now_local = from_utc(now_utc, tz)
    
    return {
        "utc": now_utc.isoformat(),
        "local": now_local.isoformat(),
        "timezone": tz,
        "offset": now_local.strftime("%z"),
        "formatted": now_local.strftime("%B %d, %Y at %I:%M %p %Z"),
    }

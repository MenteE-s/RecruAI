/**
 * Timezone utilities for consistent datetime handling across the frontend.
 *
 * All datetimes from the backend are in UTC.
 * Users can set their preferred timezone for display purposes.
 */

// Store user's timezone preference
const TIMEZONE_STORAGE_KEY = "userTimezone";

/**
 * Get the user's configured timezone from localStorage or detect from browser.
 */
export function getUserTimezone() {
  const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
  if (stored) {
    return stored;
  }
  // Fall back to browser's detected timezone
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Set the user's timezone preference.
 */
export function setUserTimezone(timezone) {
  localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
}

/**
 * Format a UTC datetime string/timestamp for display in user's timezone.
 *
 * @param {string|number} utcDateTime - ISO string or milliseconds timestamp from backend
 * @param {object} options - Intl.DateTimeFormat options
 * @param {string} timezone - Override timezone (optional, defaults to user's timezone)
 */
export function formatDateTime(utcDateTime, options = {}, timezone = null) {
  if (!utcDateTime) return "";

  const tz = timezone || getUserTimezone();

  // Handle both ISO strings and millisecond timestamps
  let date;
  if (typeof utcDateTime === "number") {
    date = new Date(utcDateTime);
  } else {
    date = new Date(utcDateTime);
  }

  if (isNaN(date.getTime())) {
    console.warn("Invalid date:", utcDateTime);
    return "";
  }

  const defaultOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
    timeZoneName: "short",
    ...options,
  };

  try {
    return new Intl.DateTimeFormat("en-US", defaultOptions).format(date);
  } catch (e) {
    console.warn("Timezone formatting error:", e);
    // Fall back to UTC if timezone is invalid
    return new Intl.DateTimeFormat("en-US", {
      ...defaultOptions,
      timeZone: "UTC",
    }).format(date);
  }
}

/**
 * Format date only (no time).
 */
export function formatDate(utcDateTime, timezone = null) {
  return formatDateTime(
    utcDateTime,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: undefined,
      minute: undefined,
      timeZoneName: undefined,
    },
    timezone
  );
}

/**
 * Format time only (no date).
 */
export function formatTime(utcDateTime, timezone = null) {
  return formatDateTime(
    utcDateTime,
    {
      year: undefined,
      month: undefined,
      day: undefined,
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    },
    timezone
  );
}

/**
 * Format datetime in a compact form for lists/tables.
 */
export function formatDateTimeCompact(utcDateTime, timezone = null) {
  return formatDateTime(
    utcDateTime,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: undefined,
    },
    timezone
  );
}

/**
 * Get relative time string (e.g., "in 2 hours", "3 days ago").
 */
export function getRelativeTime(utcDateTime) {
  if (!utcDateTime) return "";

  const date =
    typeof utcDateTime === "number"
      ? new Date(utcDateTime)
      : new Date(utcDateTime);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (Math.abs(diffMins) < 1) {
    return "just now";
  } else if (Math.abs(diffMins) < 60) {
    return diffMins > 0
      ? `in ${diffMins} minutes`
      : `${Math.abs(diffMins)} minutes ago`;
  } else if (Math.abs(diffHours) < 24) {
    return diffHours > 0
      ? `in ${diffHours} hours`
      : `${Math.abs(diffHours)} hours ago`;
  } else if (Math.abs(diffDays) < 7) {
    return diffDays > 0
      ? `in ${diffDays} days`
      : `${Math.abs(diffDays)} days ago`;
  } else {
    return formatDateTimeCompact(utcDateTime);
  }
}

/**
 * Convert a local datetime to UTC for sending to backend.
 *
 * @param {Date} localDate - Date object in user's local time
 * @param {string} timezone - The timezone the date was entered in (optional)
 * @returns {string} ISO string in UTC
 */
export function toUTC(localDate, timezone = null) {
  if (!localDate) return null;

  // If the date is already a Date object, just return ISO string
  // JavaScript Date objects are always in UTC internally
  if (localDate instanceof Date) {
    return localDate.toISOString();
  }

  // If it's a string, parse and return
  const date = new Date(localDate);
  if (isNaN(date.getTime())) {
    console.warn("Invalid date for UTC conversion:", localDate);
    return null;
  }

  return date.toISOString();
}

/**
 * Get current time in user's timezone as a formatted string.
 */
export function getCurrentTimeFormatted(timezone = null) {
  return formatDateTime(new Date().toISOString(), {}, timezone);
}

/**
 * Check if a datetime is in the past.
 */
export function isPast(utcDateTime) {
  if (!utcDateTime) return false;
  const date =
    typeof utcDateTime === "number"
      ? new Date(utcDateTime)
      : new Date(utcDateTime);
  return date.getTime() < Date.now();
}

/**
 * Check if a datetime is in the future.
 */
export function isFuture(utcDateTime) {
  if (!utcDateTime) return false;
  const date =
    typeof utcDateTime === "number"
      ? new Date(utcDateTime)
      : new Date(utcDateTime);
  return date.getTime() > Date.now();
}

/**
 * Check if a datetime is within the next N hours.
 */
export function isWithinHours(utcDateTime, hours) {
  if (!utcDateTime) return false;
  const date =
    typeof utcDateTime === "number"
      ? new Date(utcDateTime)
      : new Date(utcDateTime);
  const now = Date.now();
  const futureLimit = now + hours * 3600000;
  return date.getTime() > now && date.getTime() <= futureLimit;
}

/**
 * Get timezone display info for debugging.
 */
export function getTimezoneInfo(timezone = null) {
  const tz = timezone || getUserTimezone();
  const now = new Date();

  // Get offset
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "longOffset",
  });

  const parts = formatter.formatToParts(now);
  const offsetPart = parts.find((p) => p.type === "timeZoneName");

  return {
    timezone: tz,
    currentTime: formatDateTime(now.toISOString(), {}, tz),
    offset: offsetPart ? offsetPart.value : "Unknown",
  };
}

const timezoneUtils = {
  getUserTimezone,
  setUserTimezone,
  formatDateTime,
  formatDate,
  formatTime,
  formatDateTimeCompact,
  getRelativeTime,
  toUTC,
  getCurrentTimeFormatted,
  isPast,
  isFuture,
  isWithinHours,
  getTimezoneInfo,
};

export default timezoneUtils;

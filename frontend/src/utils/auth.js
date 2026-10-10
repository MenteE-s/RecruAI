// helper utilities for token verification and auth state

// Get the backend URL for API calls and uploaded files - reads from frontend/.env REACT_APP_API_BASE_URL (no hardcoded port)
export function getBackendUrl() {
  const envUrl = process.env.REACT_APP_API_BASE_URL;
  if (envUrl) return envUrl;

  // Fallback: same-origin via nginx in production, otherwise require .env
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return window.location.origin;
  }
  console.error("REACT_APP_API_BASE_URL not set - define it in frontend/.env (e.g. http://localhost:8000)");
  return window.location.origin;
}

// Helper to get headers with Authorization if token exists
export function getAuthHeaders(additionalHeaders = {}) {
  const headers = { ...additionalHeaders };
  const token = localStorage.getItem("access_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Override global fetch to automatically handle authentication.
// Scoped to our own backend origin only: never attach credentials or bearer
// tokens to third-party URLs that merely contain "/api/".
const originalFetch = window.fetch;
window.fetch = function (url, options = {}) {
  if (typeof url === "string" && url.startsWith(getBackendUrl())) {
    // Always include credentials for cookie-based auth
    options.credentials = "include";
    // Always add Authorization header if token exists
    const token = localStorage.getItem("access_token");
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }
  return originalFetch.call(this, url, options);
};

// Keep the original functions for manual use if needed
export function getAuthenticatedFetch(url, options = {}) {
  return fetch(url, options); // Now uses the overridden fetch
}

// Get full URL for uploaded files
export function getUploadUrl(relativePath) {
  if (!relativePath) return "";
  const backendUrl = getBackendUrl();
  // Remove leading slash if present
  const cleanPath = relativePath.startsWith("/")
    ? relativePath.substring(1)
    : relativePath;
  return `${backendUrl}/${cleanPath}`;
}

// Short-TTL in-memory cache for /api/auth/me to dedupe the 3-4x per-navigation
// waterfall (AuthVerifier + ProtectedRoute + page-level fetch). Single-flight
// so concurrent mounters share one network request. Backend also caches in Redis.
const AUTH_ME_TTL_MS = 90 * 1000;
let cachedMeUser = null;
let cachedMeAt = 0;
let inFlightMe = null;

function isMeCacheFresh() {
  return cachedMeUser && Date.now() - cachedMeAt < AUTH_ME_TTL_MS;
}

function storeMeUser(user) {
  cachedMeUser = user || null;
  cachedMeAt = Date.now();
  try {
    if (user) {
      localStorage.setItem("isAuthenticated", "true");
      if (user.role) localStorage.setItem("authRole", user.role);
      if (user.plan) localStorage.setItem("authPlan", user.plan);
    }
  } catch {
    // ignore storage errors
  }
}

function clearStoredAuth() {
  try {
    localStorage.removeItem("access_token");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("authRole");
    localStorage.removeItem("authPlan");
  } catch {
    // ignore
  }
}

async function fetchMeFromServer() {
  const res = await fetch(`${getBackendUrl()}/api/auth/me`, {
    method: "GET",
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (res.status === 401 || res.status === 403) {
    // Auth actually rejected — clear stale local state.
    clearStoredAuth();
    storeMeUser(null);
    cachedMeAt = Date.now();
    return null;
  }
  if (!res.ok) {
    // 404/5xx: do NOT log the user out; keep previous cache if any.
    if (cachedMeUser) return cachedMeUser;
    return null;
  }
  const data = await res.json();
  if (data && data.user) {
    storeMeUser(data.user);
    return data.user;
  }
  return cachedMeUser || null;
}

export async function verifyTokenWithServer({ forceRefresh = false } = {}) {
  try {
    if (typeof window === "undefined") return null;
    if (!forceRefresh && isMeCacheFresh()) return cachedMeUser;
    if (!forceRefresh && inFlightMe) return inFlightMe;
    // No token at all: skip network entirely.
    try {
      if (!localStorage.getItem("access_token")) {
        // Cookie-only sessions may have no localStorage token; still allow
        // one check per page load, but dedupe via in-flight + TTL.
        if (isMeCacheFresh()) return cachedMeUser;
      }
    } catch {
      // ignore
    }
    inFlightMe = fetchMeFromServer();
    const user = await inFlightMe;
    return user;
  } catch (err) {
    // Transient network failure: keep the user signed in with stale cache.
    if (cachedMeUser) return cachedMeUser;
    return null;
  } finally {
    inFlightMe = null;
  }
}

export function clearLocalAuth() {
  clearStoredAuth();
  cachedMeUser = null;
  cachedMeAt = 0;
  inFlightMe = null;
}

/** Current signed-in user via /api/auth/me (short-TTL cached). Never hardcode ids. */
export async function getCurrentUser({ forceRefresh = false } = {}) {
  return verifyTokenWithServer({ forceRefresh });
}

/** Current user id, or null when signed out. */
export async function getCurrentUserId() {
  const user = await getCurrentUser();
  return user?.id || null;
}

/**
 * Canonical URL for a company page.
 *
 * Prefers the readable slug (/org/mentee-ai). Falls back to the legacy
 * id form, which is a real redirect rather than a dead link, so a payload
 * that somehow lacks a slug still lands on the right page instead of
 * rendering /org/3.
 *
 * Accepts the org object, or a bare id for the few callers that only have one.
 */
export function orgPath(org) {
  if (org && typeof org === "object") {
    if (org.slug) return `/org/${org.slug}`;
    if (org.id) return `/org/profile/${org.id}`;
    return "/org/browse";
  }
  if (org) return `/org/profile/${org}`;
  return "/org/browse";
}

/**
 * Canonical URL for a job post.
 *
 * Prefers the title slug (/in/jobs/software-engineer). Falls back to the id
 * form, which the API resolves too — GET /api/posts/by-slug/<slug> tries the
 * slug then treats the segment as a numeric id — so a payload missing a slug
 * still lands on the right job instead of rendering /in/jobs/undefined.
 */
export function postPath(post) {
  if (post && typeof post === "object") {
    const handle = post.slug || post.id;
    if (handle) return `/in/jobs/${handle}`;
    return "/in/jobs";
  }
  if (post) return `/in/jobs/${post}`;
  return "/in/jobs";
}

/**
 * Canonical URL for a person's public profile (/in/syab).
 *
 * Universal search returns people from any organization, so results
 * must point at the public profile — the org-scoped /org/user/<id>
 * page only resolves for members of your own organization and shows
 * "User not found in your organization" for everyone else.
 *
 * Falls back to the id form, which the /api/in/<slug> endpoint also
 * resolves numerically, so a payload without a slug still lands on
 * the right person instead of a dead link.
 */
export function personPath(person) {
  if (person && typeof person === "object") {
    const handle = person.profile_slug || person.id;
    if (handle) return `/in/${handle}`;
    return "/in";
  }
  if (person) return `/in/${person}`;
  return "/in";
}

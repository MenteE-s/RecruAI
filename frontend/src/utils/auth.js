// helper utilities for token verification and auth state
//
// Access tokens are short-lived JWTs held in this module's memory only. The
// refresh token is an opaque HttpOnly cookie set by the backend, so no token is
// readable from localStorage or document.cookie. A page reload recovers the
// session by calling POST /api/auth/refresh.

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

// Only allow in-app paths as post-login destinations. Prevents an open redirect
// such as /signin?next=https://evil.example or //evil.example.
export function getSafeNextPath(search) {
  const query = search === undefined
    ? (typeof window !== "undefined" ? window.location.search : "")
    : search;
  const raw = new URLSearchParams(query).get("next");
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return null;
  return raw;
}

// ---------------------------------------------------------------------------
// In-memory access token
// ---------------------------------------------------------------------------

let accessToken = null;
let accessTokenExpiresAt = 0;
let refreshInFlight = null;
let lastRateLimitNotice = 0;

const AUTH_ERROR_CODES = new Set([
  "token_expired",
  "invalid_token",
  "authorization_required",
  "token_revoked",
]);

export function getAccessToken() {
  return accessToken;
}

function decodeJwtExpiryMs(token) {
  try {
    if (!token || typeof atob !== "function") return 0;
    const part = token.split(".")[1];
    if (!part) return 0;
    const padded = part.replace(/-/g, "+").replace(/_/g, "/")
      .padEnd(Math.ceil(part.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded));
    return payload.exp ? Number(payload.exp) * 1000 : 0;
  } catch {
    return 0;
  }
}

export function setAccessToken(token) {
  accessToken = token || null;
  accessTokenExpiresAt = accessToken ? decodeJwtExpiryMs(accessToken) : 0;
  // Migrate away from the pre-P1-02 localStorage token.
  try {
    localStorage.removeItem("access_token");
  } catch {
    // ignore storage errors
  }
}

// Helper to get headers with Authorization if token exists
export function getAuthHeaders(additionalHeaders = {}) {
  const headers = { ...additionalHeaders };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

// ---------------------------------------------------------------------------
// Global fetch: auth retry, 429 notices, credential forwarding
// ---------------------------------------------------------------------------

const originalFetch = typeof window !== "undefined" && window.fetch
  ? window.fetch.bind(window)
  : (...args) => Promise.reject(new Error("fetch is not available"));

function apiBase() {
  return getBackendUrl().replace(/\/$/, "");
}

function isBackendUrl(url) {
  if (typeof url !== "string") return false;
  const base = apiBase();
  if (url === base || url.startsWith(`${base}/`)) return true;
  // Same-origin deployments and the CRA dev proxy use relative paths.
  return url.startsWith("/api/");
}

function mergeHeaders(original, token) {
  const merged = {};
  const source = original || {};
  if (typeof Headers !== "undefined" && source instanceof Headers) {
    source.forEach((value, key) => { merged[key] = value; });
  } else if (Array.isArray(source)) {
    source.forEach(([key, value]) => { merged[key] = value; });
  } else {
    Object.assign(merged, source);
  }
  if (token) merged.Authorization = `Bearer ${token}`;
  return merged;
}

function withApiOptions(options = {}, token = accessToken) {
  return {
    ...options,
    credentials: "include",
    headers: mergeHeaders(options.headers, token),
  };
}

function notifyRateLimited(response) {
  const now = Date.now();
  if (now - lastRateLimitNotice < 4000) return;
  lastRateLimitNotice = now;
  let retryAfter = parseInt(response.headers?.get?.("Retry-After") || "", 10);
  if (!Number.isFinite(retryAfter) || retryAfter <= 0) retryAfter = 60;
  try {
    window.dispatchEvent(new CustomEvent("recruai:rate-limited", {
      detail: { retryAfter },
    }));
  } catch {
    // CustomEvent may not exist in very old browsers/tests.
  }
}

function isRefreshExcluded(url) {
  // Endpoints that must never trigger an automatic refresh loop.
  return /\/api\/auth\/(refresh|login|register|otp|password)(\/|$)/.test(url);
}

function hasStoredSession() {
  try {
    return localStorage.getItem("isAuthenticated") === "true";
  } catch {
    return false;
  }
}

async function performRefresh() {
  try {
    const res = await originalFetch(`${apiBase()}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.access_token) {
      setAccessToken(data.access_token);
      if (data.user) storeMeUser(data.user);
      return { ok: true };
    }
    return {
      ok: false,
      expired: res.status === 401 || res.status === 403,
    };
  } catch {
    return { ok: false, expired: false };
  }
}

export async function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function handleSessionExpired() {
  const hadSession = Boolean(accessToken) || hasStoredSession();
  clearLocalAuth();
  if (hadSession) {
    try {
      window.dispatchEvent(new Event("recruai:auth-expired"));
    } catch {
      // ignore
    }
  }
}

/**
 * Return a currently usable access token, refreshing the HttpOnly cookie
 * session when the in-memory token is missing or about to expire. Used by the
 * Socket.IO handshake on reconnect.
 */
export async function ensureFreshAccessToken({ minValiditySeconds = 30 } = {}) {
  if (!accessToken && !hasStoredSession()) return null;
  if (
    accessToken &&
    (!accessTokenExpiresAt ||
      accessTokenExpiresAt - Date.now() > minValiditySeconds * 1000)
  ) {
    return accessToken;
  }
  const result = await refreshAccessToken();
  return result.ok ? accessToken : null;
}

window.fetch = async function (input, options = {}) {
  const url = typeof input === "string" ? input : input?.url;
  if (!isBackendUrl(url)) {
    return originalFetch(input, options);
  }

  const canRetryBody =
    !options.body || typeof options.body?.getReader !== "function";
  let response = await originalFetch(input, withApiOptions(options));

  if (response.status === 429) {
    notifyRateLimited(response);
  }

  if (
    response.status === 401 &&
    canRetryBody &&
    !isRefreshExcluded(url)
  ) {
    const errorPayload = await response.clone().json().catch(() => ({}));
    if (AUTH_ERROR_CODES.has(errorPayload.code)) {
      const result = await refreshAccessToken();
      if (result.ok) {
        response = await originalFetch(input, withApiOptions(options));
        if (response.status === 429) notifyRateLimited(response);
      } else if (result.expired) {
        handleSessionExpired();
      }
    }
  }

  return response;
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
    // The access token itself is never stored here.
    localStorage.removeItem("access_token");
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

/** Store a login/OTP/invite response without exposing the token to storage. */
export function setAuthSession(token, user) {
  setAccessToken(token);
  if (user) {
    storeMeUser(user);
  } else {
    cachedMeUser = null;
    cachedMeAt = 0;
  }
  inFlightMe = null;
}

async function fetchMeFromServer() {
  const res = await fetch(`${getBackendUrl()}/api/auth/me`, {
    method: "GET",
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (res.status === 401 || res.status === 403) {
    // Auth actually rejected — clear stale local state.
    clearLocalAuth();
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
    // Anonymous visitors should not generate a /me -> /refresh 401 pair.
    if (!accessToken && !hasStoredSession()) return null;
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
  setAccessToken(null);
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

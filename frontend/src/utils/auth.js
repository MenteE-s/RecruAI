// helper utilities for token verification and auth state

import {
  FiUser,
  FiCalendar,
  FiClock,
  FiBookmark,
  FiBarChart2,
  FiFileText,
  FiBell,
  FiUsers,
  FiSettings,
  FiCheckCircle,
  FiHome,
  FiCpu,
  FiLink,
  FiLogOut,
} from "react-icons/fi";

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

export function getSidebarItems(role, plan) {
  if (role === "individual") {
    if (plan === "trial") {
      return [
        { name: "Dashboard", link: "/dashboard", icon: FiHome, section: "main" },
        { name: "Profile", link: "/profile", icon: FiUser, section: "main" },
        {
          name: "Upcoming Interviews",
          link: "/interviews/upcoming",
          icon: FiCalendar,
          section: "interviews",
        },
        {
          name: "Interview History",
          link: "/interviews/history",
          icon: FiClock,
          section: "interviews",
        },
        { name: "Saved Jobs", link: "/jobs/saved", icon: FiBookmark, section: "jobs" },
        { name: "Applied Jobs", link: "/jobs/applied", icon: FiCheckCircle, section: "jobs" },
        { name: "Notifications", link: "/notifications", icon: FiBell, section: "activity" },
        { name: "Analytics", link: "/analytics", icon: FiBarChart2, section: "activity" },
        { name: "Resume Builder", link: "/resume/builder", icon: FiFileText, section: "pro" },
        { name: "Job Alerts", link: "/jobs/alerts", icon: FiBell, section: "pro" },
        { name: "Career Coaching", link: "/coaching", icon: FiUsers, section: "pro" },
        // PITCH: Practice hidden (stub alerts) — re-enable when implemented
        { name: "My AI Agents", link: "/ai-agents", icon: FiCpu, section: "ai" },
        {
          name: "Shareable Profiles",
          link: "/shareable-profiles",
          icon: FiLink,
          section: "ai",
        },
        // PITCH: Billing hidden (Stripe stubs) — re-enable when implemented
        { name: "Settings", link: "/settings", icon: FiSettings, section: "bottom" },
        { name: "Sign Out", link: "/signin", icon: FiLogOut, section: "bottom" },
       ];
     } else {
       // pro - same as trial now (all features visible)
       return [
          { name: "Dashboard", link: "/dashboard", icon: FiHome, section: "main" },
          { name: "Profile", link: "/profile", icon: FiUser, section: "main" },
          {
           name: "Upcoming Interviews",
           link: "/interviews/upcoming",
           icon: FiCalendar,
           section: "interviews",
         },
         {
           name: "Interview History",
           link: "/interviews/history",
           icon: FiClock,
           section: "interviews",
         },
         { name: "Saved Jobs", link: "/jobs/saved", icon: FiBookmark, section: "jobs" },
         { name: "Applied Jobs", link: "/jobs/applied", icon: FiCheckCircle, section: "jobs" },
         { name: "Notifications", link: "/notifications", icon: FiBell, section: "activity" },
         { name: "Analytics", link: "/analytics", icon: FiBarChart2, section: "activity" },
         { name: "Resume Builder", link: "/resume/builder", icon: FiFileText, section: "pro" },
         { name: "Job Alerts", link: "/jobs/alerts", icon: FiBell, section: "pro" },
         { name: "Career Coaching", link: "/coaching", icon: FiUsers, section: "pro" },
         // PITCH: Practice hidden (stub alerts) — re-enable when implemented
         { name: "My AI Agents", link: "/ai-agents", icon: FiCpu, section: "ai" },
         {
           name: "Shareable Profiles",
           link: "/shareable-profiles",
           icon: FiLink,
           section: "ai",
         },
         // PITCH: Billing hidden (Stripe stubs) — re-enable when implemented
         { name: "Settings", link: "/settings", icon: FiSettings, section: "bottom" },
         { name: "Sign Out", link: "/signin", icon: FiLogOut, section: "bottom" },
       ];
     }
  } else if (role === "organization") {
    if (plan === "trial") {
      return [
        { name: "Dashboard", link: "/dashboard", icon: FiHome, section: "main" },
        { name: "Profile", link: "/organization/profile", icon: FiUser, section: "main" },
        { name: "Team Members", link: "/organization/team", icon: FiUsers, section: "main" },
        { name: "Job Posts", link: "/organization/jobs", icon: FiFileText, section: "main" },
        { name: "Hire People", link: "/organization/hire", icon: FiUsers, section: "main" },
        { name: "Candidates", link: "/organization/candidates", icon: FiUser, section: "candidates" },
        {
          name: "Candidate Analysis",
          link: "/organization/candidate-analysis",
          icon: FiBarChart2,
          section: "candidates",
        },
        {
          name: "Interviews",
          link: "/organization/interviews",
          icon: FiCalendar,
          section: "interviews",
        },
        { name: "AI Agents", link: "/organization/ai-agents", icon: FiCpu, section: "ai" },
        { name: "Notifications", link: "/notifications", icon: FiBell, section: "activity" },
        { name: "Pipeline", link: "/organization/pipeline", icon: FiBarChart2, section: "activity" },
        { name: "Analytics", link: "/organization/analytics", icon: FiBarChart2, section: "activity" },
        { name: "Settings", link: "/settings", icon: FiSettings, section: "bottom" },
        { name: "Sign Out", link: "/signin", icon: FiLogOut, section: "bottom" },
       ];
     } else {
       // pro
       return [
         { name: "Dashboard", link: "/dashboard", icon: FiHome, section: "main" },
         { name: "Profile", link: "/organization/profile", icon: FiUser, section: "main" },
         { name: "Team Members", link: "/organization/team", icon: FiUsers, section: "main" },
         { name: "Job Posts", link: "/organization/jobs", icon: FiFileText, section: "main" },
         { name: "Hire People", link: "/organization/hire", icon: FiUsers, section: "main" },
         { name: "Candidates", link: "/organization/candidates", icon: FiUser, section: "candidates" },
         {
           name: "Candidate Analysis",
           link: "/organization/candidate-analysis",
           icon: FiBarChart2,
           section: "candidates",
         },
         {
           name: "Interviews",
           link: "/organization/interviews",
           icon: FiCalendar,
           section: "interviews",
         },
         { name: "AI Agents", link: "/organization/ai-agents", icon: FiCpu, section: "ai" },
         { name: "Notifications", link: "/notifications", icon: FiBell, section: "activity" },
         { name: "Pipeline", link: "/organization/pipeline", icon: FiBarChart2, section: "activity" },
         { name: "Analytics", link: "/organization/analytics", icon: FiBarChart2, section: "activity" },
          { name: "Reports", link: "/organization/reports", icon: FiFileText, section: "pro" },
          // PITCH: Integrations/Insights/Billing hidden (coming-soon stubs)
         { name: "Settings", link: "/settings", icon: FiSettings, section: "bottom" },
         { name: "Sign Out", link: "/signin", icon: FiLogOut, section: "bottom" },
       ];
     }
  }
  return [];
}

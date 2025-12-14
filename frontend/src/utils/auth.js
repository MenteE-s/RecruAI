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
  FiShare2,
} from "react-icons/fi";

// Get the backend URL for API calls and uploaded files
export function getBackendUrl() {
  // Use environment variable for API base URL, with fallback logic
  const envUrl = process.env.REACT_APP_API_BASE_URL;

  // If no env var, try to detect based on current location
  if (!envUrl) {
    // In production, assume we're on Vercel and backend is on Railway
    if (
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost"
    ) {
      return "https://recruai-production.up.railway.app";
    }
    // In local development
    return "http://localhost:5000";
  }

  return envUrl;
}

// Helper to get headers with Authorization if token exists
export function getAuthHeaders(additionalHeaders = {}) {
  // Detect production the same way we detect backend URL
  const isProduction = typeof window !== "undefined" && window.location.hostname !== "localhost";

  if (isProduction) {
    // Production: Return headers with Authorization
    const headers = { ...additionalHeaders };
    const token = localStorage.getItem("access_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  } else {
    // Development: Return headers (cookies will be sent via credentials)
    return { ...additionalHeaders };
  }
}

// Override global fetch to automatically handle authentication
const originalFetch = window.fetch;
window.fetch = function (url, options = {}) {
  // Detect production the same way we detect backend URL
  const isProduction = typeof window !== "undefined" && window.location.hostname !== "localhost";

  // Check if this is an API call that needs authentication
  if (
    typeof url === "string" &&
    url.includes("/api/")
  ) {
    if (isProduction) {
      // Production: Add Authorization header
      const token = localStorage.getItem("access_token");
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    } else {
      // Development: Add credentials for cookies
      options.credentials = "include";
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

export async function verifyTokenWithServer() {
  try {
    if (typeof window === "undefined") return null;

    // With cookie-based auth we don't need to send Authorization header.
    // Ensure cookies are sent by including credentials.
    const res = await fetch(`${getBackendUrl()}/api/auth/me`, {
      method: "GET",
      credentials: "include",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      // clear stale auth
      localStorage.removeItem("access_token");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("authRole");
      return null;
    }
    const data = await res.json();
    if (data && data.user) {
      localStorage.setItem("isAuthenticated", "true");
      if (data.user.role) localStorage.setItem("authRole", data.user.role);
      if (data.user.plan) localStorage.setItem("authPlan", data.user.plan);
      return data.user;
    }
    return null;
  } catch (err) {
    // network or other error - clear local auth to avoid false-positive
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("authRole");
    } catch (e) {
      // ignore
    }
    return null;
  }
}

export function clearLocalAuth() {
  try {
    localStorage.removeItem("access_token");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("authRole");
    localStorage.removeItem("authPlan");
  } catch (e) {
    // ignore
  }
}

export function getSidebarItems(role, plan) {
  if (role === "individual") {
    if (plan === "trial") {
      return [
        { name: "Dashboard", link: "/dashboard", icon: FiBarChart2 },
        { name: "Profile", link: "/profile", icon: FiUser },
        { name: "Jobs", link: "/jobs", icon: FiFileText },
        {
          name: "Upcoming Interviews",
          link: "/interviews/upcoming",
          icon: FiCalendar,
        },
        {
          name: "Interview History",
          link: "/interviews/history",
          icon: FiClock,
        },
        { name: "Saved Jobs", link: "/jobs/saved", icon: FiBookmark },
        { name: "Applied Jobs", link: "/jobs/applied", icon: FiCheckCircle },
        { name: "Analytics", link: "/analytics", icon: FiBarChart2 },
        { name: "Practice", link: "/practice", icon: FiClock },
        { name: "My AI Agents", link: "/ai-agents", icon: FiUsers },
        {
          name: "Shareable Profiles",
          link: "/shareable-profiles",
          icon: FiShare2,
        },
        { name: "Settings", link: "/settings", icon: FiSettings },
      ];
    } else {
      // pro
      return [
        { name: "Dashboard", link: "/dashboard", icon: FiBarChart2 },
        { name: "Profile", link: "/profile", icon: FiUser },
        { name: "Jobs", link: "/jobs", icon: FiFileText },
        {
          name: "Upcoming Interviews",
          link: "/interviews/upcoming",
          icon: FiCalendar,
        },
        {
          name: "Interview History",
          link: "/interviews/history",
          icon: FiClock,
        },
        { name: "Saved Jobs", link: "/jobs/saved", icon: FiBookmark },
        { name: "Applied Jobs", link: "/jobs/applied", icon: FiCheckCircle },
        { name: "Analytics", link: "/analytics", icon: FiBarChart2 },
        { name: "Resume Builder", link: "/resume/builder", icon: FiFileText },
        { name: "Job Alerts", link: "/jobs/alerts", icon: FiBell },
        { name: "Career Coaching", link: "/coaching", icon: FiUsers },
        { name: "Practice", link: "/practice", icon: FiClock },
        { name: "My AI Agents", link: "/ai-agents", icon: FiUsers },
        {
          name: "Shareable Profiles",
          link: "/shareable-profiles",
          icon: FiShare2,
        },
        { name: "Settings", link: "/settings", icon: FiSettings },
      ];
    }
  } else if (role === "organization") {
    if (plan === "trial") {
      return [
        {
          name: "Dashboard",
          link: "/dashboard",
          icon: FiBarChart2,
        },
        { name: "Profile", link: "/organization/profile", icon: FiUser },
        {
          name: "Browse Organizations",
          link: "/organization/browse",
          icon: FiUser,
        },
        { name: "Hire People", link: "/organization/hire", icon: FiUsers },
        { name: "Team Members", link: "/organization/team", icon: FiUsers },
        { name: "Job Posts", link: "/organization/jobs", icon: FiFileText },
        { name: "AI Agents", link: "/organization/ai-agents", icon: FiUsers },
        { name: "Candidates", link: "/organization/candidates", icon: FiUser },
        {
          name: "Interviews",
          link: "/organization/interviews",
          icon: FiCalendar,
        },
        { name: "Pipeline", link: "/organization/pipeline", icon: FiBarChart2 },
        {
          name: "Analytics",
          link: "/organization/analytics",
          icon: FiBarChart2,
        },
        { name: "Settings", link: "/settings", icon: FiSettings },
      ];
    } else {
      // pro
      return [
        { name: "Dashboard", link: "/dashboard", icon: FiBarChart2 },
        { name: "Profile", link: "/organization/profile", icon: FiUser },
        {
          name: "Browse Organizations",
          link: "/organization/browse",
          icon: FiUser,
        },
        { name: "Hire People", link: "/organization/hire", icon: FiUsers },
        { name: "Team Members", link: "/organization/team", icon: FiUsers },
        { name: "Job Posts", link: "/organization/jobs", icon: FiFileText },
        { name: "AI Agents", link: "/organization/ai-agents", icon: FiUsers },
        { name: "Candidates", link: "/organization/candidates", icon: FiUser },
        {
          name: "Interviews",
          link: "/organization/interviews",
          icon: FiCalendar,
        },
        { name: "Pipeline", link: "/organization/pipeline", icon: FiBarChart2 },
        {
          name: "Analytics",
          link: "/organization/analytics",
          icon: FiBarChart2,
        },
        { name: "Reports", link: "/organization/reports", icon: FiFileText },
        {
          name: "Integrations",
          link: "/organization/integrations",
          icon: FiBell,
        },
        { name: "AI Insights", link: "/organization/insights", icon: FiUsers },
        { name: "Settings", link: "/settings", icon: FiSettings },
      ];
    }
  }
  return [];
}

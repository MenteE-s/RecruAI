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
  FiCreditCard,
  FiHome,
  FiBriefcase,
  FiTarget,
  FiCpu,
  FiLink,
  FiPlus,
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

// Override global fetch to automatically handle authentication
const originalFetch = window.fetch;
window.fetch = function (url, options = {}) {
  if (typeof url === "string" && url.includes("/api/")) {
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
        { name: "Dashboard", link: "/dashboard", icon: FiHome, section: "main" },
        { name: "Profile", link: "/profile", icon: FiUser, section: "main" },
        { name: "Jobs", link: "/jobs", icon: FiBriefcase, section: "main" },
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
        { name: "Practice", link: "/practice", icon: FiTarget, section: "ai" },
        { name: "My AI Agents", link: "/ai-agents", icon: FiCpu, section: "ai" },
        {
          name: "Shareable Profiles",
          link: "/shareable-profiles",
          icon: FiLink,
          section: "ai",
        },
        { name: "Settings", link: "/settings", icon: FiSettings, section: "bottom" },
        { name: "Sign Out", link: "/signin", icon: FiLogOut, section: "bottom" },
       ];
     } else {
       // pro
       return [
         { name: "Dashboard", link: "/dashboard", icon: FiHome, section: "main" },
         { name: "Profile", link: "/profile", icon: FiUser, section: "main" },
         { name: "Jobs", link: "/jobs", icon: FiBriefcase, section: "main" },
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
         { name: "Practice", link: "/practice", icon: FiTarget, section: "ai" },
         { name: "My AI Agents", link: "/ai-agents", icon: FiCpu, section: "ai" },
         {
           name: "Shareable Profiles",
           link: "/shareable-profiles",
           icon: FiLink,
           section: "ai",
         },
         { name: "Billing", link: "/billing", icon: FiCreditCard, section: "pro" },
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
         { name: "Integrations", link: "/organization/integrations", icon: FiLink, section: "pro" },
         { name: "AI Insights", link: "/organization/insights", icon: FiCpu, section: "pro" },
         { name: "Billing", link: "/organization/billing", icon: FiCreditCard, section: "pro" },
         { name: "Settings", link: "/settings", icon: FiSettings, section: "bottom" },
         { name: "Sign Out", link: "/signin", icon: FiLogOut, section: "bottom" },
       ];
     }
  }
  return [];
}

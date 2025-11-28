// helper utilities for token verification and auth state
export async function verifyTokenWithServer() {
  try {
    if (typeof window === "undefined") return null;

    // With cookie-based auth we don't need to send Authorization header.
    // Ensure cookies are sent by including credentials.
    const res = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
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
    if (plan === "free") {
      return [
        { name: "Profile", link: "/profile" },
        { name: "Upcoming Interviews", link: "/interviews/upcoming" },
        { name: "Interview History", link: "/interviews/history" },
        { name: "Saved Jobs", link: "/jobs/saved" },
      ];
    } else {
      // pro
      return [
        { name: "Profile", link: "/profile" },
        { name: "Upcoming Interviews", link: "/interviews/upcoming" },
        { name: "Interview History", link: "/interviews/history" },
        { name: "Saved Jobs", link: "/jobs/saved" },
        { name: "Analytics", link: "/analytics" },
        { name: "Resume Builder", link: "/resume/builder" },
        { name: "Job Alerts", link: "/jobs/alerts" },
        { name: "Career Coaching", link: "/coaching" },
      ];
    }
  } else if (role === "organization") {
    if (plan === "free") {
      return [
        { name: "Team Members", link: "/organization/team" },
        { name: "Job Posts", link: "/organization/jobs" },
        { name: "Candidates", link: "/organization/candidates" },
        { name: "Pipeline", link: "/organization/pipeline" },
      ];
    } else {
      // pro
      return [
        { name: "Team Members", link: "/organization/team" },
        { name: "Job Posts", link: "/organization/jobs" },
        { name: "Candidates", link: "/organization/candidates" },
        { name: "Pipeline", link: "/organization/pipeline" },
        { name: "Analytics", link: "/organization/analytics" },
        { name: "Reports", link: "/organization/reports" },
        { name: "Integrations", link: "/organization/integrations" },
        { name: "AI Insights", link: "/organization/insights" },
      ];
    }
  }
  return [];
}

// helper utilities for token verification and auth state
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

export async function verifyTokenWithServer() {
  try {
    if (typeof window === "undefined") return null;

    // With cookie-based auth we don't need to send Authorization header.
    // Ensure cookies are sent by including credentials.
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
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
  } catch (e) {
    // ignore
  }
}

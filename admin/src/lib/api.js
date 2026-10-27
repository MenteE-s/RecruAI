// Minimal API client for the admin dashboard. Same backend (/api) as the
// main app: short-lived access token in module memory, refresh via the
// HttpOnly cookie. Superadmin status is proven per-request server-side
// (is_superadmin is re-read from the DB); the client only caches the gate.

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

let accessToken = null;
let refreshInFlight = null;

export function setAccessToken(token) {
  accessToken = token || null;
}

export function getAccessToken() {
  return accessToken;
}

function authHeaders(extra = {}) {
  const headers = { "Content-Type": "application/json", ...extra };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  return headers;
}

async function doRefresh() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("refresh_failed");
      const data = await res.json();
      accessToken = data.access_token || null;
      return accessToken;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function api(path, { method = "GET", body, retried = false } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: authHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 401 && !retried) {
    try {
      await doRefresh();
    } catch {
      throw new Error("unauthorized");
    }
    return api(path, { method, body, retried: true });
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || `request failed (${res.status})`);
    err.status = res.status;
    err.code = data && data.code;
    throw err;
  }
  return data;
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Sign in failed");
  accessToken = data.access_token || null;
  return data.user || {};
}

export async function logout() {
  accessToken = null;
  try {
    await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
  } catch {
    // best effort; token is already dropped client-side
  }
}

// Gate: 200 means the signed-in user is a superadmin.
export async function checkSuperadmin() {
  await api("/api/admin/overview");
  return true;
}

export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

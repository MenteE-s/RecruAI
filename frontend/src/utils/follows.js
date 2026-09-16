import { getBackendUrl, getAuthHeaders } from "./auth";

export async function getFollows() {
  const res = await fetch(`${getBackendUrl()}/api/company-follows`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function followOrg(organizationId) {
  const res = await fetch(`${getBackendUrl()}/api/company-follows`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ organization_id: organizationId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to follow");
  }
  return res.json();
}

export async function unfollowOrg(organizationId) {
  const res = await fetch(`${getBackendUrl()}/api/company-follows/${organizationId}`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to unfollow");
  return true;
}

export async function checkFollow(organizationId) {
  if (!organizationId) return false;
  try {
    const res = await fetch(
      `${getBackendUrl()}/api/company-follows/check?organization_id=${organizationId}`,
      { credentials: "include", headers: getAuthHeaders() }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.following;
  } catch {
    return false;
  }
}

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import FollowButton from "../../components/ui/FollowButton";
import MenteeLoader from "../../components/ui/MenteeLoader";
import { getSidebarItems, getBackendUrl, getAuthHeaders, getUploadUrl } from "../../utils/auth";
import { getFollows } from "../../utils/follows";
import { FiBell, FiMapPin, FiBriefcase, FiUsers } from "react-icons/fi";

function timeAgo(dateString) {
  if (!dateString) return "Recently";
  const mins = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateString).toLocaleDateString();
}

function initials(name) {
  if (!name) return "CO";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function MyNetwork() {
  const navigate = useNavigate();
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [follows, setFollows] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [discover, setDiscover] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshFollows = async () => {
    const list = await getFollows().catch(() => []);
    setFollows(list);
    return list;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [followList, notifRes, postsRes] = await Promise.all([
          getFollows().catch(() => []),
          fetch(`${getBackendUrl()}/api/notifications?per_page=5`, {
            credentials: "include",
            headers: getAuthHeaders(),
          }).catch(() => null),
          fetch(`${getBackendUrl()}/api/posts?status=active&per_page=50`, {
            credentials: "include",
            headers: getAuthHeaders(),
          }).catch(() => null),
        ]);
        setFollows(followList);

        if (notifRes && notifRes.ok) {
          const data = await notifRes.json();
          setNotifications(data.data || []);
        }

        // Discover: most-hiring companies the user doesn't follow yet
        if (postsRes && postsRes.ok) {
          const data = await postsRes.json();
          const allJobs = data.data || [];
          const followedIds = new Set(followList.map((f) => f.organization_id));
          const map = new Map();
          allJobs.forEach((j) => {
            const orgId = j.organization?.id;
            if (!orgId || followedIds.has(orgId)) return;
            if (!map.has(orgId)) {
              map.set(orgId, {
                id: orgId,
                name: j.organization?.name || "Unknown",
                image: j.organization?.profile_image || null,
                industry: j.organization_details?.industry || j.category || "",
                location: j.organization_details?.location || j.location || "",
                count: 0,
              });
            }
            map.get(orgId).count += 1;
          });
          setDiscover([...map.values()].sort((a, b) => b.count - a.count).slice(0, 6));
        }
      } catch (e) {
        console.error("Error loading network:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Newest jobs across followed companies (1 latest each, newest first)
  const networkJobs = useMemo(() => {
    return follows
      .filter((f) => f.latest_post)
      .map((f) => f.latest_post)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5);
  }, [follows]);

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="w-full max-w-3xl mx-auto space-y-3">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight">My Network</h1>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {loading ? "Loading…" : `${follows.length} compan${follows.length === 1 ? "y" : "ies"} followed`}
          </p>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
            <MenteeLoader size={52} text="Loading network…" />
          </div>
        ) : (
          <>
            {/* New from your network — 1 latest job per followed company */}
            {networkJobs.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
                <h2 className="text-xs font-bold text-gray-900">New from your network</h2>
                <div className="mt-1 divide-y divide-gray-100">
                  {networkJobs.map((j) => (
                    <button
                      key={`net-${j.id}`}
                      onClick={() => navigate(`/jobs/${j.id}`)}
                      className="w-full flex items-center gap-2.5 py-2 text-left group"
                    >
                      {j.organization?.profile_image ? (
                        <img src={getUploadUrl(j.organization.profile_image)} alt="" loading="lazy" decoding="async" className="w-8 h-8 rounded-md object-cover border border-gray-200 shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-gray-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                          {initials(j.organization?.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 group-hover:text-blue-600 group-hover:underline leading-tight truncate">{j.title}</p>
                        <p className="text-[11px] text-gray-400 truncate mt-px">
                          {j.organization?.name || ""} · {timeAgo(j.created_at)}
                        </p>
                      </div>
                      <span className="text-[11px] font-medium text-blue-600 shrink-0">View</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Followed company cards */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
              <h2 className="text-xs font-bold text-gray-900">Companies you follow</h2>
              {follows.length === 0 ? (
                <div className="text-center py-5">
                  <FiUsers className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                  <p className="text-[13px] font-semibold text-gray-900">No companies yet</p>
                  <p className="text-xs text-gray-500 mt-0.5">Follow companies to see their latest job here.</p>
                </div>
              ) : (
                <div className="mt-2 space-y-2.5">
                  {follows.map((f) => {
                    const org = f.organization || {};
                    const job = f.latest_post;
                    return (
                      <div key={f.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2.5">
                          {org.profile_image ? (
                            <img src={getUploadUrl(org.profile_image)} alt={org.name} loading="lazy" decoding="async" className="w-9 h-9 rounded-md object-cover border border-gray-200 shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-md bg-gray-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {initials(org.name)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => org.id && navigate(`/organization/profile/${org.id}`)}
                              className="text-[13px] font-semibold text-gray-900 hover:text-blue-600 hover:underline truncate block max-w-full"
                            >
                              {org.name || "Unknown"}
                            </button>
                            <p className="text-[11px] text-gray-400 truncate">
                              {(f.open_roles ?? 0)} open role{(f.open_roles ?? 0) === 1 ? "" : "s"}
                            </p>
                          </div>
                          <FollowButton orgId={f.organization_id} size="xs" onChange={() => refreshFollows()} />
                        </div>
                        {job ? (
                          <button
                            onClick={() => navigate(`/jobs/${job.id}`)}
                            className="mt-2 w-full text-left bg-gray-50 border border-gray-100 rounded-md px-2.5 py-2 hover:border-blue-200 group"
                          >
                            <p className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 truncate">{job.title}</p>
                            <p className="text-[11px] text-gray-500 truncate mt-px flex items-center gap-1">
                              {job.location && <span className="inline-flex items-center gap-0.5"><FiMapPin className="w-3 h-3" />{job.location}</span>}
                              {job.employment_type && <span>· {job.employment_type}</span>}
                              <span>· {timeAgo(job.created_at)}</span>
                            </p>
                          </button>
                        ) : (
                          <p className="mt-2 text-[11px] text-gray-400">No active jobs right now.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent notifications */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <FiBell className="w-3.5 h-3.5 text-gray-400" /> Recent notifications
                </h2>
                <Link to="/notifications" className="text-[11px] font-semibold text-blue-600 hover:underline">
                  View all →
                </Link>
              </div>
              <div className="mt-1 divide-y divide-gray-100">
                {notifications.length === 0 && (
                  <p className="text-[11px] text-gray-400 py-2">You're all caught up.</p>
                )}
                {notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className="py-2 flex gap-2">
                    {n.organization?.profile_image ? (
                      <img src={getUploadUrl(n.organization.profile_image)} alt="" loading="lazy" decoding="async" className="w-7 h-7 rounded-md object-cover border border-gray-200 shrink-0" />
                    ) : n.organization ? (
                      <div className="w-7 h-7 rounded-md bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {(n.organization.name || "?").charAt(0).toUpperCase()}
                      </div>
                    ) : !n.is_read ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    ) : null}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 leading-tight truncate">{n.title || "Notification"}</p>
                      <p className="text-[11px] text-gray-500 leading-snug line-clamp-1 mt-px">{n.message || ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discover more companies */}
            {discover.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
                <h2 className="text-xs font-bold text-gray-900">Discover companies</h2>
                <p className="text-[10px] text-gray-400">Hiring now · not followed yet</p>
                <div className="mt-1 divide-y divide-gray-100">
                  {discover.map((c) => (
                    <div key={`discover-${c.id}`} className="flex items-center gap-2.5 py-2">
                      {c.image ? (
                        <img src={getUploadUrl(c.image)} alt={c.name} loading="lazy" decoding="async" className="w-8 h-8 rounded-md object-cover border border-gray-200 shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-gray-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                          {initials(c.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => navigate(`/organization/profile/${c.id}`)}
                          className="text-[13px] font-semibold text-gray-900 hover:text-blue-600 hover:underline truncate block max-w-full text-left"
                        >
                          {c.name}
                        </button>
                        <p className="text-[11px] text-gray-400 truncate">
                          {c.count} open role{c.count === 1 ? "" : "s"}
                          {c.location ? ` · ${c.location}` : ""}
                        </p>
                      </div>
                      <FollowButton
                        orgId={c.id}
                        size="xs"
                        onChange={(nowFollowing) => {
                          if (nowFollowing) {
                            setDiscover((prev) => prev.filter((d) => d.id !== c.id));
                            refreshFollows();
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Saved / applied shortcuts */}
            <div className="grid grid-cols-2 gap-2.5">
              <button onClick={() => navigate("/jobs/saved")} className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 text-left hover:border-blue-200 transition-colors">
                <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5"><FiBriefcase className="w-3.5 h-3.5 text-gray-400" /> Saved jobs</p>
                <p className="text-[11px] text-blue-600 font-medium mt-1">View →</p>
              </button>
              <button onClick={() => navigate("/jobs/applied")} className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 text-left hover:border-blue-200 transition-colors">
                <p className="text-xs font-bold text-gray-900">Applied jobs</p>
                <p className="text-[11px] text-blue-600 font-medium mt-1">View →</p>
              </button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

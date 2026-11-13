import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppShell, CenterBar } from "../../components/layout/AppShell";
import { RailCard, PeopleCard } from "../../components/layout/UtilityRail";
import FollowButton from "../../components/ui/FollowButton";
import MenteeLoader from "../../components/ui/MenteeLoader";
import { getBackendUrl, getAuthHeaders, getUploadUrl, orgPath, postPath } from "../../utils/auth";
import { getFollows } from "../../utils/follows";
import { FiBell, FiMapPin, FiBriefcase, FiUsers, FiCheckCircle } from "react-icons/fi";

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
          const discoverList = [...map.values()]
            .sort((a, b) => b.count - a.count)
            .slice(0, 6)
            .map((c) => ({
              ...c,
              sub: `${c.count} open role${c.count === 1 ? "" : "s"}${c.location ? ` · ${c.location}` : ""}`,
            }));
          setDiscover(discoverList);
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

  const railContent = (
    <>
      <PeopleCard
        title="Companies you may know"
        people={discover}
        empty="No suggestions yet — follow companies to personalize this."
        onView={(c) => c.id && navigate(orgPath(c))}
      />
      <RailCard title="New from your network">
        {networkJobs.length === 0 ? (
          <p className="py-2 text-center text-[11px] text-gray-500 dark:text-gray-500">No new openings yet.</p>
        ) : (
          <ul className="flex flex-col">
            {networkJobs.slice(0, 4).map((j) => (
              <li key={`rail-net-${j.id}`}>
                <button
                  type="button"
                  onClick={() => navigate(postPath(j))}
                  className="group flex w-full flex-col rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-25"
                >
                  <span className="truncate text-[13px] font-semibold text-ink group-hover:text-brand-text">{j.title}</span>
                  <span className="truncate text-[11px] text-gray-500 dark:text-gray-500">
                    {j.organization?.name || ""} · {timeAgo(j.created_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </RailCard>
    </>
  );

  return (
    <AppShell rail={railContent}>
      <CenterBar title="Network" subtitle={loading ? undefined : `${follows.length} compan${follows.length === 1 ? "y" : "ies"} followed`} />
      <div className="w-full max-w-3xl mx-auto space-y-3.5 px-4 pb-6 pt-4">

        {loading ? (
          <div className="rounded-xl border border-line bg-surface p-6 text-center shadow-s5">
            <MenteeLoader size={52} text="Loading network…" />
          </div>
        ) : (
          <>
            {/* New from your network — 1 latest job per followed company */}
            {networkJobs.length > 0 && (
              <div className="rounded-xl border border-line bg-surface p-4 shadow-s5">
                <h2 className="text-sm font-semibold text-ink">New from your network</h2>
                <div className="mt-2 divide-y divide-line">
                  {networkJobs.map((j) => (
                    <button
                      key={`net-${j.id}`}
                      type="button"
                      onClick={() => navigate(postPath(j))}
                      className="group flex w-full items-center gap-3 py-2.5 text-left rounded-lg px-2 -mx-2 transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-25/40"
                    >
                      {j.organization?.profile_image ? (
                        <img
                          src={getUploadUrl(j.organization.profile_image)}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-9 w-9 shrink-0 rounded-xl border border-line object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-xs font-bold text-white dark:bg-gray-800">
                          {initials(j.organization?.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold leading-tight text-ink group-hover:text-brand-text group-hover:underline">
                          {j.title}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-500">
                          {j.organization?.name || ""} · {timeAgo(j.created_at)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-brand-text group-hover:underline">View</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Followed company cards */}
            <div className="rounded-xl border border-line bg-surface p-4 shadow-s5">
              <h2 className="text-sm font-semibold text-ink">Companies you follow</h2>
              {follows.length === 0 ? (
                <div className="py-6 text-center">
                  <FiUsers className="mx-auto mb-2 h-7 w-7 text-gray-300 dark:text-gray-600 stroke-[1.6]" />
                  <p className="text-[13px] font-semibold text-ink">No companies yet</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">Follow companies to see their latest jobs here.</p>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {follows.map((f) => {
                    const org = f.organization || {};
                    const job = f.latest_post;
                    return (
                      <div key={f.id} className="rounded-xl border border-line bg-surface p-3.5 shadow-s5 transition-colors hover:border-brand/35">
                        <div className="flex items-center gap-3">
                          {org.profile_image ? (
                            <img
                              src={getUploadUrl(org.profile_image)}
                              alt={org.name}
                              loading="lazy"
                              decoding="async"
                              className="h-10 w-10 shrink-0 rounded-xl border border-line object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-xs font-bold text-white dark:bg-gray-800">
                              {initials(org.name)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => org.id && navigate(orgPath(org))}
                              className="block max-w-full truncate text-[13px] font-semibold text-ink hover:text-brand-text hover:underline"
                            >
                              {org.name || "Unknown"}
                            </button>
                            <p className="truncate text-[11px] text-gray-500 dark:text-gray-500">
                              {(f.open_roles ?? 0)} open role{(f.open_roles ?? 0) === 1 ? "" : "s"}
                            </p>
                          </div>
                          <FollowButton orgId={f.organization_id} size="xs" onChange={() => refreshFollows()} />
                        </div>
                        {job ? (
                          <button
                            type="button"
                            onClick={() => navigate(postPath(job))}
                            className="group mt-2.5 w-full rounded-xl border border-line bg-gray-50/70 px-3 py-2 text-left transition-colors hover:border-brand/30 dark:bg-gray-25/50"
                          >
                            <p className="truncate text-xs font-semibold text-ink group-hover:text-brand-text">{job.title}</p>
                            <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-gray-500 dark:text-gray-500">
                              {job.location && (
                                <span className="inline-flex items-center gap-1">
                                  <FiMapPin className="h-3 w-3 text-gray-500 stroke-[1.8]" /> {job.location}
                                </span>
                              )}
                              {job.employment_type && <span>· {job.employment_type}</span>}
                              <span>· {timeAgo(job.created_at)}</span>
                            </p>
                          </button>
                        ) : (
                          <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-500">No active jobs right now.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent notifications */}
            <div className="rounded-xl border border-line bg-surface p-4 shadow-s5">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <FiBell className="h-4 w-4 text-gray-500 stroke-[1.8]" /> Recent notifications
                </h2>
                <Link to="/notifications" className="text-xs font-semibold text-brand-text hover:underline">
                  View all →
                </Link>
              </div>
              <div className="mt-2 divide-y divide-line">
                {notifications.length === 0 && (
                  <p className="py-3 text-xs text-gray-500 dark:text-gray-500">You're all caught up.</p>
                )}
                {notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className="flex items-start gap-2.5 py-2.5">
                    {n.organization?.profile_image ? (
                      <img
                        src={getUploadUrl(n.organization.profile_image)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-8 w-8 shrink-0 rounded-xl border border-line object-cover"
                      />
                    ) : n.organization ? (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-[10px] font-bold text-white dark:bg-gray-800">
                        {(n.organization.name || "?").charAt(0).toUpperCase()}
                      </div>
                    ) : !n.is_read ? (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold leading-tight text-ink">{n.title || "Notification"}</p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-gray-500 dark:text-gray-500">{n.message || ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discover more companies */}
            {discover.length > 0 && (
              <div className="rounded-xl border border-line bg-surface p-4 shadow-s5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-ink">Discover companies</h2>
                    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-500">Hiring now · not followed yet</p>
                  </div>
                </div>
                <div className="mt-2 divide-y divide-line">
                  {discover.map((c) => (
                    <div key={`discover-${c.id}`} className="flex items-center gap-3 py-2.5">
                      {c.image ? (
                        <img
                          src={getUploadUrl(c.image)}
                          alt={c.name}
                          loading="lazy"
                          decoding="async"
                          className="h-9 w-9 shrink-0 rounded-xl border border-line object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-xs font-bold text-white dark:bg-gray-800">
                          {initials(c.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => navigate(orgPath(c))}
                          className="block max-w-full truncate text-left text-[13px] font-semibold text-ink hover:text-brand-text hover:underline"
                        >
                          {c.name}
                        </button>
                        <p className="truncate text-[11px] text-gray-500 dark:text-gray-500">
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
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => navigate("/in/jobs")}
                className="group rounded-xl border border-line bg-surface p-4 text-left shadow-s5 transition-all hover:border-brand/40 hover:shadow-s10"
              >
                <p className="flex items-center gap-2 text-xs font-bold text-ink group-hover:text-brand-text">
                  <FiBriefcase className="h-4 w-4 text-gray-500 transition-colors group-hover:text-brand-text stroke-[1.8]" /> Saved jobs
                </p>
                <p className="mt-1.5 text-[11px] font-semibold text-brand-text">View saved roles →</p>
              </button>
              <button
                type="button"
                onClick={() => navigate("/in/jobs?tab=applied")}
                className="group rounded-xl border border-line bg-surface p-4 text-left shadow-s5 transition-all hover:border-brand/40 hover:shadow-s10"
              >
                <p className="flex items-center gap-2 text-xs font-bold text-ink group-hover:text-brand-text">
                  <FiCheckCircle className="h-4 w-4 text-gray-500 transition-colors group-hover:text-brand-text stroke-[1.8]" /> Applied jobs
                </p>
                <p className="mt-1.5 text-[11px] font-semibold text-brand-text">View applications →</p>
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

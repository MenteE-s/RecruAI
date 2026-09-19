import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ApplicantCard from "../../components/org/ApplicantCard";
import { getSidebarItems, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import MenteeLoader from "../../components/ui/MenteeLoader";
import { formatDate } from "../../utils/timezone";
import {
  FiBriefcase,
  FiMapPin,
  FiMail,
  FiUsers,
  FiSearch,
  FiX,
  FiVideo,
  FiLayers,
  FiPlus,
  FiArrowRight,
} from "react-icons/fi";

function getCompanyInitials(name) {
  if (!name) return "CO";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function timeAgo(dateString) {
  if (!dateString) return "Recently";
  const mins = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return formatDate(dateString);
}

function countdownTo(ts) {
  const diffMs = ts - Date.now();
  if (diffMs <= 0) return "Now";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `in ${hours}h${mins % 60 ? ` ${mins % 60}m` : ""}`;
  const days = Math.floor(hours / 24);
  return `in ${days}d${hours % 24 ? ` ${hours % 24}h` : ""}`;
}

const PER_PAGE = 10;

const asList = (data) => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  return data.data || data.posts || data.interviews || [];
};

export default function OrganizationDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [user, setUser] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, has_more: false });
  const [posts, setPosts] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState({ team_members: 0, open_requisitions: 0, pipeline: 0, new_applications: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [postFilter, setPostFilter] = useState("");
  // user_id:post_id pairs scheduled since last interviews fetch (optimistic)
  const [scheduledKeys, setScheduledKeys] = useState(new Set());
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showScheduleInterview, setShowScheduleInterview] = useState(false);
  const [interviewForm, setInterviewForm] = useState({ title: "", scheduled_at: "", duration_minutes: 60, interview_type: "text" });

  // Org identity + id (same source as Candidates.jsx)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/auth/me`, { credentials: "include", headers: getAuthHeaders() });
        if (!cancelled && res.ok) {
          const u = (await res.json()).user;
          setUser(u);
          setOrganizationId(u?.organization_id || null);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const fetchApplicationsPage = useCallback(async (page, reset) => {
    if (!organizationId) return { list: [], more: false, total: 0 };
    const params = new URLSearchParams({ page, per_page: PER_PAGE, organization_id: organizationId });
    const res = await fetch(`${getBackendUrl()}/api/applications?${params}`, { credentials: "include", headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch applications");
    const result = await res.json();
    const list = Array.isArray(result.data) ? result.data : [];
    const pg = result.pagination || {};
    return { list, more: !!pg.has_next, total: pg.total ?? list.length };
  }, [organizationId]);

  const refreshInterviews = useCallback(async () => {
    try {
      const ivRes = await fetch(`${getBackendUrl()}/api/interviews`, { credentials: "include", headers: getAuthHeaders() });
      if (!ivRes.ok) return;
      const upcoming = asList(await ivRes.json())
        .map((iv) => ({ ...iv, _at: new Date(iv.scheduled_at_iso || iv.scheduled_at).getTime() }))
        .filter((iv) => !Number.isNaN(iv._at) && iv._at >= Date.now() - 2 * 60 * 60 * 1000 && iv.status !== "cancelled")
        .sort((a, b) => a._at - b._at)
        .slice(0, 5);
      setInterviews(upcoming);
    } catch {}
  }, []);

  // Database is the source of truth (interview creation sets pipeline_stage);
  // the set below merges fetched interviews with just-scheduled pairs so the
  // UI reflects the scheduled state instantly without a full reload.
  const scheduledSet = useMemo(() => {
    const s = new Set(scheduledKeys);
    interviews.forEach((iv) => {
      if (iv.status !== "cancelled" && iv.user_id != null) s.add(`${iv.user_id}:${iv.post_id}`);
    });
    return s;
  }, [interviews, scheduledKeys]);

  // Main load: identity first, then stream + rails in parallel
  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [appsPage, postsRes, statsRes, ivRes] = await Promise.all([
          fetchApplicationsPage(1, true).catch(() => ({ list: [], more: false, total: 0 })),
          fetch(`${getBackendUrl()}/api/organizations/${organizationId}/posts`, { credentials: "include", headers: getAuthHeaders() }).catch(() => null),
          fetch(`${getBackendUrl()}/api/dashboard/stats`, { credentials: "include", headers: getAuthHeaders() }).catch(() => null),
          fetch(`${getBackendUrl()}/api/interviews`, { credentials: "include", headers: getAuthHeaders() }).catch(() => null),
        ]);
        if (cancelled) return;
        setApplications(appsPage.list);
        setPagination({ page: 1, total: appsPage.total, has_more: appsPage.more });
        if (postsRes && postsRes.ok) {
          try { setPosts(asList(await postsRes.json())); } catch {}
        }
        if (statsRes && statsRes.ok) {
          try { setStats(await statsRes.json()); } catch {}
        }
        if (ivRes && ivRes.ok) {
          try {
            const upcoming = asList(await ivRes.json())
              .map((iv) => ({ ...iv, _at: new Date(iv.scheduled_at_iso || iv.scheduled_at).getTime() }))
              .filter((iv) => !Number.isNaN(iv._at) && iv._at >= Date.now() - 2 * 60 * 60 * 1000 && iv.status !== "cancelled")
              .sort((a, b) => a._at - b._at)
              .slice(0, 5);
            setInterviews(upcoming);
          } catch {}
        }
      } catch (e) {
        console.error("Error loading organization dashboard:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [organizationId, fetchApplicationsPage]);

  const handleShowMore = async () => {
    if (loadingMore || !pagination.has_more) return;
    setLoadingMore(true);
    try {
      const next = await fetchApplicationsPage(pagination.page + 1, false);
      setApplications((prev) => [...prev, ...next.list]);
      setPagination((p) => ({ page: p.page + 1, total: next.total, has_more: next.more }));
    } catch {
      showToast("Could not load more applicants", "error");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleStatusChange = useCallback(async (appId, status) => {
    const prev = applications;
    setApplications((list) => list.map((a) => (a.id === appId ? { ...a, status } : a)));
    try {
      const res = await fetch(`${getBackendUrl()}/api/applications/${appId}`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      showToast({ message: `Application ${status}`, type: "success" });
    } catch {
      setApplications(prev);
      showToast({ message: "Failed to update status", type: "error" });
    }
  }, [applications, showToast]);

  const openSchedule = useCallback((application) => {
    setSelectedApplication(application);
    setInterviewForm({ title: "", scheduled_at: "", duration_minutes: 60, interview_type: "text" });
    setShowScheduleInterview(true);
  }, []);

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!selectedApplication) return;
    try {
      const payload = {
        title: interviewForm.title,
        description: "",
        scheduled_at: new Date(interviewForm.scheduled_at).toISOString(),
        duration_minutes: interviewForm.duration_minutes,
        user_id: selectedApplication.user_id,
        organization_id: organizationId,
        post_id: selectedApplication.post_id,
        interview_type: interviewForm.interview_type,
        interviewers: [],
      };
      const res = await fetch(`${getBackendUrl()}/api/interviews`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      showToast({ message: "Interview scheduled", type: "success" });
      // Database already flipped pipeline_stage to interview_scheduled —
      // mirror it locally (and the scheduled key) so every card updates now.
      setApplications((prev) => prev.map((a) => (
        a.user_id === selectedApplication.user_id && a.post_id === selectedApplication.post_id
          ? { ...a, pipeline_stage: "interview_scheduled" }
          : a
      )));
      setScheduledKeys((prev) => new Set(prev).add(`${selectedApplication.user_id}:${selectedApplication.post_id}`));
      refreshInterviews();
      setShowScheduleInterview(false);
      setSelectedApplication(null);
    } catch {
      showToast({ message: "Failed to schedule interview", type: "error" });
    }
  };

  const handleViewProfile = useCallback((userId) => {
    if (userId) navigate(`/organization/user/${userId}`);
  }, [navigate]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((app) => {
      if (postFilter && String(app.post_id) !== String(postFilter)) return false;
      if (!q) return true;
      return app.user?.name?.toLowerCase().includes(q) || app.post?.title?.toLowerCase().includes(q);
    });
  }, [applications, search, postFilter]);

  const newCount = useMemo(
    () => applications.filter((a) => a.applied_at && Date.now() - new Date(a.applied_at).getTime() < 24 * 60 * 60 * 1000).length,
    [applications]
  );

  const stageCounts = useMemo(() => {
    const map = new Map();
    applications.forEach((a) => {
      const key = (a.pipeline_stage || a.status || "applied").replace(/_/g, " ");
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [applications]);

  const applicantsByPost = useMemo(() => {
    const map = new Map();
    applications.forEach((a) => {
      if (a.post_id == null) return;
      map.set(a.post_id, (map.get(a.post_id) || 0) + 1);
    });
    return map;
  }, [applications]);

  const openPosts = useMemo(
    () => [...posts].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5),
    [posts]
  );

  const orgName = user?.organization || "Organization";
  const totalApplicants = pagination.total || applications.length;

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 w-full max-w-5xl mx-auto justify-center">
        {/* Left column — org identity + pipeline snapshot */}
        <aside className="lg:col-span-3 space-y-3 order-2 lg:order-1">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="h-14 bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900" />
            <div className="px-3 pb-3 relative">
              <div className="w-10 h-10 rounded-lg border-2 border-white shadow -mt-5 mb-1.5 bg-gray-900 text-white flex items-center justify-center text-sm font-bold">
                {getCompanyInitials(orgName)}
              </div>
              <h2 className="text-sm font-bold text-gray-900 leading-tight truncate">{orgName}</h2>
              {user?.name && <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-1">{user.name}</p>}
              <span className="inline-block mt-1.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-px rounded-full">
                {plan ? plan.toUpperCase() : "FREE"}
              </span>
              <div className="mt-2.5 pt-2.5 border-t border-gray-100 space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact</p>
                {user?.email && (
                  <p className="flex items-center gap-1.5 text-[11px] text-gray-600 truncate">
                    <FiMail className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </p>
                )}
                <button
                  onClick={() => navigate("/organization/profile")}
                  className="text-[11px] font-semibold text-blue-600 hover:underline px-0 py-0.5"
                >
                  View organization profile →
                </button>
                <button
                  onClick={() => navigate("/organization/team")}
                  className="block text-[11px] font-semibold text-blue-600 hover:underline px-0 py-0.5"
                >
                  Manage team →
                </button>
              </div>
            </div>
            <div className="border-t border-gray-100 px-3 py-2 flex gap-5">
              <div className="text-center">
                <p className="text-sm font-extrabold text-gray-900 leading-none">{loading ? "—" : (stats.open_requisitions || posts.length)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-extrabold text-gray-900 leading-none">{loading ? "—" : totalApplicants}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Applicants</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-extrabold text-gray-900 leading-none">{loading ? "—" : (stats.team_members || 0)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Team</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5"><FiLayers className="w-3.5 h-3.5 text-gray-400" /> Pipeline</h3>
              <button onClick={() => navigate("/organization/pipeline")} className="text-[11px] font-semibold text-blue-600 hover:underline">
                All →
              </button>
            </div>
            {loading ? (
              <p className="text-[11px] text-gray-400 mt-1.5">Loading…</p>
            ) : stageCounts.length === 0 ? (
              <p className="text-[11px] text-gray-400 mt-1.5">No applicants yet.</p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {stageCounts.map(([stage, count]) => (
                  <button key={stage} onClick={() => navigate("/organization/pipeline")} className="w-full group">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-gray-700 capitalize truncate group-hover:text-blue-700">{stage}</span>
                      <span className="font-bold text-gray-900">{count}</span>
                    </div>
                    <div className="h-1 mt-0.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${Math.max(6, Math.round((count / Math.max(totalApplicants, 1)) * 100))}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Middle column — latest applicants stream */}
        <main className="lg:col-span-6 order-1 lg:order-2">
          <div className="w-full space-y-2.5">
            <div className="flex items-center gap-2 justify-between">
              <div className="min-w-0">
                <h1 className="text-base font-bold text-gray-900 tracking-tight">Latest applicants</h1>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {totalApplicants} total{newCount > 0 ? ` · ${newCount} new today` : ""}
                </p>
              </div>
              <button
                onClick={() => navigate("/organization/candidates")}
                className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
              >
                All candidates <FiArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex gap-1.5">
              <div className="relative flex-1 min-w-0">
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Filter by name or role…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 shadow-sm"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded text-gray-500">
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <select
                value={postFilter}
                onChange={(e) => setPostFilter(e.target.value)}
                aria-label="Filter by job post"
                className="shrink-0 max-w-[140px] px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-blue-500 shadow-sm truncate"
              >
                <option value="">All posts</option>
                {posts.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
                <MenteeLoader size={52} text="Loading applicants…" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FiUsers className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {applications.length === 0 ? "No applicants yet" : "No matches"}
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  {applications.length === 0
                    ? "Share your posts or browse talent to get your first applicants."
                    : "Try a different search or post filter."}
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  {applications.length === 0 ? (
                    <>
                      <button onClick={() => navigate("/organization/jobs")} className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 text-xs font-semibold hover:bg-black rounded-md">
                        <FiBriefcase className="w-3.5 h-3.5" /> Job posts
                      </button>
                      <button onClick={() => navigate("/organization/hire")} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-md">
                        <FiSearch className="w-3.5 h-3.5" /> Hire people
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { setSearch(""); setPostFilter(""); }} className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 text-xs font-semibold hover:bg-black rounded-md">
                      <FiX className="w-3.5 h-3.5" /> Clear filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {filtered.map((app) => (
                  <ApplicantCard
                    key={app.id}
                    application={app}
                    timeLabel={app.applied_at ? `Applied ${timeAgo(app.applied_at)}` : "Recently"}
                    scheduled={scheduledSet.has(`${app.user_id}:${app.post_id}`)}
                    onStatusChange={handleStatusChange}
                    onSchedule={openSchedule}
                    onViewProfile={handleViewProfile}
                  />
                ))}
                {pagination.has_more && !search && !postFilter && (
                  <div className="flex flex-col items-center gap-1.5 pt-1">
                    <button
                      onClick={handleShowMore}
                      disabled={loadingMore}
                      className="px-5 py-2 bg-gray-900 text-white text-xs font-semibold hover:bg-black rounded-md disabled:opacity-60 inline-flex items-center gap-2"
                    >
                      {loadingMore && <MenteeLoader size={16} text={null} inline />} {loadingMore ? "Loading…" : "Show more"}
                    </button>
                    <p className="text-[11px] text-gray-400">Showing {applications.length} of {pagination.total}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Right column — open posts + upcoming interviews */}
        <aside className="lg:col-span-3 space-y-3 order-3">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-900">Open posts</h3>
              <button onClick={() => navigate("/organization/jobs")} className="text-[11px] font-semibold text-blue-600 hover:underline">
                Manage →
              </button>
            </div>
            <div className="mt-1.5 space-y-1">
              {loading ? (
                <p className="text-[11px] text-gray-400 py-2 text-center">Loading…</p>
              ) : openPosts.length === 0 ? (
                <p className="text-[11px] text-gray-400 py-2 text-center">No posts yet.</p>
              ) : (
                openPosts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/organization/jobs/${p.id}`)}
                    className="w-full flex items-center gap-2 p-1.5 -mx-1.5 rounded-lg hover:bg-blue-50/60 text-left group transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                      {getCompanyInitials(p.title)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 group-hover:text-blue-700 leading-tight truncate">{p.title}</p>
                      <p className="text-[11px] text-gray-400 truncate mt-px">
                        {applicantsByPost.get(p.id) || 0} applicant{(applicantsByPost.get(p.id) || 0) === 1 ? "" : "s"}
                        {p.location ? ` · ${p.location}` : ""}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => navigate("/organization/jobs")}
              className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700 rounded-md"
            >
              <FiPlus className="w-3.5 h-3.5" /> New post
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5"><FiVideo className="w-3.5 h-3.5 text-gray-400" /> Upcoming interviews</h3>
              <button onClick={() => navigate("/organization/interviews")} className="text-[11px] font-semibold text-blue-600 hover:underline">
                All →
              </button>
            </div>
            {loading ? (
              <p className="text-[11px] text-gray-400 mt-1.5">Loading…</p>
            ) : interviews.length === 0 ? (
              <p className="text-[11px] text-gray-400 mt-1.5">Nothing scheduled.</p>
            ) : (
              <div className="mt-1.5 space-y-1">
                {interviews.map((iv) => (
                  <button
                    key={iv.id}
                    onClick={() => navigate("/organization/interviews")}
                    className="w-full text-left p-1.5 -mx-1.5 rounded-lg hover:bg-blue-50/60 group transition-colors"
                  >
                    <p className="text-xs font-semibold text-gray-900 group-hover:text-blue-700 leading-tight truncate">{iv.title || "Interview"}</p>
                    <p className="text-[11px] text-gray-500 truncate mt-px">
                      {iv.user_name || iv.candidate_name || ""}{iv.post_title ? ` · ${iv.post_title}` : ""}
                    </p>
                    <p className="mt-1 inline-block text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-px rounded-full">
                      {countdownTo(iv._at)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-900">Needs review</h3>
              <button onClick={() => navigate("/organization/candidates")} className="text-[11px] font-semibold text-blue-600 hover:underline">
                Review →
              </button>
            </div>
            <button onClick={() => navigate("/organization/candidates")} className="w-full text-left mt-1.5 group">
              <p className="text-sm font-extrabold text-gray-900 leading-none group-hover:text-blue-700">
                {loading ? "—" : applications.filter((a) => a.status === "pending").length}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">pending applications</p>
            </button>
            <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1">
              <FiMapPin className="w-3 h-3 text-gray-400 shrink-0" />
              <button onClick={() => navigate("/organization/hire")} className="font-semibold text-blue-600 hover:underline">Browse talent</button>
              <span>to source proactively</span>
            </p>
          </div>
        </aside>
      </div>

      {showScheduleInterview && selectedApplication && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Schedule interview</h3>
              <p className="text-xs text-gray-500 mt-1">
                For {selectedApplication.user?.name} • {selectedApplication.post?.title}
              </p>
            </div>
            <form onSubmit={handleScheduleInterview} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Title</label>
                <input type="text" required value={interviewForm.title} onChange={(e) => setInterviewForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white rounded-md" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Date &amp; time</label>
                <input type="datetime-local" required value={interviewForm.scheduled_at} onChange={(e) => setInterviewForm((p) => ({ ...p, scheduled_at: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Duration</label>
                  <select value={interviewForm.duration_minutes} onChange={(e) => setInterviewForm((p) => ({ ...p, duration_minutes: parseInt(e.target.value) }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white rounded-md">
                    <option value={30}>30 min</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label>
                  <select value={interviewForm.interview_type} onChange={(e) => setInterviewForm((p) => ({ ...p, interview_type: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white rounded-md">
                    <option value="text">Text chat</option>
                    <option value="ai_video">AI video</option>
                    <option value="human_video">Human video</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 text-sm font-medium hover:bg-blue-700 rounded-md">Schedule</button>
                <button type="button" onClick={() => { setShowScheduleInterview(false); setSelectedApplication(null); }} className="px-5 py-2.5 bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50 rounded-md">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

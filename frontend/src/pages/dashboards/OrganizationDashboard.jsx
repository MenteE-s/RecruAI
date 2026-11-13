import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { OrgAppShell } from "../../components/layout/OrgAppShell";
import ApplicantCard from "../../components/org/ApplicantCard";
import { getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import MenteeLoader from "../../components/ui/MenteeLoader";
import { formatDate } from "../../utils/timezone";
import {
  Briefcase,
  MapPin,
  Mail,
  Users,
  Search,
  X,
  Video,
  Layers,
  Plus,
  ArrowRight,
} from "lucide-react";

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
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;

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

  // Org identity + id
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
    if (userId) navigate(`/org/user/${userId}`);
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

  // Rail Components (rendered on right rail for desktop, stacked at bottom on mobile)
  const renderProfileCard = () => (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-900 dark:bg-gray-800 text-white flex items-center justify-center text-sm font-bold shrink-0">
          {getCompanyInitials(orgName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink leading-tight truncate">{orgName}</p>
          {user?.name && <p className="text-[11.5px] text-gray-500 truncate mt-0.5">{user.name}</p>}
          <span className="inline-block mt-1 text-[10px] font-mono font-semibold bg-brand/10 text-brand-text border border-brand/20 px-2 py-0.5 rounded-full">
            {plan ? plan.toUpperCase() : "FREE"}
          </span>
        </div>
      </div>
      <div className="pt-2 border-t border-line space-y-1.5">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Contact</p>
        {user?.email && (
          <p className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-600 truncate">
            <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" strokeWidth={1.75} />
            <span className="truncate">{user.email}</span>
          </p>
        )}
        <div className="flex flex-col gap-1.5 pt-1">
          <button
            onClick={() => navigate("/org/profile")}
            className="text-left text-xs font-semibold text-brand-text hover:underline"
          >
            View organization profile →
          </button>
          <button
            onClick={() => navigate("/org/team")}
            className="text-left text-xs font-semibold text-brand-text hover:underline"
          >
            Manage team →
          </button>
        </div>
      </div>
      <div className="border-t border-line pt-3 flex justify-around text-center">
        <div>
          <p className="text-base font-extrabold font-mono tabular-nums text-ink leading-none">{loading ? "—" : (stats.open_requisitions || posts.length)}</p>
          <p className="text-[10.5px] text-gray-500 mt-1">Posts</p>
        </div>
        <div>
          <p className="text-base font-extrabold font-mono tabular-nums text-ink leading-none">{loading ? "—" : totalApplicants}</p>
          <p className="text-[10.5px] text-gray-500 mt-1">Applicants</p>
        </div>
        <div>
          <p className="text-base font-extrabold font-mono tabular-nums text-ink leading-none">{loading ? "—" : (stats.team_members || 0)}</p>
          <p className="text-[10.5px] text-gray-500 mt-1">Team</p>
        </div>
      </div>
    </div>
  );

  const renderPipelineCard = () => (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-ink flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-brand-text" strokeWidth={1.75} /> Pipeline
        </h3>
        <button onClick={() => navigate("/org/pipeline")} className="text-xs font-semibold text-brand-text hover:underline">
          All →
        </button>
      </div>
      {loading ? (
        <p className="text-xs text-gray-500 py-1">Loading…</p>
      ) : stageCounts.length === 0 ? (
        <p className="text-xs text-gray-500 py-1">No applicants yet.</p>
      ) : (
        <div className="space-y-2">
          {stageCounts.map(([stage, count]) => (
            <button key={stage} onClick={() => navigate("/org/pipeline")} className="w-full group text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-600 dark:text-gray-600 capitalize truncate group-hover:text-brand-text">{stage}</span>
                <span className="font-bold font-mono tabular-nums text-ink ml-2">{count}</span>
              </div>
              <div className="h-1.5 mt-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all"
                  style={{ width: `${Math.max(6, Math.round((count / Math.max(totalApplicants, 1)) * 100))}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderOpenPostsCard = () => (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-ink flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-brand-text" strokeWidth={1.75} /> Open posts
        </h3>
        <button onClick={() => navigate("/org/jobs")} className="text-xs font-semibold text-brand-text hover:underline">
          Manage →
        </button>
      </div>
      <div className="space-y-1.5">
        {loading ? (
          <p className="text-xs text-gray-500 py-2 text-center">Loading…</p>
        ) : openPosts.length === 0 ? (
          <p className="text-xs text-gray-500 py-2 text-center">No posts yet.</p>
        ) : (
          openPosts.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/org/jobs/${p.id}`)}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-left group transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-gray-800 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                {getCompanyInitials(p.title)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink group-hover:text-brand-text leading-tight truncate">{p.title}</p>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                  <span className="font-mono tabular-nums">{applicantsByPost.get(p.id) || 0}</span> applicant{(applicantsByPost.get(p.id) || 0) === 1 ? "" : "s"}
                  {p.location ? ` · ${p.location}` : ""}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
      <button
        onClick={() => navigate("/org/jobs")}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-action text-white text-xs font-semibold hover:bg-brand/90 rounded-xl transition-colors mt-1 shadow-sm"
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={1.75} /> New post
      </button>
    </div>
  );

  const renderUpcomingInterviewsCard = () => (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-ink flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5 text-brand-text" strokeWidth={1.75} /> Upcoming interviews
        </h3>
        <button onClick={() => navigate("/org/interviews")} className="text-xs font-semibold text-brand-text hover:underline">
          All →
        </button>
      </div>
      {loading ? (
        <p className="text-xs text-gray-500 py-1">Loading…</p>
      ) : interviews.length === 0 ? (
        <p className="text-xs text-gray-500 py-1">Nothing scheduled.</p>
      ) : (
        <div className="space-y-1.5">
          {interviews.map((iv) => (
            <button
              key={iv.id}
              onClick={() => navigate("/org/interviews")}
              className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 group transition-colors"
            >
              <p className="text-xs font-semibold text-ink group-hover:text-brand-text leading-tight truncate">{iv.title || "Interview"}</p>
              <p className="text-[11px] text-gray-500 truncate mt-0.5">
                {iv.user_name || iv.candidate_name || ""}{iv.post_title ? ` · ${iv.post_title}` : ""}
              </p>
              <p className="mt-1 inline-block text-[10px] font-mono font-semibold text-brand-text bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full">
                {countdownTo(iv._at)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderNeedsReviewCard = () => (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-ink">Needs review</h3>
        <button onClick={() => navigate("/org/candidates")} className="text-xs font-semibold text-brand-text hover:underline">
          Review →
        </button>
      </div>
      <button onClick={() => navigate("/org/candidates")} className="w-full text-left pt-0.5 group">
        <p className="text-xl font-extrabold font-mono tabular-nums text-ink leading-none group-hover:text-brand-text">
          {loading ? "—" : applications.filter((a) => a.status === "pending").length}
        </p>
        <p className="text-xs text-gray-500 mt-1">Pending applications</p>
      </button>
      <p className="text-xs text-gray-500 pt-1.5 border-t border-line flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" strokeWidth={1.75} />
        <button onClick={() => navigate("/org/hire")} className="font-semibold text-brand-text hover:underline">Browse talent</button>
        <span>to source proactively</span>
      </p>
    </div>
  );

  const railContent = (
    <div className="space-y-4">
      {renderProfileCard()}
      {renderPipelineCard()}
      {renderOpenPostsCard()}
      {renderUpcomingInterviewsCard()}
      {renderNeedsReviewCard()}
    </div>
  );

  return (
    <OrgAppShell
      title={
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-ink truncate leading-tight">Latest applicants</h1>
          <p className="text-[11px] text-gray-500 truncate mt-0.5">
            <span className="font-mono tabular-nums">{totalApplicants}</span> total{newCount > 0 ? <> · <span className="font-mono tabular-nums">{newCount}</span> new today</> : ""}
          </p>
        </div>
      }
      actions={
        <button
          onClick={() => navigate("/org/candidates")}
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text hover:underline"
        >
          All candidates <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>
      }
      rail={railContent}
    >
      <div className="px-4 py-4 space-y-3.5">
        {/* Search & Post Filter bar */}
        <div className="flex gap-2.5">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5 pointer-events-none" strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Filter by name or role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-surface border border-line rounded-xl text-xs text-ink placeholder-gray-400 focus:outline-none focus:border-brand shadow-sm transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-ink"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            )}
          </div>
          <select
            value={postFilter}
            onChange={(e) => setPostFilter(e.target.value)}
            aria-label="Filter by job post"
            className="shrink-0 max-w-[170px] px-3 py-2 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-brand shadow-sm truncate transition-colors"
          >
            <option value="">All posts</option>
            {posts.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        {/* Applicant list stream */}
        {loading ? (
          <div className="rounded-xl border border-line bg-surface p-8 text-center shadow-sm">
            <MenteeLoader size={52} text="Loading applicants…" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-8 text-center shadow-sm">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-gray-500" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-ink">
              {applications.length === 0 ? "No applicants yet" : "No matches"}
            </p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {applications.length === 0
                ? "Share your posts or browse talent to get your first applicants."
                : "Try a different search query or post filter."}
            </p>
            <div className="mt-4 flex justify-center gap-2.5">
              {applications.length === 0 ? (
                <>
                  <button
                    onClick={() => navigate("/org/jobs")}
                    className="inline-flex items-center gap-1.5 bg-brand-action text-white px-4 py-2 text-xs font-semibold hover:bg-brand/90 rounded-xl transition-colors shadow-sm"
                  >
                    <Briefcase className="w-3.5 h-3.5" strokeWidth={1.75} /> Job posts
                  </button>
                  <button
                    onClick={() => navigate("/org/hire")}
                    className="inline-flex items-center gap-1.5 bg-surface border border-line px-4 py-2 text-xs font-semibold text-ink hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors shadow-sm"
                  >
                    <Search className="w-3.5 h-3.5" strokeWidth={1.75} /> Hire people
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setSearch(""); setPostFilter(""); }}
                  className="inline-flex items-center gap-1.5 bg-brand-action text-white px-4 py-2 text-xs font-semibold hover:bg-brand/90 rounded-xl transition-colors shadow-sm"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.75} /> Clear filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
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
              <div className="flex flex-col items-center gap-1.5 pt-2">
                <button
                  onClick={handleShowMore}
                  disabled={loadingMore}
                  className="px-6 py-2 border border-line bg-surface text-ink text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-60 inline-flex items-center gap-2 transition-colors shadow-sm"
                >
                  {loadingMore && <MenteeLoader size={16} text={null} inline />} {loadingMore ? "Loading…" : "Show more applicants"}
                </button>
                <p className="text-[11px] text-gray-500">Showing {applications.length} of {pagination.total}</p>
              </div>
            )}
          </div>
        )}

        {/* Mobile-only stacked cards so mobile view retains all sidebar widgets */}
        <div className="mt-8 space-y-4 lg:hidden pt-4 border-t border-line">
          {renderProfileCard()}
          {renderPipelineCard()}
          {renderOpenPostsCard()}
          {renderUpcomingInterviewsCard()}
          {renderNeedsReviewCard()}
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleInterview && selectedApplication && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface w-full max-w-md border border-line rounded-2xl shadow-s15 overflow-hidden">
            <div className="px-5 py-4 border-b border-line">
              <h3 className="text-sm font-semibold text-ink">Schedule interview</h3>
              <p className="text-xs text-gray-500 mt-1">
                For {selectedApplication.user?.name} • {selectedApplication.post?.title}
              </p>
            </div>
            <form onSubmit={handleScheduleInterview} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-600 mb-1.5">Title</label>
                <input
                  type="text"
                  required
                  value={interviewForm.title}
                  onChange={(e) => setInterviewForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-brand shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-600 mb-1.5">Date &amp; time</label>
                <input
                  type="datetime-local"
                  required
                  value={interviewForm.scheduled_at}
                  onChange={(e) => setInterviewForm((p) => ({ ...p, scheduled_at: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-brand shadow-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-600 mb-1.5">Duration</label>
                  <select
                    value={interviewForm.duration_minutes}
                    onChange={(e) => setInterviewForm((p) => ({ ...p, duration_minutes: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-brand shadow-sm"
                  >
                    <option value={30}>30 min</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-600 mb-1.5">Type</label>
                  <select
                    value={interviewForm.interview_type}
                    onChange={(e) => setInterviewForm((p) => ({ ...p, interview_type: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-brand shadow-sm"
                  >
                    <option value="text">Text chat</option>
                    <option value="ai_video">AI video</option>
                    <option value="human_video">Human video</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-brand-action text-white py-2 text-xs font-semibold hover:bg-brand/90 rounded-xl transition-colors"
                >
                  Schedule
                </button>
                <button
                  type="button"
                  onClick={() => { setShowScheduleInterview(false); setSelectedApplication(null); }}
                  className="px-5 py-2 bg-surface border border-line text-xs font-semibold text-ink hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </OrgAppShell>
  );
}

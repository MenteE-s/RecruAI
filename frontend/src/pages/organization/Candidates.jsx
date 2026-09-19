import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, getBackendUrl, getAuthHeaders, getUploadUrl } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import { formatDate } from "../../utils/timezone";
import { FiUsers, FiSearch, FiX, FiEye, FiCalendar, FiArrowRight, FiStar, FiPlus, FiVideo, FiLayers } from "react-icons/fi";
import EmploymentBadge from "../../components/ui/EmploymentStatus";

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

export default function Candidates() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "starred" ? "starred" : "all";
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const { showToast } = useToast();
  const [applications, setApplications] = useState([]);
  const [organizationId, setOrganizationId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showScheduleInterview, setShowScheduleInterview] = useState(false);
  const [showCandidateProfile, setShowCandidateProfile] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, has_more: false });
  const [search, setSearch] = useState("");
  const [starredUsers, setStarredUsers] = useState([]);
  const [starredLoading, setStarredLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const listRef = useRef(null);
  const [interviewForm, setInterviewForm] = useState({ title: "", description: "", scheduled_at: "", duration_minutes: 60, interview_type: "text", interviewers: "" });

  const setTab = (t) => setParams(t === "starred" ? { tab: "starred" } : {});

  useEffect(() => {
    const getIds = async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/auth/me`, { credentials: "include", headers: getAuthHeaders() });
        if (res.ok) {
          const u = (await res.json()).user;
          setOrganizationId(u?.organization_id || null);
          setCurrentUserId(u?.id || null);
        }
      } catch {}
    };
    getIds();
  }, []);

  const fetchApplications = useCallback(async (reset = false) => {
    if (!organizationId) return;
    try {
      if (reset) { setLoading(true); setApplications([]); setPagination((p) => ({ ...p, page: 1 })); }
      else setLoadingMore(true);
      // NB: non-reset loads the NEXT page (page+1). Requesting pagination.page
      // again would re-append the same page as duplicates.
      const currentPage = reset ? 1 : pagination.page + 1;
      const params = new URLSearchParams({ page: currentPage, per_page: pagination.per_page, organization_id: organizationId });
      const res = await fetch(`${getBackendUrl()}/api/applications?${params}`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) {
        const result = await res.json();
        if (reset) setApplications(result.data);
        else setApplications((prev) => [...prev, ...result.data]);
        setPagination({ page: result.pagination.page, per_page: result.pagination.per_page, total: result.pagination.total, has_more: result.pagination.has_next });
      } else throw new Error("Failed to fetch applications");
    } catch (err) { showToast("Error fetching applications", "error"); }
    finally { if (reset) setLoading(false); else setLoadingMore(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, pagination.page, pagination.per_page]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (organizationId) fetchApplications(true); }, [organizationId]);

  const fetchStarred = useCallback(async () => {
    if (!currentUserId) return;
    setStarredLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/users/${currentUserId}/favorites?per_page=100`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStarredUsers(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err) {
      showToast("Error fetching starred candidates", "error");
    } finally {
      setStarredLoading(false);
    }
  }, [currentUserId, showToast]);

  useEffect(() => { if (tab === "starred" && currentUserId) fetchStarred(); }, [tab, currentUserId, fetchStarred]);

  const handleUnstar = useCallback(async (targetUserId) => {
    if (!currentUserId) return;
    setStarredUsers((prev) => prev.filter((u) => u.id !== targetUserId));
    try {
      const res = await fetch(`${getBackendUrl()}/api/users/${currentUserId}/toggle-favorite/${targetUserId}`, { method: "POST", credentials: "include", headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.favorited) fetchStarred();
      else showToast({ message: "Removed from starred", type: "success" });
    } catch {
      fetchStarred();
      showToast({ message: "Failed to update starred", type: "error" });
    }
  }, [currentUserId, fetchStarred, showToast]);

  const updateApplicationStatus = useCallback(async (appId, status) => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/applications/${appId}`, { method: "PUT", headers: getAuthHeaders({ "Content-Type": "application/json" }), credentials: "include", body: JSON.stringify({ status }) });
      if (res.ok) { await fetchApplications(); showToast({ message: `Application ${status} successfully`, type: "success" }); } else showToast({ message: "Failed to update application status", type: "error" });
    } catch { showToast({ message: "Failed to update application status", type: "error" }); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchApplications]);

  const fetchCandidateProfile = useCallback(async (userId) => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/users/${userId}/full-profile`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) { setCandidateProfile(await res.json()); setShowCandidateProfile(true); } else showToast({ message: "Failed to load candidate profile", type: "error" });
    } catch { showToast({ message: "Failed to load candidate profile", type: "error" }); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleInterview = async (e) => {
    e.preventDefault();
    try {
      const payload = { title: interviewForm.title, description: interviewForm.description, scheduled_at: new Date(interviewForm.scheduled_at).toISOString(), duration_minutes: interviewForm.duration_minutes, user_id: selectedApplication.user_id, organization_id: organizationId, post_id: selectedApplication.post_id, interview_type: interviewForm.interview_type, interviewers: interviewForm.interviewers ? interviewForm.interviewers.split(",").map((i) => i.trim()) : [] };
      const res = await fetch(`${getBackendUrl()}/api/interviews`, { method: "POST", headers: getAuthHeaders({ "Content-Type": "application/json" }), credentials: "include", body: JSON.stringify(payload) });
      if (res.ok) { showToast({ message: "Interview scheduled successfully!", type: "success" }); setShowScheduleInterview(false); resetInterviewForm(); } else showToast({ message: "Failed to schedule interview", type: "error" });
    } catch { showToast({ message: "Failed to schedule interview", type: "error" }); }
  };
  const resetInterviewForm = () => setInterviewForm({ title: "", description: "", scheduled_at: "", duration_minutes: 60, interview_type: "text", interviewers: "" });
  const getStatusMeta = (status) => {
    switch (status) {
      case "pending": return { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" };
      case "reviewed": return { label: "Reviewed", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "accepted": return { label: "Accepted", color: "bg-green-50 text-green-700 border-green-200" };
      case "rejected": return { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200" };
      default: return { label: status, color: "bg-gray-50 text-gray-600 border-gray-200" };
    }
  };
  const toggleOnboardingStatus = async (applicationId, currentlyOnboarded) => {
    try {
      const endpoint = currentlyOnboarded ? `/api/applications/${applicationId}/offboard` : `/api/applications/${applicationId}/onboard`;
      const res = await fetch(`${getBackendUrl()}${endpoint}`, { method: "POST", credentials: "include", headers: getAuthHeaders({ "Content-Type": "application/json" }) });
      if (res.ok) {
        setApplications((prev) => prev.map((app) => app.id === applicationId ? { ...app, onboarded: !currentlyOnboarded, pipeline_stage: !currentlyOnboarded ? "hired" : app.pipeline_stage } : app));
        showToast(`Candidate ${!currentlyOnboarded ? "marked as onboarded" : "marked as not onboarded"}`, "success");
      } else throw new Error("Failed to update onboarding status");
    } catch { showToast("Error updating onboarding status", "error"); }
  };

  const filtered = applications.filter((app) => !search || app.user?.name?.toLowerCase().includes(search.toLowerCase()) || app.post?.title?.toLowerCase().includes(search.toLowerCase()));

  const starredFiltered = starredUsers.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  // Recent history rail: latest applications first
  const recentApps = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.applied_at || 0) - new Date(a.applied_at || 0))
      .slice(0, 6);
  }, [applications]);

  // Infinite scroll for the contact list (unfiltered All tab only)
  const handleListScroll = () => {
    const el = listRef.current;
    if (!el || tab !== "all" || loadingMore || !pagination.has_more || search) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) fetchApplications(false);
  };

  if (tab === "all" && loading && applications.length === 0) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-gray-900 h-44 animate-pulse" />
          {[1, 2, 3].map((i) => <div key={i} className="bg-white border border-gray-200 h-32 animate-pulse" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="w-full max-w-5xl mx-auto space-y-2.5">
        <div className="flex items-center gap-2 justify-between">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">People</h1>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {pagination.total || applications.length} applicants · {starredUsers.length} starred · {applications.filter((a) => a.status === "pending").length} pending
            </p>
          </div>
          <button
            onClick={() => navigate("/organization/hire")}
            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
          >
            Hire people <FiArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Filter by name, role…"
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

      {/* Internal tabs — same pattern as Interviews/Jobs */}
      <div className="flex gap-1.5 bg-white border border-gray-200 rounded-lg p-1 shadow-sm mb-4">
        {[
          { id: "all", label: `All (${applications.length})`, icon: FiUsers },
          { id: "starred", label: `Starred (${starredUsers.length})`, icon: FiStar },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${t.id === "starred" && isActive ? "fill-amber-400 text-amber-400" : t.id === "starred" ? "text-amber-500" : ""}`} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "starred" ? (
        starredLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="bg-white border border-gray-200 h-44 animate-pulse" />)}
          </div>
        ) : starredFiltered.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 text-center">
            <div className="w-14 h-14 bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4"><FiStar className="w-7 h-7 text-amber-400" /></div>
            <h3 className="text-lg font-semibold text-gray-900">{starredUsers.length === 0 ? "No starred candidates yet" : "No matches"}</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">{starredUsers.length === 0 ? "Tap the star on any profile to pin top candidates here." : `Nobody starred matches “${search}”.`}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {starredFiltered.map((u) => (
              <div key={u.id} className="border border-gray-200 rounded-xl p-3 text-center hover:border-amber-200 hover:shadow-sm transition-all bg-white">
                <div className="relative w-14 h-14 mx-auto">
                  <div className="absolute inset-0 rounded-xl bg-gray-900 text-white flex items-center justify-center text-lg font-bold">
                    {(u.name || "?").charAt(0).toUpperCase()}
                  </div>
                  {u.profile_picture && (
                    <img
                      src={getUploadUrl(u.profile_picture)}
                      alt={u.name || "Candidate"}
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                      className="absolute inset-0 w-14 h-14 rounded-xl object-cover border border-gray-200 bg-white"
                    />
                  )}
                </div>
                <p className="text-[13px] font-semibold text-gray-900 mt-2 leading-tight truncate">{u.name || "Unnamed"}</p>
                {u.headline && <p className="text-[11px] text-gray-500 truncate mt-px font-medium">{u.headline}</p>}
                <div className="mt-1.5 flex justify-center">
                  <EmploymentBadge status={u.employment_status} className="!px-1.5 !py-px !text-[10px]" />
                </div>
                <button
                  onClick={() => navigate(`/organization/user/${u.id}`)}
                  className="mt-2 w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded-md"
                >
                  <FiEye className="w-3 h-3" /> Visit profile
                </button>
                <button
                  onClick={() => handleUnstar(u.id)}
                  title="Remove star"
                  className="mt-1.5 w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold hover:bg-amber-100 rounded-md"
                >
                  <FiStar className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Starred
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Left — contact list */}
        <div className="lg:col-span-2 min-w-0">
          {filtered.length === 0 ? (
            <div className="bg-white border border-gray-200 p-12 text-center">
              <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-4"><FiUsers className="w-7 h-7 text-gray-400" /></div>
              <h3 className="text-lg font-semibold text-gray-900">No applications</h3>
              <p className="text-sm text-gray-500 mt-1">No applications received yet.</p>
            </div>
          ) : (
            <div ref={listRef} onScroll={handleListScroll} className="max-h-[76vh] overflow-y-auto pr-1 -mr-1">
              <div className="grid sm:grid-cols-2 gap-3">
                {filtered.map((application) => {
                  const meta = getStatusMeta(application.status);
                  const name = application.user?.name || "Anonymous";
                  const photo = application.user?.profile_picture ? getUploadUrl(application.user.profile_picture) : null;
                  return (
                    <div key={application.id} className="bg-white border border-gray-200 rounded-xl p-3 hover:border-gray-300 hover:shadow-sm transition-all">
                      <button onClick={() => fetchCandidateProfile(application.user_id)} className="w-full flex gap-2.5 text-left group">
                        <div className="relative w-10 h-10 shrink-0">
                          <div className="absolute inset-0 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm font-bold">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          {photo && (
                            <img src={photo} alt={name} onError={(e) => { e.currentTarget.style.display = "none"; }} className="absolute inset-0 w-10 h-10 rounded-lg object-cover border border-gray-200 bg-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 leading-tight truncate group-hover:text-blue-700">{name}</p>
                          <p className="text-[11px] text-gray-500 truncate mt-px">{application.user?.headline || application.post?.title || "—"}</p>
                          <p className="text-[11px] text-gray-400 mt-px">{timeAgo(application.applied_at)}</p>
                        </div>
                        <span className={`inline-flex items-center self-start px-1.5 py-0.5 text-[10px] font-semibold border rounded-full shrink-0 ${meta.color}`}>{meta.label}</span>
                      </button>
                      <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-gray-100">
                        <select value={application.status} onChange={(e) => updateApplicationStatus(application.id, e.target.value)} aria-label={`Status for ${name}`} className="flex-1 min-w-0 px-1.5 py-1.5 bg-gray-50 border border-gray-200 text-[11px] font-medium rounded-md focus:outline-none focus:border-blue-500">
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button onClick={() => { setSelectedApplication(application); setShowScheduleInterview(true); }} title="Schedule interview" className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 shrink-0"><FiVideo className="w-3.5 h-3.5" /></button>
                        <button onClick={() => fetchCandidateProfile(application.user_id)} title="View profile" className="p-1.5 bg-white border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 shrink-0"><FiEye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => toggleOnboardingStatus(application.id, application.onboarded)} title={application.onboarded ? "Offboard" : "Mark as onboarded"} className={`px-2 py-1.5 text-[11px] font-semibold rounded-md border shrink-0 ${application.onboarded ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"}`}>{application.onboarded ? "Hired ✓" : "Onboard"}</button>
                      </div>
                      {application.cover_letter && (
                        <p className="text-[11px] text-gray-500 mt-2 leading-snug line-clamp-2">{application.cover_letter}</p>
                      )}
                      {application.resume_url && <a href={application.resume_url} target="_blank" rel="noopener noreferrer" className="inline-block text-[11px] text-blue-600 hover:text-blue-700 mt-1.5 font-medium">View resume →</a>}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col items-center gap-1.5 py-4">
                {loadingMore && <p className="text-xs text-gray-500">Loading more…</p>}
                {pagination.has_more && !search && !loadingMore && (
                  <button onClick={() => fetchApplications(false)} className="px-5 py-2 bg-gray-900 text-white text-xs font-semibold hover:bg-black rounded-md">Load more</button>
                )}
                <p className="text-[11px] text-gray-400">Showing {filtered.length}{search ? "" : ` of ${pagination.total}`}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right rail — recent history + CTAs */}
        <aside className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-900">Recent activity</h3>
              <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="mt-1.5 divide-y divide-gray-100">
              {recentApps.length === 0 && (
                <p className="text-[11px] text-gray-400 py-2 text-center">No activity yet.</p>
              )}
              {recentApps.map((app) => {
                const dot = app.status === "accepted" ? "bg-green-500" : app.status === "rejected" ? "bg-red-500" : app.status === "reviewed" ? "bg-blue-500" : "bg-amber-500";
                return (
                  <button
                    key={`recent-${app.id}`}
                    onClick={() => fetchCandidateProfile(app.user_id)}
                    className="w-full flex items-center gap-2 py-2 text-left group"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-blue-700 leading-tight">{app.user?.name || "Anonymous"}</p>
                      <p className="text-[11px] text-gray-400 truncate mt-px">{app.post?.title || "—"} · {timeAgo(app.applied_at)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-900 text-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-bold">Hire faster</h3>
            <p className="text-[11px] text-gray-400 mt-1 leading-snug">Source talent, open roles, and move people through your pipeline.</p>
            <div className="mt-3 space-y-1.5">
              <button onClick={() => navigate("/organization/hire")} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-100 rounded-md">
                <FiSearch className="w-3.5 h-3.5" /> Browse talent
              </button>
              <button onClick={() => navigate("/organization/jobs")} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 rounded-md">
                <FiPlus className="w-3.5 h-3.5" /> New job post
              </button>
              <button onClick={() => navigate("/organization/pipeline")} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 border border-white/15 text-white text-xs font-semibold hover:bg-white/15 rounded-md">
                <FiLayers className="w-3.5 h-3.5" /> Open pipeline
              </button>
            </div>
          </div>
        </aside>
      </div>
      )}
      </div>

      {showScheduleInterview && selectedApplication && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Schedule interview</h3>
              <p className="text-xs text-gray-500 mt-1">For {selectedApplication.user?.name} • {selectedApplication.post?.title}</p>
            </div>
            <form onSubmit={scheduleInterview} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Title</label>
                <input type="text" required value={interviewForm.title} onChange={(e) => setInterviewForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Date & time</label>
                <input type="datetime-local" required value={interviewForm.scheduled_at} onChange={(e) => setInterviewForm((p) => ({ ...p, scheduled_at: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Duration</label>
                  <select value={interviewForm.duration_minutes} onChange={(e) => setInterviewForm((p) => ({ ...p, duration_minutes: parseInt(e.target.value) }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white">
                    <option value={30}>30 min</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label>
                  <select value={interviewForm.interview_type} onChange={(e) => setInterviewForm((p) => ({ ...p, interview_type: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white">
                    <option value="text">Text chat</option>
                    <option value="ai_video">AI video</option>
                    <option value="human_video">Human video</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Interviewers (comma-separated)</label>
                <input type="text" value={interviewForm.interviewers} onChange={(e) => setInterviewForm((p) => ({ ...p, interviewers: e.target.value }))} placeholder="John Doe, Jane Smith" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 text-sm font-medium hover:bg-blue-700">Schedule</button>
                <button type="button" onClick={() => { setShowScheduleInterview(false); resetInterviewForm(); }} className="px-5 py-2.5 bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCandidateProfile && candidateProfile && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Candidate profile</h3>
              <button onClick={() => { setShowCandidateProfile(false); setCandidateProfile(null); }} className="p-1.5 hover:bg-gray-100 text-gray-500"><FiX className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              <div className="bg-gray-50 border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-900">Basic info</h4>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-gray-500">Name</p><p className="font-medium">{candidateProfile.name || "Not provided"}</p></div>
                  <div><p className="text-xs text-gray-500">Email</p><p className="font-medium">{candidateProfile.email}</p></div>
                </div>
              </div>
              {candidateProfile.skills?.length > 0 && <div className="bg-gray-50 border border-gray-200 p-4"><h4 className="text-sm font-semibold text-gray-900 mb-2">Skills</h4><div className="flex flex-wrap gap-1.5">{candidateProfile.skills.map((s, i) => <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1">{s.name} {s.level && `(${s.level})`}</span>)}</div></div>}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  const id = candidateProfile.id || candidateProfile.user_id;
                  setShowCandidateProfile(false);
                  setCandidateProfile(null);
                  if (id) navigate(`/organization/user/${id}`);
                }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Visit full profile <FiArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

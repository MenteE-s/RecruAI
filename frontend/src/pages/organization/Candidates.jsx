import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import PersonCard from "../../components/people/PersonCard";
import ApplicantsPanel from "../../components/people/ApplicantsPanel";
import { ClearFiltersButton } from "../../components/people/peopleMeta";
import { getSidebarItems, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import { FiUsers, FiSearch, FiX, FiArrowRight, FiStar } from "react-icons/fi";

const STARRED_FIRST_ROW = 4;

export default function Candidates() {
  const navigate = useNavigate();
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const { showToast } = useToast();

  // Applicants
  const [applications, setApplications] = useState([]);
  const [organizationId, setOrganizationId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, has_more: false });
  // Talent directory (all individuals on RecruAI)
  const [directory, setDirectory] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryLoadingMore, setDirectoryLoadingMore] = useState(false);
  const [directoryPage, setDirectoryPage] = useState(1);
  const [directoryHasMore, setDirectoryHasMore] = useState(false);
  // Starred
  const [starredUsers, setStarredUsers] = useState([]);
  const [starredLoading, setStarredLoading] = useState(false);
  const [showAllStarred, setShowAllStarred] = useState(false);
  // Interviews (drives per-applicant Scheduled state — DB is source of truth)
  const [interviews, setInterviews] = useState([]);
  const [scheduledKeys, setScheduledKeys] = useState(new Set());
  // UI
  const [search, setSearch] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showScheduleInterview, setShowScheduleInterview] = useState(false);
  const [showCandidateProfile, setShowCandidateProfile] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [interviewForm, setInterviewForm] = useState({ title: "", description: "", scheduled_at: "", duration_minutes: 60, interview_type: "text", interviewers: "" });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/auth/me`, { credentials: "include", headers: getAuthHeaders() });
        if (res.ok) {
          const u = (await res.json()).user;
          setOrganizationId(u?.organization_id || null);
          setCurrentUserId(u?.id || null);
        }
      } catch {}
    })();
  }, []);

  const fetchApplications = useCallback(async (reset = false) => {
    if (!organizationId) return;
    try {
      if (reset) { setLoading(true); setApplications([]); setPagination((p) => ({ ...p, page: 1 })); }
      // NB: non-reset loads the NEXT page (page+1)
      const page = reset ? 1 : pagination.page + 1;
      const params = new URLSearchParams({ page, per_page: pagination.per_page, organization_id: organizationId });
      const res = await fetch(`${getBackendUrl()}/api/applications?${params}`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) {
        const result = await res.json();
        if (reset) setApplications(result.data);
        else setApplications((prev) => [...prev, ...result.data]);
        setPagination({ page: result.pagination.page, per_page: result.pagination.per_page, total: result.pagination.total, has_more: result.pagination.has_next });
      }
    } catch { showToast("Error fetching applications", "error"); }
    finally { if (reset) setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, pagination.page, pagination.per_page]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (organizationId) fetchApplications(true); }, [organizationId]);

  const loadDirectory = useCallback(async (page) => {
    if (page === 1) setDirectoryLoading(true);
    else setDirectoryLoadingMore(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/users?page=${page}&per_page=24`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) {
        const result = await res.json();
        const individuals = (result.data || []).filter((u) => u.role === "individual");
        setDirectory((prev) => (page === 1 ? individuals : [...prev, ...individuals]));
        setDirectoryHasMore(result.pagination?.has_next ?? false);
        setDirectoryPage(page);
      }
    } catch {}
    finally { setDirectoryLoading(false); setDirectoryLoadingMore(false); }
  }, []);

  useEffect(() => { loadDirectory(1); }, [loadDirectory]);

  const fetchStarred = useCallback(async () => {
    if (!currentUserId) return;
    setStarredLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/users/${currentUserId}/favorites?per_page=100`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStarredUsers(Array.isArray(data) ? data : data.data || []);
      }
    } catch { showToast("Error fetching starred candidates", "error"); }
    finally { setStarredLoading(false); }
  }, [currentUserId, showToast]);

  useEffect(() => { if (currentUserId) fetchStarred(); }, [currentUserId, fetchStarred]);

  // Upcoming interviews drive the per-applicant Scheduled state
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/interviews`, { credentials: "include", headers: getAuthHeaders() });
        if (!cancelled && res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.data || [];
          setInterviews(list.filter((iv) => iv.status !== "cancelled"));
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const scheduledSet = useMemo(() => {
    const s = new Set(scheduledKeys);
    interviews.forEach((iv) => {
      if (iv.status !== "cancelled" && iv.user_id != null) s.add(`${iv.user_id}:${iv.post_id}`);
    });
    return s;
  }, [interviews, scheduledKeys]);

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
      if (res.ok) {
        setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
        showToast({ message: `Application ${status}`, type: "success" });
      } else showToast({ message: "Failed to update application status", type: "error" });
    } catch { showToast({ message: "Failed to update application status", type: "error" }); }
  }, [showToast]);

  const fetchCandidateProfile = useCallback(async (userId) => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/users/${userId}/full-profile`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) { setCandidateProfile(await res.json()); setShowCandidateProfile(true); } else showToast({ message: "Failed to load candidate profile", type: "error" });
    } catch { showToast({ message: "Failed to load candidate profile", type: "error" }); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleInterview = async (e) => {
    e.preventDefault();
    if (!selectedApplication) return;
    try {
      const payload = { title: interviewForm.title, description: interviewForm.description, scheduled_at: new Date(interviewForm.scheduled_at).toISOString(), duration_minutes: interviewForm.duration_minutes, user_id: selectedApplication.user_id, organization_id: organizationId, post_id: selectedApplication.post_id, interview_type: interviewForm.interview_type, interviewers: interviewForm.interviewers ? interviewForm.interviewers.split(",").map((i) => i.trim()) : [] };
      const res = await fetch(`${getBackendUrl()}/api/interviews`, { method: "POST", headers: getAuthHeaders({ "Content-Type": "application/json" }), credentials: "include", body: JSON.stringify(payload) });
      if (res.ok) {
        showToast({ message: "Interview scheduled successfully!", type: "success" });
        // DB already flipped pipeline_stage server-side — mirror locally
        setApplications((prev) => prev.map((a) => (
          a.user_id === selectedApplication.user_id && a.post_id === selectedApplication.post_id
            ? { ...a, pipeline_stage: "interview_scheduled" }
            : a
        )));
        setScheduledKeys((prev) => new Set(prev).add(`${selectedApplication.user_id}:${selectedApplication.post_id}`));
        setShowScheduleInterview(false);
        resetInterviewForm();
      } else showToast({ message: "Failed to schedule interview", type: "error" });
    } catch { showToast({ message: "Failed to schedule interview", type: "error" }); }
  };
  const resetInterviewForm = () => setInterviewForm({ title: "", description: "", scheduled_at: "", duration_minutes: 60, interview_type: "text", interviewers: "" });

  const toggleOnboardingStatus = async (applicationId, currentlyOnboarded) => {
    try {
      const endpoint = currentlyOnboarded ? `/api/applications/${applicationId}/offboard` : `/api/applications/${applicationId}/onboard`;
      const res = await fetch(`${getBackendUrl()}${endpoint}`, { method: "POST", credentials: "include", headers: getAuthHeaders({ "Content-Type": "application/json" }) });
      if (res.ok) {
        setApplications((prev) => prev.map((app) => (app.id === applicationId ? { ...app, onboarded: !currentlyOnboarded, pipeline_stage: !currentlyOnboarded ? "hired" : app.pipeline_stage } : app)));
        showToast(`Candidate ${!currentlyOnboarded ? "marked as onboarded" : "marked as not onboarded"}`, "success");
      } else throw new Error("Failed to update onboarding status");
    } catch { showToast("Error updating onboarding status", "error"); }
  };

  const starredFiltered = useMemo(() => {
    if (!search) return starredUsers;
    const q = search.toLowerCase();
    return starredUsers.filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [starredUsers, search]);

  const directoryFiltered = useMemo(() => {
    if (!search) return directory;
    const q = search.toLowerCase();
    return directory.filter((u) => u.name?.toLowerCase().includes(q) || u.headline?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [directory, search]);

  const recentApps = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.applied_at || 0) - new Date(a.applied_at || 0))
      .slice(0, 6);
  }, [applications]);

  const acceptedApps = useMemo(() => {
    return applications
      .filter((a) => a.status === "accepted")
      .sort((a, b) => new Date(b.applied_at || 0) - new Date(a.applied_at || 0))
      .slice(0, 4);
  }, [applications]);

  const openSchedule = (app) => {
    setSelectedApplication(app);
    resetInterviewForm();
    setShowScheduleInterview(true);
  };

  if (loading && applications.length === 0 && directoryLoading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="w-full max-w-5xl mx-auto space-y-2.5">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg" />
          <div className="grid grid-cols-2 gap-2.5">
            {[1, 2, 3, 4].map((i) => <div key={i} className="bg-white border border-gray-200 rounded-xl h-40 animate-pulse" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="w-full max-w-5xl mx-auto space-y-2.5">
        {/* Header */}
        <div className="flex items-center gap-2 justify-between">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">People</h1>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {directory.length} on RecruAI · {pagination.total || applications.length} applicants · {starredUsers.length} starred
            </p>
          </div>
          <button
            onClick={() => navigate("/organization/hire")}
            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
          >
            AI talent search <FiArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search people by name, headline…"
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

        {/* Starred first */}
        {(starredLoading || starredUsers.length > 0) && (
          <div>
            <div className="flex items-center gap-2 justify-between mb-2">
              <h2 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <FiStar className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Starred · {starredFiltered.length}
              </h2>
              {starredFiltered.length > STARRED_FIRST_ROW && (
                <button onClick={() => setShowAllStarred((s) => !s)} className="text-[11px] font-semibold text-blue-600 hover:underline">
                  {showAllStarred ? "Show less" : `Show more (${starredFiltered.length - STARRED_FIRST_ROW})`}
                </button>
              )}
            </div>
            {starredLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[1, 2, 3, 4].map((i) => <div key={i} className="bg-white border border-gray-200 rounded-xl h-44 animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(showAllStarred ? starredFiltered : starredFiltered.slice(0, STARRED_FIRST_ROW)).map((u) => (
                  <PersonCard
                    key={u.id}
                    person={u}
                    onView={() => navigate(`/organization/user/${u.id}`)}
                    footer={
                      <button
                        onClick={() => handleUnstar(u.id)}
                        title="Remove star"
                        className="mt-1.5 w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold hover:bg-amber-100 rounded-md"
                      >
                        <FiStar className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Starred
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Two-column layout: directory + side panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 items-start">
          {/* Main — all people on RecruAI */}
          <div className="lg:col-span-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2 justify-between mb-2">
              <h2 className="text-xs font-bold text-gray-900">People on RecruAI · {directoryFiltered.length}</h2>
              {search && directory.length > 0 && (
                <ClearFiltersButton onClear={() => setSearch("")} />
              )}
            </div>
            {directoryLoading ? (
              <div className="grid grid-cols-2 gap-2.5">
                {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="bg-white border border-gray-200 rounded-xl h-40 animate-pulse" />)}
              </div>
            ) : directoryFiltered.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4"><FiUsers className="w-7 h-7 text-gray-400" /></div>
                <h3 className="text-sm font-semibold text-gray-900">{directory.length === 0 ? "No people yet" : "No matches"}</h3>
                <p className="text-xs text-gray-500 mt-1">{directory.length === 0 ? "People who join RecruAI appear here." : "Try a different search."}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {directoryFiltered.map((u) => (
                  <PersonCard key={u.id} person={u} onView={() => navigate(`/organization/user/${u.id}`)} />
                ))}
              </div>
            )}
            {directoryHasMore && !directoryLoading && (
              <div className="flex justify-center pt-2">
                <button onClick={() => loadDirectory(directoryPage + 1)} disabled={directoryLoadingMore} className="px-5 py-2 bg-gray-900 text-white text-xs font-semibold hover:bg-black rounded-md disabled:opacity-60">
                  {directoryLoadingMore ? "Loading…" : "Load more people"}
                </button>
              </div>
            )}
          </div>

          {/* Side — applicant actions, accepted, CTA */}
          <ApplicantsPanel
            recentApps={recentApps}
            acceptedApps={acceptedApps}
            scheduledSet={scheduledSet}
            onOpenProfile={fetchCandidateProfile}
            onStatusChange={updateApplicationStatus}
            onSchedule={openSchedule}
            onToggleOnboard={toggleOnboardingStatus}
          />
        </div>
      </div>

      {/* Schedule interview modal */}
      {showScheduleInterview && selectedApplication && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Schedule interview</h3>
              <p className="text-xs text-gray-500 mt-1">For {selectedApplication.user?.name} • {selectedApplication.post?.title}</p>
            </div>
            <form onSubmit={scheduleInterview} className="p-6 space-y-3">
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
                <button type="button" onClick={() => { setShowScheduleInterview(false); resetInterviewForm(); }} className="px-5 py-2.5 bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50 rounded-md">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate profile modal */}
      {showCandidateProfile && candidateProfile && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 rounded-lg flex flex-col">
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
              {candidateProfile.skills?.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {candidateProfile.skills.map((s, i) => <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1">{s.name} {s.level && `(${s.level})`}</span>)}
                  </div>
                </div>
              )}
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

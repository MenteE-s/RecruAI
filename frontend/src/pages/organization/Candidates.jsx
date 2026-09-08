import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import { formatDate } from "../../utils/timezone";
import { FiUsers, FiSearch, FiX, FiEye, FiCalendar, FiBriefcase, FiCheckCircle, FiClock, FiMapPin } from "react-icons/fi";

export default function Candidates() {
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const { showToast } = useToast();
  const [applications, setApplications] = useState([]);
  const [organizationId, setOrganizationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showScheduleInterview, setShowScheduleInterview] = useState(false);
  const [showCandidateProfile, setShowCandidateProfile] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, has_more: false });
  const [search, setSearch] = useState("");
  const [interviewForm, setInterviewForm] = useState({ title: "", description: "", scheduled_at: "", duration_minutes: 60, interview_type: "text", interviewers: "" });

  useEffect(() => {
    const getOrgId = async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/auth/me`, { credentials: "include", headers: getAuthHeaders() });
        if (res.ok) setOrganizationId((await res.json()).user?.organization_id || null);
      } catch {}
    };
    getOrgId();
  }, []);

  const fetchApplications = useCallback(async (reset = false) => {
    if (!organizationId) return;
    try {
      if (reset) { setLoading(true); setApplications([]); setPagination((p) => ({ ...p, page: 1 })); }
      const currentPage = reset ? 1 : pagination.page;
      const params = new URLSearchParams({ page: currentPage, per_page: pagination.per_page });
      const res = await fetch(`${getBackendUrl()}/api/applications?${params}`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) {
        const result = await res.json();
        if (reset) setApplications(result.data);
        else setApplications((prev) => [...prev, ...result.data]);
        setPagination({ page: result.pagination.page, per_page: result.pagination.per_page, total: result.pagination.total, has_more: result.pagination.has_next });
      } else throw new Error("Failed to fetch applications");
    } catch (err) { showToast("Error fetching applications", "error"); }
    finally { if (reset) setLoading(false); }
  }, [organizationId, pagination.page, pagination.per_page]);

  useEffect(() => { if (organizationId) fetchApplications(true); }, [organizationId]);

  const updateApplicationStatus = useCallback(async (appId, status) => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/applications/${appId}`, { method: "PUT", headers: getAuthHeaders({ "Content-Type": "application/json" }), credentials: "include", body: JSON.stringify({ status }) });
      if (res.ok) { await fetchApplications(); showToast({ message: `Application ${status} successfully`, type: "success" }); } else showToast({ message: "Failed to update application status", type: "error" });
    } catch { showToast({ message: "Failed to update application status", type: "error" }); }
  }, [fetchApplications]);

  const fetchCandidateProfile = useCallback(async (userId) => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/users/${userId}/full-profile`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) { setCandidateProfile(await res.json()); setShowCandidateProfile(true); } else showToast({ message: "Failed to load candidate profile", type: "error" });
    } catch { showToast({ message: "Failed to load candidate profile", type: "error" }); }
  }, []);

  const scheduleInterview = async (e) => {
    e.preventDefault();
    try {
      const payload = { title: interviewForm.title, description: interviewForm.description, scheduled_at: new Date(interviewForm.scheduled_at).toISOString(), duration_minutes: interviewForm.duration_minutes, user_id: selectedApplication.user_id, organization_id: organizationId || 1, post_id: selectedApplication.post_id, interview_type: interviewForm.interview_type, interviewers: interviewForm.interviewers ? interviewForm.interviewers.split(",").map((i) => i.trim()) : [] };
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

  if (loading && applications.length === 0) {
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
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-xs font-medium tracking-wide mb-3">
                <FiUsers className="w-3.5 h-3.5" />
                CANDIDATES
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">Candidates</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Review applicants, update status, and schedule interviews.</p>
              <div className="mt-4 relative max-w-xl">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Search by candidate or position…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-9 py-3 bg-white text-gray-900 placeholder-gray-400 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded text-gray-500"><FiX className="w-4 h-4" /></button>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[380px]">
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{applications.length}</p>
                <p className="text-xs text-gray-300 mt-1">Applications</p>
              </div>
              <div className="bg-blue-500/20 backdrop-blur border border-blue-400/20 p-4 text-center">
                <p className="text-2xl font-bold text-blue-200">{applications.filter((a) => a.status === "pending").length}</p>
                <p className="text-xs text-blue-200 mt-1">Pending</p>
              </div>
              <div className="bg-green-500/20 backdrop-blur border border-green-400/20 p-4 text-center">
                <p className="text-2xl font-bold text-green-200">{applications.filter((a) => a.status === "accepted").length}</p>
                <p className="text-xs text-green-200 mt-1">Accepted</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-4"><FiUsers className="w-7 h-7 text-gray-400" /></div>
          <h3 className="text-lg font-semibold text-gray-900">No applications</h3>
          <p className="text-sm text-gray-500 mt-1">No applications received yet.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {filtered.map((application) => {
              const meta = getStatusMeta(application.status);
              return (
                <div key={application.id} className="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
                  <div className="p-5">
                    <div className="flex gap-4">
                      <div className="hidden sm:flex w-11 h-11 bg-gray-900 text-white items-center justify-center text-sm font-bold shrink-0">{(application.user?.name || "?")[0].toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="text-[15px] font-semibold text-gray-900">{application.user?.name || "Anonymous"}</h3>
                            <p className="text-sm text-blue-600 flex items-center gap-1.5 mt-0.5"><FiBriefcase className="w-3.5 h-3.5" /> Applied for: {application.post?.title}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><FiCalendar className="w-3 h-3" /> Applied {formatDate(application.applied_at)}</p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium border ${meta.color}`}>{meta.label}</span>
                        </div>
                        {application.cover_letter && <p className="text-sm text-gray-600 mt-3 bg-gray-50 border border-gray-200 p-3 line-clamp-3">{application.cover_letter}</p>}
                        {application.resume_url && <a href={application.resume_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2 font-medium">📄 View resume</a>}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <span className="text-xs bg-gray-50 text-gray-600 border border-gray-200 px-2 py-1 flex items-center gap-1"><FiMapPin className="w-3 h-3" />{application.post?.location || "Remote"}</span>
                          {application.post?.employment_type && <span className="text-xs bg-gray-50 text-gray-600 border border-gray-200 px-2 py-1">{application.post.employment_type}</span>}
                        </div>
                      </div>
                      <div className="hidden lg:flex flex-col gap-2 shrink-0 w-[180px]">
                        <select value={application.status} onChange={(e) => updateApplicationStatus(application.id, e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white">
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button onClick={() => { setSelectedApplication(application); setShowScheduleInterview(true); }} className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Schedule interview</button>
                        <button onClick={() => fetchCandidateProfile(application.user_id)} className="w-full px-3 py-2 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5"><FiEye className="w-4 h-4" /> View profile</button>
                        <button onClick={() => toggleOnboardingStatus(application.id, application.onboarded)} className={`w-full px-3 py-2 text-sm font-medium border ${application.onboarded ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" : "bg-green-600 text-white border-green-600 hover:bg-green-700"}`}>{application.onboarded ? "Offboard" : "Onboard"}</button>
                      </div>
                    </div>
                    <div className="mt-4 flex lg:hidden flex-wrap gap-2">
                      <select value={application.status} onChange={(e) => updateApplicationStatus(application.id, e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 text-sm">
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <button onClick={() => { setSelectedApplication(application); setShowScheduleInterview(true); }} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium">Schedule</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {pagination.has_more && (
            <div className="flex flex-col items-center gap-3 mt-6">
              <button onClick={() => fetchApplications(false)} className="px-6 py-3 bg-gray-900 text-white text-sm font-medium hover:bg-black">Load more candidates</button>
              <p className="text-xs text-gray-500">Showing {applications.length} of {pagination.total}</p>
            </div>
          )}
        </>
      )}

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
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

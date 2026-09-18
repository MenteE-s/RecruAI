import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import MenteeLoader from "../../components/ui/MenteeLoader";
import { getSidebarItems, getBackendUrl, getAuthHeaders, getCurrentUserId } from "../../utils/auth";
import { formatDate } from "../../utils/timezone";
import socketService from "../../utils/socket";
import {
  FiBookmark,
  FiCheckCircle,
  FiSearch,
  FiX,
  FiMapPin,
  FiBriefcase,
  FiDollarSign,
  FiCalendar,
  FiTrash2,
  FiArrowRight,
  FiEye,
  FiFilter,
  FiClock,
  FiFileText,
  FiLayers,
} from "react-icons/fi";

const getStatusMeta = (status) => {
  switch (status) {
    case "pending":
      return { label: "Pending review", color: "bg-amber-50 text-amber-700 border-amber-200", icon: FiClock };
    case "reviewed":
      return { label: "Under review", color: "bg-blue-50 text-blue-700 border-blue-200", icon: FiEye };
    case "accepted":
      return { label: "Accepted", color: "bg-green-50 text-green-700 border-green-200", icon: FiCheckCircle };
    case "rejected":
      return { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200", icon: FiX };
    case "withdrawn":
      return { label: "Withdrawn", color: "bg-gray-100 text-gray-600 border-gray-200", icon: FiTrash2 };
    default:
      return { label: status, color: "bg-gray-50 text-gray-700 border-gray-200", icon: FiFileText };
  }
};

const getCompanyInitials = (name) => {
  if (!name) return "CO";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
};

const formatSalary = (min, max, currency) => {
  if (!min && !max) return null;
  const cur = currency || "$";
  if (min && max) return `${cur}${Number(min).toLocaleString()} - ${cur}${Number(max).toLocaleString()}`;
  return `${cur}${Number(min || max).toLocaleString()}`;
};

export default function Jobs() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "applied" ? "applied" : "saved";
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [appliedPostIds, setAppliedPostIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const userId = await getCurrentUserId();
        if (!userId) return;
        const headers = getAuthHeaders();
        const [savedRes, appliedRes, appsRes] = await Promise.all([
          fetch(`${getBackendUrl()}/api/saved-jobs/user/${userId}`, { headers, credentials: "include" }).catch(() => null),
          fetch(`${getBackendUrl()}/api/applied-jobs/user/${userId}`, { headers, credentials: "include" }).catch(() => null),
          fetch(`${getBackendUrl()}/api/applications/user/${userId}`, { headers, credentials: "include" }).catch(() => null),
        ]);
        if (savedRes && savedRes.ok) setSavedJobs(await savedRes.json());
        if (appliedRes && appliedRes.ok) setAppliedJobs(await appliedRes.json());
        if (appsRes && appsRes.ok) {
          const data = await appsRes.json();
          const applications = data.data || data;
          if (Array.isArray(applications)) setAppliedPostIds(new Set(applications.map((app) => app.post_id)));
        }
      } catch (e) {
        console.error("Error loading jobs:", e);
      } finally {
        setLoading(false);
      }
    };
    load();

    const handleStageChange = (data) => {
      setAppliedJobs((prev) => prev.map((app) => (app.id === data.application_id ? { ...app, pipeline_stage: data.new_stage } : app)));
    };
    socketService.on("application_stage_changed", handleStageChange);
    return () => socketService.off("application_stage_changed", handleStageChange);
  }, []);

  const setTab = (t) => setParams(t === "applied" ? { tab: "applied" } : {});

  const handleUnsaveJob = async (savedId) => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/saved-jobs/${savedId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (response.ok) setSavedJobs((prev) => prev.filter((job) => job.id !== savedId));
    } catch (error) {
      console.error("Error unsaving job:", error);
    }
  };

  const handleApplyJob = async (postId) => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/applications`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ post_id: postId, cover_letter: "", resume_url: "" }),
      });
      if (response.ok) setAppliedPostIds((prev) => new Set([...prev, postId]));
    } catch (error) {
      console.error("Error applying to job:", error);
    }
  };

  const handleCancelApplication = async (applicationId) => {
    if (!window.confirm("Are you sure you want to cancel this job application?")) return;
    setCancelling(applicationId);
    try {
      const response = await fetch(`${getBackendUrl()}/api/applied-jobs/${applicationId}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        setAppliedJobs((prev) => prev.map((app) => (app.id === applicationId ? { ...app, status: "withdrawn", pipeline_stage: "withdrawn" } : app)));
      } else {
        const error = await response.json();
        alert(error.error || "Failed to cancel application");
      }
    } catch (error) {
      alert("Failed to cancel application");
    } finally {
      setCancelling(null);
    }
  };

  const savedFiltered = useMemo(() => {
    if (!search) return savedJobs;
    const q = search.toLowerCase();
    return savedJobs.filter((sj) => {
      const job = sj.post;
      if (!job) return false;
      return job.title?.toLowerCase().includes(q) || job.organization?.name?.toLowerCase().includes(q) || job.location?.toLowerCase().includes(q);
    });
  }, [savedJobs, search]);

  const appliedFiltered = useMemo(() => {
    return appliedJobs.filter((app) => {
      const job = app.post;
      if (!job) return false;
      const matchesSearch = !search || job.title?.toLowerCase().includes(search.toLowerCase()) || job.organization?.name?.toLowerCase().includes(search.toLowerCase()) || app.pipeline_stage?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appliedJobs, search, statusFilter]);

  const stats = {
    total: appliedJobs.length,
    pending: appliedJobs.filter((a) => a.status === "pending").length,
    reviewed: appliedJobs.filter((a) => a.status === "reviewed").length,
    accepted: appliedJobs.filter((a) => a.status === "accepted").length,
  };

  const statuses = ["pending", "reviewed", "accepted", "rejected", "withdrawn"];

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="w-full max-w-3xl mx-auto space-y-2.5">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight">Jobs</h1>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {savedJobs.length} saved · {appliedJobs.length} applied
          </p>
        </div>

        {/* Internal tabs — same pattern as Interviews */}
        <div className="flex gap-1.5 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          {[
            { id: "saved", label: `Saved (${savedJobs.length})`, icon: FiBookmark },
            { id: "applied", label: `Applied (${appliedJobs.length})`, icon: FiCheckCircle },
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
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder={tab === "saved" ? "Filter by title, company, location…" : "Filter by title, company, stage…"}
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

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
            <MenteeLoader size={52} text="Loading jobs…" />
          </div>
        ) : tab === "saved" ? (
          savedFiltered.length === 0 ? (
            <div className="bg-white border border-gray-200 p-12 text-center">
              <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FiBookmark className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{savedJobs.length === 0 ? "No saved jobs yet" : "No matches"}</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">{savedJobs.length === 0 ? "Tap the bookmark on any job to save it here for later." : `No saved jobs match “${search}”. Try a different keyword.`}</p>
              <div className="mt-6 flex justify-center gap-3">
                {search ? (
                  <button onClick={() => setSearch("")} className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-black transition-colors"><FiX className="w-4 h-4" /> Clear search</button>
                ) : (
                  <button onClick={() => navigate("/dashboard")} className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-black transition-colors">Browse jobs <FiArrowRight className="w-4 h-4" /></button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {savedFiltered.map((savedJob) => {
                const job = savedJob.post;
                if (!job) return null;
                const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
                const applied = appliedPostIds.has(job.id);
                return (
                  <div key={savedJob.id} className="group bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
                    <div className="p-5">
                      <div className="flex gap-4">
                        <div className="hidden sm:flex w-11 h-11 bg-gray-900 text-white items-center justify-center text-sm font-bold shrink-0">{getCompanyInitials(job.organization?.name)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Link to={`/jobs/${job.id}`} className="text-[15px] font-semibold text-gray-900 hover:text-blue-600 leading-tight">{job.title}</Link>
                              <p className="text-sm text-gray-600 mt-0.5 flex items-center gap-1.5"><FiBriefcase className="w-3.5 h-3.5 text-gray-400" />{job.organization?.name || "Unknown"} {job.location && <><span className="text-gray-300">•</span><span className="flex items-center gap-1"><FiMapPin className="w-3 h-3 text-gray-400" />{job.location}</span></>}</p>
                            </div>
                            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 shrink-0"><FiCalendar className="w-3 h-3" /> Saved {formatDate(savedJob.saved_at)}</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {job.employment_type && <span className="inline-flex items-center gap-1.5 text-xs bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1"><FiBriefcase className="w-3 h-3 text-gray-400" />{job.employment_type}</span>}
                            {job.category && <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1">{job.category}</span>}
                            {salary && <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1"><FiDollarSign className="w-3 h-3" />{salary}</span>}
                            <span className="sm:hidden inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1"><FiCalendar className="w-3 h-3" />{formatDate(savedJob.saved_at)}</span>
                          </div>
                        </div>
                        <div className="hidden lg:flex flex-col gap-2 shrink-0 w-[148px]">
                          {applied ? (
                            <span className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 text-sm font-medium"><FiCheckCircle className="w-4 h-4" /> Applied</span>
                          ) : (
                            <button onClick={() => handleApplyJob(job.id)} className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">Apply now</button>
                          )}
                          <button onClick={() => handleUnsaveJob(savedJob.id)} className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 text-sm font-medium hover:bg-gray-50"><FiTrash2 className="w-4 h-4" /> Remove</button>
                          <Link to={`/jobs/${job.id}`} className="text-center text-xs font-medium text-blue-600 hover:text-blue-700">View details →</Link>
                        </div>
                      </div>
                      <div className="mt-4 flex lg:hidden gap-2">
                        {applied ? (
                          <span className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 text-sm font-medium"><FiCheckCircle className="w-4 h-4" /> Applied</span>
                        ) : (
                          <button onClick={() => handleApplyJob(job.id)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Apply</button>
                        )}
                        <button onClick={() => handleUnsaveJob(savedJob.id)} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium"><FiTrash2 className="w-4 h-4" /> Remove</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <>
            {/* Status filter — only on Applied tab */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <FiFilter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-900">Filter by status</span>
                {statusFilter && <button onClick={() => setStatusFilter("")} className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium">Clear</button>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setStatusFilter("")} className={`px-3.5 py-1.5 text-xs font-medium border transition-colors ${!statusFilter ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
                  All • {stats.total}
                </button>
                {statuses.map((s) => {
                  const meta = getStatusMeta(s);
                  const count = appliedJobs.filter((a) => a.status === s).length;
                  if (count === 0) return null;
                  return (
                    <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "" : s)} className={`px-3.5 py-1.5 text-xs font-medium border transition-colors ${statusFilter === s ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
                      {meta.label} • {count}
                    </button>
                  );
                })}
              </div>
              {(search || statusFilter) && <p className="text-xs text-gray-500 mt-3">Showing {appliedFiltered.length} of {appliedJobs.length} • {search && `“${search}”`} {statusFilter && `status: ${statusFilter}`}</p>}
            </div>

            {appliedFiltered.length === 0 ? (
              <div className="bg-white border border-gray-200 p-12 text-center">
                <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <FiBriefcase className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{appliedJobs.length === 0 ? "No applications yet" : "No matches"}</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">{appliedJobs.length === 0 ? "Once you apply to jobs, they will appear here with real-time status updates." : "Try adjusting your search or status filter."}</p>
                <div className="mt-6 flex justify-center gap-3">
                  {appliedJobs.length === 0 ? (
                    <button onClick={() => navigate("/dashboard")} className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-black transition-colors">Browse jobs <FiArrowRight className="w-4 h-4" /></button>
                  ) : (
                    <button onClick={() => { setSearch(""); setStatusFilter(""); }} className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-black"><FiX className="w-4 h-4" /> Clear filters</button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {appliedFiltered.map((application) => {
                  const job = application.post;
                  if (!job) return null;
                  const meta = getStatusMeta(application.status);
                  const StatusIcon = meta.icon;
                  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
                  return (
                    <div key={application.id} className="group bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
                      <div className="p-5">
                        <div className="flex gap-4">
                          <div className="hidden sm:flex w-11 h-11 bg-gray-900 text-white items-center justify-center text-sm font-bold shrink-0">{getCompanyInitials(job.organization?.name)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Link to={`/jobs/${job.id}`} className="text-[15px] font-semibold text-gray-900 hover:text-blue-600 leading-tight">{job.title}</Link>
                                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium border px-2.5 py-1 ${meta.color}`}><StatusIcon className="w-3.5 h-3.5" />{meta.label}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 flex flex-wrap items-center gap-1.5">
                                  <span className="flex items-center gap-1"><FiBriefcase className="w-3.5 h-3.5 text-gray-400" />{job.organization?.name || "Unknown"}</span>
                                  {job.location && <><span className="text-gray-300">•</span><span className="flex items-center gap-1"><FiMapPin className="w-3 h-3 text-gray-400" />{job.location}</span></>}
                                </p>
                              </div>
                              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs bg-gray-50 text-gray-600 border border-gray-200 px-2.5 py-1 shrink-0"><FiCalendar className="w-3 h-3" /> Applied {formatDate(application.applied_at)}</span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {application.pipeline_stage && <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1"><FiLayers className="w-3 h-3" />{application.pipeline_stage.replace("_", " ")}</span>}
                              {salary && <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1"><FiDollarSign className="w-3 h-3" />{salary}</span>}
                              <span className="sm:hidden inline-flex items-center gap-1.5 text-xs bg-gray-50 text-gray-600 border border-gray-200 px-2.5 py-1"><FiCalendar className="w-3 h-3" />{formatDate(application.applied_at)}</span>
                            </div>
                          </div>
                          <div className="hidden lg:flex flex-col gap-2 shrink-0 w-[160px]">
                            <button onClick={() => navigate(`/jobs/${job.id}`)} className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"><FiEye className="w-4 h-4" /> View details</button>
                            {application.status !== "accepted" && application.status !== "rejected" && application.status !== "withdrawn" ? (
                              <button onClick={() => handleCancelApplication(application.id)} disabled={cancelling === application.id} className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-red-600 border border-red-200 text-sm font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"><FiTrash2 className="w-4 h-4" />{cancelling === application.id ? "Cancelling…" : "Cancel"}</button>
                            ) : (
                              <span className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-gray-50 text-gray-500 border border-gray-200 text-xs font-medium">{meta.label}</span>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex lg:hidden gap-2">
                          <button onClick={() => navigate(`/jobs/${job.id}`)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"><FiEye className="w-4 h-4" /> View</button>
                          {application.status !== "accepted" && application.status !== "rejected" && application.status !== "withdrawn" && (
                            <button onClick={() => handleCancelApplication(application.id)} disabled={cancelling === application.id} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-red-600 border border-red-200 text-sm font-medium disabled:opacity-50"><FiTrash2 className="w-4 h-4" />{cancelling === application.id ? "…" : "Cancel"}</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import { getBackendUrl, getAuthHeaders, getSidebarItems } from "../../utils/auth";
import { useNavigate, Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { formatDate } from "../../utils/timezone";
import socketService from "../../utils/socket";
import {
  FiBriefcase,
  FiMapPin,
  FiDollarSign,
  FiCalendar,
  FiSearch,
  FiX,
  FiFilter,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiTrash2,
  FiArrowRight,
  FiFileText,
  FiLayers,
} from "react-icons/fi";

export default function AppliedJobs() {
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const navigate = useNavigate();

  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchAppliedJobs();
    const handleStageChange = (data) => {
      setAppliedJobs((prev) => prev.map((app) => (app.id === data.application_id ? { ...app, pipeline_stage: data.new_stage } : app)));
    };
    socketService.on("application_stage_changed", handleStageChange);
    return () => socketService.off("application_stage_changed", handleStageChange);
  }, []);

  const fetchAppliedJobs = async () => {
    try {
      const userId = 1;
      const response = await fetch(`${getBackendUrl()}/api/applied-jobs/user/${userId}`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setAppliedJobs(data);
      }
    } catch (error) {
      console.error("Error fetching applied jobs:", error);
    } finally {
      setLoading(false);
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
        setAppliedJobs(appliedJobs.map((app) => (app.id === applicationId ? { ...app, status: "withdrawn", pipeline_stage: "withdrawn" } : app)));
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

  const filtered = useMemo(() => {
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

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-gray-900 h-44 animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 p-5 animate-pulse">
              <div className="h-5 bg-gray-100 w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 w-1/2" />
            </div>
          ))}
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
                <FiFileText className="w-3.5 h-3.5" />
                APPLICATIONS
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">Applied jobs</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Track every application, stage, and outcome — stay on top of your pipeline.</p>
              <div className="mt-5 relative max-w-xl">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by title, company, or stage…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-9 py-3 bg-white text-gray-900 placeholder-gray-400 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded text-gray-500">
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 lg:w-[420px]">
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-300 mt-1">Total</p>
              </div>
              <div className="bg-amber-500/20 backdrop-blur border border-amber-400/20 p-4 text-center">
                <p className="text-2xl font-bold text-amber-200">{stats.pending}</p>
                <p className="text-xs text-amber-200 mt-1">Pending</p>
              </div>
              <div className="bg-blue-500/20 backdrop-blur border border-blue-400/20 p-4 text-center">
                <p className="text-2xl font-bold text-blue-200">{stats.reviewed}</p>
                <p className="text-xs text-blue-200 mt-1">Review</p>
              </div>
              <div className="bg-green-500/20 backdrop-blur border border-green-400/20 p-4 text-center">
                <p className="text-2xl font-bold text-green-300">{stats.accepted}</p>
                <p className="text-xs text-green-200 mt-1">Accepted</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status filter */}
      <div className="bg-white border border-gray-200 p-4 mb-6">
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
        {(search || statusFilter) && <p className="text-xs text-gray-500 mt-3">Showing {filtered.length} of {appliedJobs.length} • {search && `“${search}”`} {statusFilter && `status: ${statusFilter}`}</p>}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FiBriefcase className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{appliedJobs.length === 0 ? "No applications yet" : "No matches"}</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">{appliedJobs.length === 0 ? "Once you apply to jobs, they will appear here with real-time status updates." : "Try adjusting your search or status filter."}</p>
          <div className="mt-6 flex justify-center gap-3">
            {appliedJobs.length === 0 ? (
              <button onClick={() => navigate("/jobs")} className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-black transition-colors">Browse jobs <FiArrowRight className="w-4 h-4" /></button>
            ) : (
              <button onClick={() => { setSearch(""); setStatusFilter(""); }} className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-black"><FiX className="w-4 h-4" /> Clear filters</button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((application) => {
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
    </DashboardLayout>
  );
}

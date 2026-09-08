import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { formatDate } from "../../utils/timezone";
import {
  FiBookmark,
  FiSearch,
  FiX,
  FiMapPin,
  FiBriefcase,
  FiDollarSign,
  FiCalendar,
  FiTrash2,
  FiArrowRight,
  FiCheckCircle,
} from "react-icons/fi";

export default function SavedJobs() {
  const navigate = useNavigate();
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSavedJobs();
    fetchAppliedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const userId = 1;
      const response = await fetch(`${getBackendUrl()}/api/saved-jobs/user/${userId}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setSavedJobs(data);
      }
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliedJobs = async () => {
    try {
      const userId = 1;
      const response = await fetch(`${getBackendUrl()}/api/applications/user/${userId}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        const applications = data.data || data;
        setAppliedJobs(new Set(applications.map((app) => app.post_id)));
      }
    } catch (error) {
      console.error("Error fetching applied jobs:", error);
    }
  };

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
      const userId = 1;
      const response = await fetch(`${getBackendUrl()}/api/applications`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_id: userId, post_id: postId, cover_letter: "", resume_url: "" }),
      });
      if (response.ok) setAppliedJobs((prev) => new Set([...prev, postId]));
    } catch (error) {
      console.error("Error applying to job:", error);
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
    if (!search) return savedJobs;
    const q = search.toLowerCase();
    return savedJobs.filter((sj) => {
      const job = sj.post;
      if (!job) return false;
      return job.title?.toLowerCase().includes(q) || job.organization?.name?.toLowerCase().includes(q) || job.location?.toLowerCase().includes(q);
    });
  }, [savedJobs, search]);

  const appliedSavedCount = savedJobs.filter((sj) => sj.post && appliedJobs.has(sj.post.id)).length;

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
                <FiBookmark className="w-3.5 h-3.5" />
                SAVED
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">Saved jobs</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Jobs you’ve bookmarked for later. Apply when you’re ready or remove ones you no longer need.</p>
              <div className="mt-5 relative max-w-xl">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search saved jobs by title or company…"
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
            <div className="grid grid-cols-3 gap-3 lg:w-[340px]">
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{savedJobs.length}</p>
                <p className="text-xs text-gray-300 mt-1">Saved</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{appliedSavedCount}</p>
                <p className="text-xs text-gray-300 mt-1">Applied</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{savedJobs.length - appliedSavedCount}</p>
                <p className="text-xs text-gray-300 mt-1">Pending</p>
              </div>
              <div className="col-span-3 bg-white text-gray-900 p-3 flex items-center justify-between">
                <span className="text-sm font-medium">{filtered.length} shown</span>
                <button onClick={() => navigate("/jobs")} className="text-sm font-semibold text-blue-600 hover:text-blue-700">Browse all jobs →</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
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
              <button onClick={() => navigate("/jobs")} className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-black transition-colors">Browse jobs <FiArrowRight className="w-4 h-4" /></button>
            )}
            <Link to="/jobs/saved" className="hidden" />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((savedJob) => {
            const job = savedJob.post;
            if (!job) return null;
            const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
            const applied = appliedJobs.has(job.id);
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
      )}
    </DashboardLayout>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, getBackendUrl, getAuthHeaders, getCurrentUserId } from "../../utils/auth";
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
      const userId = await getCurrentUserId();
      if (!userId) { setLoading(false); return; }
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
      const userId = await getCurrentUserId();
      if (!userId) return;
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
      const response = await fetch(`${getBackendUrl()}/api/applications`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ post_id: postId, cover_letter: "", resume_url: "" }),
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

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-4 mt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-[320px] bg-gray-200 animate-pulse rounded-lg" />
            <div className="h-9 w-24 bg-gray-100 animate-pulse rounded" />
          </div>
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
      {/* Filter */}
      <div className="flex items-center gap-3 mb-4 mt-6">
        <div className="relative flex-1 max-w-xl">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search saved jobs by title or company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded text-gray-500">
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
          <FiBookmark className="w-3.5 h-3.5" />
          <span>{filtered.length} of {savedJobs.length} shown</span>
          {search && (
            <button onClick={() => setSearch("")} className="text-blue-600 hover:text-blue-700 font-medium ml-1">Clear</button>
          )}
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
              <button onClick={() => navigate("/dashboard")} className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-black transition-colors">Browse jobs <FiArrowRight className="w-4 h-4" /></button>
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

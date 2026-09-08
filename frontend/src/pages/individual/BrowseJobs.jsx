import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  getSidebarItems,
  getBackendUrl,
  getAuthHeaders,
} from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import {
  useDebounce,
  LoadingSkeleton,
  ListErrorBoundary,
  sanitizeHtml,
  truncateText,
} from "../../utils/performance";
import {
  FiSearch,
  FiMapPin,
  FiBriefcase,
  FiTag,
  FiDollarSign,
  FiClock,
  FiBookmark,
  FiCheckCircle,
  FiStar,
  FiFilter,
  FiX,
  FiChevronDown,
  FiTrendingUp,
  FiCalendar,
} from "react-icons/fi";

export default function BrowseJobs() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    has_more: false,
  });
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    location: "",
    employment_type: "",
  });

  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const debouncedSearch = useDebounce(filters.search, 300);

  const fetchRecommendedJobs = useCallback(async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/recommendations/jobs`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setRecommendedJobs(data.recommendations || []);
      }
    } catch (error) {
      console.error("Error fetching recommended jobs:", error);
    }
  }, []);

  useEffect(() => {
    fetchJobs(true);
    fetchSavedJobs();
    fetchAppliedJobs();
  }, [debouncedSearch, filters.category, filters.location, filters.employment_type]);

  useEffect(() => {
    fetchRecommendedJobs();
  }, [fetchRecommendedJobs]);

  const fetchJobs = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          setLoading(true);
          setJobs([]);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }
        const currentPage = reset ? 1 : pagination.page;
        const params = new URLSearchParams({
          page: currentPage,
          per_page: pagination.per_page,
          status: "active",
        });
        if (debouncedSearch) params.append("search", debouncedSearch);
        if (filters.category) params.append("category", filters.category);
        if (filters.location) params.append("location", filters.location);
        if (filters.employment_type) params.append("employment_type", filters.employment_type);

        const response = await fetch(`${getBackendUrl()}/api/posts?${params}`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          const newJobs = data.data || [];
          if (reset) setJobs(newJobs);
          else setJobs((prev) => [...prev, ...newJobs]);
          setPagination({
            page: data.page || currentPage,
            per_page: data.per_page || pagination.per_page,
            total: data.total || 0,
            has_more: data.has_more || false,
          });
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
        showToast("Failed to load jobs. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.per_page, debouncedSearch, filters.category, filters.location, filters.employment_type, showToast]
  );

  const fetchSavedJobs = async () => {
    try {
      const userId = 1;
      const response = await fetch(`${getBackendUrl()}/api/saved-jobs/user/${userId}`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSavedJobs(new Set(data.map((saved) => saved.post_id)));
      }
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
    }
  };

  const fetchAppliedJobs = async () => {
    try {
      const userId = 1;
      const response = await fetch(`${getBackendUrl()}/api/applications/user/${userId}`, {
        headers: getAuthHeaders(),
        credentials: "include",
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

  const handleSaveJob = useCallback(
    async (postId) => {
      try {
        const userId = 1;
        const response = await fetch(`${getBackendUrl()}/api/saved-jobs`, {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ user_id: userId, post_id: postId }),
        });
        if (response.ok) {
          setSavedJobs((prev) => new Set([...prev, postId]));
          showToast({ message: "Job saved successfully!", type: "success" });
        } else showToast({ message: "Failed to save job", type: "error" });
      } catch (error) {
        showToast({ message: "Failed to save job", type: "error" });
      }
    },
    [showToast]
  );

  const handleUnsaveJob = useCallback(async (savedId) => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/saved-jobs/${savedId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (response.ok) {
        const savedJob = await fetch(`${getBackendUrl()}/api/saved-jobs/user/1`, {
          headers: getAuthHeaders(),
        })
          .then((r) => r.json())
          .then((data) => data.find((sj) => sj.id === savedId));
        if (savedJob) {
          setSavedJobs((prev) => {
            const newSet = new Set(prev);
            newSet.delete(savedJob.post_id);
            return newSet;
          });
        }
      }
    } catch (error) {
      console.error("Error unsaving job:", error);
    }
  }, []);

  const handleApplyJob = async (postId) => {
    try {
      const userId = 1;
      const response = await fetch(`${getBackendUrl()}/api/applications`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_id: userId, post_id: postId, cover_letter: "", resume_url: "" }),
      });
      if (response.ok) {
        setAppliedJobs((prev) => new Set([...prev, postId]));
        setShowApplyConfirm(false);
        showToast({ message: "Application submitted successfully!", type: "success", position: "center" });
      } else showToast({ message: "Failed to submit application", type: "error" });
    } catch (error) {
      showToast({ message: "Failed to submit application", type: "error" });
    }
  };

  const getUniqueValues = (key) => {
    const values = jobs.map((job) => job[key]).filter(Boolean);
    return [...new Set(values)];
  };

  const activeFiltersCount = [filters.category, filters.location, filters.employment_type, debouncedSearch].filter(Boolean).length;
  const clearFilters = () => setFilters({ search: "", category: "", location: "", employment_type: "" });

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

  const isDeadlineSoon = (deadline) => {
    if (!deadline) return false;
    const diff = (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  };

  if (loading && jobs.length === 0) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-gray-900 h-48 animate-pulse" />
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
          <LoadingSkeleton count={4} height={180} />
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
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-xs font-medium tracking-wide mb-3">
                <FiTrendingUp className="w-3.5 h-3.5" />
                {pagination.total} OPEN POSITIONS
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">Find your next opportunity</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Discover roles matched to your skills. Save, apply, and track everything in one place.</p>
              <div className="mt-5 relative max-w-2xl">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by title, company, or keyword…"
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-11 pr-4 py-3.5 bg-white text-gray-900 placeholder-gray-400 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                {filters.search && (
                  <button onClick={() => setFilters((p) => ({ ...p, search: "" }))} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded text-gray-500">
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="text-gray-400">Try:</span>
                {["Remote", "Product Designer", "Engineering", "Marketing"].map((k) => (
                  <button key={k} onClick={() => setFilters((p) => ({ ...p, search: k }))} className="px-2.5 py-1 bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-colors">
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[340px]">
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{pagination.total || jobs.length}</p>
                <p className="text-xs text-gray-300 mt-1">Jobs</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{savedJobs.size}</p>
                <p className="text-xs text-gray-300 mt-1">Saved</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{appliedJobs.size}</p>
                <p className="text-xs text-gray-300 mt-1">Applied</p>
              </div>
              <div className="col-span-3 bg-white text-gray-900 p-3 flex items-center justify-between">
                <span className="text-sm font-medium">Need tailored matches?</span>
                <button onClick={() => document.getElementById("recommended")?.scrollIntoView({ behavior: "smooth" })} className="text-sm font-semibold text-blue-600 hover:text-blue-700">View recommended →</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiFilter className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
            {activeFiltersCount > 0 && <span className="text-xs bg-blue-600 text-white px-2 py-0.5">{activeFiltersCount} active</span>}
          </div>
          {activeFiltersCount > 0 && (
            <button onClick={clearFilters} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
              <FiX className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
            <div className="relative">
              <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white appearance-none"
              >
                <option value="">All categories</option>
                {getUniqueValues("category").map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Location</label>
            <div className="relative">
              <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="City, state, or Remote"
                value={filters.location}
                onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Employment type</label>
            <div className="relative">
              <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filters.employment_type}
                onChange={(e) => setFilters((prev) => ({ ...prev, employment_type: e.target.value }))}
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white appearance-none"
              >
                <option value="">All types</option>
                {getUniqueValues("employment_type").map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>
        {activeFiltersCount > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.category && <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1">Category: {filters.category} <button onClick={() => setFilters((p) => ({ ...p, category: "" }))} className="hover:text-blue-900"><FiX className="w-3 h-3" /></button></span>}
            {filters.location && <span className="inline-flex items-center gap-1.5 text-xs bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1">Location: {filters.location} <button onClick={() => setFilters((p) => ({ ...p, location: "" }))} className="hover:text-gray-900"><FiX className="w-3 h-3" /></button></span>}
            {filters.employment_type && <span className="inline-flex items-center gap-1.5 text-xs bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1">Type: {filters.employment_type} <button onClick={() => setFilters((p) => ({ ...p, employment_type: "" }))} className="hover:text-gray-900"><FiX className="w-3 h-3" /></button></span>}
            {debouncedSearch && <span className="inline-flex items-center gap-1.5 text-xs bg-gray-900 text-white px-2.5 py-1">“{debouncedSearch}” <button onClick={() => setFilters((p) => ({ ...p, search: "" }))} className="hover:text-gray-300"><FiX className="w-3 h-3" /></button></span>}
          </div>
        )}
      </div>

      {/* Recommended */}
      {recommendedJobs.length > 0 && (
        <div id="recommended" className="bg-white border border-gray-200 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 backdrop-blur flex items-center justify-center">
                <FiStar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Recommended for you</h2>
                <p className="text-blue-100 text-xs">AI-matched based on your profile & skills</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex text-xs font-medium bg-white text-blue-600 px-3 py-1">{recommendedJobs.length} matches</span>
          </div>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recommendedJobs.slice(0, 4).map((rec, idx) => (
              <div key={`rec-${rec.id}-${idx}`} onClick={() => navigate(`/jobs/${rec.job.id}`)} className="group cursor-pointer border border-blue-100 bg-blue-50/50 hover:bg-white hover:border-blue-200 hover:shadow-sm p-4 transition-all">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">{getCompanyInitials(rec.job.organization?.name || rec.job.company_name)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 text-sm leading-tight truncate">{sanitizeHtml(rec.job.title)}</h3>
                    <p className="text-xs text-gray-600 truncate">{rec.job.organization?.name || rec.job.company_name || "—"}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-0.5">{((rec.similarity_score || 0) * 100).toFixed(0)}% match</span>
                      {rec.job.location && <span className="text-xs text-gray-500 truncate">{rec.job.location}</span>}
                    </div>
                    {rec.explanation && <p className="mt-2 text-xs text-gray-600 line-clamp-2 bg-white border border-blue-100 p-2">{rec.explanation}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">
          {loading ? "Loading…" : `${pagination.total || jobs.length} opportunities`}
          {activeFiltersCount > 0 && <span className="font-normal text-gray-500"> • filtered</span>}
        </h2>
        <span className="text-xs text-gray-500">Showing {jobs.length} of {pagination.total} • Page {pagination.page}</span>
      </div>

      <ListErrorBoundary>
        {jobs.length === 0 && !loading ? (
          <div className="bg-white border border-gray-200 p-12 text-center">
            <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FiSearch className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No jobs found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">Try adjusting your filters or search terms. Clear filters to see all open positions.</p>
            <button onClick={clearFilters} className="mt-5 inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-black transition-colors">
              <FiX className="w-4 h-4" /> Clear filters
            </button>
            <div className="mt-6 flex justify-center gap-2">
              <Link to="/jobs/saved" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View saved jobs →</Link>
              <span className="text-gray-300">•</span>
              <Link to="/profile" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Update profile for better matches</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
              const soon = isDeadlineSoon(job.application_deadline);
              const applied = appliedJobs.has(job.id);
              const saved = savedJobs.has(job.id);
              return (
                <div key={job.id} className="group bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
                  <div className="p-5">
                    <div className="flex gap-4">
                      <div className="hidden sm:flex w-11 h-11 bg-gray-900 text-white items-center justify-center text-sm font-bold shrink-0">{getCompanyInitials(job.organization?.name)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link to={`/jobs/${job.id}`} className="group/title inline-flex items-start gap-2">
                              <h3 className="text-[15px] font-semibold text-gray-900 group-hover/title:text-blue-600 leading-tight">{sanitizeHtml(job.title)}</h3>
                              {applied && <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 shrink-0"><FiCheckCircle className="w-3 h-3" /> Applied</span>}
                              {soon && !applied && <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 shrink-0"><FiClock className="w-3 h-3" /> Closing soon</span>}
                            </Link>
                            <p className="text-sm text-gray-600 mt-0.5 flex items-center gap-1.5">
                              <FiBriefcase className="w-3.5 h-3.5 text-gray-400" /> {job.organization?.name || "Unknown organization"}
                            </p>
                          </div>
                          <Link to={`/jobs/${job.id}`} className="hidden md:inline-flex text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-1.5 hover:bg-gray-50 transition-colors">View details</Link>
                        </div>
                        <p className="text-sm text-gray-600 mt-2.5 line-clamp-2 leading-relaxed">{truncateText(job.description, 180)}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {job.location && <span className="inline-flex items-center gap-1.5 text-xs bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1"><FiMapPin className="w-3 h-3 text-gray-400" /> {job.location}</span>}
                          {job.employment_type && <span className="inline-flex items-center gap-1.5 text-xs bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1"><FiBriefcase className="w-3 h-3 text-gray-400" /> {job.employment_type}</span>}
                          {job.category && <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1"><FiTag className="w-3 h-3" /> {job.category}</span>}
                          {salary && <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1"><FiDollarSign className="w-3 h-3" /> {salary}</span>}
                          {job.application_deadline && <span className={`inline-flex items-center gap-1.5 text-xs border px-2.5 py-1 ${soon ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}><FiCalendar className="w-3 h-3" /> {new Date(job.application_deadline).toLocaleDateString()}</span>}
                        </div>
                        {job.requirements && job.requirements.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {job.requirements.slice(0, 3).map((req, i) => (
                              <span key={i} className="text-xs text-gray-600 bg-white border border-gray-200 px-2 py-1 max-w-[220px] truncate">{sanitizeHtml(req)}</span>
                            ))}
                            {job.requirements.length > 3 && <span className="text-xs text-gray-500 px-1 py-1">+{job.requirements.length - 3} more</span>}
                          </div>
                        )}
                      </div>
                      <div className="hidden lg:flex flex-col gap-2 shrink-0 w-[148px]">
                        {applied ? (
                          <button disabled className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 text-sm font-medium cursor-not-allowed"><FiCheckCircle className="w-4 h-4" /> Applied</button>
                        ) : (
                          <button onClick={() => { setSelectedJob(job); setShowApplyConfirm(true); }} className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">Apply now</button>
                        )}
                        {saved ? (
                          <button onClick={() => fetch(`${getBackendUrl()}/api/saved-jobs/check?user_id=1&post_id=${job.id}`).then((r) => r.json()).then((d) => { if (d.saved_id) handleUnsaveJob(d.saved_id); })} className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium hover:bg-black transition-colors"><FiBookmark className="w-4 h-4 fill-white" /> Saved</button>
                        ) : (
                          <button onClick={() => handleSaveJob(job.id)} className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors"><FiBookmark className="w-4 h-4" /> Save</button>
                        )}
                        <Link to={`/jobs/${job.id}`} className="md:hidden inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-blue-600 hover:text-blue-700">View details →</Link>
                      </div>
                    </div>
                    <div className="mt-4 flex lg:hidden gap-2">
                      {applied ? (
                        <button disabled className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 text-sm font-medium cursor-not-allowed"><FiCheckCircle className="w-4 h-4" /> Applied</button>
                      ) : (
                        <button onClick={() => { setSelectedJob(job); setShowApplyConfirm(true); }} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Apply</button>
                      )}
                      {saved ? (
                        <button onClick={() => fetch(`${getBackendUrl()}/api/saved-jobs/check?user_id=1&post_id=${job.id}`).then((r) => r.json()).then((d) => { if (d.saved_id) handleUnsaveJob(d.saved_id); })} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium"><FiBookmark className="w-4 h-4 fill-white" /> Saved</button>
                      ) : (
                        <button onClick={() => handleSaveJob(job.id)} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium"><FiBookmark className="w-4 h-4" /> Save</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {pagination.has_more && (
              <div className="flex flex-col items-center gap-3 pt-2">
                <button onClick={() => fetchJobs(false)} disabled={loading} className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors">
                  {loading ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Loading…</> : <>Load more jobs <FiChevronDown className="w-4 h-4" /></>}
                </button>
                <p className="text-xs text-gray-500">Showing {jobs.length} of {pagination.total} • {pagination.total - jobs.length} remaining</p>
              </div>
            )}
            {!pagination.has_more && jobs.length > 0 && <p className="text-center text-xs text-gray-500 pt-2">You’ve seen all {pagination.total} jobs • <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="text-blue-600 hover:text-blue-700 font-medium">Back to top</button></p>}
          </div>
        )}
      </ListErrorBoundary>

      {showApplyConfirm && selectedJob && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-md w-full border border-gray-200 shadow-xl">
            <div className="px-6 pt-6">
              <div className="w-11 h-11 bg-blue-600 flex items-center justify-center mb-4">
                <FiBriefcase className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Apply for this role?</h3>
              <p className="text-sm text-gray-600 mt-2">You’re about to apply for <span className="font-semibold text-gray-900">{selectedJob.title}</span> at <span className="font-semibold text-gray-900">{selectedJob.organization?.name}</span>.</p>
              <div className="mt-4 bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600">
                Make sure your profile is up to date. Your application will be visible to the hiring team.
              </div>
            </div>
            <div className="px-6 py-5 flex gap-3">
              <button onClick={() => handleApplyJob(selectedJob.id)} className="flex-1 bg-blue-600 text-white py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors">Yes, apply</button>
              <button onClick={() => { setShowApplyConfirm(false); setSelectedJob(null); }} className="px-5 py-2.5 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

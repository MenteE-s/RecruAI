import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems, getBackendUrl } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import {
  useDebounce,
  LoadingSkeleton,
  ListErrorBoundary,
  sanitizeHtml,
  truncateText,
} from "../../utils/performance";

export default function BrowseJobs() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const { showToast } = useToast();

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

  // Debounced search to reduce API calls
  const debouncedSearch = useDebounce(filters.search, 300);

  useEffect(() => {
    fetchJobs(true); // Reset to first page when filters change
    fetchSavedJobs();
    fetchAppliedJobs();
  }, [
    debouncedSearch,
    filters.category,
    filters.location,
    filters.employment_type,
  ]);

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

        // Add filters
        if (debouncedSearch) params.append("search", debouncedSearch);
        if (filters.category) params.append("category", filters.category);
        if (filters.location) params.append("location", filters.location);
        if (filters.employment_type)
          params.append("employment_type", filters.employment_type);

        const response = await fetch(`${getBackendUrl()}/api/posts?${params}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          const newJobs = data.data || [];

          if (reset) {
            setJobs(newJobs);
          } else {
            setJobs((prev) => [...prev, ...newJobs]);
          }

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
    [
      pagination.page,
      pagination.per_page,
      debouncedSearch,
      filters.category,
      filters.location,
      filters.employment_type,
      showToast,
    ]
  );

  const fetchSavedJobs = async () => {
    try {
      const userId = 1; // TODO: Get from user context
      const response = await fetch(
        `${getBackendUrl()}/api/saved-jobs/user/${userId}`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        const savedIds = new Set(data.map((saved) => saved.post_id));
        setSavedJobs(savedIds);
      }
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
    }
  };

  const fetchAppliedJobs = async () => {
    try {
      const userId = 1; // TODO: Get from user context
      const response = await fetch(
        `${getBackendUrl()}/api/applications/user/${userId}`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        const applications = data.data || data; // Handle both paginated and old format
        const appliedIds = new Set(applications.map((app) => app.post_id));
        setAppliedJobs(appliedIds);
      }
    } catch (error) {
      console.error("Error fetching applied jobs:", error);
    }
  };

  const handleSaveJob = useCallback(
    async (postId) => {
      try {
        const userId = 1; // TODO: Get from user context
        const response = await fetch(`${getBackendUrl()}/api/saved-jobs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ user_id: userId, post_id: postId }),
        });

        if (response.ok) {
          setSavedJobs((prev) => new Set([...prev, postId]));
          showToast({
            message: "Job saved successfully!",
            type: "success",
          });
        } else {
          showToast({
            message: "Failed to save job",
            type: "error",
          });
        }
      } catch (error) {
        console.error("Error saving job:", error);
        showToast({
          message: "Failed to save job",
          type: "error",
        });
      }
    },
    [getBackendUrl, showToast]
  );

  const handleUnsaveJob = useCallback(
    async (savedId) => {
      try {
        const response = await fetch(
          `${getBackendUrl()}/api/saved-jobs/${savedId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (response.ok) {
          // Find the post_id for this saved job
          const savedJob = await fetch(
            `${getBackendUrl()}/api/saved-jobs/user/1`
          )
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
    },
    [getBackendUrl]
  );

  const handleApplyJob = async (postId) => {
    try {
      const userId = 1; // TODO: Get from user context
      const response = await fetch(`${getBackendUrl()}/api/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user_id: userId,
          post_id: postId,
          cover_letter: "",
          resume_url: "",
        }),
      });

      if (response.ok) {
        setAppliedJobs((prev) => new Set([...prev, postId]));
        setShowApplyConfirm(false);
        showToast({
          message: "Application submitted successfully!",
          type: "success",
          position: "center",
        });
      } else {
        showToast({
          message: "Failed to submit application",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error applying to job:", error);
      showToast({
        message: "Failed to submit application",
        type: "error",
      });
    }
  };

  const getUniqueValues = (key) => {
    // Get unique values from current jobs for filter dropdowns
    const values = jobs.map((job) => job[key]).filter(Boolean);
    return [...new Set(values)];
  };

  // Render individual job item
  const renderJobItem = useCallback(
    (job, index) => (
      <Card key={job.id}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <Link to={`/jobs/${job.id}`}>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1 hover:text-indigo-600 cursor-pointer">
                    {sanitizeHtml(job.title)}
                  </h3>
                </Link>
                <p className="text-lg text-indigo-600 font-medium mb-2">
                  {job.organization?.name}
                </p>
                <p className="text-gray-600 mb-3 line-clamp-2">
                  {truncateText(job.description, 200)}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      📍 {job.location}
                    </span>
                  )}
                  {job.employment_type && (
                    <span className="flex items-center gap-1">
                      💼 {job.employment_type}
                    </span>
                  )}
                  {job.category && (
                    <span className="flex items-center gap-1">
                      🏷️ {job.category}
                    </span>
                  )}
                  {job.salary_min && job.salary_max && (
                    <span className="flex items-center gap-1">
                      💰 ${job.salary_min} - ${job.salary_max}{" "}
                      {job.salary_currency}
                    </span>
                  )}
                  {job.application_deadline && (
                    <span className="flex items-center gap-1">
                      ⏰ Deadline:{" "}
                      {new Date(job.application_deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {job.requirements && job.requirements.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Key Requirements:
                    </p>
                    <ul className="text-sm text-gray-600 list-disc list-inside line-clamp-2">
                      {job.requirements.slice(0, 3).map((req, index) => (
                        <li key={index}>{sanitizeHtml(req)}</li>
                      ))}
                      {job.requirements.length > 3 && (
                        <li>...and {job.requirements.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 ml-4">
            {appliedJobs.has(job.id) ? (
              <button
                disabled
                className="px-4 py-2 bg-green-100 text-green-800 rounded-md cursor-not-allowed"
              >
                Applied
              </button>
            ) : (
              <button
                onClick={() => {
                  setSelectedJob(job);
                  setShowApplyConfirm(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Apply Now
              </button>
            )}
            {savedJobs.has(job.id) ? (
              <button
                onClick={() => {
                  // Find saved job ID - this is simplified
                  fetch(
                    `${getBackendUrl()}/api/saved-jobs/check?user_id=1&post_id=${
                      job.id
                    }`
                  )
                    .then((r) => r.json())
                    .then((data) => {
                      if (data.saved_id) handleUnsaveJob(data.saved_id);
                    });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
              >
                Saved
              </button>
            ) : (
              <button
                onClick={() => handleSaveJob(job.id)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
              >
                Save Job
              </button>
            )}
          </div>
        </div>
      </Card>
    ),
    [
      appliedJobs,
      savedJobs,
      handleSaveJob,
      handleUnsaveJob,
      setSelectedJob,
      setShowApplyConfirm,
      getBackendUrl,
    ]
  );

  if (loading && jobs.length === 0) {
    return (
      <DashboardLayout
        NavbarComponent={IndividualNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center h-64">
          <LoadingSkeleton count={5} height={120} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      NavbarComponent={IndividualNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="mb-6">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-600/80 via-purple-600/60 to-cyan-500/60 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">
                Browse Jobs
              </h1>
              <p className="mt-1 text-white/90">Find your next opportunity</p>
            </div>
            <div className="text-white text-right">
              <p className="text-2xl font-bold">{jobs.length}</p>
              <p className="text-sm text-white/80">Jobs found</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Job title, company, or keywords"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, category: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {getUniqueValues("category").map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              placeholder="City, State, or Remote"
              value={filters.location}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, location: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employment Type
            </label>
            <select
              value={filters.employment_type}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  employment_type: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              {getUniqueValues("employment_type").map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Job Listings */}
      <ListErrorBoundary>
        <div className="space-y-4">
          {jobs.map((job, index) => renderJobItem(job, index))}

          {/* Load More Button */}
          {pagination.has_more && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => fetchJobs(false)}
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Loading...
                  </>
                ) : (
                  "Load More Jobs"
                )}
              </button>
            </div>
          )}

          {/* Results Summary */}
          <div className="text-center text-sm text-gray-500 mt-4">
            Showing {jobs.length} of {pagination.total} jobs
          </div>
        </div>
      </ListErrorBoundary>

      {/* Apply Confirmation Modal */}
      {showApplyConfirm && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Application</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to apply for{" "}
              <strong>{selectedJob.title}</strong> at{" "}
              <strong>{selectedJob.organization?.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleApplyJob(selectedJob.id)}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Yes, Apply
              </button>
              <button
                onClick={() => {
                  setShowApplyConfirm(false);
                  setSelectedJob(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";

export default function BrowseJobs() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const { showToast } = useToast();

  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    location: "",
    employment_type: "",
  });

  useEffect(() => {
    fetchJobs();
    fetchSavedJobs();
    fetchAppliedJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, filters]);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/posts");
      if (response.ok) {
        const data = await response.json();
        // Filter only active jobs
        const activeJobs = data.filter((job) => job.status === "active");
        setJobs(activeJobs);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const userId = 1; // TODO: Get from user context
      const response = await fetch(`/api/saved-jobs/user/${userId}`);
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
      const response = await fetch(`/api/applications/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        const appliedIds = new Set(data.map((app) => app.post_id));
        setAppliedJobs(appliedIds);
      }
    } catch (error) {
      console.error("Error fetching applied jobs:", error);
    }
  };

  const filterJobs = () => {
    let filtered = jobs.filter((job) => {
      const matchesSearch =
        !filters.search ||
        job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.organization?.name
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      const matchesCategory =
        !filters.category || job.category === filters.category;
      const matchesLocation =
        !filters.location ||
        job.location?.toLowerCase().includes(filters.location.toLowerCase());
      const matchesType =
        !filters.employment_type ||
        job.employment_type === filters.employment_type;

      return matchesSearch && matchesCategory && matchesLocation && matchesType;
    });
    setFilteredJobs(filtered);
  };

  const handleSaveJob = async (postId) => {
    try {
      const userId = 1; // TODO: Get from user context
      const response = await fetch("/api/saved-jobs", {
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
  };

  const handleUnsaveJob = async (savedId) => {
    try {
      const response = await fetch(`/api/saved-jobs/${savedId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        // Find the post_id for this saved job
        const savedJob = await fetch(`/api/saved-jobs/user/1`)
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
  };

  const handleApplyJob = async (postId) => {
    try {
      const userId = 1; // TODO: Get from user context
      const response = await fetch("/api/applications", {
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
    const values = jobs.map((job) => job[key]).filter(Boolean);
    return [...new Set(values)];
  };

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={IndividualNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
              <p className="text-2xl font-bold">{filteredJobs.length}</p>
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
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">
                No jobs found matching your criteria.
              </p>
            </div>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <Link to={`/jobs/${job.id}`}>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1 hover:text-indigo-600 cursor-pointer">
                          {job.title}
                        </h3>
                      </Link>
                      <p className="text-lg text-indigo-600 font-medium mb-2">
                        {job.organization?.name}
                      </p>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {job.description}
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
                            {new Date(
                              job.application_deadline
                            ).toLocaleDateString()}
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
                              <li key={index}>{req}</li>
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
                          `/api/saved-jobs/check?user_id=1&post_id=${job.id}`
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
          ))
        )}
      </div>

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

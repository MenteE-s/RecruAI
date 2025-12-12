import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems, getBackendUrl } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import { formatDate } from "../../utils/timezone";
import {
  LoadingSkeleton,
  ListErrorBoundary,
  sanitizeHtml,
  truncateText,
} from "../../utils/performance";

export default function Candidates() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const { showToast } = useToast();

  const [applications, setApplications] = useState([]);
  const [organizationId, setOrganizationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showScheduleInterview, setShowScheduleInterview] = useState(false);
  const [showCandidateProfile, setShowCandidateProfile] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    has_more: false,
  });
  // Add state for filtering applications by status
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "rejected", "passed"
  const [interviewForm, setInterviewForm] = useState({
    title: "",
    description: "",
    scheduled_at: "",
    duration_minutes: 60,
    interview_type: "text",
    interviewers: "",
  });

  useEffect(() => {
    const getOrgId = async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/auth/me`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setOrganizationId(data.user?.organization_id || null);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    getOrgId();
  }, []);

  const fetchApplications = useCallback(
    async (reset = false) => {
      if (!organizationId) return;

      try {
        if (reset) {
          setLoading(true);
          setApplications([]);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }

        const currentPage = reset ? 1 : pagination.page;
        const params = new URLSearchParams({
          page: currentPage,
          per_page: pagination.per_page,
          organization_id: organizationId,
        });

        // Add status filter if not "all"
        if (statusFilter !== "all") {
          params.append("status", statusFilter);
        }

        const response = await fetch(
          `${getBackendUrl()}/api/applications?${params}`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const result = await response.json();
          
          if (reset) {
            setApplications(result.data);
          } else {
            setApplications((prev) => [...prev, ...result.data]);
          }
          
          setPagination({
            page: result.pagination.page,
            per_page: result.pagination.per_page,
            total: result.pagination.total,
            has_more: result.pagination.has_next,
          });
        } else {
          throw new Error("Failed to fetch applications");
        }
      } catch (err) {
        console.error("Error fetching applications:", err);
        showToast("Error fetching applications", "error");
      } finally {
        if (reset) {
          setLoading(false);
        }
      }
    },
    [organizationId, pagination.page, pagination.per_page, statusFilter, showToast]
  );

  useEffect(() => {
    if (organizationId) {
      fetchApplications(true);
    }
  }, [organizationId, fetchApplications, statusFilter]);

  const updateApplicationStatus = useCallback(
    async (appId, status) => {
      try {
        const response = await fetch(
          `${getBackendUrl()}/api/applications/${appId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ status }),
          }
        );

        if (response.ok) {
          await fetchApplications();
          showToast({
            message: `Application ${status} successfully`,
            type: "success",
          });
        } else {
          showToast({
            message: "Failed to update application status",
            type: "error",
          });
        }
      } catch (error) {
        console.error("Error updating application status:", error);
        showToast({
          message: "Failed to update application status",
          type: "error",
        });
      }
    },
    [fetchApplications, showToast, getBackendUrl]
  );

  const fetchCandidateProfile = useCallback(
    async (userId) => {
      try {
        const response = await fetch(
          `${getBackendUrl()}/api/users/${userId}/full-profile`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const profile = await response.json();
          setCandidateProfile(profile);
          setShowCandidateProfile(true);
        } else {
          showToast({
            message: "Failed to load candidate profile",
            type: "error",
          });
        }
      } catch (error) {
        console.error("Error fetching candidate profile:", error);
        showToast({
          message: "Failed to load candidate profile",
          type: "error",
        });
      }
    },
    [showToast, getBackendUrl]
  );

  const scheduleInterview = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: interviewForm.title,
        description: interviewForm.description,
        scheduled_at: new Date(interviewForm.scheduled_at).toISOString(),
        duration_minutes: interviewForm.duration_minutes,
        user_id: selectedApplication.user_id,
        organization_id: organizationId || 1,
        post_id: selectedApplication.post_id,
        interview_type: interviewForm.interview_type,
        interviewers: JSON.stringify(
          interviewForm.interviewers.split(",").map((i) => i.trim())
        ),
      };

      const response = await fetch(`${getBackendUrl()}/api/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showToast({
          message: "Interview scheduled successfully!",
          type: "success",
        });
        setShowScheduleInterview(false);
        resetInterviewForm();
      } else {
        showToast({
          message: "Failed to schedule interview",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error scheduling interview:", error);
      showToast({
        message: "Failed to schedule interview",
        type: "error",
      });
    }
  };

  const resetInterviewForm = () => {
    setInterviewForm({
      title: "",
      description: "",
      scheduled_at: "",
      duration_minutes: 60,
      interview_type: "text",
      interviewers: "",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewed":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to toggle onboarding status
  const toggleOnboardingStatus = async (applicationId, currentlyOnboarded) => {
    try {
      const endpoint = currentlyOnboarded 
        ? `/api/applications/${applicationId}/offboard`
        : `/api/applications/${applicationId}/onboard`;
      
      const response = await fetch(
        `${getBackendUrl()}${endpoint}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        showToast({
          message: currentlyOnboarded 
            ? "Candidate offboarded successfully!" 
            : "Candidate onboarded successfully!",
          type: "success",
        });
        // Refresh the applications list
        await fetchApplications();
      } else {
        const errorData = await response.json();
        showToast({
          message: errorData?.error || "Failed to update onboarding status",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error updating onboarding status:", error);
      showToast({
        message: "Failed to update onboarding status",
        type: "error",
      });
    }
  };

  // Handle scroll to bottom for infinite scrolling
  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && pagination.has_more) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  };

  return (
    <DashboardLayout
      NavbarComponent={OrganizationNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="space-y-6">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-600/80 via-purple-600/60 to-cyan-500/60 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">
                Candidates
              </h1>
              <p className="mt-1 text-white/90">
                Manage job applicants and schedule interviews
              </p>
            </div>
            <div className="text-white text-right">
              <p className="text-2xl font-bold">{applications.length}</p>
              <p className="text-sm text-white/80">Total candidates</p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Candidates</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>
            
            <div className="flex-1"></div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <LoadingSkeleton count={5} />
          </div>
        ) : (
          <div
            className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-2"
            onScroll={handleScroll}
          >
            {applications.length === 0 ? (
              <Card className="text-center py-12">
                <div className="text-gray-400 mb-4"> No candidates found </div>
                <p className="text-gray-600">
                  {statusFilter === "all"
                    ? "There are no candidates who have applied yet."
                    : statusFilter === "rejected"
                    ? "No candidates have been rejected yet."
                    : statusFilter === "accepted"
                    ? "No candidates have been accepted yet."
                    : "No candidates match the current filter."}
                </p>
              </Card>
            ) : (
              applications.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {application.user?.name || "Unknown Candidate"}
                              </h3>
                              <p className="text-gray-600">
                                Applied for: {application.post?.title || "Unknown Position"}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                application.status
                              )}`}
                            >
                              {application.status}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Applied:</span>
                              <span className="ml-1 font-medium">
                                {formatDate(application.applied_at)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Email:</span>
                              <span className="ml-1 font-medium break-all">
                                {application.user?.email || "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Position:</span>
                              <span className="ml-1 font-medium">
                                {application.post?.title || "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Stage:</span>
                              <span className="ml-1 font-medium capitalize">
                                {application.pipeline_stage || "N/A"}
                              </span>
                            </div>
                          </div>

                          {application.cover_letter && (
                            <div className="mt-3">
                              <p className="text-gray-600 text-sm">
                                {truncateText(
                                  sanitizeHtml(application.cover_letter),
                                  150
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() =>
                          fetchCandidateProfile(application.user_id)
                        }
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-200 transition-colors"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => {
                          setSelectedApplication(application);
                          setShowScheduleInterview(true);
                        }}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200 transition-colors"
                      >
                        Schedule Interview
                      </button>
                      {application.status !== "rejected" && (
                        <button
                          onClick={() =>
                            updateApplicationStatus(application.id, "rejected")
                          }
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                        >
                          Reject
                        </button>
                      )}
                      {application.pipeline_stage === "hired" && (
                        <div className="mt-2">
                          <button
                            onClick={() => 
                              toggleOnboardingStatus(
                                application.id, 
                                application.onboarded
                              )
                            }
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              application.onboarded
                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            }`}
                          >
                            {application.onboarded ? "Offboard" : "Onboard"}
                          </button>
                          {application.onboarded && (
                            <span className="block mt-1 text-xs text-green-600">
                              ✓ Onboarded
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleInterview && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Schedule Interview
              </h3>
              <button
                onClick={() => {
                  setShowScheduleInterview(false);
                  setSelectedApplication(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={scheduleInterview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Title
                </label>
                <input
                  type="text"
                  value={interviewForm.title}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Technical Interview - Round 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={interviewForm.description}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Interview details, topics to prepare, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={interviewForm.scheduled_at}
                    onChange={(e) =>
                      setInterviewForm((prev) => ({
                        ...prev,
                        scheduled_at: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={interviewForm.duration_minutes}
                    onChange={(e) =>
                      setInterviewForm((prev) => ({
                        ...prev,
                        duration_minutes: parseInt(e.target.value),
                      }))
                    }
                    min="15"
                    max="480"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Type
                </label>
                <select
                  value={interviewForm.interview_type}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({
                      ...prev,
                      interview_type: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="text">💬 Text Chat Interview</option>
                  <option value="ai_video">🤖 AI Video Interview</option>
                  <option value="human_video">👥 Human Video Interview</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interviewers (comma-separated)
                </label>
                <input
                  type="text"
                  value={interviewForm.interviewers}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({
                      ...prev,
                      interviewers: e.target.value,
                    }))
                  }
                  placeholder="John Doe, Jane Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Schedule Interview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleInterview(false);
                    resetInterviewForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate Profile Modal */}
      {showCandidateProfile && candidateProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Candidate Profile
              </h3>
              <button
                onClick={() => {
                  setShowCandidateProfile(false);
                  setCandidateProfile(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                <div>
                  <h4 className="text-lg font-semibold">
                    {candidateProfile.basic_info?.name || "Unknown Name"}
                  </h4>
                  <p className="text-gray-600">
                    {candidateProfile.basic_info?.headline || "No headline"}
                  </p>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-2">Summary</h5>
                <p className="text-gray-600">
                  {candidateProfile.basic_info?.summary ||
                    "No summary available"}
                </p>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-2">Contact</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-1 font-medium">
                      {candidateProfile.basic_info?.email || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <span className="ml-1 font-medium">
                      {candidateProfile.basic_info?.phone || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <span className="ml-1 font-medium">
                      {candidateProfile.basic_info?.location || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
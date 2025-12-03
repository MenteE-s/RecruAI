import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import { formatDate } from "../../utils/timezone";

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [recommendedJobs, setRecommendedJobs] = useState([]);

  useEffect(() => {
    fetchJobDetails();
    checkSavedStatus();
    checkAppliedStatus();
  }, [id]);

  useEffect(() => {
    if (job) {
      fetchRecommendedJobs();
    }
  }, [job]);

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`/api/posts/${id}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data);
      } else {
        showToast({
          message: "Job not found",
          type: "error",
        });
        navigate("/jobs");
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      showToast({
        message: "Failed to load job details",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSavedStatus = async () => {
    try {
      const userId = 1; // TODO: Get from user context
      const response = await fetch(
        `/api/saved-jobs/check?user_id=${userId}&post_id=${id}`
      );
      if (response.ok) {
        const data = await response.json();
        setSaved(data.saved);
      }
    } catch (error) {
      console.error("Error checking saved status:", error);
    }
  };

  const checkAppliedStatus = async () => {
    try {
      const userId = 1; // TODO: Get from user context
      const response = await fetch(`/api/applications/user/${userId}`);
      if (response.ok) {
        const applications = await response.json();
        const hasApplied = applications.some(
          (app) => app.post_id === parseInt(id)
        );
        setApplied(hasApplied);
      }
    } catch (error) {
      console.error("Error checking applied status:", error);
    }
  };

  const fetchRecommendedJobs = async () => {
    try {
      const response = await fetch("/api/posts");
      if (response.ok) {
        const allJobs = await response.json();
        // Filter jobs: same company or same category, exclude current job, limit to 3
        const recommended = allJobs
          .filter(
            (j) =>
              j.id !== parseInt(id) && // Not the current job
              (j.organization_id === job.organization_id ||
                j.category === job.category) // Same company or category
          )
          .slice(0, 3); // Limit to 3 recommendations
        setRecommendedJobs(recommended);
      }
    } catch (error) {
      console.error("Error fetching recommended jobs:", error);
    }
  };

  const handleSaveJob = async () => {
    try {
      const userId = 1; // TODO: Get from user context
      const response = await fetch("/api/saved-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_id: userId, post_id: parseInt(id) }),
      });

      if (response.ok) {
        setSaved(true);
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

  const handleUnsaveJob = async () => {
    try {
      const userId = 1; // TODO: Get from user context
      const response = await fetch(
        `/api/saved-jobs/check?user_id=${userId}&post_id=${id}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.saved_id) {
          const deleteResponse = await fetch(
            `/api/saved-jobs/${data.saved_id}`,
            {
              method: "DELETE",
              credentials: "include",
            }
          );

          if (deleteResponse.ok) {
            setSaved(false);
            showToast({
              message: "Job removed from saved",
              type: "success",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error unsaving job:", error);
      showToast({
        message: "Failed to remove job from saved",
        type: "error",
      });
    }
  };

  const handleApplyJob = async () => {
    try {
      const userId = 1; // TODO: Get from user context
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user_id: userId,
          post_id: parseInt(id),
          cover_letter: "",
          resume_url: "",
        }),
      });

      if (response.ok) {
        setApplied(true);
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

  if (!job) {
    return (
      <DashboardLayout
        NavbarComponent={IndividualNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="text-center py-12">
          <p className="text-gray-500">Job not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      NavbarComponent={IndividualNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/jobs")}
            className="text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center"
          >
            ← Back to Jobs
          </button>

          <div className="bg-gradient-to-br from-indigo-600/80 via-purple-600/60 to-cyan-500/60 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                <p className="text-xl text-white/90 mb-4">
                  {job.organization?.name}
                </p>

                <div className="flex flex-wrap gap-4 text-sm">
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
                      ⏰ Deadline: {formatDate(job.application_deadline)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 ml-6">
                {applied ? (
                  <button
                    disabled
                    className="px-6 py-3 bg-green-100 text-green-800 rounded-lg cursor-not-allowed font-medium"
                  >
                    Applied
                  </button>
                ) : (
                  <button
                    onClick={() => setShowApplyConfirm(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    Apply Now
                  </button>
                )}

                {saved ? (
                  <button
                    onClick={handleUnsaveJob}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Saved
                  </button>
                ) : (
                  <button
                    onClick={handleSaveJob}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Save Job
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <h3 className="text-xl font-semibold mb-4">Job Description</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">
                  {job.description}
                </p>
              </div>
            </Card>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <Card>
                <h3 className="text-xl font-semibold mb-4">Requirements</h3>
                <ul className="space-y-2">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-1">•</span>
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Company Info */}
            {job.organization_details && (
              <Card>
                <h3 className="text-xl font-semibold mb-4">
                  About {job.organization.name}
                </h3>
                <div className="space-y-3">
                  {job.organization_details.description && (
                    <p className="text-gray-700">
                      {job.organization_details.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {job.organization_details.website && (
                      <div>
                        <span className="font-medium">Website:</span>
                        <a
                          href={job.organization_details.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 ml-2"
                        >
                          {job.organization_details.website}
                        </a>
                      </div>
                    )}
                    {job.organization_details.industry && (
                      <div>
                        <span className="font-medium">Industry:</span>
                        <span className="ml-2">
                          {job.organization_details.industry}
                        </span>
                      </div>
                    )}
                    {job.organization_details.company_size && (
                      <div>
                        <span className="font-medium">Company Size:</span>
                        <span className="ml-2">
                          {job.organization_details.company_size}
                        </span>
                      </div>
                    )}
                    {job.organization_details.location && (
                      <div>
                        <span className="font-medium">Location:</span>
                        <span className="ml-2">
                          {job.organization_details.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Job Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Posted:</span>
                  <span>{formatDate(job.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      job.status === "active"
                        ? "bg-green-100 text-green-800"
                        : job.status === "inactive"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                {job.application_deadline && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deadline:</span>
                    <span>{formatDate(job.application_deadline)}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Recommended Jobs */}
        {recommendedJobs.length > 0 && (
          <div className="mt-8">
            <Card>
              <h3 className="text-xl font-semibold mb-6">
                More Jobs You May Like
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedJobs.map((recJob) => (
                  <div
                    key={recJob.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/jobs/${recJob.id}`)}
                  >
                    <h4 className="font-semibold text-gray-900 mb-1 hover:text-indigo-600">
                      {recJob.title}
                    </h4>
                    <p className="text-sm text-indigo-600 mb-2">
                      {recJob.organization?.name}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      {recJob.location && <span>📍 {recJob.location}</span>}
                      {recJob.employment_type && (
                        <span>💼 {recJob.employment_type}</span>
                      )}
                      {recJob.salary_min && recJob.salary_max && (
                        <span>
                          💰 ${recJob.salary_min}-${recJob.salary_max}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Promotional Section - Horizontal Layout */}
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Career Coaching Ad */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg p-4 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full -mr-6 -mt-6"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🎯</span>
                  <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                    SPONSORED
                  </span>
                </div>
                <h4 className="font-bold text-base mb-1">
                  Ace Your Next Interview
                </h4>
                <p className="text-xs text-purple-100 mb-3 leading-tight">
                  Get personalized coaching from industry experts. 90% success
                  rate!
                </p>
                <button className="bg-white text-purple-600 px-3 py-1.5 rounded-md font-medium hover:bg-gray-50 transition-colors text-xs">
                  Start Coaching
                </button>
              </div>
            </div>

            {/* Resume Builder Ad */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg p-4 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-10 h-10 bg-white/10 rounded-full -mr-5 -mt-5"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">📄</span>
                  <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                    FEATURED
                  </span>
                </div>
                <h4 className="font-bold text-base mb-1">
                  Professional Resume Builder
                </h4>
                <p className="text-xs text-emerald-100 mb-3 leading-tight">
                  Create ATS-friendly resumes in minutes. Stand out from the
                  crowd!
                </p>
                <button className="bg-white text-emerald-600 px-3 py-1.5 rounded-md font-medium hover:bg-gray-50 transition-colors text-xs">
                  Build Resume
                </button>
              </div>
            </div>

            {/* Job Alerts Ad */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-4 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-full -mr-4 -mt-4"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🔔</span>
                  <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                    POPULAR
                  </span>
                </div>
                <h4 className="font-bold text-base mb-1">Smart Job Alerts</h4>
                <p className="text-xs text-orange-100 mb-3 leading-tight">
                  Never miss a great opportunity. Get notified when jobs match
                  your skills.
                </p>
                <button className="bg-white text-orange-600 px-3 py-1.5 rounded-md font-medium hover:bg-gray-50 transition-colors text-xs">
                  Set Alerts
                </button>
              </div>
            </div>

            {/* Premium Plan Ad */}
            <div className="border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">⭐</span>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                  PREMIUM
                </span>
              </div>
              <h4 className="font-bold text-gray-900 text-base mb-1">
                Unlock Premium Features
              </h4>
              <ul className="text-xs text-gray-600 mb-3 space-y-0.5">
                <li>• Advanced job matching</li>
                <li>• Priority application tracking</li>
                <li>• Direct recruiter messages</li>
              </ul>
              <button className="w-full bg-indigo-600 text-white px-3 py-1.5 rounded-md font-medium hover:bg-indigo-700 transition-colors text-xs">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Confirmation Modal */}
      {showApplyConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Application</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to apply for <strong>{job.title}</strong> at{" "}
              <strong>{job.organization?.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleApplyJob}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Yes, Apply
              </button>
              <button
                onClick={() => setShowApplyConfirm(false)}
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

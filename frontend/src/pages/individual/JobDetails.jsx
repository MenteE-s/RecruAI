import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems, getBackendUrl, getUploadUrl, getCurrentUserId } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import { formatDate } from "../../utils/timezone";
import {
  FiArrowLeft,
  FiMapPin,
  FiBriefcase,
  FiClock,
  FiDollarSign,
  FiCalendar,
  FiTag,
  FiCheck,
  FiBookmark,
  FiCheckCircle,
} from "react-icons/fi";

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (job) {
      fetchRecommendedJobs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/posts/${id}`);
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
      const response = await fetch(
        `${getBackendUrl()}/api/saved-jobs/check?post_id=${id}`
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
      const userId = await getCurrentUserId();
      if (!userId) return;
      const response = await fetch(
        `${getBackendUrl()}/api/applications/user/${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        const applications = data.data || data;
        const hasApplied = (Array.isArray(applications) ? applications : []).some(
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
      const response = await fetch(`${getBackendUrl()}/api/posts`);
      if (response.ok) {
        const allJobs = (await response.json()).data || [];
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
      const response = await fetch(`${getBackendUrl()}/api/saved-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ post_id: parseInt(id) }),
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
      const response = await fetch(
        `${getBackendUrl()}/api/saved-jobs/check?post_id=${id}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.saved_id) {
          const deleteResponse = await fetch(
            `${getBackendUrl()}/api/saved-jobs/${data.saved_id}`,
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
      const response = await fetch(`${getBackendUrl()}/api/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
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
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate("/jobs")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Jobs
        </button>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-5">
              {job.organization?.profile_image ? (
                <img
                  src={getUploadUrl(job.organization.profile_image)}
                  alt=""
                  className="w-16 h-16 rounded object-cover border border-white/20 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 bg-blue-600 text-white flex items-center justify-center text-xl font-bold shrink-0">
                  {(job.organization?.name || job.title || "?")[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/10 border border-white/20 px-2.5 py-1">
                    <FiBriefcase className="w-3 h-3" /> {job.employment_type || "Full-time"}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 ${job.status === "active" ? "bg-green-500/20 text-green-300 border border-green-400/30" : "bg-white/10 text-gray-300 border border-white/20"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${job.status === "active" ? "bg-green-400" : "bg-gray-400"}`} />
                    {job.status === "active" ? "Actively hiring" : job.status}
                  </span>
                  {job.category && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/10 border border-white/20 px-2.5 py-1">
                      <FiTag className="w-3 h-3" /> {job.category}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">{job.title}</h1>
                {job.organization?.id ? (
                  <button onClick={() => navigate(`/organization/profile/${job.organization.id}`)} className="text-blue-200 mt-1 text-sm md:text-[15px] hover:text-white hover:underline transition-colors">
                    {job.organization?.name || "Unknown organization"}
                  </button>
                ) : (
                  <p className="text-blue-200 mt-1 text-sm md:text-[15px]">{job.organization?.name || "Unknown organization"}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-300">
                  {job.location && (
                    <span className="inline-flex items-center gap-1.5"><FiMapPin className="w-4 h-4 text-gray-400" />{job.location}</span>
                  )}
                  {(job.salary_min || job.salary_max) && (
                    <span className="inline-flex items-center gap-1.5"><FiDollarSign className="w-4 h-4 text-gray-400" />
                      {job.salary_min && job.salary_max
                        ? `${job.salary_currency || "$"}${Number(job.salary_min).toLocaleString()} - ${job.salary_currency || "$"}${Number(job.salary_max).toLocaleString()}`
                        : `${job.salary_currency || "$"}${Number(job.salary_min || job.salary_max).toLocaleString()}`}
                    </span>
                  )}
                  {job.application_deadline && (
                    <span className="inline-flex items-center gap-1.5"><FiCalendar className="w-4 h-4 text-gray-400" />Apply by {formatDate(job.application_deadline)}</span>
                  )}
                </div>
              </div>
              <div className="flex md:flex-col gap-2 shrink-0 md:w-[180px]">
                {applied ? (
                  <span className="flex-1 md:w-full inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-green-500/20 text-green-300 border border-green-400/30 text-sm font-medium">
                    <FiCheckCircle className="w-4 h-4" /> Applied
                  </span>
                ) : (
                  <button
                    onClick={() => setShowApplyConfirm(true)}
                    className="flex-1 md:w-full px-5 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Apply Now
                  </button>
                )}
                <button
                  onClick={saved ? handleUnsaveJob : handleSaveJob}
                  className="flex-1 md:w-full inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-white/10 backdrop-blur border border-white/20 text-white text-sm font-medium hover:bg-white/15 transition-colors"
                >
                  <FiBookmark className="w-4 h-4" /> {saved ? "Saved" : "Save Job"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-1 h-5 rounded-full bg-blue-600 shrink-0" />
                <h3 className="text-lg font-semibold text-gray-900 whitespace-nowrap">Job Description</h3>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {job.description || "No description provided."}
              </p>
            </Card>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-1 h-5 rounded-full bg-blue-600 shrink-0" />
                  <h3 className="text-lg font-semibold text-gray-900 whitespace-nowrap">Requirements</h3>
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">
                    {job.requirements.length}
                  </span>
                </div>
                <ul className="space-y-2.5">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm">
                      <span className="w-5 h-5 bg-green-50 border border-green-200 flex items-center justify-center shrink-0 mt-0.5">
                        <FiCheck className="w-3 h-3 text-green-600" />
                      </span>
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Company Info */}
            {job.organization_details && (
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-1 h-5 rounded-full bg-blue-600 shrink-0" />
                  <h3 className="text-lg font-semibold text-gray-900 whitespace-nowrap">
                    About {job.organization?.name}
                  </h3>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
                <button
                  onClick={() => job.organization?.id && navigate(`/organization/profile/${job.organization.id}`)}
                  disabled={!job.organization?.id}
                  className="w-full flex items-start gap-3 text-left group"
                >
                  {job.organization?.profile_image ? (
                    <img
                      src={getUploadUrl(job.organization.profile_image)}
                      alt=""
                      className="w-12 h-12 rounded object-cover border border-gray-200 shrink-0 group-hover:border-blue-300"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-900 text-white flex items-center justify-center text-lg font-bold shrink-0 group-hover:bg-blue-600 transition-colors">
                      {(job.organization?.name || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{job.organization?.name}</p>
                    {job.organization_details.industry && (
                      <p className="text-xs text-gray-500 mt-0.5">{job.organization_details.industry}{job.organization_details.location ? ` • ${job.organization_details.location}` : ""}</p>
                    )}
                  </div>
                  {job.organization?.id && (
                    <span className="text-xs font-medium text-blue-600 group-hover:text-blue-700 shrink-0 mt-1">View profile →</span>
                  )}
                </button>
                {job.organization_details.description && (
                  <p className="text-sm text-gray-700 mt-3 leading-relaxed">
                    {job.organization_details.description}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
                  {job.organization_details.website && (
                    <div className="bg-gray-50 border border-gray-200 p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Website</p>
                      <a
                        href={job.organization_details.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-medium break-all"
                      >
                        {job.organization_details.website}
                      </a>
                    </div>
                  )}
                  {job.organization_details.company_size && (
                    <div className="bg-gray-50 border border-gray-200 p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Company size</p>
                      <p className="font-medium text-gray-900 mt-0.5">{job.organization_details.company_size}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-1 h-5 rounded-full bg-gray-900 shrink-0" />
                <h3 className="text-base font-semibold text-gray-900 whitespace-nowrap">Job Overview</h3>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-gray-500"><FiCalendar className="w-3.5 h-3.5" />Posted</span>
                  <span className="font-medium text-gray-900">{formatDate(job.created_at)}</span>
                </div>
                {job.application_deadline && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-gray-500"><FiClock className="w-3.5 h-3.5" />Deadline</span>
                    <span className="font-medium text-gray-900">{formatDate(job.application_deadline)}</span>
                  </div>
                )}
                {job.location && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-gray-500"><FiMapPin className="w-3.5 h-3.5" />Location</span>
                    <span className="font-medium text-gray-900 text-right">{job.location}</span>
                  </div>
                )}
                {job.employment_type && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-gray-500"><FiBriefcase className="w-3.5 h-3.5" />Type</span>
                    <span className="font-medium text-gray-900">{job.employment_type}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500">Status</span>
                  <span
                    className={`px-2 py-1 text-xs font-medium border ${
                      job.status === "active"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : job.status === "inactive"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                {applied ? (
                  <span className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 text-sm font-medium">
                    <FiCheckCircle className="w-4 h-4" /> Application sent
                  </span>
                ) : (
                  <button
                    onClick={() => setShowApplyConfirm(true)}
                    className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Apply Now
                  </button>
                )}
                <button
                  onClick={saved ? handleUnsaveJob : handleSaveJob}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <FiBookmark className="w-4 h-4" /> {saved ? "Saved" : "Save for later"}
                </button>
              </div>
            </Card>
          </div>
        </div>

        {/* Recommended Jobs */}
        {recommendedJobs.length > 0 && (
          <div className="mt-8">
            <Card>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-1 h-5 rounded-full bg-blue-600 shrink-0" />
                <h3 className="text-lg font-semibold text-gray-900 whitespace-nowrap">
                  More Jobs You May Like
                </h3>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedJobs.map((recJob) => (
                  <div
                    key={recJob.id}
                    className="border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
                    onClick={() => navigate(`/jobs/${recJob.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {(recJob.organization?.name || recJob.title || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 text-sm leading-tight truncate">
                          {recJob.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {recJob.organization?.name}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      {recJob.location && (
                        <span className="inline-flex items-center gap-1"><FiMapPin className="w-3 h-3" />{recJob.location}</span>
                      )}
                      {recJob.employment_type && (
                        <span className="inline-flex items-center gap-1"><FiBriefcase className="w-3 h-3" />{recJob.employment_type}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Apply Confirmation Modal */}
      {showApplyConfirm && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 max-w-md w-full border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Confirm Application</h3>
            <p className="text-sm text-gray-600 mt-2">
              Apply for <strong className="text-gray-900">{job.title}</strong> at{" "}
              <strong className="text-gray-900">{job.organization?.name}</strong>?
            </p>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleApplyJob}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Yes, Apply
              </button>
              <button
                onClick={() => setShowApplyConfirm(false)}
                className="px-5 py-2.5 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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

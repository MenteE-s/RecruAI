import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import { getSidebarItems, getBackendUrl, getUploadUrl, getCurrentUserId } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import MenteeLoader from "../../components/ui/MenteeLoader";
import { formatDate } from "../../utils/timezone";
import {
  FiArrowLeft,
  FiMapPin,
  FiBriefcase,
  FiClock,
  FiDollarSign,
  FiCalendar,
  FiBookmark,
  FiCheckCircle,
  FiEye,
  FiUsers,
} from "react-icons/fi";

function timeAgo(dateString) {
  if (!dateString) return "Recently";
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return formatDate(dateString);
}

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
  const [applying, setApplying] = useState(false);
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
        // Record this detail view (fire-and-forget)
        fetch(`${getBackendUrl()}/api/posts/${id}/view`, { method: "POST" }).catch(() => {});
      } else {
        showToast({
          message: "Job not found",
          type: "error",
        });
        navigate("/dashboard");
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
      // Filter server-side to this post: returns 0-1 rows instead of the
      // user's whole application history.
      const response = await fetch(
        `${getBackendUrl()}/api/applications/user/${userId}?post_id=${id}`
      );
      if (response.ok) {
        const data = await response.json();
        const applications = data.data || data;
        setApplied(
          Array.isArray(applications) ? applications.length > 0 : false
        );
      }
    } catch (error) {
      console.error("Error checking applied status:", error);
    }
  };

  const fetchRecommendedJobs = async () => {
    try {
      // Server-side category filter + small page: same 5 cards, ~1/4 the bytes.
      // Falls back to unfiltered when the job has no category.
      const params = new URLSearchParams({ per_page: "6" });
      if (job?.category) params.set("category", job.category);
      const response = await fetch(
        `${getBackendUrl()}/api/posts?${params.toString()}`
      );
      if (response.ok) {
        const allJobs = (await response.json()).data || [];
        // Filter jobs: same company or same category, exclude current job, limit to 5
        const recommended = allJobs
          .filter(
            (j) =>
              j.id !== parseInt(id) && // Not the current job
              (j.organization_id === job.organization_id ||
                j.category === job.category) // Same company or category
          )
          .slice(0, 5);
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
    if (applying) return;
    setApplying(true);
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
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={IndividualNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center h-64">
          <MenteeLoader size={60} text="Loading job…" />
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
          <p className="text-sm text-gray-500">Job not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const orgName = job.organization?.name || "Unknown organization";
  const orgInitial = (job.organization?.name || job.title || "?")[0].toUpperCase();
  const salary =
    job.salary_min || job.salary_max
      ? job.salary_min && job.salary_max
        ? `${job.salary_currency || "$"}${Number(job.salary_min).toLocaleString()} - ${job.salary_currency || "$"}${Number(job.salary_max).toLocaleString()}`
        : `${job.salary_currency || "$"}${Number(job.salary_min || job.salary_max).toLocaleString()}`
      : null;

  return (
    <DashboardLayout
      NavbarComponent={IndividualNavbar}
      sidebarItems={sidebarItems}
    >
      {/* Centered narrow column, LinkedIn-style */}
      <div className="w-full max-w-3xl mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 mb-2"
        >
          <FiArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </button>

        {/* Job header card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <div className="flex gap-3">
            {job.organization?.profile_image ? (
              <img
                src={getUploadUrl(job.organization.profile_image)}
                alt={orgName}
                className="w-12 h-12 rounded object-cover border border-gray-200 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-gray-800 text-white flex items-center justify-center text-lg font-bold shrink-0">
                {orgInitial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-[17px] font-semibold text-gray-900 leading-snug">{job.title}</h1>
              {job.organization?.id ? (
                <Link
                  to={`/organization/profile/${job.organization.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {orgName}
                </Link>
              ) : (
                <p className="text-sm text-blue-600">{orgName}</p>
              )}
              <p className="text-xs text-gray-500 mt-0.5">
                {job.location || "Location not specified"}
                {job.employment_type ? ` · ${job.employment_type}` : ""}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {job.category ? `${job.category} · ` : ""}Posted {timeAgo(job.created_at)}
                {job.status === "active" ? " · Actively hiring" : ` · ${job.status}`}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <FiEye className="w-3 h-3" /> {job.view_count ?? 0} view{(job.view_count ?? 0) === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <FiUsers className="w-3 h-3" /> {job.application_count ?? 0} applicant{(job.application_count ?? 0) === 1 ? "" : "s"}
                </span>
              </p>
            </div>
          </div>

          {(salary || job.application_deadline) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-xs text-gray-600">
              {salary && (
                <span className="inline-flex items-center gap-1">
                  <FiDollarSign className="w-3.5 h-3.5 text-gray-400" />{salary}
                </span>
              )}
              {job.application_deadline && (
                <span className="inline-flex items-center gap-1">
                  <FiCalendar className="w-3.5 h-3.5 text-gray-400" />Apply by {formatDate(job.application_deadline)}
                </span>
              )}
            </div>
          )}

          {/* LinkedIn-style pill actions */}
          <div className="flex items-center gap-2 mt-3">
            {applied ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-semibold">
                <FiCheckCircle className="w-4 h-4" /> Applied
              </span>
            ) : (
              <button
                onClick={() => setShowApplyConfirm(true)}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors rounded-full"
              >
                MenteE Apply
              </button>
            )}
            <button
              onClick={saved ? handleUnsaveJob : handleSaveJob}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-full border transition-colors ${
                saved
                  ? "bg-gray-100 text-gray-600 border-gray-300"
                  : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
              }`}
            >
              <FiBookmark className={`w-4 h-4 ${saved ? "fill-gray-400" : ""}`} /> {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-3">
            {/* About the job */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <h2 className="text-[15px] font-semibold text-gray-900">About the job</h2>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed mt-2">
                {job.description || "No description provided."}
              </p>
            </div>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                <h2 className="text-[15px] font-semibold text-gray-900">
                  Requirements <span className="text-xs font-normal text-gray-400">({job.requirements.length})</span>
                </h2>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="text-sm text-gray-700 leading-relaxed">{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* About the company */}
            {job.organization_details && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                <h2 className="text-[15px] font-semibold text-gray-900">About the company</h2>
                <button
                  onClick={() => job.organization?.id && navigate(`/organization/profile/${job.organization.id}`)}
                  disabled={!job.organization?.id}
                  className="w-full flex items-center gap-2.5 mt-2.5 text-left group"
                >
                  {job.organization?.profile_image ? (
                    <img
                      src={getUploadUrl(job.organization.profile_image)}
                      alt={orgName}
                      className="w-10 h-10 rounded object-cover border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-800 text-white flex items-center justify-center text-base font-bold shrink-0">
                      {orgInitial}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 group-hover:underline truncate">{orgName}</p>
                    {(job.organization_details.industry || job.organization_details.location) && (
                      <p className="text-xs text-gray-500 truncate">
                        {job.organization_details.industry || ""}
                        {job.organization_details.industry && job.organization_details.location ? " · " : ""}
                        {job.organization_details.location || ""}
                        {job.organization_details.company_size ? ` · ${job.organization_details.company_size}` : ""}
                      </p>
                    )}
                  </div>
                </button>
                {job.organization_details.description && (
                  <p className="text-sm text-gray-700 leading-relaxed mt-2.5">
                    {job.organization_details.description}
                  </p>
                )}
                {job.organization_details.website && (
                  <a
                    href={job.organization_details.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-2 inline-block break-all"
                  >
                    {job.organization_details.website}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right rail */}
          <div className="space-y-3">
            {/* What is MenteE Apply */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-4">
              <h2 className="text-[13px] font-semibold text-blue-900">What is MenteE Apply?</h2>
              <p className="text-xs text-blue-800 leading-relaxed mt-1.5">
                One-click apply with your RecruAI profile — no forms, no re-typing. Your profile,
                resume, and contact details go straight to the hiring team, and you can track the
                application under Applied jobs.
              </p>
            </div>

            {/* Job overview */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <h2 className="text-[13px] font-semibold text-gray-900">Job details</h2>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <FiClock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>Posted {formatDate(job.created_at)}</span>
                </div>
                {job.location && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <FiMapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{job.location}</span>
                  </div>
                )}
                {job.employment_type && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <FiBriefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{job.employment_type}</span>
                  </div>
                )}
                {job.application_deadline && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <FiCalendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>Apply by {formatDate(job.application_deadline)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Similar jobs */}
            {recommendedJobs.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                <h2 className="text-[13px] font-semibold text-gray-900">Similar jobs</h2>
                <div className="mt-1 divide-y divide-gray-100">
                  {recommendedJobs.map((recJob) => (
                    <button
                      key={recJob.id}
                      onClick={() => navigate(`/jobs/${recJob.id}`)}
                      className="w-full flex gap-2.5 py-2.5 text-left group"
                    >
                      <div className="w-9 h-9 rounded bg-gray-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {(recJob.organization?.name || recJob.title || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 group-hover:text-blue-600 group-hover:underline leading-tight line-clamp-2">
                          {recJob.title}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                          {recJob.organization?.name || ""}
                          {recJob.location ? ` · ${recJob.location}` : ""}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Confirmation Modal */}
      {showApplyConfirm && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 max-w-sm w-full border border-gray-200 rounded-lg shadow-xl">
            <h3 className="text-sm font-semibold text-gray-900">Apply to {orgName}?</h3>
            <p className="text-xs text-gray-600 mt-1.5">
              You're applying for <strong className="text-gray-900">{job.title}</strong>.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleApplyJob}
                disabled={applying}
                className="flex-1 px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors rounded-full disabled:opacity-70 inline-flex items-center justify-center gap-2"
              >
                {applying ? (<><MenteeLoader size={22} text={null} inline /> Applying…</>) : "Submit application"}
              </button>
              <button
                onClick={() => setShowApplyConfirm(false)}
                className="px-4 py-1.5 bg-white border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors rounded-full"
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

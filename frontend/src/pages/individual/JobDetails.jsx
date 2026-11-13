import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppShell, CenterBar } from "../../components/layout/AppShell";
import { RailSection } from "../../components/layout/RightRail";
import { Button, ButtonLink, IconButton } from "../../components/ui/Button";
import MenteeLoader from "../../components/ui/MenteeLoader";
import { getBackendUrl, getUploadUrl, getCurrentUserId, orgPath, postPath, getAuthHeaders } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import { formatDate } from "../../utils/timezone";
import { ApplyButton, JobMetaGrid, OrgMark, SkillGroup } from "../../components/jobs/JobBits";
import { formatSalaryRange } from "../../utils/jobMeta";
import {
  Bookmark,
  Share2,
  MapPin,
  Briefcase,
  CreditCard,
  Calendar,
  Layers,
  Eye,
  Users,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

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
  const { slug } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [applying, setApplying] = useState(false);
  const [recommendedJobs, setRecommendedJobs] = useState([]);

  useEffect(() => {
    if (!slug || slug === "undefined" || slug === "null") {
      setLoading(false);
      setJob(null);
      return;
    }
    setJob(null);
    setLoadError(null);
    setSaved(false);
    setApplied(false);
    setRecommendedJobs([]);
    fetchJobDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!job?.id) return;
    checkSavedStatus(job.id);
    checkAppliedStatus(job.id);
    fetchRecommendedJobs(job.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id]);

  const fetchJobDetails = async () => {
    if (!slug || slug === "undefined" || slug === "null") {
      setLoading(false);
      setJob(null);
      return;
    }
    setLoadError(null);
    try {
      setLoading(true);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(`${getBackendUrl()}/api/posts/by-slug/${encodeURIComponent(slug)}`, {
        credentials: "include",
        headers: getAuthHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (response.ok) {
        const data = await response.json();
        setJob(data);
        if (data?.id) {
          fetch(`${getBackendUrl()}/api/posts/${data.id}/view`, {
            method: "POST",
            credentials: "include",
            headers: getAuthHeaders(),
          }).catch(() => {});
        }
      } else {
        setJob(null);
        if (response.status !== 404) {
          setLoadError(
            response.status >= 500
              ? "The jobs service is temporarily unavailable."
              : "We couldn't load this job. Please try again."
          );
        }
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      setJob(null);
      setLoadError(
        error?.name === "AbortError"
          ? "This job took too long to load."
          : "We couldn't reach the jobs service."
      );
      showToast({
        message: "Failed to load job details",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSavedStatus = async (targetPostId) => {
    const id = targetPostId || job?.id;
    if (!id || id === "undefined" || id === "null") return;
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/saved-jobs/check?post_id=${encodeURIComponent(id)}`,
        {
          credentials: "include",
          headers: getAuthHeaders(),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSaved(Boolean(data.saved));
      }
    } catch (error) {
      console.error("Error checking saved status:", error);
    }
  };

  const checkAppliedStatus = async (targetPostId) => {
    const id = targetPostId || job?.id;
    if (!id || id === "undefined" || id === "null") return;
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;
      const response = await fetch(
        `${getBackendUrl()}/api/applications/user/${userId}?post_id=${encodeURIComponent(id)}`,
        {
          credentials: "include",
          headers: getAuthHeaders(),
        }
      );
      if (response.ok) {
        const data = await response.json();
        const applications = data.data || data;
        setApplied(Array.isArray(applications) ? applications.length > 0 : false);
      }
    } catch (error) {
      console.error("Error checking applied status:", error);
    }
  };

  const fetchRecommendedJobs = async (targetPostId) => {
    const id = targetPostId || job?.id;
    if (!id || id === "undefined" || id === "null") return;
    try {
      const params = new URLSearchParams({ top_k: "6", explanations: "true" });
      const response = await fetch(
        `${getBackendUrl()}/api/recommendations/jobs?${params.toString()}`,
        { headers: { ...getAuthHeaders() } }
      );
      if (response.ok) {
        const data = await response.json();
        const recommended = (data?.recommendations || [])
          .map((item) => item?.job || item)
          .filter((j) => j && j.id !== id)
          .slice(0, 5);
        setRecommendedJobs(recommended);
      }
    } catch (error) {
      console.error("Error fetching recommended jobs:", error);
    }
  };

  const handleSaveJob = async () => {
    if (!job?.id) return;
    try {
      const response = await fetch(`${getBackendUrl()}/api/saved-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ post_id: job.id }),
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
    if (!job?.id) return;
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/saved-jobs/check?post_id=${encodeURIComponent(job.id)}`,
        {
          credentials: "include",
          headers: getAuthHeaders(),
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.saved_id) {
          const deleteResponse = await fetch(
            `${getBackendUrl()}/api/saved-jobs/${data.saved_id}`,
            {
              method: "DELETE",
              credentials: "include",
              headers: getAuthHeaders(),
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

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: job?.title || "Job", url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      // share cancelled / unavailable
    }
    showToast({ message: "Link copied to clipboard", type: "success" });
  };

  const handleApplyJob = async () => {
    if (applying || !job?.id) return;
    setApplying(true);
    try {
      const response = await fetch(`${getBackendUrl()}/api/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({
          post_id: job.id,
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
      <AppShell rail={<RailSection />}>
        <CenterBar title="Job" backTo="/in/jobs" backLabel="Jobs" />
        <div className="rounded-xl border border-line bg-surface dark:border-line dark:bg-gray-25/80 p-6 m-4 text-center">
          <MenteeLoader size={60} text="Loading job…" />
        </div>
      </AppShell>
    );
  }

  if (!job) {
    return (
      <AppShell rail={<RailSection />}>
        <CenterBar title="Job" backTo="/in/jobs" backLabel="Jobs" />
        <div className="px-4 py-6">
          <div className="rounded-xl border border-line bg-surface dark:border-line dark:bg-gray-25/80 p-8 sm:p-10 text-center">
            <h2 className="text-lg font-semibold text-ink">
              {loadError ? "Couldn't load this job" : "This role is no longer available"}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-5 text-gray-500 dark:text-gray-500">
              {loadError ||
                "The job may have been closed or removed by the organization. Browse the latest openings instead."}
            </p>
            <div className="mt-5 flex justify-center items-center gap-2">
              {loadError ? (
                <Button variant="primary" size="sm" onClick={fetchJobDetails}>
                  Try again
                </Button>
              ) : null}
              <ButtonLink to="/in/jobs" variant={loadError ? "secondary" : "primary"} size="sm">
                Browse jobs
              </ButtonLink>
              <ButtonLink to="/feed" variant="secondary" size="sm">
                Back to feed
              </ButtonLink>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const orgName = job.organization?.name || "Unknown organization";
  const salary = formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency);

  const metaItems = [
    { icon: MapPin, label: "Location", value: job.location || "Not specified" },
    { icon: Briefcase, label: "Employment", value: job.employment_type || "Not specified" },
    ...(job.category ? [{ icon: Layers, label: "Category", value: job.category }] : []),
    ...(salary ? [{ icon: CreditCard, label: "Compensation", value: salary, mono: true }] : []),
    ...(job.application_deadline ? [{ icon: Calendar, label: "Apply by", value: formatDate(job.application_deadline), mono: true }] : []),
  ];

  const descriptionParagraphs = (job.description || "No description provided.")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const railContent = (
    <>
      {recommendedJobs.length > 0 && (
        <RailSection title="Similar jobs">
          <div className="rounded-xl border border-line bg-surface dark:border-line dark:bg-gray-25/80 p-2 flex flex-col gap-1">
            {recommendedJobs.slice(0, 3).map((recJob) => (
              <button
                key={recJob.id}
                type="button"
                onClick={() => navigate(postPath(recJob))}
                className="w-full text-left rounded-lg p-2.5 transition-colors hover:bg-gray-50 dark:bg-transparent dark:hover:bg-gray-25/60"
              >
                <p className="truncate text-[13px] font-semibold leading-5 text-ink">{recJob.title}</p>
                <p className="truncate text-[11px] leading-4 text-gray-500 dark:text-gray-500">
                  {recJob.organization?.name || "Unknown"} · {recJob.location || "—"}
                </p>
              </button>
            ))}
          </div>
        </RailSection>
      )}
      <RailSection title="Job details">
        <div className="rounded-xl border border-line bg-surface dark:border-line dark:bg-gray-25/80 p-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs leading-4 text-gray-600 dark:text-gray-600">
              <Calendar className="h-3.5 w-3.5 text-gray-500 dark:text-gray-500 shrink-0" strokeWidth={1.75} />
              <span>
                Posted <span className="font-mono tabular-nums">{formatDate(job.created_at)}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs leading-4 text-gray-600 dark:text-gray-600">
              <MapPin className="h-3.5 w-3.5 text-gray-500 dark:text-gray-500 shrink-0" strokeWidth={1.75} />
              <span className="truncate">{job.location || "Not specified"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs leading-4 text-gray-600 dark:text-gray-600">
              <Briefcase className="h-3.5 w-3.5 text-gray-500 dark:text-gray-500 shrink-0" strokeWidth={1.75} />
              <span>{job.employment_type || "Not specified"}</span>
            </div>
            {salary && (
              <div className="flex items-center gap-2 text-xs leading-4 text-gray-600 dark:text-gray-600">
                <CreditCard className="h-3.5 w-3.5 text-gray-500 dark:text-gray-500 shrink-0" strokeWidth={1.75} />
                <span className="font-mono tabular-nums">{salary}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs leading-4 text-gray-600 dark:text-gray-600">
              <Eye className="h-3.5 w-3.5 text-gray-500 dark:text-gray-500 shrink-0" strokeWidth={1.75} />
              <span>
                <span className="font-mono tabular-nums">{job.view_count ?? 0}</span> view{(job.view_count ?? 0) === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs leading-4 text-gray-600 dark:text-gray-600">
              <Users className="h-3.5 w-3.5 text-gray-500 dark:text-gray-500 shrink-0" strokeWidth={1.75} />
              <span>
                <span className="font-mono tabular-nums">{job.application_count ?? 0}</span> applicant{(job.application_count ?? 0) === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
      </RailSection>
      <RailSection>
        <div className="rounded-xl border border-line bg-surface dark:border-line dark:bg-gray-25/80 p-4">
          <p className="text-sm font-semibold leading-5 text-ink">Looking for a new job?</p>
          <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-500">
            Browse open roles and apply with your RecruAI profile.
          </p>
          <ButtonLink to="/feed" variant="secondary" size="sm" className="mt-3 w-full">
            Browse jobs
          </ButtonLink>
        </div>
      </RailSection>
    </>
  );

  return (
    <AppShell rail={railContent}>
      <CenterBar
        backTo="/in/jobs"
        backLabel="Jobs"
        title={<span className="truncate text-sm font-semibold text-ink">{orgName}</span>}
        actions={
          <div className="flex items-center gap-2">
            <IconButton
              label={saved ? "Unsave job" : "Save job"}
              onClick={saved ? handleUnsaveJob : handleSaveJob}
              active={saved}
            >
              <Bookmark
                className={`h-4 w-4 ${saved ? "fill-brand text-brand-text" : "text-gray-500 dark:text-gray-500"}`}
                strokeWidth={1.75}
              />
            </IconButton>
            <IconButton label="Share job" onClick={handleShare}>
              <Share2 className="h-4 w-4 text-gray-500 dark:text-gray-500" strokeWidth={1.75} />
            </IconButton>
          </div>
        }
      />

      <div className="px-4 py-5">
        <div className="flex items-start gap-3.5">
          <OrgMark
            name={orgName}
            image={job.organization?.profile_image ? getUploadUrl(job.organization.profile_image) : null}
            size="2xl"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] font-semibold leading-7 text-ink">{job.title}</h1>
            <p className="mt-1 text-[13px] leading-5 text-gray-600 dark:text-gray-500">
              {job.organization?.id ? (
                <Link to={orgPath(job.organization)} className="font-medium text-ink hover:underline">
                  {orgName}
                </Link>
              ) : (
                <span className="font-medium text-ink">{orgName}</span>
              )}{" "}
              {job.employment_type && <>· {job.employment_type}</>}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-gray-500 dark:text-gray-500">
              Posted <span className="font-mono tabular-nums">{timeAgo(job.created_at)}</span> ·{" "}
              <span className="font-mono tabular-nums">{job.view_count ?? 0}</span> view{(job.view_count ?? 0) === 1 ? "" : "s"} ·{" "}
              <span className="font-mono tabular-nums">{job.application_count ?? 0}</span> applicant{(job.application_count ?? 0) === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <JobMetaGrid items={metaItems} />

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {applied ? (
            <span className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-line bg-gray-50 px-4 text-sm font-medium text-gray-600 dark:border-line dark:bg-gray-25/50 dark:text-gray-600 w-full sm:w-auto">
              <CheckCircle2 className="h-4 w-4 text-brand-text" strokeWidth={1.75} /> Applied
            </span>
          ) : (
            <ApplyButton onClick={() => setShowApplyConfirm(true)}>Apply</ApplyButton>
          )}
          <p className="text-[11px] leading-4 text-gray-500 dark:text-gray-500">
            Applications use your RecruAI profile — no forms to re-type.
          </p>
        </div>

        {job.requirements && job.requirements.length > 0 && (
          <div className="mt-6 border-t border-line dark:border-line pt-5">
            <SkillGroup title="Must-have skills" skills={job.requirements} />
          </div>
        )}

        <div className="mt-6 border-t border-line dark:border-line pt-5">
          <h2 className="text-[15px] font-semibold leading-5 text-ink">About the role</h2>
          <div className="mt-2.5 flex flex-col gap-3.5">
            {descriptionParagraphs.map((paragraph, index) => (
              <p key={index} className="text-[15px] leading-6 text-ink">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {job.organization_details && (
          <div className="mt-6 border-t border-line dark:border-line pt-5">
            <h2 className="text-[15px] font-semibold leading-5 text-ink">About the company</h2>
            <div className="mt-2.5 flex flex-col gap-2">
              {(job.organization_details.industry || job.organization_details.location || job.organization_details.company_size) && (
                <p className="text-[13px] leading-5 text-gray-600 dark:text-gray-500">
                  {[job.organization_details.industry, job.organization_details.location, job.organization_details.company_size].filter(Boolean).join(" · ")}
                </p>
              )}
              {job.organization_details.description && (
                <p className="text-[15px] leading-6 text-ink">{job.organization_details.description}</p>
              )}
              {job.organization_details.website && (
                <a
                  href={job.organization_details.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-ink hover:text-brand-text break-all transition-colors inline-flex items-center gap-1.5"
                >
                  <span>{job.organization_details.website}</span>
                  <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
                </a>
              )}
            </div>
          </div>
        )}

        <p className="mt-6 text-[11px] leading-5 text-gray-500 dark:text-gray-500">
          This listing is managed by the organization and may change at any time.
        </p>
      </div>

      {/* Apply Confirmation Modal with >=12px insets and sentence case */}
      {showApplyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-surface dark:border-line dark:bg-gray-25 shadow-s15 p-5 animate-popIn">
            <div>
              <h3 className="text-base font-semibold leading-6 text-ink">Apply to {orgName}?</h3>
              <p className="mt-1.5 text-xs leading-5 text-gray-600 dark:text-gray-500">
                You're applying for <span className="font-semibold text-ink">{job.title}</span> using your RecruAI profile.
              </p>
            </div>
            <div className="mt-5 flex gap-2.5">
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleApplyJob}
                disabled={applying}
              >
                {applying ? (<><MenteeLoader size={18} text={null} inline /> Applying…</>) : "Submit application"}
              </Button>
              <Button variant="secondary" onClick={() => setShowApplyConfirm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

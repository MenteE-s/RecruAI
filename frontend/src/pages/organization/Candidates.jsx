import { OrgAppShell } from "../../components/layout/OrgAppShell";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PersonCard from "../../components/people/PersonCard";
import ApplicantsPanel from "../../components/people/ApplicantsPanel";
import { ClearFiltersButton } from "../../components/people/peopleMeta";
import { getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import EmptyState from "../../components/ui/EmptyState";
import AnimatedNumber from "../../components/motion/AnimatedNumber";
import { SkeletonCard, SkeletonStatGrid } from "../../components/motion/SmartSkeleton";
import { Users, Search, X, ArrowRight, Star } from "lucide-react";

const STARRED_FIRST_ROW = 4;

const inputCls =
  "w-full rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-900/60 px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-brand/10";

export default function Candidates() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Applicants
  const [applications, setApplications] = useState([]);
  const [organizationId, setOrganizationId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, has_more: false });
  // Talent directory (all individuals on RecruAI)
  const [directory, setDirectory] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryLoadingMore, setDirectoryLoadingMore] = useState(false);
  const [directoryPage, setDirectoryPage] = useState(1);
  const [directoryHasMore, setDirectoryHasMore] = useState(false);
  // Starred
  const [starredUsers, setStarredUsers] = useState([]);
  const [starredLoading, setStarredLoading] = useState(false);
  const [showAllStarred, setShowAllStarred] = useState(false);
  // Interviews (drives per-applicant Scheduled state — DB is source of truth)
  const [interviews, setInterviews] = useState([]);
  const [scheduledKeys, setScheduledKeys] = useState(new Set());
  // UI
  const [search, setSearch] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showScheduleInterview, setShowScheduleInterview] = useState(false);
  const [showCandidateProfile, setShowCandidateProfile] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [interviewForm, setInterviewForm] = useState({
    title: "",
    description: "",
    scheduled_at: "",
    duration_minutes: 60,
    interview_type: "text",
    interviewers: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/auth/me`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const u = (await res.json()).user;
          setOrganizationId(u?.organization_id || null);
          setCurrentUserId(u?.id || null);
        }
      } catch {}
    })();
  }, []);

  const fetchApplications = useCallback(
    async (reset = false) => {
      if (!organizationId) return;
      try {
        if (reset) {
          setLoading(true);
          setApplications([]);
          setPagination((p) => ({ ...p, page: 1 }));
        }
        const page = reset ? 1 : pagination.page + 1;
        const params = new URLSearchParams({
          page,
          per_page: pagination.per_page,
          organization_id: organizationId,
        });
        const res = await fetch(`${getBackendUrl()}/api/applications?${params}`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const result = await res.json();
          if (reset) setApplications(result.data);
          else setApplications((prev) => [...prev, ...result.data]);
          setPagination({
            page: result.pagination.page,
            per_page: result.pagination.per_page,
            total: result.pagination.total,
            has_more: result.pagination.has_next,
          });
        }
      } catch {
        showToast("Error fetching applications", "error");
      } finally {
        if (reset) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [organizationId, pagination.page, pagination.per_page]
  );

  useEffect(() => {
    if (organizationId) fetchApplications(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const loadDirectory = useCallback(async (page) => {
    if (page === 1) setDirectoryLoading(true);
    else setDirectoryLoadingMore(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/users?page=${page}&per_page=24`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const result = await res.json();
        const individuals = (result.data || []).filter((u) => u.role === "individual");
        setDirectory((prev) => (page === 1 ? individuals : [...prev, ...individuals]));
        setDirectoryHasMore(result.pagination?.has_next ?? false);
        setDirectoryPage(page);
      }
    } catch {}
    finally {
      setDirectoryLoading(false);
      setDirectoryLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadDirectory(1);
  }, [loadDirectory]);

  const fetchStarred = useCallback(async () => {
    if (!currentUserId) return;
    setStarredLoading(true);
    try {
      const res = await fetch(
        `${getBackendUrl()}/api/users/${currentUserId}/favorites?per_page=100`,
        { credentials: "include", headers: getAuthHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        setStarredUsers(Array.isArray(data) ? data : data.data || []);
      }
    } catch {
      showToast("Error fetching starred candidates", "error");
    } finally {
      setStarredLoading(false);
    }
  }, [currentUserId, showToast]);

  useEffect(() => {
    if (currentUserId) fetchStarred();
  }, [currentUserId, fetchStarred]);

  // Upcoming interviews drive the per-applicant Scheduled state
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/interviews`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.data || [];
          setInterviews(list.filter((iv) => iv.status !== "cancelled"));
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scheduledSet = useMemo(() => {
    const s = new Set(scheduledKeys);
    interviews.forEach((iv) => {
      if (iv.status !== "cancelled" && iv.user_id != null) s.add(`${iv.user_id}:${iv.post_id}`);
    });
    return s;
  }, [interviews, scheduledKeys]);

  const handleUnstar = useCallback(
    async (targetUserId) => {
      if (!currentUserId) return;
      setStarredUsers((prev) => prev.filter((u) => u.id !== targetUserId));
      try {
        const res = await fetch(
          `${getBackendUrl()}/api/users/${currentUserId}/toggle-favorite/${targetUserId}`,
          { method: "POST", credentials: "include", headers: getAuthHeaders() }
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.favorited) fetchStarred();
        else showToast({ message: "Removed from starred", type: "success" });
      } catch {
        fetchStarred();
        showToast({ message: "Failed to update starred", type: "error" });
      }
    },
    [currentUserId, fetchStarred, showToast]
  );

  const updateApplicationStatus = useCallback(
    async (appId, status) => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/applications/${appId}`, {
          method: "PUT",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          credentials: "include",
          body: JSON.stringify({ status }),
        });
        if (res.ok) {
          setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
          showToast({ message: `Application marked as ${status}`, type: "success" });
        } else showToast({ message: "Failed to update application status", type: "error" });
      } catch {
        showToast({ message: "Failed to update application status", type: "error" });
      }
    },
    [showToast]
  );

  const fetchCandidateProfile = useCallback(async (userId) => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/users/${userId}/full-profile`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setCandidateProfile(await res.json());
        setShowCandidateProfile(true);
      } else showToast({ message: "Failed to load candidate profile", type: "error" });
    } catch {
      showToast({ message: "Failed to load candidate profile", type: "error" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleInterview = async (e) => {
    e.preventDefault();
    if (!selectedApplication) return;
    try {
      const payload = {
        title: interviewForm.title,
        description: interviewForm.description,
        scheduled_at: new Date(interviewForm.scheduled_at).toISOString(),
        duration_minutes: interviewForm.duration_minutes,
        user_id: selectedApplication.user_id,
        organization_id: organizationId,
        post_id: selectedApplication.post_id,
        interview_type: interviewForm.interview_type,
        interviewers: interviewForm.interviewers
          ? interviewForm.interviewers.split(",").map((i) => i.trim())
          : [],
      };
      const res = await fetch(`${getBackendUrl()}/api/interviews`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast({ message: "Interview scheduled successfully!", type: "success" });
        setApplications((prev) =>
          prev.map((a) =>
            a.user_id === selectedApplication.user_id && a.post_id === selectedApplication.post_id
              ? { ...a, pipeline_stage: "interview_scheduled" }
              : a
          )
        );
        setScheduledKeys((prev) =>
          new Set(prev).add(`${selectedApplication.user_id}:${selectedApplication.post_id}`)
        );
        setShowScheduleInterview(false);
        resetInterviewForm();
      } else showToast({ message: "Failed to schedule interview", type: "error" });
    } catch {
      showToast({ message: "Failed to schedule interview", type: "error" });
    }
  };

  const resetInterviewForm = () =>
    setInterviewForm({
      title: "",
      description: "",
      scheduled_at: "",
      duration_minutes: 60,
      interview_type: "text",
      interviewers: "",
    });

  const toggleOnboardingStatus = async (applicationId, currentlyOnboarded) => {
    try {
      const endpoint = currentlyOnboarded
        ? `/api/applications/${applicationId}/offboard`
        : `/api/applications/${applicationId}/onboard`;
      const res = await fetch(`${getBackendUrl()}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
      });
      if (res.ok) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId
              ? {
                  ...app,
                  onboarded: !currentlyOnboarded,
                  pipeline_stage: !currentlyOnboarded ? "hired" : app.pipeline_stage,
                }
              : app
          )
        );
        showToast(
          `Candidate ${!currentlyOnboarded ? "marked as onboarded" : "marked as not onboarded"}`,
          "success"
        );
      } else throw new Error("Failed to update onboarding status");
    } catch {
      showToast("Error updating onboarding status", "error");
    }
  };

  const starredFiltered = useMemo(() => {
    if (!search) return starredUsers;
    const q = search.toLowerCase();
    return starredUsers.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [starredUsers, search]);

  const directoryFiltered = useMemo(() => {
    if (!search) return directory;
    const q = search.toLowerCase();
    return directory.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.headline?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [directory, search]);

  const recentApps = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.applied_at || 0) - new Date(a.applied_at || 0))
      .slice(0, 6);
  }, [applications]);

  const acceptedApps = useMemo(() => {
    return applications
      .filter((a) => a.status === "accepted")
      .sort((a, b) => new Date(b.applied_at || 0) - new Date(a.applied_at || 0))
      .slice(0, 4);
  }, [applications]);

  const openSchedule = (app) => {
    setSelectedApplication(app);
    resetInterviewForm();
    setShowScheduleInterview(true);
  };

  if (loading && applications.length === 0 && directoryLoading) {
    return (
      <OrgAppShell>
        <div className="space-y-4 px-4 py-4">
          <SkeletonStatGrid count={4} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} className="h-44" />
            ))}
          </div>
        </div>
      </OrgAppShell>
    );
  }

  return (
    <OrgAppShell>
      <div className="space-y-4 px-4 py-4">
        {/* Header card */}
        <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-5 shadow-s5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-[20px] font-semibold leading-7 text-ink">People and talent</h1>
              <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-500">
                <span className="font-mono tabular-nums"><AnimatedNumber value={directory.length} /></span> professionals on RecruAI ·{" "}
                <span className="font-mono tabular-nums"><AnimatedNumber value={pagination.total || applications.length} /></span> applicants ·{" "}
                <span className="font-mono tabular-nums"><AnimatedNumber value={starredUsers.length} /></span> starred
              </p>
            </div>
            <ButtonLink to="/org/hire" variant="secondary" size="sm" className="shrink-0">
              AI talent search <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </ButtonLink>
          </div>

          {/* Search bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-600" strokeWidth={1.75} />
            <Input
              type="text"
              placeholder="Search people by name, headline, or skills…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-ink dark:bg-transparent dark:hover:bg-gray-25"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>

        {/* Starred candidates section */}
        {(starredLoading || starredUsers.length > 0) && (
          <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-5 shadow-s5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" strokeWidth={1.75} /> Starred ·{" "}
                <span className="font-mono tabular-nums">{starredFiltered.length}</span>
              </h2>
              {starredFiltered.length > STARRED_FIRST_ROW && (
                <button
                  type="button"
                  onClick={() => setShowAllStarred((s) => !s)}
                  className="text-[11px] font-semibold text-ink transition-colors hover:text-brand-text"
                >
                  {showAllStarred
                    ? "Show fewer"
                    : `Show all (${starredFiltered.length - STARRED_FIRST_ROW} more)`}
                </button>
              )}
            </div>
            {starredLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonCard key={i} className="h-44" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {(showAllStarred
                  ? starredFiltered
                  : starredFiltered.slice(0, STARRED_FIRST_ROW)
                ).map((u) => (
                  <PersonCard
                    key={u.id}
                    person={u}
                    onView={() => navigate(`/org/user/${u.id}`)}
                    footer={
                      <button
                        type="button"
                        onClick={() => handleUnstar(u.id)}
                        title="Remove star"
                        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
                      >
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" strokeWidth={1.75} />{" "}
                        Starred
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Two-column layout: directory + side panel */}
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          {/* Main — all people on RecruAI */}
          <div className="min-w-0 lg:col-span-2">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-semibold text-ink">
                People on RecruAI · <span className="font-mono tabular-nums">{directoryFiltered.length}</span>
              </h2>
              {search && directory.length > 0 && (
                <ClearFiltersButton onClear={() => setSearch("")} />
              )}
            </div>
            {directoryLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonCard key={i} className="h-40" />
                ))}
              </div>
            ) : directoryFiltered.length === 0 ? (
              <EmptyState
                icon={Users}
                title={directory.length === 0 ? "No people yet" : "No matches found"}
                body={
                  directory.length === 0
                    ? "Candidates who join RecruAI will automatically appear here."
                    : "Try adjusting your search query."
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {directoryFiltered.map((u) => (
                  <PersonCard
                    key={u.id}
                    person={u}
                    onView={() => navigate(`/org/user/${u.id}`)}
                  />
                ))}
              </div>
            )}
            {directoryHasMore && !directoryLoading && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => loadDirectory(directoryPage + 1)}
                  disabled={directoryLoadingMore}
                >
                  {directoryLoadingMore ? "Loading more…" : "Load more people"}
                </Button>
              </div>
            )}
          </div>

          {/* Side panel — applicant actions, accepted, pipeline CTA */}
          <ApplicantsPanel
            recentApps={recentApps}
            acceptedApps={acceptedApps}
            scheduledSet={scheduledSet}
            onOpenProfile={fetchCandidateProfile}
            onStatusChange={updateApplicationStatus}
            onSchedule={openSchedule}
            onToggleOnboard={toggleOnboardingStatus}
          />
        </div>
      </div>

      {/* Schedule interview modal */}
      {showScheduleInterview && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line dark:border-line bg-surface dark:bg-gray-25 shadow-s15 animate-popIn">
            <div className="border-b border-line dark:border-line px-5 py-4">
              <h3 className="text-sm font-semibold text-ink">Schedule interview</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                For {selectedApplication.user?.name || "Candidate"} •{" "}
                {selectedApplication.post?.title || "Role"}
              </p>
            </div>
            <form onSubmit={scheduleInterview} className="space-y-3.5 p-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">
                  Interview title *
                </label>
                <input
                  type="text"
                  required
                  value={interviewForm.title}
                  onChange={(e) => setInterviewForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Technical Round 1"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">
                  Date and time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={interviewForm.scheduled_at}
                  onChange={(e) =>
                    setInterviewForm((p) => ({ ...p, scheduled_at: e.target.value }))
                  }
                  className={`${inputCls} font-mono tabular-nums`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">
                    Duration
                  </label>
                  <select
                    value={interviewForm.duration_minutes}
                    onChange={(e) =>
                      setInterviewForm((p) => ({
                        ...p,
                        duration_minutes: parseInt(e.target.value),
                      }))
                    }
                    className={inputCls}
                  >
                    <option value={30}>30 min</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">
                    Type
                  </label>
                  <select
                    value={interviewForm.interview_type}
                    onChange={(e) =>
                      setInterviewForm((p) => ({ ...p, interview_type: e.target.value }))
                    }
                    className={inputCls}
                  >
                    <option value="text">Text chat</option>
                    <option value="ai_video">AI video</option>
                    <option value="human_video">Human video</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2.5 pt-3">
                <Button variant="primary" type="submit" className="flex-1">
                  Schedule interview
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setShowScheduleInterview(false);
                    resetInterviewForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate profile preview modal */}
      {showCandidateProfile && candidateProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line dark:border-line bg-surface dark:bg-gray-25 shadow-s15">
            <div className="flex items-center justify-between border-b border-line dark:border-line px-5 py-4">
              <h3 className="text-sm font-semibold text-ink">Candidate overview</h3>
              <button
                type="button"
                onClick={() => {
                  setShowCandidateProfile(false);
                  setCandidateProfile(null);
                }}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-ink dark:bg-transparent dark:hover:bg-gray-25"
                aria-label="Close candidate overview"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto p-5">
              <div className="rounded-xl border border-line dark:border-line bg-gray-50 dark:bg-gray-25 p-4 shadow-s5">
                <h4 className="text-xs font-semibold text-ink">Basic information</h4>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Name</p>
                    <p className="mt-0.5 font-medium text-ink">
                      {candidateProfile.name || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Email</p>
                    <p className="mt-0.5 font-medium text-ink">{candidateProfile.email}</p>
                  </div>
                </div>
              </div>
              {candidateProfile.skills?.length > 0 && (
                <div className="rounded-xl border border-line dark:border-line bg-gray-50 dark:bg-gray-25 p-4 shadow-s5">
                  <h4 className="mb-2.5 text-xs font-semibold text-ink">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {candidateProfile.skills.map((s, i) => (
                      <span
                        key={i}
                        className="rounded-lg border border-line dark:border-line bg-surface dark:bg-gray-25 px-2.5 py-1 text-xs text-gray-700 dark:text-gray-700"
                      >
                        {s.name} {s.level && `(${s.level})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end border-t border-line dark:border-line px-5 py-4">
              <ButtonLink
                to={
                  candidateProfile.id
                    ? `/org/user/${candidateProfile.id}`
                    : candidateProfile.user_id
                    ? `/org/user/${candidateProfile.user_id}`
                    : "#"
                }
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowCandidateProfile(false);
                  setCandidateProfile(null);
                }}
              >
                Visit full profile <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
              </ButtonLink>
            </div>
          </div>
        </div>
      )}
    </OrgAppShell>
  );
}

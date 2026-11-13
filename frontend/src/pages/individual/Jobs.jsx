import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppShell, CenterBar } from "../../components/layout/AppShell";
import { RailSection } from "../../components/layout/RightRail";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import EmptyState from "../../components/ui/EmptyState";
import AnimatedTabBar from "../../components/motion/AnimatedTabBar";
import AnimatedNumber from "../../components/motion/AnimatedNumber";
import { StaggerList, StaggerItem } from "../../components/motion/Stagger";
import { SkeletonJobList } from "../../components/motion/SmartSkeleton";
import { getBackendUrl, getAuthHeaders, getCurrentUserId, postPath, getUploadUrl } from "../../utils/auth";
import { formatDate } from "../../utils/timezone";
import socketService from "../../utils/socket";
import { FilterChip, JobRow, OrgMark, StatusTag } from "../../components/jobs/JobBits";
import { formatSalaryRange as formatSalary } from "../../utils/jobMeta";
import {
  Bookmark,
  Briefcase,
  CheckCircle2,
  Search,
  X,
  ArrowUpRight,
  Trash2,
  Eye,
  Bell,
} from "lucide-react";

const getStatusMeta = (status) => {
  switch (status) {
    case "pending":
      return { label: "Pending review", status: "pending" };
    case "reviewed":
      return { label: "Under review", status: "reviewed" };
    case "accepted":
      return { label: "Accepted", status: "accepted" };
    case "rejected":
      return { label: "Rejected", status: "rejected" };
    case "withdrawn":
      return { label: "Withdrawn", status: "withdrawn" };
    case "screening":
      return { label: "Screening", status: "screening" };
    case "offer":
      return { label: "Offer", status: "offer" };
    default:
      return { label: status, status };
  }
};

export default function Jobs() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tab = params.get("tab") === "applied" ? "applied" : "saved";
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [appliedPostIds, setAppliedPostIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    setPage(1);
  }, [tab, search, statusFilter]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const userId = await getCurrentUserId();
        if (!userId) return;
        const headers = getAuthHeaders();
        const [savedRes, appliedRes, appsRes] = await Promise.all([
          fetch(`${getBackendUrl()}/api/saved-jobs/user/${userId}`, { headers, credentials: "include" }).catch(() => null),
          fetch(`${getBackendUrl()}/api/applied-jobs/user/${userId}`, { headers, credentials: "include" }).catch(() => null),
          fetch(`${getBackendUrl()}/api/applications/user/${userId}`, { headers, credentials: "include" }).catch(() => null),
        ]);
        if (savedRes && savedRes.ok) setSavedJobs(await savedRes.json());
        if (appliedRes && appliedRes.ok) setAppliedJobs(await appliedRes.json());
        if (appsRes && appsRes.ok) {
          const data = await appsRes.json();
          const applications = data.data || data;
          if (Array.isArray(applications)) setAppliedPostIds(new Set(applications.map((app) => app.post_id)));
        }
      } catch (e) {
        console.error("Error loading jobs:", e);
      } finally {
        setLoading(false);
      }
    };
    load();

    const handleStageChange = (data) => {
      setAppliedJobs((prev) => prev.map((app) => (app.id === data.application_id ? { ...app, pipeline_stage: data.new_stage } : app)));
    };
    socketService.on("application_stage_changed", handleStageChange);
    return () => socketService.off("application_stage_changed", handleStageChange);
  }, []);

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
      if (response.ok) setAppliedPostIds((prev) => new Set([...prev, postId]));
    } catch (error) {
      console.error("Error applying to job:", error);
    }
  };

  const handleCancelApplication = async (applicationId) => {
    if (!window.confirm("Are you sure you want to cancel this job application?")) return;
    setCancelling(applicationId);
    try {
      const response = await fetch(`${getBackendUrl()}/api/applied-jobs/${applicationId}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        setAppliedJobs((prev) => prev.map((app) => (app.id === applicationId ? { ...app, status: "withdrawn", pipeline_stage: "withdrawn" } : app)));
      } else {
        const error = await response.json();
        alert(error.error || "Failed to cancel application");
      }
    } catch (error) {
      alert("Failed to cancel application");
    } finally {
      setCancelling(null);
    }
  };

  const savedFiltered = useMemo(() => {
    if (!search) return savedJobs;
    const q = search.toLowerCase();
    return savedJobs.filter((sj) => {
      const job = sj.post;
      if (!job) return false;
      return (
        job.title?.toLowerCase().includes(q) ||
        job.organization?.name?.toLowerCase().includes(q) ||
        job.location?.toLowerCase().includes(q)
      );
    });
  }, [savedJobs, search]);

  const appliedFiltered = useMemo(() => {
    return appliedJobs.filter((app) => {
      const job = app.post;
      if (!job) return false;
      const matchesSearch =
        !search ||
        job.title?.toLowerCase().includes(search.toLowerCase()) ||
        job.organization?.name?.toLowerCase().includes(search.toLowerCase()) ||
        app.pipeline_stage?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appliedJobs, search, statusFilter]);

  const savedPage = useMemo(
    () => savedFiltered.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [savedFiltered, page, PER_PAGE]
  );
  const appliedPage = useMemo(
    () => appliedFiltered.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [appliedFiltered, page, PER_PAGE]
  );

  const paginationFooter = (total) => {
    const pages = Math.ceil(total / PER_PAGE);
    if (pages <= 1) return null;
    return (
      <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-surface dark:border-line dark:bg-gray-25/80 px-4 py-3">
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Page <span className="font-mono tabular-nums">{page}</span> of{" "}
          <span className="font-mono tabular-nums">{pages}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  const stats = {
    total: appliedJobs.length,
    pending: appliedJobs.filter((a) => a.status === "pending").length,
    reviewed: appliedJobs.filter((a) => a.status === "reviewed").length,
    accepted: appliedJobs.filter((a) => a.status === "accepted").length,
  };

  const statuses = ["pending", "reviewed", "accepted", "rejected", "withdrawn"];

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
  };

  const railContent = (
    <>
      <RailSection title="Application overview">
        <div className="rounded-xl border border-line bg-surface dark:border-line dark:bg-gray-25/80 p-3.5">
          <div className="flex flex-col gap-2.5">
            {[
              { label: "Total", value: stats.total },
              { label: "Pending", value: stats.pending },
              { label: "Under review", value: stats.reviewed },
              { label: "Accepted", value: stats.accepted },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-500">{row.label}</span>
                <span className="font-mono tabular-nums text-[13px] font-medium text-ink">
                  <AnimatedNumber value={row.value} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </RailSection>
    </>
  );

  const savedRowActions = (savedJob) => {
    const job = savedJob.post;
    if (!job) return null;
    const applied = appliedPostIds.has(job.id);
    return (
      <div className="flex items-center gap-2">
        {applied ? (
          <StatusTag status="accepted" className="gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-brand-text" strokeWidth={1.75} />
            <span>Applied</span>
          </StatusTag>
        ) : (
          <Button variant="primary" size="sm" onClick={() => handleApplyJob(job.id)}>
            Apply <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => handleUnsaveJob(savedJob.id)}>
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span>Remove</span>
        </Button>
      </div>
    );
  };

  const appliedRowActions = (application) => {
    const job = application.post;
    if (!job) return null;
    const meta = getStatusMeta(application.status);
    const terminal =
      application.status === "accepted" ||
      application.status === "rejected" ||
      application.status === "withdrawn";
    return (
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => navigate(postPath(job))}>
          <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span>View details</span>
        </Button>
        {terminal ? (
          <StatusTag status={meta.status}>{meta.label}</StatusTag>
        ) : (
          <Button
            variant="danger"
            size="sm"
            disabled={cancelling === application.id}
            onClick={() => handleCancelApplication(application.id)}
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>{cancelling === application.id ? "Cancelling…" : "Cancel"}</span>
          </Button>
        )}
      </div>
    );
  };

  return (
    <AppShell rail={railContent}>
      <CenterBar
        title="Jobs"
        actions={
          <div className="flex items-center gap-2">
            <ButtonLink to="/in/jobs/alerts" variant="secondary" size="sm">
              <Bell className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Job alerts</span>
            </ButtonLink>
            <ButtonLink to="/feed" variant="secondary" size="sm">
              <span>Browse jobs</span>
            </ButtonLink>
          </div>
        }
      />

      <div className="px-4 pb-1 pt-3">
        <p className="text-[11px] leading-4 text-gray-500 dark:text-gray-500">
          <span className="font-mono tabular-nums"><AnimatedNumber value={savedJobs.length} /></span> saved ·{" "}
          <span className="font-mono tabular-nums"><AnimatedNumber value={appliedJobs.length} /></span> applied
        </p>
      </div>

      {/* Saved / Applied tabs with sliding indicator */}
      <div className="px-4 pt-2">
        <AnimatedTabBar
          id="jobs-saved-applied"
          options={[
            { to: "/in/jobs", label: `Saved (${savedJobs.length})` },
            { to: "/in/jobs?tab=applied", label: `Applied (${appliedJobs.length})` },
          ]}
          active={tab === "applied" ? "/in/jobs?tab=applied" : "/in/jobs"}
        />
      </div>

      {/* Search Input with 8-12px clearance */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-500 h-3.5 w-3.5" strokeWidth={1.75} />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "saved" ? "Filter by title, company, location…" : "Filter by title, company, stage…"}
            className="pl-8 pr-8 text-xs leading-4"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-500 hover:bg-gray-50 dark:bg-transparent dark:hover:bg-gray-25 hover:text-ink transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      {/* Status filter — only on Applied tab */}
      {tab === "applied" && (
        <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
          <FilterChip selected={!statusFilter} onClick={() => setStatusFilter("")}>
            All · <span className="font-mono tabular-nums">{stats.total}</span>
          </FilterChip>
          {statuses.map((s) => {
            const meta = getStatusMeta(s);
            const count = appliedJobs.filter((a) => a.status === s).length;
            if (count === 0) return null;
            return (
              <FilterChip key={s} selected={statusFilter === s} onClick={() => setStatusFilter(statusFilter === s ? "" : s)}>
                {meta.label} · <span className="font-mono tabular-nums">{count}</span>
              </FilterChip>
            );
          })}
          {(search || statusFilter) && (
            <button onClick={clearFilters} className="ml-1 text-xs font-semibold text-ink hover:text-brand-text transition-colors">
              Clear
            </button>
          )}
        </div>
      )}

      {loading ? (
        <SkeletonJobList count={5} className="p-4" />
      ) : tab === "saved" ? (
        savedFiltered.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title={savedJobs.length === 0 ? "No saved jobs yet" : "No matches"}
            body={savedJobs.length === 0 ? "Tap the bookmark on any job to save it here for later." : `No saved jobs match “${search}”. Try a different keyword.`}
            action={
              search ? (
                <Button variant="secondary" onClick={() => setSearch("")}>
                  <X className="h-4 w-4" strokeWidth={1.75} /> Clear search
                </Button>
              ) : (
                <ButtonLink to="/feed" variant="secondary">
                  Browse jobs <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </ButtonLink>
              )
            }
          />
        ) : (
          <StaggerList className="mt-2" step={0.03}>
            {savedPage.map((savedJob) => {
              const job = savedJob.post;
              if (!job) return null;
              const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
              const meta = [job.location, job.employment_type, salary].filter(Boolean).join(" · ");
              return (
                <StaggerItem key={savedJob.id}>
                  <JobRow
                    avatar={<OrgMark name={job.organization?.name || "Unknown"} image={job.organization?.profile_image ? getUploadUrl(job.organization.profile_image) : null} />}
                    title={job.title}
                    titleSuffix={job.organization?.name ? `at ${job.organization.name}` : null}
                    meta={meta}
                    time={`Saved ${formatDate(savedJob.saved_at)}`}
                    to={postPath(job)}
                    actions={savedRowActions(savedJob)}
                    mobileActions={savedRowActions(savedJob)}
                  />
                </StaggerItem>
              );
            })}
            {paginationFooter(savedFiltered.length)}
          </StaggerList>
        )
      ) : (
        appliedFiltered.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={appliedJobs.length === 0 ? "No applications yet" : "No matches"}
            body={appliedJobs.length === 0 ? "Once you apply to jobs, they will appear here with real-time status updates." : "Try adjusting your search or status filter."}
            action={
              appliedJobs.length === 0 ? (
                <ButtonLink to="/feed" variant="secondary">
                  Browse jobs <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </ButtonLink>
              ) : (
                <Button variant="secondary" onClick={clearFilters}>
                  <X className="h-4 w-4" strokeWidth={1.75} /> Clear filters
                </Button>
              )
            }
          />
        ) : (
          <StaggerList className="mt-2" step={0.03}>
            {appliedPage.map((application) => {
              const job = application.post;
              if (!job) return null;
              const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
              const metaLine = [job.location, job.employment_type, salary].filter(Boolean).join(" · ");
              return (
                <StaggerItem key={application.id}>
                  <JobRow
                    avatar={<OrgMark name={job.organization?.name || "Unknown"} image={job.organization?.profile_image ? getUploadUrl(job.organization.profile_image) : null} />}
                    title={job.title}
                    titleSuffix={job.organization?.name ? `at ${job.organization.name}` : null}
                    meta={metaLine}
                    time={`Applied ${formatDate(application.applied_at)}`}
                    to={postPath(job)}
                    actions={appliedRowActions(application)}
                    mobileActions={appliedRowActions(application)}
                  />
                </StaggerItem>
              );
            })}
            {paginationFooter(appliedFiltered.length)}
          </StaggerList>
        )
      )}
    </AppShell>
  );
}

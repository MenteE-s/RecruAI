import { OrgAppShell } from "../../components/layout/OrgAppShell";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { getBackendUrl, getAuthHeaders, getCurrentUser } from "../../utils/auth";
import { formatDate } from "../../utils/timezone";
import socketService from "../../utils/socket";
import { Button, ButtonLink } from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { Avatar } from "../../components/ui/Avatar";
import AnimatedNumber from "../../components/motion/AnimatedNumber";
import InteractiveCard from "../../components/motion/InteractiveCard";
import { SkeletonKanban, SkeletonStatGrid } from "../../components/motion/SmartSkeleton";
import {
  Briefcase,
  BarChart2,
  FileText,
  Search,
  Calendar,
  CheckCircle,
  Send,
  Award,
  Check,
  LogOut,
  XCircle,
  AlertCircle,
  WifiOff,
  Lock,
  RefreshCw,
} from "lucide-react";

export default function Pipeline() {
  const [pipelineData, setPipelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const isFetchingRef = useRef(false);

  const pipelineStages = [
    { key: "applied", label: "Applied", icon: FileText },
    { key: "screening", label: "Screening", icon: Search },
    { key: "interview_scheduled", label: "Interview", icon: Calendar },
    { key: "interview_completed", label: "Completed", icon: CheckCircle },
    { key: "offer_extended", label: "Offer", icon: Send },
    { key: "offer_accepted", label: "Accepted", icon: Award },
    { key: "hired", label: "Hired", icon: Check },
    { key: "withdrawn", label: "Withdrawn", icon: LogOut },
    { key: "rejected", label: "Rejected", icon: XCircle },
  ];

  const fetchPipelineData = useCallback(
    async (targetOrgId) => {
      const idToUse = targetOrgId || orgId;
      if (!idToUse) {
        setLoading(false);
        return;
      }

      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${getBackendUrl()}/api/pipeline/${idToUse}`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });

        if (res.ok) {
          const data = await res.json();
          const validList = Array.isArray(data) ? data : [];
          setPipelineData(validList);
          setError(null);
          if (validList.length > 0) {
            setSelectedPost((prev) => {
              const exists = prev && validList.some((item) => item?.post?.id === prev);
              return exists ? prev : validList[0].post.id;
            });
          } else {
            setSelectedPost(null);
          }
        } else {
          let userMessage = "The pipeline data could not be retrieved. Please try again.";
          let errorTitle = "Unable to load pipeline";
          let errorType = "http";

          if (res.status === 401) {
            errorType = "unauthorized";
            errorTitle = "Session expired";
            userMessage =
              "Your session has expired or is invalid. Please sign in again to access the hiring pipeline.";
          } else if (res.status === 403) {
            errorType = "forbidden";
            errorTitle = "Access denied";
            userMessage =
              "You do not have permission to view this organization's hiring pipeline. Please contact an administrator.";
          } else if (res.status >= 500) {
            errorType = "server";
            errorTitle = "Pipeline service unavailable";
            userMessage =
              "The server encountered an error while loading pipeline data. Please try again shortly.";
          } else {
            errorType = "error";
            errorTitle = "Unable to load pipeline";
            userMessage = `The server returned an error (${res.status}). Please try again.`;
          }

          setError({
            type: errorType,
            status: res.status,
            title: errorTitle,
            message: userMessage,
          });
          setPipelineData([]);
          setSelectedPost(null);
        }
      } catch (e) {
        console.error("Pipeline fetch error:", e);
        const isNetworkOrCors =
          e instanceof TypeError ||
          e?.name === "TypeError" ||
          e?.message?.toLowerCase().includes("fetch") ||
          e?.message?.toLowerCase().includes("network");

        setError({
          type: isNetworkOrCors ? "network" : "unknown",
          title: "Unable to connect to pipeline",
          message:
            "Could not reach the pipeline service. Please verify your internet connection and try again.",
        });
        setPipelineData([]);
        setSelectedPost(null);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [orgId]
  );

  useEffect(() => {
    let isMounted = true;
    getCurrentUser()
      .then((u) => {
        if (!isMounted) return;
        if (u?.organization_id) {
          setOrgId(u.organization_id);
          fetchPipelineData(u.organization_id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load user for pipeline:", err);
        if (!isMounted) return;
        setLoading(false);
        setError({
          type: "network",
          title: "Unable to load organization",
          message: "Could not retrieve user organization details. Please check your connection and retry.",
        });
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!orgId) return;
    const handleUpdate = () => fetchPipelineData(orgId);
    socketService.on("application_stage_changed", handleUpdate);
    socketService.on("application_created", handleUpdate);
    return () => {
      socketService.off("application_stage_changed", handleUpdate);
      socketService.off("application_created", handleUpdate);
    };
  }, [orgId, fetchPipelineData]);

  const handleRetry = () => {
    if (!orgId) {
      setLoading(true);
      setError(null);
      getCurrentUser()
        .then((u) => {
          if (u?.organization_id) {
            setOrgId(u.organization_id);
            fetchPipelineData(u.organization_id);
          } else {
            setLoading(false);
            setError({
              type: "forbidden",
              title: "No organization access",
              message: "Your account does not belong to an active organization.",
            });
          }
        })
        .catch(() => {
          setLoading(false);
          setError({
            type: "network",
            title: "Unable to connect",
            message: "Could not retrieve organization information. Please check your connection and try again.",
          });
        });
    } else {
      fetchPipelineData(orgId);
    }
  };

  const updatePipelineStage = async (applicationId, newStage) => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/pipeline/application/${applicationId}/stage`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ pipeline_stage: newStage }),
      });
      if (res.ok) fetchPipelineData(orgId);
    } catch (e) {
      console.error(e);
    }
  };

  const getCurrentPostData = () =>
    pipelineData.find((item) => item?.post?.id === selectedPost) || null;

  const renderCandidateCard = (candidate, currentStage) => {
    const { application } = candidate;
    const user = application?.user || {};
    return (
      <InteractiveCard key={application.id} className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-3.5 shadow-s5">
        <div className="flex items-center gap-2.5">
          <Avatar name={user.name || "Anonymous"} size="md" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-ink">{user.name || "Anonymous"}</p>
            <p className="truncate text-[11px] text-gray-500 dark:text-gray-500" title={user.email || ""}>{user.email || ""}</p>
          </div>
        </div>
        <p className="mt-2 font-mono tabular-nums text-[11px] text-gray-500 dark:text-gray-500">
          Applied {formatDate(application.applied_at)}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1">
          {pipelineStages.slice(0, 5).map((stage) => {
            const Icon = stage.icon;
            const active = currentStage === stage.key;
            return (
              <Button
                key={stage.key}
                variant={active ? "primary" : "secondary"}
                size="sm"
                className="h-7 w-7 px-0"
                onClick={() => updatePipelineStage(application.id, stage.key)}
                title={stage.label}
                aria-label={`${stage.label}: ${user.name || "Anonymous"}`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Button>
            );
          })}
        </div>
      </InteractiveCard>
    );
  };

  if (loading && !pipelineData.length && !error) {
    return (
      <OrgAppShell>
        <div className="space-y-4 px-4 py-4">
          <SkeletonStatGrid count={3} />
          <SkeletonKanban columns={4} />
        </div>
      </OrgAppShell>
    );
  }

  const currentPostData = getCurrentPostData();

  return (
    <OrgAppShell>
      <div className="space-y-4 px-4 py-4">
        {/* Header + Stats card */}
        <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-5 shadow-s5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-[20px] font-semibold leading-7 text-ink">
                <BarChart2 className="h-5 w-5 text-brand-text" strokeWidth={1.75} /> Hiring pipeline
              </h1>
              <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-500">
                Track candidates across each stage — from application to offer and hired.
              </p>
            </div>
            {!error && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-line dark:border-line bg-gray-50 dark:bg-gray-25 p-3.5 text-center shadow-s5">
                  <AnimatedNumber value={pipelineData.length} className="font-mono tabular-nums text-xl font-bold text-ink" />
                  <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-500">Posts</p>
                </div>
                <div className="rounded-xl border border-line dark:border-line bg-gray-50 dark:bg-gray-25 p-3.5 text-center shadow-s5">
                  <AnimatedNumber
                    value={currentPostData ? Object.values(currentPostData.stages).flat().length : 0}
                    className="font-mono tabular-nums text-xl font-bold text-ink"
                  />
                  <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-500">Candidates</p>
                </div>
                <div className="rounded-xl border border-brand/20 bg-brand/10 p-3.5 text-center shadow-s5">
                  <AnimatedNumber
                    value={currentPostData?.stages?.hired?.length || 0}
                    className="font-mono tabular-nums text-xl font-bold text-brand-text"
                  />
                  <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-500">Hired</p>
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 self-start lg:self-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRetry}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={1.75} />
                  <span>{loading ? "Retrying…" : "Retry"}</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ERROR STATE */}
        {error ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 px-6 py-16 text-center shadow-s15">
            <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
              <span className="absolute inset-0 rounded-2xl bg-red-50 dark:bg-red-500/10" aria-hidden />
              <span className="absolute -right-1 top-1 h-3 w-3 rounded-full bg-red-400/25" aria-hidden />
              <span className="absolute -left-2 bottom-2 h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-25" aria-hidden />
              {error.type === "network" ? (
                <WifiOff className="relative h-7 w-7 text-red-500 dark:text-red-400" strokeWidth={1.75} aria-hidden />
              ) : error.type === "forbidden" || error.type === "unauthorized" ? (
                <Lock className="relative h-7 w-7 text-amber-500 dark:text-amber-400" strokeWidth={1.75} aria-hidden />
              ) : (
                <AlertCircle className="relative h-7 w-7 text-red-500 dark:text-red-400" strokeWidth={1.75} aria-hidden />
              )}
            </div>
            <h3 className="text-sm font-semibold text-ink">{error.title}</h3>
            <p className="mt-1 max-w-md text-[13px] leading-relaxed text-gray-500 dark:text-gray-500">{error.message}</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRetry}
                disabled={loading}
                className="inline-flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={1.75} />
                <span>{loading ? "Retrying…" : "Retry"}</span>
              </Button>
              {error.type === "forbidden" && (
                <ButtonLink to="/org" variant="primary" size="sm">
                  Go to dashboard
                </ButtonLink>
              )}
              {error.type === "unauthorized" && (
                <ButtonLink to="/signin" variant="primary" size="sm">
                  Sign in
                </ButtonLink>
              )}
            </div>
          </div>
        ) : pipelineData.length > 0 && currentPostData ? (
          /* POPULATED STATE */
          <>
            {/* Job Post selector tabs card */}
            <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-4 shadow-s5">
              <h3 className="mb-2.5 text-xs font-semibold text-gray-500 dark:text-gray-500">
                Select job post
              </h3>
              <div className="flex flex-wrap gap-2">
                {pipelineData.map((item) => {
                  const isSelected = selectedPost === item.post.id;
                  return (
                    <Button
                      key={item.post.id}
                      variant={isSelected ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setSelectedPost(item.post.id)}
                    >
                      <span>{item.post.title}</span>
                      <span className={`ml-1 font-mono tabular-nums text-xs ${isSelected ? "text-white/80" : "text-gray-500 dark:text-gray-500"}`}>
                        ({item.total_candidates})
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Kanban Board card */}
            <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-5 shadow-s5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold text-ink">{currentPostData.post.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {currentPostData.post.location || "Remote"} • <span className="font-mono tabular-nums">{currentPostData.total_candidates}</span> active candidates
                </p>
              </div>

              {/* Horizontal scroll Kanban stages */}
              <div className="mt-5 flex snap-x gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-thin">
                {pipelineStages.map((stage) => {
                  const Icon = stage.icon;
                  const candidates = currentPostData.stages[stage.key] || [];
                  return (
                    <div
                      key={stage.key}
                      className={`w-[226px] shrink-0 snap-start rounded-xl border p-3.5 shadow-s5 transition-all ${
                        candidates.length
                          ? "border-line dark:border-line bg-gray-50 dark:bg-gray-25/60"
                          : "border-dashed border-line dark:border-line bg-surface dark:bg-gray-25"
                      }`}
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500 dark:text-gray-600" strokeWidth={1.75} />
                        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-700">
                          {stage.label}
                        </h4>
                        <span className="ml-auto rounded-full border border-line dark:border-line bg-surface dark:bg-gray-25 px-2 py-0.5 font-mono tabular-nums text-xs font-semibold text-ink shadow-s5">
                          {candidates.length}
                        </span>
                      </div>
                      <div className="max-h-72 space-y-2 overflow-y-auto">
                        {candidates.map((c) => renderCandidateCard(c, stage.key))}
                        {candidates.length === 0 && (
                          <p className="py-6 text-center text-xs italic text-gray-500 dark:text-gray-500">
                            No candidates
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </>
        ) : (
          /* EMPTY STATE */
          <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-8 shadow-s5">
            <EmptyState
              icon={Briefcase}
              title="No candidates in pipeline"
              body="There are currently no active candidates in your pipeline. Publish job posts and review applications to track candidates through hiring stages."
              action={
                <ButtonLink to="/org/jobs" variant="secondary" size="sm">
                  Open job posts
                </ButtonLink>
              }
            />
          </div>
        )}
      </div>
    </OrgAppShell>
  );
}

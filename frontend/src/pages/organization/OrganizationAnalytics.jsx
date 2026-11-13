import { OrgAppShell } from "../../components/layout/OrgAppShell";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import AnimatedNumber from "../../components/motion/AnimatedNumber";
import { useNavigate } from "react-router-dom";
import { getBackendUrl, getAuthHeaders, verifyTokenWithServer } from "../../utils/auth";
import { formatDate } from "../../utils/timezone";
import DualTime from "../../components/ui/DualTime";
import EmptyState from "../../components/ui/EmptyState";
import {
  BarChart2,
  Award,
  Users,
  Target,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export default function OrganizationAnalytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orgError, setOrgError] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchInterviewAnalytics(); }, []);

  const fetchInterviewAnalytics = async () => {
    try {
      // Resolve the authenticated organization context — never a hardcoded id.
      const user = await verifyTokenWithServer();
      const resolvedOrgId = user?.organization_id;
      if (!resolvedOrgId) {
        setOrgError("No organization access");
        setLoading(false);
        return;
      }
      const res = await fetch(`${getBackendUrl()}/api/organizations/${resolvedOrgId}/analytics`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) setAnalytics(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <OrgAppShell>
        <div className="space-y-4 px-4 pb-4 pt-4">
          <div className="h-44 animate-pulse rounded-xl border border-line bg-surface shadow-s5" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl border border-line bg-surface shadow-s5" />)}
          </div>
          <div className="h-48 animate-pulse rounded-xl border border-line bg-surface shadow-s5" />
        </div>
      </OrgAppShell>
    );
  }

  if (orgError) {
    return (
      <OrgAppShell>
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-s5">
            <BarChart2 className="mx-auto mb-4 h-8 w-8 text-gray-500" strokeWidth={1.75} />
            <h1 className="text-base font-semibold text-ink">No organization access</h1>
            <p className="mt-1 text-xs text-gray-500">Analytics are available to organization members.</p>
          </div>
        </div>
      </OrgAppShell>
    );
  }

  const hasData = analytics && analytics.total_interviews_analyzed > 0;

  const chipCls = "inline-flex items-center rounded-full border border-line bg-gray-50 dark:bg-gray-25 px-2.5 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-600";
  const statusChip = (status) =>
    status === "completed"
      ? "bg-brand/10 text-brand-text border-brand/20 capitalize"
      : status === "cancelled"
        ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30 capitalize"
        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30 capitalize";

  return (
    <OrgAppShell>
      {/* Header */}
      <div className="px-4 pb-4 pt-4">
        <div className="rounded-xl border border-line bg-surface p-5 shadow-s5 card-hover">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand-text shadow-s5">
                  <BarChart2 className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <h1 className="text-xl font-bold tracking-tight text-ink">Organization analytics</h1>
              </div>
              <p className="mt-1 text-xs text-gray-500">Insights into performance, candidate evaluations, and hiring trends.</p>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-line bg-gray-50 dark:bg-gray-25 p-3 text-center shadow-s5">
                <AnimatedNumber value={analytics?.total_interviews_analyzed || 0} className="text-lg font-bold font-mono tabular-nums text-ink" />
                <p className="mt-0.5 text-[11px] font-medium text-gray-500">Analyzed</p>
              </div>
              <div className="rounded-xl border border-line bg-gray-50 dark:bg-gray-25 p-3 text-center shadow-s5">
                <AnimatedNumber value={analytics?.average_scores?.overall ?? null} suffix="%" className="text-lg font-bold font-mono tabular-nums text-ink" />
                <p className="mt-0.5 text-[11px] font-medium text-gray-500">Avg score</p>
              </div>
              <div className="rounded-xl border border-brand/20 bg-brand/10 p-3 text-center shadow-s5">
                <AnimatedNumber value={analytics?.pass_rate ?? null} suffix="%" className="text-lg font-bold font-mono tabular-nums text-brand-text" />
                <p className="mt-0.5 text-[11px] font-medium text-gray-500">Pass rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="px-4 pb-4">
          <div className="rounded-xl border border-line bg-surface p-8 shadow-s5">
            <EmptyState
              icon={BarChart2}
              title="No analytics yet"
              body="Complete interviews and generate analyses to see insights here."
            />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 px-4 pb-4 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-surface p-5 text-center shadow-s5">
              <AnimatedNumber value={analytics?.total_interviews_analyzed || 0} className="text-2xl font-bold font-mono tabular-nums tracking-tight text-ink" />
              <p className="mt-1 text-xs font-medium text-gray-500">Interviews analyzed</p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5 text-center shadow-s5">
              <AnimatedNumber value={analytics?.average_scores?.overall ?? null} suffix="%" className="text-2xl font-bold font-mono tabular-nums tracking-tight text-ink" />
              <p className="mt-1 text-xs font-medium text-gray-500">Avg overall</p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5 text-center shadow-s5">
              <AnimatedNumber value={analytics?.pass_rate ?? null} suffix="%" className="text-2xl font-bold font-mono tabular-nums tracking-tight text-ink" />
              <p className="mt-1 text-xs font-medium text-gray-500">Pass rate</p>
            </div>
            <div className="rounded-xl border border-brand/20 bg-brand/10 p-5 text-center shadow-s5">
              <AnimatedNumber value={analytics?.top_strengths?.length || 0} className="text-2xl font-bold font-mono tabular-nums tracking-tight text-brand-text" />
              <p className="mt-1 text-xs font-medium text-gray-500">Top skills</p>
            </div>
          </div>

          {analytics?.average_scores && (
            <div className="px-4 pb-4">
              <div className="rounded-xl border border-line bg-surface p-5 shadow-s5 card-hover">
                <div className="flex items-center gap-2 border-b border-line pb-4">
                  <Target className="h-4 w-4 text-gray-500" strokeWidth={1.75} />
                  <h2 className="text-sm font-semibold text-ink">Average scores</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Communication", score: analytics.average_scores.communication, icon: Users },
                    { label: "Technical", score: analytics.average_scores.technical, icon: Award },
                    { label: "Problem solving", score: analytics.average_scores.problem_solving, icon: Target },
                    { label: "Cultural fit", score: analytics.average_scores.cultural_fit, icon: Users },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="rounded-xl border border-line bg-gray-50 dark:bg-gray-25 p-4 text-center shadow-s5">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-line shadow-s5">
                          <Icon className="h-4 w-4 text-gray-500" strokeWidth={1.75} />
                        </div>
                        <AnimatedNumber value={item.score ?? null} suffix="%" className="mt-3 text-2xl font-bold font-mono tabular-nums text-ink" />
                        <p className="mt-1 text-xs font-medium text-gray-500">{item.label}</p>
                        {item.score && (
                          <div className="mt-3 h-2 rounded-full bg-line/60 dark:bg-gray-700/50">
                            <motion.div
                              className="h-2 rounded-full bg-brand"
                              initial={{ width: 0 }}
                              animate={{ width: `${item.score}%` }}
                              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 px-4 pb-4 lg:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface p-5 shadow-s5 card-hover">
              <div className="flex items-center gap-2 border-b border-line pb-4">
                <CheckCircle className="h-4 w-4 text-brand-text" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold text-ink">Most common strengths</h2>
              </div>
              <div className="space-y-3.5 pt-4">
                {analytics?.top_strengths?.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-600">{s.skill}</span>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <div className="h-2 w-20 rounded-full bg-line/60 dark:bg-gray-700/50">
                        <div className="h-2 rounded-full bg-brand" style={{ width: `${(s.count / analytics.total_interviews_analyzed) * 100}%` }} />
                      </div>
                      <span className="w-6 text-right text-xs font-semibold font-mono tabular-nums text-ink">{s.count}</span>
                    </div>
                  </div>
                )) || <p className="text-xs text-gray-500">No data</p>}
              </div>
            </div>

            <div className="rounded-xl border border-line bg-surface p-5 shadow-s5 card-hover">
              <div className="flex items-center gap-2 border-b border-line pb-4">
                <AlertTriangle className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold text-ink">Common improvements</h2>
              </div>
              <div className="space-y-3.5 pt-4">
                {analytics?.common_improvements?.slice(0, 5).map((imp, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-600">{imp.area}</span>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <div className="h-2 w-20 rounded-full bg-line/60 dark:bg-gray-700/50">
                        <div className="h-2 rounded-full bg-amber-500" style={{ width: `${(imp.count / analytics.total_interviews_analyzed) * 100}%` }} />
                      </div>
                      <span className="w-6 text-right text-xs font-semibold font-mono tabular-nums text-ink">{imp.count}</span>
                    </div>
                  </div>
                )) || <p className="text-xs text-gray-500">No data</p>}
              </div>
            </div>
          </div>

          {analytics?.analytics?.length > 0 && (
            <div className="px-4 pb-4">
              <div className="rounded-xl border border-line bg-surface p-5 shadow-s5 card-hover">
                <div className="flex items-center gap-2 border-b border-line pb-4">
                  <BarChart2 className="h-4 w-4 text-gray-500" strokeWidth={1.75} />
                  <h2 className="text-sm font-semibold text-ink">Recent analyses</h2>
                </div>
                <div className="space-y-3 pt-4">
                  {analytics.analytics.slice(0, 5).map((analysis) => (
                    <button
                      key={analysis.id}
                      type="button"
                      onClick={() => navigate(`/in/interviews/${analysis.interview_id}/analysis`)}
                      className="flex w-full flex-col gap-3 rounded-xl border border-line bg-surface p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-25 sm:flex-row sm:items-center sm:justify-between shadow-s5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">Interview <span className="font-mono tabular-nums">#{analysis.interview_id}</span></p>
                        <p className="mt-0.5 text-xs text-gray-500">{formatDate(analysis.created_at)}</p>
                        <div className="mt-2 flex gap-1.5">
                          <span className={chipCls}>Comm <span className="font-mono tabular-nums ml-1">{analysis.communication_score || "--"}</span></span>
                          <span className={chipCls}>Tech <span className="font-mono tabular-nums ml-1">{analysis.technical_score || "--"}</span></span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end sm:gap-0.5">
                        <p className="text-lg font-bold font-mono tabular-nums text-ink">{analysis.overall_score}/100</p>
                        <span className="flex items-center gap-1 text-xs font-semibold text-brand-text">View <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} /></span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {analytics?.recent_interviews?.length > 0 && (
            <div className="px-4 pb-4">
              <div className="rounded-xl border border-line bg-surface p-5 shadow-s5 card-hover">
                <div className="flex items-center gap-2 border-b border-line pb-4">
                  <Users className="h-4 w-4 text-gray-500" strokeWidth={1.75} />
                  <h2 className="text-sm font-semibold text-ink">Recent interviews</h2>
                </div>
                <div className="space-y-3 pt-4">
                  {analytics.recent_interviews.slice(0, 5).map((interview) => (
                    <button
                      key={interview.id}
                      type="button"
                      onClick={() => navigate(`/in/interviews/${interview.id}/analysis`)}
                      className="flex w-full flex-col gap-3 rounded-xl border border-line bg-surface p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-25 sm:flex-row sm:items-center sm:justify-between shadow-s5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{interview.title || `Interview #${interview.id}`}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          <DualTime value={interview.scheduled_at_iso || interview.scheduled_at} otherTimezone={interview.candidate_timezone} otherLabel={interview.user_name} variant="compact" showRelative={false} /> • <span className="font-mono tabular-nums">{interview.duration_minutes}</span> min • {interview.interview_type}
                        </p>
                        {interview.post_title && <p className="mt-1 text-xs font-semibold text-brand-text">{interview.post_title}</p>}
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusChip(interview.status)}`}>{interview.status}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </OrgAppShell>
  );
}

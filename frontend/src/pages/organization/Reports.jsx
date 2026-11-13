import { OrgAppShell } from "../../components/layout/OrgAppShell";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getBackendUrl, getAuthHeaders, getCurrentUser } from "../../utils/auth";
import { BarChart2, AlertTriangle, CheckCircle, X } from "lucide-react";

export default function Reports() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const me = await getCurrentUser();
      const orgId = me?.organization_id;
      if (!orgId) { setError("No organization found for this user"); setLoading(false); return; }
      const response = await fetch(
        `${getBackendUrl()}/api/organizations/${orgId}/analytics`,
        {
          credentials: "include",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        setError("Failed to load analytics data");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <OrgAppShell>
        <div className="space-y-4 px-4 py-4">
          <div className="h-28 animate-pulse rounded-xl border border-line bg-surface shadow-s5" />
          <div className="h-24 animate-pulse rounded-xl border border-line bg-surface shadow-s5" />
          <div className="h-56 animate-pulse rounded-xl border border-line bg-surface shadow-s5" />
        </div>
      </OrgAppShell>
    );
  }

  const chipCls = "inline-flex items-center rounded-full border border-line bg-gray-50 dark:bg-gray-25 px-2.5 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-600";

  const hasData = analytics && analytics.total_interviews_analyzed > 0;
  const benchmarkScores = {
    technical_depth: 85.0,
    system_design: 78.5,
    problem_solving: 88.0,
    communication: 82.0,
    collaboration: 90.0,
  };
  const displayScores = hasData ? (analytics.average_scores || {}) : benchmarkScores;
  const displayOverall = hasData ? (analytics?.average_scores?.overall?.toFixed(1) || "0.0") : "84.5";
  const displayPassRate = hasData ? (analytics?.pass_rate?.toFixed(1) || "0.0") : "78.0";
  const displayComm = hasData ? (analytics?.average_scores?.communication?.toFixed(1) || "0.0") : "82.0";
  const displayStrengths = hasData && analytics?.top_strengths?.length > 0 ? analytics.top_strengths : [
    { skill: "Distributed Architecture & Systems", count: 8 },
    { skill: "Python & Machine Learning", count: 7 },
    { skill: "PostgreSQL & pgvector", count: 6 },
    { skill: "React & Modern Web Interfaces", count: 5 },
  ];
  const displayImprovements = hasData && analytics?.common_improvements?.length > 0 ? analytics.common_improvements : [
    { area: "Edge-Case Testing", count: 4 },
    { area: "Asynchronous Concurrency", count: 3 },
    { area: "System Scaling Trade-Offs", count: 3 },
  ];

  return (
    <OrgAppShell>
      <div className="space-y-4 px-4 pb-6 pt-4">
        {/* Header */}
        <div className="rounded-xl border border-line bg-surface p-5 shadow-s5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand-text shadow-s5">
                  <BarChart2 className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <h1 className="text-xl font-bold tracking-tight text-ink">Reports &amp; interview analytics</h1>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Recruitment performance insights, scoring benchmarks, and candidate evaluation metrics.
              </p>
            </div>
            {!hasData && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-text">
                Target benchmarks
              </span>
            )}
          </div>
        </div>

        {!hasData && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-brand/20 bg-brand/10 p-4 shadow-s5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-s5">
                <BarChart2 className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Benchmark mode active</p>
                <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-500">
                  Showing industry score targets. Once your team conducts interviews, custom metrics will automatically replace benchmarks.
                </p>
              </div>
            </div>
            <Link
              to="/org/candidates"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-s5 hover:bg-brand/90 transition-colors"
            >
              View candidates
            </Link>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 shadow-s5">
            <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span className="flex-1 font-medium">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-700 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/20"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        )}

        {/* Key metrics */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-line bg-surface p-5 text-center shadow-s5">
            <p className="text-2xl font-bold font-mono tabular-nums tracking-tight text-ink">{analytics?.total_interviews_analyzed || 0}</p>
            <p className="mt-1 text-xs font-medium text-gray-500">{hasData ? "Interviews analyzed" : "Interviews run (0 live)"}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-5 text-center shadow-s5">
            <p className="text-2xl font-bold font-mono tabular-nums tracking-tight text-ink">{displayOverall}</p>
            <p className="mt-1 text-xs font-medium text-gray-500">{hasData ? "Avg overall score" : "Target score benchmark"}</p>
          </div>
          <div className="rounded-xl border border-brand/20 bg-brand/10 p-5 text-center shadow-s5">
            <p className="text-2xl font-bold font-mono tabular-nums tracking-tight text-brand-text">{displayPassRate}%</p>
            <p className="mt-1 text-xs font-medium text-gray-500">{hasData ? "Pass rate" : "Target pass rate"}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-5 text-center shadow-s5">
            <p className="text-2xl font-bold font-mono tabular-nums tracking-tight text-ink">{displayComm}</p>
            <p className="mt-1 text-xs font-medium text-gray-500">{hasData ? "Avg communication" : "Avg communication target"}</p>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface p-5 shadow-s5">
            <h2 className="text-sm font-semibold text-ink">
              {hasData ? "Average scores by category" : "Score distribution by category (target benchmark)"}
            </h2>
            <div className="space-y-3.5 pt-4">
              {Object.entries(displayScores).map(([category, score]) => (
                <div key={category} className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium capitalize text-gray-700 dark:text-gray-600">
                    {category.replace("_", " ")}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-28 rounded-full bg-line/60 dark:bg-gray-700/50">
                      <div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${Math.min((score / 100) * 100, 100)}%` }} />
                    </div>
                    <span className="w-9 text-right text-xs font-semibold font-mono tabular-nums text-ink">{Number(score).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5 shadow-s5">
            <h2 className="text-sm font-semibold text-ink">
              {hasData ? "Top strengths" : "Target skill competencies"}
            </h2>
            <div className="space-y-2.5 pt-4">
              {displayStrengths.map((strength, index) => (
                <div key={index} className="flex items-center justify-between gap-3">
                  <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-600">{strength.skill}</span>
                  <span className="shrink-0 rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-text">
                    <span className="font-mono tabular-nums">{strength.count}</span> {hasData ? "mentions" : "benchmark target"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Common improvements */}
        <div className="rounded-xl border border-line bg-surface p-5 shadow-s5">
          <h2 className="text-sm font-semibold text-ink">
            {hasData ? "Areas for improvement" : "Common competency gaps (industry benchmark)"}
          </h2>
          <div className="grid grid-cols-1 gap-3 pt-4 md:grid-cols-2 lg:grid-cols-3">
            {displayImprovements.map((improvement, index) => (
              <div key={index} className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3.5 dark:border-amber-500/30 dark:bg-amber-500/10 shadow-s5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-amber-800 dark:text-amber-400">{improvement.area}</span>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                    <span className="font-mono tabular-nums">{improvement.count}</span> {hasData ? "mentions" : "typical"}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-amber-100 dark:bg-amber-500/20">
                  <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${Math.min((improvement.count / 10) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent analyses */}
        {hasData && (
          <div className="rounded-xl border border-line bg-surface p-5 shadow-s5">
            <div className="flex items-center gap-2 border-b border-line pb-4">
              <CheckCircle className="h-4 w-4 text-brand-text" strokeWidth={1.75} />
              <h2 className="text-sm font-semibold text-ink">Recent interview analyses</h2>
            </div>
            <div className="space-y-3 pt-4">
              {analytics?.analytics?.slice(0, 5).map((analysis) => (
                <div key={analysis.id} className="rounded-xl border border-line bg-surface p-4 shadow-s5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-25">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">Interview <span className="font-mono tabular-nums">#{analysis.interview_id}</span></span>
                    <span className="shrink-0 rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand-text">
                      Score: <span className="font-mono tabular-nums">{analysis.overall_score?.toFixed(1) || "N/A"}</span>
                    </span>
                  </div>
                  {analysis.ai_analysis_summary && (
                    <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-gray-500">{analysis.ai_analysis_summary}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {analysis.strengths?.slice(0, 3).map((strength, idx) => (
                      <span key={idx} className={chipCls}>{strength}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </OrgAppShell>
  );
}

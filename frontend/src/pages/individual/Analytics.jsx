import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { AppShell, CenterBar } from "../../components/layout/AppShell";
import AnimatedNumber from "../../components/motion/AnimatedNumber";
import { getBackendUrl, getAuthHeaders, getCurrentUserId } from "../../utils/auth";
import { formatDate } from "../../utils/timezone";
import {
  FiBarChart2,
  FiTrendingUp,
  FiAward,
  FiAlertTriangle,
  FiCheckCircle,
  FiBriefcase,
  FiMessageSquare,
  FiCpu,
  FiTarget,
  FiUsers,
  FiArrowRight,
  FiEye,
} from "react-icons/fi";

export default function Analytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    getCurrentUserId().then((id) => {
      if (!id) { setLoading(false); return; }
      setUserId(id);
      fetchInterviewAnalytics(id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInterviewAnalytics = async (uid) => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/users/${uid || userId}/analytics`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (response.ok) setAnalytics(await response.json());
    } catch (error) {
      console.error("Error fetching interview analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <CenterBar title="Analytics" backTo="/feed" />
        <div className="p-4 md:p-6 space-y-4">
          <div className="h-10 w-[320px] bg-gray-100 dark:bg-gray-25 animate-pulse rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface border border-line rounded-xl h-28 animate-pulse" />
            ))}
          </div>
          <div className="bg-surface border border-line rounded-xl h-48 animate-pulse" />
        </div>
      </AppShell>
    );
  }

  const hasData = analytics && analytics.total_interviews > 0;

  return (
    <AppShell>
      <CenterBar title="Analytics" backTo="/feed" />

      <div className="p-4 md:p-6 space-y-6">
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-line rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-text">
              <FiBarChart2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Interview performance analytics</h2>
              <p className="text-xs text-gray-500">Track scores, verified competencies, and AI recommendations</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-gray-50 dark:bg-gray-25 border border-line px-3 py-1.5 rounded-lg shrink-0">
            <FiTrendingUp className="h-3.5 w-3.5 text-brand-text" />
            <span><span className="font-mono tabular-nums">{analytics?.total_interviews || 0}</span> interviews completed</span>
          </div>
        </div>

        {!hasData ? (
          <div className="bg-surface border border-line rounded-xl p-10 sm:p-14 text-center">
            <div className="h-12 w-12 rounded-xl bg-gray-50 dark:bg-gray-25 border border-line flex items-center justify-center mx-auto mb-4">
              <FiBarChart2 className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="text-base font-bold text-ink">No interview data yet</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Complete mock or practice interviews to see your performance feedback, AI scoring breakdowns, and competency trends here.
            </p>
            <button
              onClick={() => navigate("/in/interviews/upcoming")}
              className="mt-5 inline-flex items-center gap-2 bg-brand-action text-white px-4 py-2 text-xs font-semibold rounded-lg hover:bg-brand/90 transition-colors"
            >
              View upcoming interviews <FiArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-surface border border-line rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total interviews</p>
                  <FiBriefcase className="h-4 w-4 text-gray-500" />
                </div>
                <AnimatedNumber value={analytics?.total_interviews || 0} className="text-2xl font-bold text-ink mt-2 font-mono tabular-nums" />
                <p className="text-xs text-gray-500 mt-0.5">All time</p>
              </div>

              <div className="bg-surface border border-line rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Avg overall</p>
                  <FiAward className="h-4 w-4 text-brand-text" />
                </div>
                <AnimatedNumber
                  value={analytics?.average_scores?.overall ? Number(analytics.average_scores.overall) : null}
                  format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                  className="text-2xl font-bold text-brand-text mt-2 font-mono tabular-nums"
                />
                <p className="text-xs text-gray-500 mt-0.5">Out of 100</p>
              </div>

              <div className="bg-surface border border-line rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Strengths</p>
                  <FiCheckCircle className="h-4 w-4 text-brand-text" />
                </div>
                <AnimatedNumber value={analytics?.strengths?.length || 0} className="text-2xl font-bold text-ink mt-2 font-mono tabular-nums" />
                <p className="text-xs text-gray-500 mt-0.5">Identified</p>
              </div>

              <div className="bg-surface border border-line rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">To improve</p>
                  <FiAlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <AnimatedNumber value={analytics?.improvements?.length || 0} className="text-2xl font-bold text-ink mt-2 font-mono tabular-nums" />
                <p className="text-xs text-gray-500 mt-0.5">Focus areas</p>
              </div>
            </div>

            {/* Performance Scores */}
            {analytics?.average_scores && (
              <div className="bg-surface border border-line rounded-xl p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <FiTarget className="h-4 w-4 text-gray-500" /> Competency Breakdown
                </h3>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Communication", key: "communication", icon: FiMessageSquare },
                    { label: "Technical", key: "technical", icon: FiCpu },
                    { label: "Problem solving", key: "problem_solving", icon: FiTarget },
                    { label: "Cultural fit", key: "cultural_fit", icon: FiUsers },
                  ].map((item) => {
                    const score = analytics.average_scores[item.key];
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="border border-line rounded-lg p-3.5 text-center bg-gray-50/50 dark:bg-gray-25/50">
                        <div className="h-8 w-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto text-brand-text">
                          <Icon className="h-4 w-4" />
                        </div>
                        <AnimatedNumber
                          value={score != null ? Number(score) : null}
                          format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                          className="text-xl font-bold text-ink mt-2.5 font-mono tabular-nums"
                        />
                        <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
                        {score != null && (
                          <div className="mt-2.5 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                            <motion.div
                              className="bg-brand h-1.5 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, score)}%` }}
                              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {analytics.average_scores.overall != null && (
                  <div className="mt-5 bg-gray-50 dark:bg-gray-25 border border-line rounded-xl p-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-600">Overall Assessment Average</span>
                    <span className="text-base font-bold text-brand-text font-mono tabular-nums">
                      <AnimatedNumber
                        value={Number(analytics.average_scores.overall)}
                        format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                      />{" "}
                      / 100
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Strengths & Improvement Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-surface border border-line rounded-xl p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <FiCheckCircle className="h-4 w-4 text-brand-text" /> Key strengths
                </h3>
                <div className="mt-3.5 space-y-2">
                  {analytics?.strengths && analytics.strengths.length > 0 ? (
                    analytics.strengths.map((s, i) => (
                      <div key={i} className="flex gap-2.5 p-2.5 bg-brand/5 border border-brand/10 rounded-lg">
                        <FiCheckCircle className="h-4 w-4 text-brand-text shrink-0 mt-0.5" />
                        <span className="text-xs text-ink leading-relaxed">{s}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-25 border border-line rounded-lg p-3 text-center">
                      No strength data recorded yet
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-surface border border-line rounded-xl p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <FiTarget className="h-4 w-4 text-amber-500" /> Areas to improve
                </h3>
                <div className="mt-3.5 space-y-2">
                  {analytics?.improvements && analytics.improvements.length > 0 ? (
                    analytics.improvements.map((imp, i) => (
                      <div key={i} className="flex gap-2.5 p-2.5 bg-amber-50/50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
                        <FiAlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-xs text-ink leading-relaxed">{imp}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-25 border border-line rounded-lg p-3 text-center">
                      No improvement areas recorded yet
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Performance Trend */}
            {analytics?.performance_trend && analytics.performance_trend.length > 0 && (
              <div className="bg-surface border border-line rounded-xl p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <FiTrendingUp className="h-4 w-4 text-gray-500" /> Performance trend
                </h3>
                <div className="mt-5 flex items-end gap-2 overflow-x-auto pb-2">
                  {analytics.performance_trend.map((pt, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5 min-w-[56px] flex-1">
                      <span className="text-xs font-semibold text-ink font-mono tabular-nums">{pt.score}</span>
                      <div className="w-full max-w-[40px] bg-brand rounded-t-md" style={{ height: `${Math.max(12, (pt.score / 100) * 120)}px` }} />
                      <span className="text-[10px] text-gray-500 text-center leading-tight font-mono tabular-nums">{pt.date}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Latest: <b className="text-ink font-mono tabular-nums">{analytics.performance_trend[analytics.performance_trend.length - 1]?.score || "—"}</b> • {analytics.performance_trend.length} evaluations
                </p>
              </div>
            )}

            {/* Recent Evaluations */}
            {analytics?.analytics && analytics.analytics.length > 0 && (
              <div className="bg-surface border border-line rounded-xl p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">Recent Feedback Analyses</h3>
                  <span className="text-xs text-gray-500"><span className="font-mono tabular-nums">{analytics.analytics.length}</span> recorded</span>
                </div>
                <div className="mt-3.5 space-y-3">
                  {analytics.analytics.slice(0, 3).map((analysis) => (
                    <div
                      key={analysis.id}
                      onClick={() => navigate(`/in/interviews/${analysis.interview_id}/analysis`)}
                      className="border border-line rounded-xl p-4 hover:border-brand/30 hover:bg-gray-50 dark:hover:bg-gray-25 cursor-pointer group transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-ink group-hover:text-brand-text transition-colors">
                            Interview #<span className="font-mono tabular-nums">{analysis.interview_id}</span>
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5 font-mono tabular-nums">{formatDate(analysis.created_at)}</p>
                          {analysis.ai_analysis_summary && (
                            <p className="text-xs text-gray-600 dark:text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                              {analysis.ai_analysis_summary}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {analysis.strengths?.slice(0, 2).map((s, idx) => (
                              <span key={idx} className="text-[11px] bg-brand/10 text-brand-text border border-brand/20 px-2 py-0.5 rounded-full font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-brand-text font-mono tabular-nums">
                            {analysis.overall_score || "—"}
                            <span className="text-xs font-normal text-gray-500">/100</span>
                          </p>
                          <span className="text-xs text-brand-text group-hover:underline font-medium flex items-center justify-end gap-1 mt-1">
                            View <FiEye className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

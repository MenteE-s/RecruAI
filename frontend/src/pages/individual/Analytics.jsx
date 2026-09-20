import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, getBackendUrl, getAuthHeaders, getCurrentUserId } from "../../utils/auth";
import { formatDate } from "../../utils/timezone";
import DualTime from "../../components/ui/DualTime";
import {
  FiBarChart2,
  FiTrendingUp,
  FiAward,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
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
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
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
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-4 mt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-[320px] bg-gray-200 animate-pulse rounded-lg" />
            <div className="h-9 w-24 bg-gray-100 animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-gray-200 h-28 animate-pulse" />
            ))}
          </div>
          <div className="bg-white border border-gray-200 h-48 animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  const hasData = analytics && analytics.total_interviews > 0;

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      {/* Filter */}
      <div className="flex items-center gap-3 mb-4 mt-6">
        <div className="relative flex-1 max-w-xl min-w-[260px]">
          <FiBarChart2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <span className="w-full block pl-10 pr-3 py-2.5 bg-white border border-gray-200 text-sm text-gray-700 font-medium">Interview performance analytics</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
          <FiTrendingUp className="w-3.5 h-3.5" />
          <span>{analytics?.total_interviews || 0} interviews</span>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-4"><FiBarChart2 className="w-7 h-7 text-gray-400" /></div>
          <h3 className="text-lg font-semibold text-gray-900">No interview data yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">Complete some interviews to see your performance analytics and feedback here.</p>
          <button onClick={() => navigate("/interviews/upcoming")} className="mt-6 inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-black transition-colors">View upcoming <FiArrowRight className="w-4 h-4" /></button>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-white border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total interviews</p>
                <FiBriefcase className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{analytics?.total_interviews || 0}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <div className="bg-white border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg overall</p>
                <FiAward className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-2">{analytics?.average_scores?.overall ? `${analytics.average_scores.overall.toFixed(1)}` : "—"}</p>
              <p className="text-xs text-gray-500 mt-1">Out of 100</p>
            </div>
            <div className="bg-white border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Strengths</p>
                <FiCheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600 mt-2">{analytics?.strengths?.length || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Identified</p>
            </div>
            <div className="bg-white border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">To improve</p>
                <FiAlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-2">{analytics?.improvements?.length || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Focus areas</p>
            </div>
          </div>

          {/* Performance Scores */}
          {analytics?.average_scores && (
            <div className="bg-white border border-gray-200 p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiTarget className="w-4 h-4 text-gray-500" /> Performance scores</h3>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Communication", key: "communication", color: "bg-blue-600", icon: FiMessageSquare },
                  { label: "Technical", key: "technical", color: "bg-green-600", icon: FiCpu },
                  { label: "Problem solving", key: "problem_solving", color: "bg-purple-600", icon: FiTarget },
                  { label: "Cultural fit", key: "cultural_fit", color: "bg-orange-600", icon: FiUsers },
                ].map((item) => {
                  const score = analytics.average_scores[item.key];
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="border border-gray-100 p-4 text-center">
                      <div className={`w-10 h-10 ${item.color} flex items-center justify-center mx-auto`}><Icon className="w-5 h-5 text-white" /></div>
                      <p className="text-2xl font-bold text-gray-900 mt-3">{score != null ? `${Number(score).toFixed(1)}` : "—"}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                      {score != null && (
                        <div className="mt-3 h-1.5 bg-gray-100">
                          <div className={`${item.color} h-1.5`} style={{ width: `${Math.min(100, score)}%` }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {analytics.average_scores.overall != null && (
                <div className="mt-6 bg-gray-50 border border-gray-200 p-4 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Overall average</span>
                  <span className="text-lg font-bold text-blue-600">{Number(analytics.average_scores.overall).toFixed(1)}/100</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiCheckCircle className="w-4 h-4 text-green-600" /> Key strengths</h3>
              <div className="mt-4 space-y-2.5">
                {analytics?.strengths && analytics.strengths.length > 0 ? (
                  analytics.strengths.map((s, i) => (
                    <div key={i} className="flex gap-2.5 p-2.5 bg-green-50/50 border border-green-100">
                      <FiCheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{s}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 p-4 text-center">No strength data yet</p>
                )}
              </div>
            </div>
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiTarget className="w-4 h-4 text-amber-600" /> Areas to improve</h3>
              <div className="mt-4 space-y-2.5">
                {analytics?.improvements && analytics.improvements.length > 0 ? (
                  analytics.improvements.map((imp, i) => (
                    <div key={i} className="flex gap-2.5 p-2.5 bg-amber-50/50 border border-amber-100">
                      <FiAlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{imp}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 p-4 text-center">No improvement data yet</p>
                )}
              </div>
            </div>
          </div>

          {analytics?.performance_trend && analytics.performance_trend.length > 0 && (
            <div className="bg-white border border-gray-200 p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiTrendingUp className="w-4 h-4 text-gray-500" /> Performance trend</h3>
              <div className="mt-6 flex items-end gap-2 overflow-x-auto pb-2">
                {analytics.performance_trend.map((pt, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5 min-w-[64px] flex-1">
                    <span className="text-xs font-semibold text-gray-900">{pt.score}</span>
                    <div className="w-full max-w-[48px] bg-blue-600" style={{ height: `${Math.max(12, (pt.score / 100) * 140)}px` }} />
                    <span className="text-[11px] text-gray-500 text-center leading-tight">{pt.date}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">Latest: {analytics.performance_trend[analytics.performance_trend.length - 1]?.score || "—"} • {analytics.performance_trend.length} points</p>
            </div>
          )}

          {analytics?.analytics && analytics.analytics.length > 0 && (
            <div className="bg-white border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Recent feedback</h3>
                <span className="text-xs text-gray-500">{analytics.analytics.length} analyses</span>
              </div>
              <div className="mt-4 space-y-3">
                {analytics.analytics.slice(0, 3).map((analysis) => (
                  <div key={analysis.id} onClick={() => navigate(`/interviews/${analysis.interview_id}/analysis`)} className="border border-gray-200 p-4 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer group transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">Interview #{analysis.interview_id}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(analysis.created_at)}</p>
                        {analysis.ai_analysis_summary && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{analysis.ai_analysis_summary}</p>}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {analysis.strengths?.slice(0, 2).map((s, idx) => (
                            <span key={idx} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-blue-600">{analysis.overall_score || "—"}<span className="text-xs font-normal text-gray-500">/100</span></p>
                        <span className="text-xs text-blue-600 group-hover:text-blue-700 font-medium flex items-center gap-1 mt-1">View <FiEye className="w-3 h-3" /></span>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <span className="bg-gray-50 border border-gray-200 px-2 py-1 text-gray-600">Comm: <b className="text-gray-900">{analysis.communication_score ?? "—"}</b></span>
                      <span className="bg-gray-50 border border-gray-200 px-2 py-1 text-gray-600">Tech: <b className="text-gray-900">{analysis.technical_score ?? "—"}</b></span>
                      <span className="bg-gray-50 border border-gray-200 px-2 py-1 text-gray-600">Problem: <b className="text-gray-900">{analysis.problem_solving_score ?? "—"}</b></span>
                      <span className="bg-gray-50 border border-gray-200 px-2 py-1 text-gray-600">Fit: <b className="text-gray-900">{analysis.cultural_fit_score ?? "—"}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analytics?.recent_interviews && analytics.recent_interviews.length > 0 && (
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiClock className="w-4 h-4 text-gray-500" /> Recent interviews</h3>
              <div className="mt-4 space-y-3">
                {analytics.recent_interviews.slice(0, 5).map((interview) => (
                  <div key={interview.id} onClick={() => navigate(`/interviews/${interview.id}/analysis`)} className="border border-gray-200 p-4 hover:border-gray-300 hover:bg-gray-50 cursor-pointer flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{interview.title || `Interview #${interview.id}`}</p>
                      <p className="text-xs text-gray-500 mt-0.5"><DualTime value={interview.scheduled_at_iso || interview.scheduled_at} otherTimezone={interview.organization_timezone} otherLabel={interview.organization} variant="compact" showRelative={false} /> • {interview.duration_minutes} min • <span className="capitalize">{interview.interview_type}</span></p>
                      {interview.post_title && <p className="text-xs text-blue-600 mt-1">Position: {interview.post_title}</p>}
                    </div>
                    <span className={`shrink-0 text-xs font-medium border px-2.5 py-1 ${interview.status === "completed" ? "bg-green-50 text-green-700 border-green-200" : interview.status === "cancelled" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{interview.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

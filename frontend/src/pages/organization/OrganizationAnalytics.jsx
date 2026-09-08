import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { formatDate } from "../../utils/timezone";
import { FiBarChart2, FiTrendingUp, FiAward, FiUsers, FiTarget, FiFileText, FiCheckCircle, FiAlertTriangle, FiClock, FiArrowRight } from "react-icons/fi";

export default function OrganizationAnalytics() {
  const navigate = useNavigate();
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orgId] = useState(1);

  useEffect(() => { fetchInterviewAnalytics(); }, []);

  const fetchInterviewAnalytics = async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/organizations/${orgId}/analytics`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) setAnalytics(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-gray-900 h-48 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="bg-white border border-gray-200 h-28 animate-pulse" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const hasData = analytics && analytics.total_interviews_analyzed > 0;

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-xs font-medium tracking-wide mb-3">
                <FiBarChart2 className="w-3.5 h-3.5" />
                ANALYTICS
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">Interview analytics</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Insights into performance, candidate evaluations, and hiring trends.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[380px]">
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{analytics?.total_interviews_analyzed || 0}</p>
                <p className="text-xs text-gray-300 mt-1">Analyzed</p>
              </div>
              <div className="bg-blue-500/20 backdrop-blur border border-blue-400/20 p-4 text-center">
                <p className="text-2xl font-bold text-blue-200">{analytics?.average_scores?.overall ? `${analytics.average_scores.overall}%` : "—"}</p>
                <p className="text-xs text-blue-200 mt-1">Avg score</p>
              </div>
              <div className="bg-green-500/20 backdrop-blur border border-green-400/20 p-4 text-center">
                <p className="text-2xl font-bold text-green-200">{analytics?.pass_rate ? `${analytics.pass_rate}%` : "—"}</p>
                <p className="text-xs text-green-200 mt-1">Pass rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-4"><FiBarChart2 className="w-7 h-7 text-gray-400" /></div>
          <h3 className="text-lg font-semibold text-gray-900">No analytics yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">Complete interviews and generate analyses to see insights here.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-white border border-gray-200 p-5 text-center">
              <p className="text-2xl font-bold text-blue-600">{analytics?.total_interviews_analyzed || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Interviews analyzed</p>
            </div>
            <div className="bg-white border border-gray-200 p-5 text-center">
              <p className="text-2xl font-bold text-green-600">{analytics?.average_scores?.overall ? `${analytics.average_scores.overall}%` : "--"}</p>
              <p className="text-xs text-gray-500 mt-1">Avg overall</p>
            </div>
            <div className="bg-white border border-gray-200 p-5 text-center">
              <p className="text-2xl font-bold text-purple-600">{analytics?.pass_rate ? `${analytics.pass_rate}%` : "--"}</p>
              <p className="text-xs text-gray-500 mt-1">Pass rate</p>
            </div>
            <div className="bg-white border border-gray-200 p-5 text-center">
              <p className="text-2xl font-bold text-orange-600">{analytics?.top_strengths?.length || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Top skills</p>
            </div>
          </div>

          {analytics?.average_scores && (
            <div className="bg-white border border-gray-200 p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiTarget className="w-4 h-4 text-gray-500" /> Average scores</h3>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Communication", score: analytics.average_scores.communication, color: "bg-blue-600", icon: FiUsers },
                  { label: "Technical", score: analytics.average_scores.technical, color: "bg-green-600", icon: FiAward },
                  { label: "Problem solving", score: analytics.average_scores.problem_solving, color: "bg-purple-600", icon: FiTarget },
                  { label: "Cultural fit", score: analytics.average_scores.cultural_fit, color: "bg-orange-600", icon: FiUsers },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="border border-gray-100 p-4 text-center">
                      <div className={`w-10 h-10 ${item.color} flex items-center justify-center mx-auto`}><Icon className="w-5 h-5 text-white" /></div>
                      <p className="text-2xl font-bold text-gray-900 mt-3">{item.score ? `${item.score}%` : "--"}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                      {item.score && <div className="mt-3 h-1.5 bg-gray-100"><div className={`${item.color} h-1.5`} style={{ width: `${item.score}%` }} /></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiCheckCircle className="w-4 h-4 text-green-600" /> Most common strengths</h3>
              <div className="mt-4 space-y-3">
                {analytics?.top_strengths?.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{s.skill}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100"><div className="bg-green-600 h-1.5" style={{ width: `${(s.count / analytics.total_interviews_analyzed) * 100}%` }} /></div>
                      <span className="text-xs font-medium text-gray-600 w-6 text-right">{s.count}</span>
                    </div>
                  </div>
                )) || <p className="text-sm text-gray-500">No data</p>}
              </div>
            </div>
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiAlertTriangle className="w-4 h-4 text-amber-600" /> Common improvements</h3>
              <div className="mt-4 space-y-3">
                {analytics?.common_improvements?.slice(0, 5).map((imp, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{imp.area}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100"><div className="bg-amber-500 h-1.5" style={{ width: `${(imp.count / analytics.total_interviews_analyzed) * 100}%` }} /></div>
                      <span className="text-xs font-medium text-gray-600 w-6 text-right">{imp.count}</span>
                    </div>
                  </div>
                )) || <p className="text-sm text-gray-500">No data</p>}
              </div>
            </div>
          </div>

          {analytics?.analytics?.length > 0 && (
            <div className="bg-white border border-gray-200 p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-900">Recent analyses</h3>
              <div className="mt-4 space-y-3">
                {analytics.analytics.slice(0, 5).map((analysis) => (
                  <div key={analysis.id} onClick={() => navigate(`/interviews/${analysis.interview_id}/analysis`)} className="border border-gray-200 p-4 hover:border-gray-300 hover:bg-gray-50 cursor-pointer flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Interview #{analysis.interview_id}</p>
                      <p className="text-xs text-gray-500">{formatDate(analysis.created_at)}</p>
                      <div className="mt-1 flex gap-1">
                        <span className="text-xs bg-gray-50 border border-gray-200 px-2 py-1">Comm {analysis.communication_score || "--"}</span>
                        <span className="text-xs bg-gray-50 border border-gray-200 px-2 py-1">Tech {analysis.technical_score || "--"}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{analysis.overall_score}/100</p>
                      <span className="text-xs text-blue-600 flex items-center gap-1 justify-end">View <FiArrowRight className="w-3 h-3" /></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analytics?.recent_interviews?.length > 0 && (
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900">Recent interviews</h3>
              <div className="mt-4 space-y-3">
                {analytics.recent_interviews.slice(0, 5).map((interview) => (
                  <div key={interview.id} onClick={() => navigate(`/interviews/${interview.id}/analysis`)} className="border border-gray-200 p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{interview.title || `Interview #${interview.id}`}</p>
                      <p className="text-xs text-gray-500">{new Date(interview.scheduled_at).toLocaleDateString()} at {new Date(interview.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {interview.duration_minutes} min • {interview.interview_type}</p>
                      {interview.post_title && <p className="text-xs text-blue-600 mt-1">{interview.post_title}</p>}
                    </div>
                    <span className={`text-xs font-medium border px-2 py-1 ${interview.status === "completed" ? "bg-green-50 text-green-700 border-green-200" : interview.status === "cancelled" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{interview.status}</span>
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

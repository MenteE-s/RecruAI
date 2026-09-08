import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { getSidebarItems, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { formatDateTime as formatDateTimeTz } from "../../utils/timezone";
import {
  FiCalendar,
  FiClock,
  FiBriefcase,
  FiAward,
  FiTrendingUp,
  FiBarChart2,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiStar,
  FiMessageSquare,
  FiCpu,
  FiUsers,
  FiVideo,
  FiPhone,
  FiArrowRight,
  FiEye,
  FiX,
} from "react-icons/fi";

export default function InterviewHistory() {
  const navigate = useNavigate();
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [interviews, setInterviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("history");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const meResponse = await fetch(`${getBackendUrl()}/api/auth/me`, {
          headers: getAuthHeaders(),
          credentials: "include",
        });
        if (!meResponse.ok) {
          setError("Please log in to view your interview history.");
          setInterviews([]);
          setAnalytics(null);
          return;
        }
        const meData = await meResponse.json();
        const userId = meData?.user?.id;
        if (!userId) {
          setError("Failed to determine current user.");
          return;
        }
        const historyResponse = await fetch(`${getBackendUrl()}/api/interviews/history`, {
          headers: getAuthHeaders(),
          credentials: "include",
        });
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setInterviews(historyData?.interviews || []);
        } else setError("Failed to load interview history");

        const analyticsResponse = await fetch(`${getBackendUrl()}/api/users/${userId}/analytics`, {
          headers: getAuthHeaders(),
          credentials: "include",
        });
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          setAnalytics(analyticsData);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDateTime = (dateString) =>
    formatDateTimeTz(dateString, { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: undefined });

  const getStatusBadge = (status, finalDecision, rating) => {
    if (finalDecision) {
      switch (finalDecision) {
        case "passed":
          return <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2.5 py-1"><FiCheckCircle className="w-3.5 h-3.5" /> Passed</span>;
        case "failed":
          return <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 px-2.5 py-1"><FiXCircle className="w-3.5 h-3.5" /> Not selected</span>;
        case "second_round":
          return <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1"><FiArrowRight className="w-3.5 h-3.5" /> Round 2</span>;
        case "third_round":
          return <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1"><FiArrowRight className="w-3.5 h-3.5" /> Round 3</span>;
        default:
          return <span className="inline-flex items-center text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1">{finalDecision}</span>;
      }
    }
    switch (status) {
      case "completed":
        if (rating >= 4) return <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2.5 py-1"><FiCheckCircle className="w-3.5 h-3.5" /> Passed</span>;
        if (rating >= 2) return <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1"><FiAlertTriangle className="w-3.5 h-3.5" /> Conditional</span>;
        return <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 px-2.5 py-1"><FiXCircle className="w-3.5 h-3.5" /> Not selected</span>;
      case "cancelled":
        return <span className="inline-flex items-center text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1">Cancelled</span>;
      case "no_show":
        return <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 px-2.5 py-1"><FiXCircle className="w-3.5 h-3.5" /> No show</span>;
      default:
        return <span className="inline-flex items-center text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1">{status}</span>;
    }
  };

  const getDecisionBadge = (decision) => {
    switch (decision) {
      case "passed":
        return <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-1"><FiCheckCircle className="w-3 h-3" /> Passed</span>;
      case "failed":
        return <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200 px-2 py-1"><FiXCircle className="w-3 h-3" /> Failed</span>;
      case "second_round":
        return <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1">Round 2</span>;
      case "third_round":
        return <span className="inline-flex items-center gap-1 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 px-2 py-1">Round 3</span>;
      default:
        return <span className="inline-flex items-center text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 px-2 py-1">{decision}</span>;
    }
  };

  const getTypeMeta = (type) => {
    switch (type) {
      case "text": return { icon: FiMessageSquare, label: "Text", color: "bg-gray-900 text-white" };
      case "ai_video": return { icon: FiCpu, label: "AI Video", color: "bg-purple-600 text-white" };
      case "human_video": return { icon: FiUsers, label: "Human Video", color: "bg-blue-600 text-white" };
      case "video": return { icon: FiVideo, label: "Video", color: "bg-indigo-600 text-white" };
      case "phone": return { icon: FiPhone, label: "Phone", color: "bg-emerald-600 text-white" };
      case "in-person": return { icon: FiBriefcase, label: "On-site", color: "bg-amber-600 text-white" };
      default: return { icon: FiCalendar, label: type || "Interview", color: "bg-gray-700 text-white" };
    }
  };

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-gray-900 h-48 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-9 w-32 bg-gray-200 animate-pulse" />
            <div className="h-9 w-32 bg-gray-100 animate-pulse" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-100 w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 w-1/2" />
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  const passedCount = interviews.filter((i) => i.final_decision === "passed" || (i.status === "completed" && i.rating >= 4)).length;
  const avgScore = analytics?.average_scores?.overall?.toFixed(1) || (interviews.length ? (interviews.reduce((a, b) => a + (b.rating || 0), 0) / interviews.length).toFixed(1) : "—");

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 px-4 py-3 flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <FiAlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900 p-1"><FiX className="w-4 h-4" /></button>
        </div>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-xs font-medium tracking-wide mb-3"><FiAward className="w-3.5 h-3.5" /> PERFORMANCE</div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">Interview history</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Review past interviews, decisions, and analytics to improve your next performance.</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setActiveTab("history")} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "history" ? "bg-white text-gray-900" : "bg-white/10 text-white border border-white/20 hover:bg-white/15"}`}>History</button>
                <button onClick={() => setActiveTab("analytics")} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "analytics" ? "bg-white text-gray-900" : "bg-white/10 text-white border border-white/20 hover:bg-white/15"}`}>Analytics</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[380px]">
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center"><p className="text-2xl font-bold">{interviews.length}</p><p className="text-xs text-gray-300 mt-1">Interviews</p></div>
              <div className="bg-green-500/20 backdrop-blur border border-green-400/20 p-4 text-center"><p className="text-2xl font-bold text-green-300">{passedCount}</p><p className="text-xs text-green-200 mt-1">Passed</p></div>
              <div className="bg-blue-500/20 backdrop-blur border border-blue-400/20 p-4 text-center"><p className="text-2xl font-bold text-blue-200">{avgScore}</p><p className="text-xs text-blue-200 mt-1">Avg score</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - secondary for mobile */}
      <div className="mb-6 flex gap-2 lg:hidden">
        <button onClick={() => setActiveTab("history")} className={`flex-1 py-2.5 text-sm font-medium border ${activeTab === "history" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"}`}>History</button>
        <button onClick={() => setActiveTab("analytics")} className={`flex-1 py-2.5 text-sm font-medium border ${activeTab === "analytics" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"}`}>Analytics</button>
      </div>

      {activeTab === "history" ? (
        interviews.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 text-center">
            <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-4"><FiCalendar className="w-7 h-7 text-gray-400" /></div>
            <h3 className="text-lg font-semibold text-gray-900">No interview history</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">You haven’t completed any interviews yet. Your history will appear here after you finish a session.</p>
            <button onClick={() => navigate("/interviews/upcoming")} className="mt-6 inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-black transition-colors">View upcoming <FiArrowRight className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="space-y-3">
            {interviews.map((interview) => {
              const typeMeta = getTypeMeta(interview.interview_type);
              const TypeIcon = typeMeta.icon;
              return (
                <div key={interview.id} className="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
                  <div className="p-5">
                    <div className="flex gap-4">
                      <div className={`hidden sm:flex w-11 h-11 items-center justify-center shrink-0 ${typeMeta.color}`}><TypeIcon className="w-5 h-5" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-[15px] font-semibold text-gray-900">{interview.title}</h3>
                              {interview.current_round && <span className="text-xs bg-blue-600 text-white px-2 py-0.5">Round {interview.current_round}</span>}
                              {getStatusBadge(interview.status, interview.final_decision, interview.rating)}
                            </div>
                            <p className="text-sm text-gray-600 mt-1 flex flex-wrap items-center gap-1.5">
                              <span>{interview.organization}</span>
                              <span className="text-gray-300">•</span>
                              <span className="flex items-center gap-1"><FiClock className="w-3.5 h-3.5 text-gray-400" />{formatDateTime(interview.scheduled_at_iso || interview.scheduled_at)}</span>
                            </p>
                            {interview.post_title && <p className="text-xs text-blue-600 mt-1 flex items-center gap-1"><FiBriefcase className="w-3 h-3" /> Position: {interview.post_title}</p>}
                          </div>
                          <button onClick={() => navigate(`/interviews/${interview.id}`)} className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-1.5 hover:bg-gray-50"><FiEye className="w-3.5 h-3.5" /> View details</button>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          {interview.rating ? (
                            <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1">
                              <span className="flex">{[1, 2, 3, 4, 5].map((s) => <FiStar key={s} className={`w-3 h-3 ${s <= interview.rating ? "fill-amber-500 text-amber-500" : "text-gray-300"}`} />)}</span>
                              {interview.rating}/5
                            </span>
                          ) : null}
                          <span className={`inline-flex items-center gap-1.5 text-xs border px-2.5 py-1 ${typeMeta.color} border-transparent bg-opacity-10`}><TypeIcon className="w-3 h-3" />{typeMeta.label}</span>
                        </div>

                        {interview.feedback && (
                          <div className="mt-3 bg-gray-50 border border-gray-200 p-3">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Feedback</p>
                            <p className="text-sm text-gray-600">{interview.feedback}</p>
                          </div>
                        )}

                        {interview.decision_history && interview.decision_history.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Progress</p>
                            <div className="space-y-2">
                              {interview.decision_history
                                .slice()
                                .sort((a, b) => new Date(a.decided_at) - new Date(b.decided_at))
                                .map((decision) => (
                                  <div key={decision.id} className="flex gap-3 p-3 bg-blue-50/50 border border-blue-100">
                                    <div className="w-7 h-7 bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">{decision.round_number}</div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-medium text-gray-900">Round {decision.round_number}</p>
                                        <span className="text-xs text-gray-500">{formatDateTimeTz(decision.decided_at)}</span>
                                      </div>
                                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                        {getDecisionBadge(decision.decision)}
                                        {decision.rating && <span className="flex items-center gap-1 text-xs text-gray-600"><FiStar className="w-3 h-3 text-amber-500" />{decision.rating}/5</span>}
                                      </div>
                                      {decision.feedback && <p className="text-xs text-gray-600 mt-1.5">{decision.feedback}</p>}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex md:hidden">
                      <button onClick={() => navigate(`/interviews/${interview.id}`)} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 py-2.5 text-sm font-medium hover:bg-gray-50"><FiEye className="w-4 h-4" /> View details</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : !analytics || analytics.total_interviews === 0 ? (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-4"><FiBarChart2 className="w-7 h-7 text-gray-400" /></div>
          <h3 className="text-lg font-semibold text-gray-900">No performance data</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">Complete some interviews to see your analytics here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200 p-5 text-center">
              <p className="text-2xl font-bold text-blue-600">{analytics.total_interviews}</p>
              <p className="text-xs text-gray-500 mt-1">Total interviews</p>
            </div>
            <div className="bg-white border border-gray-200 p-5 text-center">
              <p className="text-2xl font-bold text-green-600">{analytics.average_scores?.overall?.toFixed(1) || "0.0"}</p>
              <p className="text-xs text-gray-500 mt-1">Avg overall</p>
            </div>
            <div className="bg-white border border-gray-200 p-5 text-center">
              <p className="text-2xl font-bold text-purple-600">{analytics.average_scores?.communication?.toFixed(1) || "0.0"}</p>
              <p className="text-xs text-gray-500 mt-1">Communication</p>
            </div>
            <div className="bg-white border border-gray-200 p-5 text-center">
              <p className="text-2xl font-bold text-orange-600">{analytics.average_scores?.technical?.toFixed(1) || "0.0"}</p>
              <p className="text-xs text-gray-500 mt-1">Technical</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><FiTrendingUp className="w-4 h-4 text-gray-500" /> Average scores by category</h3>
            <div className="space-y-3">
              {analytics.average_scores &&
                Object.entries(analytics.average_scores).map(([cat, score]) => (
                  <div key={cat} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-700 capitalize min-w-[120px]">{cat.replace("_", " ")}</span>
                    <div className="flex-1 flex items-center gap-3 max-w-sm ml-auto">
                      <div className="flex-1 h-2 bg-gray-100">
                        <div className="h-2 bg-blue-600" style={{ width: `${Math.min(100, (score / 100) * 100)}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-10 text-right">{score.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><FiCheckCircle className="w-4 h-4 text-green-600" /> Strengths</h3>
              <div className="space-y-2.5">
                {analytics.strengths?.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex gap-2 text-sm text-gray-700"><span className="text-green-600 mt-0.5"><FiCheckCircle className="w-3.5 h-3.5" /></span><span>{s}</span></div>
                )) || <p className="text-sm text-gray-500">No strength data</p>}
              </div>
            </div>
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><FiAlertTriangle className="w-4 h-4 text-amber-600" /> Areas to improve</h3>
              <div className="space-y-2.5">
                {analytics.improvements?.slice(0, 5).map((imp, i) => (
                  <div key={i} className="flex gap-2 text-sm text-gray-700"><span className="text-amber-600 mt-0.5"><FiAlertTriangle className="w-3.5 h-3.5" /></span><span>{imp}</span></div>
                )) || <p className="text-sm text-gray-500">No improvement data</p>}
              </div>
            </div>
          </div>

          {analytics.performance_trend && analytics.performance_trend.length > 0 && (
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Performance trend</h3>
              <div className="flex items-end gap-2 overflow-x-auto pb-2">
                {analytics.performance_trend.map((pt, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5 min-w-[56px]">
                    <div className="w-10 bg-blue-600" style={{ height: `${Math.max(8, (pt.score / 100) * 120)}px` }} />
                    <span className="text-xs font-semibold text-gray-900">{pt.score}</span>
                    <span className="text-[11px] text-gray-500">{pt.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Detailed analyses</h3>
            <div className="space-y-3">
              {analytics.analytics?.slice(0, 3).map((a) => (
                <div key={a.id} className="border border-gray-200 p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900">Interview #{a.interview_id}</span>
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1">Score {a.overall_score?.toFixed(1) || "N/A"}</span>
                  </div>
                  {a.ai_analysis_summary && <p className="text-sm text-gray-600 mt-2">{a.ai_analysis_summary}</p>}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {a.strengths?.slice(0, 3).map((s, idx) => (
                      <span key={idx} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1">{s}</span>
                    ))}
                  </div>
                </div>
              )) || <p className="text-sm text-gray-500 text-center py-6">No detailed analyses</p>}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

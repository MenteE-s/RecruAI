import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";
import { formatDate } from "../../utils/timezone";

export default function Analytics() {
  const navigate = useNavigate();
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(1); // TODO: Get from auth context

  useEffect(() => {
    fetchInterviewAnalytics();
  }, []);

  const fetchInterviewAnalytics = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/analytics`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching interview analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={IndividualNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      NavbarComponent={IndividualNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="mb-6">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-green-600/80 via-blue-600/60 to-purple-500/60 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">
                Interview Performance
              </h1>
              <p className="mt-1 text-white/90">
                Track your interview performance and identify areas for growth
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {analytics?.total_interviews || 0}
            </div>
            <div className="text-sm text-gray-600">Total Interviews</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {analytics?.average_scores?.overall
                ? `${analytics.average_scores.overall}%`
                : "--"}
            </div>
            <div className="text-sm text-gray-600">Avg Overall Score</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {analytics?.strengths?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Key Strengths</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {analytics?.improvements?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Areas to Improve</div>
          </div>
        </Card>
      </div>

      {/* Performance Scores */}
      {analytics?.average_scores && (
        <Card className="mb-8">
          <h3 className="text-xl font-semibold mb-6">
            Your Performance Scores
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Communication",
                score: analytics.average_scores.communication,
                color: "blue",
              },
              {
                label: "Technical Skills",
                score: analytics.average_scores.technical,
                color: "green",
              },
              {
                label: "Problem Solving",
                score: analytics.average_scores.problem_solving,
                color: "purple",
              },
              {
                label: "Cultural Fit",
                score: analytics.average_scores.cultural_fit,
                color: "orange",
              },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div
                  className={`text-3xl font-bold text-${item.color}-600 mb-2`}
                >
                  {item.score ? `${item.score}%` : "--"}
                </div>
                <div className="text-sm text-gray-600 mb-3">{item.label}</div>
                {item.score && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`bg-${item.color}-500 h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${item.score}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Strengths */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-green-600">
            💪 Your Key Strengths
          </h3>
          <div className="space-y-3">
            {analytics?.strengths && analytics.strengths.length > 0 ? (
              analytics.strengths.map((strength, index) => (
                <div key={index} className="flex items-start">
                  <div className="text-green-500 mr-2 mt-1">✓</div>
                  <span className="text-gray-700">{strength}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">
                No strength data available yet
              </p>
            )}
          </div>
        </Card>

        {/* Areas for Improvement */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-orange-600">
            🎯 Areas for Improvement
          </h3>
          <div className="space-y-3">
            {analytics?.improvements && analytics.improvements.length > 0 ? (
              analytics.improvements.map((improvement, index) => (
                <div key={index} className="flex items-start">
                  <div className="text-orange-500 mr-2 mt-1">→</div>
                  <span className="text-gray-700">{improvement}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">
                No improvement suggestions available yet
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Performance Trend */}
      {analytics?.performance_trend &&
        analytics.performance_trend.length > 0 && (
          <Card className="mt-8">
            <h3 className="text-xl font-semibold mb-6">Performance Trend</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">📈</div>
                <p>Performance trend visualization</p>
                <p className="text-sm mt-2">
                  Latest:{" "}
                  {analytics.performance_trend[
                    analytics.performance_trend.length - 1
                  ]?.score || "--"}
                  %
                </p>
              </div>
            </div>
          </Card>
        )}

      {/* Recent Interview Analyses */}
      {analytics?.analytics && analytics.analytics.length > 0 && (
        <Card className="mt-8">
          <h3 className="text-xl font-semibold mb-6">
            Recent Interview Feedback
          </h3>
          <div className="space-y-4">
            {analytics.analytics.slice(0, 3).map((analysis, index) => (
              <div
                key={analysis.id || index}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() =>
                  navigate(`/interviews/${analysis.interview_id}/analysis`)
                }
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Interview Analysis
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formatDate(analysis.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {analysis.overall_score}/100
                    </div>
                    <div className="text-xs text-gray-500">Overall Score</div>
                  </div>
                </div>
                {analysis.ai_analysis_summary && (
                  <p className="text-sm text-gray-700 mb-3">
                    {analysis.ai_analysis_summary}
                  </p>
                )}
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Communication:</span>
                    <span className="font-medium ml-1">
                      {analysis.communication_score || "--"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Technical:</span>
                    <span className="font-medium ml-1">
                      {analysis.technical_score || "--"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Problem Solving:</span>
                    <span className="font-medium ml-1">
                      {analysis.problem_solving_score || "--"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cultural Fit:</span>
                    <span className="font-medium ml-1">
                      {analysis.cultural_fit_score || "--"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Interviews */}
      {analytics?.recent_interviews &&
        analytics.recent_interviews.length > 0 && (
          <Card className="mt-8">
            <h3 className="text-xl font-semibold mb-6">Recent Interviews</h3>
            <div className="space-y-4">
              {analytics.recent_interviews
                .slice(0, 5)
                .map((interview, index) => (
                  <div
                    key={interview.id || index}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      navigate(`/interviews/${interview.id}/analysis`)
                    }
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {interview.title || `Interview #${interview.id}`}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {new Date(
                            interview.scheduled_at
                          ).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(
                            interview.scheduled_at
                          ).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            interview.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : interview.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {interview.status}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium ml-1">
                          {interview.duration_minutes} minutes
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium ml-1 capitalize">
                          {interview.interview_type}
                        </span>
                      </div>
                    </div>
                    {interview.post_title && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-600">Position:</span>
                        <span className="font-medium ml-1">
                          {interview.post_title}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </Card>
        )}

      {/* Empty State */}
      {(!analytics || analytics.total_interviews === 0) && (
        <Card className="mt-8">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">
              No Interview Data Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Complete some interviews to see your performance analytics and
              feedback here.
            </p>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}

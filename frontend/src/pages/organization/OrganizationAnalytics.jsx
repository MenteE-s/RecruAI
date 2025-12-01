import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";
import { formatDate } from "../../utils/timezone";

export default function OrganizationAnalytics() {
  const navigate = useNavigate();
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState(1); // TODO: Get from user context

  useEffect(() => {
    fetchInterviewAnalytics();
  }, []);

  const fetchInterviewAnalytics = async () => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/analytics`, {
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
        NavbarComponent={OrganizationNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      NavbarComponent={OrganizationNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="mb-6">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-yellow-600/90 via-amber-600/80 to-purple-700/70 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">
                Interview Analytics
              </h1>
              <p className="mt-1 text-white/90">
                Comprehensive insights into your interview performance and
                candidate evaluations
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
              {analytics?.total_interviews_analyzed || 0}
            </div>
            <div className="text-sm text-gray-600">Interviews Analyzed</div>
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
              {analytics?.pass_rate ? `${analytics.pass_rate}%` : "--"}
            </div>
            <div className="text-sm text-gray-600">Pass Rate</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {analytics?.top_strengths?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Top Skills Identified</div>
          </div>
        </Card>
      </div>

      {/* Performance Scores Overview */}
      {analytics?.average_scores && (
        <Card className="mb-8">
          <h3 className="text-xl font-semibold mb-6">
            Average Performance Scores
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
        {/* Top Strengths */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-green-600">
            💪 Most Common Strengths
          </h3>
          <div className="space-y-3">
            {analytics?.top_strengths && analytics.top_strengths.length > 0 ? (
              analytics.top_strengths.slice(0, 5).map((strength, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-700">{strength.skill}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${
                            analytics.total_interviews_analyzed > 0
                              ? (strength.count /
                                  analytics.total_interviews_analyzed) *
                                100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-6 text-right">
                      {strength.count}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No strength data available</p>
            )}
          </div>
        </Card>

        {/* Common Improvements */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-orange-600">
            🎯 Common Areas for Improvement
          </h3>
          <div className="space-y-3">
            {analytics?.common_improvements &&
            analytics.common_improvements.length > 0 ? (
              analytics.common_improvements
                .slice(0, 5)
                .map((improvement, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span className="text-gray-700">{improvement.area}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{
                            width: `${
                              analytics.total_interviews_analyzed > 0
                                ? (improvement.count /
                                    analytics.total_interviews_analyzed) *
                                  100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 w-6 text-right">
                        {improvement.count}
                      </span>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-gray-500 italic">
                No improvement data available
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Interview Analyses */}
      {analytics?.analytics && analytics.analytics.length > 0 && (
        <Card className="mt-8">
          <h3 className="text-xl font-semibold mb-6">
            Recent Interview Analyses
          </h3>
          <div className="space-y-4">
            {analytics.analytics.slice(0, 5).map((analysis, index) => (
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
                      Interview #{analysis.interview_id}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Analyzed: {formatDate(analysis.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {analysis.overall_score}/100
                    </div>
                    <div className="text-xs text-gray-500">Overall Score</div>
                  </div>
                </div>
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
      {(!analytics || analytics.total_interviews_analyzed === 0) && (
        <Card className="mt-8">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">
              No Interview Analytics Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Complete some interviews and generate analyses to see performance
              insights here.
            </p>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}

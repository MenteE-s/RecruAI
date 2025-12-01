import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";
import { formatDateTime as formatDateTimeTz } from "../../utils/timezone";

export default function InterviewHistory() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [interviews, setInterviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("history");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch interview history
        const historyResponse = await fetch("/api/interviews/history", {
          credentials: "include",
        });

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setInterviews(historyData.interviews);
        } else {
          setError("Failed to load interview history");
        }

        // Fetch user analytics
        const userId = 1; // TODO: Get from user context
        const analyticsResponse = await fetch(
          `/api/users/${userId}/analytics`,
          {
            credentials: "include",
          }
        );

        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          setAnalytics(analyticsData);
        }
        // Don't set error for analytics if it fails, as history might still work
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDateTime = (dateString) => {
    return formatDateTimeTz(dateString, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: undefined,
    });
  };

  const getStatusBadge = (status, finalDecision, rating) => {
    // First check final_decision if available
    if (finalDecision) {
      switch (finalDecision) {
        case "passed":
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Passed
            </span>
          );
        case "failed":
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Not Selected
            </span>
          );
        case "second_round":
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Second Round
            </span>
          );
        case "third_round":
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Third Round
            </span>
          );
        default:
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {finalDecision}
            </span>
          );
      }
    }

    // Fallback to old logic based on status and rating
    switch (status) {
      case "completed":
        if (rating >= 4) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Passed
            </span>
          );
        } else if (rating >= 2) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Conditional
            </span>
          );
        } else {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Not Selected
            </span>
          );
        }
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Cancelled
          </span>
        );
      case "no_show":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            No Show
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {status}
          </span>
        );
    }
  };

  const getInterviewTypeIcon = (type) => {
    switch (type) {
      case "text":
        return "💬";
      case "ai_video":
        return "🤖";
      case "human_video":
        return "👥";
      case "video":
        return "";
      case "phone":
        return "📞";
      case "in-person":
        return "🏢";
      default:
        return "📅";
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={IndividualNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Loading interview history...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      NavbarComponent={IndividualNavbar}
      sidebarItems={sidebarItems}
    >
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Interview Performance
        </h1>
        <p className="text-gray-600 mt-1">
          Review your interview history and performance analytics.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("history")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "history"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Interview History
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "analytics"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Performance Analytics
            </button>
          </nav>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === "history" ? (
          // Interview History Tab
          interviews.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No interview history
                </h3>
                <p className="text-gray-600">
                  You haven't completed any interviews yet.
                </p>
              </div>
            </Card>
          ) : (
            interviews.map((interview) => (
              <Card key={interview.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-3">
                        {getInterviewTypeIcon(interview.interview_type)}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-800">
                            {interview.title}
                          </h3>
                          {interview.current_round && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Round {interview.current_round}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {interview.organization} •{" "}
                          {formatDateTime(
                            interview.scheduled_at_iso || interview.scheduled_at
                          )}
                        </p>
                        {interview.post_title && (
                          <p className="text-xs text-blue-600 mt-1">
                            Position: {interview.post_title}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mb-3">
                      {getStatusBadge(
                        interview.status,
                        interview.final_decision,
                        interview.rating
                      )}
                      {interview.rating && (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 mr-1">
                            Rating:
                          </span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-sm ${
                                  star <= interview.rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {interview.feedback && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          Interview Feedback
                        </h4>
                        <p className="text-sm text-gray-700">
                          {interview.feedback}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )
        ) : // Performance Analytics Tab
        !analytics || analytics.total_interviews === 0 ? (
          <Card>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Performance Data Available
              </h3>
              <p className="text-gray-600">
                Complete some interviews to see your performance analytics here.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics.total_interviews}
                  </div>
                  <div className="text-sm text-gray-600">Total Interviews</div>
                </div>
              </Card>

              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analytics.average_scores?.overall?.toFixed(1) || "0.0"}
                  </div>
                  <div className="text-sm text-gray-600">Avg Overall Score</div>
                </div>
              </Card>

              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {analytics.average_scores?.communication?.toFixed(1) ||
                      "0.0"}
                  </div>
                  <div className="text-sm text-gray-600">Avg Communication</div>
                </div>
              </Card>

              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {analytics.average_scores?.technical?.toFixed(1) || "0.0"}
                  </div>
                  <div className="text-sm text-gray-600">Avg Technical</div>
                </div>
              </Card>
            </div>

            {/* Score Breakdown */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Your Average Scores by Category
              </h3>
              <div className="space-y-3">
                {analytics.average_scores &&
                  Object.entries(analytics.average_scores).map(
                    ([category, score]) => (
                      <div
                        key={category}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {category.replace("_", " ")}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(score / 100) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 w-8">
                            {score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )
                  )}
              </div>
            </Card>

            {/* Strengths and Improvements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Key Strengths
                </h3>
                <div className="space-y-2">
                  {analytics.strengths?.slice(0, 5).map((strength, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm text-gray-700">{strength}</span>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500">
                      No strength data available
                    </p>
                  )}
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Areas for Improvement
                </h3>
                <div className="space-y-2">
                  {analytics.improvements
                    ?.slice(0, 5)
                    .map((improvement, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-orange-500">⚠</span>
                        <span className="text-sm text-gray-700">
                          {improvement}
                        </span>
                      </div>
                    )) || (
                    <p className="text-sm text-gray-500">
                      No improvement data available
                    </p>
                  )}
                </div>
              </Card>
            </div>

            {/* Performance Trend */}
            {analytics.performance_trend &&
              analytics.performance_trend.length > 0 && (
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Performance Trend
                  </h3>
                  <div className="flex items-end space-x-4">
                    {analytics.performance_trend.map((point, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div
                          className="bg-blue-500 rounded-t w-8"
                          style={{ height: `${(point.score / 100) * 120}px` }}
                        ></div>
                        <span className="text-xs text-gray-600 mt-2">
                          {point.date}
                        </span>
                        <span className="text-xs font-semibold text-gray-900">
                          {point.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

            {/* Recent Analyses */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Detailed Interview Analyses
              </h3>
              <div className="space-y-4">
                {analytics.analytics?.slice(0, 3).map((analysis) => (
                  <div key={analysis.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        Interview #{analysis.interview_id}
                      </span>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Score: {analysis.overall_score?.toFixed(1) || "N/A"}
                      </span>
                    </div>
                    {analysis.ai_analysis_summary && (
                      <p className="text-sm text-gray-600 mb-2">
                        {analysis.ai_analysis_summary}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {analysis.strengths?.slice(0, 3).map((strength, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                        >
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No detailed analyses available
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

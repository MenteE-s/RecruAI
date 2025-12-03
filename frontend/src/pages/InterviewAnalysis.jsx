import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import IndividualNavbar from "../components/layout/IndividualNavbar";
import OrganizationNavbar from "../components/layout/OrganizationNavbar";
import Card from "../components/ui/Card";
import { getSidebarItems } from "../utils/auth";
import { formatDateTime } from "../utils/timezone";

const InterviewAnalysis = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);

  // Get user role and determine navbar
  const userRole = localStorage.getItem("authRole");
  const userPlan = localStorage.getItem("authPlan");
  const sidebarItems = getSidebarItems(userRole, userPlan);

  useEffect(() => {
    if (interviewId) {
      fetchInterviewData();
    }
  }, [interviewId]);

  const fetchInterviewData = async () => {
    try {
      setLoading(true);

      // Fetch interview details
      const interviewResponse = await fetch(`/api/interviews/${interviewId}`, {
        credentials: "include",
      });

      if (!interviewResponse.ok) {
        throw new Error("Failed to fetch interview");
      }

      const interviewData = await interviewResponse.json();
      setInterview(interviewData);

      // Fetch analysis if interview is completed
      if (interviewData.status === "completed") {
        try {
          const analysisResponse = await fetch(
            `/api/interviews/${interviewId}/analysis`,
            {
              credentials: "include",
            }
          );

          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            setAnalysis(analysisData);
          }
        } catch (analysisError) {
          console.log("Analysis not available yet");
        }
      }

      // Fetch messages
      const messagesResponse = await fetch(
        `/api/interviews/${interviewId}/messages`,
        {
          credentials: "include",
        }
      );

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setMessages(messagesData);
      }
    } catch (error) {
      console.error("Error fetching interview data:", error);
      setError("Failed to load interview analysis");
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async () => {
    if (!interview || interview.status !== "completed") return;

    setGeneratingAnalysis(true);
    try {
      const response = await fetch(`/api/interviews/${interviewId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysis(result.analysis);
      } else {
        throw new Error("Failed to generate analysis");
      }
    } catch (error) {
      console.error("Error generating analysis:", error);
      setError("Failed to generate analysis");
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return "text-green-600 bg-green-100";
    if (score >= 70) return "text-blue-600 bg-blue-100";
    if (score >= 55) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getScoreWidth = (score) => {
    return `${Math.min(score, 100)}%`;
  };

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={
          userRole === "organization" ? OrganizationNavbar : IndividualNavbar
        }
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading interview analysis...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !interview) {
    return (
      <DashboardLayout
        NavbarComponent={
          userRole === "organization" ? OrganizationNavbar : IndividualNavbar
        }
        sidebarItems={sidebarItems}
      >
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              {error || "Interview not found"}
            </h2>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      NavbarComponent={
        userRole === "organization" ? OrganizationNavbar : IndividualNavbar
      }
      sidebarItems={sidebarItems}
    >
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div
          className={`rounded-xl p-6 text-white ${
            userRole === "organization"
              ? "bg-gradient-to-br from-yellow-600/90 via-amber-600/80 to-purple-700/70"
              : "bg-gradient-to-br from-indigo-600/90 via-purple-600/80 to-cyan-700/70"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Interview Analysis</h1>
              <p className="text-blue-100">{interview.title}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Status</div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  interview.status === "completed"
                    ? "bg-green-500 text-white"
                    : interview.status === "cancelled"
                    ? "bg-red-500 text-white"
                    : "bg-yellow-500 text-white"
                }`}
              >
                {interview.status}
              </span>
            </div>
          </div>
        </div>

        {/* Interview Overview */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Interview Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-600">Date & Time</div>
              <div className="font-medium">
                {formatDateTime(interview.scheduled_at)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Duration</div>
              <div className="font-medium">
                {interview.duration_minutes} minutes
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Type</div>
              <div className="font-medium capitalize">
                {interview.interview_type} Interview
              </div>
            </div>
          </div>
          {interview.post_title && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">Position</div>
              <div className="font-medium">{interview.post_title}</div>
            </div>
          )}
        </Card>

        {/* Analysis Section */}
        {interview.status === "completed" && (
          <>
            {!analysis ? (
              <Card>
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold mb-2">
                    Analysis Not Available
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Generate AI-powered analysis to see detailed performance
                    insights.
                  </p>
                  <button
                    onClick={generateAnalysis}
                    disabled={generatingAnalysis}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingAnalysis
                      ? "Generating Analysis..."
                      : "Generate Analysis"}
                  </button>
                </div>
              </Card>
            ) : (
              <>
                {/* Performance Scores */}
                <Card>
                  <h2 className="text-xl font-semibold mb-6">
                    Performance Scores
                  </h2>
                  <div className="space-y-4">
                    {[
                      {
                        label: "Overall Performance",
                        score: analysis.overall_score,
                        key: "overall",
                      },
                      {
                        label: "Communication",
                        score: analysis.communication_score,
                        key: "communication",
                      },
                      {
                        label: "Technical Skills",
                        score: analysis.technical_score,
                        key: "technical",
                      },
                      {
                        label: "Problem Solving",
                        score: analysis.problem_solving_score,
                        key: "problem_solving",
                      },
                      {
                        label: "Cultural Fit",
                        score: analysis.cultural_fit_score,
                        key: "cultural_fit",
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {item.label}
                            </span>
                            <span
                              className={`text-sm font-bold px-2 py-1 rounded ${getScoreColor(
                                item.score
                              )}`}
                            >
                              {item.score}/100
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                item.score >= 85
                                  ? "bg-green-500"
                                  : item.score >= 70
                                  ? "bg-blue-500"
                                  : item.score >= 55
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: getScoreWidth(item.score) }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* AI Analysis Summary */}
                <Card>
                  <h2 className="text-xl font-semibold mb-4">
                    AI Analysis Summary
                  </h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="text-2xl mr-3">🤖</div>
                      <div>
                        <p className="text-gray-800">
                          {analysis.ai_analysis_summary}
                        </p>
                        <div className="mt-2 text-sm text-gray-600">
                          Analyzed by: {analysis.analyzed_by} • Method:{" "}
                          {analysis.analysis_method}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Strengths and Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <h2 className="text-xl font-semibold mb-4 text-green-600">
                      💪 Key Strengths
                    </h2>
                    <div className="space-y-3">
                      {analysis.strengths && analysis.strengths.length > 0 ? (
                        analysis.strengths.map((strength, index) => (
                          <div key={index} className="flex items-start">
                            <div className="text-green-500 mr-2 mt-1">✓</div>
                            <span className="text-gray-700">{strength}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 italic">
                          No strengths identified
                        </p>
                      )}
                    </div>
                  </Card>

                  <Card>
                    <h2 className="text-xl font-semibold mb-4 text-orange-600">
                      🎯 Areas for Improvement
                    </h2>
                    <div className="space-y-3">
                      {analysis.improvements &&
                      analysis.improvements.length > 0 ? (
                        analysis.improvements.map((improvement, index) => (
                          <div key={index} className="flex items-start">
                            <div className="text-orange-500 mr-2 mt-1">→</div>
                            <span className="text-gray-700">{improvement}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 italic">
                          No improvements suggested
                        </p>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Interview Metrics */}
                <Card>
                  <h2 className="text-xl font-semibold mb-4">
                    Interview Metrics
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analysis.actual_duration_minutes ||
                          interview.duration_minutes}
                      </div>
                      <div className="text-sm text-gray-600">
                        Duration (minutes)
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {analysis.average_response_time_seconds
                          ? `${analysis.average_response_time_seconds}s`
                          : "--"}
                      </div>
                      <div className="text-sm text-gray-600">
                        Avg Response Time
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {analysis.question_count || "--"}
                      </div>
                      <div className="text-sm text-gray-600">
                        Questions Asked
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Detailed Feedback */}
                {analysis.detailed_feedback && (
                  <Card>
                    <h2 className="text-xl font-semibold mb-4">
                      Detailed Feedback
                    </h2>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-gray-800 whitespace-pre-line">
                        {analysis.detailed_feedback}
                      </p>
                    </div>
                  </Card>
                )}

                {/* Conversation Transcript */}
                <Card>
                  <h2 className="text-xl font-semibold mb-4">
                    Conversation Transcript
                  </h2>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div key={message.id || index} className="flex">
                          <div className="flex-shrink-0 w-20 text-sm text-gray-500">
                            {message.user?.name || "AI"}:
                          </div>
                          <div className="flex-1">
                            <div
                              className={`inline-block px-3 py-2 rounded-lg text-sm ${
                                message.message_type === "ai_response"
                                  ? "bg-blue-100 text-blue-800"
                                  : message.message_type ===
                                    "interviewer_response"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {message.content}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(
                                message.created_at
                              ).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
          {interview.status === "completed" && !analysis && (
            <button
              onClick={generateAnalysis}
              disabled={generatingAnalysis}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingAnalysis ? "Generating..." : "Generate Analysis"}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InterviewAnalysis;

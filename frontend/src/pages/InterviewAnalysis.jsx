import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import IndividualNavbar from "../components/layout/IndividualNavbar";
import OrganizationNavbar from "../components/layout/OrganizationNavbar";
import Card from "../components/ui/Card";
import { getSidebarItems } from "../utils/auth";

export default function InterviewAnalysis() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);

  const userRole = localStorage.getItem("authRole");
  const sidebarItems = getSidebarItems(
    userRole,
    localStorage.getItem("authPlan")
  );
  const NavbarComponent =
    userRole === "organization" ? OrganizationNavbar : IndividualNavbar;
  const isInterviewer = userRole === "organization";

  useEffect(() => {
    fetchInterview();
  }, [interviewId]);

  const fetchInterview = async () => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setInterview(data);

        // If analysis exists, parse it
        if (data.analysis_data) {
          setAnalysis(JSON.parse(data.analysis_data));
        }
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error fetching interview:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async () => {
    if (!isInterviewer) return;

    setGeneratingAnalysis(true);
    try {
      const response = await fetch(`/api/interviews/${interviewId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
        setInterview(data.interview);
      }
    } catch (error) {
      console.error("Error generating analysis:", error);
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  const updateDecision = async (decision) => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ decision }),
      });

      if (response.ok) {
        const data = await response.json();
        setInterview(data.interview);
      }
    } catch (error) {
      console.error("Error updating decision:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "passed":
        return "text-green-600 bg-green-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "second_round":
        return "text-blue-600 bg-blue-100";
      case "third_round":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (decision) => {
    switch (decision) {
      case "passed":
        return "Passed";
      case "failed":
        return "Not Selected";
      case "second_round":
        return "Advanced to Round 2";
      case "third_round":
        return "Advanced to Round 3";
      default:
        return "Pending Decision";
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={NavbarComponent}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!interview) {
    return (
      <DashboardLayout
        NavbarComponent={NavbarComponent}
        sidebarItems={sidebarItems}
      >
        <div className="text-center py-12">
          <p className="text-gray-500">Interview not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      NavbarComponent={NavbarComponent}
      sidebarItems={sidebarItems}
    >
      <div className="mb-6">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-600/80 via-purple-600/60 to-cyan-500/60 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">
                Interview Analysis
              </h1>
              <p className="mt-1 text-white/90">
                {interview.title} - Round {interview.current_round}
              </p>
            </div>
            <div className="text-right">
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  interview.final_decision
                )}`}
              >
                {getStatusText(interview.final_decision)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interview Details */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-lg font-semibold mb-4">Interview Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Position
                </label>
                <p className="text-gray-900">
                  {interview.post_title || "General Interview"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Round
                </label>
                <p className="text-gray-900">
                  Round {interview.current_round} of {interview.max_rounds}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Date & Time
                </label>
                <p className="text-gray-900">
                  {new Date(interview.scheduled_at).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Duration
                </label>
                <p className="text-gray-900">
                  {interview.duration_minutes} minutes
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Status
                </label>
                <p className="text-gray-900 capitalize">
                  {interview.status.replace("_", " ")}
                </p>
              </div>
              {interview.rating && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Rating
                  </label>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-lg ${
                          i < interview.rating
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
          </Card>

          {/* Decision Panel (Interviewer Only) */}
          {isInterviewer &&
            interview.status === "completed" &&
            !interview.final_decision && (
              <Card className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Make Decision</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => updateDecision("passed")}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    ✅ Pass Candidate
                  </button>
                  <button
                    onClick={() => updateDecision("second_round")}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    🔄 Invite to Round 2
                  </button>
                  <button
                    onClick={() => updateDecision("third_round")}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    🎯 Invite to Round 3
                  </button>
                  <button
                    onClick={() => updateDecision("failed")}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    ❌ Do Not Proceed
                  </button>
                </div>
              </Card>
            )}
        </div>

        {/* Analysis Content */}
        <div className="lg:col-span-2">
          {!analysis ? (
            <Card>
              <div className="text-center py-12">
                {isInterviewer ? (
                  <div>
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Generate Interview Analysis
                    </h3>
                    <p className="text-gray-600 mb-6">
                      AI-powered analysis of the candidate's performance,
                      strengths, and areas for improvement.
                    </p>
                    <button
                      onClick={generateAnalysis}
                      disabled={generatingAnalysis}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingAnalysis ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Generating Analysis...</span>
                        </div>
                      ) : (
                        "Generate Analysis"
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-4">⏳</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Analysis Pending
                    </h3>
                    <p className="text-gray-600">
                      The interviewer will generate your interview analysis
                      soon.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card>
                <div className="text-center">
                  <div className="text-4xl font-bold text-indigo-600 mb-2">
                    {analysis.overall_score}/100
                  </div>
                  <p className="text-gray-600">Overall Interview Score</p>
                </div>
              </Card>

              {/* Skills Breakdown */}
              <Card>
                <h3 className="text-lg font-semibold mb-4">
                  Skills Assessment
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(analysis)
                    .filter(([key]) =>
                      [
                        "communication_skills",
                        "technical_knowledge",
                        "problem_solving",
                        "cultural_fit",
                      ].includes(key)
                    )
                    .map(([skill, score]) => (
                      <div key={skill} className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">
                          {score}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">
                          {skill.replace("_", " ")}
                        </div>
                      </div>
                    ))}
                </div>
              </Card>

              {/* Summary */}
              <Card>
                <h3 className="text-lg font-semibold mb-3">Summary</h3>
                <p className="text-gray-700">{analysis.summary}</p>
              </Card>

              {/* Strengths */}
              <Card>
                <h3 className="text-lg font-semibold mb-3 text-green-700">
                  💪 Strengths
                </h3>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Areas for Improvement */}
              <Card>
                <h3 className="text-lg font-semibold mb-3 text-orange-700">
                  🎯 Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {analysis.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-orange-500 mt-1">→</span>
                      <span className="text-gray-700">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Recommendation */}
              <Card>
                <h3 className="text-lg font-semibold mb-3">Recommendation</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800">{analysis.recommendation}</p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

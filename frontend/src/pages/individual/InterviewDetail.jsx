import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { formatDateTime as formatDateTimeTz } from "../../utils/timezone";

export default function InterviewDetail() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [analysisGenerating, setAnalysisGenerating] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const response = await fetch(
          `${getBackendUrl()}/api/interviews/${interviewId}`,
          {
            headers: getAuthHeaders(),
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch interview details");
        }

        const data = await response.json();
        setInterview(data);
      } catch (err) {
        console.error("Error fetching interview:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [interviewId]);

  const fetchAnalysis = async () => {
    try {
      setAnalysisLoading(true);
      setAnalysisError(null);
      const res = await fetch(
        `${getBackendUrl()}/api/interviews/${interviewId}/analysis`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!res.ok) {
        setAnalysis(null);
        return;
      }

      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      setAnalysis(null);
      setAnalysisError("Failed to load analysis.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const generateAnalysis = async () => {
    try {
      setAnalysisGenerating(true);
      setAnalysisError(null);
      const res = await fetch(
        `${getBackendUrl()}/api/interviews/${interviewId}/analyze?force=true`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          credentials: "include",
        }
      );

      if (!res.ok) {
        setAnalysisError("Failed to generate analysis.");
        return;
      }

      const result = await res.json();
      setAnalysis(result?.analysis || null);
    } catch (e) {
      setAnalysisError("Failed to generate analysis.");
    } finally {
      setAnalysisGenerating(false);
    }
  };

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/auth/me`, {
          headers: getAuthHeaders(),
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data?.user || null);
        } else {
          setCurrentUser(null);
        }
      } catch (e) {
        setCurrentUser(null);
      }
    };

    fetchMe();
  }, []);

  useEffect(() => {
    if (!interviewId) return;
    if (!interview) return;
    if (interview.status !== "completed") return;
    fetchAnalysis();
  }, [interviewId, interview]);

  const loadConversation = async () => {
    try {
      setChatLoading(true);
      setChatError(null);
      const res = await fetch(
        `${getBackendUrl()}/api/interviews/${interviewId}/conversation`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!res.ok) {
        setChatError("Failed to load chat.");
        setChatMessages([]);
        return;
      }

      const data = await res.json();
      setChatMessages(data?.conversation || []);
    } catch (e) {
      setChatError("Failed to load chat.");
      setChatMessages([]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (!interviewId) return;
    loadConversation();
  }, [interviewId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const sendChatMessage = async () => {
    const message = chatInput.trim();
    if (!message) return;

    setChatSending(true);
    setChatError(null);

    try {
      const res = await fetch(
        `${getBackendUrl()}/api/interviews/${interviewId}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          credentials: "include",
          body: JSON.stringify({ message }),
        }
      );

      if (!res.ok) {
        setChatError("Unable to send message.");
        return;
      }

      setChatInput("");
      await loadConversation();
    } catch (e) {
      setChatError("Unable to send message.");
    } finally {
      setChatSending(false);
    }
  };

  const formatDateTime = (dateString) => {
    return formatDateTimeTz(dateString, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Completed
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            In Progress
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            Scheduled
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getDecisionBadge = (decision) => {
    switch (decision) {
      case "passed":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Passed
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            Not Selected
          </span>
        );
      case "second_round":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Advanced to Second Round
          </span>
        );
      case "third_round":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            Advanced to Final Round
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout NavbarComponent={IndividualNavbar}>
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">Loading interview details...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout NavbarComponent={IndividualNavbar}>
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Interview History
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!interview) {
    return (
      <DashboardLayout NavbarComponent={IndividualNavbar}>
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Interview Not Found
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                The requested interview could not be found.
              </p>
            </div>
            <div className="px-4 py-4 bg-gray-50 text-right sm:px-6">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Interview History
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout NavbarComponent={IndividualNavbar}>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Interview Details
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {interview.organization &&
                `Organized by ${interview.organization}`}
              {interview.post_title && ` • ${interview.post_title}`}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to History
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interview Overview */}
            <Card>
              <div className="px-6 py-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {interview.title}
                    </h2>
                    <div className="mt-1 flex items-center space-x-2">
                      {getStatusBadge(interview.status)}
                      {interview.final_decision &&
                        getDecisionBadge(interview.final_decision)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Scheduled</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDateTime(
                        interview.scheduled_at_iso || interview.scheduled_at
                      )}
                    </p>
                    <p className="text-sm text-gray-500">
                      Duration: {interview.duration_minutes || 60} minutes
                    </p>
                  </div>
                </div>

                {interview.feedback && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      Overall Feedback
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700">
                        {interview.feedback}
                      </p>
                    </div>
                  </div>
                )}

                {interview.strengths && interview.strengths.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      Key Strengths
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {interview.strengths.map((strength, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {interview.improvements &&
                  interview.improvements.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        Areas for Improvement
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {interview.improvements.map((improvement, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                          >
                            {improvement}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </Card>

            {/* Interview Rounds */}
            {interview.decision_history &&
              interview.decision_history.length > 0 && (
                <Card>
                  <div className="px-6 py-5">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      Interview Rounds
                    </h2>
                    <div className="space-y-6">
                      {interview.decision_history
                        .sort((a, b) => a.round_number - b.round_number)
                        .map((round) => (
                          <div
                            key={round.id}
                            className="border-l-4 border-blue-400 pl-4 py-2"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-base font-medium text-gray-900">
                                  Round {round.round_number}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {round.decided_at
                                    ? formatDateTime(round.decided_at)
                                    : "Date not available"}
                                </p>
                              </div>
                              <div>
                                {round.decision &&
                                  getDecisionBadge(round.decision)}
                              </div>
                            </div>

                            {round.feedback && (
                              <div className="mt-2">
                                <h4 className="text-sm font-medium text-gray-700">
                                  Feedback:
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {round.feedback}
                                </p>
                              </div>
                            )}

                            {round.rating && (
                              <div className="mt-2">
                                <h4 className="text-sm font-medium text-gray-700">
                                  Rating:
                                </h4>
                                <div className="flex items-center mt-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                      key={star}
                                      className={`text-xl ${
                                        star <= round.rating
                                          ? "text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                  <span className="ml-2 text-sm text-gray-600">
                                    {round.rating.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </Card>
              )}

            {/* Analysis Section */}
            {interview.analysis_data && (
              <Card>
                <div className="px-6 py-5">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Performance Analysis
                  </h2>
                  <div className="prose max-w-none">
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {interview.analysis_data}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {interview.status === "completed" && (
              <Card>
                <div className="px-6 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">
                      Interview Analysis
                    </h2>
                    {analysis && (
                      <button
                        onClick={() =>
                          navigate(`/interviews/${interviewId}/analysis`)
                        }
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View Full Analysis
                      </button>
                    )}
                  </div>

                  {analysisError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                      {analysisError}
                    </div>
                  )}

                  {analysisLoading ? (
                    <div className="text-sm text-gray-500">
                      Loading analysis...
                    </div>
                  ) : analysis ? (
                    <div className="space-y-3">
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
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="text-4xl mb-3">📊</div>
                      <div className="text-sm text-gray-600 mb-4">
                        No analysis available yet.
                      </div>
                      <button
                        onClick={generateAnalysis}
                        disabled={analysisGenerating}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {analysisGenerating
                          ? "Generating..."
                          : "Generate Analysis"}
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <Card>
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Chat</h2>
                  <button
                    onClick={loadConversation}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    disabled={chatLoading}
                  >
                    Refresh
                  </button>
                </div>

                {chatError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                    {chatError}
                  </div>
                )}

                <div className="border border-gray-200 rounded-lg bg-gray-50 p-4 h-80 overflow-y-auto">
                  {chatLoading ? (
                    <div className="text-sm text-gray-500">Loading chat...</div>
                  ) : chatMessages.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No messages yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map((msg) => {
                        const isMe =
                          msg.sender_type === "user" &&
                          currentUser?.id &&
                          msg.sender_user_id === currentUser.id;
                        const alignRight = isMe;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${
                              alignRight ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                                alignRight
                                  ? "bg-blue-600 text-white rounded-br-md"
                                  : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                              }`}
                            >
                              <div className="whitespace-pre-wrap break-words">
                                {msg.content}
                              </div>
                              <div
                                className={`mt-1 text-xs ${
                                  alignRight
                                    ? "text-blue-100 text-right"
                                    : "text-gray-500"
                                }`}
                              >
                                {msg.sender_name}
                                {msg.created_at
                                  ? ` • ${formatDateTime(msg.created_at)}`
                                  : ""}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    disabled={chatSending}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={chatSending || !chatInput.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Interview Details */}
            <Card>
              <div className="px-6 py-5">
                <h2 className="text-base font-medium text-gray-900 mb-4">
                  Interview Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Interview Type
                    </h3>
                    <p className="mt-1 text-sm text-gray-900 capitalize">
                      {interview.interview_type?.replace("_", " ") || "N/A"}
                    </p>
                  </div>

                  {interview.location && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Location
                      </h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {interview.location}
                      </p>
                    </div>
                  )}

                  {(interview.meeting_link || interview.room_id) && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Meeting Information
                      </h3>
                      {interview.meeting_link && (
                        <a
                          href={interview.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Join Meeting
                        </a>
                      )}
                      {interview.room_id && (
                        <p className="mt-1 text-sm text-gray-900">
                          Room ID: {interview.room_id}
                          {interview.room_password && (
                            <span className="ml-2">
                              (Password: {interview.room_password})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  {interview.interviewers &&
                    interview.interviewers.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          {interview.interviewers.length > 1
                            ? "Interviewers"
                            : "Interviewer"}
                        </h3>
                        <ul className="mt-1 space-y-1">
                          {interview.interviewers.map((interviewer, index) => (
                            <li key={index} className="text-sm text-gray-900">
                              {interviewer.name || `Interviewer ${index + 1}`}
                              {interviewer.role && (
                                <span className="text-gray-500 ml-2">
                                  ({interviewer.role})
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </div>
            </Card>

            {/* Next Steps */}
            <Card>
              <div className="px-6 py-5">
                <h2 className="text-base font-medium text-gray-900 mb-4">
                  Next Steps
                </h2>
                {interview.final_decision === "passed" ? (
                  <div className="bg-green-50 border-l-4 border-green-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-green-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">
                          <span className="font-medium">Congratulations!</span>{" "}
                          You've successfully passed this interview round.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        View Offer Details
                      </button>
                    </div>
                  </div>
                ) : interview.final_decision === "failed" ? (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-blue-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Thank you</span> for
                          participating in our interview process.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View Feedback
                      </button>
                      <button
                        type="button"
                        className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Find Other Opportunities
                      </button>
                    </div>
                  </div>
                ) : interview.final_decision === "second_round" ||
                  interview.final_decision === "third_round" ? (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-blue-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Great job!</span> You've
                          been selected for the next round of interviews.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Schedule Next Interview
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No next steps available at this time.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

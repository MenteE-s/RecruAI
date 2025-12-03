import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TextInterview from "../components/interviews/TextInterview";
import { formatDateTime } from "../utils/timezone";

const InterviewRoom = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [interviewMode, setInterviewMode] = useState("auto"); // 'auto' or 'manual' - default to auto for AI responses
  const [aiUserId, setAiUserId] = useState(null);

  // Get user role and determine if they're interviewer or candidate
  const userRole = localStorage.getItem("authRole");
  const userId = 1; // TODO: Get from auth context

  // Determine if user is interviewer or candidate
  // Organization users are interviewers, individual users are candidates
  // If there's an AI agent, the AI is interviewer and human is candidate
  const isInterviewer = userRole === "organization";

  useEffect(() => {
    if (interviewId) {
      fetchInterview();
      fetchAiUser();
    }
  }, [interviewId]);

  const fetchAiUser = async () => {
    try {
      const response = await fetch("/api/ai/user", {
        credentials: "include",
      });
      if (response.ok) {
        const aiUser = await response.json();
        setAiUserId(aiUser.id);
      }
    } catch (error) {
      console.error("Error fetching AI user:", error);
    }
  };

  // Poll for new messages every 30 seconds when interview is active and window is visible
  useEffect(() => {
    let intervalId;

    const pollMessages = () => {
      // Only poll if document is visible (user hasn't switched tabs)
      if (document.visibilityState === "visible") {
        loadMessages();
      }
    };

    if (interview && isInterviewReady()) {
      intervalId = setInterval(pollMessages, 30000); // Poll every 30 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [interview, interviewId]);

  const fetchInterview = async () => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setInterview(data);

        // Check if user has access to this interview
        if (userRole === "organization" && data.organization_id !== 1) {
          // TODO: Get org ID from context
          setError("Access denied");
          return;
        }
        if (userRole !== "organization" && data.user_id !== userId) {
          setError("Access denied");
          return;
        }

        // Load existing messages if any
        loadMessages();
      } else {
        setError("Interview not found");
      }
    } catch (error) {
      console.error("Error fetching interview:", error);
      setError("Failed to load interview");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}/messages`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // Transform backend messages to frontend format
        const transformedMessages = data.map((msg) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.user?.name || "Unknown User",
          timestamp: msg.created_at,
          type: msg.message_type,
          userId: msg.user_id,
        }));
        // Only update state if messages have actually changed
        setMessages((prevMessages) => {
          if (prevMessages.length !== transformedMessages.length) {
            return transformedMessages;
          }

          // Check if any message has changed
          const hasChanged = transformedMessages.some((newMsg, index) => {
            const oldMsg = prevMessages[index];
            return (
              !oldMsg ||
              oldMsg.id !== newMsg.id ||
              oldMsg.content !== newMsg.content ||
              oldMsg.sender !== newMsg.sender
            );
          });

          return hasChanged ? transformedMessages : prevMessages;
        });
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSendMessage = async (message) => {
    setIsLoading(true);

    try {
      // Save user message to database
      const response = await fetch(`/api/interviews/${interviewId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user_id: userId,
          content: message,
          message_type: "text",
        }),
      });

      if (response.ok) {
        // Reload messages to get the updated list
        await loadMessages();

        // Handle response based on interview mode
        if (interviewMode === "auto") {
          // Auto mode: Get AI response automatically (works even without specific ai_agent_id)
          const aiResponse = await fetch("http://localhost:5000/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              interview_id: interviewId,
              message: message,
              conversation_history: messages.map((msg) => ({
                role: msg.userId === aiUserId ? "assistant" : "user",
                content: msg.content,
              })),
              agent_id: interview?.ai_agent_id || 1, // Default to agent 1 if not specified
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            // Save AI response to database
            await fetch(`/api/interviews/${interviewId}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                user_id: aiUserId,
                content: aiData.response,
                message_type: "ai_response",
              }),
            });
            // Reload messages to include AI response
            await loadMessages();
          }
        }
        // In manual mode, interviewer will respond manually
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message to local state (not saved to DB)
      const errorMessage = {
        id: Date.now(),
        content:
          "Sorry, there was an error sending your message. Please try again.",
        sender: "system",
        timestamp: new Date().toISOString(),
        type: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterviewerResponse = async (message) => {
    setIsLoading(true);

    try {
      // Save interviewer response to database
      const response = await fetch(`/api/interviews/${interviewId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user_id: userId, // Interviewer user ID
          content: message,
          message_type: "interviewer_response",
        }),
      });

      if (response.ok) {
        await loadMessages();
      } else {
        throw new Error("Failed to send response");
      }
    } catch (error) {
      console.error("Error sending interviewer response:", error);
      const errorMessage = {
        id: Date.now(),
        content:
          "Sorry, there was an error sending your response. Please try again.",
        sender: "system",
        timestamp: new Date().toISOString(),
        type: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Check if interview is ready to start
  const isInterviewReady = () => {
    if (!interview) return false;
    const now = new Date();
    const scheduledTime = new Date(interview.scheduled_at);
    const timeDiff = scheduledTime - now;
    const minutesDiff = timeDiff / (1000 * 60);

    // Interview is ready 15 minutes before scheduled time
    return minutesDiff <= 15;
  };

  // Render waiting room
  const renderWaitingRoom = () => {
    const now = new Date();
    const scheduledTime = new Date(interview.scheduled_at);
    const timeDiff = scheduledTime - now;
    const minutesDiff = Math.ceil(timeDiff / (1000 * 60));

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-blue-500 text-4xl mb-4">⏰</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Interview Waiting Room
          </h2>
          <p className="text-gray-600 mb-4">
            {minutesDiff > 0
              ? `Your interview starts in ${minutesDiff} minute${
                  minutesDiff !== 1 ? "s" : ""
                }.`
              : "Your interview is about to start!"}
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>📅 {formatDateTime(interview.scheduled_at)}</p>
            <p>⏱️ Duration: {interview.duration_minutes} minutes</p>
            <p>
              💬 Interview Type:{" "}
              {interview.interview_type === "text"
                ? "Text Chat"
                : interview.interview_type}
            </p>
          </div>
          <div className="mt-6">
            <div className="animate-pulse bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
              Waiting for interview to begin...
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  };

  // Render different interview types
  const renderInterview = () => {
    // Show waiting room if interview hasn't started yet
    if (!isInterviewReady()) {
      return renderWaitingRoom();
    }

    switch (interview?.interview_type) {
      case "text":
        return (
          <div className="min-h-screen bg-gray-100">
            {/* Interviewer Mode Selection */}
            {isInterviewer && (
              <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700">
                      Interview Mode:
                    </span>
                    <div className="flex rounded-md shadow-sm">
                      <button
                        onClick={() => setInterviewMode("auto")}
                        className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                          interviewMode === "auto"
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        🤖 Auto (AI)
                      </button>
                      <button
                        onClick={() => setInterviewMode("manual")}
                        className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                          interviewMode === "manual"
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        ✍️ Manual
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {interviewMode === "auto"
                      ? "AI will respond automatically to candidate messages"
                      : "You will manually respond to candidate messages"}
                  </div>
                </div>
              </div>
            )}

            <TextInterview
              interviewId={interviewId}
              interviewData={interview}
              isInterviewer={isInterviewer}
              interviewMode={interviewMode}
              onSendMessage={handleSendMessage}
              onInterviewerResponse={handleInterviewerResponse}
              messages={messages}
              isLoading={isLoading}
            />
          </div>
        );

      case "ai_video":
        return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
              <div className="text-blue-500 text-4xl mb-4">🤖</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                AI Video Interview
              </h2>
              <p className="text-gray-600 mb-4">
                Coming soon! This feature is under development.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        );

      case "human_video":
        return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
              <div className="text-green-500 text-4xl mb-4">👥</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Human Video Interview
              </h2>
              <p className="text-gray-600 mb-4">
                Coming soon! This feature is under development.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
              <div className="text-gray-500 text-4xl mb-4">❓</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Unknown Interview Type
              </h2>
              <p className="text-gray-600 mb-4">
                This interview type is not supported.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        );
    }
  };

  return <div className="min-h-screen bg-gray-100">{renderInterview()}</div>;
};

export default InterviewRoom;

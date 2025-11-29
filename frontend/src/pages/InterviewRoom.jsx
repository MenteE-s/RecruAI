import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TextInterview from "../components/interviews/TextInterview";

const InterviewRoom = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get user role and determine if they're interviewer or candidate
  const userRole = localStorage.getItem("authRole");
  const userId = 1; // TODO: Get from auth context
  const isInterviewer = userRole === "organization" || interview?.ai_agent_id;

  useEffect(() => {
    if (interviewId) {
      fetchInterview();
    }
  }, [interviewId]);

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
    // TODO: Load messages from backend when we implement message storage
    // For now, start with empty messages
    setMessages([]);
  };

  const handleSendMessage = async (message) => {
    setIsLoading(true);

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      content: message,
      sender: isInterviewer ? "interviewer" : "candidate",
      timestamp: new Date().toISOString(),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // If this is an AI interview, get AI response
      if (interview?.ai_agent_id) {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            interview_id: interviewId,
            message: message,
            agent_id: interview.ai_agent_id,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiMessage = {
            id: Date.now() + 1,
            content: data.response,
            sender: "ai",
            timestamp: new Date().toISOString(),
            type: "text",
          };
          setMessages((prev) => [...prev, aiMessage]);
        }
      } else {
        // For human interviews, messages would be sent via WebSocket
        // TODO: Implement WebSocket messaging
        console.log("Human interview message:", message);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message
      const errorMessage = {
        id: Date.now() + 2,
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
            <p>📅 {new Date(interview.scheduled_at).toLocaleString()}</p>
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
          <TextInterview
            interviewId={interviewId}
            interviewData={interview}
            isInterviewer={isInterviewer}
            onSendMessage={handleSendMessage}
            messages={messages}
            isLoading={isLoading}
          />
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

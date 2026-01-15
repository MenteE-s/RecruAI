import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Card from "../ui/Card";
import ThinkingDisplay from "./ThinkingDisplay";
import { formatTime as formatTimeTz } from "../../utils/timezone";
import { getBackendUrl } from "../../utils/auth";

const TextInterview = ({
  interviewId,
  interviewData,
  isInterviewer = false,
  interviewMode = "auto",
  onSendMessage,
  onInterviewerResponse,
  messages = [],
  isLoading = false,
  currentThinking = null,
  showThinking = false,
  setShowThinking = () => {},
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isInterviewCompleted, setIsInterviewCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Countdown timer for interview duration
  useEffect(() => {
    if (!interviewData?.scheduled_at || !interviewData?.duration_minutes)
      return;

    const updateCountdown = () => {
      const now = new Date();
      const scheduledTime = new Date(interviewData.scheduled_at);
      const endTime = new Date(
        scheduledTime.getTime() + interviewData.duration_minutes * 60 * 1000
      );

      const remaining = endTime - now;
      if (remaining > 0) {
        const minutes = Math.floor(remaining / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      } else {
        setTimeRemaining("00:00");
        // Interview time is up - mark as completed
        if (!isInterviewCompleted) {
          setIsInterviewCompleted(true);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [interviewData, isInterviewCompleted]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const message = newMessage.trim();
    setNewMessage("");

    // Determine which handler to use based on user role and mode
    if (isInterviewer && interviewMode === "manual") {
      // Interviewer sending manual response
      if (onInterviewerResponse) {
        await onInterviewerResponse(message);
      }
    } else if (!isInterviewer) {
      // Candidate sending message
      if (onSendMessage) {
        await onSendMessage(message);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCompleteInterview = async () => {
    setIsCompleting(true);
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/interviews/${interviewId}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (response.ok) {
        // Redirect to analysis page after completion
        window.location.href = `/interviews/${interviewId}/analysis`;
      } else {
        throw new Error("Failed to complete interview");
      }
    } catch (error) {
      console.error("Error completing interview:", error);
      alert("Failed to complete interview. Please try again.");
    } finally {
      setIsCompleting(false);
    }
  };

  const formatTime = (timestamp) => {
    return formatTimeTz(timestamp);
  };

  // Show completion screen if interview is completed
  if (isInterviewCompleted) {
    return (
      <div className="flex flex-col h-full max-h-screen">
        {/* Interview Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {interviewData?.title || "Text Interview"}
              </h2>
              <p className="text-sm text-gray-600">
                {isInterviewer ? "Interviewer" : "Candidate"} • Interview
                Completed
              </p>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Completed</span>
            </div>
          </div>
        </div>

        {/* Completion Message */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">🎉</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Interview Completed!
            </h3>
            <p className="text-gray-600 mb-8">
              Thank you for participating in this interview. Your responses have
              been recorded and will be reviewed.
            </p>
            <button
              onClick={handleCompleteInterview}
              disabled={isCompleting}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isCompleting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                "Proceed to Dashboard"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Interview Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {interviewData?.title || "Text Interview"}
            </h2>
            <p className="text-sm text-gray-600">
              {isInterviewer ? "Interviewer" : "Candidate"} • Text Chat
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {timeRemaining && (
              <div className="flex items-center space-x-2">
                <div className="text-sm font-medium text-gray-700">
                  Time Left:
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-mono ${
                    timeRemaining === "00:00"
                      ? "bg-red-100 text-red-800"
                      : timeRemaining.startsWith("0")
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {timeRemaining}
                </div>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Interview Started
            </h3>
            <p className="text-gray-600">
              {isInterviewer
                ? "Begin the conversation with the candidate."
                : "The interviewer will start the conversation soon."}
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            // Updated logic to match backend sender types: 'user' vs 'agent'
            const isAI =
              message.type === "agent" || message.type === "ai_response";
            const isInterviewerMessage =
              message.type === "interviewer_response" ||
              (isInterviewer &&
                message.type === "user" &&
                message.userId === interviewData?.interviewer_id);

            const isFromOtherParty = isInterviewer
              ? message.type === "user"
              : isAI || message.type === "interviewer_response";

            // Simplified: User's own messages on right, others on left
            // For Candidates (isInterviewer=false): 'user' messages are MINE (Right), 'agent'/'interviewer' on LEFT
            // For Interviewers (isInterviewer=true): 'interviewer' messages are MINE (Right), 'user' (candidate) on LEFT
            let shouldShowOnRight = false;
            if (isInterviewer) {
              // I am the interviewer - show my manual responses or AI responses (if auto) on right
              shouldShowOnRight =
                message.type === "interviewer_response" ||
                (interviewMode === "auto" && isAI);
            } else {
              // I am the candidate - show my 'user' messages on right
              shouldShowOnRight = message.type === "user";
            }

            return (
              <div
                key={message.id || index}
                className={`flex items-start mb-4 ${
                  shouldShowOnRight ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    shouldShowOnRight ? "bg-blue-600 ml-2" : "bg-gray-400 mr-2"
                  }`}
                >
                  {shouldShowOnRight
                    ? isInterviewer
                      ? "👤"
                      : "👨"
                    : isAI
                    ? "🤖"
                    : "👤"}
                </div>

                <div
                  className={`flex flex-col ${
                    shouldShowOnRight ? "items-end" : "items-start"
                  } max-w-[75%]`}
                >
                  {/* Sender name for received messages */}
                  {!shouldShowOnRight && (
                    <div className="text-xs text-gray-500 mb-1 px-1">
                      {isAI
                        ? message.sender || "AI Assistant"
                        : message.sender || "Interviewer"}
                    </div>
                  )}

                  <div
                    className={`px-4 py-2 rounded-2xl shadow-sm ${
                      shouldShowOnRight
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
                    }`}
                  >
                    <div
                      className={`text-[15px] leading-relaxed markdown-content ${
                        shouldShowOnRight ? "prose-invert" : ""
                      }`}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-400 mt-1 px-1">
                    {formatTime(message.created_at || message.timestamp)}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Thinking Process Display - Only visible to interviewers/organization */}
        {isInterviewer && currentThinking && (
          <div className="mt-4">
            <ThinkingDisplay
              thinkingStep={currentThinking}
              isVisible={showThinking}
              onToggle={() => setShowThinking(!showThinking)}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        {isInterviewer && interviewMode === "manual" ? (
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Manual Response Mode
              </span>
              <span className="text-xs text-gray-500">
                You control the conversation
              </span>
            </div>
          </div>
        ) : isInterviewer && interviewMode === "auto" ? (
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Auto Mode
              </span>
              <span className="text-xs text-gray-500">
                AI handles responses automatically
              </span>
            </div>
          </div>
        ) : null}

        <div className="flex space-x-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              isInterviewer && interviewMode === "manual"
                ? "Type your response to the candidate..."
                : isInterviewer && interviewMode === "auto"
                ? "Input disabled - AI handles responses"
                : "Type your message to the interviewer..."
            }
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            style={{ minHeight: "40px", maxHeight: "120px" }}
            disabled={
              isLoading ||
              (isInterviewer && interviewMode === "auto") ||
              isInterviewCompleted
            }
          />
          <button
            onClick={handleSendMessage}
            disabled={
              !newMessage.trim() ||
              isLoading ||
              (isInterviewer && interviewMode === "auto") ||
              isInterviewCompleted
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{newMessage.length} characters</span>
        </div>
      </div>
    </div>
  );
};

export default TextInterview;

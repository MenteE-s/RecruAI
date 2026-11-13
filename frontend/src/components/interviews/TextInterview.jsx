import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ThinkingDisplay from "./ThinkingDisplay";
import { formatTime as formatTimeTz } from "../../utils/timezone";
import { getBackendUrl, getAuthHeaders } from "../../utils/auth";
import {
  FiCheckCircle,
  FiMessageSquare,
  FiSend,
  FiUser,
  FiCpu,
  FiClock,
} from "react-icons/fi";

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

    if (isInterviewer && interviewMode === "manual") {
      if (onInterviewerResponse) {
        await onInterviewerResponse(message);
      }
    } else if (!isInterviewer) {
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
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        window.location.href = `/in/interviews/${interviewId}/analysis`;
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
      <div className="flex flex-col h-full bg-surface text-ink">
        <div className="bg-surface border-b border-line p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                {interviewData?.title || "Text Interview"}
              </h2>
              <p className="text-[11.5px] text-gray-500 mt-0.5">
                {isInterviewer ? "Interviewer" : "Candidate"} • Interview Completed
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand/10 text-brand-text border border-brand/20">
              <FiCheckCircle className="w-3.5 h-3.5" />
              <span>Completed</span>
            </div>
          </div>
        </div>

        {/* Completion Message */}
        <div className="flex-1 flex items-center justify-center p-8 py-16">
          <div className="text-center max-w-md">
            <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand-text flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-ink mb-2">
              Interview Completed!
            </h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Thank you for participating. Your responses have been recorded and your
              performance analysis is being prepared.
            </p>
            <button
              onClick={handleCompleteInterview}
              disabled={isCompleting}
              className="px-6 py-2.5 bg-brand-action text-white rounded-xl hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold shadow-s5 transition-colors"
            >
              {isCompleting ? "Processing…" : "Proceed to Analysis"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface text-ink">
      {/* Interview Header */}
      <div className="bg-surface border-b border-line p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              {interviewData?.title || "Text Interview"}
            </h2>
            <p className="text-[11.5px] text-gray-500 mt-0.5">
              {isInterviewer ? "Interviewer" : "Candidate"} • Text Chat
            </p>
          </div>
          <div className="flex items-center gap-3">
            {timeRemaining && (
              <div className="flex items-center gap-1.5">
                <FiClock className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full border border-line bg-surface text-ink">
                  {timeRemaining}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand/10 text-brand-text border border-brand/20">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              <span>Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/40 min-h-[380px] max-h-[560px]">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand-text flex items-center justify-center mx-auto mb-2.5">
              <FiMessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-ink mb-1">
              Interview Started
            </h3>
            <p className="text-xs text-gray-500">
              {isInterviewer
                ? "Begin the conversation with the candidate."
                : "The interviewer will start the conversation soon."}
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isAI =
              message.type === "agent" || message.type === "ai_response";

            let shouldShowOnRight = false;
            if (isInterviewer) {
              shouldShowOnRight =
                message.type === "interviewer_response" ||
                (interviewMode === "auto" && isAI);
            } else {
              shouldShowOnRight = message.type === "user";
            }

            return (
              <div
                key={message.id || index}
                className={`flex items-start mb-3 ${
                  shouldShowOnRight ? "flex-row-reverse" : "flex-row"
                }`}>
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${
                    shouldShowOnRight
                      ? "bg-brand-action text-white ml-2"
                      : "bg-gray-100 dark:bg-gray-800 text-ink border border-line mr-2"
                  }`}>
                  {shouldShowOnRight ? (
                    <FiUser className="w-3.5 h-3.5" />
                  ) : isAI ? (
                    <FiCpu className="w-3.5 h-3.5 text-brand-text" />
                  ) : (
                    <FiUser className="w-3.5 h-3.5" />
                  )}
                </div>

                <div
                  className={`flex flex-col ${
                    shouldShowOnRight ? "items-end" : "items-start"
                  } max-w-[80%]`}>
                  {!shouldShowOnRight && (
                    <div className="text-[10.5px] font-medium text-gray-500 mb-1 px-1">
                      {isAI
                        ? message.sender || "AI Assistant"
                        : message.sender || "Interviewer"}
                    </div>
                  )}

                  <div
                    className={`px-3.5 py-2.5 rounded-2xl shadow-s5 text-xs leading-relaxed ${
                      shouldShowOnRight
                        ? "bg-brand-action text-white rounded-tr-none"
                        : "bg-surface text-ink border border-line rounded-tl-none"
                    }`}>
                    <div
                      className={`markdown-content ${
                        shouldShowOnRight ? "prose-invert" : ""
                      }`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-500 mt-1 px-1">
                    {formatTime(message.created_at || message.timestamp)}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-line px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-s5">
              <span className="w-2 h-2 rounded-full bg-brand animate-ping" />
              <span className="text-xs text-gray-500">AI is thinking…</span>
            </div>
          </div>
        )}

        {/* Thinking Process Display */}
        {isInterviewer && currentThinking && (
          <div className="mt-3">
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
      <div className="bg-surface border-t border-line p-3.5">
        <div className="flex items-end gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              isInterviewer && interviewMode === "manual"
                ? "Type your response to the candidate…"
                : isInterviewer && interviewMode === "auto"
                ? "Input disabled — AI handles responses automatically"
                : "Type your message to the interviewer…"
            }
            className="flex-1 resize-none border border-line bg-surface rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand shadow-s5 transition-colors"
            rows={1}
            style={{ minHeight: "38px", maxHeight: "110px" }}
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
            className="p-2.5 bg-brand-action text-white rounded-xl hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-s5 shrink-0"
            aria-label="Send message"
          >
            <FiSend className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-between items-center mt-1.5 text-[10.5px] text-gray-500">
          <span>Enter to send · Shift+Enter for new line</span>
          <span>{newMessage.length} chars</span>
        </div>
      </div>
    </div>
  );
};

export default TextInterview;

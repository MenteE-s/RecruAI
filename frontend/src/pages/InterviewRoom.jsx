import React, { useState, useEffect, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TextInterview from "../components/interviews/TextInterview";
import MenteeLoader from "../components/ui/MenteeLoader";
import { parseUTC } from "../utils/timezone";
import DualTime from "../components/ui/DualTime";
import socketService from "../utils/socket";
import { getCurrentUser, getAuthHeaders } from "../utils/auth";
import { VIDEO_ENABLED } from "../utils/video";
import {
  Clock,
  Video,
  AlertCircle,
  Cpu,
  Edit3,
  HelpCircle,
  Calendar,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";

// LiveKit is the heaviest vendor in the bundle: load it only when a video
// interview actually renders, not on every dashboard visit.
const VideoRoom = React.lazy(() => import("../components/interviews/VideoRoom"));

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

const InterviewRoom = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [interviewMode, setInterviewMode] = useState("auto"); // 'auto' or 'manual'
  const [currentThinking, setCurrentThinking] = useState(null);
  const [showThinking, setShowThinking] = useState(false);

  const userRole = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const userId = me?.id || null;

  useEffect(() => {
    getCurrentUser().then(setMe);
  }, []);

  const isInterviewer = userRole === "organization";

  useEffect(() => {
    if (interviewId && interviewId !== "undefined" && me) {
      fetchInterview();
      loadConversation();

      const handleNewMessage = (payload) => {
        const msg = payload.data;
        if (msg && msg.interview_id === parseInt(interviewId)) {
          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [
              ...prev,
              {
                id: msg.id,
                content: msg.content,
                sender: msg.sender_name,
                timestamp: msg.timestamp,
                type: msg.sender_type,
                userId: msg.sender_user_id,
                agentId: msg.sender_agent_id,
              },
            ];
          });

          if (msg.sender_type === "agent") {
            setIsLoading(false);
          }
        }
      };

      const handleThinking = (payload) => {
        const data = payload.data;
        if (data && data.interview_id === parseInt(interviewId)) {
          setCurrentThinking(data.thinking_process);
          setShowThinking(true);
        }
      };

      socketService.on("interview_candidate_message", handleNewMessage);
      socketService.on("interview_agent_response", handleNewMessage);
      socketService.on("interview_agent_thinking", handleThinking);

      return () => {
        socketService.off("interview_candidate_message", handleNewMessage);
        socketService.off("interview_agent_response", handleNewMessage);
        socketService.off("interview_agent_thinking", handleThinking);
      };
    } else if (interviewId === "undefined") {
      setError("Invalid interview ID");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId, me]);

  const fetchInterview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/interviews/${interviewId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch interview details");
      }

      const data = await response.json();
      setInterview(data);

      if (data.status === "completed") {
        navigate(`/in/interviews/${interviewId}/analysis`);
        return;
      }
    } catch (err) {
      console.error("Error fetching interview:", err);
      setError(err.message || "Failed to load interview");
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/interviews/${interviewId}/conversation`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const formattedMessages = (data.conversation || []).map((msg) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender_name,
          timestamp: msg.created_at,
          type: msg.sender_type,
          userId: msg.sender_user_id,
          agentId: msg.sender_agent_id,
        }));
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error("Error loading conversation:", err);
    }
  };

  const handleSendMessage = async (content) => {
    if (!content.trim() || isLoading) return;

    const messageData = {
      content: content.trim(),
      sender_name: me?.name || (isInterviewer ? "Interviewer" : "Candidate"),
      sender_type: isInterviewer ? "interviewer" : "candidate",
      sender_user_id: userId,
    };

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/interviews/${interviewId}/messages`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const sentMessage = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          id: sentMessage.id || Date.now(),
          content: sentMessage.content || messageData.content,
          sender: sentMessage.sender_name || messageData.sender_name,
          timestamp: sentMessage.created_at || new Date().toISOString(),
          type: sentMessage.sender_type || messageData.sender_type,
          userId: sentMessage.sender_user_id || messageData.sender_user_id,
        },
      ]);
    } catch (err) {
      console.error("Error sending message:", err);
      setIsLoading(false);
    }
  };

  const handleInterviewerResponse = async (content) => {
    if (!content.trim() || isLoading) return;

    const messageData = {
      content: content.trim(),
      sender_name: me?.name || "Interviewer",
      sender_type: "interviewer",
      sender_user_id: userId,
    };

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/interviews/${interviewId}/interviewer-response`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error("Failed to send response");
      }

      const sentMessage = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          id: sentMessage.id || Date.now(),
          content: sentMessage.content || messageData.content,
          sender: sentMessage.sender_name || messageData.sender_name,
          timestamp: sentMessage.created_at || new Date().toISOString(),
          type: sentMessage.sender_type || messageData.sender_type,
          userId: sentMessage.sender_user_id || messageData.sender_user_id,
        },
      ]);
      setIsLoading(false);
    } catch (err) {
      console.error("Error sending interviewer response:", err);
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4 dark:bg-gray-25/40">
        <MenteeLoader size={52} text="Loading interview room…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4 dark:bg-gray-25/40">
        <div className="bg-surface border border-line rounded-2xl shadow-s15 p-8 max-w-md w-full text-center dark:bg-gray-25/60">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h2 className="text-base font-bold text-ink mb-1.5">
            Access denied
          </h2>
          <p className="text-xs text-secondary mb-5 leading-relaxed">{error}</p>
          <button
            onClick={() => {
              const confirmLeave = window.confirm(
                "Are you sure you want to leave the interview? Your progress may not be saved."
              );
              if (confirmLeave) {
                navigate("/feed");
              }
            }}
            className="px-5 py-2.5 bg-brand text-white text-xs font-semibold rounded-xl shadow-s5 hover:bg-brand/90 transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Return to dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  const isInterviewReady = () => {
    if (!interview) return false;
    const now = new Date();
    const scheduledTime = parseUTC(interview.scheduled_at_iso || interview.scheduled_at);
    const timeDiff = scheduledTime - now;
    const minutesDiff = timeDiff / (1000 * 60);
    return minutesDiff <= 0;
  };

  const renderWaitingRoom = () => {
    const now = new Date();
    const scheduledTime = parseUTC(interview.scheduled_at_iso || interview.scheduled_at);
    const timeDiff = scheduledTime - now;
    const minutesDiff = Math.ceil(timeDiff / (1000 * 60));

    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4 dark:bg-gray-25/40">
        <div className="bg-surface border border-line rounded-2xl shadow-s15 p-6 sm:p-8 max-w-md w-full text-center space-y-4 dark:bg-gray-25/60">
          <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand-text flex items-center justify-center mx-auto dark:bg-brand/15">
            <Clock className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink leading-snug">
              Interview waiting room
            </h2>
            <p className="text-xs text-secondary mt-1 leading-relaxed">
              {minutesDiff > 0
                ? `Your interview starts in ${minutesDiff} minute${minutesDiff !== 1 ? "s" : ""}. You can join exactly at the scheduled time.`
                : "Your interview is ready to begin. Join the session below."}
            </p>
          </div>

          <div className="rounded-xl border border-line bg-canvas p-4 space-y-2.5 text-xs text-secondary text-left dark:bg-gray-25/50">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-text shrink-0" strokeWidth={1.75} />
              <div>
                <DualTime
                  value={interview.scheduled_at_iso || interview.scheduled_at}
                  others={[
                    { timezone: interview.organization_timezone, label: interview.organization },
                    { timezone: interview.candidate_timezone, label: interview.user_name },
                  ]}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-text shrink-0" strokeWidth={1.75} />
              <span>Duration: <span className="font-mono">{interview.duration_minutes}</span> minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-brand-text shrink-0" strokeWidth={1.75} />
              <span className="capitalize">
                Type: {interview.interview_type === "text" ? "Text chat" : interview.interview_type?.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <div className="pt-2">
            {minutesDiff <= 0 ? (
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2.5 bg-brand text-white text-xs font-semibold rounded-xl shadow-s5 hover:bg-brand/90 transition-colors animate-pulse"
              >
                Join interview now
              </button>
            ) : (
              <div className="bg-brand/10 text-brand-text border border-brand/20 px-4 py-2.5 rounded-xl text-xs font-semibold dark:bg-brand/15 dark:border-brand/30">
                Waiting for interview to begin…
              </div>
            )}
          </div>

          <button
            onClick={() => {
              const confirmLeave = window.confirm(
                "Are you sure you want to leave the interview? Your progress may not be saved."
              );
              if (confirmLeave) {
                navigate("/feed");
              }
            }}
            className="w-full px-4 py-2.5 border border-line bg-surface text-ink text-xs font-semibold rounded-xl shadow-s5 hover:bg-gray-100 dark:hover:bg-gray-25 dark:bg-gray-25/50 transition-colors"
          >
            Return to dashboard
          </button>
        </div>
      </div>
    );
  };

  const renderInterview = () => {
    if (!isInterviewReady()) {
      return renderWaitingRoom();
    }

    switch (interview?.interview_type) {
      case "text":
      case "practice":
        return (
          <div className="min-h-screen bg-surface dark:bg-gray-25/40">
            {isInterviewer && (
              <div className="bg-surface border-b border-line px-4 py-3 dark:bg-gray-25/60">
                <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-ink">
                      Interview mode:
                    </span>
                    <div className="flex rounded-xl border border-line overflow-hidden shadow-s5 bg-surface p-0.5 dark:bg-gray-25">
                      <button
                        onClick={() => setInterviewMode("auto")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                          interviewMode === "auto"
                            ? "bg-brand text-white shadow-s5"
                            : "text-ink hover:bg-gray-100 dark:hover:bg-gray-25"
                        }`}
                      >
                        <Cpu className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Auto (AI)</span>
                      </button>
                      <button
                        onClick={() => setInterviewMode("manual")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                          interviewMode === "manual"
                            ? "bg-brand text-white shadow-s5"
                            : "text-ink hover:bg-gray-100 dark:hover:bg-gray-25"
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Manual</span>
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-secondary">
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
              currentThinking={currentThinking}
              showThinking={showThinking}
              setShowThinking={setShowThinking}
            />
          </div>
        );

      case "ai_video":
        return (
          <div className="min-h-screen bg-surface flex items-center justify-center p-4 dark:bg-gray-25/40">
            <div className="bg-surface border border-line rounded-2xl shadow-s15 p-6 sm:p-8 max-w-md w-full text-center dark:bg-gray-25/60">
              <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand-text flex items-center justify-center mx-auto mb-3 dark:bg-brand/15">
                <Cpu className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h2 className="text-base font-bold text-ink mb-1">
                AI video interview
              </h2>
              <p className="text-xs text-secondary mb-5 leading-relaxed">
                Coming soon. This feature is actively under development. Please utilize text-based interviews for current sessions.
              </p>
              <button
                onClick={() => navigate("/feed")}
                className="px-5 py-2.5 bg-brand text-white text-xs font-semibold rounded-xl hover:bg-brand/90 transition-colors shadow-s5"
              >
                Return to dashboard
              </button>
            </div>
          </div>
        );

      case "video":
      case "human_video":
        if (!VIDEO_ENABLED) {
          return (
            <div className="min-h-screen bg-surface flex items-center justify-center p-4 dark:bg-gray-25/40">
              <div className="bg-surface border border-line rounded-2xl shadow-s15 p-6 sm:p-8 max-w-md w-full text-center dark:bg-gray-25/60">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center mx-auto mb-3">
                  <Video className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <h2 className="text-base font-bold text-ink mb-1">Video interviews are disabled</h2>
                <p className="text-xs text-secondary mb-5 leading-relaxed">
                  Video interviews are not enabled during this phase of the beta. Please use text or AI interviews instead.
                </p>
                <button
                  onClick={() => navigate("/feed")}
                  className="px-5 py-2.5 bg-brand text-white text-xs font-semibold rounded-xl hover:bg-brand/90 transition-colors shadow-s5"
                >
                  Return to dashboard
                </button>
              </div>
            </div>
          );
        }
        return (
          <Suspense fallback={
            <div className="min-h-screen bg-surface flex items-center justify-center p-4 dark:bg-gray-25/40">
              <MenteeLoader size={56} text="Loading video room…" />
            </div>
          }>
            <VideoRoom interviewId={interviewId} interview={interview} onLeave={() => navigate(`/in/interviews/${interviewId}`)} />
          </Suspense>
        );

      default:
        return (
          <div className="min-h-screen bg-surface flex items-center justify-center p-4 dark:bg-gray-25/40">
            <div className="bg-surface border border-line rounded-2xl shadow-s15 p-6 sm:p-8 max-w-md w-full text-center dark:bg-gray-25/60">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center mx-auto mb-3">
                <HelpCircle className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h2 className="text-base font-bold text-ink mb-1">
                Unknown interview type
              </h2>
              <p className="text-xs text-secondary mb-5 leading-relaxed">
                This interview type is not supported. Please check with your organizer.
              </p>
              <button
                onClick={() => navigate("/feed")}
                className="px-5 py-2.5 bg-brand text-white text-xs font-semibold rounded-xl hover:bg-brand/90 transition-colors shadow-s5"
              >
                Return to dashboard
              </button>
            </div>
          </div>
        );
    }
  };

  return <div className="min-h-screen bg-surface dark:bg-gray-25/40">{renderInterview()}</div>;
};

export default InterviewRoom;

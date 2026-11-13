import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Cpu,
  Star,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  RotateCw,
  Send,
  ArrowLeft,
  Video,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { AppShell, CenterBar } from "../../components/layout/AppShell";
import MenteeLoader from "../../components/ui/MenteeLoader";
import DualTime from "../../components/ui/DualTime";
import { getBackendUrl, getAuthHeaders } from "../../utils/auth";

const Card = ({ children, className = "" }) => (
  <div className={`rounded-xl border border-line bg-surface shadow-s5 dark:bg-gray-25/60 ${className}`}>
    {children}
  </div>
);

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
    if (!interviewId || !/^\d+$/.test(String(interviewId))) {
      setError("Interview not found. The link looks invalid.");
      setLoading(false);
      return;
    }
    const fetchInterview = async () => {
      try {
        const response = await fetch(
          `${getBackendUrl()}/api/interviews/${interviewId}`,
          {
            headers: getAuthHeaders(),
            credentials: "include",
          }
        );

        if (response.status === 404) {
          throw new Error("Interview not found. It may have been deleted.");
        }
        if (response.status === 403) {
          throw new Error("You don't have access to this interview.");
        }
        if (response.status === 401) {
          throw new Error("Please log in to view this interview.");
        }
        if (!response.ok) {
          throw new Error("Failed to fetch interview details");
        }

        const data = await response.json();
        setInterview(data);
      } catch (err) {
        console.error("Error fetching interview:", err);
        if (err instanceof TypeError && /fetch/i.test(err.message)) {
          setError("Network error. Couldn't reach the server. Check your connection and try again.");
        } else {
          setError(err.message);
        }
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
    } catch {
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
    } catch {
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
      } catch {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch {
      setChatError("Failed to load chat.");
      setChatMessages([]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (!interviewId) return;
    loadConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch {
      setChatError("Unable to send message.");
    } finally {
      setChatSending(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-text dark:border-brand/30 dark:bg-brand/15">
            Completed
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center rounded-full border border-line bg-gray-50 px-2.5 py-0.5 text-[11px] font-semibold text-ink dark:bg-gray-25 dark:text-gray-200">
            In progress
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
            Scheduled
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full border border-line bg-gray-50 px-2.5 py-0.5 text-[11px] font-semibold text-ink dark:bg-gray-25">
            {status ? status.replace(/_/g, " ") : "Unknown"}
          </span>
        );
    }
  };

  const getDecisionBadge = (decision) => {
    switch (decision) {
      case "passed":
        return (
          <span className="inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-text dark:border-brand/30 dark:bg-brand/15">
            Passed
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            Not selected
          </span>
        );
      case "second_round":
        return (
          <span className="inline-flex items-center rounded-full border border-line bg-gray-50 px-2.5 py-0.5 text-[11px] font-semibold text-gray-700 dark:bg-gray-25 dark:text-gray-600">
            Round 2
          </span>
        );
      case "third_round":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-line bg-gray-50 text-gray-700 dark:bg-gray-25 dark:text-gray-600">
            Final round
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <AppShell>
        <CenterBar title="Interview details" />
        <div className="w-full max-w-7xl mx-auto px-4 pb-12 pt-4">
          <div className="flex justify-center items-center py-16">
            <MenteeLoader size={52} text="Loading interview details…" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <CenterBar title="Interview details" />
        <div className="w-full max-w-7xl mx-auto px-4 pb-12 pt-4">
          <div className="rounded-xl border border-red-200 bg-red-50/70 dark:border-red-500/30 dark:bg-red-500/10 p-5 sm:p-6 shadow-s5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">Unable to load interview</h3>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1 leading-relaxed">{error}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button
                onClick={() => navigate("/in/interviews/history")}
                className="rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink shadow-s5 hover:bg-gray-100 dark:hover:bg-gray-25 transition-colors"
              >
                Back to interview history
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-s5 hover:bg-brand/90 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!interview) {
    return (
      <AppShell>
        <CenterBar title="Interview details" />
        <div className="w-full max-w-7xl mx-auto px-4 pb-12 pt-4">
          <div className="rounded-xl border border-line bg-surface p-8 sm:p-10 text-center shadow-s5 dark:bg-gray-25/60">
            <div className="h-12 w-12 rounded-xl bg-canvas border border-line flex items-center justify-center mx-auto mb-3 dark:bg-gray-25">
              <Clock className="h-6 w-6 text-secondary/50" strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-semibold text-ink">Interview not found</h3>
            <p className="mt-1 text-xs text-secondary max-w-md mx-auto leading-relaxed">
              The requested interview could not be found or has expired.
            </p>
            <div className="mt-5">
              <button
                onClick={() => navigate("/in/interviews/history")}
                className="inline-flex justify-center rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-s5 hover:bg-brand/90 transition-colors"
              >
                Back to interview history
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <CenterBar title="Interview details" />
      <div className="w-full max-w-7xl mx-auto px-4 pb-12 pt-4">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-secondary leading-relaxed">
              {interview.organization && `Organized by ${interview.organization}`}
              {interview.post_title && ` · ${interview.post_title}`}
              {!interview.organization && !interview.post_title ? "Review your interview information, analysis, and chat." : null}
            </p>
          </div>
          <div className="flex shrink-0 space-x-3">
            <button
              onClick={() => navigate("/in/interviews/history")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink shadow-s5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-25"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-secondary" strokeWidth={1.75} />
              <span>Back to history</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interview Overview */}
            <Card>
              <div className="p-5 sm:p-6">
                <div>
                  <h2 className="break-words text-xl font-semibold text-ink sm:text-2xl leading-snug">
                    {interview.title}
                  </h2>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {getStatusBadge(interview.status)}
                    {interview.final_decision && getDecisionBadge(interview.final_decision)}
                  </div>
                  {(interview.interview_type === "video" || interview.interview_type === "human_video") &&
                    (interview.status === "scheduled" || interview.status === "in_progress") && (
                    <div className="mt-4">
                      <button
                        onClick={() => navigate(`/in/interview/${interview.id}`)}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-s5 transition-colors hover:bg-brand/90"
                      >
                        <Play className="h-3.5 w-3.5" strokeWidth={1.75} />
                        <span>Join interview</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Metadata Row */}
                <div className="mt-5 grid grid-cols-1 gap-4 border-t border-line pt-5 sm:grid-cols-2 sm:gap-6">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-secondary">
                      Scheduled
                    </p>
                    <div className="mt-1 text-sm font-semibold text-ink">
                      {interview.scheduled_at_iso || interview.scheduled_at ? (
                        <DualTime
                          value={interview.scheduled_at_iso || interview.scheduled_at}
                          otherTimezone={interview.organization_timezone}
                          otherLabel={interview.organization}
                        />
                      ) : (
                        <span className="text-secondary/60">Date not set</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-secondary">
                      Duration
                    </p>
                    <p className="mt-1 text-sm font-semibold font-mono text-ink">
                      {interview.duration_minutes ? `${interview.duration_minutes} minutes` : "60 minutes"}
                    </p>
                  </div>
                </div>

                {interview.feedback && (
                  <div id="overall-feedback-section" className="mt-6 border-t border-line pt-5">
                    <h3 className="text-sm font-semibold text-ink mb-2">
                      Overall feedback
                    </h3>
                    <div className="rounded-xl border border-line bg-canvas p-4 dark:bg-gray-25/50">
                      <p className="text-sm text-secondary leading-relaxed">
                        {interview.feedback}
                      </p>
                    </div>
                  </div>
                )}

                {interview.recording_url && (
                  <div className="mt-6 border-t border-line pt-5">
                    <h3 className="text-sm font-semibold text-ink mb-2 flex items-center gap-2">
                      <Video className="h-4 w-4 text-brand-text" strokeWidth={1.75} />
                      <span>Recording</span>
                    </h3>
                    <video
                      controls
                      preload="metadata"
                      src={`${interview.recording_url.startsWith("http") ? "" : getBackendUrl()}${interview.recording_url}`}
                      className="w-full rounded-xl bg-black max-h-[440px] border border-line"
                    />
                    <p className="text-xs text-secondary mt-1.5 leading-relaxed">
                      Recorded session · visible only to participants and hiring managers.
                    </p>
                  </div>
                )}

                {interview.strengths && interview.strengths.length > 0 && (
                  <div className="mt-6 border-t border-line pt-5">
                    <h3 className="text-sm font-semibold text-ink mb-2">
                      Key strengths
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {interview.strengths.map((strength, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400"
                        >
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {interview.improvements && interview.improvements.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-ink mb-2">
                      Areas for improvement
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {interview.improvements.map((improvement, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400"
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
            {interview.decision_history && interview.decision_history.length > 0 && (
              <Card>
                <div className="p-5 sm:p-6">
                  <h2 className="text-base font-semibold text-ink mb-4">
                    Interview rounds
                  </h2>
                  <div className="space-y-4">
                    {interview.decision_history
                      .sort((a, b) => a.round_number - b.round_number)
                      .map((round) => (
                        <div
                          key={round.id}
                          className="border-l-2 border-brand pl-4 py-1.5 rounded-r-xl"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h3 className="text-sm font-semibold text-ink">
                                Round {round.round_number}
                              </h3>
                              <p className="text-xs text-secondary mt-0.5">
                                {round.decided_at ? (
                                  <DualTime value={round.decided_at} variant="compact" showRelative={false} />
                                ) : (
                                  "Date not available"
                                )}
                              </p>
                            </div>
                            <div>{round.decision && getDecisionBadge(round.decision)}</div>
                          </div>

                          {round.feedback && (
                            <div className="mt-2.5">
                              <h4 className="text-xs font-medium uppercase tracking-wider text-secondary">
                                Feedback
                              </h4>
                              <p className="text-xs text-ink mt-1 leading-relaxed">
                                {round.feedback}
                              </p>
                            </div>
                          )}

                          {round.rating && (
                            <div className="mt-2.5">
                              <h4 className="text-xs font-medium uppercase tracking-wider text-secondary">
                                Rating
                              </h4>
                              <div className="flex items-center gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3.5 w-3.5 ${
                                      star <= round.rating
                                        ? "fill-amber-500 text-amber-500"
                                        : "text-gray-300 dark:text-gray-600"
                                    }`}
                                    strokeWidth={1.75}
                                  />
                                ))}
                                <span className="ml-1 text-xs font-mono font-semibold text-ink">
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
                <div className="p-5 sm:p-6">
                  <h2 className="text-base font-semibold text-ink mb-3">
                    Performance analysis
                  </h2>
                  <div className="text-xs text-ink whitespace-pre-line leading-relaxed">
                    {interview.analysis_data}
                  </div>
                </div>
              </Card>
            )}

            {interview.status === "completed" && (
              <Card>
                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-ink">
                      Interview analysis
                    </h2>
                    {analysis && (
                      <button
                        onClick={() => navigate(`/in/interviews/${interviewId}/analysis`)}
                        className="text-xs font-semibold text-brand-text hover:text-brand-text hover:underline"
                      >
                        View full analysis
                      </button>
                    )}
                  </div>

                  {analysisError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-800/60 dark:text-red-300 rounded-xl text-xs">
                      {analysisError}
                    </div>
                  )}

                  {analysisLoading ? (
                    <div className="text-xs text-secondary py-4 text-center">
                      Loading analysis…
                    </div>
                  ) : analysis ? (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-line bg-gray-50/70 p-4 dark:bg-gray-25/50">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg bg-brand/10 text-brand-text flex items-center justify-center shrink-0 mt-0.5">
                            <Cpu className="h-4 w-4" strokeWidth={1.75} />
                          </div>
                          <div>
                            <p className="text-xs text-ink leading-relaxed">
                              {analysis.ai_analysis_summary}
                            </p>
                            <div className="mt-2 text-[11px] text-secondary">
                              Analyzed by: <span className="font-medium text-ink">{analysis.analyzed_by}</span>
                              {analysis.analysis_method ? ` · Method: ${analysis.analysis_method}` : ""}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="mb-3 flex justify-center">
                        <BarChart3 className="h-8 w-8 text-secondary/40" strokeWidth={1.5} />
                      </div>
                      <div className="text-xs text-secondary mb-4">
                        No analysis available yet.
                      </div>
                      <button
                        onClick={generateAnalysis}
                        disabled={analysisGenerating}
                        className="rounded-xl bg-brand px-5 py-2.5 text-xs font-semibold text-white shadow-s5 hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {analysisGenerating ? "Generating…" : "Generate analysis"}
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Chat section */}
            <Card>
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-ink">Chat</h2>
                  <button
                    onClick={loadConversation}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text hover:text-brand-text transition-colors"
                    disabled={chatLoading}
                  >
                    <RotateCw className={`h-3.5 w-3.5 ${chatLoading ? "animate-spin" : ""}`} strokeWidth={1.75} />
                    <span>Refresh</span>
                  </button>
                </div>

                {chatError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-800/60 dark:text-red-300 rounded-xl text-xs">
                    {chatError}
                  </div>
                )}

                <div className="h-80 overflow-y-auto rounded-xl border border-line bg-canvas p-4 dark:bg-gray-25/40">
                  {chatLoading ? (
                    <div className="text-xs text-secondary text-center py-8">Loading chat…</div>
                  ) : chatMessages.length === 0 ? (
                    <div className="text-xs text-secondary text-center py-8">
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
                            className={`flex ${alignRight ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs shadow-s5 leading-relaxed ${
                                alignRight
                                  ? "bg-brand text-white rounded-br-sm"
                                  : "bg-surface text-ink border border-line rounded-bl-sm dark:bg-gray-25"
                              }`}
                            >
                              <div className="whitespace-pre-wrap break-words">
                                {msg.content}
                              </div>
                              <div
                                className={`mt-1 text-[11px] ${
                                  alignRight ? "text-white/80 text-right" : "text-secondary"
                                }`}
                              >
                                {msg.sender_name}
                                {msg.created_at ? (
                                  <>
                                    {" "}· <DualTime value={msg.created_at} variant="compact" showRelative={false} />
                                  </>
                                ) : (
                                  ""
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>

                <div className="mt-3.5 flex gap-2">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message…"
                    className="flex-1 resize-none rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink outline-none transition-colors placeholder:text-secondary/50 focus:border-brand focus:ring-2 focus:ring-brand/20 dark:bg-gray-25/50"
                    rows={2}
                    disabled={chatSending}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={chatSending || !chatInput.trim()}
                    className="self-end rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-s5 hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Logistics */}
            <Card>
              <div className="p-5 sm:p-6">
                <h2 className="text-base font-semibold text-ink mb-4">
                  Logistics
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-wider text-secondary">
                      Interview type
                    </h3>
                    <p className="mt-1 text-sm font-medium text-ink capitalize">
                      {interview.interview_type?.replace(/_/g, " ") || "Not specified"}
                    </p>
                  </div>

                  {interview.location && (
                    <div>
                      <h3 className="text-xs font-medium uppercase tracking-wider text-secondary">
                        Location
                      </h3>
                      <p className="mt-1 text-sm font-medium text-ink flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-secondary shrink-0" strokeWidth={1.75} />
                        <span>{interview.location}</span>
                      </p>
                    </div>
                  )}

                  {(interview.meeting_link || interview.room_id) && (
                    <div>
                      <h3 className="text-xs font-medium uppercase tracking-wider text-secondary">
                        Meeting information
                      </h3>
                      {interview.meeting_link && (
                        <a
                          href={interview.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand-text hover:text-brand-text hover:underline"
                        >
                          <span>Join meeting</span>
                          <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
                        </a>
                      )}
                      {interview.room_id && (
                        <p className="mt-1 text-sm font-mono text-ink">
                          Room ID: {interview.room_id}
                          {interview.room_password && (
                            <span className="ml-2 text-secondary font-sans">
                              (Password: {interview.room_password})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  {Array.isArray(interview.interviewers) && interview.interviewers.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium uppercase tracking-wider text-secondary">
                        {interview.interviewers.length > 1 ? "Interviewers" : "Interviewer"}
                      </h3>
                      <ul className="mt-1 space-y-1">
                        {interview.interviewers.map((interviewer, index) => (
                          <li key={index} className="text-sm font-medium text-ink">
                            {typeof interviewer === "string"
                              ? interviewer
                              : interviewer.name || `Interviewer ${index + 1}`}
                            {interviewer && interviewer.role && (
                              <span className="text-secondary ml-2 font-normal">
                                ({interviewer.role})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {typeof interview.interviewers === "string" && interview.interviewers.trim() !== "" && (
                    <div>
                      <h3 className="text-xs font-medium uppercase tracking-wider text-secondary">
                        Interviewer
                      </h3>
                      <p className="text-sm font-medium text-ink mt-1">
                        {interview.interviewers}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Next Steps */}
            <Card>
              <div className="p-5 sm:p-6">
                <h2 className="text-base font-semibold text-ink mb-4">
                  Next steps
                </h2>
                {interview.final_decision === "passed" ? (
                  <div className="rounded-xl border border-brand/20 bg-brand/10 dark:border-brand/30 dark:bg-brand/15 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-brand-text shrink-0 mt-0.5" strokeWidth={1.75} />
                      <div>
                        <p className="text-xs text-brand-text font-medium leading-relaxed">
                          <span className="font-bold">Congratulations!</span> You've successfully passed this interview round.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => navigate("/feed")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-s5 hover:bg-brand/90 transition-colors"
                      >
                        Browse opportunities
                      </button>
                    </div>
                  </div>
                ) : interview.final_decision === "failed" ? (
                  <div className="rounded-xl border border-line bg-canvas p-4 dark:bg-gray-25/50">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" strokeWidth={1.75} />
                      <div>
                        <p className="text-xs text-ink leading-relaxed">
                          <span className="font-semibold">Thank you</span> for participating in our interview process.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          const fb = document.getElementById("overall-feedback-section");
                          if (fb) fb.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="inline-flex items-center rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink shadow-s5 hover:bg-gray-100 dark:hover:bg-gray-25 dark:bg-gray-25/50 transition-colors"
                      >
                        View feedback
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/feed")}
                        className="inline-flex items-center rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-s5 hover:bg-brand/90 transition-colors"
                      >
                        Find other opportunities
                      </button>
                    </div>
                  </div>
                ) : interview.final_decision === "second_round" ||
                  interview.final_decision === "third_round" ? (
                  <div className="rounded-xl border border-line bg-canvas p-4 dark:bg-gray-25/50">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-brand-text shrink-0 mt-0.5" strokeWidth={1.75} />
                      <div>
                        <p className="text-xs text-ink leading-relaxed">
                          <span className="font-semibold">Great job!</span> You've been selected for the next round of interviews.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => navigate("/in/interviews")}
                        className="inline-flex items-center rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-s5 hover:bg-brand/90 transition-colors"
                      >
                        View interview schedule
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-secondary leading-relaxed">
                    No next steps available at this time.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

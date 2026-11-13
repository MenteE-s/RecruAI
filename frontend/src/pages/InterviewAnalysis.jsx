import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppShell, CenterBar } from "../components/layout/AppShell";
import { OrgAppShell } from "../components/layout/OrgAppShell";
import { getBackendUrl, getAuthHeaders } from "../utils/auth";
import DualTime from "../components/ui/DualTime";
import MenteeLoader from "../components/ui/MenteeLoader";
import {
  Clock,
  Video,
  Briefcase,
  CheckCircle2,
  Check,
  ArrowRight,
  TrendingUp,
  Cpu,
  BarChart3,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";

const AnalysisCard = ({ children, className = "" }) => (
  <div className={`rounded-xl border border-line bg-surface p-5 sm:p-6 shadow-s5 dark:bg-gray-25/60 ${className}`}>
    {children}
  </div>
);

export default function InterviewAnalysis() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);

  const hasValidAnalysis =
    analysis &&
    typeof analysis.overall_score === "number" &&
    typeof analysis.communication_score === "number";

  const userRole = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;

  useEffect(() => {
    if (interviewId) {
      fetchInterviewData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  const fetchInterviewData = async () => {
    try {
      setLoading(true);

      const interviewResponse = await fetch(
        `${getBackendUrl()}/api/interviews/${interviewId}`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!interviewResponse.ok) {
        throw new Error("Failed to fetch interview");
      }

      const interviewData = await interviewResponse.json();
      setInterview(interviewData);

      if (interviewData.status === "completed") {
        try {
          const analysisResponse = await fetch(
            `${getBackendUrl()}/api/interviews/${interviewId}/analysis`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          );

          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            if (analysisData && !analysisData.error) {
              setAnalysis(analysisData);
            } else {
              setAnalysis(null);
            }
          }
        } catch {
          console.log("Analysis not available yet");
        }
      }

      const conversationResponse = await fetch(
        `${getBackendUrl()}/api/interviews/${interviewId}/conversation`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (conversationResponse.ok) {
        const conversationData = await conversationResponse.json();
        const transcript = (conversationData?.conversation || []).map((m) => ({
          id: m.id,
          content: m.content,
          message_type: m.sender_type === "agent" ? "ai_response" : "user",
          created_at: m.created_at,
          user: {
            name: m.sender_name || (m.sender_type === "agent" ? "AI" : "User"),
          },
        }));
        setMessages(transcript);
      }
    } catch (err) {
      console.error("Error fetching interview data:", err);
      setError("Failed to load interview analysis");
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async () => {
    if (!interview || interview.status !== "completed") return;

    setGeneratingAnalysis(true);
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/interviews/${interviewId}/analyze?force=true`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          credentials: "include",
        }
      );

      if (response.ok) {
        const result = await response.json();
        setAnalysis(result.analysis);
      } else {
        throw new Error("Failed to generate analysis");
      }
    } catch (err) {
      console.error("Error generating analysis:", err);
      setError("Failed to generate analysis");
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 85) return "bg-brand/10 text-brand-text border-brand/20 dark:border-brand/30 dark:bg-brand/15";
    if (score >= 70) return "bg-brand/10 text-brand-text border-brand/20 dark:bg-brand/15 dark:text-brand-text dark:border-brand/30";
    if (score >= 55) return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60";
    return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60";
  };

  const getScoreBarClass = (score) => {
    if (score >= 85) return "bg-brand";
    if (score >= 70) return "bg-brand dark:bg-brand";
    if (score >= 55) return "bg-amber-500";
    return "bg-red-500";
  };

  const pageTitle = (
    <div className="flex items-center gap-2 min-w-0">
      <button
        onClick={() => navigate(userRole === "organization" ? "/org/interviews" : `/in/interviews/${interviewId}`)}
        className="p-1 -ml-1 text-secondary hover:text-ink hover:bg-gray-100 dark:hover:bg-gray-25 rounded-lg transition-colors"
        aria-label="Back"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <div className="min-w-0">
        <h1 className="text-sm font-semibold text-ink truncate leading-tight">Interview analysis</h1>
        {interview?.title && (
          <p className="text-[11px] text-secondary truncate mt-0.5">{interview.title}</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    const loadingContent = (
      <div className="flex justify-center items-center py-16">
        <MenteeLoader size={52} text="Loading interview analysis…" />
      </div>
    );
    if (userRole === "organization") {
      return <OrgAppShell title={pageTitle}>{loadingContent}</OrgAppShell>;
    }
    return (
      <AppShell>
        <CenterBar title={pageTitle} />
        {loadingContent}
      </AppShell>
    );
  }

  if (error || !interview) {
    const errorContent = (
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-surface border border-line rounded-2xl p-8 text-center shadow-s5 dark:bg-gray-25/60">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h2 className="text-base font-bold text-ink mb-1.5">
            {error || "Interview not found"}
          </h2>
          <p className="text-xs text-secondary max-w-sm mx-auto mb-5 leading-relaxed">
            We couldn't retrieve the analysis for this session. It may have been removed or the link is invalid.
          </p>
          <button
            onClick={() => navigate(userRole === "organization" ? "/org/interviews" : "/in/interviews")}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-semibold rounded-xl shadow-s5 hover:bg-brand/90 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Return to interviews</span>
          </button>
        </div>
      </div>
    );
    if (userRole === "organization") {
      return <OrgAppShell title={pageTitle}>{errorContent}</OrgAppShell>;
    }
    return (
      <AppShell>
        <CenterBar title={pageTitle} />
        {errorContent}
      </AppShell>
    );
  }

  const statusBadge = () => {
    if (interview.status === "completed") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand/10 text-brand-text border border-brand/20 dark:border-brand/30 dark:bg-brand/15">
          <CheckCircle2 className="w-3 h-3" strokeWidth={1.75} />
          <span>Completed</span>
        </span>
      );
    }
    if (interview.status === "cancelled") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60">
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
        {interview.status ? interview.status.replace(/_/g, " ") : "Scheduled"}
      </span>
    );
  };

  const mainContent = (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">
      {/* Header Card */}
      <AnalysisCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink leading-snug">{interview.title}</h2>
            {interview.post_title && (
              <p className="text-xs text-brand-text font-medium flex items-center gap-1.5 mt-1.5">
                <Briefcase className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                <span>{interview.post_title}</span>
              </p>
            )}
            {interview.organization && (
              <p className="text-xs text-secondary mt-1">
                Organization: <span className="text-ink font-medium">{interview.organization}</span>
                {interview.user_name ? ` · Candidate: ${interview.user_name}` : ""}
              </p>
            )}
          </div>
          <div>{statusBadge()}</div>
        </div>
      </AnalysisCard>

      {/* Interview Overview */}
      <AnalysisCard>
        <h2 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Interview overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          <div className="rounded-xl border border-line bg-surface p-3 dark:bg-gray-25/50">
            <div className="text-[11px] font-medium text-secondary flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-secondary/70" strokeWidth={1.75} />
              <span>Date &amp; time</span>
            </div>
            <div className="text-xs font-semibold text-ink">
              <DualTime
                value={interview.scheduled_at_iso || interview.scheduled_at}
                others={[
                  { timezone: interview.organization_timezone, label: interview.organization },
                  { timezone: interview.candidate_timezone, label: interview.user_name },
                ]}
              />
            </div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-3 dark:bg-gray-25/50">
            <div className="text-[11px] font-medium text-secondary flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-secondary/70" strokeWidth={1.75} />
              <span>Duration</span>
            </div>
            <div className="text-xs font-semibold font-mono text-ink">
              {interview.duration_minutes} minutes
            </div>
          </div>
          <div className="rounded-xl border border-line bg-surface p-3 dark:bg-gray-25/50">
            <div className="text-[11px] font-medium text-secondary flex items-center gap-1 mb-1">
              <Video className="w-3 h-3 text-secondary/70" strokeWidth={1.75} />
              <span>Type</span>
            </div>
            <div className="text-xs font-semibold text-ink capitalize">
              {interview.interview_type ? interview.interview_type.replace(/_/g, " ") : "Standard"} interview
            </div>
          </div>
          {interview.recording_url && (
            <div className="sm:col-span-3 mt-1">
              <div className="text-xs font-medium text-secondary mb-1.5 flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-secondary/70" strokeWidth={1.75} />
                <span>Recording</span>
              </div>
              <video
                controls
                preload="metadata"
                src={`${interview.recording_url.startsWith("http") ? "" : getBackendUrl()}${interview.recording_url}`}
                className="w-full rounded-xl bg-black max-h-[440px] border border-line shadow-s5"
              />
            </div>
          )}
        </div>
      </AnalysisCard>

      {/* Analysis Section */}
      {interview.status !== "completed" ? (
        <AnalysisCard className="text-center py-10">
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h3 className="text-sm font-bold text-ink mb-1">
            Analysis not available yet
          </h3>
          <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
            This interview must be marked as <span className="font-semibold text-ink">completed</span> before
            performance insights can be generated.
          </p>
        </AnalysisCard>
      ) : !hasValidAnalysis ? (
        <AnalysisCard className="text-center py-10">
          <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand-text flex items-center justify-center mx-auto mb-3 dark:bg-brand/15">
            <BarChart3 className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h3 className="text-sm font-bold text-ink mb-1">
            Analysis not generated
          </h3>
          <p className="text-xs text-secondary max-w-sm mx-auto mb-4 leading-relaxed">
            Generate AI-powered insights to review performance scores, response metrics, and tailored recommendations.
          </p>
          <button
            onClick={generateAnalysis}
            disabled={generatingAnalysis}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-xs font-semibold rounded-xl hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-s5"
          >
            {generatingAnalysis ? (
              <>
                <MenteeLoader size={16} text={null} inline />
                <span>Generating analysis…</span>
              </>
            ) : (
              <>
                <Cpu className="h-4 w-4" strokeWidth={1.75} />
                <span>Generate analysis</span>
              </>
            )}
          </button>
        </AnalysisCard>
      ) : (
        <>
          {/* Performance Scores */}
          <AnalysisCard>
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider mb-4">
              Performance scores
            </h2>
            <div className="space-y-3.5">
              {[
                { label: "Overall performance", score: analysis.overall_score, key: "overall" },
                { label: "Communication", score: analysis.communication_score, key: "communication" },
                { label: "Technical skills", score: analysis.technical_score, key: "technical" },
                { label: "Problem solving", score: analysis.problem_solving_score, key: "problem_solving" },
                { label: "Cultural fit", score: analysis.cultural_fit_score, key: "cultural_fit" },
              ].map((item) => (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink">{item.label}</span>
                    <span className={`font-bold font-mono px-2 py-0.5 rounded-full border text-[11px] ${getScoreBadgeClass(item.score)}`}>
                      {item.score}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getScoreBarClass(item.score)}`}
                      style={{ width: `${Math.min(Math.max(item.score, 4), 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </AnalysisCard>

          {/* AI Analysis Summary */}
          <AnalysisCard>
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">
              AI analysis summary
            </h2>
            <div className="rounded-xl border border-line bg-brand/5 dark:bg-brand/10 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand-text flex items-center justify-center shrink-0 mt-0.5 dark:bg-brand/15">
                  <Cpu className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink leading-relaxed">
                    {analysis.ai_analysis_summary}
                  </p>
                  <p className="mt-2 text-[11px] text-secondary">
                    Analyzed by: <span className="text-ink font-medium">{analysis.analyzed_by}</span>
                    {analysis.analysis_method ? ` · Method: ${analysis.analysis_method}` : ""}
                  </p>
                </div>
              </div>
            </div>
          </AnalysisCard>

          {/* Strengths and Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnalysisCard>
              <h2 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Key strengths</span>
              </h2>
              <div className="space-y-2.5">
                {analysis.strengths && analysis.strengths.length > 0 ? (
                  analysis.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-brand-text shrink-0 mt-0.5" strokeWidth={1.75} />
                      <span className="text-ink leading-relaxed">{strength}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-secondary italic">No strengths identified</p>
                )}
              </div>
            </AnalysisCard>

            <AnalysisCard>
              <h2 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Areas for improvement</span>
              </h2>
              <div className="space-y-2.5">
                {analysis.improvements && analysis.improvements.length > 0 ? (
                  analysis.improvements.map((improvement, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs">
                      <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" strokeWidth={1.75} />
                      <span className="text-ink leading-relaxed">{improvement}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-secondary italic">No improvements suggested</p>
                )}
              </div>
            </AnalysisCard>
          </div>

          {/* Interview Metrics */}
          <AnalysisCard>
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider mb-4">
              Interview metrics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-line bg-surface p-3.5 text-center dark:bg-gray-25/50">
                <div className="text-2xl font-extrabold font-mono text-ink">
                  {analysis.actual_duration_minutes || interview.duration_minutes}
                </div>
                <div className="text-[11px] font-medium text-secondary mt-1">
                  Duration (minutes)
                </div>
              </div>
              <div className="rounded-xl border border-line bg-surface p-3.5 text-center dark:bg-gray-25/50">
                <div className="text-2xl font-extrabold font-mono text-brand-text">
                  {analysis.average_response_time_seconds
                    ? `${analysis.average_response_time_seconds}s`
                    : "—"}
                </div>
                <div className="text-[11px] font-medium text-secondary mt-1">
                  Average response time
                </div>
              </div>
              <div className="rounded-xl border border-line bg-surface p-3.5 text-center dark:bg-gray-25/50">
                <div className="text-2xl font-extrabold font-mono text-ink">
                  {analysis.question_count || "—"}
                </div>
                <div className="text-[11px] font-medium text-secondary mt-1">
                  Questions asked
                </div>
              </div>
            </div>
          </AnalysisCard>

          {/* Detailed Feedback */}
          {analysis.detailed_feedback && (
            <AnalysisCard>
              <h2 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">
                Detailed feedback
              </h2>
              <div className="rounded-xl border border-line bg-surface p-4 dark:bg-gray-25/50">
                <p className="text-xs text-ink leading-relaxed whitespace-pre-line">
                  {analysis.detailed_feedback}
                </p>
              </div>
            </AnalysisCard>
          )}

          {/* Conversation Transcript */}
          <AnalysisCard>
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-brand-text" strokeWidth={1.75} />
              <span>Conversation transcript</span>
            </h2>
            <div className="rounded-xl border border-line bg-surface p-3 max-h-96 overflow-y-auto space-y-3 dark:bg-gray-25/50">
              {messages.length === 0 ? (
                <p className="text-xs text-secondary py-3 text-center">No transcript available.</p>
              ) : (
                messages.map((message, index) => (
                  <div key={message.id || index} className="flex gap-2 text-xs">
                    <div className="w-16 font-semibold text-secondary shrink-0 truncate">
                      {message.user?.name || "AI"}:
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`inline-block px-3 py-2 rounded-xl text-xs leading-relaxed ${
                          message.message_type === "ai_response"
                            ? "bg-brand/10 text-ink border border-brand/20 dark:border-brand/30 dark:bg-brand/15"
                            : "bg-gray-100 dark:bg-gray-800 text-ink border border-line"
                        }`}
                      >
                        {message.content}
                      </div>
                      <div className="text-[10px] text-secondary mt-0.5">
                        <DualTime value={message.created_at} variant="compact" showRelative={false} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </AnalysisCard>
        </>
      )}

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-4 pb-8">
        <button
          onClick={() => navigate(userRole === "organization" ? "/org/interviews" : `/in/interviews/${interviewId}`)}
          className="px-4 py-2 border border-line bg-surface text-ink text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-25 dark:bg-gray-25/50 rounded-xl transition-colors shadow-s5"
        >
          Back to details
        </button>
        <button
          onClick={() => navigate("/feed")}
          className="px-4 py-2 border border-line bg-surface text-ink text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-25 dark:bg-gray-25/50 rounded-xl transition-colors shadow-s5"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );

  if (userRole === "organization") {
    return <OrgAppShell title={pageTitle}>{mainContent}</OrgAppShell>;
  }

  return (
    <AppShell>
      <CenterBar title={pageTitle} />
      {mainContent}
    </AppShell>
  );
}

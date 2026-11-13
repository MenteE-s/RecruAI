import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppShell, CenterBar } from "../../components/layout/AppShell";
import TextInterview from "../../components/interviews/TextInterview";
import MenteeLoader from "../../components/ui/MenteeLoader";
import { getBackendUrl, getAuthHeaders } from "../../utils/auth";
import {
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

export default function PracticeRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState("");
  const [chatError, setChatError] = useState("");

  const conversationUrl = `${getBackendUrl()}/api/interviews/${sessionId}/conversation`;
  const chatUrl = `${getBackendUrl()}/api/interviews/${sessionId}/chat`;

  const load = useCallback(async () => {
    setError("");
    try {
      const [interviewRes, conversationRes] = await Promise.all([
        fetch(`${getBackendUrl()}/api/interviews/${sessionId}`, {
          headers: { ...getAuthHeaders() },
        }),
        fetch(conversationUrl, {
          headers: { ...getAuthHeaders() },
        }),
      ]);

      if (interviewRes.ok) {
        const data = await interviewRes.json();
        setSession(data.interview || data);
      } else {
        setError("Could not load the practice session.");
      }

      if (conversationRes.ok) {
        const data = await conversationRes.json();
        setMessages(Array.isArray(data.conversation) ? data.conversation : []);
      } else {
        setMessages([]);
      }
    } catch (err) {
      setError(err.message || "Could not load the practice session.");
    }
  }, [sessionId, conversationUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSendMessage = useCallback(
    async (message) => {
      if (!message.trim()) return;

      const userMessage = message.trim();
      setIsTyping(true);
      setChatError("");

      try {
        const res = await fetch(chatUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ message: userMessage }),
        });

        if (!res.ok) {
          let detail = "The interviewer could not respond right now.";
          try {
            const data = await res.json();
            detail = data.message || data.error || detail;
          } catch {
            // ignore non-JSON error
          }
          throw new Error(detail);
        }

        const data = await res.json();

        const convRes = await fetch(conversationUrl, {
          headers: { ...getAuthHeaders() },
        });
        if (convRes.ok) {
          const convData = await convRes.json();
          setMessages(Array.isArray(convData.conversation) ? convData.conversation : []);
        } else {
          setMessages((prev) => [
            ...prev,
            { type: "user", sender: "You", content: userMessage, created_at: new Date().toISOString() },
            {
              type: "agent",
              sender: data.agent_name || "AI Assistant",
              content: data.response,
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        setChatError(err.message || "The interviewer couldn't respond. Try again.");
      } finally {
        setIsTyping(false);
      }
    },
    [chatUrl, conversationUrl]
  );

  const handleFinishPractice = useCallback(async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/interviews/${sessionId}/complete`,
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
        navigate(`/in/interviews/${sessionId}/analysis`);
      } else {
        throw new Error("Failed to complete practice session");
      }
    } catch (err) {
      setChatError(err.message || "Failed to conclude session. Please try again.");
    } finally {
      setIsCompleting(false);
    }
  }, [sessionId, isCompleting, navigate]);

  if (error) {
    return (
      <AppShell>
        <CenterBar
          title="Practice interview"
          backTo="/in/practice"
          backLabel="Back to practice dashboard"
        />
        <div className="max-w-2xl mx-auto p-4 py-12">
          <div className="bg-surface border border-line rounded-xl p-8 sm:p-10 text-center shadow-s5 dark:bg-gray-25/60">
            <div className="h-12 w-12 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-ink mb-1">Session error</p>
            <p className="text-xs text-secondary mb-5 max-w-sm mx-auto leading-relaxed">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={load}
                className="px-4 py-2 bg-brand text-white text-xs font-semibold rounded-xl hover:bg-brand/90 transition-colors shadow-s5"
              >
                Try again
              </button>
              <button
                onClick={() => navigate("/in/practice")}
                className="px-4 py-2 border border-line bg-surface text-ink text-xs font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-25 dark:bg-gray-25/50 transition-colors shadow-s5"
              >
                Return to dashboard
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <CenterBar
        title={session?.title || "Practice session"}
        subtitle={session?.post_title || "AI practice interview"}
        backTo="/in/practice"
        backLabel="Back to practice dashboard"
        actions={
          session && (
            <button
              onClick={handleFinishPractice}
              disabled={isCompleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-line bg-surface text-ink hover:bg-gray-100 dark:hover:bg-gray-25 dark:bg-gray-25/50 transition-colors shadow-s5 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-brand-text" strokeWidth={1.75} />
              <span>{isCompleting ? "Finishing…" : "Finish session"}</span>
            </button>
          )
        }
      />
      <div className="max-w-4xl mx-auto px-4 py-4">
        {chatError && (
          <div className="mb-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 px-3.5 py-2.5 text-xs flex items-center justify-between gap-3 shadow-s5">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span>{chatError}</span>
            </div>
            <button
              onClick={() => setChatError("")}
              className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-colors"
              aria-label="Dismiss notice"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        )}

        {!session ? (
          <div className="bg-surface border border-line rounded-xl p-12 text-center shadow-s5 dark:bg-gray-25/60">
            <MenteeLoader size={48} text="Loading practice session…" />
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-surface shadow-s5 overflow-hidden dark:bg-gray-25/60">
            <TextInterview
              interviewId={session.id}
              interviewData={session}
              isInterviewer={false}
              interviewMode="auto"
              messages={messages}
              isLoading={isTyping}
              isTyping={isTyping}
              onSendMessage={handleSendMessage}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import TextInterview from "../../components/interviews/TextInterview";
import { getBackendUrl, getAuthHeaders } from "../../utils/auth";

export default function PracticeRoom() {
  const { sessionId } = useParams();

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const conversationUrl = `${getBackendUrl()}/api/interviews/${sessionId}/conversation`;
  const chatUrl = `${getBackendUrl()}/api/interviews/${sessionId}/chat`;

  const load = useCallback(async () => {
    setError("");
    try {
      const [interviewRes, conversationRes] = await Promise.all([
        fetch(`${getBackendUrl()}/api/interviews/${sessionId}`),
        fetch(conversationUrl),
      ]);

      if (interviewRes.ok) {
        const data = await interviewRes.json();
        setSession(data.interview || data);
      } else {
        setError("Could not load the interview session.");
      }

      if (conversationRes.ok) {
        const data = await conversationRes.json();
        setMessages(Array.isArray(data.conversation) ? data.conversation : []);
      } else {
        // Conversation may be empty for a brand-new session; that is not fatal.
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
      setNewMessage("");
      setIsTyping(true);
      setError("");

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
            // ignore non-JSON error bodies
          }
          throw new Error(detail);
        }

        const data = await res.json();

        // Refresh from the authoritative transcript so both sides stay in sync.
        const convRes = await fetch(conversationUrl);
        if (convRes.ok) {
          const convData = await convRes.json();
          setMessages(Array.isArray(convData.conversation) ? convData.conversation : []);
        } else {
          setMessages((prev) => [
            ...prev,
            { type: "user", sender: "You", content: userMessage, created_at: new Date().toISOString() },
            { type: "agent", sender: data.agent_name || "AI Assistant", content: data.response, created_at: new Date().toISOString() },
          ]);
        }
      } catch (err) {
        setError(err.message || "AI unavailable");
        alert(err.message || "The interviewer couldn't respond. Try again.");
      } finally {
        setIsTyping(false);
      }
    },
    [chatUrl, conversationUrl]
  );

  if (error) {
    return (
      <DashboardLayout NavbarComponent={IndividualNavbar}>
        <Card>
          <p className="text-red-600">{error}</p>
          <button onClick={load} className="mt-2 text-sm text-blue-600">
            Try again
          </button>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout NavbarComponent={IndividualNavbar}>
      {!session ? (
        <Card>
          <p>Loading practice session...</p>
        </Card>
      ) : (
        <TextInterview
          interviewId={session.id}
          interviewData={session}
          isInterviewer={false}
          interviewMode={"auto"}
          messages={messages}
          isTyping={isTyping}
          onSendMessage={handleSendMessage}
        />
      )}
    </DashboardLayout>
  );
}

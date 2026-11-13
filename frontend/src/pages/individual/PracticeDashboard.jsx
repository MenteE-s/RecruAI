import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { AppShell, CenterBar } from "../../components/layout/AppShell";
import { verifyTokenWithServer, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import {
  Target,
  Clock,
  MessageSquare,
  Cpu,
  Play,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Shield,
  Sliders,
} from "lucide-react";

const DURATION_PRESETS = [15, 30, 45, 60];

export default function PracticeDashboard() {
  const [duration, setDuration] = useState(15);
  const [title, setTitle] = useState("Practice interview");
  const [type, setType] = useState("text");
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const agentsUrl = `${getBackendUrl()}/api/practice-ai-agents`;

  const loadAgents = useCallback(async () => {
    setAgentsLoading(true);
    setAgentsError("");
    try {
      const res = await fetch(agentsUrl, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Could not load practice agents");
      const data = await res.json();
      setAgents(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setSelectedAgentId(data[0].id);
      }
    } catch (err) {
      setAgentsError(err.message || "Could not load practice agents");
    } finally {
      setAgentsLoading(false);
    }
  }, [agentsUrl]);

  useEffect(() => {
    (async () => {
      await verifyTokenWithServer();
      await loadAgents();
    })();
  }, [loadAgents]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const preTitle = params.get("title");
    const preDuration = params.get("duration");
    const preAgent = params.get("agent_id");
    if (preTitle) setTitle(preTitle);
    if (preDuration) setDuration(Math.max(15, parseInt(preDuration, 10) || 15));
    if (preAgent) setSelectedAgentId(preAgent);
  }, [location.search]);

  const startPractice = useCallback(async () => {
    setIsStarting(true);
    setAgentsError("");

    let agent = agents.find((a) => String(a.id) === String(selectedAgentId)) || agents[0];

    if (!agent) {
      try {
        const createRes = await fetch(agentsUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ name: "Practice Interviewer", industry: "General" }),
        });
        if (!createRes.ok) throw new Error("Could not create a default practice agent");
        agent = await createRes.json();
        setAgents((prev) => [...prev, agent]);
        setSelectedAgentId(agent.id);
      } catch (err) {
        setAgentsError(err.message || "Create a practice AI agent before starting a session.");
        setIsStarting(false);
        return;
      }
    }

    try {
      const scheduleRes = await fetch(
        `${getBackendUrl()}/api/practice-ai-agents/${agent.id}/schedule-practice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ title, duration }),
        }
      );
      if (!scheduleRes.ok) {
        let detail = "Could not start the practice session.";
        try {
          const data = await scheduleRes.json();
          detail = data.message || data.error || detail;
        } catch {
          // ignore non-JSON error
        }
        throw new Error(detail);
      }
      const data = await scheduleRes.json();
      navigate(`/in/practice/${data.id}`);
    } catch (err) {
      setAgentsError(err.message || "Could not start practice session.");
      setIsStarting(false);
    }
  }, [agents, selectedAgentId, agentsUrl, title, duration, navigate]);

  return (
    <AppShell>
      <CenterBar
        title="Practice interview"
        subtitle="Simulate real-world technical and behavioral rounds"
        actions={
          <Link
            to="/in/ai-agents"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-gray-100 dark:hover:bg-gray-25 transition-colors shadow-s5 dark:bg-gray-25/50"
          >
            <Cpu className="h-3.5 w-3.5 text-secondary" strokeWidth={1.75} />
            <span>Manage AI agents</span>
          </Link>
        }
      />
      <div className="px-4 pb-8 pt-4 max-w-6xl mx-auto">
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-xl border border-line bg-surface text-ink mb-6 shadow-s5 dark:bg-gray-25/60">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-3">
                  <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Interactive practice</span>
                </div>
                <h2 className="text-2xl font-bold leading-tight text-ink">AI practice interview</h2>
                <p className="text-secondary mt-1.5 max-w-xl text-sm leading-relaxed">
                  Sharpen technical explanation and communication depth with custom AI interviewers.
                  Receive instant feedback and scoring upon completion.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-25 dark:bg-gray-25/50 border border-line px-2.5 py-1 text-secondary">
                    <Cpu className="h-3.5 w-3.5 text-brand-text" strokeWidth={1.75} />
                    <span>AI-powered</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-25 dark:bg-gray-25/50 border border-line px-2.5 py-1 text-secondary">
                    <MessageSquare className="h-3.5 w-3.5 text-brand-text" strokeWidth={1.75} />
                    <span>Interactive text chat</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-25 dark:bg-gray-25/50 border border-line px-2.5 py-1 text-secondary">
                    <Shield className="h-3.5 w-3.5 text-brand-text" strokeWidth={1.75} />
                    <span>Private & unranked</span>
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 xl:w-[380px]">
                <div className="rounded-xl border border-line bg-gray-25/80 dark:bg-gray-25/40 p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-ink">{agentsLoading ? "…" : agents.length}</p>
                  <p className="text-xs text-secondary mt-1 font-medium">Ready agents</p>
                </div>
                <div className="rounded-xl border border-line bg-gray-25/80 dark:bg-gray-25/40 p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-brand-text">{duration}m</p>
                  <p className="text-xs text-secondary mt-1 font-medium">Duration</p>
                </div>
                <div className="rounded-xl border border-line bg-gray-25/80 dark:bg-gray-25/40 p-4 text-center">
                  <p className="text-2xl font-bold text-ink">Text</p>
                  <p className="text-xs text-secondary mt-1 font-medium">Format</p>
                </div>
                <div className="col-span-3 rounded-xl border border-line bg-gray-25/80 dark:bg-gray-25/40 p-3 flex items-center justify-between text-xs">
                  <span className="font-medium text-ink flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-text shrink-0" strokeWidth={1.75} />
                    <span>Full scorecard on completion</span>
                  </span>
                  <span className="text-secondary">Free practice</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Setup and Guidance Grid */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-xl border border-line bg-surface xl:col-span-2 shadow-s5 dark:bg-gray-25/60">
            <div className="border-b border-line px-6 py-5">
              <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                <Target className="h-4 w-4 text-secondary" strokeWidth={1.75} />
                <span>Session setup</span>
              </h2>
              <p className="text-xs text-secondary mt-1">
                Configure your practice session. Choose your agent and interview focus.
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-secondary mb-1.5">
                    Session title
                  </label>
                  <div className="relative">
                    <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/60 h-4 w-4" strokeWidth={1.75} />
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Frontend Interview — React & System Design"
                      className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-secondary/50 focus:border-brand focus:ring-2 focus:ring-brand/20 dark:bg-gray-25/50"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-secondary">
                      Interviewer AI agent
                    </label>
                    <Link
                      to="/in/ai-agents"
                      className="text-xs text-brand-text hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <Cpu className="h-3 w-3" strokeWidth={1.75} />
                      <span>Configure agents</span>
                    </Link>
                  </div>
                  <div className="relative">
                    <Cpu className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/60 h-4 w-4" strokeWidth={1.75} />
                    <select
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      aria-label="Select practice AI agent"
                      disabled={agentsLoading || agents.length === 0}
                      className="w-full appearance-none rounded-xl border border-line bg-surface py-2.5 pl-10 pr-8 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60 dark:bg-gray-25/50"
                    >
                      {agents.length === 0 ? (
                        <option value="">Default interviewer (will be created automatically)</option>
                      ) : (
                        agents.map((ag) => (
                          <option key={ag.id} value={ag.id}>
                            {ag.name} ({ag.industry || "General"})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">
                    Duration (minutes)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/60 h-4 w-4" strokeWidth={1.75} />
                    <input
                      type="number"
                      min={15}
                      max={120}
                      value={duration}
                      onChange={(e) => setDuration(Math.max(15, parseInt(e.target.value || "15", 10)))}
                      aria-label="Practice session duration in minutes"
                      className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-sm font-mono text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 dark:bg-gray-25/50"
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[11px] text-secondary">Quick:</span>
                    {DURATION_PRESETS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setDuration(m)}
                        className={`px-2 py-0.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                          duration === m
                            ? "bg-brand text-white"
                            : "bg-gray-100 dark:bg-gray-25 text-secondary hover:text-ink"
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">
                    Interview format
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/60 h-4 w-4" strokeWidth={1.75} />
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      aria-label="Practice interview type"
                      className="w-full appearance-none rounded-xl border border-line bg-surface py-2.5 pl-10 pr-8 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 dark:bg-gray-25/50"
                    >
                      <option value="text">Interactive text chat</option>
                      <option value="ai_video" disabled>AI video (upcoming)</option>
                      <option value="human_video" disabled>Human video (upcoming)</option>
                    </select>
                  </div>
                  <p className="text-xs text-secondary mt-2 leading-relaxed">
                    Adaptive questions evaluate STAR technique and technical depth.
                  </p>
                </div>
              </div>

              {agentsError && (
                <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs px-3.5 py-2.5 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span>{agentsError}</span>
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <button
                  onClick={startPractice}
                  disabled={agentsLoading || isStarting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand/90 shadow-s5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="h-4 w-4" strokeWidth={1.75} />
                  <span>{isStarting ? "Starting session…" : "Start practice"}</span>
                </button>
                <Link
                  to="/in/ai-agents"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink hover:bg-gray-100 dark:hover:bg-gray-25 dark:bg-gray-25/50 transition-colors shadow-s5"
                >
                  <Sliders className="h-4 w-4 text-secondary" strokeWidth={1.75} />
                  <span>Customize interviewer</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Side Guidance Cards */}
          <div className="space-y-6">
            <div className="rounded-xl border border-brand/20 bg-brand/5 dark:bg-brand/10 p-6 shadow-s5">
              <h3 className="text-sm font-semibold text-brand-text flex items-center gap-2">
                <Award className="h-4 w-4" strokeWidth={1.75} />
                <span>Why practice here?</span>
              </h3>
              <ul className="mt-3 space-y-2.5 text-sm text-secondary">
                <li className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-brand-text" strokeWidth={1.75} />
                  <span>Adaptive questions tailored to your profile and target roles</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-brand-text" strokeWidth={1.75} />
                  <span>Real-time follow-ups simulating genuine interview pressure</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-brand-text" strokeWidth={1.75} />
                  <span>Detailed breakdown on communication, problem-solving, and accuracy</span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-line bg-surface p-6 shadow-s5 dark:bg-gray-25/60">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-secondary" strokeWidth={1.75} />
                <span>How it works</span>
              </h3>
              <ol className="mt-3 space-y-2.5 text-sm text-secondary list-decimal list-inside leading-relaxed">
                <li>Pick an AI interviewer matching your target field.</li>
                <li>Chat in real time with conversational turn-taking.</li>
                <li>Receive immediate scoring and tactical improvement tips.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

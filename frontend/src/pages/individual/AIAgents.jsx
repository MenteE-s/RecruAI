import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell, CenterBar } from "../../components/layout/AppShell";
import { verifyTokenWithServer, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { formatDate } from "../../utils/timezone";
import {
  Cpu,
  Plus,
  Play,
  Briefcase,
  FileText,
  Settings,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function IndividualAIAgents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", industry: "", description: "", custom_instructions: "" });
  const [saving, setSaving] = useState(false);
  const [startingAgentId, setStartingAgentId] = useState(null);
  const [deletingAgentId, setDeletingAgentId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await verifyTokenWithServer();
      const agentsRes = await fetch(`${getBackendUrl()}/api/practice-ai-agents`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (agentsRes.ok) {
        const data = await agentsRes.json();
        setAgents(Array.isArray(data) ? data : []);
        // Keep form open if user has no agents yet, otherwise collapse for clean hierarchy
        if (Array.isArray(data) && data.length > 0) {
          setIsFormOpen(false);
        }
      } else {
        setError("Failed to load practice AI agents");
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createAgent = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${getBackendUrl()}/api/practice-ai-agents`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (response.ok) {
        const newAgent = await response.json();
        setAgents((prev) => [newAgent, ...prev]);
        setForm({ name: "", industry: "", description: "", custom_instructions: "" });
        setIsFormOpen(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create practice AI agent");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const deleteAgent = async (agentId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this practice interviewer?")) return;
    setDeletingAgentId(agentId);
    setError(null);
    try {
      const response = await fetch(`${getBackendUrl()}/api/practice-ai-agents/${agentId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (response.ok) {
        setAgents((prev) => prev.filter((a) => a.id !== agentId));
      } else {
        const err = await response.json();
        setError(err.error || err.message || "Failed to delete practice AI agent");
      }
    } catch {
      setError("Network error deleting agent");
    } finally {
      setDeletingAgentId(null);
    }
  };

  const startPracticeInterview = async (agentId) => {
    setStartingAgentId(agentId);
    setError(null);
    try {
      const response = await fetch(`${getBackendUrl()}/api/practice-ai-agents/${agentId}/schedule-practice`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        navigate(`/in/practice/${data.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to start practice interview");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setStartingAgentId(null);
    }
  };

  const getInitials = (name) => {
    if (!name) return "AI";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <AppShell>
      <CenterBar
        title="My practice AI agents"
        subtitle="Tailor personal AI interviewers for realistic mock interviews"
        backTo="/in/practice"
        backLabel="Back to practice dashboard"
        actions={
          <Link
            to="/in/practice"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-gray-100 dark:hover:bg-gray-25 transition-colors shadow-s5 dark:bg-gray-25/50"
          >
            <Play className="h-3.5 w-3.5 text-brand-text" strokeWidth={1.75} />
            <span>Practice dashboard</span>
          </Link>
        }
      />
      <div className="px-4 pb-8 pt-4 max-w-6xl mx-auto">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-xl border border-line bg-surface text-ink mb-6 shadow-s5 dark:bg-gray-25/60">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 bg-brand/10 border border-brand/20 text-[11px] font-semibold text-brand-text dark:border-brand/30 dark:bg-brand/15 mb-3">
                  <Cpu className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Agent studio</span>
                </div>
                <h2 className="text-2xl font-bold leading-tight text-ink">Personal AI interviewers</h2>
                <p className="text-secondary mt-1.5 max-w-xl text-sm leading-relaxed">
                  Create specialized practice interviewers tailored to your industry, target role,
                  and preferred interview style. Practice anytime with instant feedback.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 xl:w-[380px]">
                <div className="rounded-xl border border-line bg-gray-25/80 dark:bg-gray-25/40 p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-ink">{agents.length}</p>
                  <p className="text-xs text-secondary mt-1 font-medium">Agents</p>
                </div>
                <div className="rounded-xl border border-line bg-gray-25/80 dark:bg-gray-25/40 p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-brand-text">
                    {agents.length > 0 ? "Ready" : "Setup"}
                  </p>
                  <p className="text-xs text-secondary mt-1 font-medium">Status</p>
                </div>
                <div className="rounded-xl border border-line bg-gray-25/80 dark:bg-gray-25/40 p-4 text-center">
                  <p className="text-2xl font-bold font-mono text-ink">∞</p>
                  <p className="text-xs text-secondary mt-1 font-medium">Practices</p>
                </div>
                <div className="col-span-3 rounded-xl border border-line bg-gray-25/80 dark:bg-gray-25/40 p-3 flex items-center justify-between text-xs">
                  <span className="font-medium text-ink flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-text shrink-0" strokeWidth={1.75} />
                    <span>Available on trial & full plans</span>
                  </span>
                  <span className="text-secondary">Unlimited practice</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 px-4 py-3 flex items-start justify-between gap-4 shadow-s5">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" strokeWidth={1.75} />
              <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-700 dark:text-red-300 hover:opacity-75 p-1 transition-opacity"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        )}

        {/* Create / Toggle Card */}
        <div className="rounded-xl border border-line bg-surface mb-6 shadow-s5 overflow-hidden dark:bg-gray-25/60">
          <div className="border-b border-line flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                <Plus className="h-4 w-4 text-secondary" strokeWidth={1.75} />
                <span>Create practice agent</span>
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Define the interviewer role, industry context, and custom behavioral instructions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-gray-100 dark:hover:bg-gray-25 dark:bg-gray-25/50 transition-colors shadow-s5"
            >
              {isFormOpen ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>New agent</span>
                </>
              )}
            </button>
          </div>

          {isFormOpen && (
            <form onSubmit={createAgent} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">
                    Agent name *
                  </label>
                  <div className="relative">
                    <Cpu className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/60 h-4 w-4" strokeWidth={1.75} />
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      placeholder="e.g. Senior Frontend Mentor — React"
                      className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-secondary/50 focus:border-brand focus:ring-2 focus:ring-brand/20 dark:bg-gray-25/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">
                    Industry or specialization
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/60 h-4 w-4" strokeWidth={1.75} />
                    <input
                      value={form.industry}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                      placeholder="e.g. Software Engineering, FinTech, Product"
                      className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-secondary/50 focus:border-brand focus:ring-2 focus:ring-brand/20 dark:bg-gray-25/50"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-secondary mb-1.5">
                    Role description
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3 text-secondary/60 h-4 w-4" strokeWidth={1.75} />
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={2}
                      placeholder="What kind of interview round does this agent lead? e.g. Staff-level engineering manager testing architecture and behavioral trade-offs."
                      className="w-full resize-none rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-secondary/50 focus:border-brand focus:ring-2 focus:ring-brand/20 dark:bg-gray-25/50"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-secondary mb-1.5">
                    Custom instructions & tone
                  </label>
                  <div className="relative">
                    <Settings className="absolute left-3.5 top-3 text-secondary/60 h-4 w-4" strokeWidth={1.75} />
                    <textarea
                      value={form.custom_instructions}
                      onChange={(e) => setForm({ ...form, custom_instructions: e.target.value })}
                      rows={2}
                      placeholder="e.g. Emphasize STAR method, challenge assumptions politely, probe edge cases, provide concise follow-up prompts."
                      className="w-full resize-none rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-secondary/50 focus:border-brand focus:ring-2 focus:ring-brand/20 dark:bg-gray-25/50"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand/90 shadow-s5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    "Creating…"
                  ) : (
                    <>
                      <Plus className="h-4 w-4" strokeWidth={1.75} />
                      <span>Create practice agent</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ name: "", industry: "", description: "", custom_instructions: "" })}
                  className="rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink hover:bg-gray-100 dark:hover:bg-gray-25 dark:bg-gray-25/50 transition-colors shadow-s5"
                >
                  Clear
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Agents list */}
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-semibold text-ink">
            Your agents <span className="font-mono text-secondary">· {agents.length}</span>
          </h3>
          <span className="text-xs text-secondary font-medium font-mono">
            {loading ? "Loading…" : `${agents.length} configured`}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-line bg-surface p-5 shadow-s5 dark:bg-gray-25/50">
                <div className="h-5 bg-gray-100 dark:bg-gray-50 w-1/3 mb-2 rounded" />
                <div className="h-4 bg-gray-100 dark:bg-gray-50 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-12 text-center shadow-s5 dark:bg-gray-25/60">
            <div className="h-14 w-14 rounded-2xl bg-gray-25 dark:bg-gray-25/50 border border-line flex items-center justify-center mx-auto mb-4">
              <Cpu className="h-7 w-7 text-secondary/40" strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-semibold text-ink">No agents yet</h3>
            <p className="text-xs text-secondary mt-1.5 max-w-md mx-auto leading-relaxed">
              Create your first AI interviewer above. It will appear here and you can start a practice
              session with tailored questions instantly.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="group rounded-xl border border-line bg-surface transition-all hover:border-brand/40 shadow-s5 dark:bg-gray-25/60 dark:hover:border-brand/50"
              >
                <div className="p-5">
                  <div className="flex gap-4">
                    <div className="hidden sm:flex h-11 w-11 bg-gray-25 dark:bg-gray-25/60 border border-line text-ink rounded-xl items-center justify-center text-sm font-mono font-bold shrink-0">
                      {getInitials(agent.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h4 className="text-[15px] font-semibold text-ink leading-snug">{agent.name}</h4>
                          <p className="text-xs text-secondary flex items-center gap-1.5 mt-1">
                            <Briefcase className="h-3.5 w-3.5 text-secondary/60 shrink-0" strokeWidth={1.75} />
                            <span>{agent.industry || "General"}</span>
                            <span className="text-secondary/40">·</span>
                            <Calendar className="h-3.5 w-3.5 text-secondary/60 shrink-0" strokeWidth={1.75} />
                            <span>{formatDate(agent.created_at)}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 text-[11px] font-medium text-brand-text dark:border-brand/30 dark:bg-brand/15">
                            Ready
                          </span>
                          <button
                            type="button"
                            onClick={(e) => deleteAgent(agent.id, e)}
                            disabled={deletingAgentId === agent.id}
                            className="p-1.5 rounded-lg border border-transparent hover:border-line hover:bg-red-50 dark:hover:bg-red-950/30 text-secondary hover:text-red-600 transition-colors"
                            aria-label="Delete agent"
                            title="Delete this agent"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                        </div>
                      </div>

                      {agent.description && (
                        <p className="text-xs text-secondary mt-3 leading-relaxed">
                          {agent.description}
                        </p>
                      )}

                      {agent.custom_instructions && (
                        <div className="mt-3 rounded-xl border border-line bg-gray-25/70 dark:bg-gray-25/40 p-3">
                          <p className="text-xs font-medium text-ink mb-1 flex items-center gap-1">
                            <Settings className="h-3 w-3 text-brand-text" strokeWidth={1.75} />
                            <span>Custom instructions</span>
                          </p>
                          <p className="text-xs text-secondary leading-relaxed">
                            {agent.custom_instructions}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="hidden lg:flex flex-col gap-2 shrink-0 w-[180px] justify-center">
                      <button
                        onClick={() => startPracticeInterview(agent.id)}
                        disabled={startingAgentId === agent.id}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand/90 shadow-s5 disabled:opacity-50 transition-colors"
                      >
                        <Play className="h-3.5 w-3.5" strokeWidth={1.75} />
                        <span>{startingAgentId === agent.id ? "Starting…" : "Start practice"}</span>
                      </button>
                      <span className="text-[11px] text-secondary text-center">
                        Instant session
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex lg:hidden gap-2">
                    <button
                      onClick={() => startPracticeInterview(agent.id)}
                      disabled={startingAgentId === agent.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand/90 shadow-s5 disabled:opacity-50 transition-colors"
                    >
                      <Play className="h-3.5 w-3.5" strokeWidth={1.75} />
                      <span>{startingAgentId === agent.id ? "Starting…" : "Start practice"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

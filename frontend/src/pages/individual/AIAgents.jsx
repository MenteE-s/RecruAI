import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, verifyTokenWithServer, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { formatDate } from "../../utils/timezone";
import {
  FiCpu,
  FiPlus,
  FiPlay,
  FiBriefcase,
  FiFileText,
  FiSettings,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiArrowRight,
} from "react-icons/fi";

export default function IndividualAIAgents() {
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const [user, setUser] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", industry: "", description: "", custom_instructions: "" });
  const [saving, setSaving] = useState(false);
  const [startingInterview, setStartingInterview] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const me = await verifyTokenWithServer();
        setUser(me);
        const agentsRes = await fetch(`${getBackendUrl()}/api/practice-ai-agents`, {
          headers: getAuthHeaders(),
          credentials: "include",
        });
        if (agentsRes.ok) setAgents(await agentsRes.json());
        else setError("Failed to load practice AI agents");
      } catch {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
        setAgents([newAgent, ...agents]);
        setForm({ name: "", industry: "", description: "", custom_instructions: "" });
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

  const startPracticeInterview = async (agentId) => {
    setStartingInterview(true);
    setError(null);
    try {
      const response = await fetch(`${getBackendUrl()}/api/practice-ai-agents/${agentId}/schedule-practice`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        window.location.href = `/interview/${data.id}`;
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to start practice interview");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setStartingInterview(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "AI";
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-xs font-medium tracking-wide mb-3">
                <FiCpu className="w-3.5 h-3.5" />
                AI PRACTICE
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight flex items-center gap-3">
                My practice AI agents
                <span className="hidden sm:inline-flex text-xs font-medium bg-green-500 text-white px-2.5 py-1">Free</span>
              </h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Create personal AI interviewers tailored to your industry and style. Practice anytime.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[380px]">
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{agents.length}</p>
                <p className="text-xs text-gray-300 mt-1">Agents</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{user ? "✓" : "—"}</p>
                <p className="text-xs text-gray-300 mt-1">Ready</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">∞</p>
                <p className="text-xs text-gray-300 mt-1">Practices</p>
              </div>
              <div className="col-span-3 bg-white text-gray-900 p-3 flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2"><FiCheckCircle className="w-4 h-4 text-green-600" /> Available on trial & paid plans</span>
                <span className="text-xs text-gray-500 hidden sm:inline">No credit needed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 px-4 py-3 flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900 p-1"><FiX className="w-4 h-4" /></button>
        </div>
      )}

      {/* Create form */}
      <div className="bg-white border border-gray-200 mb-6">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiPlus className="w-4 h-4 text-gray-500" /> Create practice agent</h2>
            <p className="text-sm text-gray-500 mt-1">Name your interviewer and give it a role. Add custom instructions for tone or focus.</p>
          </div>
          <span className="hidden sm:inline-flex text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1">Takes ~10s</span>
        </div>
        <form onSubmit={createAgent} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Agent name *</label>
              <div className="relative">
                <FiCpu className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Frontend Mentor — React" className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Industry</label>
              <div className="relative">
                <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="e.g. Software, Design, Marketing" className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
              <div className="relative">
                <FiFileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="What kind of interviewer is this? e.g. Senior frontend interviewer focusing on React, system design, and behavioral." className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white resize-none" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Custom instructions</label>
              <div className="relative">
                <FiSettings className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea value={form.custom_instructions} onChange={(e) => setForm({ ...form, custom_instructions: e.target.value })} rows={2} placeholder="e.g. Be encouraging, ask follow-up questions, keep answers concise, focus on STAR method." className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white resize-none" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {saving ? "Creating…" : <><FiPlus className="w-4 h-4" /> Create practice agent</>}
            </button>
            <button type="button" onClick={() => setForm({ name: "", industry: "", description: "", custom_instructions: "" })} className="px-5 py-2.5 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Clear</button>
          </div>
        </form>
      </div>

      {/* Agents list */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Your agents • {agents.length}</h3>
        <span className="text-xs text-gray-500">{loading ? "Loading…" : `${agents.length} total`}</span>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 p-5 animate-pulse">
              <div className="h-5 bg-gray-100 w-1/3 mb-2" />
              <div className="h-4 bg-gray-100 w-1/2" />
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-4"><FiCpu className="w-7 h-7 text-gray-400" /></div>
          <h3 className="text-lg font-semibold text-gray-900">No agents yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">Create your first AI interviewer above. It will appear here and you can start a practice session instantly.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <div key={agent.id} className="group bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="p-5">
                <div className="flex gap-4">
                  <div className="hidden sm:flex w-11 h-11 bg-gray-900 text-white items-center justify-center text-sm font-bold shrink-0">{getInitials(agent.name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h4 className="text-[15px] font-semibold text-gray-900">{agent.name}</h4>
                        <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5"><FiBriefcase className="w-3.5 h-3.5 text-gray-400" />{agent.industry || "General"} <span className="text-gray-300">•</span> <span className="flex items-center gap-1"><FiCalendar className="w-3.5 h-3.5 text-gray-400" />{formatDate(agent.created_at)}</span></p>
                      </div>
                      <span className="hidden sm:inline-flex text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1">Ready</span>
                    </div>
                    {agent.description && <p className="text-sm text-gray-600 mt-3 leading-relaxed">{agent.description}</p>}
                    {agent.custom_instructions && <div className="mt-3 bg-gray-50 border border-gray-200 p-3"><p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><FiSettings className="w-3 h-3" /> Custom instructions</p><p className="text-sm text-gray-700">{agent.custom_instructions}</p></div>}
                  </div>
                  <div className="hidden lg:flex flex-col gap-2 shrink-0 w-[180px]">
                    <button onClick={() => startPracticeInterview(agent.id)} disabled={startingInterview} className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"><FiPlay className="w-4 h-4" />{startingInterview ? "Starting…" : "Start practice"}</button>
                    <span className="text-xs text-gray-500 text-center">Instant • ~{agent.industry || "general"} interview</span>
                  </div>
                </div>
                <div className="mt-4 flex lg:hidden gap-2">
                  <button onClick={() => startPracticeInterview(agent.id)} disabled={startingInterview} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"><FiPlay className="w-4 h-4" />{startingInterview ? "Starting…" : "Start practice"}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

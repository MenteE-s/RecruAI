import React, { useCallback, useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, verifyTokenWithServer, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import { formatDate } from "../../utils/timezone";
import { FiCpu, FiPlus, FiEdit2, FiTrash2, FiPlay, FiBriefcase, FiFileText, FiSettings, FiEye, FiCalendar, FiCheckCircle, FiAlertCircle, FiX, FiZap } from "react-icons/fi";

export default function AIAgents() {
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const { showToast } = useToast();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [testingAgent, setTestingAgent] = useState(null);
  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [formData, setFormData] = useState({ name: "", industry: "", description: "", system_prompt: "", custom_instructions: "", is_active: true });
  const [organizationId, setOrganizationId] = useState(null);
  const [orgError, setOrgError] = useState("");

  const fetchAgents = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/organizations/${organizationId}/ai-agents`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) setAgents(await res.json());
      else showToast({ message: (await res.json().catch(() => ({})))?.error || "Failed to load AI agents", type: "error" });
    } catch { showToast({ message: "Failed to load AI agents", type: "error" }); }
    finally { setLoading(false); }
  }, [organizationId]);

  useEffect(() => {
    let isMounted = true;
    const loadOrganization = async () => {
      setLoading(true);
      try {
        const user = await verifyTokenWithServer();
        if (!isMounted) return;
        if (user?.organization_id) { setOrganizationId(user.organization_id); setOrgError(""); }
        else { setOrgError("Unable to determine your organization. Please refresh or contact support."); setLoading(false); }
      } catch { if (isMounted) { setOrgError("Unable to load your organization context. Please try again later."); setLoading(false); } }
    };
    loadOrganization();
    return () => { isMounted = false; };
  }, []);
  useEffect(() => { if (organizationId) fetchAgents(); }, [organizationId, fetchAgents]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const targetOrgId = editingAgent ? editingAgent.organization_id : organizationId;
    if (!targetOrgId) { showToast({ message: "Unable to determine your organization. Please refresh and try again.", type: "error" }); return; }
    try {
      const url = editingAgent ? `${getBackendUrl()}/api/ai-agents/${editingAgent.id}` : `${getBackendUrl()}/api/organizations/${targetOrgId}/ai-agents`;
      const method = editingAgent ? "PUT" : "POST";
      const payload = { ...formData, system_prompt: formData.system_prompt?.trim() };
      if (!payload.system_prompt) delete payload.system_prompt;
      const res = await fetch(url, { method, headers: getAuthHeaders({ "Content-Type": "application/json" }), credentials: "include", body: JSON.stringify(payload) });
      if (res.ok) { await fetchAgents(); resetForm(); showToast({ message: editingAgent ? "AI agent updated successfully!" : "AI agent created successfully!", type: "success" }); } else showToast({ message: "Failed to save AI agent", type: "error" });
    } catch { showToast({ message: "Failed to save AI agent", type: "error" }); }
  };
  const handleDelete = async (agentId) => {
    if (!window.confirm("Are you sure you want to delete this AI agent?")) return;
    try {
      const res = await fetch(`${getBackendUrl()}/api/ai-agents/${agentId}`, { method: "DELETE", credentials: "include", headers: getAuthHeaders() });
      if (res.ok) { await fetchAgents(); showToast({ message: "AI agent deleted successfully", type: "success" }); }
    } catch { showToast({ message: "Failed to delete AI agent", type: "error" }); }
  };
  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setFormData({ name: agent.name || "", industry: agent.industry || "", description: agent.description || "", system_prompt: agent.system_prompt || "", custom_instructions: agent.custom_instructions || "", is_active: agent.is_active ?? true });
    setShowCreateForm(true);
  };
  const handleTestAgent = async () => {
    if (!testingAgent || !testMessage.trim()) return;
    try {
      const res = await fetch(`${getBackendUrl()}/api/ai-agents/${testingAgent.id}/test`, { method: "POST", headers: getAuthHeaders({ "Content-Type": "application/json" }), credentials: "include", body: JSON.stringify({ message: testMessage }) });
      if (res.ok) { setTestResponse((await res.json()).response); showToast({ message: "Agent test completed", type: "success" }); }
    } catch { showToast({ message: "Failed to test agent", type: "error" }); }
  };
  const resetForm = () => { setFormData({ name: "", industry: "", description: "", system_prompt: "", custom_instructions: "", is_active: true }); setEditingAgent(null); setShowCreateForm(false); };
  const industries = ["Software Engineering", "Data Science", "Product Management", "Marketing", "Sales", "Design", "Finance", "Human Resources", "Operations", "Customer Success"];
  const getInitials = (name) => name ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "AI";

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
                AI AGENTS
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">AI interview agents</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Train and customize AI agents to conduct interviews for your organization.</p>
            </div>
            <div className="flex flex-col gap-3 lg:w-[380px]">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                  <p className="text-2xl font-bold">{agents.length}</p>
                  <p className="text-xs text-gray-300 mt-1">Agents</p>
                </div>
                <div className="bg-green-500/20 backdrop-blur border border-green-400/20 p-4 text-center">
                  <p className="text-2xl font-bold text-green-200">{agents.filter((a) => a.is_active).length}</p>
                  <p className="text-xs text-green-200 mt-1">Active</p>
                </div>
                <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                  <p className="text-2xl font-bold">∞</p>
                  <p className="text-xs text-gray-300 mt-1">Interviews</p>
                </div>
              </div>
              <button onClick={() => setShowCreateForm(!showCreateForm)} className="w-full inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-5 py-3 text-sm font-medium hover:bg-gray-100 transition-colors">
                <FiPlus className="w-4 h-4" /> {showCreateForm ? "Cancel" : "New AI agent"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {orgError && (
        <div className="mb-6 bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2 text-sm text-red-700">
          <FiAlertCircle className="w-5 h-5 shrink-0" />{orgError}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">{editingAgent ? "Edit AI agent" : "Create new AI agent"}</h3>
            <p className="text-xs text-gray-500 mt-1">Define how your AI interviewer behaves.</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Agent name *</label>
                <div className="relative">
                  <FiCpu className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input type="text" required value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Senior Software Engineer Interviewer" className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Industry *</label>
                <select required value={formData.industry} onChange={(e) => setFormData((p) => ({ ...p, industry: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white">
                  <option value="">Select industry</option>
                  {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
              <textarea rows={2} value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description of what this agent specializes in…" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Base system prompt</label>
              <textarea rows={3} value={formData.system_prompt} onChange={(e) => setFormData((p) => ({ ...p, system_prompt: e.target.value }))} placeholder="Optional instructions for tone, detail level, or priorities…" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white resize-none" />
              <p className="text-xs text-gray-400 mt-1">Customizes the agent's tone and priorities.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Custom instructions</label>
              <textarea rows={3} value={formData.custom_instructions} onChange={(e) => setFormData((p) => ({ ...p, custom_instructions: e.target.value }))} placeholder="e.g. Focus on React experience, emphasize problem-solving…" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white resize-none" />
            </div>
            <label className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 cursor-pointer">
              <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Agent is active and can conduct interviews</span>
            </label>
            <div className="flex gap-3">
              <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">{editingAgent ? "Update agent" : "Create agent"}</button>
              <button type="button" onClick={resetForm} className="px-5 py-2.5 bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Your agents • {agents.length}</h3>
          <span className="text-xs text-gray-500">{agents.filter((a) => a.is_active).length} active</span>
        </div>
        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin h-8 w-8 border-2 border-gray-200 border-t-blue-600 rounded-full" /></div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-3"><FiCpu className="w-7 h-7 text-gray-400" /></div>
            <p className="text-sm font-medium text-gray-900">No AI agents yet</p>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">Create your first AI interviewer to automate interviews for specific roles.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {agents.map((agent) => (
              <div key={agent.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex gap-4">
                  <div className="hidden sm:flex w-11 h-11 bg-gray-900 text-white items-center justify-center text-sm font-bold shrink-0">{getInitials(agent.name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-[15px] font-semibold text-gray-900">{agent.name}</h4>
                      <span className={`text-xs font-medium border px-2 py-0.5 ${agent.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>{agent.is_active ? "Active" : "Inactive"}</span>
                      <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5">{agent.industry}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{agent.description || "No description"}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><FiCalendar className="w-3 h-3" /> Created {formatDate(agent.created_at)}</p>
                    {agent.custom_instructions && <div className="mt-2 bg-blue-50 border border-blue-200 p-2"><p className="text-xs text-blue-700"><span className="font-medium">Custom:</span> {agent.custom_instructions}</p></div>}
                  </div>
                  <div className="hidden lg:flex flex-col gap-2 shrink-0 w-[140px]">
                    <button onClick={() => setTestingAgent(agent)} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-medium hover:bg-green-700"><FiPlay className="w-3.5 h-3.5" /> Test</button>
                    <button onClick={() => handleEdit(agent)} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-xs font-medium hover:bg-gray-50"><FiEdit2 className="w-3.5 h-3.5" /> Edit</button>
                    <button onClick={() => handleDelete(agent.id)} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50"><FiTrash2 className="w-3.5 h-3.5" /> Delete</button>
                  </div>
                </div>
                <div className="mt-3 flex lg:hidden gap-2">
                  <button onClick={() => setTestingAgent(agent)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-medium"><FiPlay className="w-3.5 h-3.5" /> Test</button>
                  <button onClick={() => handleEdit(agent)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-xs font-medium"><FiEdit2 className="w-3.5 h-3.5" /> Edit</button>
                  <button onClick={() => handleDelete(agent.id)} className="px-3 py-2 bg-white border border-red-200 text-red-600"><FiTrash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {testingAgent && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Test {testingAgent.name}</h3>
              <p className="text-xs text-gray-500 mt-1">Send a message to see how the agent responds</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Test message</label>
                <textarea rows={3} value={testMessage} onChange={(e) => setTestMessage(e.target.value)} placeholder="e.g. Tell me about your experience with React…" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white resize-none" />
              </div>
              <button onClick={handleTestAgent} disabled={!testMessage.trim()} className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Send test message</button>
              {testResponse && <div className="bg-gray-50 border border-gray-200 p-4"><p className="text-xs font-medium text-gray-700 mb-1">Agent response:</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{testResponse}</p></div>}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => { setTestingAgent(null); setTestMessage(""); setTestResponse(""); }} className="px-5 py-2 bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function getInitials(name) {
  if (!name) return "AI";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

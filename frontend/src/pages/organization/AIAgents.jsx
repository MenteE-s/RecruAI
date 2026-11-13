import { OrgAppShell } from "../../components/layout/OrgAppShell";
import React, { useCallback, useState, useEffect } from "react";
import { verifyTokenWithServer, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import { formatDate } from "../../utils/timezone";
import { ProfileSection } from "../../components/profile/ProfileSection";
import { Button } from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { Avatar } from "../../components/ui/Avatar";
import { FiCpu, FiPlus, FiEdit2, FiTrash2, FiPlay, FiCalendar, FiAlertCircle, FiX } from "react-icons/fi";

export default function AIAgents() {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fieldCls = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50";
  const chipCls = "inline-flex items-center rounded-full border border-line bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-25";
  const statusChip = (active) =>
    active
      ? "bg-brand/10 text-brand-text border-brand/20"
      : "bg-gray-50 text-gray-600 border-line dark:bg-gray-25";

  return (
    <OrgAppShell>
      {/* Header */}
      <div className="px-4 pb-4 pt-4">
        <div className="rounded-xl border border-line bg-surface p-5 card-hover">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-[24px] font-semibold leading-8 text-ink">AI agents</h1>
              <p className="mt-0.5 text-[13px] text-gray-500">Train and customize AI agents to conduct interviews for your organization.</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-line bg-gray-50 p-3.5 text-center dark:bg-gray-25">
                  <p className="text-lg font-bold text-ink">{agents.length}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">Agents</p>
                </div>
                <div className="rounded-xl border border-brand/20 bg-brand/10 p-3.5 text-center">
                  <p className="text-lg font-bold text-brand-text">{agents.filter((a) => a.is_active).length}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">Active</p>
                </div>
                <div className="rounded-xl border border-line bg-gray-50 p-3.5 text-center dark:bg-gray-25">
                  <p className="text-lg font-bold text-ink">∞</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">Interviews</p>
                </div>
              </div>
              <Button variant={showCreateForm ? "secondary" : "primary"} onClick={() => setShowCreateForm(!showCreateForm)}>
                <FiPlus className="h-4 w-4" /> {showCreateForm ? "Cancel" : "New AI agent"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {orgError && (
        <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          <FiAlertCircle className="h-5 w-5 shrink-0" />{orgError}
        </div>
      )}

      {showCreateForm && (
        <div className="px-4 pb-4">
          <ProfileSection>
            <div className="border-b border-line pb-4">
              <h2 className="text-sm font-semibold text-ink">{editingAgent ? "Edit AI agent" : "Create new AI agent"}</h2>
              <p className="mt-0.5 text-xs text-gray-500">Define how your AI interviewer behaves.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Agent name *</label>
                  <div className="relative">
                    <FiCpu className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input type="text" required value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Senior Software Engineer Interviewer" className={`${fieldCls} pl-9`} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Industry *</label>
                  <select required value={formData.industry} onChange={(e) => setFormData((p) => ({ ...p, industry: e.target.value }))} className={fieldCls}>
                    <option value="">Select industry</option>
                    {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Description</label>
                <textarea rows={2} value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description of what this agent specializes in…" className={`${fieldCls} resize-none`} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Base system prompt</label>
                <textarea rows={3} value={formData.system_prompt} onChange={(e) => setFormData((p) => ({ ...p, system_prompt: e.target.value }))} placeholder="Optional instructions for tone, detail level, or priorities…" className={`${fieldCls} resize-none`} />
                <p className="mt-1 text-xs text-gray-500">Customizes the agent's tone and priorities.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Custom instructions</label>
                <textarea rows={3} value={formData.custom_instructions} onChange={(e) => setFormData((p) => ({ ...p, custom_instructions: e.target.value }))} placeholder="e.g. Focus on React experience, emphasize problem-solving…" className={`${fieldCls} resize-none`} />
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-gray-50 p-3 dark:bg-gray-25">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))} className="h-4 w-4 rounded border-line text-brand-text focus:ring-4 focus:ring-[#E1E4E8]/50" />
                <span className="text-sm text-gray-700 dark:text-gray-600">Agent is active and can conduct interviews</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" type="submit">{editingAgent ? "Update agent" : "Create agent"}</Button>
                <Button variant="secondary" type="button" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </ProfileSection>
        </div>
      )}

      <div className="px-4 pb-4">
        <ProfileSection>
          <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
            <h2 className="text-sm font-semibold text-ink">Your agents • {agents.length}</h2>
            <span className="rounded-full border border-line bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-25">{agents.filter((a) => a.is_active).length} active</span>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 gap-3 pt-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-36 animate-pulse rounded-xl border border-line bg-surface" />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <EmptyState
              icon={FiCpu}
              title="No AI agents yet"
              body="Create your first AI interviewer to automate interviews for specific roles."
              action={null}
            />
          ) : (
            <div className="divide-y divide-line pt-2">
              {agents.map((agent) => (
                <div key={agent.id} className="py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-25">
                  <div className="flex gap-3 sm:gap-4">
                    <Avatar name={agent.name || "AI"} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-ink">{agent.name}</h3>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusChip(agent.is_active)}`}>{agent.is_active ? "Active" : "Inactive"}</span>
                        <span className={chipCls}>{agent.industry}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-500">{agent.description || "No description"}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500"><FiCalendar className="h-3.5 w-3.5" /> Created {formatDate(agent.created_at)}</p>
                      {agent.custom_instructions && (
                        <div className="mt-2 rounded-xl border border-line bg-gray-50 p-2.5 dark:bg-gray-25">
                          <p className="text-xs text-gray-600 dark:text-gray-500"><span className="font-medium text-ink">Custom:</span> {agent.custom_instructions}</p>
                        </div>
                      )}
                    </div>
                    <div className="hidden shrink-0 flex-col gap-2 lg:flex lg:w-[140px]">
                      <Button variant="primary" size="sm" className="w-full" onClick={() => setTestingAgent(agent)}>
                        <FiPlay className="h-3.5 w-3.5" /> Test
                      </Button>
                      <Button variant="secondary" size="sm" className="w-full" onClick={() => handleEdit(agent)}>
                        <FiEdit2 className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button variant="danger" size="sm" className="w-full border border-red-200 hover:bg-red-50 dark:border-red-500/30" onClick={() => handleDelete(agent.id)}>
                        <FiTrash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 lg:hidden">
                    <Button variant="primary" size="sm" className="flex-1" onClick={() => setTestingAgent(agent)}>
                      <FiPlay className="h-3.5 w-3.5" /> Test
                    </Button>
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleEdit(agent)}>
                      <FiEdit2 className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="danger" size="sm" className="border border-red-200 hover:bg-red-50 dark:border-red-500/30" onClick={() => handleDelete(agent.id)} aria-label={`Delete ${agent.name}`}>
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ProfileSection>
      </div>

      {testingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-lg rounded-2xl border border-line bg-surface p-5 shadow-s15">
            <button onClick={() => { setTestingAgent(null); setTestMessage(""); setTestResponse(""); }} className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-600" aria-label="Close">
              <FiX className="h-4 w-4" />
            </button>
            <h2 className="text-base font-semibold text-ink">Test {testingAgent.name}</h2>
            <p className="mt-0.5 text-xs text-gray-500">Send a message to see how the agent responds</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Test message</label>
                <textarea rows={3} value={testMessage} onChange={(e) => setTestMessage(e.target.value)} placeholder="e.g. Tell me about your experience with React…" className={`${fieldCls} resize-none`} />
              </div>
              <Button variant="dark" className="w-full" onClick={handleTestAgent} disabled={!testMessage.trim()}>Send test message</Button>
              {testResponse && (
                <div className="rounded-xl border border-line bg-gray-50 p-4 dark:bg-gray-25">
                  <p className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-600">Agent response:</p>
                  <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-600">{testResponse}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </OrgAppShell>
  );
}

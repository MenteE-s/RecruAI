import React, { useCallback, useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems, verifyTokenWithServer } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import { formatDate } from "../../utils/timezone";

export default function AIAgents() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const { showToast } = useToast();

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [testingAgent, setTestingAgent] = useState(null);
  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    description: "",
    system_prompt: "",
    custom_instructions: "",
    is_active: true,
  });
  const [organizationId, setOrganizationId] = useState(null);
  const [orgError, setOrgError] = useState("");

  const fetchAgents = useCallback(async () => {
    if (!organizationId) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/ai-agents`,
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      } else {
        const errorPayload = await response.json().catch(() => null);
        showToast({
          message: errorPayload?.error || "Failed to load AI agents",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      showToast({
        message: "Failed to load AI agents",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [organizationId, showToast]);

  useEffect(() => {
    let isMounted = true;
    const loadOrganization = async () => {
      setLoading(true);
      try {
        const user = await verifyTokenWithServer();
        if (!isMounted) {
          return;
        }
        if (user?.organization_id) {
          setOrganizationId(user.organization_id);
          setOrgError("");
        } else {
          setOrgError(
            "Unable to determine your organization. Please refresh or contact support."
          );
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading organization context:", error);
        if (!isMounted) {
          return;
        }
        setOrgError(
          "Unable to load your organization context. Please try again later."
        );
        setLoading(false);
      }
    };

    loadOrganization();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (organizationId) {
      fetchAgents();
    }
  }, [organizationId, fetchAgents]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const targetOrgId = editingAgent
      ? editingAgent.organization_id
      : organizationId;
    if (!targetOrgId) {
      showToast({
        message:
          "Unable to determine your organization. Please refresh and try again.",
        type: "error",
      });
      return;
    }
    try {
      const url = editingAgent
        ? `/api/ai-agents/${editingAgent.id}`
        : `/api/organizations/${targetOrgId}/ai-agents`;
      const method = editingAgent ? "PUT" : "POST";
      const payload = {
        ...formData,
        system_prompt: formData.system_prompt?.trim(),
      };
      if (!payload.system_prompt) {
        delete payload.system_prompt;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchAgents();
        resetForm();
        showToast({
          message: editingAgent
            ? "AI agent updated successfully!"
            : "AI agent created successfully!",
          type: "success",
        });
      } else {
        showToast({
          message: "Failed to save AI agent",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error saving agent:", error);
      showToast({
        message: "Failed to save AI agent",
        type: "error",
      });
    }
  };

  const handleDelete = async (agentId) => {
    if (!window.confirm("Are you sure you want to delete this AI agent?"))
      return;

    try {
      const response = await fetch(`/api/ai-agents/${agentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        await fetchAgents();
        showToast({
          message: "AI agent deleted successfully",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
      showToast({
        message: "Failed to delete AI agent",
        type: "error",
      });
    }
  };

  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name || "",
      industry: agent.industry || "",
      description: agent.description || "",
      system_prompt: agent.system_prompt || "",
      custom_instructions: agent.custom_instructions || "",
      is_active: agent.is_active ?? true,
    });
    setShowCreateForm(true);
  };

  const handleTestAgent = async () => {
    if (!testingAgent || !testMessage.trim()) return;

    try {
      const response = await fetch(`/api/ai-agents/${testingAgent.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: testMessage }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResponse(data.response);
        showToast({
          message: "Agent test completed",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error testing agent:", error);
      showToast({
        message: "Failed to test agent",
        type: "error",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      industry: "",
      description: "",
      system_prompt: "",
      custom_instructions: "",
      is_active: true,
    });
    setEditingAgent(null);
    setShowCreateForm(false);
  };

  const industries = [
    "Software Engineering",
    "Data Science",
    "Product Management",
    "Marketing",
    "Sales",
    "Design",
    "Finance",
    "Human Resources",
    "Operations",
    "Customer Success",
  ];

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={OrganizationNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      NavbarComponent={OrganizationNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="mb-6">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-yellow-600/90 via-amber-600/80 to-purple-700/70 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">
                AI Interview Agents
              </h1>
              <p className="mt-1 text-white/90">
                Train and customize AI agents for conducting interviews
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-50 font-medium"
            >
              {showCreateForm ? "Cancel" : "+ New AI Agent"}
            </button>
          </div>
        </div>
      </div>

      {orgError && (
        <Card className="mb-6 border-l-4 border-red-400 bg-red-50 text-red-700">
          <p>{orgError}</p>
        </Card>
      )}

      {showCreateForm && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingAgent ? "Edit AI Agent" : "Create New AI Agent"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Senior Software Engineer Interviewer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry *
                </label>
                <select
                  required
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      industry: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Industry</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Brief description of what this agent specializes in..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base System Prompt
              </label>
              <textarea
                rows={4}
                value={formData.system_prompt}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    system_prompt: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Optional instructions describing how this agent should behave (leave blank for a smart default prompt)."
              />
              <p className="text-xs text-gray-400 mt-1">
                Use this to customize the agent's tone, level of detail, or what
                it should prioritize during interviews.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Instructions
              </label>
              <textarea
                rows={4}
                value={formData.custom_instructions}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    custom_instructions: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Specific instructions for this agent (e.g., focus on React experience, emphasize problem-solving, etc.)"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_active: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Agent is active and can conduct interviews
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                {editingAgent ? "Update Agent" : "Create Agent"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your AI Interview Agents</h3>
          <span className="text-sm text-gray-500">{agents.length} agents</span>
        </div>

        {agents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              No AI agents yet. Create your first AI interviewer!
            </p>
            <p className="text-sm text-gray-400">
              AI agents can conduct automated interviews for specific roles and
              industries.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {agent.name}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          agent.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {agent.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{agent.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        🏭 {agent.industry}
                      </span>
                      <span className="flex items-center gap-1">
                        📅 Created {formatDate(agent.created_at)}
                      </span>
                    </div>
                    {agent.custom_instructions && (
                      <div className="bg-purple-50 border-l-4 border-purple-200 p-3 rounded">
                        <p className="text-sm text-purple-800">
                          <strong>Custom Instructions:</strong>{" "}
                          {agent.custom_instructions}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(agent)}
                      className="px-3 py-1 text-purple-600 hover:bg-purple-50 rounded-md text-sm border border-purple-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setTestingAgent(agent)}
                      className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md text-sm border border-blue-200"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => handleDelete(agent.id)}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-md text-sm border border-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Test Agent Modal */}
      {testingAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Test AI Agent: {testingAgent.name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Message
                </label>
                <textarea
                  rows={3}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter a test message to send to the AI agent..."
                />
              </div>

              <button
                onClick={handleTestAgent}
                disabled={!testMessage.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
              >
                Send Test Message
              </button>

              {testResponse && (
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Agent Response:
                  </h4>
                  <p className="text-gray-700">{testResponse}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setTestingAgent(null);
                  setTestMessage("");
                  setTestResponse("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

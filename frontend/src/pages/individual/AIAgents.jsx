import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import {
  getSidebarItems,
  verifyTokenWithServer,
  getBackendUrl,
  getAuthHeaders,
} from "../../utils/auth";
import { formatDate } from "../../utils/timezone";

export default function IndividualAIAgents() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [user, setUser] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    industry: "",
    description: "",
    custom_instructions: "",
  });
  const [saving, setSaving] = useState(false);
  const [startingInterview, setStartingInterview] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const me = await verifyTokenWithServer();
        setUser(me);

        // Load practice AI agents for individual users
        const agentsRes = await fetch(
          `${getBackendUrl()}/api/practice-ai-agents`,
          {
            headers: getAuthHeaders(),
            credentials: "include",
          }
        );
        if (agentsRes.ok) {
          const data = await agentsRes.json();
          setAgents(data);
        } else {
          setError("Failed to load practice AI agents");
        }
      } catch (error) {
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
      const response = await fetch(
        `${getBackendUrl()}/api/practice-ai-agents`,
        {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          credentials: "include",
          body: JSON.stringify(form),
        }
      );

      if (response.ok) {
        const newAgent = await response.json();
        setAgents([newAgent, ...agents]);
        setForm({
          name: "",
          industry: "",
          description: "",
          custom_instructions: "",
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create practice AI agent");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const startPracticeInterview = async (agentId) => {
    setStartingInterview(true);
    setError(null);

    try {
      const response = await fetch(
        `${getBackendUrl()}/api/practice-ai-agents/${agentId}/schedule-practice`,
        {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Redirect to interview room
        window.location.href = `/interview/${data.id}`;
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to start practice interview");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setStartingInterview(false);
    }
  };

  return (
    <DashboardLayout
      NavbarComponent={IndividualNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800">My Practice AI Agents</h3>
          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
            Free Practice Tool
          </span>
        </div>
        <p className="text-gray-600">
          Create and manage personal AI interviewers for practice interviews.
          Available during trial and with active subscriptions.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <Card>
        <form
          onSubmit={createAgent}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input
              className="w-full border rounded p-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Industry</label>
            <input
              className="w-full border rounded p-2"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Description</label>
            <textarea
              className="w-full border rounded p-2"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Custom Instructions</label>
            <textarea
              className="w-full border rounded p-2"
              value={form.custom_instructions}
              onChange={(e) =>
                setForm({ ...form, custom_instructions: e.target.value })
              }
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? "Creating..." : "Create Practice Agent"}
            </button>
          </div>
        </form>
      </Card>

      <div className="mt-6 space-y-4">
        {loading ? (
          <p>Loading...</p>
        ) : agents.length === 0 ? (
          <Card>
            <p>No agents yet.</p>
          </Card>
        ) : (
          agents.map((agent) => (
            <Card key={agent.id}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{agent.name}</h4>
                  <p className="text-sm text-gray-600">{agent.industry}</p>
                  <p className="text-xs text-gray-500">
                    Created {formatDate(agent.created_at)}
                  </p>
                  {agent.description && (
                    <p className="text-sm mt-2">{agent.description}</p>
                  )}
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => startPracticeInterview(agent.id)}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    disabled={startingInterview}
                  >
                    {startingInterview
                      ? "Starting..."
                      : "Start Practice Interview"}
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}

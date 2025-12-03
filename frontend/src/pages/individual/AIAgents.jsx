import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems, verifyTokenWithServer } from "../../utils/auth";
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
  const [form, setForm] = useState({
    name: "",
    industry: "",
    description: "",
    custom_instructions: "",
  });

  useEffect(() => {
    (async () => {
      const me = await verifyTokenWithServer();
      setUser(me);
      if (me?.id) {
        const res = await fetch(`/api/users/${me.id}/ai-agents`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setAgents(data.agents || []);
        }
      }
      setLoading(false);
    })();
  }, []);

  const createAgent = async (e) => {
    e.preventDefault();
    alert("Personal AI agents are coming soon. Stay tuned!");
  };

  return (
    <DashboardLayout
      NavbarComponent={IndividualNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800">Your AI Agents</h3>
          <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
            Coming Soon
          </span>
        </div>
        <p className="text-gray-600">
          Create and manage personal practice interview agents.
        </p>
      </div>

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
              className="px-4 py-2 bg-indigo-600 text-white rounded opacity-60 cursor-not-allowed"
              disabled
            >
              Create Agent
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
              <div className="flex justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{agent.name}</h4>
                  <p className="text-sm text-gray-600">{agent.industry}</p>
                  <p className="text-xs text-gray-500">
                    Created {formatDate(agent.created_at)}
                  </p>
                  {agent.description && (
                    <p className="text-sm mt-2">{agent.description}</p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems, verifyTokenWithServer } from "../../utils/auth";

export default function PracticeDashboard() {
  const navigate = useNavigate();
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const [user, setUser] = useState(null);
  const [duration, setDuration] = useState(15);
  const [title, setTitle] = useState("Practice Interview");
  const [type, setType] = useState("text");
  const location = useLocation();

  useEffect(() => {
    (async () => {
      const me = await verifyTokenWithServer();
      setUser(me);
    })();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const preTitle = params.get("title");
    const preDuration = params.get("duration");
    if (preTitle) setTitle(preTitle);
    if (preDuration) setDuration(Math.max(15, parseInt(preDuration, 10) || 15));
  }, [location.search]);

  const startPractice = async () => {
    // Coming soon placeholder
    alert("Practice sessions are coming soon. Stay tuned!");
  };

  return (
    <DashboardLayout
      NavbarComponent={IndividualNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800">Practice Interview</h3>
          <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
            Coming Soon
          </span>
        </div>
        <p className="text-gray-600">
          Use your personal AI agent to practice. Minimum 15 minutes.
        </p>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input
              className="w-full border rounded p-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Duration (minutes)</label>
            <input
              type="number"
              min={15}
              className="w-full border rounded p-2"
              value={duration}
              onChange={(e) =>
                setDuration(Math.max(15, parseInt(e.target.value || "15", 10)))
              }
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Type</label>
            <select
              className="w-full border rounded p-2"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="text">Text Chat</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              onClick={startPractice}
              className="px-4 py-2 bg-indigo-600 text-white rounded opacity-60 cursor-not-allowed"
              disabled
            >
              Start Practice
            </button>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}

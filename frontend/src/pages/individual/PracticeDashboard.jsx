import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, verifyTokenWithServer } from "../../utils/auth";
import {
  FiTarget,
  FiClock,
  FiMessageSquare,
  FiCpu,
  FiPlay,
  FiAward,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

export default function PracticeDashboard() {
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const [duration, setDuration] = useState(15);
  const [title, setTitle] = useState("Practice Interview");
  const [type, setType] = useState("text");
  const location = useLocation();
  const [user, setUser] = useState(null);

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
    alert("Practice sessions are coming soon. Stay tuned!");
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
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400/30 text-xs font-medium tracking-wide mb-3 text-amber-200">
                <FiAlertCircle className="w-3.5 h-3.5" />
                COMING SOON
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight flex items-center gap-3">
                Practice interview
                <span className="hidden sm:inline-flex text-xs font-medium bg-amber-400 text-gray-900 px-2.5 py-1">Beta</span>
              </h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Sharpen your skills with your personal AI agent. Tailored questions, real-time feedback, minimum 15 minutes.</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 px-2.5 py-1"><FiCpu className="w-3.5 h-3.5" /> AI-powered</span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 px-2.5 py-1"><FiMessageSquare className="w-3.5 h-3.5" /> Text chat</span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 px-2.5 py-1"><FiClock className="w-3.5 h-3.5" /> 15+ min</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[380px]">
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">—</p>
                <p className="text-xs text-gray-300 mt-1">Sessions</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">—</p>
                <p className="text-xs text-gray-300 mt-1">Avg score</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{duration}m</p>
                <p className="text-xs text-gray-300 mt-1">Selected</p>
              </div>
              <div className="col-span-3 bg-amber-400 text-gray-900 p-3 flex items-center gap-2">
                <FiAlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-sm font-medium">Practice mode is in preview — full launch coming soon.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiTarget className="w-4 h-4 text-gray-500" /> Session setup</h2>
            <p className="text-sm text-gray-500 mt-1">Configure your practice session. You can start with defaults and adjust later.</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Session title</label>
                <div className="relative">
                  <FiTarget className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Frontend interview — React fundamentals"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Duration (minutes) — min 15</label>
                <div className="relative">
                  <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    min={15}
                    value={duration}
                    onChange={(e) => setDuration(Math.max(15, parseInt(e.target.value || "15", 10)))}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Recommended: 15–30m for focused practice.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Interview type</label>
                <div className="relative">
                  <FiMessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white appearance-none">
                    <option value="text">Text chat — AI interviewer</option>
                    <option value="ai_video" disabled>AI video (coming soon)</option>
                    <option value="human_video" disabled>Human video (coming soon)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button onClick={startPractice} disabled className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium opacity-60 cursor-not-allowed">
                <FiPlay className="w-4 h-4" /> Start practice
              </button>
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2"><FiAlertCircle className="w-3.5 h-3.5" /> Coming soon — button will be enabled at launch</span>
            </div>

            {user && (
              <p className="text-xs text-gray-500 mt-4">Signed in as <span className="font-medium text-gray-700">{user.email || user.name || "you"}</span> • {user.role || role}</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-600 text-white p-6">
            <h3 className="text-sm font-semibold flex items-center gap-2"><FiAward className="w-4 h-4" /> Why practice here?</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-blue-50">
              <li className="flex gap-2"><FiCheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-200" />Realistic AI questions tailored to your profile</li>
              <li className="flex gap-2"><FiCheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-200" />Instant feedback on communication & technical depth</li>
              <li className="flex gap-2"><FiCheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-200" />Track progress over time in analytics</li>
            </ul>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiTrendingUp className="w-4 h-4 text-gray-500" /> How it will work</h3>
            <ol className="mt-3 space-y-2 text-sm text-gray-600 list-decimal list-inside">
              <li>Set title & duration, choose type</li>
              <li>Chat with your AI interviewer in real time</li>
              <li>Get scored feedback + improvement tips</li>
            </ol>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

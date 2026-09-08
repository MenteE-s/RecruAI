import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { FiUsers, FiBarChart2, FiBriefcase, FiBell, FiFileText, FiMessageSquare, FiTrendingUp } from "react-icons/fi";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function OrganizationDashboard() {
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ team_members: 0, open_requisitions: 0, pipeline: 0, new_applications: 0 });
  const [analytics, setAnalytics] = useState({ total_posts: 0, total_interviews: 0, active_posts: 0, applications_by_status: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    fetchDashboardStats();
    fetchAnalyticsOverview();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/auth/me`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) setUser((await res.json()).user);
    } catch {}
  };
  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/dashboard/stats`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) setStats(await res.json());
    } catch {}
  };
  const fetchAnalyticsOverview = async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/analytics/overview`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) setAnalytics(await res.json());
    } catch {}
    finally { setLoading(false); }
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
              <p className="text-sm text-blue-200">Welcome back{user?.name ? `, ${user.name}` : ""} 👋</p>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight mt-1">{user?.organization ? `${user.organization}` : "Organization dashboard"}</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Manage your team, requisitions, and hiring pipeline.</p>
              <div className="mt-4 hidden md:flex gap-2">
                <button className="px-4 py-2 bg-white text-gray-900 text-sm font-medium hover:bg-gray-100 transition-colors">Invite members</button>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">New campaign</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[380px]">
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{stats.pipeline}</p>
                <p className="text-xs text-gray-300 mt-1">Pipeline</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{stats.open_requisitions}</p>
                <p className="text-xs text-gray-300 mt-1">Open reqs</p>
              </div>
              <div className="bg-blue-500/20 backdrop-blur border border-blue-400/20 p-4 text-center">
                <p className="text-2xl font-bold text-blue-200">{stats.new_applications}</p>
                <p className="text-xs text-blue-200 mt-1">New apps</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { title: "New applications", value: stats.new_applications, change: stats.new_applications ? "Review now" : "All caught up", icon: FiBell },
          { title: "Team members", value: stats.team_members, change: "+8%", icon: FiUsers },
          { title: "Open reqs", value: stats.open_requisitions, change: "-2", icon: FiBriefcase },
          { title: "Pipeline", value: stats.pipeline, change: "+12%", icon: FiBarChart2 },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center"><Icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xl font-bold text-gray-900">{loading ? "—" : card.value}</p>
                <p className="text-xs text-gray-500">{card.title}</p>
                <p className="text-xs text-blue-600 mt-0.5">{card.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {[
          { title: "Total posts", value: analytics.total_posts, icon: FiFileText },
          { title: "Total interviews", value: analytics.total_interviews, icon: FiMessageSquare },
          { title: "Active posts", value: analytics.active_posts, icon: FiTrendingUp },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 border border-blue-100 flex items-center justify-center"><Icon className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-xl font-bold text-gray-900">{loading ? "—" : card.value}</p>
                <p className="text-xs text-gray-500">{card.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900">Applications by status</h3>
        <div className="mt-6 h-64 flex items-center justify-center">
          {loading ? (
            <div className="animate-spin h-8 w-8 border-2 border-gray-200 border-t-blue-600 rounded-full" />
          ) : Object.keys(analytics.applications_by_status).length === 0 ? (
            <p className="text-sm text-gray-500">No application data yet</p>
          ) : (
            <Doughnut
              data={{
                labels: Object.keys(analytics.applications_by_status),
                datasets: [{ data: Object.values(analytics.applications_by_status), backgroundColor: ["#2563eb", "#f59e0b", "#ef4444", "#6b7280"], borderWidth: 2, borderColor: "#fff" }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "bottom", labels: { padding: 16, usePointStyle: true, color: "#6b7280", font: { size: 11 } } },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => {
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        const pct = total ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                        return `${ctx.label}: ${ctx.parsed} (${pct}%)`;
                      },
                    },
                  },
                },
              }}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";
import {
  FiUsers,
  FiBarChart2,
  FiBriefcase,
  FiStar,
  FiBell,
  FiFileText,
  FiMessageSquare,
  FiTrendingUp,
} from "react-icons/fi";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function OrganizationDashboard() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    team_members: 0,
    open_requisitions: 0,
    pipeline: 0,
    new_applications: 0,
  });
  const [analytics, setAnalytics] = useState({
    total_posts: 0,
    total_interviews: 0,
    active_posts: 0,
    applications_by_status: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    fetchDashboardStats();
    fetchAnalyticsOverview();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const fetchAnalyticsOverview = async () => {
    try {
      const response = await fetch("/api/analytics/overview");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      NavbarComponent={OrganizationNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="mb-6">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-yellow-600/90 via-amber-600/80 to-purple-700/70 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">
                Welcome back{user?.name ? `, ${user.name}` : ""}!
              </h1>
              <p className="mt-1 text-white/90">
                {user?.organization
                  ? `${user.organization} Dashboard`
                  : "Organization Dashboard"}{" "}
                - Manage your team and hiring pipeline.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm">
                Invite members
              </button>
              <button className="px-4 py-2 bg-white text-amber-600 rounded font-semibold">
                New Campaign
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="New Applications"
          value={loading ? "..." : stats.new_applications.toString()}
          change={stats.new_applications > 0 ? "Review now" : "All caught up"}
          icon={FiBell}
          trend={stats.new_applications > 0 ? "up" : "neutral"}
          variant="gradient"
        />
        <StatCard
          title="Team Members"
          value={loading ? "..." : stats.team_members.toString()}
          change="+8%"
          icon={FiUsers}
          trend="up"
          variant="gradient"
        />
        <StatCard
          title="Open Reqs"
          value={loading ? "..." : stats.open_requisitions.toString()}
          change="-2"
          icon={FiBriefcase}
          trend="down"
          variant="gradient"
        />
        <StatCard
          title="Pipeline"
          value={loading ? "..." : stats.pipeline.toString()}
          change="+12%"
          icon={FiBarChart2}
          trend="up"
          variant="gradient"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Posts"
          value={loading ? "..." : analytics.total_posts.toString()}
          change="All time"
          icon={FiFileText}
          trend="neutral"
          variant="gradient"
        />
        <StatCard
          title="Total Interviews"
          value={loading ? "..." : analytics.total_interviews.toString()}
          change="All time"
          icon={FiMessageSquare}
          trend="neutral"
          variant="gradient"
        />
        <StatCard
          title="Active Posts"
          value={loading ? "..." : analytics.active_posts.toString()}
          change="Currently open"
          icon={FiTrendingUp}
          trend="neutral"
          variant="gradient"
        />
      </div>

      <Card bgOpacity="95" shadow="lg" className="mb-8">
        <h3 className="font-semibold text-secondary-800 mb-4">
          Applications by Status
        </h3>
        <div className="h-64 flex items-center justify-center">
          {loading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          ) : (
            <Doughnut
              data={{
                labels: Object.keys(analytics.applications_by_status),
                datasets: [
                  {
                    data: Object.values(analytics.applications_by_status),
                    backgroundColor: [
                      "#10B981", // green for accepted
                      "#F59E0B", // yellow for pending
                      "#EF4444", // red for rejected
                      "#6B7280", // gray for reviewed
                    ],
                    borderWidth: 2,
                    borderColor: "#ffffff",
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      padding: 20,
                      usePointStyle: true,
                    },
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const label = context.label || "";
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce(
                          (a, b) => a + b,
                          0
                        );
                        const percentage =
                          total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                      },
                    },
                  },
                },
              }}
            />
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}

// src/pages/Dashboard.jsx
import DashboardLayout from "../components/layout/DashboardLayout";
import StatCard from "../components/ui/StatCard";
import Card from "../components/ui/Card";
import {
  FiUsers,
  FiActivity,
  FiTrendingUp,
  FiDollarSign,
} from "react-icons/fi";

export default function Dashboard() {
  return (
    <DashboardLayout>
      {/* Top hero summary */}
      <div className="mb-6">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-600/80 via-purple-600/60 to-cyan-500/60 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">
                Dashboard
              </h1>
              <p className="mt-1 text-white/90">
                Welcome back — here's what's happening.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm">
                Invite team
              </button>
              <button className="px-4 py-2 bg-white text-primary-700 rounded font-semibold">
                Create job
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value="2,847"
          change="12.5% from last month"
          icon={FiUsers}
          trend="up"
        />
        <StatCard
          title="Active Sessions"
          value="1,204"
          change="3.2% decrease"
          icon={FiActivity}
          trend="down"
        />
        <StatCard
          title="Revenue"
          value="$24,580"
          change="8.7% increase"
          icon={FiDollarSign}
          trend="up"
        />
        <StatCard
          title="Conversion Rate"
          value="4.32%"
          change="0.8% up"
          icon={FiTrendingUp}
          trend="up"
        />
      </div>

      {/* Charts or other content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-secondary-800 mb-4">User Growth</h3>
          <div className="h-64 bg-secondary-50 rounded-lg flex items-center justify-center text-secondary-400">
            {/* Replace with actual chart */}
            Line Chart Placeholder
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold text-secondary-800 mb-4">
            Top Products
          </h3>
          <div className="h-64 bg-secondary-50 rounded-lg flex items-center justify-center text-secondary-400">
            Bar Chart Placeholder
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

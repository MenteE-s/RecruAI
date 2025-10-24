import DashboardLayout from "../../../components/layout/individual/DashboardLayout";
import StatCard from "../../../components/ui/individual/StatCard";
import Card from "../../../components/ui/individual/Card";
import {
  FiUsers,
  FiActivity,
  FiTrendingUp,
  FiDollarSign,
} from "react-icons/fi";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-600/80 via-purple-600/60 to-cyan-500/60 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">
                Your Dashboard
              </h1>
              <p className="mt-1 text-white/90">
                Personal activity and summaries just for you.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Profile Views"
          value="1,204"
          change="2.4%"
          icon={FiUsers}
          trend="up"
        />
        <StatCard
          title="Interviews"
          value="32"
          change="-1"
          icon={FiActivity}
          trend="down"
        />
        <StatCard
          title="Offers"
          value="3"
          change="+50%"
          icon={FiTrendingUp}
          trend="up"
        />
        <StatCard
          title="Earnings"
          value="$1,240"
          change="+5%"
          icon={FiDollarSign}
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-secondary-800 mb-4">
            Recent Activity
          </h3>
          <div className="h-64 bg-secondary-50 rounded-lg flex items-center justify-center text-secondary-400">
            Recent events placeholder
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold text-secondary-800 mb-4">Saved Jobs</h3>
          <div className="h-64 bg-secondary-50 rounded-lg flex items-center justify-center text-secondary-400">
            Saved jobs placeholder
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

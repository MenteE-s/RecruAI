import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";
import { FiUsers, FiBarChart2, FiBriefcase, FiStar } from "react-icons/fi";

export default function OrganizationDashboard() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

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
                Organization Dashboard
              </h1>
              <p className="mt-1 text-white/90">
                Premium organization insights and team management.
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
          title="Team Members"
          value="128"
          change="+8%"
          icon={FiUsers}
          trend="up"
          variant="gradient"
        />
        <StatCard
          title="Open Reqs"
          value="14"
          change="-2"
          icon={FiBriefcase}
          trend="down"
          variant="gradient"
        />
        <StatCard
          title="Pipeline"
          value="342"
          change="+12%"
          icon={FiBarChart2}
          trend="up"
          variant="gradient"
        />
        <StatCard
          title="Premium Score"
          value="92"
          change="+1"
          icon={FiStar}
          trend="up"
          variant="gradient"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card bgOpacity="95" shadow="lg">
          <h3 className="font-semibold text-secondary-800 mb-4">
            Hiring Funnel
          </h3>
          <div className="h-64 bg-secondary-50 rounded-lg flex items-center justify-center text-secondary-400">
            Funnel chart placeholder
          </div>
        </Card>
        <Card bgOpacity="95" shadow="lg">
          <h3 className="font-semibold text-secondary-800 mb-4">
            Top Candidates
          </h3>
          <div className="h-64 bg-secondary-50 rounded-lg flex items-center justify-center text-secondary-400">
            Candidates placeholder
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

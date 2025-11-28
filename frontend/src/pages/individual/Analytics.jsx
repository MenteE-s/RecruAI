import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";

export default function Analytics() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  return (
    <DashboardLayout
      NavbarComponent={IndividualNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Track your interview performance and career progress.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <h3 className="font-semibold text-gray-800 mb-2">Total Interviews</h3>
          <p className="text-3xl font-bold text-blue-600">24</p>
          <p className="text-sm text-gray-500">+12% from last month</p>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 mb-2">Success Rate</h3>
          <p className="text-3xl font-bold text-green-600">75%</p>
          <p className="text-sm text-gray-500">+5% from last month</p>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 mb-2">
            Applications Sent
          </h3>
          <p className="text-3xl font-bold text-purple-600">156</p>
          <p className="text-sm text-gray-500">+8% from last month</p>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 mb-2">Profile Views</h3>
          <p className="text-3xl font-bold text-orange-600">1,204</p>
          <p className="text-sm text-gray-500">+15% from last month</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">
            Interview Performance Trend
          </h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
            Chart placeholder - Interview success over time
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">
            Skills Improvement
          </h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
            Chart placeholder - Skills growth tracking
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

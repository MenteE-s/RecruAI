import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";

export default function JobAlerts() {
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
        <h1 className="text-3xl font-bold text-gray-900">Job Alerts</h1>
        <p className="text-gray-600 mt-2">
          Get notified about new job opportunities matching your preferences.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">
              Software Engineer - Remote
            </h3>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              New
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-2">
            TechCorp Inc. • San Francisco, CA
          </p>
          <p className="text-gray-500 text-sm">Posted 2 hours ago</p>
          <div className="mt-4 flex space-x-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              View Job
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              Save
            </button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Frontend Developer</h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Hot
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-2">
            StartupXYZ • New York, NY
          </p>
          <p className="text-gray-500 text-sm">Posted 1 day ago</p>
          <div className="mt-4 flex space-x-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              View Job
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              Save
            </button>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Alert Settings</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Email notifications</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Push notifications</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Weekly summary</span>
              <input type="checkbox" className="rounded" />
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

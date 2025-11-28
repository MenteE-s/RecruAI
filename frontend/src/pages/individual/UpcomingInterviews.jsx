import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";

export default function UpcomingInterviews() {
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
        <p className="text-gray-600">
          Your scheduled interviews and preparation materials.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">
                Software Engineer Interview
              </h3>
              <p className="text-gray-600 text-sm">
                TechCorp Inc. • Tomorrow at 2:00 PM
              </p>
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Join Meeting
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                Prepare
              </button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">
                Product Manager Interview
              </h3>
              <p className="text-gray-600 text-sm">
                StartupXYZ • Friday at 10:00 AM
              </p>
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Join Meeting
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                Prepare
              </button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

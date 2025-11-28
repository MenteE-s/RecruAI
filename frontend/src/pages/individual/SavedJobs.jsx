import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";

export default function SavedJobs() {
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
          Jobs you've saved for later application.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">
                Senior Software Engineer
              </h3>
              <p className="text-gray-600 text-sm">
                Google • Mountain View, CA
              </p>
              <p className="text-gray-500 text-sm mt-1">Saved 3 days ago</p>
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Apply Now
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                Remove
              </button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">
                Full Stack Developer
              </h3>
              <p className="text-gray-600 text-sm">Meta • Menlo Park, CA</p>
              <p className="text-gray-500 text-sm mt-1">Saved 1 week ago</p>
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Apply Now
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                Remove
              </button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

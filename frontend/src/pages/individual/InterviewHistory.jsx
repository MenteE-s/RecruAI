import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";

export default function InterviewHistory() {
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
          Review your past interviews and feedback.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">
                Frontend Developer Interview
              </h3>
              <p className="text-gray-600 text-sm">
                WebSolutions Inc. • Completed on Jan 15, 2024
              </p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Passed
              </span>
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              View Details
            </button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">
                Full Stack Developer Interview
              </h3>
              <p className="text-gray-600 text-sm">
                TechStart • Completed on Jan 10, 2024
              </p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Pending Review
              </span>
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              View Details
            </button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

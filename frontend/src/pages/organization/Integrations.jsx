import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";

export default function Integrations() {
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
        <div className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display text-gray-900">
                Integrations
              </h1>
              <p className="mt-1 text-gray-500">
                Connect your tools and services
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Third-party Integrations
          </h3>
          <p className="text-gray-500">
            This feature is coming soon. You'll be able to integrate with
            popular HR tools, calendars, and communication platforms here.
          </p>
        </div>
      </Card>
    </DashboardLayout>
  );
}

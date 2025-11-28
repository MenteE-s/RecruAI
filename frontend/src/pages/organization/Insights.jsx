import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";

export default function Insights() {
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
        <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-600/80 via-purple-600/60 to-cyan-500/60 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">
                AI Insights
              </h1>
              <p className="mt-1 text-white/90">
                AI-powered recommendations for better hiring
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            AI-Powered Insights
          </h3>
          <p className="text-gray-500">
            This feature is coming soon. You'll be able to access AI-driven
            insights and recommendations for your recruitment process here.
          </p>
        </div>
      </Card>
    </DashboardLayout>
  );
}

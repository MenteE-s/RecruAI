import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";

export default function ResumeBuilder() {
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
        <h1 className="text-3xl font-bold text-gray-900">Resume Builder</h1>
        <p className="text-gray-600 mt-2">
          Create and optimize your professional resume with AI assistance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <h3 className="font-semibold text-gray-800 mb-4">Resume Editor</h3>
            <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
              Resume editor interface placeholder
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-gray-800 mb-4">Templates</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-3 border rounded hover:bg-gray-50">
                Modern Template
              </button>
              <button className="w-full text-left p-3 border rounded hover:bg-gray-50">
                Classic Template
              </button>
              <button className="w-full text-left p-3 border rounded hover:bg-gray-50">
                Creative Template
              </button>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-800 mb-4">AI Suggestions</h3>
            <div className="text-sm text-gray-600">
              <p>• Add more quantifiable achievements</p>
              <p>• Include relevant keywords for tech roles</p>
              <p>• Consider adding a summary section</p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

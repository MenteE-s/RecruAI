import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";

export default function CareerCoaching() {
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
        <h1 className="text-3xl font-bold text-gray-900">Career Coaching</h1>
        <p className="text-gray-600 mt-2">
          Get personalized career guidance and development plans.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">
            Your Career Coach
          </h3>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👨‍💼</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Sarah Johnson</h4>
              <p className="text-gray-600 text-sm">Senior Career Coach</p>
              <p className="text-gray-500 text-sm">15+ years experience</p>
            </div>
          </div>
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Schedule Session
          </button>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">
            Upcoming Sessions
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-900">Resume Review</p>
                <p className="text-sm text-gray-600">Tomorrow at 3:00 PM</p>
              </div>
              <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                Join
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-900">
                  Interview Preparation
                </p>
                <p className="text-sm text-gray-600">Friday at 2:00 PM</p>
              </div>
              <button className="px-3 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50">
                Reschedule
              </button>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">
            Career Development Plan
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm">✓</span>
              </div>
              <span className="text-sm text-gray-700">
                Complete skills assessment
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm">○</span>
              </div>
              <span className="text-sm text-gray-700">
                Update resume with new achievements
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-sm">○</span>
              </div>
              <span className="text-sm text-gray-700">
                Practice technical interviews
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">
            Recommended Resources
          </h3>
          <div className="space-y-2">
            <a href="#" className="block p-3 border rounded hover:bg-gray-50">
              <p className="font-medium text-gray-900">
                System Design Interview Guide
              </p>
              <p className="text-sm text-gray-600">
                Master complex system design questions
              </p>
            </a>
            <a href="#" className="block p-3 border rounded hover:bg-gray-50">
              <p className="font-medium text-gray-900">
                Leadership Communication Skills
              </p>
              <p className="text-sm text-gray-600">
                Improve your presentation and leadership skills
              </p>
            </a>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

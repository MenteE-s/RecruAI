import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";
import TimezoneSelector from "../../components/ui/TimezoneSelector";

export default function Settings() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Fetch current user ID
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUserId(data.id);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  return (
    <DashboardLayout
      NavbarComponent={IndividualNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="mb-6">
        <p className="text-gray-600">
          Manage your account, billing, and preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Current Plan */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Current Plan</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-gray-900 capitalize">
                {plan || "Trial"} Plan
              </p>
              <p className="text-gray-600 text-sm">
                {plan === "trial"
                  ? "Limited features with full access to core interview tools"
                  : "Full access to all premium features and analytics"}
              </p>
            </div>
            {plan === "trial" && (
              <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Upgrade to Pro
              </button>
            )}
          </div>
        </Card>

        {/* Plan Comparison */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Available Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`border rounded-lg p-4 ${
                plan === "trial"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200"
              }`}
            >
              <h4 className="font-medium text-gray-900">Trial Plan</h4>
              <p className="text-2xl font-bold text-gray-900 mt-2">Free</p>
              <ul className="text-sm text-gray-600 mt-3 space-y-1">
                <li>• Profile management</li>
                <li>• Interview scheduling</li>
                <li>• Basic job tracking</li>
                <li>• Limited analytics</li>
              </ul>
              {plan === "trial" && (
                <span className="inline-block mt-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  Current Plan
                </span>
              )}
            </div>

            <div
              className={`border rounded-lg p-4 ${
                plan === "pro"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <h4 className="font-medium text-gray-900">Pro Plan</h4>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                $9.99<span className="text-sm font-normal">/month</span>
              </p>
              <ul className="text-sm text-gray-600 mt-3 space-y-1">
                <li>• Everything in Trial</li>
                <li>• Advanced analytics</li>
                <li>• Resume builder</li>
                <li>• Job alerts</li>
                <li>• Career coaching</li>
              </ul>
              {plan === "pro" ? (
                <span className="inline-block mt-3 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  Current Plan
                </span>
              ) : (
                <button className="mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                  Upgrade
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Payment Methods</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                  <span className="text-blue-600 text-sm">💳</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    •••• •••• •••• 4242
                  </p>
                  <p className="text-sm text-gray-600">Expires 12/25</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Edit
                </button>
                <button className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50">
                  Remove
                </button>
              </div>
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              + Add Payment Method
            </button>
          </div>
        </Card>

        {/* Billing History */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Billing History</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium text-gray-900">Pro Plan - Monthly</p>
                <p className="text-sm text-gray-600">November 1, 2024</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">$9.99</p>
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  Download
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium text-gray-900">Pro Plan - Monthly</p>
                <p className="text-sm text-gray-600">October 1, 2024</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">$9.99</p>
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  Download
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Account Preferences */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">
            Account Preferences
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">
                  Receive updates about your account and interviews
                </p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Marketing Emails</p>
                <p className="text-sm text-gray-600">
                  Receive tips and product updates
                </p>
              </div>
              <input type="checkbox" className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Data Analytics</p>
                <p className="text-sm text-gray-600">
                  Help improve our service with usage analytics
                </p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
          </div>
        </Card>

        {/* Timezone Settings */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">
            Timezone Settings
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Set your timezone to ensure interview times are displayed correctly.
          </p>
          <TimezoneSelector userId={userId} showCurrentTime={true} />
        </Card>

        {/* Danger Zone */}
        <Card>
          <h3 className="font-semibold text-red-800 mb-4">Danger Zone</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-red-200 rounded">
              <div>
                <p className="font-medium text-gray-900">Cancel Subscription</p>
                <p className="text-sm text-gray-600">
                  End your subscription and downgrade to trial plan
                </p>
              </div>
              <button className="px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50">
                Cancel
              </button>
            </div>
            <div className="flex items-center justify-between p-3 border border-red-200 rounded">
              <div>
                <p className="font-medium text-gray-900">Delete Account</p>
                <p className="text-sm text-gray-600">
                  Permanently delete your account and all data
                </p>
              </div>
              <button className="px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50">
                Delete
              </button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

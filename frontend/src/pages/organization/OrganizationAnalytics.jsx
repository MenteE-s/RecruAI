import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";

export default function OrganizationAnalytics() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics/overview");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={OrganizationNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

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
                Organization Analytics
              </h1>
              <p className="mt-1 text-white/90">
                Insights into your recruitment performance
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">
              {analytics?.total_posts || 0}
            </div>
            <div className="text-sm text-gray-600">Total Job Posts</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {analytics?.total_applications || 0}
            </div>
            <div className="text-sm text-gray-600">Total Applications</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {analytics?.total_interviews || 0}
            </div>
            <div className="text-sm text-gray-600">Total Interviews</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {analytics?.active_posts || 0}
            </div>
            <div className="text-sm text-gray-600">Active Posts</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Applications by Status</h3>
          <div className="space-y-3">
            {analytics?.applications_by_status &&
              Object.entries(analytics.applications_by_status).map(
                ([status, count]) => (
                  <div
                    key={status}
                    className="flex justify-between items-center"
                  >
                    <span className="capitalize text-gray-700">{status}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{
                            width: `${
                              analytics.total_applications > 0
                                ? (count / analytics.total_applications) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                )
              )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Posts by Category</h3>
          <div className="space-y-3">
            {analytics?.posts_by_category &&
              Object.entries(analytics.posts_by_category).map(
                ([category, count]) => (
                  <div
                    key={category}
                    className="flex justify-between items-center"
                  >
                    <span className="text-gray-700">{category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${
                              analytics.total_posts > 0
                                ? (count / analytics.total_posts) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                )
              )}
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Recruitment Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {analytics?.total_applications && analytics?.total_posts
                  ? (
                      analytics.total_applications / analytics.total_posts
                    ).toFixed(1)
                  : 0}
              </div>
              <div className="text-sm text-gray-600">
                Avg Applications per Post
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics?.applications_by_status?.accepted &&
                analytics?.total_applications
                  ? (
                      (analytics.applications_by_status.accepted /
                        analytics.total_applications) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-600">Acceptance Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics?.total_interviews && analytics?.total_applications
                  ? (
                      (analytics.total_interviews /
                        analytics.total_applications) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-600">Interview Rate</div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";

export default function Reports() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Get organization ID from user context (placeholder for now)
      const orgId = 1; // TODO: Get from user context
      const response = await fetch(`/api/organizations/${orgId}/analytics`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        setError("Failed to load analytics data");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError("Network error. Please try again.");
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
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Loading analytics...</div>
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
                Interview Analytics
              </h1>
              <p className="mt-1 text-white/90">
                Comprehensive insights into your recruitment performance
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {analytics && analytics.total_interviews_analyzed === 0 ? (
        <Card>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Interview Data Available
            </h3>
            <p className="text-gray-500">
              Complete some interviews and generate analysis to see performance
              insights here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics?.total_interviews_analyzed || 0}
                </div>
                <div className="text-sm text-gray-600">Interviews Analyzed</div>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analytics?.average_scores?.overall?.toFixed(1) || "0.0"}
                </div>
                <div className="text-sm text-gray-600">Avg Overall Score</div>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analytics?.pass_rate?.toFixed(1) || "0.0"}%
                </div>
                <div className="text-sm text-gray-600">Pass Rate</div>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analytics?.average_scores?.communication?.toFixed(1) ||
                    "0.0"}
                </div>
                <div className="text-sm text-gray-600">Avg Communication</div>
              </div>
            </Card>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Average Scores by Category
              </h3>
              <div className="space-y-3">
                {analytics?.average_scores &&
                  Object.entries(analytics.average_scores).map(
                    ([category, score]) => (
                      <div
                        key={category}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {category.replace("_", " ")}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(score / 100) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 w-8">
                            {score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )
                  )}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Strengths
              </h3>
              <div className="space-y-2">
                {analytics?.top_strengths
                  ?.slice(0, 5)
                  .map((strength, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-700">
                        {strength.skill}
                      </span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {strength.count} mentions
                      </span>
                    </div>
                  )) || (
                  <p className="text-sm text-gray-500">
                    No strength data available
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Common Improvements */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Areas for Improvement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics?.common_improvements
                ?.slice(0, 6)
                .map((improvement, index) => (
                  <div key={index} className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-orange-800">
                        {improvement.area}
                      </span>
                      <span className="text-xs bg-orange-200 text-orange-700 px-2 py-1 rounded-full">
                        {improvement.count} mentions
                      </span>
                    </div>
                    <div className="w-full bg-orange-200 rounded-full h-1">
                      <div
                        className="bg-orange-600 h-1 rounded-full"
                        style={{
                          width: `${Math.min(
                            (improvement.count / 10) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )) || (
                <div className="col-span-full text-center py-4">
                  <p className="text-sm text-gray-500">
                    No improvement data available
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Analyses */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Interview Analyses
            </h3>
            <div className="space-y-4">
              {analytics?.analytics?.slice(0, 5).map((analysis) => (
                <div key={analysis.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      Interview #{analysis.interview_id}
                    </span>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Score: {analysis.overall_score?.toFixed(1) || "N/A"}
                    </span>
                  </div>
                  {analysis.ai_analysis_summary && (
                    <p className="text-sm text-gray-600 mb-2">
                      {analysis.ai_analysis_summary}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {analysis.strengths?.slice(0, 3).map((strength, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              )) || (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent analyses available
                </p>
              )}
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}

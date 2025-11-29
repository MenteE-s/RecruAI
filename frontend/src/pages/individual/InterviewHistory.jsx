import { useState, useEffect } from "react";
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

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInterviewHistory = async () => {
      try {
        const response = await fetch("/api/interviews/history", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setInterviews(data.interviews);
        } else {
          setError("Failed to load interview history");
        }
      } catch (error) {
        console.error("Error fetching interview history:", error);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchInterviewHistory();
  }, []);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status, rating) => {
    switch (status) {
      case "completed":
        if (rating >= 4) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Passed
            </span>
          );
        } else if (rating >= 2) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Conditional
            </span>
          );
        } else {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Not Selected
            </span>
          );
        }
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Cancelled
          </span>
        );
      case "no_show":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            No Show
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {status}
          </span>
        );
    }
  };

  const getInterviewTypeIcon = (type) => {
    switch (type) {
      case "text":
        return "💬";
      case "ai_video":
        return "🤖";
      case "human_video":
        return "👥";
      case "video":
        return "";
      case "phone":
        return "📞";
      case "in-person":
        return "🏢";
      default:
        return "📅";
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={IndividualNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Loading interview history...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      NavbarComponent={IndividualNavbar}
      sidebarItems={sidebarItems}
    >
      {/* Error Message */}
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

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Interview History</h1>
        <p className="text-gray-600 mt-1">
          Review your past interviews and feedback.
        </p>
      </div>

      <div className="space-y-6">
        {interviews.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No interview history
              </h3>
              <p className="text-gray-600">
                You haven't completed any interviews yet.
              </p>
            </div>
          </Card>
        ) : (
          interviews.map((interview) => (
            <Card key={interview.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">
                      {getInterviewTypeIcon(interview.interview_type)}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {interview.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {interview.organization} •{" "}
                        {formatDateTime(interview.scheduled_at)}
                      </p>
                      {interview.post_title && (
                        <p className="text-xs text-blue-600 mt-1">
                          Position: {interview.post_title}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mb-3">
                    {getStatusBadge(interview.status, interview.rating)}
                    {interview.rating && (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 mr-1">
                          Rating:
                        </span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-sm ${
                                star <= interview.rating
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {interview.feedback && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        Interview Feedback
                      </h4>
                      <p className="text-sm text-gray-700">
                        {interview.feedback}
                      </p>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                    View Details
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}

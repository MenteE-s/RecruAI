import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";
import { formatDateTime, getRelativeTime } from "../../utils/timezone";

export default function UpcomingInterviews() {
  const navigate = useNavigate();
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    const fetchUpcomingInterviews = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/interviews/upcoming",
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          setInterviews(data.interviews);
        } else {
          setError("Failed to load upcoming interviews");
        }
      } catch (error) {
        console.error("Error fetching interviews:", error);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingInterviews();
  }, []);

  const getInterviewTypeIcon = (type) => {
    switch (type) {
      case "text":
        return "💬";
      case "ai_video":
        return "🤖";
      case "human_video":
        return "👥";
      case "video":
        return "📹";
      case "phone":
        return "📞";
      case "in-person":
        return "🏢";
      default:
        return "📅";
    }
  };

  const getStatusBadge = (interview) => {
    const now = new Date();
    const scheduledTime = new Date(
      interview.scheduled_at_iso || interview.scheduled_at
    );
    const timeDiff = scheduledTime - now;
    const minutesDiff = timeDiff / (1000 * 60);

    if (interview.status === "completed") {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          Completed
        </span>
      );
    } else if (interview.status === "cancelled") {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
          Cancelled
        </span>
      );
    } else if (minutesDiff < 0) {
      return (
        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full animate-pulse">
          In Progress
        </span>
      );
    } else if (minutesDiff <= 15) {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full animate-pulse">
          Starting Soon
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
          Scheduled
        </span>
      );
    }
  };

  const canJoinInterview = (interview) => {
    const scheduledAt = interview.scheduled_at_iso || interview.scheduled_at;
    if (!scheduledAt) return false;

    // Get current time in UTC
    const nowUTC = new Date();

    // Parse scheduled time as UTC
    const scheduledTime = new Date(
      scheduledAt + (scheduledAt.includes("Z") ? "" : "Z")
    ); // Ensure UTC
    const timeDiff = scheduledTime - nowUTC;
    const minutesDiff = timeDiff / (1000 * 60);

    // Can join 15 minutes before and during the interview
    return minutesDiff <= 15 && minutesDiff >= -interview.duration_minutes;
  };

  const getJoinButtonText = (interview) => {
    const scheduledAt = interview.scheduled_at_iso || interview.scheduled_at;
    if (!scheduledAt) return "Unknown";

    // Get current time in UTC
    const nowUTC = new Date();

    // Parse scheduled time as UTC
    const scheduledTime = new Date(
      scheduledAt + (scheduledAt.includes("Z") ? "" : "Z")
    ); // Ensure UTC
    const timeDiff = scheduledTime - nowUTC;
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff > 15) {
      return "Scheduled"; // More than 15 minutes away
    } else if (minutesDiff > 0) {
      return `Join in ${Math.ceil(minutesDiff)} min`;
    } else if (minutesDiff >= -interview.duration_minutes) {
      return "Join Now";
    } else {
      return "Interview Ended";
    }
  };

  // Filtering logic
  const filteredInterviews = interviews.filter((interview) => {
    if (!filterText) return true;
    const text = filterText.toLowerCase();
    return (
      interview.id?.toString().includes(text) ||
      interview.title?.toLowerCase().includes(text)
    );
  });

  return (
    <>
      {loading ? (
        <DashboardLayout
          NavbarComponent={IndividualNavbar}
          sidebarItems={sidebarItems}
        >
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">Loading upcoming interviews...</div>
          </div>
        </DashboardLayout>
      ) : (
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
            <h1 className="text-2xl font-bold text-gray-900">
              Upcoming Interviews
            </h1>
            <p className="text-gray-600 mt-1">
              Your scheduled interviews and preparation materials.
            </p>
          </div>

          {/* Filter Input */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Filter interviews by title or ID..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-6">
            {filteredInterviews.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {filterText
                      ? "No matching interviews"
                      : "No upcoming interviews"}
                  </h3>
                  <p className="text-gray-600">
                    {filterText
                      ? "Try adjusting your search terms."
                      : "You don't have any interviews scheduled at the moment."}
                  </p>
                </div>
              </Card>
            ) : (
              filteredInterviews.map((interview) => (
                <Card key={interview.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-3">
                          {getInterviewTypeIcon(interview.interview_type)}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-800">
                              {interview.title}
                            </h3>
                            {interview.current_round && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Round {interview.current_round}
                              </span>
                            )}
                            {getStatusBadge(interview)}
                          </div>
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

                      {interview.description && (
                        <p className="text-gray-700 text-sm mb-3">
                          {interview.description}
                        </p>
                      )}

                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-4">
                          Duration: {interview.duration_minutes} minutes
                        </span>
                        <span className="capitalize">
                          Type: {interview.interview_type}
                        </span>
                      </div>

                      {interview.location && (
                        <p className="text-sm text-gray-600 mt-2">
                          📍 {interview.location}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {canJoinInterview(interview) ? (
                        <button
                          onClick={() => navigate(`/interview/${interview.id}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm animate-pulse"
                        >
                          {getJoinButtonText(interview)}
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-300 text-gray-500 rounded text-sm cursor-not-allowed"
                        >
                          {getJoinButtonText(interview)}
                        </button>
                      )}
                      <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                        Prepare
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DashboardLayout>
      )}
    </>
  );
}

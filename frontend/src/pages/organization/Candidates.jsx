import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";

export default function Candidates() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const { showToast } = useToast();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showScheduleInterview, setShowScheduleInterview] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    title: "",
    description: "",
    scheduled_at: "",
    duration_minutes: 60,
    interview_type: "video",
    location: "",
    meeting_link: "",
    interviewers: "",
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      // For now, fetch all applications - in production, filter by organization's posts
      const response = await fetch("/api/applications");
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (appId, status) => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await fetchApplications();
        showToast({
          message: `Application ${status} successfully`,
          type: "success",
        });
      } else {
        showToast({
          message: "Failed to update application status",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      showToast({
        message: "Failed to update application status",
        type: "error",
      });
    }
  };

  const scheduleInterview = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: interviewForm.title,
        description: interviewForm.description,
        scheduled_at: new Date(interviewForm.scheduled_at).toISOString(),
        duration_minutes: interviewForm.duration_minutes,
        user_id: selectedApplication.user_id,
        organization_id: 1, // TODO: Get from context
        post_id: selectedApplication.post_id,
        interview_type: interviewForm.interview_type,
        location: interviewForm.location,
        meeting_link: interviewForm.meeting_link,
        interviewers: JSON.stringify(
          interviewForm.interviewers.split(",").map((i) => i.trim())
        ),
      };

      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showToast({
          message: "Interview scheduled successfully!",
          type: "success",
        });
        setShowScheduleInterview(false);
        resetInterviewForm();
      } else {
        showToast({
          message: "Failed to schedule interview",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error scheduling interview:", error);
      showToast({
        message: "Failed to schedule interview",
        type: "error",
      });
    }
  };

  const resetInterviewForm = () => {
    setInterviewForm({
      title: "",
      description: "",
      scheduled_at: "",
      duration_minutes: 60,
      interview_type: "video",
      location: "",
      meeting_link: "",
      interviewers: "",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewed":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
                Candidates
              </h1>
              <p className="mt-1 text-white/90">
                Review and manage job applicants
              </p>
            </div>
            <div className="text-white text-right">
              <p className="text-2xl font-bold">{applications.length}</p>
              <p className="text-sm text-white/80">Applications</p>
            </div>
          </div>
        </div>
      </div>

      {applications.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">No applications received yet.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <Card key={application.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {application.user?.name || "Anonymous"}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                        application.status
                      )}`}
                    >
                      {application.status}
                    </span>
                  </div>

                  <p className="text-indigo-600 font-medium mb-1">
                    Applied for: {application.post?.title}
                  </p>

                  <p className="text-gray-600 text-sm mb-2">
                    Applied{" "}
                    {new Date(application.applied_at).toLocaleDateString()}
                  </p>

                  {application.cover_letter && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">
                        Cover Letter:
                      </p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                        {application.cover_letter}
                      </p>
                    </div>
                  )}

                  {application.resume_url && (
                    <div className="mb-3">
                      <a
                        href={application.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 text-sm underline"
                      >
                        📄 View Resume
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <select
                    value={application.status}
                    onChange={(e) =>
                      updateApplicationStatus(application.id, e.target.value)
                    }
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <button
                    onClick={() => {
                      setSelectedApplication(application);
                      setShowScheduleInterview(true);
                      setInterviewForm((prev) => ({
                        ...prev,
                        title: `Interview: ${application.post?.title}`,
                      }));
                    }}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                  >
                    Schedule Interview
                  </button>

                  <button
                    onClick={() => setSelectedApplication(application)}
                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Interview Scheduling Modal */}
      {showScheduleInterview && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Schedule Interview</h3>
            <form onSubmit={scheduleInterview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Title
                </label>
                <input
                  type="text"
                  required
                  value={interviewForm.title}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={interviewForm.scheduled_at}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({
                      ...prev,
                      scheduled_at: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <select
                  value={interviewForm.duration_minutes}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({
                      ...prev,
                      duration_minutes: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Type
                </label>
                <select
                  value={interviewForm.interview_type}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({
                      ...prev,
                      interview_type: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="video">Video Call</option>
                  <option value="phone">Phone Call</option>
                  <option value="in-person">In-Person</option>
                </select>
              </div>

              {(interviewForm.interview_type === "video" ||
                interviewForm.interview_type === "phone") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    value={interviewForm.meeting_link}
                    onChange={(e) =>
                      setInterviewForm((prev) => ({
                        ...prev,
                        meeting_link: e.target.value,
                      }))
                    }
                    placeholder="https://zoom.us/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {interviewForm.interview_type === "in-person" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={interviewForm.location}
                    onChange={(e) =>
                      setInterviewForm((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="Office address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interviewers (comma-separated)
                </label>
                <input
                  type="text"
                  value={interviewForm.interviewers}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({
                      ...prev,
                      interviewers: e.target.value,
                    }))
                  }
                  placeholder="John Doe, Jane Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Schedule Interview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleInterview(false);
                    resetInterviewForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

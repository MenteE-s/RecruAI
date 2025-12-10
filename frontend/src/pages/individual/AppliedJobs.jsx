import React, { useState, useEffect } from "react";
import { getBackendUrl } from "../../utils/auth";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";
import { formatDate } from "../../utils/timezone";

export default function AppliedJobs() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const navigate = useNavigate();

  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    fetchAppliedJobs();
  }, []);

  const fetchAppliedJobs = async () => {
    try {
      const userId = 1; // TODO: Get from user context
      const response = await fetch(
        `${getBackendUrl()}/api/applied-jobs/user/${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setAppliedJobs(data);
      }
    } catch (error) {
      console.error("Error fetching applied jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelApplication = async (applicationId) => {
    if (!confirm("Are you sure you want to cancel this job application?")) {
      return;
    }

    setCancelling(applicationId);
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/applied-jobs/${applicationId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        // Update the application status to withdrawn instead of removing it
        setAppliedJobs(
          appliedJobs.map((app) =>
            app.id === applicationId
              ? { ...app, status: "withdrawn", pipeline_stage: "withdrawn" }
              : app
          )
        );
        alert("Application cancelled successfully");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to cancel application");
      }
    } catch (error) {
      console.error("Error cancelling application:", error);
      alert("Failed to cancel application");
    } finally {
      setCancelling(null);
    }
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
      case "withdrawn":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Pending Review";
      case "reviewed":
        return "Under Review";
      case "accepted":
        return "Accepted";
      case "rejected":
        return "Rejected";
      case "withdrawn":
        return "Withdrawn";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={IndividualNavbar}
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
      NavbarComponent={IndividualNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="mb-6">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-600/80 via-purple-600/60 to-cyan-500/60 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">
                Applied Jobs
              </h1>
              <p className="mt-1 text-white/90">
                Track your job applications and their status
              </p>
            </div>
            <div className="text-white text-right">
              <p className="text-2xl font-bold">{appliedJobs.length}</p>
              <p className="text-sm text-white/80">Applied jobs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {appliedJobs.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No applied jobs yet.</p>
              <button
                onClick={() => navigate("/jobs")}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Browse Jobs
              </button>
            </div>
          </Card>
        ) : (
          appliedJobs.map((application) => {
            const job = application.post;
            if (!job) return null;

            return (
              <Card key={application.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {job.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          application.status
                        )}`}
                      >
                        {getStatusText(application.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-1">
                      {job.organization?.name} • {job.location}
                    </p>
                    <p className="text-gray-500 text-sm">
                      Applied {formatDate(application.applied_at)}
                    </p>
                    {application.pipeline_stage && (
                      <p className="text-gray-600 text-sm mt-1">
                        📋 Stage: {application.pipeline_stage.replace("_", " ")}
                      </p>
                    )}
                    {job.salary_min && job.salary_max && (
                      <p className="text-gray-600 text-sm mt-1">
                        💰 ${job.salary_min} - ${job.salary_max}{" "}
                        {job.salary_currency}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      View Details
                    </button>
                    {application.status !== "accepted" &&
                      application.status !== "rejected" &&
                      application.status !== "withdrawn" && (
                        <button
                          onClick={() =>
                            handleCancelApplication(application.id)
                          }
                          disabled={cancelling === application.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancelling === application.id
                            ? "Cancelling..."
                            : "Cancel Application"}
                        </button>
                      )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}

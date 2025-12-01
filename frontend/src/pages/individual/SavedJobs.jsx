import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";
import { formatDate } from "../../utils/timezone";

export default function SavedJobs() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appliedJobs, setAppliedJobs] = useState(new Set());

  useEffect(() => {
    fetchSavedJobs();
    fetchAppliedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const userId = 1; // TODO: Get from user context
      const response = await fetch(
        `http://localhost:5000/api/saved-jobs/user/${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setSavedJobs(data);
      }
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliedJobs = async () => {
    try {
      const userId = 1; // TODO: Get from user context
      const response = await fetch(
        `http://localhost:5000/api/applications/user/${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        const appliedIds = new Set(data.map((app) => app.post_id));
        setAppliedJobs(appliedIds);
      }
    } catch (error) {
      console.error("Error fetching applied jobs:", error);
    }
  };

  const handleUnsaveJob = async (savedId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/saved-jobs/${savedId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        setSavedJobs((prev) => prev.filter((job) => job.id !== savedId));
      }
    } catch (error) {
      console.error("Error unsaving job:", error);
    }
  };

  const handleApplyJob = async (postId) => {
    try {
      const userId = 1; // TODO: Get from user context
      const response = await fetch("http://localhost:5000/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user_id: userId,
          post_id: postId,
          cover_letter: "",
          resume_url: "",
        }),
      });

      if (response.ok) {
        setAppliedJobs((prev) => new Set([...prev, postId]));
      }
    } catch (error) {
      console.error("Error applying to job:", error);
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
                Saved Jobs
              </h1>
              <p className="mt-1 text-white/90">
                Jobs you've saved for later application
              </p>
            </div>
            <div className="text-white text-right">
              <p className="text-2xl font-bold">{savedJobs.length}</p>
              <p className="text-sm text-white/80">Saved jobs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {savedJobs.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No saved jobs yet.</p>
              <a
                href="/jobs"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Browse Jobs
              </a>
            </div>
          </Card>
        ) : (
          savedJobs.map((savedJob) => {
            const job = savedJob.post;
            if (!job) return null;

            return (
              <Card key={savedJob.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {job.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-1">
                      {job.organization?.name} • {job.location}
                    </p>
                    <p className="text-gray-500 text-sm">
                      Saved {formatDate(savedJob.saved_at)}
                    </p>
                    {job.salary_min && job.salary_max && (
                      <p className="text-gray-600 text-sm mt-1">
                        💰 ${job.salary_min} - ${job.salary_max}{" "}
                        {job.salary_currency}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {appliedJobs.has(job.id) ? (
                      <button
                        disabled
                        className="px-4 py-2 bg-green-100 text-green-800 rounded-md cursor-not-allowed"
                      >
                        Applied
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApplyJob(job.id)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Apply Now
                      </button>
                    )}
                    <button
                      onClick={() => handleUnsaveJob(savedJob.id)}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Remove
                    </button>
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

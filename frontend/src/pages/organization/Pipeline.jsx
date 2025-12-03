import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";
import { formatDate } from "../../utils/timezone";

export default function Pipeline() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [pipelineData, setPipelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [orgId, setOrgId] = useState(1); // TODO: Get from user context

  const pipelineStages = [
    { key: "applied", label: "Applied", color: "blue", icon: "📝" },
    { key: "screening", label: "Screening", color: "yellow", icon: "🔍" },
    {
      key: "interview_scheduled",
      label: "Interview Scheduled",
      color: "purple",
      icon: "📅",
    },
    {
      key: "interview_completed",
      label: "Interview Completed",
      color: "indigo",
      icon: "✅",
    },
    {
      key: "offer_extended",
      label: "Offer Extended",
      color: "green",
      icon: "🤝",
    },
    {
      key: "offer_accepted",
      label: "Offer Accepted",
      color: "emerald",
      icon: "🎉",
    },
    { key: "hired", label: "Hired", color: "teal", icon: "👥" },
    { key: "rejected", label: "Rejected", color: "red", icon: "❌" },
  ];

  useEffect(() => {
    fetchPipelineData();
  }, []);

  const fetchPipelineData = async () => {
    try {
      const response = await fetch(`/api/pipeline/${orgId}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPipelineData(data);
        if (data.length > 0 && !selectedPost) {
          setSelectedPost(data[0].post.id);
        }
      }
    } catch (error) {
      console.error("Error fetching pipeline data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePipelineStage = async (applicationId, newStage) => {
    try {
      const response = await fetch(
        `/api/pipeline/application/${applicationId}/stage`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ pipeline_stage: newStage }),
        }
      );
      if (response.ok) {
        fetchPipelineData(); // Refresh data
      }
    } catch (error) {
      console.error("Error updating pipeline stage:", error);
    }
  };

  const getCurrentPostData = () => {
    return pipelineData.find((item) => item.post.id === selectedPost) || null;
  };

  const renderCandidateCard = (candidate, currentStage) => {
    const { application, interview } = candidate;
    const user = application.user;

    return (
      <div
        key={application.id}
        className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">
              {user.name || "Anonymous"}
            </h4>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-xs text-gray-500 mt-1">
              Applied: {formatDate(application.applied_at)}
            </p>
            {interview && (
              <p className="text-xs text-blue-600 mt-1">
                Interview: {formatDate(interview.scheduled_at)}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            {pipelineStages.map((stage) => (
              <button
                key={stage.key}
                onClick={() => updatePipelineStage(application.id, stage.key)}
                className={`w-6 h-6 rounded-full text-xs ${
                  currentStage === stage.key
                    ? `bg-${stage.color}-500 text-white`
                    : `bg-gray-200 text-gray-600 hover:bg-${stage.color}-200`
                }`}
                title={`Move to ${stage.label}`}
              >
                {stage.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
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

  const currentPostData = getCurrentPostData();

  return (
    <DashboardLayout
      NavbarComponent={OrganizationNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="mb-6">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-yellow-600/90 via-amber-600/80 to-purple-700/70 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">
                Recruitment Pipeline
              </h1>
              <p className="mt-1 text-white/90">
                Track candidates through the hiring process
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Job Post Selector */}
      {pipelineData.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Select Job Post</h3>
          <div className="flex flex-wrap gap-2">
            {pipelineData.map((item) => (
              <button
                key={item.post.id}
                onClick={() => setSelectedPost(item.post.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedPost === item.post.id
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {item.post.title} ({item.total_candidates} candidates)
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Pipeline Visualization */}
      {currentPostData ? (
        <div className="space-y-6">
          <Card>
            <h3 className="text-xl font-semibold mb-6">
              {currentPostData.post.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pipelineStages.map((stage) => {
                const candidates = currentPostData.stages[stage.key] || [];
                return (
                  <div
                    key={stage.key}
                    className={`border-2 rounded-lg p-4 min-h-64 ${
                      candidates.length > 0
                        ? `border-${stage.color}-300 bg-${stage.color}-50`
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-2">{stage.icon}</span>
                      <div>
                        <h4 className={`font-medium text-${stage.color}-700`}>
                          {stage.label}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {candidates.length} candidates
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {candidates.map((candidate) =>
                        renderCandidateCard(candidate, stage.key)
                      )}
                      {candidates.length === 0 && (
                        <p className="text-sm text-gray-400 italic">
                          No candidates in this stage
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Pipeline Summary */}
          <Card>
            <h3 className="text-xl font-semibold mb-6">Pipeline Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {pipelineStages.map((stage) => {
                const count = currentPostData.stages[stage.key]?.length || 0;
                return (
                  <div key={stage.key} className="text-center">
                    <div
                      className={`text-2xl font-bold text-${stage.color}-600`}
                    >
                      {count}
                    </div>
                    <div className="text-sm text-gray-600">{stage.label}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">
              No Pipeline Data Available
            </h3>
            <p className="text-gray-600 mb-4">
              Create job posts and receive applications to see your recruitment
              pipeline.
            </p>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}

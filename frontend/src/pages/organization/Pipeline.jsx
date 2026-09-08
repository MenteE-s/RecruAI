import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { formatDate } from "../../utils/timezone";
import socketService from "../../utils/socket";
import { FiBriefcase, FiUsers, FiBarChart2, FiCalendar, FiArrowRight } from "react-icons/fi";

export default function Pipeline() {
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const [pipelineData, setPipelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [orgId] = useState(1);

  const pipelineStages = [
    { key: "applied", label: "Applied", color: "blue", icon: "📝" },
    { key: "screening", label: "Screening", color: "yellow", icon: "🔍" },
    { key: "interview_scheduled", label: "Interview", color: "purple", icon: "📅" },
    { key: "interview_completed", label: "Completed", color: "indigo", icon: "✅" },
    { key: "offer_extended", label: "Offer", color: "green", icon: "🤝" },
    { key: "offer_accepted", label: "Accepted", color: "emerald", icon: "🎉" },
    { key: "hired", label: "Hired", color: "teal", icon: "👥" },
    { key: "withdrawn", label: "Withdrawn", color: "gray", icon: "🚪" },
    { key: "rejected", label: "Rejected", color: "red", icon: "❌" },
  ];

  const fetchPipelineData = useCallback(async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/pipeline/${orgId}`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPipelineData(data);
        if (data.length > 0 && !selectedPost) setSelectedPost(data[0].post.id);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [orgId, selectedPost]);

  useEffect(() => {
    fetchPipelineData();
    const handleUpdate = () => fetchPipelineData();
    socketService.on("application_stage_changed", handleUpdate);
    socketService.on("application_created", handleUpdate);
    return () => { socketService.off("application_stage_changed", handleUpdate); socketService.off("application_created", handleUpdate); };
  }, [fetchPipelineData]);

  const updatePipelineStage = async (applicationId, newStage) => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/pipeline/application/${applicationId}/stage`, { method: "PUT", headers: getAuthHeaders({ "Content-Type": "application/json" }), credentials: "include", body: JSON.stringify({ pipeline_stage: newStage }) });
      if (res.ok) fetchPipelineData();
    } catch (e) { console.error(e); }
  };

  const getCurrentPostData = () => pipelineData.find((item) => item.post.id === selectedPost) || null;
  const renderCandidateCard = (candidate, currentStage) => {
    const { application } = candidate;
    const user = application.user;
    return (
      <div key={application.id} className="bg-white border border-gray-200 p-3 hover:border-gray-300 hover:shadow-sm transition-all">
        <p className="text-sm font-medium text-gray-900 truncate">{user.name || "Anonymous"}</p>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
        <p className="text-xs text-gray-400 mt-1">Applied {formatDate(application.applied_at)}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {pipelineStages.slice(0, 5).map((stage) => (
            <button key={stage.key} onClick={() => updatePipelineStage(application.id, stage.key)} className={`w-6 h-6 flex items-center justify-center text-xs border ${currentStage === stage.key ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`} title={stage.label}>
              {stage.icon}
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-gray-900 h-48 animate-pulse" />
          <div className="bg-white border border-gray-200 h-64 animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  const currentPostData = getCurrentPostData();

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-xs font-medium tracking-wide mb-3">
                <FiBarChart2 className="w-3.5 h-3.5" />
                PIPELINE
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">Hiring pipeline</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Track candidates across every stage — from applied to hired.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[380px]">
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{pipelineData.length}</p>
                <p className="text-xs text-gray-300 mt-1">Posts</p>
              </div>
              <div className="bg-blue-500/20 backdrop-blur border border-blue-400/20 p-4 text-center">
                <p className="text-2xl font-bold text-blue-200">{currentPostData ? Object.values(currentPostData.stages).flat().length : 0}</p>
                <p className="text-xs text-blue-200 mt-1">Candidates</p>
              </div>
              <div className="bg-green-500/20 backdrop-blur border border-green-400/20 p-4 text-center">
                <p className="text-2xl font-bold text-green-200">{currentPostData?.stages?.hired?.length || 0}</p>
                <p className="text-xs text-green-200 mt-1">Hired</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {pipelineData.length > 0 && (
        <div className="bg-white border border-gray-200 p-4 mb-6">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Select job post</h3>
          <div className="flex flex-wrap gap-2">
            {pipelineData.map((item) => (
              <button key={item.post.id} onClick={() => setSelectedPost(item.post.id)} className={`px-4 py-2 text-sm font-medium border transition-colors ${selectedPost === item.post.id ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
                {item.post.title} <span className="ml-1.5 text-xs opacity-70">({item.total_candidates})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {currentPostData ? (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900">{currentPostData.post.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{currentPostData.post.location || "—"} • {currentPostData.total_candidates} candidates</p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pipelineStages.map((stage) => {
                const candidates = currentPostData.stages[stage.key] || [];
                return (
                  <div key={stage.key} className={`border p-3 ${candidates.length ? "bg-gray-50 border-gray-200" : "bg-white border-dashed border-gray-200"}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm">{stage.icon}</span>
                      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{stage.label}</h4>
                      <span className="ml-auto text-xs bg-white border border-gray-200 px-2 py-0.5">{candidates.length}</span>
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {candidates.map((c) => renderCandidateCard(c, stage.key))}
                      {candidates.length === 0 && <p className="text-xs text-gray-400 italic py-4 text-center">No candidates</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900">Pipeline summary</h3>
            <div className="mt-4 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-3">
              {pipelineStages.map((stage) => {
                const count = currentPostData.stages[stage.key]?.length || 0;
                return (
                  <div key={stage.key} className="text-center border border-gray-100 p-3">
                    <p className="text-lg font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-tight">{stage.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-4"><FiBriefcase className="w-7 h-7 text-gray-400" /></div>
          <h3 className="text-lg font-semibold text-gray-900">No pipeline data</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">Create job posts and receive applications to see your pipeline.</p>
        </div>
      )}
    </DashboardLayout>
  );
}

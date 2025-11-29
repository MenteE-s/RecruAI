import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Schedule Interview Modal
const ScheduleInterviewModal = ({ isOpen, onClose, onSave, saving }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduled_at: "",
    duration_minutes: 60,
    user_id: "",
    post_id: "",
    interview_type: "video",
    location: "",
    meeting_link: "",
    interviewers: [],
  });

  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchPosts();
    }
  }, [isOpen]);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/organizations/posts", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      scheduled_at: "",
      duration_minutes: 60,
      user_id: "",
      post_id: "",
      interview_type: "video",
      location: "",
      meeting_link: "",
      interviewers: [],
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Schedule Interview
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interview Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Software Engineer Interview - Round 1"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Interview details, preparation instructions, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Candidate
            </label>
            <input
              type="text"
              value={formData.user_id}
              onChange={(e) =>
                setFormData({ ...formData, user_id: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Enter candidate ID or email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Post
            </label>
            <select
              value={formData.post_id}
              onChange={(e) =>
                setFormData({ ...formData, post_id: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Job Post (Optional)</option>
              {posts.map((post) => (
                <option key={post.id} value={post.id}>
                  {post.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interview Type
            </label>
            <select
              value={formData.interview_type}
              onChange={(e) =>
                setFormData({ ...formData, interview_type: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="video">Video Call</option>
              <option value="phone">Phone Call</option>
              <option value="in-person">In-Person</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration_minutes: parseInt(e.target.value),
                })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              min="15"
              max="480"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scheduled Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) =>
                setFormData({ ...formData, scheduled_at: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Office address or virtual location"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Link
            </label>
            <input
              type="url"
              value={formData.meeting_link}
              onChange={(e) =>
                setFormData({ ...formData, meeting_link: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Zoom, Google Meet, or other meeting link"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Scheduling..." : "Schedule Interview"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Assign AI Agent Modal
const AssignAIAgentModal = ({ isOpen, onClose, onAssign, agents, saving }) => {
  const [selectedAgentId, setSelectedAgentId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedAgentId) {
      onAssign(selectedAgentId);
    }
  };

  const handleClose = () => {
    setSelectedAgentId("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Assign AI Interview Agent
      </h2>
      <p className="text-gray-600 mb-4">
        Select an AI agent to conduct this interview automatically.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="space-y-3">
          {agents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No AI agents available.</p>
              <p className="text-sm text-gray-400">
                Create AI agents in the AI Agents section first.
              </p>
            </div>
          ) : (
            agents
              .filter((agent) => agent.is_active)
              .map((agent) => (
                <label
                  key={agent.id}
                  className={`block p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedAgentId === agent.id.toString()
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="aiAgent"
                    value={agent.id}
                    checked={selectedAgentId === agent.id.toString()}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        {agent.name}
                      </h3>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        {agent.industry}
                      </span>
                    </div>
                    {agent.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {agent.description}
                      </p>
                    )}
                  </div>
                </label>
              ))
          )}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !selectedAgentId || agents.length === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Assigning..." : "Assign Agent"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default function InterviewManagement() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAssignAgentModal, setShowAssignAgentModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [aiAgents, setAiAgents] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInterviews();
    fetchAIAgents();
  }, []);

  const fetchInterviews = async () => {
    try {
      const response = await fetch("/api/interviews", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setInterviews(data.interviews);
      } else {
        setError("Failed to load interviews");
      }
    } catch (error) {
      console.error("Error fetching interviews:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAIAgents = async () => {
    try {
      // TODO: Get organization ID from user context
      const orgId = 1; // Placeholder
      const response = await fetch(`/api/organizations/${orgId}/ai-agents`);
      if (response.ok) {
        const data = await response.json();
        setAiAgents(data);
      }
    } catch (error) {
      console.error("Error fetching AI agents:", error);
    }
  };

  const handleScheduleInterview = async (interviewData) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(interviewData),
      });

      if (response.ok) {
        const result = await response.json();
        setInterviews([...interviews, result.interview]);
        setShowScheduleModal(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to schedule interview");
      }
    } catch (error) {
      console.error("Error scheduling interview:", error);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignAIAgent = async (agentId) => {
    if (!selectedInterview) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/interviews/${selectedInterview.id}/assign-agent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ agent_id: agentId }),
        }
      );

      if (response.ok) {
        await fetchInterviews(); // Refresh interviews to show the assigned agent
        setShowAssignAgentModal(false);
        setSelectedInterview(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to assign AI agent");
      }
    } catch (error) {
      console.error("Error assigning AI agent:", error);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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

  const getStatusBadge = (status) => {
    switch (status) {
      case "scheduled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Scheduled
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Completed
          </span>
        );
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getInterviewTypeIcon = (type) => {
    switch (type) {
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

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={OrganizationNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Loading interviews...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      NavbarComponent={OrganizationNavbar}
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

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Interview Management
          </h1>
          <p className="text-gray-600 mt-1">
            Schedule and manage interviews with candidates.
          </p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <span className="mr-2">+</span>
          Schedule Interview
        </button>
      </div>

      <div className="space-y-6">
        {interviews.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No interviews scheduled
              </h3>
              <p className="text-gray-600 mb-4">
                Start by scheduling your first interview with a candidate.
              </p>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Schedule Interview
              </button>
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
                        {formatDateTime(interview.scheduled_at)} •{" "}
                        {interview.duration_minutes} minutes
                      </p>
                      {interview.post_title && (
                        <p className="text-xs text-blue-600 mt-1">
                          Position: {interview.post_title}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mb-3">
                    {getStatusBadge(interview.status)}
                    <span className="text-sm text-gray-600 capitalize">
                      {interview.interview_type} Interview
                    </span>
                    {interview.ai_agent && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        🤖 AI: {interview.ai_agent.name}
                      </span>
                    )}
                  </div>

                  {interview.description && (
                    <p className="text-gray-700 text-sm mb-3">
                      {interview.description}
                    </p>
                  )}

                  {(interview.location || interview.meeting_link) && (
                    <div className="text-sm text-gray-600">
                      {interview.location && <p>📍 {interview.location}</p>}
                      {interview.meeting_link && (
                        <p>
                          🔗{" "}
                          <a
                            href={interview.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Meeting Link
                          </a>
                        </p>
                      )}
                    </div>
                  )}

                  {interview.feedback && (
                    <div className="bg-gray-50 p-3 rounded-lg mt-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        Interview Feedback
                      </h4>
                      <p className="text-sm text-gray-700">
                        {interview.feedback}
                      </p>
                      {interview.rating && (
                        <div className="flex items-center mt-2">
                          <span className="text-sm text-gray-600 mr-2">
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
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                    Edit
                  </button>
                  {!interview.ai_agent && (
                    <button
                      onClick={() => {
                        setSelectedInterview(interview);
                        setShowAssignAgentModal(true);
                      }}
                      className="px-3 py-1 border border-purple-300 text-purple-600 rounded hover:bg-purple-50 text-sm"
                    >
                      🤖 Assign AI
                    </button>
                  )}
                  <button className="px-3 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50 text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={handleScheduleInterview}
        saving={saving}
      />

      {/* Assign AI Agent Modal */}
      <AssignAIAgentModal
        isOpen={showAssignAgentModal}
        onClose={() => {
          setShowAssignAgentModal(false);
          setSelectedInterview(null);
        }}
        onAssign={handleAssignAIAgent}
        agents={aiAgents}
        saving={saving}
      />
    </DashboardLayout>
  );
}

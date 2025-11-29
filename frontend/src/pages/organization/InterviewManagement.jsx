import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    organization_id: 1, // TODO: Get from user context
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
      organization_id: 1, // TODO: Get from user context
      post_id: "",
      interview_type: "text",
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
              Candidate ID
            </label>
            <input
              type="number"
              value={formData.user_id}
              onChange={(e) =>
                setFormData({ ...formData, user_id: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 2 (candidate's user ID)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the candidate's user ID number (you can find this in the
              Candidates section)
            </p>
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
              <option value="text">💬 Text Chat Interview</option>
              <option value="ai_video">🤖 AI Video Interview</option>
              <option value="human_video">👥 Human Video Interview</option>
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

// Make Decision Modal
const MakeDecisionModal = ({ isOpen, onClose, onSave, saving, interview }) => {
  const [decision, setDecision] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (decision) {
      onSave(decision, feedback, rating);
    }
  };

  const handleClose = () => {
    setDecision("");
    setFeedback("");
    setRating("");
    onClose();
  };

  const decisionOptions = [
    { value: "passed", label: "✅ Pass - Hire the candidate", color: "green" },
    {
      value: "second_round",
      label: "🔄 Second Round - Invite for another interview",
      color: "blue",
    },
    {
      value: "third_round",
      label: "🎯 Third Round - Invite for final interview",
      color: "purple",
    },
    { value: "failed", label: "❌ Reject - Do not proceed", color: "red" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Make Interview Decision
      </h2>
      <p className="text-gray-600 mb-6">
        Review the interview results and make your hiring decision for{" "}
        <span className="font-semibold">{interview?.title}</span>
      </p>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Decision *
            </label>
            <div className="space-y-2">
              {decisionOptions.map((option) => (
                <label
                  key={option.value}
                  className={`block p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    decision === option.value
                      ? `border-${option.color}-500 bg-${option.color}-50`
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="decision"
                    value={option.value}
                    checked={decision === option.value}
                    onChange={(e) => setDecision(e.target.value)}
                    className="mr-3"
                  />
                  <span className={`text-${option.color}-700 font-medium`}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating (1-5 stars)
            </label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select rating (optional)</option>
              <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
              <option value="4">⭐⭐⭐⭐ Very Good</option>
              <option value="3">⭐⭐⭐ Good</option>
              <option value="2">⭐⭐ Fair</option>
              <option value="1">⭐ Poor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feedback & Notes
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Provide feedback to the candidate and notes for your records..."
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
            disabled={saving || !decision}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving Decision..." : "Save Decision"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Cancel Interview Confirmation Modal
const CancelInterviewModal = ({
  isOpen,
  onClose,
  onConfirm,
  saving,
  interview,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Cancel Interview</h2>
      <div className="mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Are you sure you want to cancel this interview?
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  This action cannot be undone. The candidate will be notified
                  of the cancellation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {interview && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Interview Details:
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Title:</strong> {interview.title}
              </p>
              <p>
                <strong>Scheduled:</strong>{" "}
                {new Date(interview.scheduled_at).toLocaleString()}
              </p>
              <p>
                <strong>Duration:</strong> {interview.duration_minutes} minutes
              </p>
              {interview.post_title && (
                <p>
                  <strong>Position:</strong> {interview.post_title}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          disabled={saving}
        >
          Keep Interview
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={saving}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Cancelling..." : "Yes, Cancel Interview"}
        </button>
      </div>
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

// Edit Interview Modal
const EditInterviewModal = ({ isOpen, onClose, onSave, saving, interview }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduled_at: "",
    duration_minutes: 60,
    interview_type: "text",
    location: "",
    meeting_link: "",
  });

  useEffect(() => {
    if (interview && isOpen) {
      setFormData({
        title: interview.title || "",
        description: interview.description || "",
        scheduled_at: interview.scheduled_at
          ? new Date(interview.scheduled_at).toISOString().slice(0, 16)
          : "",
        duration_minutes: interview.duration_minutes || 60,
        interview_type: interview.interview_type || "text",
        location: interview.location || "",
        meeting_link: interview.meeting_link || "",
      });
    }
  }, [interview, isOpen]);

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
      interview_type: "text",
      location: "",
      meeting_link: "",
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Interview</h2>
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
            />
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
              <option value="text">💬 Text Chat Interview</option>
              <option value="ai_video">🤖 AI Video Interview</option>
              <option value="human_video">👥 Human Video Interview</option>
              <option value="video">📹 Video Call Interview</option>
              <option value="phone">📞 Phone Call Interview</option>
              <option value="in-person">🏢 In-Person Interview</option>
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
              placeholder="Physical location or online platform"
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
            {saving ? "Updating..." : "Update Interview"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default function InterviewManagement() {
  const navigate = useNavigate();
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [aiAgents, setAiAgents] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInterviews();
    fetchAIAgents();
  }, []);

  const fetchInterviews = async () => {
    try {
      console.log("Fetching interviews...");
      const response = await fetch("/api/interviews", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched interviews:", data.interviews);
        // Ensure we create a new array reference to trigger re-render
        setInterviews([...(data.interviews || [])]);
        setError(null); // Clear any previous errors
      } else {
        console.error("Failed to fetch interviews:", response.status);
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

  const handleEditInterview = async (formData) => {
    if (!selectedInterview) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/interviews/${selectedInterview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchInterviews();
        setShowEditModal(false);
        setSelectedInterview(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to update interview");
      }
    } catch (error) {
      console.error("Error updating interview:", error);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelInterview = async () => {
    if (!selectedInterview) {
      console.error("No interview selected for cancellation");
      return;
    }

    console.log("Cancelling interview:", selectedInterview.id);
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/interviews/${selectedInterview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "cancelled" }),
      });

      console.log("Cancel response status:", response.status);

      if (response.ok) {
        console.log("Interview cancelled successfully, refreshing list...");
        // Successfully cancelled - refresh the list and close modal
        await fetchInterviews();
        console.log("List refreshed, now closing modal...");
        setShowCancelModal(false);
        setSelectedInterview(null);
        console.log("Modal closed and interview list refreshed");

        // Force a re-render by updating a dummy state
        setInterviews((prev) => [...prev]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Cancel interview error:", errorData);
        setError(errorData.error || "Failed to cancel interview");
        // Don't close modal on error so user can try again
      }
    } catch (error) {
      console.error("Error cancelling interview:", error);
      setError("Network error. Please try again.");
      // Don't close modal on error so user can try again
    } finally {
      setSaving(false);
    }
  };

  const handleMakeDecision = async (decision, feedback = "", rating = null) => {
    if (!selectedInterview) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/interviews/${selectedInterview.id}/decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            decision,
            feedback,
            rating: rating ? parseInt(rating) : null,
          }),
        }
      );

      if (response.ok) {
        await fetchInterviews();
        setShowDecisionModal(false);
        setSelectedInterview(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to update decision");
      }
    } catch (error) {
      console.error("Error updating decision:", error);
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

  const getStatusBadge = (interview) => {
    const now = new Date();
    const scheduledTime = new Date(interview.scheduled_at);
    const timeDiff = scheduledTime - now;
    const minutesDiff = timeDiff / (1000 * 60);

    // Show final decision if available
    if (interview.final_decision) {
      const decisionLabels = {
        passed: { text: "✅ Passed", color: "green" },
        failed: { text: "❌ Rejected", color: "red" },
        second_round: { text: "🔄 Second Round", color: "blue" },
        third_round: { text: "🎯 Third Round", color: "purple" },
      };
      const decision = decisionLabels[interview.final_decision];
      return (
        <span
          className={`px-2 py-1 bg-${decision.color}-100 text-${decision.color}-800 text-xs rounded-full`}
        >
          {decision.text}
        </span>
      );
    }

    if (interview.status === "completed") {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          Completed - Pending Decision
        </span>
      );
    } else if (interview.status === "cancelled") {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
          Cancelled
        </span>
      );
    } else if (interview.status === "no_show") {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
          No Show
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
    // Cannot join if cancelled
    if (interview.status === "cancelled") return false;

    const now = new Date();
    const scheduledTime = new Date(interview.scheduled_at);
    const timeDiff = scheduledTime - now;
    const minutesDiff = timeDiff / (1000 * 60);

    // Can join 15 minutes before and during the interview
    return minutesDiff <= 15 && minutesDiff >= -interview.duration_minutes;
  };

  const getJoinButtonText = (interview) => {
    if (interview.status === "cancelled") return "Cancelled";

    const now = new Date();
    const scheduledTime = new Date(interview.scheduled_at);
    const timeDiff = scheduledTime - now;
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff > 15) {
      return "Waiting Room";
    } else if (minutesDiff > 0) {
      return `Join in ${Math.ceil(minutesDiff)} min`;
    } else if (minutesDiff >= -interview.duration_minutes) {
      return "Join Now";
    } else {
      return "Interview Ended";
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
                    <span className="text-sm text-gray-600">
                      {interview.interview_type === "text" &&
                        "Text Chat Interview"}
                      {interview.interview_type === "ai_video" &&
                        "AI Video Interview"}
                      {interview.interview_type === "human_video" &&
                        "Human Video Interview"}
                      {interview.interview_type === "video" &&
                        "Video Call Interview"}
                      {interview.interview_type === "phone" &&
                        "Phone Call Interview"}
                      {interview.interview_type === "in-person" &&
                        "In-Person Interview"}
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
                  {canJoinInterview(interview) ? (
                    <button
                      onClick={() => navigate(`/interview/${interview.id}`)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm animate-pulse"
                    >
                      {getJoinButtonText(interview)}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-3 py-1 bg-gray-300 text-gray-500 rounded text-sm cursor-not-allowed"
                    >
                      {getJoinButtonText(interview)}
                    </button>
                  )}

                  {interview.status === "completed" && (
                    <button
                      onClick={() => {
                        setSelectedInterview(interview);
                        setShowDecisionModal(true);
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      🎯 Make Decision
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedInterview(interview);
                      setShowEditModal(true);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                  >
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
                  <button
                    onClick={() => {
                      setSelectedInterview(interview);
                      setShowCancelModal(true);
                    }}
                    className="px-3 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50 text-sm"
                  >
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

      {/* Edit Interview Modal */}
      <EditInterviewModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedInterview(null);
        }}
        onSave={handleEditInterview}
        saving={saving}
        interview={selectedInterview}
      />

      {/* Make Decision Modal */}
      <MakeDecisionModal
        isOpen={showDecisionModal}
        onClose={() => {
          setShowDecisionModal(false);
          setSelectedInterview(null);
        }}
        onSave={handleMakeDecision}
        saving={saving}
        interview={selectedInterview}
      />

      {/* Cancel Interview Modal */}
      <CancelInterviewModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedInterview(null);
        }}
        onConfirm={handleCancelInterview}
        saving={saving}
        interview={selectedInterview}
      />
    </DashboardLayout>
  );
}

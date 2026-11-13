import { OrgAppShell } from "../../components/layout/OrgAppShell";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import { FiPlayCircle, FiCalendar, FiCheckCircle, FiXCircle } from "react-icons/fi";
import {

  getBackendUrl,
  getAuthHeaders,
  getUploadUrl,
} from "../../utils/auth";
import { parseUTC } from "../../utils/timezone";
import { VIDEO_ENABLED } from "../../utils/video";
import DualTime from "../../components/ui/DualTime";

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl relative max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-surface p-5 shadow-s15 animate-popIn">
        {children}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-600"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Schedule Interview Modal
const ScheduleInterviewModal = ({
  isOpen,
  onClose,
  onSave,
  saving,
  organizationId,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduled_at: "",
    duration_minutes: 60,
    user_id: "",
    organization_id: organizationId || "", // Synced when org resolves; never default
    post_id: "",
    interview_type: "text",
    location: "",
    meeting_link: "",
    interviewers: [],
    ai_agent_id: "",
  });
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateResults, setCandidateResults] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchingCandidates, setSearchingCandidates] = useState(false);
  const [showCandidateDropdown, setShowCandidateDropdown] = useState(false);

  // Search candidates by name
  useEffect(() => {
    if (!candidateSearch || candidateSearch.length < 2) {
      setCandidateResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingCandidates(true);
      try {
        const res = await fetch(
          `${getBackendUrl()}/api/users?name=${encodeURIComponent(candidateSearch)}&per_page=8`,
          { credentials: "include", headers: getAuthHeaders() }
        );
        if (res.ok) {
          const data = await res.json();
          setCandidateResults(data.data || data.users || data.items || []);
        }
      } catch {}
      setSearchingCandidates(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [candidateSearch]);

  const [posts, setPosts] = useState([]);
  const [aiAgents, setAiAgents] = useState([]);
  const [recommendedAgents, setRecommendedAgents] = useState([]);

  const fetchRecommendedAgents = useCallback(async (jobId) => {
    if (!jobId) {
      setRecommendedAgents([]);
      return;
    }
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/recommendations/agents/${jobId}`,
        {
          credentials: "include",
          headers: getAuthHeaders(),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setRecommendedAgents(data.recommendations || []);
      }
    } catch (error) {
      console.error("Error fetching recommended agents:", error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPosts();
      fetchAiAgents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, organizationId]);

  // Fetch recommended agents when job is selected
  useEffect(() => {
    if (formData.post_id) {
      fetchRecommendedAgents(formData.post_id);
    } else {
      setRecommendedAgents([]);
    }
  }, [formData.post_id, fetchRecommendedAgents]);

  useEffect(() => {
    // Normalize formData when org changes
    setFormData((prev) => ({ ...prev, organization_id: organizationId || "" }));
  }, [organizationId]);

  const fetchPosts = useCallback(async () => {
    if (!organizationId) {
      setPosts([]);
      return;
    }
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/organizations/${organizationId}/posts`,
        {
          credentials: "include",
          headers: getAuthHeaders(),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setPosts(Array.isArray(data) ? data : (data.posts || []));
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }, [organizationId]);

  const fetchAiAgents = useCallback(async () => {
    if (!organizationId) {
      setAiAgents([]);
      return;
    }
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/organizations/${organizationId}/ai-agents`,
        {
          credentials: "include",
          headers: getAuthHeaders(),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setAiAgents(Array.isArray(data) ? data : (data.agents || []));
      }
    } catch (error) {
      console.error("Error fetching AI agents:", error);
    }
  }, [organizationId]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Convert datetime-local to UTC before sending
    let dataToSend = { ...formData };
    if (formData.scheduled_at) {
      // send a fully-qualified ISO string (UTC) so backend receives exact moment
      dataToSend.scheduled_at = new Date(formData.scheduled_at).toISOString();
    }

    onSave(dataToSend);
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      scheduled_at: "",
      duration_minutes: 60,
      user_id: "",
      organization_id: organizationId || "",
      post_id: "",
      interview_type: "text",
      location: "",
      meeting_link: "",
      interviewers: [],
      ai_agent_id: "",
    });
    setRecommendedAgents([]);
    setSelectedCandidate(null);
    setCandidateSearch("");
    setCandidateResults([]);
    setShowCandidateDropdown(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <h2 className="mb-4 text-base font-semibold text-ink">
        Schedule Interview
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Interview Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50"
              placeholder="e.g., Software Engineer Interview - Round 1"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50 resize-none"
              rows={3}
              placeholder="Interview details, preparation instructions, etc."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Candidate
            </label>
            <div className="relative">
              {selectedCandidate ? (
                <div className="flex items-center gap-2 p-2 rounded-xl border border-line bg-gray-50 dark:bg-gray-25">
                  {selectedCandidate.profile_picture ? (
                    <img src={getUploadUrl(selectedCandidate.profile_picture)} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-semibold">
                      {(selectedCandidate.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="flex-1 text-sm font-medium">{selectedCandidate.name}</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedCandidate(null); setFormData({ ...formData, user_id: "" }); setCandidateSearch(""); }}
                    className="text-gray-500 hover:text-red-500 text-sm"
                  >✕</button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={candidateSearch}
                    onChange={(e) => { setCandidateSearch(e.target.value); setShowCandidateDropdown(true); }}
                    onFocus={() => setShowCandidateDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCandidateDropdown(false), 200)}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50"
                    placeholder="Search candidate by name..."
                    autoComplete="off"
                  />
                  {showCandidateDropdown && candidateResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-line bg-surface shadow-s15">
                      {candidateResults.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSelectedCandidate(u);
                            setFormData({ ...formData, user_id: u.id });
                            setCandidateSearch("");
                            setShowCandidateDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                        >
                          {u.profile_picture ? (
                            <img src={getUploadUrl(u.profile_picture)} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-semibold">
                              {(u.name || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                            {u.headline && <p className="text-xs text-gray-500 truncate">{u.headline}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showCandidateDropdown && candidateSearch.length >= 2 && candidateResults.length === 0 && !searchingCandidates && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-line bg-surface p-3 text-sm text-gray-500 shadow-s15">
                      No candidates found
                    </div>
                  )}
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Search by name to find the candidate
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Job Post
            </label>
            <select
              aria-label="Job Post"
              value={formData.post_id}
              onChange={(e) =>
                setFormData({ ...formData, post_id: e.target.value })
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50"
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
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Interview Type
            </label>
            <select
              aria-label="Interview Type"
              value={formData.interview_type}
              onChange={(e) =>
                setFormData({ ...formData, interview_type: e.target.value })
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50"
            >
              <option value="text">Text Chat Interview</option>
              {VIDEO_ENABLED && (
                <>
                  <option value="ai_video">AI Video Interview</option>
                  <option value="human_video">Human Video Interview</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
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
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50"
              min="15"
              max="480"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Scheduled Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) =>
                setFormData({ ...formData, scheduled_at: e.target.value })
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50"
              required
            />
          </div>
        </div>

        {/* AI Agent Selection */}
        <div className="mt-6">
          <label className="mb-3 block text-xs font-medium text-gray-600">
            AI Interview Agent (Optional)
          </label>

          {recommendedAgents.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium text-gray-600">
                Recommended Agents
              </h4>
              <div className="grid grid-cols-1 gap-3 mb-4">
                {recommendedAgents.slice(0, 3).map((agent) => (
                  <div
                    key={`rec-${agent.agent_id}`}
                    className="rounded-xl border border-line bg-gray-50 p-3 cursor-pointer transition-colors hover:bg-gray-25 dark:bg-gray-25"
                    onClick={() =>
                      setFormData({ ...formData, ai_agent_id: agent.agent_id })
                    }>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {agent.agent_name}
                          </span>
                          <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-xs text-gray-600">
                            Recommended
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {agent.industry}
                        </p>
                        {agent.explanation && (
                          <p className="text-xs text-gray-500 mt-1">
                            {agent.explanation}
                          </p>
                        )}
                      </div>
                      <input
                        type="radio"
                        name="ai_agent"
                        value={agent.agent_id}
                        checked={formData.ai_agent_id === agent.agent_id}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            ai_agent_id: agent.agent_id,
                          })
                        }
                        className="h-4 w-4 accent-brand"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Select AI Agent
            </label>
            <select
              aria-label="Select AI Agent"
              value={formData.ai_agent_id}
              onChange={(e) =>
                setFormData({ ...formData, ai_agent_id: e.target.value })
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50"
            >
              <option value="">No AI Agent (Human Interview)</option>
              {aiAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} - {agent.industry}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              AI agents can conduct automated interviews for this position
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand-action px-4 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
    { value: "passed", label: "Pass – Hire the candidate", color: "green" },
    {
      value: "second_round",
      label: "Second Round – Invite for another interview",
      color: "blue",
    },
    {
      value: "third_round",
      label: "Third Round – Invite for final interview",
      color: "purple",
    },
    { value: "failed", label: "Reject – Do not proceed", color: "red" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <h2 className="mb-4 text-base font-semibold text-ink">
        Make Interview Decision - Round {interview?.current_round || 1}
      </h2>
      <p className="text-gray-600 mb-6">
        Review the Round {interview?.current_round || 1} interview results and
        make your hiring decision for{" "}
        <span className="font-semibold">{interview?.title}</span>
        {interview?.decision_history &&
          interview.decision_history.length > 0 && (
            <span className="mt-2 block text-sm text-gray-500">
              Previous rounds completed: {interview.decision_history.length}
            </span>
          )}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="mb-3 block text-xs font-medium text-gray-600">
              Decision *
            </label>
            <div className="space-y-2">
              {decisionOptions.map((option) => (
                <label
                  key={option.value}
                  className={`block p-3 border rounded-xl cursor-pointer transition-colors hover:bg-gray-50 ${
                    decision === option.value
                      ? "border-brand bg-brand/5"
                      : "border-line bg-surface"
                  }`}>
                  <input
                    type="radio"
                    name="decision"
                    value={option.value}
                    checked={decision === option.value}
                    onChange={(e) => setDecision(e.target.value)}
                    className="mr-3 accent-brand"
                  />
                  <span className="font-medium text-ink">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Rating (1-5 stars)
            </label>
            <select
              aria-label="Rating (1-5 stars)"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50"
            >
              <option value="">Select rating (optional)</option>
              <option value="5">5 – Excellent</option>
              <option value="4">4 – Very Good</option>
              <option value="3">3 – Good</option>
              <option value="2">2 – Fair</option>
              <option value="1">1 – Poor</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Feedback & Notes
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50 resize-none"
              rows={4}
              placeholder="Provide feedback to the candidate and notes for your records..."
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !decision}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand-action px-4 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <h2 className="mb-4 text-base font-semibold text-ink">Cancel Interview</h2>
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
            <h4 className="mb-2 font-medium text-ink">
              Interview Details:
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Title:</strong> {interview.title}
              </p>
              <p>
                <strong>Scheduled:</strong>{" "}
                <DualTime
                  value={interview.scheduled_at_iso || interview.scheduled_at}
                  otherTimezone={interview.candidate_timezone}
                  otherLabel={interview.user_name}
                />
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
          className="rounded-xl border border-line bg-surface px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-25"
          disabled={saving}>
          Keep Interview
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={saving}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <h2 className="mb-4 text-base font-semibold text-ink">
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
              <p className="text-sm text-gray-500">
                Create AI agents in the AI Agents section first.
              </p>
            </div>
          ) : (
            agents
              .filter((agent) => agent.is_active)
              .map((agent) => (
                <label
                  key={agent.id}
                  className={`block p-4 border rounded-xl cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedAgentId === agent.id.toString()
                      ? "border-brand bg-brand/5"
                      : "border-line bg-surface"
                  }`}>
                  <input
                    type="radio"
                    name="aiAgent"
                    value={agent.id}
                    checked={selectedAgentId === agent.id.toString()}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="mr-3 accent-brand"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-ink">
                        {agent.name}
                      </h3>
                      <span className="rounded-full border border-line bg-surface px-2 py-1 text-xs text-gray-600">
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
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !selectedAgentId || agents.length === 0}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand-action px-4 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
      // Convert UTC time from server to local time for the datetime-local input
      let localDateTimeStr = "";
      if (interview.scheduled_at_iso || interview.scheduled_at) {
        const utcDate = new Date(
          interview.scheduled_at_iso || interview.scheduled_at
        );
        // Format as local datetime for the input (YYYY-MM-DDTHH:MM)
        const year = utcDate.getFullYear();
        const month = String(utcDate.getMonth() + 1).padStart(2, "0");
        const day = String(utcDate.getDate()).padStart(2, "0");
        const hours = String(utcDate.getHours()).padStart(2, "0");
        const minutes = String(utcDate.getMinutes()).padStart(2, "0");
        localDateTimeStr = `${year}-${month}-${day}T${hours}:${minutes}`;
      }

      setFormData({
        title: interview.title || "",
        description: interview.description || "",
        scheduled_at: localDateTimeStr,
        duration_minutes: interview.duration_minutes || 60,
        interview_type: interview.interview_type || "text",
        location: interview.location || "",
        meeting_link: interview.meeting_link || "",
      });
    }
  }, [interview, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // The datetime-local input gives us local time
    // Convert it to UTC ISO string for the backend
    const localDateTime = new Date(formData.scheduled_at);
    const utcISOString = localDateTime.toISOString(); // This converts local to UTC automatically

    const dataToSend = {
      ...formData,
      scheduled_at: utcISOString,
    };

    onSave(dataToSend);
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
      <h2 className="mb-4 text-base font-semibold text-ink">Edit Interview</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Interview Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50 resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Interview Type
            </label>
            <select
              aria-label="Interview Type"
              value={formData.interview_type}
              onChange={(e) =>
                setFormData({ ...formData, interview_type: e.target.value })
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50"
            >
              <option value="text">Text Chat Interview</option>
              {VIDEO_ENABLED && (
                <>
                  <option value="ai_video">AI Video Interview</option>
                  <option value="human_video">Human Video Interview</option>
                  <option value="video">Video Call Interview</option>
                </>
              )}
              <option value="phone">Phone Call Interview</option>
              <option value="in-person">In-Person Interview</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
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
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50"
              min="15"
              max="480"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Scheduled Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) =>
                setFormData({ ...formData, scheduled_at: e.target.value })
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50"
              placeholder="Physical location or online platform"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Meeting Link
            </label>
            <input
              type="url"
              value={formData.meeting_link}
              onChange={(e) =>
                setFormData({ ...formData, meeting_link: e.target.value })
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50"
              placeholder="Zoom, Google Meet, or other meeting link"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand-action px-4 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
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

  const [interviews, setInterviews] = useState([]);
  const [organizationId, setOrganizationId] = useState(null);
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
  const [filterText, setFilterText] = useState("");
  const [selectedInterviews, setSelectedInterviews] = useState([]);
  const [showSections, setShowSections] = useState({
    inProgress: true,
    scheduled: true,
    completed: true,
    cancelled: true,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [decisionFilter, setDecisionFilter] = useState("all");

  useEffect(() => {
    // Fetch current user context to get organization_id
    const getCurrentUser = async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/auth/me`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          const orgId = data?.user?.organization_id || null;
          setOrganizationId(orgId);
        }
      } catch (err) {
        console.error("Error fetching current user", err);
      }
    };

    getCurrentUser();
  }, []);

  // When organizationId becomes available, fetch org-specific data

  const fetchInterviews = useCallback(async () => {
    try {
      console.log("Fetching interviews...");
      const response = await fetch(`${getBackendUrl()}/api/interviews`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched interviews:", data.data);
        let items = data.data || [];
        // If organizationId is known, filter by this org's interviews only
        if (organizationId) {
          items = items.filter((it) => it.organization_id === organizationId);
        }
        // Ensure we create a new array reference to trigger re-render
        setInterviews([...items]);
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
  }, [organizationId]);

  // Once we have organizationId, load interviews and agents for the org

  const fetchAIAgents = useCallback(async () => {
    try {
      const orgId = organizationId;
      if (!orgId) { setAiAgents([]); return; }
      const response = await fetch(
        `${getBackendUrl()}/api/organizations/${orgId}/ai-agents`,
        {
          headers: getAuthHeaders(),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setAiAgents(data);
      }
    } catch (error) {
      console.error("Error fetching AI agents:", error);
    }
  }, [organizationId]);

  // Once we have organizationId, load interviews and agents for the org
  useEffect(() => {
    if (!organizationId) return;
    // fetch both interviews and AI agents for this organization
    fetchInterviews();
    fetchAIAgents();
  }, [organizationId, fetchInterviews, fetchAIAgents]);

  const handleScheduleInterview = async (interviewData) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${getBackendUrl()}/api/interviews`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
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
        `${getBackendUrl()}/api/interviews/${
          selectedInterview.id
        }/assign-agent`,
        {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
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
      const response = await fetch(
        `${getBackendUrl()}/api/interviews/${selectedInterview.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

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
      const response = await fetch(
        `${getBackendUrl()}/api/interviews/${selectedInterview.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          credentials: "include",
          body: JSON.stringify({ status: "cancelled" }),
        }
      );

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
    if (!selectedInterview || !organizationId) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `${getBackendUrl()}/api/organizations/${organizationId}/interviews/${
          selectedInterview.id
        }/decision`,
        {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          credentials: "include",
          body: JSON.stringify({
            decision,
            feedback: feedback || null,
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

  const getStatusBadge = (interview) => {
    // Compare UTC instants (backend timestamps are UTC)
    const nowUTC = new Date();

    const scheduledAt = interview.scheduled_at_iso || interview.scheduled_at;
    if (!scheduledAt)
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
          Unknown
        </span>
      );

    const scheduledTime = parseUTC(scheduledAt);
    const timeDiff = scheduledTime - nowUTC;
    const minutesDiff = timeDiff / (1000 * 60);

    // Show final decision if available
    if (interview.final_decision) {
      const decisionLabels = {
        passed: {
          text: `Passed${
            interview.current_round > 1
              ? ` (Round ${interview.current_round})`
              : ""
          }`,
          cls: "bg-brand/10 text-brand-border",
        },
        failed: {
          text: `Rejected${
            interview.current_round > 1
              ? ` (Round ${interview.current_round})`
              : ""
          }`,
          cls: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
        },
        second_round: { text: "Second round scheduled", cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
        third_round: { text: "Third round scheduled", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-600" },
      };
      const decision = decisionLabels[interview.final_decision];
      return (
        <span
          className={`px-2 py-1 text-xs rounded-full ${decision.cls}`}>
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
        <span className="animate-pulse rounded-full border border-brand/20 bg-brand/10 px-2 py-1 text-xs font-medium text-brand-text">
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

    const scheduledAt = interview.scheduled_at_iso || interview.scheduled_at;
    if (!scheduledAt) return false;

    // Get current time in UTC
    const nowUTC = new Date();

    // Parse scheduled time as UTC instant
    const scheduledTime = parseUTC(scheduledAt);
    const timeDiff = scheduledTime - nowUTC;
    const minutesDiff = timeDiff / (1000 * 60);

    // Can join 15 minutes before and during the interview
    return minutesDiff <= 15 && minutesDiff >= -interview.duration_minutes;
  };

  const getJoinButtonText = (interview) => {
    if (interview.status === "cancelled") return "Cancelled";

    const scheduledAt = interview.scheduled_at_iso || interview.scheduled_at;
    if (!scheduledAt) return "Unknown";

    // Get current time in UTC
    const nowUTC = new Date();

    // Parse scheduled time as UTC instant
    const scheduledTime = parseUTC(scheduledAt);
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
    // Text filter
    if (filterText) {
      const text = filterText.toLowerCase();
      const matchesText =
        interview.id?.toString().includes(text) ||
        interview.title?.toLowerCase().includes(text) ||
        interview.user_name?.toLowerCase().includes(text) ||
        interview.post_title?.toLowerCase().includes(text);
      if (!matchesText) return false;
    }

    // Status filter
    if (statusFilter !== "all" && interview.status !== statusFilter) {
      return false;
    }

    // Decision filter
    if (decisionFilter !== "all") {
      if (decisionFilter === "pending" && interview.final_decision) {
        return false;
      }
      if (
        decisionFilter !== "pending" &&
        interview.final_decision !== decisionFilter
      ) {
        return false;
      }
    }

    return true;
  });

  // Bulk operations
  const handleSelectInterview = (interviewId, selected) => {
    if (selected) {
      setSelectedInterviews([...selectedInterviews, interviewId]);
    } else {
      setSelectedInterviews(
        selectedInterviews.filter((id) => id !== interviewId)
      );
    }
  };

  const handleSelectAll = (interviews, selected) => {
    if (selected) {
      const allIds = interviews.map((i) => i.id);
      setSelectedInterviews([...new Set([...selectedInterviews, ...allIds])]);
    } else {
      const interviewIds = interviews.map((i) => i.id);
      setSelectedInterviews(
        selectedInterviews.filter((id) => !interviewIds.includes(id))
      );
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInterviews.length === 0) return;

    // Simple confirmation - replace with proper modal if needed
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedInterviews.length} interview(s)? This action cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const deletePromises = selectedInterviews.map((interviewId) =>
        fetch(`${getBackendUrl()}/api/interviews/${interviewId}`, {
          method: "DELETE",
          credentials: "include",
        })
      );

      const results = await Promise.all(deletePromises);
      const failedDeletes = results.filter((r) => !r.ok);

      if (failedDeletes.length > 0) {
        setError(`Failed to delete ${failedDeletes.length} interview(s)`);
      } else {
        await fetchInterviews();
        setSelectedInterviews([]);
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      setError("Network error during bulk delete");
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section) => {
    setShowSections({
      ...showSections,
      [section]: !showSections[section],
    });
  };

  // Categorize interviews
  const scheduled = filteredInterviews.filter((i) => i.status === "scheduled");
  const inProgress = filteredInterviews.filter((i) => {
    const scheduledAt = i.scheduled_at_iso || i.scheduled_at;
    if (!scheduledAt) return false;
    const nowUTC = new Date();
    const scheduledTime = parseUTC(scheduledAt);
    const timeDiff = scheduledTime - nowUTC;
    const minutesDiff = timeDiff / (1000 * 60);
    return (
      minutesDiff < 0 &&
      minutesDiff >= -i.duration_minutes &&
      i.status === "scheduled"
    );
  });
  const completed = filteredInterviews.filter((i) => i.status === "completed");
  const cancelled = filteredInterviews.filter(
    (i) => i.status === "cancelled" || i.status === "no_show"
  );

  // Helper to render interview card (reuse original card rendering logic)
  function renderInterviewCard(interview, showCheckbox = false) {
    const isSelected = selectedInterviews.includes(interview.id);

    return (
      <div className="flex items-start justify-between gap-4">
        {showCheckbox && (
          <div className="mt-1 shrink-0">
            <input
              type="checkbox"
              aria-label={`Select ${interview.title || "interview"}`}
              checked={isSelected}
              onChange={(e) =>
                handleSelectInterview(interview.id, e.target.checked)
              }
              className="mt-1 h-6 w-6 rounded accent-brand focus:ring-brand"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            {interview.user_profile_picture ? (
              <img
                src={getUploadUrl(interview.user_profile_picture)}
                alt={interview.user_name || "Candidate"}
                className="h-10 w-10 shrink-0 rounded-full border border-line object-cover"
              />
            ) : (
              <Avatar name={interview.user_name || "U"} size="lg" />
            )}
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-ink">{interview.title}</h3>
              <p className="mt-0.5 text-[13px] text-gray-500">
                <DualTime
                  value={interview.scheduled_at_iso || interview.scheduled_at}
                  otherTimezone={interview.candidate_timezone}
                  otherLabel={interview.user_name}
                  variant="compact"
                />{" "}
                • {interview.duration_minutes} min
              </p>
              {interview.post_title && (
                <p className="mt-0.5 truncate text-xs font-medium text-gray-600">
                  Position: {interview.post_title}
                </p>
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {getStatusBadge(interview)}
            <span className="inline-flex h-6 items-center rounded-lg border border-line bg-gray-50 px-2 text-xs font-medium text-gray-600 dark:bg-gray-25">
              {interview.interview_type === "text" && "Text Chat Interview"}
              {interview.interview_type === "ai_video" && "AI Video Interview"}
              {interview.interview_type === "human_video" &&
                "Human Video Interview"}
              {interview.interview_type === "video" && "Video Call Interview"}
              {interview.interview_type === "phone" && "Phone Call Interview"}
              {interview.interview_type === "in-person" &&
                "In-Person Interview"}
            </span>
            {interview.ai_agent && (
              <span className="inline-flex h-6 items-center rounded-lg border border-line bg-gray-50 px-2 text-xs font-medium text-gray-600 dark:bg-gray-25">
                AI: {interview.ai_agent.name}
              </span>
            )}
          </div>
          {interview.description && (
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              {interview.description}
            </p>
          )}
          {(interview.location || interview.meeting_link) && (
            <div className="mt-2 space-y-0.5 text-[13px] text-gray-600">
              {interview.location && <p>{interview.location}</p>}
              {interview.meeting_link && (
                <p>
                  <a
                    href={interview.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-text hover:underline"
                  >
                    Meeting Link
                  </a>
                </p>
              )}
            </div>
          )}
          {interview.feedback && (
            <div className="mt-3 rounded-xl border border-line bg-gray-50 p-3 dark:bg-gray-25">
              <h4 className="text-[13px] font-semibold text-ink">
                Interview Feedback
              </h4>
              <p className="mt-1 text-sm text-gray-700">{interview.feedback}</p>
              {interview.rating && (
                <div className="mt-2 flex items-center">
                  <span className="mr-2 text-xs text-gray-500">Rating:</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm ${
                          star <= interview.rating
                            ? "text-amber-400"
                            : "text-gray-300"
                        }`}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {interview.decision_history &&
            interview.decision_history.length > 0 && (
              <div className="mt-3 rounded-xl border border-line bg-gray-50 p-3 dark:bg-gray-25">
                <h4 className="mb-2 text-[13px] font-semibold text-ink">
                  Interview Progress History
                </h4>
                <div className="space-y-2">
                  {interview.decision_history
                    .sort((a, b) => a.round_number - b.round_number)
                    .map((decision, index) => (
                      <div
                        key={decision.id}
                        className="flex items-start gap-2"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-xs font-medium text-gray-600">
                          {decision.round_number}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-ink">
                              Round {decision.round_number}
                            </span>
                            <span
                              className={`inline-flex h-6 items-center rounded-lg border px-2 text-xs font-medium ${
                                decision.decision === "passed"
                                  ? "border-transparent bg-brand/10 text-brand-text"
                                  : decision.decision === "failed"
                                  ? "border-red-200 bg-red-50 text-red-700"
                                  : "border-line bg-surface text-gray-600"
                              }`}>
                              {decision.decision === "passed" && "Passed"}
                              {decision.decision === "failed" && "Failed"}
                              {decision.decision === "second_round" &&
                                "Advanced to Round 2"}
                              {decision.decision === "third_round" &&
                                "Advanced to Round 3"}
                            </span>
                          </div>
                          {decision.feedback && (
                            <p className="mt-1 text-sm text-gray-700">
                              {decision.feedback}
                            </p>
                          )}
                          {decision.rating && (
                            <div className="mt-1 flex items-center">
                              <span className="mr-2 text-xs text-gray-500">
                                Rating:
                              </span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={`text-xs ${
                                      star <= decision.rating
                                        ? "text-amber-400"
                                        : "text-gray-300"
                                    }`}>
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Decided on{" "}
                            <DualTime value={decision.decided_at} variant="compact" showRelative={false} />
                            {decision.decided_by_name &&
                              ` by ${decision.decided_by_name}`}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          {canJoinInterview(interview) ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                console.log("Interview object:", interview);
                console.log("Interview ID:", interview.id);
                navigate(`/in/interview/${interview.id}`);
              }}
            >
              {getJoinButtonText(interview)}
            </Button>
          ) : (
            <Button variant="secondary" size="sm" disabled>
              {getJoinButtonText(interview)}
            </Button>
          )}
          {["scheduled", "in_progress", "completed"].includes(
            interview.status
          ) && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedInterview(interview);
                  setShowDecisionModal(true);
                }}
              >
                Make Decision
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/in/interview/${interview.id}/analysis`)}
              >
                Analysis
              </Button>
            </>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedInterview(interview);
              setShowEditModal(true);
            }}
          >
            Edit
          </Button>
          {!interview.ai_agent && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedInterview(interview);
                setShowAssignAgentModal(true);
              }}
            >
              Assign AI
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setSelectedInterview(interview);
              setShowCancelModal(true);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <OrgAppShell>
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Loading interviews...</div>
        </div>
      </OrgAppShell>
    );
  }

  return (
    <OrgAppShell>
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

      <div className="px-4 pb-4 pt-4">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-[24px] font-semibold leading-8 text-ink">Interviews</h1>
              <p className="mt-0.5 text-[13px] text-gray-500">Schedule and manage interviews with candidates.</p>
            </div>
            <Button variant="primary" size="sm" className="self-start lg:self-auto" onClick={() => setShowScheduleModal(true)}>
              <FiCalendar className="h-3.5 w-3.5" /> Schedule interview
            </Button>
          </div>
          <div className="mt-5 grid max-w-md grid-cols-3 gap-3">
            <div className="rounded-xl border border-line bg-gray-50 p-3.5 text-center dark:bg-gray-25">
              <p className="text-xl font-bold text-ink">{interviews.length}</p>
              <p className="mt-0.5 text-xs text-gray-500">Total</p>
            </div>
            <div className="rounded-xl border border-line bg-gray-50 p-3.5 text-center dark:bg-gray-25">
              <p className="text-xl font-bold text-ink">{interviews.filter((i) => i.status === "scheduled").length}</p>
              <p className="mt-0.5 text-xs text-gray-500">Scheduled</p>
            </div>
            <div className="rounded-xl border border-line bg-brand/10 p-3.5 text-center">
              <p className="text-xl font-bold text-brand-text">{interviews.filter((i) => i.status === "completed").length}</p>
              <p className="mt-0.5 text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Interviews Summary */}
      {selectedInterviews.length > 0 && (
        <div className="mx-4 mb-4 rounded-xl border border-line bg-surface p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedInterviews.length} interview(s) selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedInterviews([])}
                className="text-sm font-semibold text-ink hover:text-brand-text"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="mx-4 mb-4 rounded-xl border border-line bg-surface p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Search Filter */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Search</label>
            <Input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search by ID, title, candidate name, or position..."
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Status</label>
            <select
              aria-label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>

          {/* Decision Filter */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Decision</label>
            <select
              aria-label="Decision"
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50"
            >
              <option value="all">All Decisions</option>
              <option value="pending">Pending Decision</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="second_round">Second Round</option>
              <option value="third_round">Third Round</option>
            </select>
          </div>

          {/* Bulk Actions */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Actions</label>
            <div className="flex space-x-2">
              <Button
                variant="danger"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedInterviews.length === 0 || saving}
              >
                Delete ({selectedInterviews.length})
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFilterText("");
                  setStatusFilter("all");
                  setDecisionFilter("all");
                  setSelectedInterviews([]);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Section Visibility Toggles */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <button
            onClick={() => toggleSection("inProgress")}
            className={`inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
              showSections.inProgress
                ? "border-gray-900 bg-gray-900 text-white dark:border-gray-50 dark:bg-gray-50 dark:text-ink"
                : "border-line bg-surface text-ink hover:bg-gray-50"
            }`}>
            <FiPlayCircle className="h-3.5 w-3.5" />
            In Progress
          </button>
          <button
            onClick={() => toggleSection("scheduled")}
            className={`inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
              showSections.scheduled
                ? "border-gray-900 bg-gray-900 text-white dark:border-gray-50 dark:bg-gray-50 dark:text-ink"
                : "border-line bg-surface text-ink hover:bg-gray-50"
            }`}>
            <FiCalendar className="h-3.5 w-3.5" />
            Scheduled
          </button>
          <button
            onClick={() => toggleSection("completed")}
            className={`inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
              showSections.completed
                ? "border-gray-900 bg-gray-900 text-white dark:border-gray-50 dark:bg-gray-50 dark:text-ink"
                : "border-line bg-surface text-ink hover:bg-gray-50"
            }`}>
            <FiCheckCircle className="h-3.5 w-3.5" />
            Completed
          </button>
          <button
            onClick={() => toggleSection("cancelled")}
            className={`inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
              showSections.cancelled
                ? "border-gray-900 bg-gray-900 text-white dark:border-gray-50 dark:bg-gray-50 dark:text-ink"
                : "border-line bg-surface text-ink hover:bg-gray-50"
            }`}>
            <FiXCircle className="h-3.5 w-3.5" />
            Cancelled/No Show
          </button>
        </div>
      </div>

      {/* Section: In Progress Interviews */}
      {showSections.inProgress && (
        <>
          <div className="flex flex-wrap items-center gap-3 px-4 mb-4">
            <span className="h-6 w-1 shrink-0 rounded-full bg-line" />
            <FiPlayCircle className="h-5 w-5 shrink-0 text-gray-500" />
            <h2 className="whitespace-nowrap text-sm font-semibold text-ink">
              Current/In Progress Interviews
            </h2>
            <span className="shrink-0 rounded-full border border-line bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-25">
              {inProgress.length}
            </span>
            <div className="flex-1 border-t border-line" />
            {inProgress.length > 0 && (
              <label className="flex shrink-0 items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  onChange={(e) =>
                    handleSelectAll(inProgress, e.target.checked)
                  }
                  className="mr-2 h-5 w-5 accent-brand"
                />
                Select All
              </label>
            )}
          </div>
          <div className="space-y-4 mb-6">
            {inProgress.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-gray-50/50 px-4 py-6 text-center text-sm text-gray-500 dark:bg-gray-25/50">
                No interviews in progress.
              </div>
            ) : (
              inProgress.map((interview) => (
                <div key={interview.id} className="rounded-xl border border-line bg-surface p-4 card-hover">
                  {renderInterviewCard(interview, true)}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Section: Scheduled Interviews */}
      {showSections.scheduled && (
        <>
          <div className="flex flex-wrap items-center gap-3 px-4 mb-4 mt-8">
            <span className="h-6 w-1 shrink-0 rounded-full bg-line" />
            <FiCalendar className="h-5 w-5 shrink-0 text-gray-500" />
            <h2 className="whitespace-nowrap text-sm font-semibold text-ink">
              Scheduled Interviews
            </h2>
            <span className="shrink-0 rounded-full border border-line bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-25">
              {scheduled.length}
            </span>
            <div className="flex-1 border-t border-line" />
            {scheduled.length > 0 && (
              <label className="flex shrink-0 items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  onChange={(e) => handleSelectAll(scheduled, e.target.checked)}
                  className="mr-2 h-5 w-5 accent-brand"
                />
                Select All
              </label>
            )}
          </div>
          <div className="space-y-4 mb-6">
            {scheduled.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-gray-50/50 px-4 py-6 text-center text-sm text-gray-500 dark:bg-gray-25/50">
                No scheduled interviews.
              </div>
            ) : (
              scheduled.map((interview) => (
                <div key={interview.id} className="rounded-xl border border-line bg-surface p-4 card-hover">
                  {renderInterviewCard(interview, true)}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Section: Completed Interviews */}
      {showSections.completed && (
        <>
          <div className="flex flex-wrap items-center gap-3 px-4 mb-4 mt-8">
            <span className="h-6 w-1 shrink-0 rounded-full bg-line" />
            <FiCheckCircle className="h-5 w-5 shrink-0 text-gray-500" />
            <h2 className="whitespace-nowrap text-sm font-semibold text-ink">
              Completed Interviews
            </h2>
            <span className="shrink-0 rounded-full border border-line bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-25">
              {completed.length}
            </span>
            <div className="flex-1 border-t border-line" />
            {completed.length > 0 && (
              <label className="flex shrink-0 items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  onChange={(e) => handleSelectAll(completed, e.target.checked)}
                  className="mr-2 h-5 w-5 accent-brand"
                />
                Select All
              </label>
            )}
          </div>
          <div className="space-y-4 mb-6">
            {completed.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-gray-50/50 px-4 py-6 text-center text-sm text-gray-500 dark:bg-gray-25/50">
                No completed interviews.
              </div>
            ) : (
              completed.map((interview) => (
                <div key={interview.id} className="rounded-xl border border-line bg-surface p-4 card-hover">
                  {renderInterviewCard(interview, true)}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Section: Cancelled/No Show Interviews */}
      {showSections.cancelled && (
        <>
          <div className="flex flex-wrap items-center gap-3 px-4 mb-4 mt-8">
            <span className="h-6 w-1 shrink-0 rounded-full bg-line" />
            <FiXCircle className="h-5 w-5 shrink-0 text-gray-500" />
            <h2 className="whitespace-nowrap text-sm font-semibold text-ink">
              Cancelled/No Show Interviews
            </h2>
            <span className="shrink-0 rounded-full border border-line bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-25">
              {cancelled.length}
            </span>
            <div className="flex-1 border-t border-line" />
            {cancelled.length > 0 && (
              <label className="flex shrink-0 items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  onChange={(e) => handleSelectAll(cancelled, e.target.checked)}
                  className="mr-2 h-5 w-5 accent-brand"
                />
                Select All
              </label>
            )}
          </div>
          <div className="space-y-4 mb-6">
            {cancelled.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-gray-50/50 px-4 py-6 text-center text-sm text-gray-500 dark:bg-gray-25/50">
                No cancelled or no-show interviews.
              </div>
            ) : (
              cancelled.map((interview) => (
                <div key={interview.id} className="rounded-xl border border-line bg-surface p-4 card-hover">
                  {renderInterviewCard(interview, true)}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={handleScheduleInterview}
        saving={saving}
        organizationId={organizationId}
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
    </OrgAppShell>
  );
}

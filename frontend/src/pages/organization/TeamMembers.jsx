import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import Card from "../../components/ui/Card";
import {
  getSidebarItems,
  getBackendUrl,
  getAuthHeaders,
} from "../../utils/auth";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiBriefcase,
  FiMail,
} from "react-icons/fi";

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close modal"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Date formatting utility
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
};

export default function TeamMembers() {
  const navigate = useNavigate();
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [teamMembers, setTeamMembers] = useState([]);
  const [candidates, setCandidates] = useState([]); // Added to show hired candidates
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [activeTab, setActiveTab] = useState("team"); // Toggle between team members and candidates

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [saving, setSaving] = useState(false);

  // Get organization ID
  useEffect(() => {
    const getOrgId = async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/auth/me`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.organization_id) {
            setOrganizationId(data.user.organization_id);
          } else {
            setError("Unable to determine organization");
          }
        } else {
          setError("Failed to authenticate");
        }
      } catch (err) {
        console.error("Error getting user info:", err);
        setError("Network error");
      }
    };

    getOrgId();
  }, []);

  // Load team members
  const loadTeamMembers = async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${getBackendUrl()}/api/organizations/${organizationId}/team-members`,
        {
          credentials: "include",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to load team members");
      }
    } catch (err) {
      console.error("Error loading team members:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load hired candidates
  const loadHiredCandidates = async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${getBackendUrl()}/api/applications?status=hired&organization_id=${organizationId}`,
        {
          credentials: "include",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setCandidates(result.data || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to load hired candidates");
      }
    } catch (err) {
      console.error("Error loading hired candidates:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      if (activeTab === "team") {
        loadTeamMembers();
      } else {
        loadHiredCandidates();
      }
    }
  }, [organizationId, activeTab]);

  // Invite team member
  const inviteMember = async (formData) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `${getBackendUrl()}/api/organizations/${organizationId}/invite`,
        {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        setShowInviteModal(false);
        loadTeamMembers(); // Refresh list
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to invite member");
      }
    } catch (err) {
      console.error("Error inviting member:", err);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Edit team member
  const editMember = async (formData) => {
    if (!editingMember) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `${getBackendUrl()}/api/organizations/${organizationId}/team-members/${
          editingMember.id
        }`,
        {
          method: "PUT",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        setShowEditModal(false);
        setEditingMember(null);
        loadTeamMembers(); // Refresh list
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to update member");
      }
    } catch (err) {
      console.error("Error updating member:", err);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Delete team member
  const deleteMember = async () => {
    if (!editingMember) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `${getBackendUrl()}/api/organizations/${organizationId}/team-members/${
          editingMember.id
        }`,
        {
          method: "DELETE",
          credentials: "include",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        setShowDeleteConfirm(false);
        setEditingMember(null);
        loadTeamMembers(); // Refresh list
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to delete member");
      }
    } catch (err) {
      console.error("Error deleting member:", err);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Function to toggle onboarding status for candidates
  const toggleOnboardingStatus = async (
    applicationId,
    currentlyOnboarded,
    candidateName
  ) => {
    try {
      const endpoint = currentlyOnboarded
        ? `/api/applications/${applicationId}/offboard`
        : `/api/applications/${applicationId}/onboard`;

      const response = await fetch(`${getBackendUrl()}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        // Reload candidates to reflect the change
        await loadHiredCandidates();
        alert(
          `Candidate ${candidateName} ${
            currentlyOnboarded ? "removed from" : "added to"
          } onboarded list`
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to update onboarding status"
        );
      }
    } catch (err) {
      console.error("Error updating onboarding status:", err);
      alert(`Error updating onboarding status: ${err.message}`);
    }
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <OrganizationNavbar />
      <div className="p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Team Management
            </h1>
            <p className="text-gray-600">
              Manage your team members and track hired candidates
            </p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <button
              onClick={() => setActiveTab("team")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "team"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Team Members ({teamMembers.length})
            </button>
            <button
              onClick={() => setActiveTab("candidates")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "candidates"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Hired Candidates ({candidates.length})
            </button>
            {activeTab === "team" && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
              >
                <FiPlus className="mr-2" />
                Invite Member
              </button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    Team Members
                  </p>
                  <p className="text-2xl font-bold">{teamMembers.length}</p>
                </div>
                <FiUsers className="h-8 w-8 text-blue-200" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">
                    Hired Candidates
                  </p>
                  <p className="text-2xl font-bold">{candidates.length}</p>
                </div>
                <FiCheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">
                    Onboarded
                  </p>
                  <p className="text-2xl font-bold">
                    {candidates.filter((c) => c.onboarded).length}
                  </p>
                </div>
                <FiBriefcase className="h-8 w-8 text-purple-200" />
              </div>
            </div>
          </Card>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </Card>
            ))}
          </div>
        ) : activeTab === "team" ? (
          <>
            {teamMembers.length === 0 ? (
              <Card className="text-center py-16 border-2 border-dashed border-gray-300">
                <FiUsers className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No team members yet
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Get started by inviting your first team member to collaborate
                  on hiring and recruitment.
                </p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                >
                  <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                  Invite First Member
                </button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((member) => (
                  <Card
                    key={member.id}
                    className="relative hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {member.user?.name
                            ? member.user.name.charAt(0).toUpperCase()
                            : "U"}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {member.user?.name || "Unnamed User"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {member.role || "No role assigned"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <FiUsers className="mr-2" size={14} />
                          Joined: {formatDate(member.join_date)}
                        </div>
                        {member.user?.email && (
                          <div className="flex items-center text-sm text-gray-500">
                            <FiMail className="mr-2" size={14} />
                            {member.user.email}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <button
                          onClick={() =>
                            navigate(`/organization/user/${member.user?.id}`)
                          }
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                        >
                          <FiEye className="mr-2" size={16} />
                          View Profile
                        </button>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingMember(member);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
                            aria-label="Edit member"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingMember(member);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
                            aria-label="Remove member"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          // Hired candidates tab
          <>
            {candidates.length === 0 ? (
              <Card className="text-center py-16 border-2 border-dashed border-gray-300">
                <FiCheckCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No hired candidates yet
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Candidates who pass their interviews will appear here. Start
                  conducting interviews to build your team.
                </p>
                <button
                  onClick={() => navigate("/organization/candidates")}
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                  <FiBriefcase className="-ml-1 mr-2 h-5 w-5" />
                  View Candidates
                </button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidates.map((candidate) => (
                  <Card
                    key={candidate.id}
                    className="relative hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {candidate.user?.name
                            ? candidate.user.name.charAt(0).toUpperCase()
                            : "C"}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {candidate.user?.name || "Unnamed Candidate"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Applied for:{" "}
                            {candidate.post?.title || "Unknown Position"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <FiBriefcase className="mr-2" size={14} />
                          Applied: {formatDate(candidate.applied_at)}
                        </div>
                        {candidate.user?.email && (
                          <div className="flex items-center text-sm text-gray-500">
                            <FiMail className="mr-2" size={14} />
                            {candidate.user.email}
                          </div>
                        )}
                        <div className="flex items-center mt-2">
                          {candidate.onboarded ? (
                            <>
                              <FiCheckCircle
                                className="text-green-500 mr-2"
                                size={16}
                              />
                              <span className="text-sm text-green-700 font-medium">
                                Onboarded
                              </span>
                            </>
                          ) : (
                            <>
                              <FiXCircle
                                className="text-yellow-500 mr-2"
                                size={16}
                              />
                              <span className="text-sm text-yellow-700 font-medium">
                                Not Onboarded
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <button
                          onClick={() =>
                            navigate(`/organization/user/${candidate.user?.id}`)
                          }
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                        >
                          <FiEye className="mr-2" size={16} />
                          View Profile
                        </button>

                        <button
                          onClick={() =>
                            toggleOnboardingStatus(
                              candidate.id,
                              candidate.onboarded,
                              candidate.user?.name || "Unnamed Candidate"
                            )
                          }
                          className={`inline-flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors duration-200 ${
                            candidate.onboarded
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          }`}
                        >
                          {candidate.onboarded
                            ? "Mark Not Onboarded"
                            : "Mark Onboarded"}
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <Modal onClose={() => setShowInviteModal(false)}>
          <h2 id="modal-title" className="text-xl font-bold mb-4">
            Invite Team Member
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              inviteMember({
                email: formData.get("email"),
                role: formData.get("role"),
              });
            }}
          >
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Role
              </label>
              <select
                id="role"
                name="role"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a role</option>
                <option value="Admin">Admin</option>
                <option value="HR">HR</option>
                <option value="Manager">Manager</option>
                <option value="Member">Member</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
              >
                {saving ? "Inviting..." : "Invite"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && editingMember && (
        <Modal onClose={() => setShowEditModal(false)}>
          <h2 id="modal-title" className="text-xl font-bold mb-4">
            Edit Team Member
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              editMember({
                role: formData.get("role"),
                join_date: formData.get("join_date"),
              });
            }}
          >
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <p className="text-gray-900">{editingMember.user?.name}</p>
            </div>
            <div className="mb-4">
              <label
                htmlFor="edit-role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Role
              </label>
              <select
                id="edit-role"
                name="role"
                defaultValue={editingMember.role}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Admin">Admin</option>
                <option value="HR">HR</option>
                <option value="Manager">Manager</option>
                <option value="Member">Member</option>
              </select>
            </div>
            <div className="mb-4">
              <label
                htmlFor="join_date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Join Date
              </label>
              <input
                type="date"
                id="join_date"
                name="join_date"
                defaultValue={
                  editingMember.join_date
                    ? new Date(editingMember.join_date)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && editingMember && (
        <Modal onClose={() => setShowDeleteConfirm(false)}>
          <h2 id="modal-title" className="text-xl font-bold mb-4">
            Confirm Removal
          </h2>
          <p className="mb-6">
            Are you sure you want to remove{" "}
            <span className="font-semibold">
              {editingMember.user?.name || "this member"}
            </span>{" "}
            from the team?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              onClick={deleteMember}
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50"
            >
              {saving ? "Removing..." : "Remove"}
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}

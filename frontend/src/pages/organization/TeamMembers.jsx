import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems } from "../../utils/auth";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUser,
  FiUsers,
  FiMail,
  FiShield,
  FiCalendar,
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
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);

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
        const res = await fetch("/api/auth/me", { credentials: "include" });
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
        `/api/organizations/${organizationId}/team-members`,
        {
          credentials: "include",
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

  useEffect(() => {
    if (organizationId) {
      loadTeamMembers();
    }
  }, [organizationId]);

  // Invite team member
  const inviteMember = async (formData) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        `/api/organizations/${organizationId}/team-members/${editingMember.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
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
        `/api/organizations/${organizationId}/team-members/${editingMember.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        setShowDeleteConfirm(false);
        setEditingMember(null);
        loadTeamMembers(); // Refresh list
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to remove member");
      }
    } catch (err) {
      console.error("Error removing member:", err);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setShowEditModal(true);
  };

  const openDeleteConfirm = (member) => {
    setEditingMember(member);
    setShowDeleteConfirm(true);
  };

  if (loading && !organizationId) {
    return (
      <DashboardLayout
        NavbarComponent={OrganizationNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center py-12">
          <div className="animate-pulse">
            <div className="text-gray-500 mb-4">Loading...</div>
            <div className="w-64 h-4 bg-gray-200 rounded mb-2"></div>
            <div className="w-48 h-4 bg-gray-200 rounded"></div>
          </div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-600/80 via-purple-600/60 to-cyan-500/60 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">
                Team Members
              </h1>
              <p className="mt-1 text-white/90">
                Manage your organization's team members
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FiPlus size={16} />
              Invite Member
            </button>
          </div>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-12">
            <FiUsers size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Team Members Yet
            </h3>
            <p className="text-gray-500 mb-4">
              Start by inviting your first team member.
            </p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Invite First Member
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <FiUser size={16} className="text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.user?.name ||
                              member.user?.email ||
                              "Unknown"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(member.join_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(member)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(member)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Invite Modal */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Invite Team Member
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            inviteMember({
              email: formData.get("email"),
              role: formData.get("role") || "Member",
              permissions: formData.get("permissions")
                ? formData
                    .get("permissions")
                    .split(",")
                    .map((p) => p.trim())
                : [],
              join_date: formData.get("join_date") || null,
            });
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="member@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                name="role"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
                <option value="HR">HR</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Permissions (comma-separated)
              </label>
              <input
                type="text"
                name="permissions"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="read,write,delete"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Join Date
              </label>
              <input
                type="date"
                name="join_date"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                "Send Invite"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Edit Team Member
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            editMember({
              role: formData.get("role"),
              permissions: formData.get("permissions")
                ? formData
                    .get("permissions")
                    .split(",")
                    .map((p) => p.trim())
                : [],
              join_date: formData.get("join_date") || null,
            });
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                name="role"
                defaultValue={editingMember?.role || "Member"}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
                <option value="HR">HR</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Permissions (comma-separated)
              </label>
              <input
                type="text"
                name="permissions"
                defaultValue={editingMember?.permissions?.join(", ") || ""}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="read,write,delete"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Join Date
              </label>
              <input
                type="date"
                name="join_date"
                defaultValue={
                  editingMember?.join_date
                    ? editingMember.join_date.split("T")[0]
                    : ""
                }
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                "Update"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Remove Team Member
        </h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to remove{" "}
          <strong>
            {editingMember?.user?.name || editingMember?.user?.email}
          </strong>{" "}
          from the team? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={deleteMember}
            disabled={saving}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              "Remove"
            )}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

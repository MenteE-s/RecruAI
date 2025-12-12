import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
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
  FiEye,
  FiEyeOff,
  FiBarChart2,
  FiCopy,
  FiCheck,
  FiX,
  FiGlobe,
  FiLock,
  FiShare2,
} from "react-icons/fi";
import { toast } from "react-toastify";

// Date formatting utility
const formatDate = (dateString) => {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Modal Component
const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {title && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold" id="modal-title">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

// Create/Edit Profile Modal
const ProfileModal = ({ isOpen, onClose, profile, onSave }) => {
  const [formData, setFormData] = useState({
    slug: "",
    is_public: true,
    show_contact_info: false,
    show_resume: true,
    show_experience: true,
    show_education: true,
    show_skills: true,
    show_projects: true,
    expires_at: "",
  });
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        slug: profile.slug || "",
        is_public: profile.is_public ?? true,
        show_contact_info: profile.show_contact_info ?? false,
        show_resume: profile.show_resume ?? true,
        show_experience: profile.show_experience ?? true,
        show_education: profile.show_education ?? true,
        show_skills: profile.show_skills ?? true,
        show_projects: profile.show_projects ?? true,
        expires_at: profile.expires_at
          ? new Date(profile.expires_at).toISOString().split("T")[0]
          : "",
      });
      setSlugAvailable(true);
    } else {
      setFormData({
        slug: "",
        is_public: true,
        show_contact_info: false,
        show_resume: true,
        show_experience: true,
        show_education: true,
        show_skills: true,
        show_projects: true,
        expires_at: "",
      });
      setSlugAvailable(null);
    }
  }, [profile, isOpen]);

  const checkSlugAvailability = async (slug) => {
    if (!slug.trim()) {
      setSlugAvailable(null);
      return;
    }

    setCheckingSlug(true);
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/profiles/check-slug`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ slug }),
        }
      );

      const data = await response.json();
      setSlugAvailable(data.data.available);
    } catch (error) {
      console.error("Error checking slug:", error);
      setSlugAvailable(null);
    } finally {
      setCheckingSlug(false);
    }
  };

  const handleSlugChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, slug: value });
    // Debounce slug checking
    setTimeout(() => checkSlugAvailability(value), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = profile ? "PUT" : "POST";
      const url = profile
        ? `${getBackendUrl()}/api/profiles/${profile.slug}`
        : `${getBackendUrl()}/api/profiles`;

      const response = await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          expires_at: formData.expires_at || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Profile ${profile ? "updated" : "created"} successfully!`
        );
        onSave();
        onClose();
      } else {
        toast.error(data.message || "Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${profile ? "Edit" : "Create"} Shareable Profile`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profile URL Slug *
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">recruai.com/</span>
            <input
              type="text"
              value={formData.slug}
              onChange={handleSlugChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your-name"
              required
            />
            {checkingSlug && <div className="text-blue-500">Checking...</div>}
            {slugAvailable === true && <FiCheck className="text-green-500" />}
            {slugAvailable === false && <FiX className="text-red-500" />}
          </div>
          {slugAvailable === false && (
            <p className="text-red-500 text-sm mt-1">
              This slug is already taken
            </p>
          )}
        </div>

        {/* Visibility Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Visibility Settings
          </h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) =>
                  setFormData({ ...formData, is_public: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-sm">Make profile public</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.show_contact_info}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    show_contact_info: e.target.checked,
                  })
                }
                className="mr-2"
              />
              <span className="text-sm">Show contact information</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.show_resume}
                onChange={(e) =>
                  setFormData({ ...formData, show_resume: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-sm">Show resume download</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.show_experience}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    show_experience: e.target.checked,
                  })
                }
                className="mr-2"
              />
              <span className="text-sm">Show work experience</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.show_education}
                onChange={(e) =>
                  setFormData({ ...formData, show_education: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-sm">Show education</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.show_skills}
                onChange={(e) =>
                  setFormData({ ...formData, show_skills: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-sm">Show skills</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.show_projects}
                onChange={(e) =>
                  setFormData({ ...formData, show_projects: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-sm">Show projects</span>
            </label>
          </div>
        </div>

        {/* Expiry Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiry Date (Optional)
          </label>
          <input
            type="date"
            value={formData.expires_at}
            onChange={(e) =>
              setFormData({ ...formData, expires_at: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={new Date().toISOString().split("T")[0]}
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty for no expiry
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || slugAvailable === false}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : profile ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Analytics Modal
const AnalyticsModal = ({ isOpen, onClose, profile }) => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    total_views: 0,
    unique_visitors: 0,
  });

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/profiles/${profile.slug}/analytics`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data.analytics);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (isOpen && profile) {
      loadAnalytics();
    }
  }, [isOpen, profile, loadAnalytics]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile Analytics">
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {summary.total_views}
            </div>
            <div className="text-sm text-blue-800">Total Views</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {summary.unique_visitors}
            </div>
            <div className="text-sm text-green-800">Unique Visitors</div>
          </div>
        </div>

        {/* Analytics Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  IP Address
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  User Agent
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Referrer
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-4 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : analytics.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-4 text-center text-gray-500"
                  >
                    No analytics data available
                  </td>
                </tr>
              ) : (
                analytics.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {formatDate(item.viewed_at)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {item.ip_address || "N/A"}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                      {item.user_agent || "N/A"}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                      {item.referrer || "Direct"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

// Main Component
const ShareableProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsProfile, setAnalyticsProfile] = useState(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/profiles`, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      if (response.ok) {
        // Handle both paginated response format and direct data format
        const profiles = data.data || data;
        setProfiles(profiles);
      } else {
        console.error("Failed to load profiles:", data);
        toast.error(data.message || "Failed to load profiles");
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (profile) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the profile "${profile.slug}"?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${getBackendUrl()}/api/profiles/${profile.slug}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Profile deleted successfully");
        loadProfiles();
      } else {
        toast.error(data.message || "Failed to delete profile");
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast.error("Failed to delete profile");
    }
  };

  const copyProfileLink = (slug) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Profile link copied to clipboard!");
  };

  const toggleProfileStatus = async (profile) => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/profiles/${profile.slug}`,
        {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: !profile.is_active,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success(
          `Profile ${
            profile.is_active ? "deactivated" : "activated"
          } successfully`
        );
        loadProfiles();
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        sidebarItems={getSidebarItems("individual")}
        navbar={<IndividualNavbar />}
      >
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading profiles...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      sidebarItems={getSidebarItems("individual")}
      navbar={<IndividualNavbar />}
    >
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Shareable Profiles
            </h1>
            <p className="text-gray-600">
              Create and manage public profiles that others can view
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FiPlus className="mr-2" />
            Create Profile
          </button>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <Card key={profile.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {profile.slug}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {profile.view_count} views
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {profile.is_public ? (
                    <FiGlobe className="text-green-500" title="Public" />
                  ) : (
                    <FiLock className="text-gray-400" title="Private" />
                  )}
                  {profile.is_active ? (
                    <FiEye className="text-green-500" title="Active" />
                  ) : (
                    <FiEyeOff className="text-red-500" title="Inactive" />
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">
                  <strong>Expires:</strong> {formatDate(profile.expires_at)}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Created:</strong> {formatDate(profile.created_at)}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {profile.show_contact_info && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Contact Info
                  </span>
                )}
                {profile.show_experience && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    Experience
                  </span>
                )}
                {profile.show_education && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                    Education
                  </span>
                )}
                {profile.show_skills && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                    Skills
                  </span>
                )}
                {profile.show_projects && (
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">
                    Projects
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => copyProfileLink(profile.slug)}
                  className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  title="Copy profile link"
                >
                  <FiCopy className="mr-1" />
                  Copy Link
                </button>

                <button
                  onClick={() => {
                    setAnalyticsProfile(profile);
                    setShowAnalyticsModal(true);
                  }}
                  className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  title="View analytics"
                >
                  <FiBarChart2 className="mr-1" />
                  Analytics
                </button>

                <button
                  onClick={() => setEditingProfile(profile)}
                  className="flex items-center px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                  title="Edit profile"
                >
                  <FiEdit2 className="mr-1" />
                  Edit
                </button>

                <button
                  onClick={() => toggleProfileStatus(profile)}
                  className={`flex items-center px-3 py-1 text-sm rounded ${
                    profile.is_active
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                  title={
                    profile.is_active
                      ? "Deactivate profile"
                      : "Activate profile"
                  }
                >
                  {profile.is_active ? "Deactivate" : "Activate"}
                </button>

                <button
                  onClick={() => handleDeleteProfile(profile)}
                  className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  title="Delete profile"
                >
                  <FiTrash2 className="mr-1" />
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>

        {profiles.length === 0 && (
          <div className="text-center py-12">
            <FiShare2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No profiles
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first shareable profile.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <FiPlus className="mr-2" />
                Create Profile
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        <ProfileModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={loadProfiles}
        />

        <ProfileModal
          isOpen={!!editingProfile}
          onClose={() => setEditingProfile(null)}
          profile={editingProfile}
          onSave={loadProfiles}
        />

        <AnalyticsModal
          isOpen={showAnalyticsModal}
          onClose={() => setShowAnalyticsModal(false)}
          profile={analyticsProfile}
        />
      </div>
    </DashboardLayout>
  );
};

export default ShareableProfiles;

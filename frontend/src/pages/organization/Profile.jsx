import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import Card from "../../components/ui/Card";
import { getSidebarItems, getUploadUrl } from "../../utils/auth";
import {
  FiX,
  FiEdit2,
  FiBriefcase,
  FiUsers,
  FiTarget,
  FiEye,
  FiLink,
  FiCamera,
  FiImage,
  FiTrash2,
  FiUpload,
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
          <FiX size={24} />
        </button>
      </div>
    </div>
  );
};

// Social Media Modal
const SocialMediaModal = ({ isOpen, onClose, socialLinks, onSave, saving }) => {
  const [links, setLinks] = useState(socialLinks || []);

  useEffect(() => {
    setLinks(socialLinks || []);
  }, [socialLinks]);

  const addLink = () => {
    setLinks([...links, { platform: "", url: "", username: "" }]);
  };

  const updateLink = (index, field, value) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  const removeLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(links.filter((link) => link.platform && link.url));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold text-gray-900 mb-4" id="modal-title">
        Edit Social Media Links
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {links.map((link, index) => (
            <div key={index} className="border rounded p-3 space-y-2">
              <select
                value={link.platform || ""}
                onChange={(e) => updateLink(index, "platform", e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Platform</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Twitter">Twitter</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="YouTube">YouTube</option>
                <option value="GitHub">GitHub</option>
                <option value="Website">Website</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="url"
                placeholder="Profile URL"
                value={link.url || ""}
                onChange={(e) => updateLink(index, "url", e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Username/Handle (optional)"
                value={link.username || ""}
                onChange={(e) => updateLink(index, "username", e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => removeLink(index)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addLink}
            className="w-full p-2 border-2 border-dashed border-gray-300 rounded text-gray-600 hover:border-gray-400"
          >
            + Add Social Media Link
          </button>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
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
              "Save"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default function OrganizationProfile() {
  const { orgId } = useParams();
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  // State for organization profile data
  const [profileData, setProfileData] = useState({
    name: "",
    description: "",
    website: "",
    company_size: "",
    industry: "",
    mission: "",
    vision: "",
    social_media_links: [],
    profile_image: "",
    banner_image: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImageType, setSelectedImageType] = useState(null); // 'profile' or 'banner'
  const [canEdit, setCanEdit] = useState(false);

  // Load organization profile data
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // First get user to determine permissions
        const userRes = await fetch("/api/auth/me", { credentials: "include" });
        if (!userRes.ok) throw new Error("Failed to get user");

        const userData = await userRes.json();
        const currentUserOrgId = userData.user.organization_id;

        // Determine which organization to load
        const targetOrgId = orgId || currentUserOrgId;

        if (!targetOrgId) {
          setError("No organization found for this user");
          return;
        }

        // Check if user can edit this profile (only their own organization)
        setCanEdit(!orgId || parseInt(orgId) === currentUserOrgId);

        // Get organization profile
        const orgRes = await fetch(`/api/organizations/${targetOrgId}`, {
          credentials: "include",
        });
        if (!orgRes.ok) throw new Error("Failed to load organization profile");

        const orgData = await orgRes.json();
        setProfileData({
          name: orgData.name || "",
          description: orgData.description || "",
          website: orgData.website || "",
          company_size: orgData.company_size || "",
          industry: orgData.industry || "",
          mission: orgData.mission || "",
          vision: orgData.vision || "",
          social_media_links: orgData.social_media_links || [],
          profile_image: orgData.profile_image || "",
          banner_image: orgData.banner_image || "",
        });
      } catch (error) {
        console.error("Error loading profile data:", error);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [orgId]);

  const saveBasicInfo = async (data) => {
    if (!canEdit) return;

    setSaving(true);
    setError(null);

    try {
      const userRes = await fetch("/api/auth/me", { credentials: "include" });
      const userData = await userRes.json();
      const currentUserOrgId = userData.user.organization_id;
      const targetOrgId = orgId || currentUserOrgId;

      const response = await fetch(`/api/organizations/${targetOrgId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          website: data.website,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setProfileData((prev) => ({
          ...prev,
          name: result.name,
          description: result.description,
          website: result.website,
        }));
        setEditingSection(null);
      } else {
        setError("Failed to save basic info");
      }
    } catch (error) {
      console.error("Error saving basic info:", error);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveExtendedProfile = async (data) => {
    if (!canEdit) return;

    setSaving(true);
    setError(null);

    try {
      const userRes = await fetch("/api/auth/me", { credentials: "include" });
      const userData = await userRes.json();
      const currentUserOrgId = userData.user.organization_id;
      const targetOrgId = orgId || currentUserOrgId;

      const response = await fetch(
        `/api/organizations/${targetOrgId}/profile`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            company_size: data.company_size,
            industry: data.industry,
            mission: data.mission,
            vision: data.vision,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setProfileData((prev) => ({
          ...prev,
          company_size: result.company_size,
          industry: result.industry,
          mission: result.mission,
          vision: result.vision,
        }));
        setEditingSection(null);
      } else {
        setError("Failed to save extended profile");
      }
    } catch (error) {
      console.error("Error saving extended profile:", error);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveSocialMedia = async (links) => {
    if (!canEdit) return;

    setSaving(true);
    setError(null);

    try {
      const userRes = await fetch("/api/auth/me", { credentials: "include" });
      const userData = await userRes.json();
      const currentUserOrgId = userData.user.organization_id;
      const targetOrgId = orgId || currentUserOrgId;

      const response = await fetch(
        `/api/organizations/${targetOrgId}/profile`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            social_media_links: links,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setProfileData((prev) => ({
          ...prev,
          social_media_links: result.social_media_links || [],
        }));
        setEditingSection(null);
      } else {
        setError("Failed to save social media links");
      }
    } catch (error) {
      console.error("Error saving social media:", error);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (file, imageType) => {
    if (!canEdit) return;

    console.log(
      `Starting upload for ${imageType} image:`,
      file.name,
      file.size
    );
    setUploadingImage(true);
    setError(null);

    try {
      const userRes = await fetch("/api/auth/me", { credentials: "include" });
      const userData = await userRes.json();
      const currentUserOrgId = userData.user.organization_id;
      const targetOrgId = orgId || currentUserOrgId;

      const formData = new FormData();
      formData.append(
        imageType === "profile" ? "profile_image" : "banner_image",
        file
      );

      const endpoint =
        imageType === "profile"
          ? `/api/organizations/${targetOrgId}/upload-profile-image`
          : `/api/organizations/${targetOrgId}/upload-banner-image`;

      console.log(`Uploading to endpoint: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`Upload successful for ${imageType}:`, result);
        setProfileData((prev) => ({
          ...prev,
          [imageType === "profile" ? "profile_image" : "banner_image"]:
            result[imageType === "profile" ? "profile_image" : "banner_image"],
        }));
        setImagePreview(null);
        setSelectedImageType(null);
      } else {
        const errorData = await response.json();
        console.error(`Upload failed for ${imageType}:`, errorData);
        setError(errorData.error || `Failed to upload ${imageType} image`);
      }
    } catch (error) {
      console.error(`Error uploading ${imageType} image:`, error);
      setError("Network error. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = async (imageType) => {
    if (!canEdit) return;

    setSaving(true);
    setError(null);

    try {
      const userRes = await fetch("/api/auth/me", { credentials: "include" });
      const userData = await userRes.json();
      const currentUserOrgId = userData.user.organization_id;
      const targetOrgId = orgId || currentUserOrgId;

      const response = await fetch(
        `/api/organizations/${targetOrgId}/profile`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            [imageType === "profile" ? "profile_image" : "banner_image"]: null,
          }),
        }
      );

      if (response.ok) {
        setProfileData((prev) => ({
          ...prev,
          [imageType === "profile" ? "profile_image" : "banner_image"]: "",
        }));
      } else {
        setError(`Failed to remove ${imageType} image`);
      }
    } catch (error) {
      console.error(`Error removing ${imageType} image:`, error);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (event, imageType) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError("Please select a valid image file (JPEG, PNG, or GIF)");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }

      setImagePreview(URL.createObjectURL(file));
      setSelectedImageType(imageType);

      // Auto-upload the image
      uploadImage(file, imageType);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={OrganizationNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center py-12">
          <div className="animate-pulse">
            <div className="text-gray-500 mb-4">Loading profile...</div>
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
              <FiX className="mr-2" size={20} />
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

      {/* Profile Images Section */}
      <div className="mb-6">
        <div className="relative">
          {/* Banner Image */}
          <div className="relative h-48 md:h-64 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl overflow-hidden shadow-lg">
            {profileData.banner_image ? (
              <img
                src={getUploadUrl(profileData.banner_image)}
                alt="Organization banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                <div className="text-white text-center">
                  <FiImage size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm opacity-75">No banner image</p>
                </div>
              </div>
            )}

            {/* Banner Upload/Edit Button */}
            {canEdit && (
              <div className="absolute top-4 right-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageSelect(e, "banner")}
                    className="hidden"
                  />
                  <div className="bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition-colors">
                    {profileData.banner_image ? (
                      <FiEdit2 size={16} className="text-gray-700" />
                    ) : (
                      <FiUpload size={16} className="text-gray-700" />
                    )}
                  </div>
                </label>
                {profileData.banner_image && (
                  <button
                    onClick={() => removeImage("banner")}
                    className="ml-2 bg-red-500/90 hover:bg-red-500 rounded-full p-2 shadow-md transition-colors"
                    disabled={saving}
                  >
                    <FiTrash2 size={16} className="text-white" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Profile Image */}
          <div className="absolute -bottom-8 left-6 md:left-8">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full border-4 border-white shadow-lg overflow-hidden">
                {profileData.profile_image ? (
                  <img
                    src={getUploadUrl(profileData.profile_image)}
                    alt="Organization profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <FiCamera size={32} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* Profile Image Upload/Edit Button */}
              {canEdit && (
                <>
                  <label className="absolute bottom-0 right-0 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, "profile")}
                      className="hidden"
                    />
                    <div className="bg-blue-600 hover:bg-blue-700 rounded-full p-2 shadow-md transition-colors">
                      {profileData.profile_image ? (
                        <FiEdit2 size={14} className="text-white" />
                      ) : (
                        <FiUpload size={14} className="text-white" />
                      )}
                    </div>
                  </label>

                  {profileData.profile_image && (
                    <button
                      onClick={() => removeImage("profile")}
                      className="absolute bottom-0 right-10 bg-red-500 hover:bg-red-600 rounded-full p-2 shadow-md transition-colors"
                      disabled={saving}
                    >
                      <FiTrash2 size={14} className="text-white" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Loading overlay for image uploads */}
        {uploadingImage && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-2xl flex items-center justify-center z-10">
            <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">Uploading image...</span>
            </div>
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div className="mb-6">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-blue-600/80 via-purple-600/60 to-cyan-500/60 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">
                Organization Profile
              </h1>
              <p className="mt-1 text-white/90">
                Manage your company information and profile
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Company Info */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiBriefcase className="mr-2" />
              Basic Company Information
            </h3>
            {canEdit && (
              <button
                onClick={() => setEditingSection("basic")}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiEdit2 size={16} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <p className="text-gray-900">{profileData.name || "Not set"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <p className="text-gray-900">
                {profileData.website ? (
                  <a
                    href={profileData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {profileData.website}
                  </a>
                ) : (
                  "Not set"
                )}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <p className="text-gray-900 leading-relaxed">
                {profileData.description || "No description provided"}
              </p>
            </div>
          </div>
        </Card>

        {/* Extended Profile */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiUsers className="mr-2" />
              Extended Profile
            </h3>
            {canEdit && (
              <button
                onClick={() => setEditingSection("extended")}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiEdit2 size={16} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Size
              </label>
              <p className="text-gray-900">
                {profileData.company_size || "Not set"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <p className="text-gray-900">
                {profileData.industry || "Not set"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FiTarget className="mr-1" />
                Mission
              </label>
              <p className="text-gray-900 leading-relaxed">
                {profileData.mission || "Not set"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FiEye className="mr-1" />
                Vision
              </label>
              <p className="text-gray-900 leading-relaxed">
                {profileData.vision || "Not set"}
              </p>
            </div>
          </div>
        </Card>

        {/* Social Media Links */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiLink className="mr-2" />
              Social Media Links
            </h3>
            {canEdit && (
              <button
                onClick={() => setEditingSection("social")}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiEdit2 size={16} />
              </button>
            )}
          </div>
          {Array.isArray(profileData.social_media_links) &&
          profileData.social_media_links.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profileData.social_media_links.map((link, index) => (
                <div key={index} className="border rounded p-3">
                  <h4 className="font-medium text-gray-900">{link.platform}</h4>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    {link.url}
                  </a>
                  {link.username && (
                    <p className="text-xs text-gray-500">@{link.username}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No social media links added yet
            </p>
          )}
        </Card>
      </div>

      {/* Basic Info Modal */}
      {editingSection === "basic" && (
        <Modal isOpen={true} onClose={() => setEditingSection(null)}>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Edit Basic Information
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              saveBasicInfo({
                name: formData.get("name"),
                description: formData.get("description"),
                website: formData.get("website"),
              });
            }}
          >
            <div className="space-y-4">
              <input
                name="name"
                type="text"
                placeholder="Company Name"
                defaultValue={profileData.name}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                name="website"
                type="url"
                placeholder="Website URL"
                defaultValue={profileData.website}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                name="description"
                placeholder="Company Description"
                defaultValue={profileData.description}
                className="w-full p-3 border rounded resize-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => setEditingSection(null)}
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
                  "Save"
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Extended Profile Modal */}
      {editingSection === "extended" && (
        <Modal isOpen={true} onClose={() => setEditingSection(null)}>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Edit Extended Profile
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              saveExtendedProfile({
                company_size: formData.get("company_size"),
                industry: formData.get("industry"),
                mission: formData.get("mission"),
                vision: formData.get("vision"),
              });
            }}
          >
            <div className="space-y-4">
              <select
                name="company_size"
                defaultValue={profileData.company_size}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Company Size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
              <input
                name="industry"
                type="text"
                placeholder="Industry (e.g., Technology, Healthcare)"
                defaultValue={profileData.industry}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                name="mission"
                placeholder="Company Mission"
                defaultValue={profileData.mission}
                className="w-full p-3 border rounded resize-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <textarea
                name="vision"
                placeholder="Company Vision"
                defaultValue={profileData.vision}
                className="w-full p-3 border rounded resize-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => setEditingSection(null)}
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
                  "Save"
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Social Media Modal */}
      {editingSection === "social" && (
        <SocialMediaModal
          isOpen={true}
          onClose={() => setEditingSection(null)}
          socialLinks={profileData.social_media_links}
          onSave={saveSocialMedia}
          saving={saving}
        />
      )}
    </DashboardLayout>
  );
}

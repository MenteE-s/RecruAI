import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import FollowButton from "../../components/ui/FollowButton";
import {
  getSidebarItems,
  getUploadUrl,
  getBackendUrl,
  getAuthHeaders,
} from "../../utils/auth";
import {
  FiX,
  FiEdit2,
  FiBriefcase,
  FiMapPin,
  FiUsers,
  FiTarget,
  FiEye,
  FiLink,
  FiCamera,
  FiImage,
  FiTrash2,
  FiUpload,
  FiGlobe,
  FiAward,
  FiDollarSign,
  FiArrowRight,
  FiTag,
  FiStar,
} from "react-icons/fi";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden border border-gray-200 flex flex-col">
        <div className="overflow-y-auto p-6">{children}</div>
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 text-gray-500">
          <FiX className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const SocialMediaModal = ({ isOpen, onClose, socialLinks, onSave, saving }) => {
  const [links, setLinks] = useState(socialLinks || []);
  useEffect(() => setLinks(socialLinks || []), [socialLinks]);
  const addLink = () => setLinks([...links, { platform: "", url: "", username: "" }]);
  const updateLink = (index, field, value) => {
    const n = [...links];
    n[index][field] = value;
    setLinks(n);
  };
  const removeLink = (index) => setLinks(links.filter((_, i) => i !== index));
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(links.filter((l) => l.platform && l.url));
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Edit social links</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        {links.map((link, index) => (
          <div key={index} className="border border-gray-200 p-3 space-y-2 bg-gray-50">
            <select value={link.platform || ""} onChange={(e) => updateLink(index, "platform", e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 text-sm focus:outline-none focus:border-blue-500">
              <option value="">Select platform</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Twitter">Twitter</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="YouTube">YouTube</option>
              <option value="GitHub">GitHub</option>
              <option value="Website">Website</option>
              <option value="Other">Other</option>
            </select>
            <input type="url" placeholder="https://…" value={link.url || ""} onChange={(e) => updateLink(index, "url", e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
            <input type="text" placeholder="Username (optional)" value={link.username || ""} onChange={(e) => updateLink(index, "username", e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
            <button type="button" onClick={() => removeLink(index)} className="text-xs text-red-600 hover:text-red-700 font-medium">Remove</button>
          </div>
        ))}
        <button type="button" onClick={addLink} className="w-full py-2.5 border border-dashed border-gray-300 text-sm text-gray-600 hover:border-gray-400 hover:bg-white">+ Add link</button>
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
};

export default function OrganizationProfile() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [starred, setStarred] = useState(new Set());
  const [currentUserId, setCurrentUserId] = useState(null);
  const [targetOrgId, setTargetOrgId] = useState(null);
  const [profileData, setProfileData] = useState({ name: "", description: "", website: "", company_size: "", industry: "", mission: "", vision: "", social_media_links: [], profile_image: "", banner_image: "", subscription_status: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const userRes = await fetch(`${getBackendUrl()}/api/auth/me`, { credentials: "include", headers: getAuthHeaders() });
        if (!userRes.ok) throw new Error("Failed to get user");
        const userData = await userRes.json();
        const currentUserOrgId = userData.user.organization_id;
        const targetId = orgId || currentUserOrgId;
        if (!targetId) { setError("No organization found for this user"); return; }
        setTargetOrgId(targetId);
        setCurrentUserId(userData.user.id || null);
        setCanEdit(!orgId || parseInt(orgId) === currentUserOrgId);
        const orgRes = await fetch(`${getBackendUrl()}/api/organizations/${targetId}`, { credentials: "include", headers: getAuthHeaders() });
        if (!orgRes.ok) throw new Error("Failed to load organization profile");
        const orgData = await orgRes.json();
        setProfileData({ name: orgData.name || "", description: orgData.description || "", website: orgData.website || "", company_size: orgData.company_size || "", industry: orgData.industry || "", mission: orgData.mission || "", vision: orgData.vision || "", social_media_links: orgData.social_media_links || [], profile_image: orgData.profile_image || "", banner_image: orgData.banner_image || "", subscription_status: orgData.subscription_status || null });
      } catch (e) {
        setError("Failed to load profile data");
      } finally { setLoading(false); }
    };
    loadProfileData();
  }, [orgId]);

  useEffect(() => {
    if (!orgId) return;
    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const res = await fetch(`${getBackendUrl()}/api/organizations/${orgId}/posts`, { credentials: "include", headers: getAuthHeaders() });
        if (res.ok) setPosts(await res.json());
      } catch (e) { console.error("Failed to load posts:", e); }
      finally { setPostsLoading(false); }
    };
    fetchPosts();
  }, [orgId]);

  useEffect(() => {
    if (!targetOrgId) return;
    const fetchTeam = async () => {
      setTeamLoading(true);
      try {
        const res = await fetch(`${getBackendUrl()}/api/organizations/${targetOrgId}/team-members`, { credentials: "include", headers: getAuthHeaders() });
        if (res.ok) {
          const members = await res.json();
          setTeamMembers(Array.isArray(members) ? members : []);
          // Pre-check starred state so stars render correctly on first paint
          if (currentUserId && Array.isArray(members) && members.length > 0) {
            const checks = await Promise.all(members.map((m) => {
              const uid = m.user?.id;
              if (!uid) return null;
              return fetch(`${getBackendUrl()}/api/users/${currentUserId}/is-favorite/${uid}`, { credentials: "include", headers: getAuthHeaders() })
                .then((r) => (r.ok ? r.json() : null))
                .then((d) => (d && d.favorited ? uid : null))
                .catch(() => null);
            }));
            setStarred(new Set(checks.filter(Boolean)));
          }
        }
      } catch (e) { console.error("Failed to load team:", e); }
      finally { setTeamLoading(false); }
    };
    fetchTeam();
  }, [targetOrgId, currentUserId]);

  const toggleStar = async (targetUserId) => {
    if (!currentUserId || !targetUserId) return;
    const wasStarred = starred.has(targetUserId);
    setStarred((prev) => { const n = new Set(prev); if (wasStarred) n.delete(targetUserId); else n.add(targetUserId); return n; });
    try {
      const res = await fetch(`${getBackendUrl()}/api/users/${currentUserId}/toggle-favorite/${targetUserId}`, { method: "POST", credentials: "include", headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStarred((prev) => { const n = new Set(prev); if (data.favorited) n.add(targetUserId); else n.delete(targetUserId); return n; });
    } catch {
      setStarred((prev) => { const n = new Set(prev); if (wasStarred) n.add(targetUserId); else n.delete(targetUserId); return n; });
    }
  };

  const saveBasicInfo = async (data) => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const userRes = await fetch(`${getBackendUrl()}/api/auth/me`, { credentials: "include", headers: getAuthHeaders() });
      const userData = await userRes.json();
      const targetOrgId = orgId || userData.user.organization_id;
      const res = await fetch(`${getBackendUrl()}/api/organizations/${targetOrgId}`, { method: "PUT", headers: getAuthHeaders({ "Content-Type": "application/json" }), credentials: "include", body: JSON.stringify({ name: data.name, description: data.description, website: data.website }) });
      if (res.ok) {
        const result = await res.json();
        setProfileData((p) => ({ ...p, name: result.name, description: result.description, website: result.website }));
        setEditingSection(null);
      } else setError("Failed to save basic info");
    } catch { setError("Network error. Please try again."); }
    finally { setSaving(false); }
  };

  const saveExtendedProfile = async (data) => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const userRes = await fetch(`${getBackendUrl()}/api/auth/me`, { credentials: "include", headers: getAuthHeaders() });
      const userData = await userRes.json();
      const targetOrgId = orgId || userData.user.organization_id;
      const res = await fetch(`${getBackendUrl()}/api/organizations/${targetOrgId}/profile`, { method: "PUT", headers: getAuthHeaders({ "Content-Type": "application/json" }), credentials: "include", body: JSON.stringify({ company_size: data.company_size, industry: data.industry, mission: data.mission, vision: data.vision }) });
      if (res.ok) {
        const result = await res.json();
        setProfileData((p) => ({ ...p, company_size: result.company_size, industry: result.industry, mission: result.mission, vision: result.vision }));
        setEditingSection(null);
      } else setError("Failed to save extended profile");
    } catch { setError("Network error. Please try again."); }
    finally { setSaving(false); }
  };

  const saveSocialMedia = async (links) => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const userRes = await fetch(`${getBackendUrl()}/api/auth/me`, { credentials: "include", headers: getAuthHeaders() });
      const userData = await userRes.json();
      const targetOrgId = orgId || userData.user.organization_id;
      const res = await fetch(`${getBackendUrl()}/api/organizations/${targetOrgId}/profile`, { method: "PUT", headers: getAuthHeaders({ "Content-Type": "application/json" }), credentials: "include", body: JSON.stringify({ social_media_links: links }) });
      if (res.ok) {
        const result = await res.json();
        setProfileData((p) => ({ ...p, social_media_links: result.social_media_links || [] }));
        setEditingSection(null);
      } else setError("Failed to save social media links");
    } catch { setError("Network error. Please try again."); }
    finally { setSaving(false); }
  };

  const uploadImage = async (file, imageType) => {
    if (!canEdit) return;
    setUploadingImage(true);
    try {
      const userRes = await fetch(`${getBackendUrl()}/api/auth/me`, { credentials: "include", headers: getAuthHeaders() });
      const userData = await userRes.json();
      const targetOrgId = orgId || userData.user.organization_id;
      const formData = new FormData();
      formData.append(imageType === "profile" ? "profile_image" : "banner_image", file);
      const endpoint = imageType === "profile" ? `${getBackendUrl()}/api/organizations/${targetOrgId}/upload-profile-image` : `${getBackendUrl()}/api/organizations/${targetOrgId}/upload-banner-image`;
      const res = await fetch(endpoint, { method: "POST", headers: getAuthHeaders(), credentials: "include", body: formData });
      if (res.ok) {
        const result = await res.json();
        setProfileData((p) => ({ ...p, [imageType === "profile" ? "profile_image" : "banner_image"]: result[imageType === "profile" ? "profile_image" : "banner_image"] }));
      } else {
        const err = await res.json();
        setError(err.error || `Failed to upload ${imageType} image`);
      }
    } catch { setError("Network error. Please try again."); }
    finally { setUploadingImage(false); }
  };

  const removeImage = async (imageType) => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const userRes = await fetch(`${getBackendUrl()}/api/auth/me`, { credentials: "include", headers: getAuthHeaders() });
      const userData = await userRes.json();
      const targetOrgId = orgId || userData.user.organization_id;
      const res = await fetch(`${getBackendUrl()}/api/organizations/${targetOrgId}/profile`, { method: "PUT", headers: getAuthHeaders({ "Content-Type": "application/json" }), credentials: "include", body: JSON.stringify({ [imageType === "profile" ? "profile_image" : "banner_image"]: null }) });
      if (res.ok) setProfileData((p) => ({ ...p, [imageType === "profile" ? "profile_image" : "banner_image"]: "" }));
      else setError(`Failed to remove ${imageType} image`);
    } catch { setError("Network error. Please try again."); }
    finally { setSaving(false); }
  };

  const handleImageSelect = (event, imageType) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/gif"].includes(file.type)) { setError("Please select a valid image file (JPEG, PNG, or GIF)"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("File size must be less than 5MB"); return; }
    uploadImage(file, imageType);
  };

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-gray-900 h-64 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 h-48 animate-pulse" />
            <div className="bg-white border border-gray-200 h-48 animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isPaid = profileData.subscription_status?.is_paid_active;

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-red-700"><FiX className="w-5 h-5" />{error}</div>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900 p-1"><FiX className="w-4 h-4" /></button>
        </div>
      )}

      {/* Banner + Avatar */}
      <div className="relative mb-6">
        <div className="relative h-48 md:h-56 bg-gray-900 overflow-hidden">
          {profileData.banner_image ? (
            <img src={getUploadUrl(profileData.banner_image)} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
              <FiImage className="w-12 h-12 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          {canEdit && (
            <div className="absolute top-4 right-4 flex gap-2">
              <label className="cursor-pointer bg-white/90 hover:bg-white p-2 border border-gray-200">
                <input type="file" accept="image/*" onChange={(e) => handleImageSelect(e, "banner")} className="hidden" />
                {profileData.banner_image ? <FiEdit2 className="w-4 h-4 text-gray-700" /> : <FiUpload className="w-4 h-4 text-gray-700" />}
              </label>
              {profileData.banner_image && (
                <button onClick={() => removeImage("banner")} className="bg-red-600 hover:bg-red-700 p-2"><FiTrash2 className="w-4 h-4 text-white" /></button>
              )}
            </div>
          )}
          {isPaid && <span className="absolute top-4 left-4 bg-green-600 text-white text-xs font-bold px-3 py-1">PRO ORGANIZATION</span>}
          {uploadingImage && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white px-4 py-2 flex items-center gap-2"><div className="animate-spin h-5 w-5 border-2 border-gray-200 border-t-blue-600 rounded-full" /> <span className="text-sm">Uploading…</span></div>
            </div>
          )}
        </div>
        <div className="bg-white border border-gray-200 border-t-0 p-6">
          <div className="flex gap-5">
            <div className="relative shrink-0 -mt-12">
              <div className={`w-24 h-24 md:w-28 md:h-28 bg-white border-4 border-white shadow overflow-hidden flex items-center justify-center ${isPaid ? "ring-2 ring-green-600" : ""}`}>
                {profileData.profile_image ? (
                  <img src={getUploadUrl(profileData.profile_image)} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <FiCamera className="w-8 h-8 text-gray-400" />
                )}
              </div>
              {canEdit && (
                <>
                  <label className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 p-1.5 border-2 border-white cursor-pointer">
                    <input type="file" accept="image/*" onChange={(e) => handleImageSelect(e, "profile")} className="hidden" />
                    {profileData.profile_image ? <FiEdit2 className="w-3.5 h-3.5 text-white" /> : <FiUpload className="w-3.5 h-3.5 text-white" />}
                  </label>
                  {profileData.profile_image && <button onClick={() => removeImage("profile")} className="absolute -bottom-1 right-8 bg-red-600 hover:bg-red-700 p-1.5 border-2 border-white"><FiTrash2 className="w-3.5 h-3.5 text-white" /></button>}
                </>
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{profileData.name || "Unnamed Organization"}</h1>
                {isPaid && <span className="text-xs bg-green-600 text-white px-2 py-1 font-bold">PRO</span>}
              </div>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{profileData.description || "No description yet"}</p>
              {profileData.website && <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-1"><FiGlobe className="w-3.5 h-3.5" />{profileData.website}</a>}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {profileData.industry && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 flex items-center gap-1"><FiBriefcase className="w-3 h-3" />{profileData.industry}</span>}
                {profileData.company_size && <span className="text-xs bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1 flex items-center gap-1"><FiUsers className="w-3 h-3" />{profileData.company_size}</span>}
                {!canEdit && orgId && <FollowButton orgId={parseInt(orgId)} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Organization profile</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your company information</p>
          </div>
          <span className="text-xs bg-gray-900 text-white px-3 py-1">{canEdit ? "Editable" : "View only"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiBriefcase className="w-4 h-4 text-gray-500" /> Basic information</h3>
            {canEdit && <button onClick={() => setEditingSection("basic")} className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-gray-600 border border-gray-200"><FiEdit2 className="w-4 h-4" /></button>}
          </div>
          <div className="p-5 space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Company name</p>
              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-2">{profileData.name || "Not set"} {isPaid && <FiAward className="w-4 h-4 text-green-600" />}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Website</p>
              <p className="text-sm mt-1">{profileData.website ? <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">{profileData.website}</a> : <span className="text-gray-500">Not set</span>}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</p>
              <p className="text-sm text-gray-700 mt-1 leading-relaxed">{profileData.description || "No description provided"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiUsers className="w-4 h-4 text-gray-500" /> Extended profile</h3>
            {canEdit && <button onClick={() => setEditingSection("extended")} className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-gray-600 border border-gray-200"><FiEdit2 className="w-4 h-4" /></button>}
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Company size</p><p className="text-sm text-gray-900 mt-1">{profileData.company_size || "Not set"}</p></div>
              <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</p><p className="text-sm text-gray-900 mt-1">{profileData.industry || "Not set"}</p></div>
            </div>
            <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1"><FiTarget className="w-3 h-3" /> Mission</p><p className="text-sm text-gray-700 mt-1 leading-relaxed">{profileData.mission || "Not set"}</p></div>
            <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1"><FiEye className="w-3 h-3" /> Vision</p><p className="text-sm text-gray-700 mt-1 leading-relaxed">{profileData.vision || "Not set"}</p></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 lg:col-span-2">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiLink className="w-4 h-4 text-gray-500" /> Social media</h3>
            {canEdit && <button onClick={() => setEditingSection("social")} className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-gray-600 border border-gray-200"><FiEdit2 className="w-4 h-4" /></button>}
          </div>
          <div className="p-5">
            {Array.isArray(profileData.social_media_links) && profileData.social_media_links.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profileData.social_media_links.map((link, idx) => (
                  <div key={idx} className="border border-gray-200 p-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{link.platform}</p>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-700 truncate block max-w-[200px]">{link.url}</a>
                      {link.username && <p className="text-xs text-gray-500">@{link.username}</p>}
                    </div>
                    <FiGlobe className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-10 h-10 bg-gray-100 flex items-center justify-center mx-auto mb-2"><FiLink className="w-5 h-5 text-gray-400" /></div>
                <p className="text-sm text-gray-500">No social links yet</p>
                {canEdit && <button onClick={() => setEditingSection("social")} className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700">Add links →</button>}
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Open jobs & openings */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 text-blue-600 flex items-center justify-center rounded-lg shadow-sm">
                <FiBriefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">Open jobs & openings</h3>
                <p className="text-xs text-gray-500 mt-0.5">Active positions from this organization</p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-blue-600 text-white px-3 py-1 rounded-full shadow-sm">{posts.length} open</span>
          </div>
          <div className="divide-y divide-gray-100">
            {postsLoading ? (
              <div className="flex justify-center items-center py-10"><div className="animate-spin h-8 w-8 border-3 border-blue-200 border-t-blue-600 rounded-full" /></div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <FiBriefcase className="w-8 h-8 text-blue-300" />
                </div>
                <h4 className="text-base font-semibold text-gray-900">No open positions</h4>
                <p className="text-sm text-gray-500 mt-1">This organization has no active job posts at the moment.</p>
              </div>
            ) : (
              posts.map((post) => {
                const deadlineSoon = post.application_deadline ? (new Date(post.application_deadline) - new Date()) / (1000 * 60 * 60 * 24) <= 7 && (new Date(post.application_deadline) - new Date()) / (1000 * 60 * 60 * 24) >= 0 : false;
                return (
                  <Link key={post.id} to={`/jobs/${post.id}`} className="block hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/20 transition-all duration-200 group/card">
                    <div className="p-5 flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h4 className="text-base font-bold text-gray-900 group-hover/card:text-blue-700 transition-colors truncate">{post.title}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm ${post.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>{post.status || "active"}</span>
                          {deadlineSoon && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">Closing soon</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2">
                          <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full text-gray-700 font-medium"><FiTag className="w-3 h-3" /> {post.category || "General"}</span>
                          <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full text-blue-700 font-medium"><FiBriefcase className="w-3 h-3" /> {post.employment_type || "Full-time"}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          {post.location && <span className="flex items-center gap-1"><FiMapPin className="w-3 h-3 text-gray-400" /> {post.location}</span>}
                          {(post.salary_min || post.salary_max) && <span className="flex items-center gap-1 font-medium text-emerald-600"><FiDollarSign className="w-3 h-3" /> {post.salary_currency || "USD"}{post.salary_min ? new Intl.NumberFormat().format(post.salary_min) : ""}{post.salary_max ? " - " + new Intl.NumberFormat().format(post.salary_max) : ""}</span>}
                        </div>
                      </div>
                      <div className="flex md:flex-col md:items-end gap-2 md:gap-1 shrink-0 md:w-44">
                        {post.application_deadline && (
                          <p className={`text-xs font-medium ${deadlineSoon ? "text-amber-600" : "text-gray-500"}`}>
                            Apply by {new Date(post.application_deadline).toLocaleDateString()}
                          </p>
                        )}
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-600/20 cursor-pointer hover:bg-blue-700 transition-colors active:scale-[0.98]">
                          View details <FiArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* People who work here */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-6">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 text-blue-600 flex items-center justify-center rounded-lg shadow-sm">
                <FiUsers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">People who work here</h3>
                <p className="text-xs text-gray-500 mt-0.5">Team members at this organization</p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-blue-600 text-white px-3 py-1 rounded-full shadow-sm">{teamMembers.length}</span>
          </div>
          {teamLoading ? (
            <div className="flex justify-center items-center py-10"><div className="animate-spin h-8 w-8 border-3 border-blue-200 border-t-blue-600 rounded-full" /></div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <FiUsers className="w-8 h-8 text-blue-300" />
              </div>
              <h4 className="text-base font-semibold text-gray-900">No team members yet</h4>
              <p className="text-sm text-gray-500 mt-1">Nobody is listed as working here right now.</p>
            </div>
          ) : (
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {teamMembers.map((member) => {
                const uid = member.user?.id;
                const name = member.user?.name || "Unnamed";
                const isStarred = uid != null && starred.has(uid);
                const photo = member.user?.profile_picture ? getUploadUrl(member.user.profile_picture) : null;
                return (
                  <div key={member.id} className="border border-gray-200 rounded-xl p-3 text-center hover:border-blue-200 hover:shadow-sm transition-all bg-white">
                    <div className="relative w-14 h-14 mx-auto">
                      <div className="absolute inset-0 rounded-xl bg-gray-900 text-white flex items-center justify-center text-lg font-bold">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      {photo && (
                        <img
                          src={photo}
                          alt={name}
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                          className="absolute inset-0 w-14 h-14 rounded-xl object-cover border border-gray-200 bg-white"
                        />
                      )}
                    </div>
                    <p className="text-[13px] font-semibold text-gray-900 mt-2 leading-tight truncate">{name}</p>
                    <p className="text-[11px] text-gray-500 truncate mt-px">{member.role || "Member"}</p>
                    <button
                      onClick={() => uid && navigate(`/organization/user/${uid}`)}
                      disabled={!uid}
                      className="mt-2 w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-50"
                    >
                      <FiEye className="w-3 h-3" /> Visit profile
                    </button>
                    <button
                      onClick={() => uid && toggleStar(uid)}
                      disabled={!uid || !currentUserId}
                      title={isStarred ? "Unstar" : "Star this person"}
                      className={`mt-1.5 w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 border text-[11px] font-semibold rounded-md transition-colors disabled:opacity-50 ${isStarred ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : "bg-white text-gray-500 border-gray-200 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50/50"}`}
                    >
                      <FiStar className={`w-3.5 h-3.5 ${isStarred ? "fill-amber-500 text-amber-500" : ""}`} /> {isStarred ? "Starred" : "Star"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {editingSection === "basic" && (
        <Modal isOpen={true} onClose={() => setEditingSection(null)}>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Edit basic information</h2>
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); saveBasicInfo({ name: fd.get("name"), description: fd.get("description"), website: fd.get("website") }); }}>
            <div className="space-y-3">
              <input name="name" defaultValue={profileData.name} placeholder="Company name" required className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
              <input name="website" type="url" defaultValue={profileData.website} placeholder="https://…" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
              <textarea name="description" defaultValue={profileData.description} rows={4} placeholder="Description" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white resize-none" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setEditingSection(null)} className="px-4 py-2 bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </Modal>
      )}
      {editingSection === "extended" && (
        <Modal isOpen={true} onClose={() => setEditingSection(null)}>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Edit extended profile</h2>
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); saveExtendedProfile({ company_size: fd.get("company_size"), industry: fd.get("industry"), mission: fd.get("mission"), vision: fd.get("vision") }); }}>
            <div className="space-y-3">
              <select name="company_size" defaultValue={profileData.company_size} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white">
                <option value="">Select size</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201-500">201-500</option>
                <option value="501-1000">501-1000</option>
                <option value="1000+">1000+</option>
              </select>
              <input name="industry" defaultValue={profileData.industry} placeholder="Industry" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
              <textarea name="mission" defaultValue={profileData.mission} rows={3} placeholder="Mission" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white resize-none" />
              <textarea name="vision" defaultValue={profileData.vision} rows={3} placeholder="Vision" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white resize-none" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setEditingSection(null)} className="px-4 py-2 bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </Modal>
      )}
      {editingSection === "social" && <SocialMediaModal isOpen={true} onClose={() => setEditingSection(null)} socialLinks={profileData.social_media_links} onSave={saveSocialMedia} saving={saving} />}
    </DashboardLayout>
  );
}

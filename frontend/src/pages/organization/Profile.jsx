import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import FollowButton from "../../components/ui/FollowButton";
import MenteeLoader from "../../components/ui/MenteeLoader";
import { Button, IconButton } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import EmptyState from "../../components/ui/EmptyState";
import { ProfileSection } from "../../components/profile/ProfileSection";
import { CenterBar } from "../../components/layout/AppShell";
import {
  getUploadUrl,
  getBackendUrl,
  getAuthHeaders,
  postPath,
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
  FiCreditCard,
  FiArrowRight,
  FiTag,
  FiStar,
} from "react-icons/fi";
import { formatSalaryRange } from "../../utils/jobMeta";
import EmploymentBadge from "../../components/ui/EmploymentStatus";

// Mirrors COMPANY_TYPE_OPTIONS in backend/api/org/organizations.py
const COMPANY_TYPE_LABELS = {
  startup: "Startup",
  private: "Private company",
  public: "Public company",
  nonprofit: "Non-profit",
  agency: "Agency / consultancy",
  education: "Education",
  government: "Government",
};
// "1000+" is legacy but must stay selectable — see COMPANY_SIZE_OPTIONS in
// backend/api/org/organizations.py.
const COMPANY_SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+", "1001-5000", "5001-10000", "10000+"];

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-s15">
        <div className="max-h-[90vh] overflow-y-auto p-5">{children}</div>
        <button onClick={onClose} className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-600" aria-label="Close">
          <FiX className="h-4 w-4" />
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
  const fieldCls = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50";
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-4 text-base font-semibold text-ink">Edit social links</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        {links.map((link, index) => (
          <div key={index} className="space-y-2 rounded-xl border border-line bg-gray-50 p-3 dark:bg-gray-25">
            <select value={link.platform || ""} onChange={(e) => updateLink(index, "platform", e.target.value)} className={fieldCls}>
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
            <input type="url" placeholder="https://…" value={link.url || ""} onChange={(e) => updateLink(index, "url", e.target.value)} className={fieldCls} />
            <input type="text" placeholder="Username (optional)" value={link.username || ""} onChange={(e) => updateLink(index, "username", e.target.value)} className={fieldCls} />
            <button type="button" onClick={() => removeLink(index)} className="text-xs font-medium text-red-600 hover:text-red-700">Remove</button>
          </div>
        ))}
        <button type="button" onClick={addLink} className="w-full rounded-xl border border-dashed border-line py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-ink">+ Add link</button>
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="dark" type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default function OrganizationProfile({ embedded = false, backTo, backLabel }) {
  // Resolves from /org/:slug. orgId stays supported so the old
  // /org/profile/:id URLs keep working via the redirect route.
  const { orgId, slug } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [starred, setStarred] = useState(new Set());
  const [currentUserId, setCurrentUserId] = useState(null);
  const [targetOrgId, setTargetOrgId] = useState(null);
  const [profileData, setProfileData] = useState({ name: "", description: "", website: "", company_size: "", industry: "", employee_count: null, company_type: "", founded_year: null, location: "", mission: "", vision: "", social_media_links: [], profile_image: "", banner_image: "", subscription_status: null });
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

        // Slug form is the canonical URL, so resolve it to an id first and
        // keep the rest of this component working off ids internally.
        let resolvedId = orgId ? parseInt(orgId, 10) : null;
        if (!resolvedId && slug) {
          const bySlug = await fetch(
            `${getBackendUrl()}/api/organizations/by-slug/${encodeURIComponent(slug)}`,
            { credentials: "include", headers: getAuthHeaders() }
          );
          if (!bySlug.ok) throw new Error("Company not found");
          const slugged = await bySlug.json();
          resolvedId = slugged.id;
        }
        const targetId = resolvedId || currentUserOrgId;
        if (!targetId) { setError("No organization found for this user"); return; }
        setTargetOrgId(targetId);
        setCurrentUserId(userData.user.id || null);
        // Edit rights are "is this my page", decided on the resolved id. With no
        // id at all (bare /org/profile) we fall back to the caller's own page.
        setCanEdit(resolvedId ? resolvedId === currentUserOrgId : true);
        const orgRes = await fetch(`${getBackendUrl()}/api/organizations/${targetId}`, { credentials: "include", headers: getAuthHeaders() });
        if (!orgRes.ok) throw new Error("Failed to load organization profile");
        const orgData = await orgRes.json();
        setProfileData({ name: orgData.name || "", description: orgData.description || "", website: orgData.website || "", company_size: orgData.company_size || "", industry: orgData.industry || "", employee_count: orgData.employee_count ?? null, company_type: orgData.company_type || "", founded_year: orgData.founded_year ?? null, location: orgData.location || "", mission: orgData.mission || "", vision: orgData.vision || "", social_media_links: orgData.social_media_links || [], profile_image: orgData.profile_image || "", banner_image: orgData.banner_image || "", subscription_status: orgData.subscription_status || null });
      } catch (e) {
        setError("Failed to load profile data");
      } finally { setLoading(false); }
    };
    loadProfileData();
  }, [orgId, slug]);

  useEffect(() => {
    const id = orgId || targetOrgId;
    if (!id) return;
    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const res = await fetch(`${getBackendUrl()}/api/organizations/${id}/posts`, { credentials: "include", headers: getAuthHeaders() });
        if (res.ok) setPosts(await res.json());
      } catch (e) { console.error("Failed to load posts:", e); }
      finally { setPostsLoading(false); }
    };
    fetchPosts();
  }, [orgId, targetOrgId]);

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
      const res = await fetch(`${getBackendUrl()}/api/organizations/${targetOrgId}/profile`, { method: "PUT", headers: getAuthHeaders({ "Content-Type": "application/json" }), credentials: "include", body: JSON.stringify({ company_size: data.company_size, company_type: data.company_type, employee_count: data.employee_count, founded_year: data.founded_year, industry: data.industry, location: data.location, mission: data.mission, vision: data.vision }) });
      if (res.ok) {
        const result = await res.json();
        setProfileData((p) => ({ ...p, company_size: result.company_size, company_type: result.company_type, employee_count: result.employee_count, founded_year: result.founded_year, industry: result.industry, location: result.location, mission: result.mission, vision: result.vision }));
        setEditingSection(null);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Failed to save extended profile");
      }
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
    const loader = (
      <div className="flex min-h-[60vh] items-center justify-center">
        <MenteeLoader size={72} text="Loading organization…" />
      </div>
    );
    return embedded ? loader : <div className="min-h-screen bg-surface">{loader}</div>;
  }

  const isPaid = profileData.subscription_status?.is_paid_active;

  const chipCls = "inline-flex items-center gap-1 rounded-lg border border-line bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600 dark:bg-gray-25";
  const labelCls = "text-xs font-medium uppercase tracking-wider text-gray-500";
  const infoCls = "mt-1 text-sm font-medium text-ink";
  const fieldCls = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50";

  const headerBackTo = backTo ?? "/org/jobs";
  const headerBackLabel = backLabel ?? "Back to workspace";
  const content = (
      <div className="mx-auto w-full max-w-[1000px] px-4 py-6">
      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-red-700"><FiX className="h-4 w-4" />{error}</div>
          <button onClick={() => setError(null)} className="rounded p-1 text-red-700 hover:text-red-900" aria-label="Dismiss"><FiX className="h-4 w-4" /></button>
        </div>
      )}

      {/* Banner + identity hero */}
      <div className="mb-6 overflow-hidden rounded-xl border border-line bg-surface">
        <div className="relative">
          <div className="relative h-40 bg-gray-900 md:h-48">
            {profileData.banner_image ? (
              <img src={getUploadUrl(profileData.banner_image)} alt="Banner" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <FiImage className="h-10 w-10 text-white/20" />
              </div>
            )}
            {canEdit && (
              <div className="absolute right-3 top-3 flex gap-1.5">
                <label className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-line bg-surface/90 text-gray-600 shadow-s5 transition-colors hover:bg-gray-50" aria-label={profileData.banner_image ? "Edit banner image" : "Upload banner image"} title={profileData.banner_image ? "Edit banner image" : "Upload banner image"}>
                  <input type="file" accept="image/*" aria-label={profileData.banner_image ? "Edit banner image" : "Upload banner image"} onChange={(e) => handleImageSelect(e, "banner")} className="hidden" />
                  {profileData.banner_image ? <FiEdit2 className="h-3.5 w-3.5" /> : <FiUpload className="h-3.5 w-3.5" />}
                </label>
                {profileData.banner_image && (
                  <button onClick={() => removeImage("banner")} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700" aria-label="Remove banner" title="Remove banner">
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            {isPaid && (
              <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-brand-action px-2.5 py-1 text-[11px] font-bold text-white">
                <FiAward className="mr-1 h-3 w-3" /> PRO ORGANIZATION
              </span>
            )}
            {uploadingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                <div className="flex items-center gap-2 rounded-xl bg-surface px-4 py-2 text-sm text-ink">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-brand" /> Uploading…
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <div className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-surface bg-gray-100 shadow-s5 ${isPaid ? "ring-2 ring-brand" : ""}`}>
              {profileData.profile_image ? (
                <img src={getUploadUrl(profileData.profile_image)} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <FiCamera className="h-7 w-7 text-gray-500" />
              )}
            </div>
            {canEdit && (
              <>
                <label className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-gray-900 text-white transition-colors hover:bg-gray-800" aria-label={profileData.profile_image ? "Edit profile image" : "Upload profile image"} title={profileData.profile_image ? "Edit profile image" : "Upload profile image"}>
                  <input type="file" accept="image/*" aria-label={profileData.profile_image ? "Edit profile image" : "Upload profile image"} onChange={(e) => handleImageSelect(e, "profile")} className="hidden" />
                  {profileData.profile_image ? <FiEdit2 className="h-3 w-3" /> : <FiUpload className="h-3 w-3" />}
                </label>
                {profileData.profile_image && (
                  <button onClick={() => removeImage("profile")} className="absolute -bottom-1 right-7 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700" aria-label="Remove profile image" title="Remove profile image">
                    <FiTrash2 className="h-3 w-3" />
                  </button>
                )}
              </>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {embedded ? (
                <h2 className="truncate text-[20px] font-semibold leading-7 text-ink">{profileData.name || "Unnamed Organization"}</h2>
              ) : (
                <h1 className="truncate text-[20px] font-semibold leading-7 text-ink">{profileData.name || "Unnamed Organization"}</h1>
              )}
              {isPaid && <span className="inline-flex items-center rounded-full bg-brand-action px-2 py-0.5 text-[10px] font-bold text-white">PRO</span>}
            </div>
            <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-gray-600">{profileData.description || "No description yet"}</p>
            {profileData.website && (
              <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-brand-text hover:underline">
                <FiGlobe className="h-3.5 w-3.5" /> {profileData.website}
              </a>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {profileData.industry && <span className={chipCls}><FiBriefcase className="h-3 w-3" />{profileData.industry}</span>}
              {profileData.company_size && <span className={chipCls}><FiUsers className="h-3 w-3" />{profileData.company_size}</span>}
              {!canEdit && orgId && <FollowButton orgId={parseInt(orgId)} />}
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-line bg-surface p-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Organization profile</h2>
          <p className="mt-0.5 text-[13px] text-gray-500">Manage your company information</p>
        </div>
        <span className="rounded-full border border-line bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-25">{canEdit ? "Editable" : "View only"}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProfileSection>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink"><FiBriefcase className="h-4 w-4 text-gray-500" /> Basic information</h3>
            {canEdit && (
              <IconButton label="Edit basic information" onClick={() => setEditingSection("basic")}>
                <FiEdit2 className="h-4 w-4" />
              </IconButton>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <p className={labelCls}>Company name</p>
              <p className={`${infoCls} flex items-center gap-2`}>{profileData.name || "Not set"} {isPaid && <FiAward className="h-4 w-4 text-brand-text" />}</p>
            </div>
            <div>
              <p className={labelCls}>Website</p>
              <p className="mt-1">{profileData.website ? <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-text hover:underline">{profileData.website}</a> : <span className="text-sm text-gray-500">Not set</span>}</p>
            </div>
            <div>
              <p className={labelCls}>Description</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">{profileData.description || "No description provided"}</p>
            </div>
          </div>
        </ProfileSection>

        <ProfileSection>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink"><FiUsers className="h-4 w-4 text-gray-500" /> Extended profile</h3>
            {canEdit && (
              <IconButton label="Edit extended profile" onClick={() => setEditingSection("extended")}>
                <FiEdit2 className="h-4 w-4" />
              </IconButton>
            )}
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className={labelCls}>Company size</p><p className={infoCls}>{profileData.company_size || "Not set"}</p></div>
              <div><p className={labelCls}>Industry</p><p className={infoCls}>{profileData.industry || "Not set"}</p></div>
              <div><p className={labelCls}>Employees</p><p className={infoCls}>{profileData.employee_count ?? "Not set"}</p></div>
              <div><p className={labelCls}>Company type</p><p className={infoCls}>{COMPANY_TYPE_LABELS[profileData.company_type] || "Not set"}</p></div>
              <div><p className={labelCls}>Founded</p><p className={infoCls}>{profileData.founded_year || "Not set"}</p></div>
              <div><p className={labelCls}>Address</p><p className={`${infoCls} break-words`}>{profileData.location || "Not set"}</p></div>
            </div>
            <div><p className={`${labelCls} flex items-center gap-1`}><FiTarget className="h-3 w-3" /> Mission</p><p className="mt-1 text-sm leading-relaxed text-gray-700">{profileData.mission || "Not set"}</p></div>
            <div><p className={`${labelCls} flex items-center gap-1`}><FiEye className="h-3 w-3" /> Vision</p><p className="mt-1 text-sm leading-relaxed text-gray-700">{profileData.vision || "Not set"}</p></div>
          </div>
        </ProfileSection>

        <ProfileSection className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink"><FiLink className="h-4 w-4 text-gray-500" /> Social media</h3>
            {canEdit && (
              <IconButton label="Edit social media links" onClick={() => setEditingSection("social")}>
                <FiEdit2 className="h-4 w-4" />
              </IconButton>
            )}
          </div>
          {Array.isArray(profileData.social_media_links) && profileData.social_media_links.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {profileData.social_media_links.map((link, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl border border-line p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-25">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{link.platform}</p>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="block max-w-[200px] truncate text-xs text-brand-text hover:underline">{link.url}</a>
                    {link.username && <p className="text-xs text-gray-500">@{link.username}</p>}
                  </div>
                  <FiGlobe className="h-4 w-4 shrink-0 text-gray-500" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"><FiLink className="h-5 w-5 text-gray-500" /></div>
              <p className="text-sm text-gray-500">No social links yet</p>
              {canEdit && <button onClick={() => setEditingSection("social")} className="mt-3 text-sm font-semibold text-brand-text hover:underline">Add links →</button>}
            </div>
          )}
        </ProfileSection>
      </div>

      {/* Open jobs & openings */}
      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-25"><FiBriefcase className="h-4 w-4 text-gray-500" /></div>
            <div>
              <h3 className="text-sm font-semibold leading-tight text-ink">Open jobs & openings</h3>
              <p className="text-xs text-gray-500">Active positions from this organization</p>
            </div>
          </div>
          <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand-text">{posts.length} open</span>
        </div>
        <div className="divide-y divide-line">
          {postsLoading ? (
            <div className="flex items-center justify-center py-10"><div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-brand" /></div>
          ) : posts.length === 0 ? (
            <EmptyState
              icon={FiBriefcase}
              title="No open positions"
              body="This organization has no active job posts at the moment."
            />
          ) : (
            posts.map((post) => {
              const deadlineSoon = post.application_deadline ? (new Date(post.application_deadline) - new Date()) / (1000 * 60 * 60 * 24) <= 7 && (new Date(post.application_deadline) - new Date()) / (1000 * 60 * 60 * 24) >= 0 : false;
              return (
                <Link key={post.id} to={postPath(post)} className="block px-5 py-4 transition-colors hover:bg-gray-25 dark:hover:bg-gray-50">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-5">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <h4 className="truncate text-sm font-semibold text-ink">{post.title}</h4>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${post.status === "active" ? "bg-brand/10 text-brand-text" : "bg-gray-50 text-gray-500 border border-line dark:bg-gray-25"}`}>{post.status || "active"}</span>
                        {deadlineSoon && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 border border-amber-200">Closing soon</span>}
                      </div>
                      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className={chipCls}><FiTag className="h-3 w-3" /> {post.category || "General"}</span>
                        <span className={chipCls}><FiBriefcase className="h-3 w-3" /> {post.employment_type || "Full-time"}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        {post.location && <span className="flex items-center gap-1"><FiMapPin className="h-3 w-3 text-gray-500" /> {post.location}</span>}
                        {formatSalaryRange(post.salary_min, post.salary_max, post.salary_currency) && (
                          <span className="flex items-center gap-1 font-medium text-brand-text">
                            <FiCreditCard className="h-3 w-3" /> {formatSalaryRange(post.salary_min, post.salary_max, post.salary_currency)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2 md:w-44 md:flex-col md:items-end md:gap-1">
                      {post.application_deadline && (
                        <p className={`text-xs font-medium ${deadlineSoon ? "text-amber-600" : "text-gray-500"}`}>
                          Apply by {new Date(post.application_deadline).toLocaleDateString()}
                        </p>
                      )}
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-800">
                        View details <FiArrowRight className="h-3 w-3" />
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
      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-25"><FiUsers className="h-4 w-4 text-gray-500" /></div>
            <div>
              <h3 className="text-sm font-semibold leading-tight text-ink">People who work here</h3>
              <p className="text-xs text-gray-500">Team members at this organization</p>
            </div>
          </div>
          <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand-text">{teamMembers.length}</span>
        </div>
        {teamLoading ? (
          <div className="flex items-center justify-center py-10"><div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-brand" /></div>
        ) : teamMembers.length === 0 ? (
          <EmptyState
            icon={FiUsers}
            title="No team members yet"
            body="Nobody is listed as working here right now."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-4">
            {teamMembers.map((member) => {
              const uid = member.user?.id;
              const name = member.user?.name || "Unnamed";
              const isStarred = uid != null && starred.has(uid);
              const photo = member.user?.profile_picture ? getUploadUrl(member.user.profile_picture) : null;
              return (
                <div key={member.id} className="rounded-xl border border-line bg-surface p-3 text-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-25">
                  <div className="relative mx-auto h-14 w-14">
                    {photo ? (
                      <img src={photo} alt={name} onError={(e) => { e.currentTarget.style.display = "none"; }} className="absolute inset-0 h-14 w-14 rounded-xl border border-line bg-surface object-cover" />
                    ) : (
                      <Avatar name={name} size="2xl" rounded="xl" className="absolute inset-0 h-14 w-14" />
                    )}
                  </div>
                  <p className="mt-2 truncate text-[13px] font-semibold leading-tight text-ink">{name}</p>
                  {member.user?.headline && <p className="mt-px truncate text-[11px] font-medium text-gray-500">{member.user.headline}</p>}
                  <div className="mt-1.5 flex flex-wrap justify-center gap-1">
                    {member.role && <span className="inline-block rounded-full border border-line bg-gray-50 px-1.5 py-px text-[10px] font-semibold text-gray-600 dark:bg-gray-25">{member.role}</span>}
                    <EmploymentBadge status={member.user?.employment_status} className="!px-1.5 !py-px !text-[10px]" />
                  </div>
                  <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={() => uid && navigate(`/org/user/${uid}`)} disabled={!uid}>
                    <FiEye className="h-3 w-3" /> Visit profile
                  </Button>
                  <Button
                    variant={isStarred ? "secondary" : "ghost"}
                    size="sm"
                    className={`mt-1.5 w-full ${isStarred ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" : "text-gray-500 hover:text-amber-600"}`}
                    onClick={() => uid && toggleStar(uid)}
                    disabled={!uid || !currentUserId}
                    title={isStarred ? "Unstar" : "Star this person"}
                  >
                    <FiStar className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-500 text-amber-500" : ""}`} /> {isStarred ? "Starred" : "Star"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editingSection === "basic" && (
        <Modal isOpen={true} onClose={() => setEditingSection(null)}>
          <h2 className="mb-4 text-base font-semibold text-ink">Edit basic information</h2>
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); saveBasicInfo({ name: fd.get("name"), description: fd.get("description"), website: fd.get("website") }); }}>
            <div className="space-y-3">
              <input name="name" defaultValue={profileData.name} placeholder="Company name" required className={fieldCls} />
              <input name="website" type="url" defaultValue={profileData.website} placeholder="https://…" className={fieldCls} />
              <textarea name="description" defaultValue={profileData.description} rows={4} placeholder="Description" className={`${fieldCls} resize-none`} />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => setEditingSection(null)}>Cancel</Button>
              <Button variant="dark" type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </form>
        </Modal>
      )}
      {editingSection === "extended" && (
        <Modal isOpen={true} onClose={() => setEditingSection(null)}>
          <h2 className="mb-4 text-base font-semibold text-ink">Edit extended profile</h2>
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); saveExtendedProfile({ company_size: fd.get("company_size"), company_type: fd.get("company_type"), employee_count: fd.get("employee_count"), founded_year: fd.get("founded_year"), industry: fd.get("industry"), location: fd.get("location"), mission: fd.get("mission"), vision: fd.get("vision") }); }}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select name="company_size" defaultValue={profileData.company_size} className={fieldCls}>
                  <option value="">Company size</option>
                  {COMPANY_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select name="company_type" defaultValue={profileData.company_type} className={fieldCls}>
                  <option value="">Company type</option>
                  {Object.entries(COMPANY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input name="employee_count" type="number" min="1" defaultValue={profileData.employee_count ?? ""} placeholder="Employees" className={fieldCls} />
                <input name="founded_year" type="number" min="1800" max={new Date().getFullYear()} defaultValue={profileData.founded_year ?? ""} placeholder="Founded year" className={fieldCls} />
              </div>
              <input name="industry" defaultValue={profileData.industry} placeholder="Industry" className={fieldCls} />
              <input name="location" defaultValue={profileData.location} placeholder="Address (City, Country)" className={fieldCls} />
              <textarea name="mission" defaultValue={profileData.mission} rows={3} placeholder="Mission" className={`${fieldCls} resize-none`} />
              <textarea name="vision" defaultValue={profileData.vision} rows={3} placeholder="Vision" className={`${fieldCls} resize-none`} />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => setEditingSection(null)}>Cancel</Button>
              <Button variant="dark" type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </form>
        </Modal>
      )}
      {editingSection === "social" && <SocialMediaModal isOpen={true} onClose={() => setEditingSection(null)} socialLinks={profileData.social_media_links} onSave={saveSocialMedia} saving={saving} />}
      </div>
  );

  if (embedded) return content;

  return (
    <div className="min-h-screen bg-surface">
      <CenterBar
        title={profileData.name || "Organization"}
        backTo={headerBackTo}
        backLabel={headerBackLabel}
      />
      {content}
    </div>
  );
}

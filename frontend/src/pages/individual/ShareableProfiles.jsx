import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  getSidebarItems,
  getBackendUrl,
  getAuthHeaders,
  getUploadUrl,
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
  FiLink,
  FiCalendar,
  FiUser,
} from "react-icons/fi";
import { toast } from "react-toastify";

const formatDate = (dateString) => {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString();
};

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200">
        {title && (
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900" id="modal-title">{title}</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 text-gray-500" aria-label="Close modal"><FiX className="w-4 h-4" /></button>
          </div>
        )}
        <div className="overflow-y-auto max-h-[80vh] p-6">{children}</div>
      </div>
    </div>
  );
};

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
        expires_at: profile.expires_at ? new Date(profile.expires_at).toISOString().split("T")[0] : "",
      });
      setSlugAvailable(true);
    } else {
      setFormData({ slug: "", is_public: true, show_contact_info: false, show_resume: true, show_experience: true, show_education: true, show_skills: true, show_projects: true, expires_at: "" });
      setSlugAvailable(null);
    }
  }, [profile, isOpen]);

  const checkSlugAvailability = async (slug) => {
    if (!slug.trim()) { setSlugAvailable(null); return; }
    setCheckingSlug(true);
    try {
      const response = await fetch(`${getBackendUrl()}/api/profiles/check-slug`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await response.json();
      setSlugAvailable(data.data.available);
    } catch { setSlugAvailable(null); }
    finally { setCheckingSlug(false); }
  };

  const handleSlugChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, slug: value });
    setTimeout(() => checkSlugAvailability(value), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = profile ? "PUT" : "POST";
      const url = profile ? `${getBackendUrl()}/api/profiles/${profile.slug}` : `${getBackendUrl()}/api/profiles`;
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ ...formData, expires_at: formData.expires_at || null }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Profile ${profile ? "updated" : "created"} successfully!`);
        onSave();
        onClose();
      } else toast.error(data.message || "Failed to save profile");
    } catch { toast.error("Failed to save profile"); }
    finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${profile ? "Edit" : "Create"} shareable profile`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Profile URL slug *</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-200 text-sm text-gray-500">recruai.com/</span>
            <div className="relative flex-1">
              <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" value={formData.slug} onChange={handleSlugChange} className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" placeholder="your-name" required />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                {checkingSlug && <span className="text-xs text-blue-600">…</span>}
                {!checkingSlug && slugAvailable === true && <FiCheck className="w-4 h-4 text-green-600" />}
                {!checkingSlug && slugAvailable === false && <FiX className="w-4 h-4 text-red-600" />}
              </div>
            </div>
          </div>
          {slugAvailable === false && <p className="text-xs text-red-600 mt-1.5">This slug is already taken</p>}
          {slugAvailable === true && <p className="text-xs text-green-600 mt-1.5">Available</p>}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Visibility</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: "is_public", label: "Make public", desc: "Anyone with link can view", icon: FiGlobe },
              { key: "show_contact_info", label: "Contact info", desc: "Email & phone", icon: FiUser },
              { key: "show_resume", label: "Resume", desc: "Allow download", icon: FiEye },
              { key: "show_experience", label: "Experience", desc: "Work history", icon: FiCalendar },
              { key: "show_education", label: "Education", desc: "Schools & degrees", icon: FiCalendar },
              { key: "show_skills", label: "Skills", desc: "Your stack", icon: FiCheck },
              { key: "show_projects", label: "Projects", desc: "Portfolio", icon: FiShare2 },
            ].map((field) => {
              const Icon = field.icon;
              return (
                <label key={field.key} className={`flex gap-3 p-3 border cursor-pointer transition-colors ${formData[field.key] ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
                  <input type="checkbox" checked={formData[field.key]} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.checked })} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5"><Icon className="w-3.5 h-3.5 text-gray-400" />{field.label}</p>
                    <p className="text-xs text-gray-500">{field.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Expiry date (optional)</label>
          <div className="relative max-w-xs">
            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="date" value={formData.expires_at} onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })} className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" min={new Date().toISOString().split("T")[0]} />
          </div>
          <p className="text-xs text-gray-500 mt-1">Leave empty for no expiry</p>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving || slugAvailable === false} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">{saving ? "Saving…" : profile ? "Update" : "Create profile"}</button>
        </div>
      </form>
    </Modal>
  );
};

const AnalyticsModal = ({ isOpen, onClose, profile }) => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ total_views: 0, unique_visitors: 0 });

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getBackendUrl()}/api/profiles/${profile.slug}/analytics`, { headers: getAuthHeaders() });
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data.analytics);
        setSummary(data.data.summary);
      }
    } catch { toast.error("Failed to load analytics"); }
    finally { setLoading(false); }
  }, [profile]);

  useEffect(() => { if (isOpen && profile) loadAnalytics(); }, [isOpen, profile, loadAnalytics]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile analytics">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900 text-white p-4 text-center">
            <p className="text-2xl font-bold">{summary.total_views}</p>
            <p className="text-xs text-gray-300 mt-1">Total views</p>
          </div>
          <div className="bg-white border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{summary.unique_visitors}</p>
            <p className="text-xs text-gray-500 mt-1">Unique visitors</p>
          </div>
        </div>
        <div className="border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Recent views</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white border-b border-gray-200">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Agent</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Referrer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500 text-sm">Loading…</td></tr>
                ) : analytics.length === 0 ? (
                  <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500 text-sm">No views yet</td></tr>
                ) : (
                  analytics.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap">{formatDate(item.viewed_at)}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600">{item.ip_address || "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600 max-w-[160px] truncate hidden sm:table-cell">{item.user_agent || "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600 max-w-[120px] truncate hidden md:table-cell">{item.referrer || "Direct"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const ShareableProfiles = () => {
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role || "individual", plan);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsProfile, setAnalyticsProfile] = useState(null);

  useEffect(() => { loadProfiles(); }, []);

  const loadProfiles = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/profiles`);
      const data = await response.json();
      if (response.ok) setProfiles(data.data || data);
      else toast.error(data.message || "Failed to load profiles");
    } catch { toast.error("Failed to load profiles"); }
    finally { setLoading(false); }
  };

  const handleDeleteProfile = async (profile) => {
    if (!window.confirm(`Are you sure you want to delete the profile "${profile.slug}"?`)) return;
    try {
      const response = await fetch(`${getBackendUrl()}/api/profiles/${profile.slug}`, { method: "DELETE", headers: getAuthHeaders() });
      const data = await response.json();
      if (data.success) { toast.success("Profile deleted"); loadProfiles(); }
      else toast.error(data.message || "Failed to delete");
    } catch { toast.error("Failed to delete"); }
  };

  const copyProfileLink = (slug) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  const toggleProfileStatus = async (profile) => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/profiles/${profile.slug}`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !profile.is_active }),
      });
      const data = await response.json();
      if (data.success) { toast.success(`Profile ${profile.is_active ? "deactivated" : "activated"}`); loadProfiles(); }
      else toast.error(data.message || "Failed to update");
    } catch { toast.error("Failed to update"); }
  };

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-gray-900 h-44 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="bg-white border border-gray-200 h-64 animate-pulse" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const publicCount = profiles.filter((p) => p.is_public).length;
  const totalViews = profiles.reduce((sum, p) => sum + (p.view_count || 0), 0);

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
                <FiShare2 className="w-3.5 h-3.5" />
                SHAREABLE
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">Shareable profiles</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Create public links to share your profile with recruiters. Control what’s visible and track views.</p>
            </div>
            <div className="flex flex-col gap-3 lg:w-[380px]">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                  <p className="text-2xl font-bold">{profiles.length}</p>
                  <p className="text-xs text-gray-300 mt-1">Profiles</p>
                </div>
                <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                  <p className="text-2xl font-bold">{publicCount}</p>
                  <p className="text-xs text-gray-300 mt-1">Public</p>
                </div>
                <div className="bg-blue-500/20 backdrop-blur border border-blue-400/20 p-4 text-center">
                  <p className="text-2xl font-bold text-blue-200">{totalViews}</p>
                  <p className="text-xs text-blue-200 mt-1">Views</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="w-full inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-5 py-3 text-sm font-medium hover:bg-gray-100 transition-colors">
                <FiPlus className="w-4 h-4" /> Create profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-4"><FiShare2 className="w-7 h-7 text-gray-400" /></div>
          <h3 className="text-lg font-semibold text-gray-900">No profiles yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">Create your first shareable profile to get a public link you can send to recruiters.</p>
          <button onClick={() => setShowCreateModal(true)} className="mt-6 inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-black transition-colors"><FiPlus className="w-4 h-4" /> Create profile</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <div key={profile.id} className="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all flex flex-col">
              <div className="bg-gray-900 px-5 py-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white truncate pr-2">/{profile.slug}</h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 border ${profile.is_public ? "bg-white/10 text-white border-white/20" : "bg-gray-700 text-gray-300 border-gray-600"}`}>{profile.is_public ? <FiGlobe className="w-3 h-3" /> : <FiLock className="w-3 h-3" />}{profile.is_public ? "Public" : "Private"}</span>
                  <span className={`w-2 h-2 rounded-full ${profile.is_active ? "bg-green-400" : "bg-gray-500"}`} title={profile.is_active ? "Active" : "Inactive"} />
                </div>
              </div>
              <div className="p-5 flex-1">
                <div className="flex gap-3 mb-4">
                  {profile.user?.profile_picture ? (
                    <img src={getUploadUrl(profile.user.profile_picture)} alt={profile.user.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold shrink-0">{profile.user?.name?.charAt(0)?.toUpperCase() || "?"}</div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{profile.user?.name || "Unnamed"}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><FiEye className="w-3 h-3" />{profile.view_count} views • {profile.is_active ? <span className="text-green-600">Active</span> : <span className="text-gray-500">Inactive</span>}</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs mb-4">
                  <div className="flex justify-between"><span className="text-gray-500">Expires</span><span className="font-medium text-gray-900">{formatDate(profile.expires_at)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Created</span><span className="font-medium text-gray-900">{formatDate(profile.created_at)}</span></div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.show_contact_info && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1">Contact</span>}
                  {profile.show_experience && <span className="text-xs bg-gray-50 text-gray-700 border border-gray-200 px-2 py-1">Experience</span>}
                  {profile.show_education && <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-1">Education</span>}
                  {profile.show_skills && <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1">Skills</span>}
                  {profile.show_projects && <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1">Projects</span>}
                  {profile.show_resume && <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1">Resume</span>}
                </div>
              </div>
              <div className="px-3 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-1.5">
                <button onClick={() => copyProfileLink(profile.slug)} className="inline-flex items-center gap-1.5 text-xs bg-white border border-gray-200 px-2.5 py-1.5 hover:bg-gray-50 font-medium"><FiCopy className="w-3 h-3" /> Copy</button>
                <button onClick={() => { setAnalyticsProfile(profile); setShowAnalyticsModal(true); }} className="inline-flex items-center gap-1.5 text-xs bg-blue-600 text-white px-2.5 py-1.5 hover:bg-blue-700 font-medium"><FiBarChart2 className="w-3 h-3" /> Stats</button>
                <button onClick={() => setEditingProfile(profile)} className="inline-flex items-center gap-1.5 text-xs bg-white border border-gray-200 px-2.5 py-1.5 hover:bg-gray-50 font-medium"><FiEdit2 className="w-3 h-3" /> Edit</button>
                <button onClick={() => toggleProfileStatus(profile)} className={`inline-flex items-center gap-1.5 text-xs border px-2.5 py-1.5 font-medium ${profile.is_active ? "bg-white text-red-600 border-red-200 hover:bg-red-50" : "bg-white text-green-600 border-green-200 hover:bg-green-50"}`}>{profile.is_active ? <><FiEyeOff className="w-3 h-3" /> Off</> : <><FiEye className="w-3 h-3" /> On</>}</button>
                <button onClick={() => handleDeleteProfile(profile)} className="inline-flex items-center gap-1.5 text-xs bg-white border border-red-200 text-red-600 px-2.5 py-1.5 hover:bg-red-50 font-medium"><FiTrash2 className="w-3 h-3" /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProfileModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSave={loadProfiles} />
      <ProfileModal isOpen={!!editingProfile} onClose={() => setEditingProfile(null)} profile={editingProfile} onSave={loadProfiles} />
      <AnalyticsModal isOpen={showAnalyticsModal} onClose={() => setShowAnalyticsModal(false)} profile={analyticsProfile} />
    </DashboardLayout>
  );
};

export default ShareableProfiles;

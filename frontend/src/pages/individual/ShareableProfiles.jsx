import { useState, useEffect, useCallback } from "react";
import { AppShell, CenterBar } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import EmptyState from "../../components/ui/EmptyState";
import { StatusTag } from "../../components/jobs/JobBits";
import {
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
  FiFileText,
  FiBriefcase,
  FiBookOpen,
  FiTarget,
  FiFolder,
} from "react-icons/fi";
import { toast } from "sonner";
import Modal from "./components/Modal";

const formatDate = (dateString) => {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString();
};

const VISIBILITY_FIELDS = [
  { key: "is_public", label: "Make public", desc: "Anyone with link can view", icon: FiGlobe },
  { key: "show_contact_info", label: "Contact info", desc: "Email & phone", icon: FiUser },
  { key: "show_resume", label: "Resume", desc: "Allow download", icon: FiFileText },
  { key: "show_experience", label: "Experience", desc: "Work history", icon: FiBriefcase },
  { key: "show_education", label: "Education", desc: "Schools & degrees", icon: FiBookOpen },
  { key: "show_skills", label: "Skills", desc: "Your stack", icon: FiTarget },
  { key: "show_projects", label: "Projects", desc: "Portfolio", icon: FiFolder },
];

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
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">{profile ? "Edit" : "Create"} shareable profile</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-600" aria-label="Close modal">
          <FiX size={20} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">Profile URL slug *</label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-lg border border-r-0 border-line bg-gray-50 px-3 text-sm text-gray-500 dark:bg-gray-25">
              recruai.com/
            </span>
            <div className="relative flex-1">
              <FiLink className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                type="text"
                value={formData.slug}
                onChange={handleSlugChange}
                placeholder="your-name"
                required
                className="rounded-l-none pl-9 text-sm"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                {checkingSlug && <span className="text-xs text-gray-500">…</span>}
                {!checkingSlug && slugAvailable === true && <FiCheck className="h-4 w-4 text-brand-text" />}
                {!checkingSlug && slugAvailable === false && <FiX className="h-4 w-4 text-red-600" />}
              </div>
            </div>
          </div>
          {slugAvailable === false && <p className="mt-1.5 text-xs text-red-600">This slug is already taken</p>}
          {slugAvailable === true && <p className="mt-1.5 text-xs text-brand-text">Available</p>}
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Visibility</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {VISIBILITY_FIELDS.map((field) => {
              const Icon = field.icon;
              const checked = formData[field.key];
              return (
                <label
                  key={field.key}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${
                    checked ? "border-brand bg-brand/5" : "border-line bg-surface hover:bg-gray-50 dark:hover:bg-gray-25"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-line accent-brand"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                      <Icon className="h-3.5 w-3.5 text-gray-500" strokeWidth={1.7} /> {field.label}
                    </p>
                    <p className="text-xs text-gray-500">{field.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">Expiry date (optional)</label>
          <div className="relative max-w-xs">
            <FiCalendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              type="date"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              min={new Date().toISOString().split("T")[0]}
              className="pl-9 text-sm"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Leave empty for no expiry</p>
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="dark" type="submit" disabled={saving || slugAvailable === false}>
            {saving ? "Saving…" : profile ? "Update" : "Create profile"}
          </Button>
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
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Profile analytics</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-600" aria-label="Close modal">
          <FiX size={20} />
        </button>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gray-900 p-4 text-center text-white">
            <p className="text-2xl font-bold font-mono tabular-nums">{summary.total_views}</p>
            <p className="mt-1 text-xs text-gray-300">Total views</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4 text-center">
            <p className="text-2xl font-bold text-brand-text font-mono tabular-nums">{summary.unique_visitors}</p>
            <p className="mt-1 text-xs text-gray-500">Unique visitors</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-line">
          <div className="border-b border-line bg-gray-50 px-4 py-2 dark:bg-gray-25">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Recent views</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface">
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-gray-500">IP</th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase text-gray-500 sm:table-cell">Agent</th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase text-gray-500 md:table-cell">Referrer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loading ? (
                  <tr><td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-500">Loading…</td></tr>
                ) : analytics.length === 0 ? (
                  <tr><td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-500">No views yet</td></tr>
                ) : (
                  analytics.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-25">
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-gray-700 font-mono tabular-nums">{formatDate(item.viewed_at)}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600">{item.ip_address || "—"}</td>
                      <td className="hidden max-w-[160px] truncate px-4 py-2.5 text-xs text-gray-600 sm:table-cell">{item.user_agent || "—"}</td>
                      <td className="hidden max-w-[120px] truncate px-4 py-2.5 text-xs text-gray-600 md:table-cell">{item.referrer || "Direct"}</td>
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

  const flagChips = (profile) => {
    const flags = [
      { on: profile.show_contact_info, label: "Contact" },
      { on: profile.show_resume, label: "Resume" },
      { on: profile.show_experience, label: "Experience" },
      { on: profile.show_education, label: "Education" },
      { on: profile.show_skills, label: "Skills" },
      { on: profile.show_projects, label: "Projects" },
    ];
    return flags.filter((f) => f.on).map((f) => <StatusTag key={f.label}>{f.label}</StatusTag>);
  };

  if (loading) {
    return (
      <AppShell rail={<div />}>
        <CenterBar title="Shareable profiles" />
        <div className="space-y-4 px-4 py-4">
          <div className="h-10 w-[320px] animate-pulse rounded-xl bg-gray-200 dark:bg-gray-25" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-48 animate-pulse rounded-xl border border-line bg-surface" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell rail={<div />}>
      <CenterBar
        title="Shareable Profiles"
        actions={
          <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(true)}>
            <FiPlus className="h-3.5 w-3.5" strokeWidth={2} /> New profile
          </Button>
        }
      />

      <div className="px-4 pb-1 pt-3">
        <p className="text-[11px] text-gray-500"><span className="font-mono tabular-nums">{profiles.length}</span> profiles · links share only what you allow</p>
      </div>

      {profiles.length === 0 ? (
        <EmptyState
          icon={FiShare2}
          title="No profiles yet"
          body="Create your first shareable profile to get a public link you can send to recruiters."
          action={null}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <div key={profile.id} className="flex flex-col rounded-xl border border-line bg-surface">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h3 className="truncate pr-2 text-sm font-semibold text-ink">/{profile.slug}</h3>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusTag>{profile.is_public ? <><FiGlobe className="h-3 w-3" /> Public</> : <><FiLock className="h-3 w-3" /> Private</>}</StatusTag>
                  <span className={`h-2 w-2 rounded-full ${profile.is_active ? "bg-brand" : "bg-gray-400"}`} title={profile.is_active ? "Active" : "Inactive"} />
                </div>
              </div>
              <div className="flex-1 p-4">
                <div className="mb-4 flex items-center gap-3">
                  {profile.user?.profile_picture ? (
                    <img src={getUploadUrl(profile.user.profile_picture)} alt={profile.user.name} className="h-10 w-10 shrink-0 rounded-full border border-line object-cover" />
                  ) : (
                    <Avatar name={profile.user?.name || "?"} size="lg" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{profile.user?.name || "Unnamed"}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <FiEye className="h-3 w-3" /> <span className="font-mono tabular-nums">{profile.view_count}</span> views · {profile.is_active ? <span className="text-brand-text">Active</span> : <span className="text-gray-500">Inactive</span>}
                    </p>
                  </div>
                </div>
                <div className="mb-4 space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Expires</span><span className="font-medium text-ink">{formatDate(profile.expires_at)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Created</span><span className="font-medium text-ink">{formatDate(profile.created_at)}</span></div>
                </div>
                <div className="flex flex-wrap gap-1.5">{flagChips(profile)}</div>
              </div>
              <div className="flex flex-wrap gap-1.5 border-t border-line bg-gray-50 px-3 py-3 dark:bg-gray-25">
                <Button variant="secondary" size="sm" onClick={() => copyProfileLink(profile.slug)}>
                  <FiCopy className="h-3.5 w-3.5" /> Copy
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { setAnalyticsProfile(profile); setShowAnalyticsModal(true); }}>
                  <FiBarChart2 className="h-3.5 w-3.5" /> Stats
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setEditingProfile(profile)}>
                  <FiEdit2 className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant={profile.is_active ? "danger" : "secondary"}
                  size="sm"
                  onClick={() => toggleProfileStatus(profile)}
                >
                  {profile.is_active ? <><FiEyeOff className="h-3.5 w-3.5" /> Off</> : <><FiEye className="h-3.5 w-3.5" /> On</>}
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDeleteProfile(profile)}>
                  <FiTrash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProfileModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSave={loadProfiles} />
      <ProfileModal isOpen={!!editingProfile} onClose={() => setEditingProfile(null)} profile={editingProfile} onSave={loadProfiles} />
      <AnalyticsModal isOpen={showAnalyticsModal} onClose={() => setShowAnalyticsModal(false)} profile={analyticsProfile} />
    </AppShell>
  );
};

export default ShareableProfiles;

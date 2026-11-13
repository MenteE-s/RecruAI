import { OrgAppShell } from "../../components/layout/OrgAppShell";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, ButtonLink, IconButton } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import EmptyState from "../../components/ui/EmptyState";
import { getBackendUrl, getAuthHeaders } from "../../utils/auth";
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  Eye,
  CheckCircle,
  XCircle,
  Briefcase,
  Mail,
  Calendar,
  RefreshCw,
  Clock,
  X,
} from "lucide-react";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-pop">
        {children}
        <button onClick={onClose} className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-line bg-surface text-gray-500 transition-colors hover:bg-gray-50 hover:text-ink dark:hover:bg-gray-25" aria-label="Close">
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString();
};

export default function TeamMembers() {
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [canManageTeam, setCanManageTeam] = useState(false);
  const [canViewHiring, setCanViewHiring] = useState(false);
  const [activeTab, setActiveTab] = useState("team");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [saving, setSaving] = useState(false);
  const [invitationActionId, setInvitationActionId] = useState(null);

  useEffect(() => {
    const getOrgId = async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/auth/me`, { credentials: "include", headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          if (data.user?.organization_id) setOrganizationId(data.user.organization_id);
          else setError("Unable to determine organization");
          const permissions = data.user?.organization_permissions || [];
          setCanManageTeam(permissions.includes("team.manage"));
          setCanViewHiring(permissions.includes("hiring.view"));
        } else setError("Failed to authenticate");
      } catch { setError("Network error"); }
    };
    getOrgId();
  }, []);

  const loadTeamMembers = async () => {
    if (!organizationId) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${getBackendUrl()}/api/organizations/${organizationId}/team-members`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) setTeamMembers(await res.json());
      else setError((await res.json().catch(() => ({}))).error || "Failed to load team members");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const loadHiredCandidates = async () => {
    if (!organizationId) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${getBackendUrl()}/api/applications?status=hired&organization_id=${organizationId}`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) setCandidates((await res.json()).data || []);
      else setError((await res.json().catch(() => ({}))).error || "Failed to load hired candidates");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const loadInvitations = async () => {
    if (!organizationId) return;
    try {
      const res = await fetch(`${getBackendUrl()}/api/organizations/${organizationId}/invitations`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) setInvitations(await res.json());
      else setInvitations([]);
    } catch { setInvitations([]); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (organizationId) { if (activeTab === "team") { loadTeamMembers(); loadInvitations(); } else loadHiredCandidates(); } }, [organizationId, activeTab]);

  const inviteMember = async (formData) => {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${getBackendUrl()}/api/organizations/${organizationId}/invite`, { method: "POST", headers: getAuthHeaders({ "Content-Type": "application/json" }), credentials: "include", body: JSON.stringify(formData) });
      const result = await res.json().catch(() => ({}));
      if (res.ok) { setShowInviteModal(false); loadTeamMembers(); loadInvitations(); }
      else {
        if (result.invitation) loadInvitations();
        setError(result.error || "Failed to invite member");
      }
    } catch { setError("Network error. Please try again."); }
    finally { setSaving(false); }
  };

  const resendInvitation = async (invitation) => {
    setInvitationActionId(invitation.id); setError(null);
    try {
      const res = await fetch(`${getBackendUrl()}/api/organizations/${organizationId}/invitations/${invitation.id}/resend`, { method: "POST", credentials: "include", headers: getAuthHeaders() });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result.invitation) {
        setInvitations((prev) => prev.map((item) => item.id === result.invitation.id ? result.invitation : item));
      } else {
        setError(result.error || "Failed to resend invitation");
      }
    } catch { setError("Network error. Please try again."); }
    finally { setInvitationActionId(null); }
  };

  const revokeInvitation = async (invitation) => {
    if (!window.confirm(`Revoke the invitation for ${invitation.email}?`)) return;
    setInvitationActionId(invitation.id); setError(null);
    try {
      const res = await fetch(`${getBackendUrl()}/api/organizations/${organizationId}/invitations/${invitation.id}`, { method: "DELETE", credentials: "include", headers: getAuthHeaders() });
      const result = await res.json().catch(() => ({}));
      if (res.ok) setInvitations((prev) => prev.filter((item) => item.id !== invitation.id));
      else setError(result.error || "Failed to revoke invitation");
    } catch { setError("Network error. Please try again."); }
    finally { setInvitationActionId(null); }
  };

  const editMember = async (formData) => {
    if (!editingMember) return;
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${getBackendUrl()}/api/organizations/${organizationId}/team-members/${editingMember.id}`, { method: "PUT", headers: getAuthHeaders({ "Content-Type": "application/json" }), credentials: "include", body: JSON.stringify(formData) });
      if (res.ok) { setShowEditModal(false); setEditingMember(null); loadTeamMembers(); } else setError((await res.json().catch(() => ({}))).error || "Failed to update member");
    } catch { setError("Network error. Please try again."); }
    finally { setSaving(false); }
  };

  const deleteMember = async () => {
    if (!editingMember) return;
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${getBackendUrl()}/api/organizations/${organizationId}/team-members/${editingMember.id}`, { method: "DELETE", credentials: "include", headers: getAuthHeaders() });
      if (res.ok) { setShowDeleteConfirm(false); setEditingMember(null); loadTeamMembers(); } else setError((await res.json().catch(() => ({}))).error || "Failed to delete member");
    } catch { setError("Network error. Please try again."); }
    finally { setSaving(false); }
  };

  const toggleOnboardingStatus = async (applicationId, currentlyOnboarded, candidateName) => {
    try {
      const endpoint = currentlyOnboarded ? `/api/applications/${applicationId}/offboard` : `/api/applications/${applicationId}/onboard`;
      const res = await fetch(`${getBackendUrl()}${endpoint}`, { method: "POST", credentials: "include", headers: getAuthHeaders() });
      if (res.ok) { await loadHiredCandidates(); alert(`Candidate ${candidateName} ${currentlyOnboarded ? "removed from" : "added to"} onboarded list`); } else throw new Error((await res.json().catch(() => ({}))).error || "Failed to update onboarding status");
    } catch (err) { alert(`Error updating onboarding status: ${err.message}`); }
  };

  const fieldCls = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-s5";

  return (
    <OrgAppShell>
      {/* Header */}
      <div className="px-4 pb-4 pt-4">
        <div className="rounded-xl border border-line bg-surface p-5 shadow-s5 card-hover">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand-text shadow-s5">
                  <Users className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <h1 className="text-xl font-bold tracking-tight text-ink">Team management</h1>
              </div>
              <p className="mt-1 text-xs text-gray-500">Manage team members, roles, permissions, and track hired candidate onboarding.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-1 rounded-xl border border-line bg-gray-50 p-1 dark:bg-gray-25 shadow-s5">
                <button
                  onClick={() => setActiveTab("team")}
                  className={`inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold transition-colors ${activeTab === "team" ? "bg-surface text-ink shadow-s5" : "text-gray-500 hover:text-ink"}`}
                >
                  Team · <span className="font-mono tabular-nums ml-1">{teamMembers.length}</span>
                </button>
                {canViewHiring && (
                  <button
                    onClick={() => setActiveTab("candidates")}
                    className={`inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold transition-colors ${activeTab === "candidates" ? "bg-surface text-ink shadow-s5" : "text-gray-500 hover:text-ink"}`}
                  >
                    Hired · <span className="font-mono tabular-nums ml-1">{candidates.length}</span>
                  </button>
                )}
              </div>
              {activeTab === "team" && canManageTeam && (
                <Button variant="primary" size="sm" onClick={() => setShowInviteModal(true)}>
                  <Plus className="h-4 w-4" strokeWidth={1.75} /> Invite member
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-4 pb-4">
        <div className="rounded-xl border border-line bg-surface p-4 text-center shadow-s5">
          <p className="text-2xl font-bold font-mono tabular-nums tracking-tight text-ink">{teamMembers.length}</p>
          <p className="mt-1 text-xs font-medium text-gray-500">Team members</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 text-center shadow-s5">
          <p className="text-2xl font-bold font-mono tabular-nums tracking-tight text-ink">{candidates.length}</p>
          <p className="mt-1 text-xs font-medium text-gray-500">Hired</p>
        </div>
        <div className="rounded-xl border border-brand/20 bg-brand/10 p-4 text-center shadow-s5">
          <p className="text-2xl font-bold font-mono tabular-nums tracking-tight text-brand-text">{candidates.filter((c) => c.onboarded).length}</p>
          <p className="mt-1 text-xs font-medium text-gray-500">Onboarded</p>
        </div>
      </div>

      {error && <div className="mx-4 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 shadow-s5">{error}</div>}

      {!loading && activeTab === "team" && invitations.length > 0 && (
        <div className="mx-4 mb-4 overflow-hidden rounded-xl border border-line bg-surface shadow-s5">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Clock className="h-4 w-4 text-amber-500" strokeWidth={1.75} /> Pending invitations</h2>
              <p className="mt-0.5 text-xs text-gray-500">Invited members receive an email link to join your organization.</p>
            </div>
            <span className="rounded-full border border-line bg-gray-50 px-2.5 py-1 text-xs font-semibold font-mono tabular-nums text-gray-600 dark:bg-gray-25">{invitations.length}</span>
          </div>
          <div className="divide-y divide-line">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-gray-50/50 dark:hover:bg-gray-25/50 transition-colors">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{invitation.email}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Role: <span className="font-medium text-ink">{invitation.role}</span> · Expires <span className="font-mono tabular-nums">{formatDate(invitation.expires_at)}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => resendInvitation(invitation)} disabled={invitationActionId === invitation.id}>
                    <RefreshCw className={`h-3.5 w-3.5 ${invitationActionId === invitation.id ? "animate-spin" : ""}`} strokeWidth={1.75} /> Resend
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => revokeInvitation(invitation)} disabled={invitationActionId === invitation.id}>
                    <X className="h-3.5 w-3.5" strokeWidth={1.75} /> Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl border border-line bg-surface shadow-s5" />
          ))}
        </div>
      ) : activeTab === "team" ? (
        teamMembers.length === 0 ? (
          <div className="px-4">
            <div className="rounded-xl border border-line bg-surface p-8 shadow-s5">
              <EmptyState
                icon={Users}
                title="No team members yet"
                body="Invite your first team member to collaborate on hiring."
                action={canManageTeam ? <Button variant="primary" size="sm" onClick={() => setShowInviteModal(true)}><Plus className="h-4 w-4" strokeWidth={1.75} /> Invite first member</Button> : null}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex flex-col justify-between rounded-xl border border-line bg-surface p-5 shadow-s5 transition-all hover:border-brand/40">
                <div>
                  <div className="flex gap-3">
                    <Avatar name={member.user?.name || "U"} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-ink">{member.user?.name || "Unnamed user"}</h3>
                      <p className="text-xs text-gray-500">{member.role || "No role"}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1.5 text-xs text-gray-500">
                    <p className="flex items-center gap-2"><Calendar className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={1.75} /> Joined {formatDate(member.join_date)}</p>
                    {member.user?.email && <p className="flex items-center gap-2 truncate"><Mail className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={1.75} />{member.user.email}</p>}
                  </div>
                </div>
                <div className="mt-5 border-t border-line pt-3.5 flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => navigate(`/org/user/${member.user?.id}`)}>
                    <Eye className="h-4 w-4" strokeWidth={1.75} /> Profile
                  </Button>
                  {canManageTeam && (
                    <>
                      <IconButton label="Edit member" onClick={() => { setEditingMember(member); setShowEditModal(true); }}>
                        <Edit2 className="h-4 w-4" strokeWidth={1.75} />
                      </IconButton>
                      <IconButton label="Remove member" onClick={() => { setEditingMember(member); setShowDeleteConfirm(true); }} className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20">
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </IconButton>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : candidates.length === 0 ? (
        <div className="px-4">
          <div className="rounded-xl border border-line bg-surface p-8 shadow-s5">
            <EmptyState
              icon={CheckCircle}
              title="No hired candidates yet"
              body="Candidates who pass interviews will appear here."
              action={<ButtonLink to="/org/candidates" variant="secondary" size="sm"><Briefcase className="h-4 w-4" strokeWidth={1.75} /> View candidates</ButtonLink>}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="flex flex-col justify-between rounded-xl border border-line bg-surface p-5 shadow-s5 transition-all hover:border-brand/40">
              <div>
                <div className="flex gap-3">
                  <Avatar name={candidate.user?.name || "C"} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-ink">{candidate.user?.name || "Unnamed candidate"}</h3>
                    <p className="truncate text-xs text-gray-500">Applied for: {candidate.post?.title || "Unknown"}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-gray-500">
                  <p className="flex items-center gap-2"><Briefcase className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={1.75} /> Applied {formatDate(candidate.applied_at)}</p>
                  {candidate.user?.email && <p className="flex items-center gap-2 truncate"><Mail className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={1.75} />{candidate.user.email}</p>}
                  <p className="mt-1 flex items-center gap-2">{candidate.onboarded ? <><CheckCircle className="h-4 w-4 text-brand-text" strokeWidth={1.75} /><span className="font-semibold text-brand-text">Onboarded</span></> : <><XCircle className="h-4 w-4 text-amber-500" strokeWidth={1.75} /><span className="font-semibold text-amber-700 dark:text-amber-400">Not onboarded</span></>}</p>
                </div>
              </div>
              <div className="mt-5 border-t border-line pt-3.5 flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => navigate(`/org/user/${candidate.user?.id}`)}>
                  <Eye className="h-4 w-4" strokeWidth={1.75} /> Profile
                </Button>
                <Button
                  variant={candidate.onboarded ? "secondary" : "primary"}
                  size="sm"
                  className={candidate.onboarded ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400" : ""}
                  onClick={() => toggleOnboardingStatus(candidate.id, candidate.onboarded, candidate.user?.name || "Unnamed")}
                >
                  {candidate.onboarded ? "Offboard" : "Onboard"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showInviteModal && (
        <Modal onClose={() => setShowInviteModal(false)}>
          <h2 className="mb-4 text-base font-semibold text-ink">Invite team member</h2>
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); inviteMember({ email: fd.get("email"), role: fd.get("role") }); }}>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-500">Email address</label>
                <Input type="email" name="email" required placeholder="colleague@company.com" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-500">Team role</label>
                <select name="role" required className={fieldCls}>
                  <option value="">Select role</option>
                  <option value="Admin">Admin</option>
                  <option value="HR">HR</option>
                  <option value="Manager">Manager</option>
                  <option value="Interviewer">Interviewer</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => setShowInviteModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={saving}>{saving ? "Inviting…" : "Invite member"}</Button>
            </div>
          </form>
        </Modal>
      )}
      {showEditModal && editingMember && (
        <Modal onClose={() => setShowEditModal(false)}>
          <h2 className="mb-4 text-base font-semibold text-ink">Edit member</h2>
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); editMember({ role: fd.get("role"), join_date: fd.get("join_date") }); }}>
            <p className="mb-3 text-sm font-medium text-ink">{editingMember.user?.name}</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-500">Team role</label>
                <select name="role" defaultValue={editingMember.role} className={fieldCls}>
                  <option value="Admin">Admin</option>
                  <option value="HR">HR</option>
                  <option value="Manager">Manager</option>
                  <option value="Interviewer">Interviewer</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-500">Join date</label>
                <input type="date" name="join_date" defaultValue={editingMember.join_date ? new Date(editingMember.join_date).toISOString().split("T")[0] : ""} className={fieldCls} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
            </div>
          </form>
        </Modal>
      )}
      {showDeleteConfirm && editingMember && (
        <Modal onClose={() => setShowDeleteConfirm(false)}>
          <h2 className="mb-2 text-base font-semibold text-ink">Confirm removal</h2>
          <p className="text-sm text-gray-600 dark:text-gray-500">Are you sure you want to remove <span className="font-semibold text-ink">{editingMember.user?.name || "this member"}</span> from the team?</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="danger" onClick={deleteMember} disabled={saving}>{saving ? "Removing…" : "Remove member"}</Button>
          </div>
        </Modal>
      )}
    </OrgAppShell>
  );
}

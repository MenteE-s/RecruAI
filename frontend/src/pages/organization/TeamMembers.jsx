import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, getBackendUrl, getAuthHeaders } from "../../utils/auth";
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
  FiCalendar,
} from "react-icons/fi";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-md border border-gray-200 max-h-[90vh] overflow-y-auto relative">
        {children}
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 text-gray-500"><FiXCircle className="w-5 h-5" /></button>
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
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const [teamMembers, setTeamMembers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [activeTab, setActiveTab] = useState("team");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const getOrgId = async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/auth/me`, { credentials: "include", headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          if (data.user?.organization_id) setOrganizationId(data.user.organization_id);
          else setError("Unable to determine organization");
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
  useEffect(() => { if (organizationId) { if (activeTab === "team") loadTeamMembers(); else loadHiredCandidates(); } }, [organizationId, activeTab]);

  const inviteMember = async (formData) => {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${getBackendUrl()}/api/organizations/${organizationId}/invite`, { method: "POST", headers: getAuthHeaders({ "Content-Type": "application/json" }), credentials: "include", body: JSON.stringify(formData) });
      if (res.ok) { setShowInviteModal(false); loadTeamMembers(); } else setError((await res.json().catch(() => ({}))).error || "Failed to invite member");
    } catch { setError("Network error. Please try again."); }
    finally { setSaving(false); }
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
                <FiUsers className="w-3.5 h-3.5" />
                TEAM
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">Team management</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Manage team members and track hired candidates.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex bg-white/10 border border-white/20 p-1">
                <button onClick={() => setActiveTab("team")} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "team" ? "bg-white text-gray-900" : "text-white hover:bg-white/10"}`}>Team • {teamMembers.length}</button>
                <button onClick={() => setActiveTab("candidates")} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "candidates" ? "bg-white text-gray-900" : "text-white hover:bg-white/10"}`}>Hired • {candidates.length}</button>
              </div>
              {activeTab === "team" && (
                <button onClick={() => setShowInviteModal(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 text-sm font-medium hover:bg-gray-100 transition-colors">
                  <FiPlus className="w-4 h-4" /> Invite
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
          <p className="text-xs text-gray-500 mt-1">Team members</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
          <p className="text-xs text-gray-500 mt-1">Hired</p>
        </div>
        <div className="bg-blue-600 text-white p-4 text-center">
          <p className="text-2xl font-bold">{candidates.filter((c) => c.onboarded).length}</p>
          <p className="text-xs text-blue-100 mt-1">Onboarded</p>
        </div>
      </div>

      {error && <div className="mb-6 bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 p-6 animate-pulse">
              <div className="h-12 w-12 bg-gray-100 mb-4" />
              <div className="h-4 bg-gray-100 w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 w-3/4" />
            </div>
          ))}
        </div>
      ) : activeTab === "team" ? (
        teamMembers.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 text-center">
            <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-4"><FiUsers className="w-7 h-7 text-gray-400" /></div>
            <h3 className="text-lg font-semibold text-gray-900">No team members yet</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">Invite your first team member to collaborate on hiring.</p>
            <button onClick={() => setShowInviteModal(true)} className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"><FiPlus className="w-4 h-4" /> Invite first member</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="p-5">
                  <div className="flex gap-3">
                    <div className="w-11 h-11 bg-gray-900 text-white flex items-center justify-center text-sm font-bold shrink-0">{member.user?.name ? member.user.name[0].toUpperCase() : "U"}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{member.user?.name || "Unnamed User"}</h3>
                      <p className="text-xs text-gray-500">{member.role || "No role"}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1.5 text-xs text-gray-500">
                    <p className="flex items-center gap-1.5"><FiCalendar className="w-3.5 h-3.5" /> Joined {formatDate(member.join_date)}</p>
                    {member.user?.email && <p className="flex items-center gap-1.5"><FiMail className="w-3.5 h-3.5" />{member.user.email}</p>}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => navigate(`/organization/user/${member.user?.id}`)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-xs font-medium text-blue-600 hover:bg-blue-50"><FiEye className="w-3.5 h-3.5" /> Profile</button>
                    <button onClick={() => { setEditingMember(member); setShowEditModal(true); }} className="p-2 bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"><FiEdit2 className="w-4 h-4" /></button>
                    <button onClick={() => { setEditingMember(member); setShowDeleteConfirm(true); }} className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50"><FiTrash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : candidates.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-4"><FiCheckCircle className="w-7 h-7 text-gray-400" /></div>
          <h3 className="text-lg font-semibold text-gray-900">No hired candidates yet</h3>
          <p className="text-sm text-gray-500 mt-1">Candidates who pass interviews will appear here.</p>
          <button onClick={() => navigate("/organization/candidates")} className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"><FiBriefcase className="w-4 h-4" /> View candidates</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="p-5">
                <div className="flex gap-3">
                  <div className="w-11 h-11 bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">{candidate.user?.name ? candidate.user.name[0].toUpperCase() : "C"}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{candidate.user?.name || "Unnamed Candidate"}</h3>
                    <p className="text-xs text-gray-500 truncate">Applied for: {candidate.post?.title || "Unknown"}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs text-gray-500">
                  <p className="flex items-center gap-1.5"><FiBriefcase className="w-3.5 h-3.5" /> Applied {formatDate(candidate.applied_at)}</p>
                  {candidate.user?.email && <p className="flex items-center gap-1.5"><FiMail className="w-3.5 h-3.5" />{candidate.user.email}</p>}
                  <p className="flex items-center gap-1.5 mt-1">{candidate.onboarded ? <><FiCheckCircle className="w-3.5 h-3.5 text-green-600" /><span className="text-green-700 font-medium">Onboarded</span></> : <><FiXCircle className="w-3.5 h-3.5 text-amber-500" /><span className="text-amber-700 font-medium">Not onboarded</span></>}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => navigate(`/organization/user/${candidate.user?.id}`)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-xs font-medium text-blue-600 hover:bg-blue-50"><FiEye className="w-3.5 h-3.5" /> Profile</button>
                  <button onClick={() => toggleOnboardingStatus(candidate.id, candidate.onboarded, candidate.user?.name || "Unnamed")} className={`inline-flex items-center px-3 py-2 text-xs font-medium border ${candidate.onboarded ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : "bg-green-600 text-white border-green-600 hover:bg-green-700"}`}>{candidate.onboarded ? "Offboard" : "Onboard"}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showInviteModal && (
        <Modal onClose={() => setShowInviteModal(false)}>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Invite team member</h2>
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); inviteMember({ email: fd.get("email"), role: fd.get("role") }); }}>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                <input type="email" name="email" required placeholder="colleague@company.com" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Role</label>
                <select name="role" required className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white">
                  <option value="">Select role</option>
                  <option value="Admin">Admin</option>
                  <option value="HR">HR</option>
                  <option value="Manager">Manager</option>
                  <option value="Member">Member</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Inviting…" : "Invite"}</button>
            </div>
          </form>
        </Modal>
      )}
      {showEditModal && editingMember && (
        <Modal onClose={() => setShowEditModal(false)}>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Edit member</h2>
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); editMember({ role: fd.get("role"), join_date: fd.get("join_date") }); }}>
            <p className="text-sm text-gray-600 mb-3">{editingMember.user?.name}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Role</label>
                <select name="role" defaultValue={editingMember.role} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white">
                  <option value="Admin">Admin</option>
                  <option value="HR">HR</option>
                  <option value="Manager">Manager</option>
                  <option value="Member">Member</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Join date</label>
                <input type="date" name="join_date" defaultValue={editingMember.join_date ? new Date(editingMember.join_date).toISOString().split("T")[0] : ""} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </Modal>
      )}
      {showDeleteConfirm && editingMember && (
        <Modal onClose={() => setShowDeleteConfirm(false)}>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Confirm removal</h2>
          <p className="text-sm text-gray-600">Are you sure you want to remove <span className="font-semibold text-gray-900">{editingMember.user?.name || "this member"}</span> from the team?</p>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={deleteMember} disabled={saving} className="px-4 py-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">{saving ? "Removing…" : "Remove"}</button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}

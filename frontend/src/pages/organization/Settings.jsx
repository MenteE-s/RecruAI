import { OrgAppShell } from "../../components/layout/OrgAppShell";
import { useState, useEffect } from "react";
import { verifyTokenWithServer, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import TimezoneSelector from "../../components/ui/TimezoneSelector";
import PaymentMethods from "../../components/ui/PaymentMethods";
import { BILLING_BETA_MESSAGE, BILLING_ENABLED } from "../../utils/billing";
import OtpVerify from "../../components/auth/OtpVerify";
import { ProfileSection } from "../../components/profile/ProfileSection";
import { Button } from "../../components/ui/Button";
import {
  Settings,
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Briefcase,
  Users,
  Globe,
  Shield,
  Trash2,
  ArrowRight,
  Plus,
  Target,
  Mail,
  Edit2,
} from "lucide-react";

export default function OrganizationSettings() {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "Member" });
  const [inviteBusy, setInviteBusy] = useState(false);
  const [teamMsg, setTeamMsg] = useState(null);
  const [emailForm, setEmailForm] = useState({ accountEmail: "", contactEmail: "", contactName: "" });
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState(null);
  const [pendingEmail, setPendingEmail] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await verifyTokenWithServer();
        setUser(userData);
        let orgData = null;
        if (userData && userData.organization_id) {
          const orgRes = await fetch(`${getBackendUrl()}/api/organizations/${userData.organization_id}`, { headers: getAuthHeaders() });
          if (orgRes.ok) {
            orgData = await orgRes.json();
            setOrganization(orgData);
          }
        }
        setEmailForm({
          accountEmail: userData?.email || "",
          contactEmail: orgData?.contact_email || "",
          contactName: orgData?.contact_name || "",
        });
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!organization?.id) return;
    const fetchTeam = async () => {
      setTeamLoading(true);
      try {
        const res = await fetch(`${getBackendUrl()}/api/organizations/${organization.id}/team-members`, {
          headers: getAuthHeaders(),
          credentials: "include",
        });
        if (res.ok) setTeamMembers(await res.json());
      } catch (err) {
        console.error("Failed to load team:", err);
      } finally {
        setTeamLoading(false);
      }
    };
    fetchTeam();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!organization) return;
    setInviteBusy(true);
    setTeamMsg(null);
    try {
      const res = await fetch(`${getBackendUrl()}/api/organizations/${organization.id}/invite`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ email: inviteForm.email.trim(), role: inviteForm.role }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTeamMsg({ type: "error", text: result.error || "Failed to invite team member." });
        return;
      }
      if (result.invitation) {
        setTeamMsg({ type: "success", text: "Invitation email sent. They will appear here after accepting." });
      } else {
        setTeamMsg({ type: "success", text: "Invitation sent." });
      }
      setInviteForm({ email: "", role: "Member" });
      setShowInvite(false);
    } catch (err) {
      console.error("Failed to invite team member:", err);
      setTeamMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setInviteBusy(false);
    }
  };

  const handleRemoveMember = async (member) => {
    if (!organization) return;
    const label = member.user?.name || member.user?.email || "this member";
    if (!window.confirm(`Remove ${label} from the team?`)) return;
    try {
      const res = await fetch(`${getBackendUrl()}/api/organizations/${organization.id}/team-members/${member.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTeamMsg({ type: "error", text: result.error || "Failed to remove team member." });
        return;
      }
      setTeamMembers((prev) => prev.filter((m) => m.id !== member.id));
      setTeamMsg({ type: "success", text: "Team member removed." });
    } catch (err) {
      console.error("Failed to remove team member:", err);
      setTeamMsg({ type: "error", text: "Network error. Please try again." });
    }
  };

  const roleBadge = (role) => {
    if (role === "Admin") return "bg-gray-900 text-white";
    if (role === "Manager") return "bg-brand/10 text-brand-text border-brand/20";
    return "bg-gray-50 text-gray-600 border-line dark:bg-gray-25";
  };

  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editRole, setEditRole] = useState("Member");
  const [roleBusy, setRoleBusy] = useState(false);

  const handleSaveRole = async (member) => {
    if (!organization) return;
    const isSelf = user && member.user_id === user.id;
    const adminCount = teamMembers.filter((m) => m.role === "Admin").length;
    // Safety: never leave the org without an Admin.
    if (isSelf && member.role === "Admin" && editRole !== "Admin" && adminCount <= 1) {
      setTeamMsg({ type: "error", text: "You are the last Admin. Promote someone else before changing your role." });
      return;
    }
    setRoleBusy(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/organizations/${organization.id}/team-members/${member.id}`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ role: editRole }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTeamMsg({ type: "error", text: result.error || "Failed to update role." });
        return;
      }
      setTeamMembers((prev) => prev.map((m) => (m.id === member.id ? result : m)));
      setEditingMemberId(null);
      setTeamMsg({ type: "success", text: "Member role updated." });
    } catch (err) {
      console.error("Failed to update role:", err);
      setTeamMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setRoleBusy(false);
    }
  };

  const handleEmailSave = async (e) => {
    e.preventDefault();
    setEmailSaving(true);
    setEmailMsg(null);
    try {
      // 1) Organization contact email (shown to candidates) saves directly.
      if (organization) {
        const orgRes = await fetch(`${getBackendUrl()}/api/organizations/${organization.id}`, {
          method: "PUT",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          credentials: "include",
          body: JSON.stringify({
            contact_email: emailForm.contactEmail.trim(),
            contact_name: emailForm.contactName.trim(),
          }),
        });
        const orgResult = await orgRes.json().catch(() => ({}));
        if (!orgRes.ok) {
          setEmailMsg({ type: "error", text: orgResult.error || "Failed to update organization contact email." });
          return;
        }
        setOrganization(orgResult);
      }

      // 2) Account email (login) changes only after proving the NEW address:
      // send it a code, then apply on verification.
      const newAccountEmail = emailForm.accountEmail.trim();
      if (newAccountEmail && user && newAccountEmail !== user.email) {
        const otpRes = await fetch(`${getBackendUrl()}/api/auth/email/change-request`, {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          credentials: "include",
          body: JSON.stringify({ new_email: newAccountEmail }),
        });
        const otpResult = await otpRes.json().catch(() => ({}));
        if (!otpRes.ok) {
          setEmailMsg({ type: "error", text: otpResult.error || "Could not send a verification code to the new address." });
          return;
        }
        setPendingEmail(newAccountEmail);
        setEmailMsg({ type: "success", text: `Organization details saved. Enter the code sent to ${newAccountEmail} to change your login email.` });
        return;
      }
      setEmailMsg({ type: "success", text: "Email details updated successfully." });
    } catch (err) {
      console.error("Failed to update email details:", err);
      setEmailMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setEmailSaving(false);
    }
  };

  const handleEmailVerified = (data) => {
    if (data.user) {
      setUser(data.user);
      setEmailForm((p) => ({ ...p, accountEmail: data.user.email || p.accountEmail }));
    }
    setPendingEmail(null);
    setEmailMsg({ type: "success", text: "Login email changed and verified." });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!organization) return;
    setSaving(true);
    try {
      const payload = { company_size: organization.company_size, industry: organization.industry, mission: organization.mission, vision: organization.vision, social_media_links: organization.social_media_links };
      const res = await fetch(`${getBackendUrl()}/api/organizations/${organization.id}/profile`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setOrganization(await res.json());
        alert("Profile updated successfully!");
      } else alert("Failed to update profile");
    } catch (err) {
      alert("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const isPaid = organization?.subscription_status?.is_paid_active;
  const isTrial = organization?.subscription_status?.is_trial_active;
  const status = organization?.subscription_status;
  const trialEnd = status?.trial_end_date
    ? new Date(status.trial_end_date).toLocaleDateString()
    : status?.trial_start_date
      ? new Date(new Date(status.trial_start_date).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
      : null;

  const orgName = organization?.name || user?.organization_name || "Organization";

  const fieldCls = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50 shadow-s5";
  const msgCls = (type) =>
    type === "success"
      ? "border-brand/20 bg-brand/10 text-brand-text"
      : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400";

  return (
    <OrgAppShell>
      {/* Header */}
      <div className="px-4 pb-4 pt-4">
        <div className="rounded-xl border border-line bg-surface p-5 shadow-s5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-25">
                <Settings className="h-3.5 w-3.5" strokeWidth={1.75} /> Organization settings
              </div>
              <h1 className="mt-2 text-[20px] font-semibold leading-7 text-ink">{orgName}</h1>
              <p className="mt-0.5 text-[13px] text-gray-500">Manage your organization profile, plan, team, and preferences.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className={`rounded-xl border p-3.5 text-center shadow-s5 ${isPaid ? "border-brand/20 bg-brand/10" : "border-line bg-gray-50 dark:bg-gray-25"}`}>
                <p className={`text-lg font-bold ${isPaid ? "text-brand-text" : "text-ink"}`}>{isPaid ? "Pro" : isTrial ? "Trial" : "Free"}</p>
                <p className="mt-0.5 text-[11px] font-medium text-gray-500">Plan</p>
              </div>
              <div className="rounded-xl border border-line bg-gray-50 p-3.5 text-center dark:bg-gray-25 shadow-s5">
                <p className="text-lg font-bold font-mono tabular-nums text-ink">{status?.tokens_used?.toLocaleString() || "0"}</p>
                <p className="mt-0.5 text-[11px] font-medium text-gray-500">Tokens</p>
              </div>
              <div className="rounded-xl border border-line bg-gray-50 p-3.5 text-center dark:bg-gray-25 shadow-s5">
                <p className="text-lg font-bold font-mono tabular-nums text-ink">{isTrial && trialEnd ? trialEnd.split("/")[0] : isPaid ? "∞" : "—"}</p>
                <p className="mt-0.5 text-[11px] font-medium text-gray-500">{isTrial ? "Trial ends" : "Members"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 pb-4">
        {/* Email details */}
        <ProfileSection>
          <div className="border-b border-line pb-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Mail className="h-4 w-4 text-gray-500" strokeWidth={1.75} /> Email details</h2>
            <p className="mt-0.5 text-sm text-gray-500">Your login email, plus the contact email candidates see on your organization profile.</p>
          </div>
          <form onSubmit={handleEmailSave} className="space-y-4 pt-4">
            {emailMsg && (
              <div className={`rounded-xl border px-4 py-3 text-sm ${msgCls(emailMsg.type)}`}>
                {emailMsg.text}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">Account email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 pointer-events-none" strokeWidth={1.75} />
                  <input
                    type="email"
                    required
                    value={emailForm.accountEmail}
                    onChange={(e) => { setEmailForm((p) => ({ ...p, accountEmail: e.target.value })); setPendingEmail(null); }}
                    placeholder="you@company.com"
                    className={`${fieldCls} pl-9`}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Used for login and account notifications. Changing it sends a verification code to the new address first.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">Organization contact email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 pointer-events-none" strokeWidth={1.75} />
                  <input
                    type="email"
                    value={emailForm.contactEmail}
                    onChange={(e) => setEmailForm((p) => ({ ...p, contactEmail: e.target.value }))}
                    placeholder="careers@company.com"
                    className={`${fieldCls} pl-9`}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Shown to candidates on your public profile.</p>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">Contact name</label>
                <input
                  type="text"
                  value={emailForm.contactName}
                  onChange={(e) => setEmailForm((p) => ({ ...p, contactName: e.target.value }))}
                  placeholder="Hiring team"
                  className={fieldCls}
                />
              </div>
            </div>
            <Button variant="dark" type="submit" disabled={emailSaving}>
              {emailSaving ? "Saving…" : "Save email details"}
            </Button>
            {pendingEmail && (
              <div className="rounded-xl border border-line bg-gray-50 p-4 dark:bg-gray-25 shadow-s5">
                <OtpVerify
                  email={user?.email}
                  displayEmail={pendingEmail}
                  headline="Confirm your new email"
                  subline={<>Enter the 6-digit code sent to <span className="font-semibold text-ink">{pendingEmail}</span>. Your current address keeps working until then.</>}
                  verifyPath="/api/auth/email/change-verify"
                  requestPath="/api/auth/email/change-request"
                  getVerifyBody={(code) => ({ new_email: pendingEmail, code })}
                  getRequestBody={() => ({ new_email: pendingEmail })}
                  onVerified={handleEmailVerified}
                  onBack={() => setPendingEmail(null)}
                />
              </div>
            )}
          </form>
        </ProfileSection>

        {/* Organization Profile */}
        <ProfileSection>
          <div className="border-b border-line pb-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Briefcase className="h-4 w-4 text-gray-500" strokeWidth={1.75} /> Organization profile</h2>
            <p className="mt-0.5 text-sm text-gray-500">Update your company details visible to candidates.</p>
          </div>
          {loading ? (
            <div className="space-y-3 pt-4">
              <div className="h-10 animate-pulse rounded-xl border border-line bg-surface" />
              <div className="h-20 animate-pulse rounded-xl border border-line bg-surface" />
            </div>
          ) : organization ? (
            <form onSubmit={handleProfileUpdate} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">Company size</label>
                  <input type="text" value={organization.company_size || ""} onChange={(e) => setOrganization({ ...organization, company_size: e.target.value })} placeholder="e.g. 11-50, 51-200" className={fieldCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">Industry</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 pointer-events-none" strokeWidth={1.75} />
                    <input type="text" value={organization.industry || ""} onChange={(e) => setOrganization({ ...organization, industry: e.target.value })} placeholder="e.g. Technology, Healthcare" className={`${fieldCls} pl-9`} />
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">Mission</label>
                <textarea value={organization.mission || ""} onChange={(e) => setOrganization({ ...organization, mission: e.target.value })} rows={3} placeholder="What drives your organization?" className={`${fieldCls} resize-none`} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">Vision</label>
                <textarea value={organization.vision || ""} onChange={(e) => setOrganization({ ...organization, vision: e.target.value })} rows={3} placeholder="Where are you headed?" className={`${fieldCls} resize-none`} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">Social media links (JSON array)</label>
                <textarea
                  value={JSON.stringify(organization.social_media_links || [], null, 2)}
                  onChange={(e) => {
                    try {
                      const links = JSON.parse(e.target.value);
                      setOrganization({ ...organization, social_media_links: links });
                    } catch {}
                  }}
                  rows={3}
                  className={`${fieldCls} resize-none font-mono text-xs`}
                  placeholder='[{"platform": "LinkedIn", "url": "https://linkedin.com/company/..."}]'
                />
              </div>
              <Button variant="dark" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save profile"}
              </Button>
            </form>
          ) : (
            <div className="pt-4 text-sm text-gray-500">No organization data available.</div>
          )}
        </ProfileSection>

        {/* Current Plan */}
        <ProfileSection>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Target className="h-4 w-4 text-gray-500" strokeWidth={1.75} /> Current plan</h2>
              <p className="mt-2 flex items-center gap-2 text-2xl font-bold capitalize text-ink">
                {isPaid ? "Pro" : isTrial ? "Trial" : "Free"} {isPaid && <span className="rounded-full bg-brand-action px-2 py-0.5 text-xs font-semibold text-white">Active</span>}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1 rounded-full border border-line bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-25">Tokens: <span className="font-mono tabular-nums">{status?.tokens_used?.toLocaleString() || "0"}</span></span>
                {isPaid ? "Full access to advanced hiring tools" : isTrial ? `Trial — ${status?.features_accessible?.includes("all") ? "full features" : "limited features"}` : "Limited for small teams"}
              </p>
              {isTrial && trialEnd && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                  <Clock className="h-3.5 w-3.5" strokeWidth={1.75} /> Trial expires: <span className="font-mono tabular-nums">{trialEnd}</span>
                </p>
              )}
            </div>
            {!isPaid && BILLING_ENABLED && (
              <Button variant="primary" size="lg" className="shrink-0">
                Upgrade to Pro <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </Button>
            )}
            {!isPaid && !BILLING_ENABLED && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 shadow-s5">
                Paid upgrades are closed during the beta.
              </span>
            )}
          </div>
        </ProfileSection>

        {/* Plan Comparison */}
        <ProfileSection>
          <h2 className="text-sm font-semibold text-ink">Available plans</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className={`rounded-xl border p-5 shadow-s5 ${!isPaid ? "border-amber-300 bg-amber-50/50 dark:border-amber-500/40 dark:bg-amber-500/10" : "border-line bg-surface"}`}>
              <h3 className="text-sm font-semibold text-ink">Trial</h3>
              <p className="mt-2 text-2xl font-bold text-ink">Free</p>
              <ul className="mt-3 space-y-1.5 text-sm text-gray-600 dark:text-gray-500"><li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" strokeWidth={1.75} /> Up to 5 team members</li><li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" strokeWidth={1.75} /> Basic job posting</li><li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" strokeWidth={1.75} /> Candidate tracking</li><li className="flex gap-2"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" strokeWidth={1.75} /> Limited analytics</li></ul>
              {!isPaid && <span className="mt-3 inline-flex rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-xs font-medium dark:bg-amber-500/20 dark:text-amber-400 shadow-s5">Current</span>}
            </div>
            <div className={`rounded-xl border p-5 shadow-s5 ${isPaid ? "border-brand/30 bg-brand/5" : "border-line bg-surface"}`}>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">Pro {isPaid && <span className="rounded-full bg-brand-action px-2 py-0.5 text-xs font-semibold text-white">Active</span>}</h3>
              <p className="mt-2 text-2xl font-bold text-ink">
                {BILLING_ENABLED ? <>$29.99<span className="text-sm font-normal text-gray-500">/month</span></> : "Included during beta"}
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-gray-600 dark:text-gray-500"><li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-text" strokeWidth={1.75} /> Unlimited team &amp; AI matching</li><li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-text" strokeWidth={1.75} /> Advanced posting &amp; full analytics</li><li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-text" strokeWidth={1.75} /> Integrations &amp; API</li></ul>
              {isPaid ? (
                <span className="mt-3 inline-flex rounded-full bg-brand-action px-3 py-1.5 text-xs font-medium text-white shadow-s5">Current plan</span>
              ) : BILLING_ENABLED ? (
                <Button variant="primary" size="sm" className="mt-3">
                  Upgrade now <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                </Button>
              ) : (
                <span className="mt-3 inline-flex text-xs text-gray-500">Paid upgrades are closed during the beta.</span>
              )}
            </div>
          </div>
        </ProfileSection>

        {/* Team */}
        <ProfileSection>
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Users className="h-4 w-4 text-gray-500" strokeWidth={1.75} /> Team management</h2>
            <span className="text-xs font-mono tabular-nums text-gray-500">{teamMembers.length} {teamMembers.length === 1 ? "member" : "members"}</span>
          </div>
          {teamMsg && (
            <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${msgCls(teamMsg.type)}`}>
              {teamMsg.text}
            </div>
          )}
          <div className="mt-4 space-y-2">
            {teamLoading ? (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" />
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line py-6 text-center shadow-s5">
                <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" strokeWidth={1.75} />
                <p className="text-sm text-gray-500">No team members yet</p>
                <p className="mt-1 text-xs text-gray-500">Invite your first teammate below</p>
              </div>
            ) : (
              teamMembers.map((member) => {
                const isSelf = user && member.user_id === user.id;
                const isEditing = editingMemberId === member.id;
                return (
                  <div key={member.id} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-25 sm:flex-row sm:items-center sm:justify-between shadow-s5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {member.user?.name || member.user?.email || "Unknown"} • {member.role}
                        {isSelf && <span className="ml-2 rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-bold text-white dark:bg-gray-50 dark:text-ink">YOU</span>}
                      </p>
                      <p className="truncate text-xs text-gray-500">{member.user?.email}</p>
                    </div>
                    {isEditing ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <select
                          aria-label="Edit role for member"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-ink outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-[#E1E4E8]/50 shadow-s5"
                        >
                          <option value="Member">Member</option>
                          <option value="Manager">Manager</option>
                          <option value="HR">HR</option>
                          <option value="Admin">Admin</option>
                        </select>
                        <Button variant="dark" size="sm" onClick={() => handleSaveRole(member)} disabled={roleBusy}>
                          {roleBusy ? "Saving…" : "Save"}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setEditingMemberId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${roleBadge(member.role)}`}>{member.role}</span>
                        <button
                          onClick={() => { setEditingMemberId(member.id); setEditRole(member.role); setTeamMsg(null); }}
                          title="Edit role"
                          aria-label={`Edit role for ${member.user?.name || "member"}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-brand-text dark:hover:bg-gray-25"
                        >
                          <Edit2 className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                        {!isSelf && (
                          <button onClick={() => handleRemoveMember(member)} title="Remove from team" aria-label={`Remove ${member.user?.name || "member"} from team`} className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10">
                            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {showInvite ? (
              <form onSubmit={handleInvite} className="space-y-3 rounded-xl border border-line bg-gray-50 p-4 dark:bg-gray-25 shadow-s5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">Email address</label>
                    <input
                      type="email"
                      required
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="teammate@company.com"
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-500">Role</label>
                    <select
                      aria-label="Role for invite"
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value }))}
                      className={fieldCls}
                    >
                      <option value="Member">Member</option>
                      <option value="Manager">Manager</option>
                      <option value="HR">HR</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="dark" type="submit" disabled={inviteBusy}>
                    {inviteBusy ? "Inviting…" : "Send invite"}
                  </Button>
                  <Button variant="secondary" type="button" onClick={() => setShowInvite(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button variant="secondary" onClick={() => { setShowInvite(true); setTeamMsg(null); }}>
                <Plus className="h-4 w-4" strokeWidth={1.75} /> Invite team member
              </Button>
            )}
          </div>
        </ProfileSection>

        {/* Payment */}
        <ProfileSection>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><CreditCard className="h-4 w-4 text-gray-500" strokeWidth={1.75} /> Payment methods</h2>
          <div className="mt-4">
            {BILLING_ENABLED ? (
              <PaymentMethods storageKey={organization?.id ? `recruai_cards_org_${organization.id}` : "recruai_cards_org"} />
            ) : (
              <p className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 shadow-s5">
                {BILLING_BETA_MESSAGE}
              </p>
            )}
          </div>
        </ProfileSection>

        {/* Billing */}
        <ProfileSection>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Clock className="h-4 w-4 text-gray-500" strokeWidth={1.75} /> Billing history</h2>
          <div className="mt-4 rounded-xl border border-dashed border-line py-6 text-center shadow-s5">
            <Clock className="mx-auto mb-2 h-8 w-8 text-gray-300" strokeWidth={1.75} />
            <p className="text-sm text-gray-500">{BILLING_ENABLED ? "No invoices yet" : "Billing is not active during the beta"}</p>
            <p className="mt-1 text-xs text-gray-500">{BILLING_ENABLED ? "Your billing history will appear here" : BILLING_BETA_MESSAGE}</p>
          </div>
        </ProfileSection>

        {/* Preferences */}
        <ProfileSection>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Shield className="h-4 w-4 text-gray-500" strokeWidth={1.75} /> Organization preferences</h2>
          <div className="mt-2 divide-y divide-line">
            {[
              { title: "Email notifications", desc: "Receive updates about team activity and billing", defaultChecked: true, icon: Mail },
              { title: "Team invitations", desc: "Allow team members to invite others", defaultChecked: true, icon: Users },
              { title: "Data analytics", desc: "Help improve our service with usage analytics", defaultChecked: true, icon: Shield },
            ].map((pref) => {
              const Icon = pref.icon;
              return (
                <div key={pref.title} className="flex items-center justify-between py-4">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-line bg-gray-50 dark:bg-gray-25 shadow-s5"><Icon className="h-4 w-4 text-gray-500" strokeWidth={1.75} /></div>
                    <div><p className="text-sm font-medium text-ink">{pref.title}</p><p className="text-xs text-gray-500">{pref.desc}</p></div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" aria-label={pref.title} defaultChecked={pref.defaultChecked} className="sr-only peer" />
                    <div className="peer h-5 w-9 rounded-full bg-gray-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand peer-checked:after:translate-x-4"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </ProfileSection>

        {/* Timezone */}
        <ProfileSection>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Globe className="h-4 w-4 text-gray-500" strokeWidth={1.75} /> Timezone settings</h2>
          <p className="mt-0.5 text-sm text-gray-500">Set your organization's timezone for all team members.</p>
          <div className="mt-4"><TimezoneSelector organizationId={organization?.id} value={organization?.timezone} showCurrentTime={true} /></div>
        </ProfileSection>

        {/* Danger */}
        <div className="overflow-hidden rounded-xl border border-red-200 bg-surface dark:border-red-500/30 shadow-s5">
          <div className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-5 py-3 dark:border-red-500/30 dark:bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" strokeWidth={1.75} />
            <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">Danger zone</h2>
          </div>
          <div className="space-y-3 p-5">
            <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50/50 p-4 dark:border-red-500/20 dark:bg-red-500/5 sm:flex-row sm:items-center sm:justify-between shadow-s5">
              <div><p className="text-sm font-medium text-ink">Cancel subscription</p><p className="text-xs text-gray-600 dark:text-gray-500">End subscription and downgrade to trial</p></div>
              <Button variant="danger" size="sm" className="shrink-0 border border-red-200 hover:bg-red-50 dark:border-red-500/30">Cancel</Button>
            </div>
            <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10 sm:flex-row sm:items-center sm:justify-between shadow-s5">
              <div><p className="flex items-center gap-2 text-sm font-medium text-ink"><Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" strokeWidth={1.75} /> Delete organization</p><p className="text-xs text-gray-600 dark:text-gray-500">Permanently delete organization and all data</p></div>
              <Button variant="danger" size="sm" className="shrink-0 bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700">Delete</Button>
            </div>
          </div>
        </div>
      </div>
    </OrgAppShell>
  );
}

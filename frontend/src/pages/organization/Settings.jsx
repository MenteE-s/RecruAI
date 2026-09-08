import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, verifyTokenWithServer, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import TimezoneSelector from "../../components/ui/TimezoneSelector";
import {
  FiSettings,
  FiCreditCard,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiBriefcase,
  FiUsers,
  FiGlobe,
  FiFileText,
  FiShield,
  FiTrash2,
  FiArrowRight,
  FiDownload,
  FiPlus,
  FiTarget,
  FiMail,
} from "react-icons/fi";

export default function OrganizationSettings() {
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await verifyTokenWithServer();
        setUser(userData);
        if (userData && userData.organization_id) {
          const orgRes = await fetch(`${getBackendUrl()}/api/organizations/${userData.organization_id}`, { headers: getAuthHeaders() });
          if (orgRes.ok) setOrganization(await orgRes.json());
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
  const trialEnd = status?.trial_start_date ? new Date(new Date(status.trial_start_date).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() : null;

  const orgName = organization?.name || user?.organization_name || "Organization";

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
                <FiSettings className="w-3.5 h-3.5" />
                ORGANIZATION SETTINGS
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">{orgName}</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Manage your organization profile, plan, team, and preferences.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[380px]">
              <div className={`p-4 text-center border backdrop-blur ${isPaid ? "bg-green-500/20 border-green-400/20" : "bg-white/10 border-white/10"}`}>
                <p className={`text-lg font-bold ${isPaid ? "text-green-300" : "text-white"}`}>{isPaid ? "Pro" : isTrial ? "Trial" : "Free"}</p>
                <p className={`text-xs mt-1 ${isPaid ? "text-green-200" : "text-gray-300"}`}>Plan</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-lg font-bold">{status?.tokens_used?.toLocaleString() || "0"}</p>
                <p className="text-xs text-gray-300 mt-1">Tokens</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-lg font-bold">{isTrial && trialEnd ? trialEnd.split("/")[0] : isPaid ? "∞" : "—"}</p>
                <p className="text-xs text-gray-300 mt-1">{isTrial ? "Trial ends" : "Members"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Organization Profile */}
        <div className="bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiBriefcase className="w-4 h-4 text-gray-500" /> Organization profile</h3>
            <p className="text-sm text-gray-500 mt-1">Update your company details visible to candidates.</p>
          </div>
          {loading ? (
            <div className="p-6 animate-pulse space-y-3">
              <div className="h-10 bg-gray-100" />
              <div className="h-20 bg-gray-100" />
            </div>
          ) : organization ? (
            <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Company size</label>
                  <input type="text" value={organization.company_size || ""} onChange={(e) => setOrganization({ ...organization, company_size: e.target.value })} placeholder="e.g. 11-50, 51-200" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Industry</label>
                  <div className="relative">
                    <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" value={organization.industry || ""} onChange={(e) => setOrganization({ ...organization, industry: e.target.value })} placeholder="e.g. Technology, Healthcare" className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Mission</label>
                <textarea value={organization.mission || ""} onChange={(e) => setOrganization({ ...organization, mission: e.target.value })} rows={3} placeholder="What drives your organization?" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Vision</label>
                <textarea value={organization.vision || ""} onChange={(e) => setOrganization({ ...organization, vision: e.target.value })} rows={3} placeholder="Where are you headed?" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Social media links (JSON array)</label>
                <textarea
                  value={JSON.stringify(organization.social_media_links || [], null, 2)}
                  onChange={(e) => {
                    try {
                      const links = JSON.parse(e.target.value);
                      setOrganization({ ...organization, social_media_links: links });
                    } catch {}
                  }}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm font-mono focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                  placeholder='[{"platform": "LinkedIn", "url": "https://linkedin.com/company/..."}]'
                />
              </div>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving…" : "Save profile"}
              </button>
            </form>
          ) : (
            <div className="p-6 text-sm text-gray-500">No organization data available.</div>
          )}
        </div>

        {/* Current Plan */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiTarget className="w-4 h-4 text-gray-500" /> Current plan</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2 flex items-center gap-2 capitalize">
                {isPaid ? "Pro" : isTrial ? "Trial" : "Free"} {isPaid && <span className="text-xs bg-green-600 text-white px-2 py-0.5">ACTIVE</span>}
              </p>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5"><span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5">🪙 Tokens: {status?.tokens_used?.toLocaleString() || "0"}</span> {isPaid ? "Full access to advanced hiring tools" : isTrial ? `Trial — ${status?.features_accessible?.includes("all") ? "full features" : "limited features"}` : "Limited for small teams"}</p>
              {isTrial && trialEnd && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 inline-flex items-center gap-1.5 px-2.5 py-1 mt-2"><FiClock className="w-3.5 h-3.5" /> Trial expires: {trialEnd}</p>}
            </div>
            {!isPaid && <button className="px-6 py-3 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">Upgrade to Pro <FiArrowRight className="w-4 h-4 inline ml-1" /></button>}
          </div>
        </div>

        {/* Plan Comparison */}
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900">Available plans</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`border p-5 ${!isPaid ? "border-amber-400 bg-amber-50/50" : "border-gray-200 bg-white"}`}>
              <h4 className="text-sm font-semibold text-gray-900">Trial</h4>
              <p className="text-2xl font-bold text-gray-900 mt-2">Free</p>
              <ul className="mt-3 space-y-1.5 text-sm text-gray-600"><li className="flex gap-2"><FiCheckCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /> Up to 5 team members</li><li className="flex gap-2"><FiCheckCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /> Basic job posting</li><li className="flex gap-2"><FiCheckCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /> Candidate tracking</li><li className="flex gap-2"><FiXCircle className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" /> Limited analytics</li></ul>
              {!isPaid && <span className="inline-flex mt-3 text-xs bg-amber-500 text-white px-2 py-1 font-medium">Current</span>}
            </div>
            <div className={`border p-5 ${isPaid ? "border-green-500 bg-green-50/50" : "border-gray-200 bg-white"}`}>
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">Pro {isPaid && <span className="text-xs bg-green-600 text-white px-2 py-0.5">ACTIVE</span>}</h4>
              <p className="text-2xl font-bold text-gray-900 mt-2">$29.99<span className="text-sm font-normal text-gray-500">/month</span></p>
              <ul className="mt-3 space-y-1.5 text-sm text-gray-600"><li className="flex gap-2"><FiCheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Unlimited team & AI matching</li><li className="flex gap-2"><FiCheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Advanced posting & full analytics</li><li className="flex gap-2"><FiCheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Integrations & API</li></ul>
              {isPaid ? <span className="inline-flex mt-3 text-xs bg-green-600 text-white px-3 py-1.5 font-medium">Current plan</span> : <button className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Upgrade now <FiArrowRight className="w-4 h-4" /></button>}
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiUsers className="w-4 h-4 text-gray-500" /> Team management</h3>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between p-4 border border-gray-200 hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">John Smith • Admin</p>
                <p className="text-xs text-gray-500">john@company.com</p>
              </div>
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1">Admin</span>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">Sarah Johnson • Hiring Manager</p>
                <p className="text-xs text-gray-500">sarah@company.com</p>
              </div>
              <div className="flex gap-2"><span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1">Manager</span><button className="text-xs bg-white border border-gray-200 px-3 py-1 hover:bg-gray-50">Edit</button></div>
            </div>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"><FiPlus className="w-4 h-4" /> Invite team member</button>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiCreditCard className="w-4 h-4 text-gray-500" /> Payment methods</h3>
          <div className="mt-4 flex items-center justify-between p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 border border-blue-100 flex items-center justify-center"><FiCreditCard className="w-5 h-5 text-blue-600" /></div>
              <div><p className="text-sm font-medium text-gray-900">•••• •••• •••• 4242</p><p className="text-xs text-gray-500">Expires 12/25</p></div>
            </div>
            <div className="flex gap-2"><button className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-medium hover:bg-gray-50">Edit</button><button className="px-3 py-1.5 bg-white border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50">Remove</button></div>
          </div>
          <button className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50"><FiPlus className="w-4 h-4" /> Add payment method</button>
        </div>

        {/* Billing */}
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiClock className="w-4 h-4 text-gray-500" /> Billing history</h3>
          <div className="mt-4 flex items-center justify-between p-4 border border-gray-200">
            <div><p className="text-sm font-medium text-gray-900">Pro Plan — Monthly</p><p className="text-xs text-gray-500">November 1, 2024</p></div>
            <div className="flex items-center gap-3"><p className="text-sm font-semibold text-gray-900">$29.99</p><button className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"><FiDownload className="w-3.5 h-3.5" /> Download</button></div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiShield className="w-4 h-4 text-gray-500" /> Organization preferences</h3>
          <div className="mt-4 divide-y divide-gray-100">
            {[
              { title: "Email notifications", desc: "Receive updates about team activity and billing", defaultChecked: true, icon: FiMail },
              { title: "Team invitations", desc: "Allow team members to invite others", defaultChecked: true, icon: FiUsers },
              { title: "Data analytics", desc: "Help improve our service with usage analytics", defaultChecked: true, icon: FiShield },
            ].map((pref) => {
              const Icon = pref.icon;
              return (
                <div key={pref.title} className="flex items-center justify-between py-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-gray-500" /></div>
                    <div><p className="text-sm font-medium text-gray-900">{pref.title}</p><p className="text-xs text-gray-500">{pref.desc}</p></div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={pref.defaultChecked} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:w-4 after:h-4 after:transition-all peer-checked:after:translate-x-4"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timezone */}
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiGlobe className="w-4 h-4 text-gray-500" /> Timezone settings</h3>
          <p className="text-sm text-gray-500 mt-1">Set your organization's timezone for all team members.</p>
          <div className="mt-4"><TimezoneSelector organizationId={organization?.id} showCurrentTime={true} /></div>
        </div>

        {/* Danger */}
        <div className="border border-red-200 bg-white">
          <div className="bg-red-50 px-6 py-3 border-b border-red-200 flex items-center gap-2"><FiAlertTriangle className="w-4 h-4 text-red-600" /><h3 className="text-sm font-semibold text-red-700">Danger zone</h3></div>
          <div className="p-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-red-100 bg-red-50/50">
              <div><p className="text-sm font-medium text-gray-900">Cancel subscription</p><p className="text-xs text-gray-600">End subscription and downgrade to trial</p></div>
              <button className="px-4 py-2 bg-white border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 shrink-0">Cancel</button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-red-200 bg-red-50">
              <div><p className="text-sm font-medium text-gray-900 flex items-center gap-2"><FiTrash2 className="w-4 h-4 text-red-600" /> Delete organization</p><p className="text-xs text-gray-600">Permanently delete organization and all data</p></div>
              <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700 shrink-0">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

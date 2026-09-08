import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import TimezoneSelector from "../../components/ui/TimezoneSelector";
import {
  FiSettings,
  FiCreditCard,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiAward,
  FiZap,
  FiShield,
  FiBell,
  FiMail,
  FiGlobe,
  FiTrash2,
  FiArrowRight,
  FiDownload,
  FiPlus,
} from "react-icons/fi";

export default function Settings() {
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${getBackendUrl()}/api/auth/me`, { credentials: "include", headers: getAuthHeaders() });
        if (response.ok) {
          const data = await response.json();
          setUserId(data.id);
          setUserData(data.user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  const isPaid = userData?.subscription_status?.is_paid_active;
  const isTrial = userData?.subscription_status?.is_trial_active;
  const status = userData?.subscription_status;
  const trialEnd = status?.trial_start_date ? new Date(new Date(status.trial_start_date).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() : null;

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
                SETTINGS
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">Account settings</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Manage your plan, billing, and preferences.</p>
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
                <p className="text-xs text-gray-300 mt-1">{isTrial ? "Trial ends" : "Status"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Current Plan */}
        <div className="bg-white border border-gray-200">
          <div className="px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiAward className="w-4 h-4 text-gray-500" /> Current plan</h3>
                {isPaid && <span className="text-xs font-bold bg-green-600 text-white px-2 py-0.5">ACTIVE</span>}
                {isTrial && !isPaid && <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5">TRIAL</span>}
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2 capitalize flex items-center gap-2">
                {isPaid ? "Pro" : isTrial ? "Trial" : "Free"} <span className="text-sm font-normal text-gray-500">plan</span>
                {isPaid && <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1"><span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" /> Premium</span>}
              </p>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5"><FiZap className="w-3.5 h-3.5 text-blue-500" />Tokens used: <span className="font-medium text-gray-700">{status?.tokens_used?.toLocaleString() || "0"}</span></p>
              <p className="text-sm text-gray-600 mt-2 max-w-xl">{isPaid ? "Full access to all premium features and analytics" : isTrial ? `Trial active — ${status?.features_accessible?.includes("all") ? "full features" : "limited features"}` : "Limited features with basic interview tools"}</p>
              {isTrial && isPaid === false && trialEnd && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 inline-flex items-center gap-1.5 px-2.5 py-1 mt-2"><FiClock className="w-3.5 h-3.5" /> Trial expires: {trialEnd}</p>}
            </div>
            {!isPaid && <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shrink-0">Upgrade to Pro <FiArrowRight className="w-4 h-4" /></button>}
          </div>
        </div>

        {/* Plan Comparison */}
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900">Available plans</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`border p-5 ${!isPaid ? "border-amber-400 bg-amber-50/50" : "border-gray-200 bg-white"}`}>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Trial</h4>
                {!isPaid && <span className="text-xs bg-amber-500 text-white px-2 py-1 font-medium">Current</span>}
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">Free</p>
              <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
                <li className="flex gap-2"><FiCheckCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /> Profile management</li>
                <li className="flex gap-2"><FiCheckCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /> Interview scheduling</li>
                <li className="flex gap-2"><FiCheckCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /> Basic job tracking</li>
                <li className="flex gap-2"><FiXCircle className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" /> Limited analytics</li>
              </ul>
            </div>
            <div className={`border p-5 ${isPaid ? "border-green-500 bg-green-50/50" : "border-gray-200 bg-white"}`}>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">Pro {isPaid && <span className="text-xs bg-green-600 text-white px-2 py-0.5">ACTIVE</span>}</h4>
                <span className="text-xs text-gray-500">Most popular</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">$9.99<span className="text-sm font-normal text-gray-500">/month</span></p>
              <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
                <li className="flex gap-2"><FiCheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Everything in Trial</li>
                <li className="flex gap-2"><FiCheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Advanced analytics</li>
                <li className="flex gap-2"><FiCheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Resume builder & job alerts</li>
                <li className="flex gap-2"><FiCheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Career coaching & unlimited interviews</li>
              </ul>
              {isPaid ? <span className="inline-flex mt-4 text-xs bg-green-600 text-white px-3 py-1.5 font-medium">Current plan</span> : <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Upgrade now <FiArrowRight className="w-4 h-4" /></button>}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiCreditCard className="w-4 h-4 text-gray-500" /> Payment methods</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between p-4 border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 border border-blue-100 flex items-center justify-center"><FiCreditCard className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">•••• •••• •••• 4242</p>
                  <p className="text-xs text-gray-500">Expires 12/25 • Visa</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50">Edit</button>
                <button className="px-3 py-1.5 bg-white border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50">Remove</button>
              </div>
            </div>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"><FiPlus className="w-4 h-4" /> Add payment method</button>
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiClock className="w-4 h-4 text-gray-500" /> Billing history</h3>
            <span className="text-xs text-gray-500">{2} invoices</span>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { title: "Pro Plan — Monthly", date: "November 1, 2024", amount: "$9.99" },
              { title: "Pro Plan — Monthly", date: "October 1, 2024", amount: "$9.99" },
            ].map((inv, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-gray-200 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{inv.title}</p>
                  <p className="text-xs text-gray-500">{inv.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-gray-900">{inv.amount}</p>
                  <button className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"><FiDownload className="w-3.5 h-3.5" /> Download</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FiBell className="w-4 h-4 text-gray-500" /> Account preferences</h3>
          <div className="mt-4 divide-y divide-gray-100">
            {[
              { title: "Email notifications", desc: "Receive updates about your account and interviews", defaultChecked: true, icon: FiMail },
              { title: "Marketing emails", desc: "Receive tips and product updates", defaultChecked: false, icon: FiGlobe },
              { title: "Data analytics", desc: "Help improve our service with usage analytics", defaultChecked: true, icon: FiShield },
            ].map((pref) => {
              const Icon = pref.icon;
              return (
                <div key={pref.title} className="flex items-center justify-between py-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-gray-500" /></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{pref.title}</p>
                      <p className="text-xs text-gray-500">{pref.desc}</p>
                    </div>
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
          <p className="text-sm text-gray-500 mt-1">Set your timezone to ensure interview times are displayed correctly.</p>
          <div className="mt-4"><TimezoneSelector userId={userId} showCurrentTime={true} /></div>
        </div>

        {/* Danger Zone */}
        <div className="border border-red-200 bg-white">
          <div className="bg-red-50 px-6 py-3 border-b border-red-200 flex items-center gap-2">
            <FiAlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-semibold text-red-700">Danger zone</h3>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-red-100 bg-red-50/50">
              <div>
                <p className="text-sm font-medium text-gray-900">Cancel subscription</p>
                <p className="text-xs text-gray-600">End your subscription and downgrade to trial plan</p>
              </div>
              <button className="px-4 py-2 bg-white border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 shrink-0">Cancel</button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-red-200 bg-red-50">
              <div>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-2"><FiTrash2 className="w-4 h-4 text-red-600" /> Delete account</p>
                <p className="text-xs text-gray-600">Permanently delete your account and all data</p>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700 shrink-0">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

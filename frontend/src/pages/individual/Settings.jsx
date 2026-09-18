import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, getBackendUrl, getAuthHeaders, getCurrentUser } from "../../utils/auth";
import TimezoneSelector from "../../components/ui/TimezoneSelector";
import PaymentMethods from "../../components/ui/PaymentMethods";
import OtpVerify from "../../components/auth/OtpVerify";
import {
  FiUser,
  FiAward,
  FiCreditCard,
  FiBell,
  FiSliders,
  FiShield,
  FiMail,
  FiGlobe,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiChevronRight,
  FiAlertTriangle,
  FiTrash2,
  FiZap,
  FiArrowRight,
} from "react-icons/fi";

const SECTIONS = [
  { id: "account", label: "Account", icon: FiUser },
  { id: "plan", label: "Subscription", icon: FiAward },
  { id: "billing", label: "Billing", icon: FiCreditCard },
  { id: "notifications", label: "Notifications", icon: FiBell },
  { id: "preferences", label: "Preferences", icon: FiSliders },
  { id: "security", label: "Security", icon: FiShield },
];

function Row({ icon: Icon, title, desc, right, onClick }) {
  const Inner = (
    <>
      <div className="flex gap-2.5 min-w-0 flex-1">
        {Icon && (
          <div className="w-7 h-7 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 text-gray-500" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-gray-900 leading-tight">{title}</p>
          {desc && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {right}
        {onClick && <FiChevronRight className="w-4 h-4 text-gray-300" />}
      </div>
    </>
  );
  const cls = "w-full flex items-center justify-between gap-3 py-3 text-left";
  return onClick ? (
    <button onClick={onClick} className={`${cls} hover:bg-gray-50 -mx-2 px-2 rounded-md transition-colors`}>
      {Inner}
    </button>
  ) : (
    <div className={cls}>{Inner}</div>
  );
}

export default function Settings() {
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const [active, setActive] = useState("account");
  const [expanded, setExpanded] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [emailForm, setEmailForm] = useState({ email: "", name: "", phone: "", location: "" });
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchUser = async () => {
      try {
        // Shared short-TTL cache: no extra /me round-trip when the dashboard
        // or route guard already fetched it this minute.
        const user = await getCurrentUser();
        if (cancelled || !user) return;
        setUserId(user?.id ?? null);
        setUserData(user);
        setEmailForm({
          email: user?.email || "",
          name: user?.name || "",
          phone: user?.phone || "",
          location: user?.location || "",
        });
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const [pendingEmail, setPendingEmail] = useState(null);

  const handleEmailSave = async (e) => {
    e.preventDefault();
    setEmailSaving(true);
    setEmailMsg(null);
    try {
      // 1) Save name/phone/location (email is handled separately below).
      const response = await fetch(`${getBackendUrl()}/api/auth/me`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({
          name: emailForm.name.trim(),
          phone: emailForm.phone.trim(),
          location: emailForm.location.trim(),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setEmailMsg({ type: "error", text: result.error || "Failed to update." });
        return;
      }
      setUserData(result.user);
      // Refresh the shared cache so other pages show the new details at once.
      getCurrentUser({ forceRefresh: true }).catch(() => {});

      // 2) Email change needs proof of the NEW address first: send it a code.
      const newEmail = emailForm.email.trim();
      if (newEmail && newEmail !== result.user.email) {
        const otpRes = await fetch(`${getBackendUrl()}/api/auth/email/change-request`, {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          credentials: "include",
          body: JSON.stringify({ new_email: newEmail }),
        });
        const otpResult = await otpRes.json().catch(() => ({}));
        if (!otpRes.ok) {
          setEmailMsg({ type: "error", text: otpResult.error || "Could not send a verification code to the new address." });
          return;
        }
        setPendingEmail(newEmail);
        setEmailMsg({ type: "success", text: `Details saved. Enter the code sent to ${newEmail} to change your email.` });
      } else {
        setEmailMsg({ type: "success", text: "Contact details updated." });
      }
    } catch (error) {
      console.error("Error updating email details:", error);
      setEmailMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setEmailSaving(false);
    }
  };

  const handleEmailVerified = (data) => {
    if (data.user) {
      setUserData(data.user);
      setEmailForm((p) => ({ ...p, email: data.user.email || p.email }));
      getCurrentUser({ forceRefresh: true }).catch(() => {});
    }
    setPendingEmail(null);
    setEmailMsg({ type: "success", text: "Email address changed and verified." });
  };

  const toggle = (key) => setExpanded((prev) => (prev === key ? null : key));

  const isPaid = userData?.subscription_status?.is_paid_active;
  const isTrial = userData?.subscription_status?.is_trial_active;
  const status = userData?.subscription_status;
  const trialEnd = status?.trial_start_date ? new Date(new Date(status.trial_start_date).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() : null;

  const inputCls = "w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white";
  const labelCls = "block text-[11px] font-medium text-gray-500 mb-1";

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="w-full max-w-3xl mx-auto">
        <h1 className="text-base font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-[11px] text-gray-500 mt-0.5 mb-3">Manage your account, plan, and preferences.</p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Left category nav */}
          <nav className="md:col-span-4 bg-white border border-gray-200 rounded-lg shadow-sm p-1.5 h-fit md:sticky md:top-14">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = active === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors ${
                    isActive ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                  {s.label}
                  {s.id === "plan" && (
                    <span className={`ml-auto text-[10px] font-bold px-1.5 py-px rounded ${isPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {isPaid ? "PRO" : isTrial ? "TRIAL" : "FREE"}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right content panel */}
          <div className="md:col-span-8 bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-1.5 h-fit">
            {active === "account" && (
              <div className="divide-y divide-gray-100">
                <Row
                  icon={FiMail}
                  title="Contact info"
                  desc="Email, name, phone, and location. Job alerts go to this email."
                  onClick={() => toggle("contact")}
                />
                {expanded === "contact" && (
                  <form onSubmit={handleEmailSave} className="pb-4 space-y-2.5">
                    {emailMsg && (
                      <div className={`px-3 py-2 text-xs rounded-md border ${emailMsg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                        {emailMsg.text}
                      </div>
                    )}
                    <div>
                      <label className={labelCls}>Email address</label>
                      <input type="email" required value={emailForm.email} onChange={(e) => { setEmailForm((p) => ({ ...p, email: e.target.value })); setPendingEmail(null); }} placeholder="you@example.com" className={inputCls} />
                      <p className={labelCls} style={{ marginTop: 4 }}>Changing it sends a verification code to the new address first.</p>
                    </div>
                    {pendingEmail && (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <OtpVerify
                          email={userData?.email}
                          displayEmail={pendingEmail}
                          headline="Confirm your new email"
                          subline={<>Enter the 6-digit code sent to <span className="font-semibold text-neutral-900">{pendingEmail}</span>. Your current address keeps working until then.</>}
                          verifyPath="/api/auth/email/change-verify"
                          requestPath="/api/auth/email/change-request"
                          getVerifyBody={(code) => ({ new_email: pendingEmail, code })}
                          getRequestBody={() => ({ new_email: pendingEmail })}
                          onVerified={handleEmailVerified}
                          onBack={() => setPendingEmail(null)}
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className={labelCls}>Full name</label>
                        <input type="text" value={emailForm.name} onChange={(e) => setEmailForm((p) => ({ ...p, name: e.target.value }))} placeholder="Your name" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Phone</label>
                        <input type="tel" value={emailForm.phone} onChange={(e) => setEmailForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+92 300 1234567" className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Location</label>
                      <input type="text" value={emailForm.location} onChange={(e) => setEmailForm((p) => ({ ...p, location: e.target.value }))} placeholder="City, Country" className={inputCls} />
                    </div>
                    <button type="submit" disabled={emailSaving} className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 rounded-full transition-colors">
                      {emailSaving ? "Saving…" : "Save changes"}
                    </button>
                  </form>
                )}
                <Row
                  icon={FiGlobe}
                  title="Timezone"
                  desc="Interview times display in this timezone."
                  onClick={() => toggle("tz")}
                />
                {expanded === "tz" && (
                  <div className="pb-4">
                    <TimezoneSelector userId={userId} showCurrentTime={true} />
                  </div>
                )}
                <Row
                  icon={FiUser}
                  title="Profile"
                  desc="Edit your public candidate profile."
                  right={<span className="text-xs font-semibold text-blue-600">Open</span>}
                  onClick={() => (window.location.href = "/profile")}
                />
              </div>
            )}

            {active === "plan" && (
              <div className="divide-y divide-gray-100">
                <Row
                  icon={FiAward}
                  title="Current plan"
                  desc={`${isPaid ? "Pro — full access" : isTrial ? "Trial — limited features" : "Free — basic tools"} · ${status?.tokens_used?.toLocaleString() || "0"} tokens used${isTrial && trialEnd ? ` · expires ${trialEnd}` : ""}`}
                  right={
                    isPaid ? (
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">ACTIVE</span>
                    ) : (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">TRIAL</span>
                    )
                  }
                />
                <div className="py-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className={`border rounded-lg p-3 ${!isPaid ? "border-amber-400 bg-amber-50/40" : "border-gray-200"}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-gray-900">Trial</p>
                      {!isPaid && <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-px rounded">Current</span>}
                    </div>
                    <p className="text-lg font-bold text-gray-900 mt-1">Free</p>
                    <ul className="mt-2 space-y-1 text-xs text-gray-600">
                      <li className="flex gap-1.5"><FiCheckCircle className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-px" /> Profile management</li>
                      <li className="flex gap-1.5"><FiCheckCircle className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-px" /> Interview scheduling</li>
                      <li className="flex gap-1.5"><FiCheckCircle className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-px" /> Basic job tracking</li>
                      <li className="flex gap-1.5"><FiXCircle className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-px" /> Limited analytics</li>
                    </ul>
                  </div>
                  <div className={`border rounded-lg p-3 ${isPaid ? "border-green-500 bg-green-50/40" : "border-gray-200"}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-gray-900">Pro</p>
                      {isPaid
                        ? <span className="text-[10px] font-bold bg-green-600 text-white px-1.5 py-px rounded">Active</span>
                        : <span className="text-[10px] text-gray-400">Most popular</span>}
                    </div>
                    <p className="text-lg font-bold text-gray-900 mt-1">$9.99<span className="text-xs font-normal text-gray-500">/mo</span></p>
                    <ul className="mt-2 space-y-1 text-xs text-gray-600">
                      <li className="flex gap-1.5"><FiCheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0 mt-px" /> Everything in Trial</li>
                      <li className="flex gap-1.5"><FiCheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0 mt-px" /> Advanced analytics</li>
                      <li className="flex gap-1.5"><FiCheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0 mt-px" /> Resume builder & job alerts</li>
                      <li className="flex gap-1.5"><FiCheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0 mt-px" /> Coaching & unlimited interviews</li>
                    </ul>
                    {isPaid
                      ? <span className="inline-block mt-2.5 text-[11px] font-semibold bg-green-600 text-white px-2.5 py-1 rounded-full">Current plan</span>
                      : <button className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 rounded-full transition-colors">Upgrade <FiArrowRight className="w-3.5 h-3.5" /></button>}
                  </div>
                </div>
                <div className="py-3 flex items-center gap-1.5 text-xs text-gray-500">
                  <FiZap className="w-3.5 h-3.5 text-blue-500" />
                  Tokens used: <span className="font-semibold text-gray-700">{status?.tokens_used?.toLocaleString() || "0"}</span>
                </div>
              </div>
            )}

            {active === "billing" && (
              <div className="divide-y divide-gray-100">
                <div className="py-3">
                  <p className="text-[13px] font-semibold text-gray-900 mb-2">Payment methods</p>
                  <PaymentMethods storageKey="recruai_cards_individual" />
                </div>
                <div className="py-3">
                  <p className="text-[13px] font-semibold text-gray-900">Billing history</p>
                  <div className="mt-2 text-center py-5 border border-dashed border-gray-200 rounded-lg">
                    <FiClock className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                    <p className="text-xs text-gray-500">No invoices yet</p>
                  </div>
                </div>
              </div>
            )}

            {active === "notifications" && (
              <div className="divide-y divide-gray-100">
                {[
                  { title: "Email notifications", desc: "Account and interview updates", on: true, icon: FiMail },
                  { title: "Job alerts", desc: "New openings matching your profile", on: true, icon: FiBell },
                  { title: "Marketing emails", desc: "Tips and product updates", on: false, icon: FiGlobe },
                ].map((pref) => {
                  const Icon = pref.icon;
                  return (
                    <div key={pref.title} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex gap-2.5 min-w-0">
                        <div className="w-7 h-7 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 leading-tight">{pref.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{pref.desc}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" defaultChecked={pref.on} className="sr-only peer" />
                        <div className="w-9 h-5 rounded-full bg-gray-200 peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-all peer-checked:after:translate-x-4"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            )}

            {active === "preferences" && (
              <div className="divide-y divide-gray-100">
                <div className="py-3">
                  <p className="text-[13px] font-semibold text-gray-900">Timezone</p>
                  <p className="text-xs text-gray-500 mt-0.5 mb-2">Interview times display in this timezone.</p>
                  <TimezoneSelector userId={userId} showCurrentTime={true} />
                </div>
                <div className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 leading-tight">Data analytics</p>
                    <p className="text-xs text-gray-500 mt-0.5">Help improve the service with usage analytics</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 rounded-full bg-gray-200 peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-all peer-checked:after:translate-x-4"></div>
                  </label>
                </div>
              </div>
            )}

            {active === "security" && (
              <div className="divide-y divide-gray-100">
                <Row
                  icon={FiAlertTriangle}
                  title="Cancel subscription"
                  desc="End subscription, downgrade to trial plan."
                  right={<button className="px-3 py-1 bg-white border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-full transition-colors">Cancel</button>}
                />
                <div className="py-3">
                  <div className="flex items-center gap-3 p-3 border border-red-200 bg-red-50/60 rounded-lg">
                    <div className="w-7 h-7 bg-white border border-red-200 rounded-md flex items-center justify-center shrink-0">
                      <FiTrash2 className="w-3.5 h-3.5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 leading-tight">Delete account</p>
                      <p className="text-xs text-gray-500 mt-0.5">Permanently delete your account and all data</p>
                    </div>
                    <button className="px-3 py-1 bg-red-600 text-white text-xs font-semibold hover:bg-red-700 rounded-full shrink-0 transition-colors">Delete</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

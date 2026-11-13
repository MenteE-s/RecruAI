import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell, CenterBar } from "../../components/layout/AppShell";
import { RailSection } from "../../components/layout/RightRail";
import { getBackendUrl, getAuthHeaders, getCurrentUser, clearLocalAuth } from "../../utils/auth";
import TimezoneSelector from "../../components/ui/TimezoneSelector";
import PaymentMethods from "../../components/ui/PaymentMethods";
import { BILLING_BETA_MESSAGE, BILLING_ENABLED } from "../../utils/billing";
import OtpVerify from "../../components/auth/OtpVerify";
import { useToast } from "../../components/ui/ToastContext";
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
  FiTrash2,
  FiZap,
  FiArrowRight,
  FiBriefcase,
  FiUsers,
  FiLink,
  FiDownload,
} from "react-icons/fi";

const SECTIONS = [
  { id: "account", label: "Account", icon: FiUser },
  { id: "page", label: "Company Page", icon: FiBriefcase },
  { id: "plan", label: "Subscription", icon: FiAward },
  { id: "billing", label: "Billing", icon: FiCreditCard },
  { id: "notifications", label: "Notifications", icon: FiBell },
  { id: "preferences", label: "Preferences", icon: FiSliders },
  { id: "security", label: "Security", icon: FiShield },
];

function Row({ icon: Icon, title, desc, right, onClick, ariaLabel }) {
  const Inner = (
    <>
      <div className="flex gap-2.5 min-w-0 flex-1">
        {Icon && (
          <div className="h-7 w-7 rounded-lg border border-line bg-gray-50 dark:bg-gray-25 flex items-center justify-center shrink-0">
            <Icon className="h-3.5 w-3.5 text-gray-500" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-ink leading-tight">{title}</p>
          {desc && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {right}
        {onClick && <FiChevronRight className="h-4 w-4 text-gray-300" />}
      </div>
    </>
  );
  const cls = "w-full flex items-center justify-between gap-3 py-3 text-left";
  return onClick ? (
    <button onClick={onClick} aria-label={ariaLabel} className={`${cls} hover:bg-gray-50 -mx-2 px-2 rounded-md transition-colors`}>
      {Inner}
    </button>
  ) : (
    <div className={cls}>{Inner}</div>
  );
}

// Public profile handle: /in/<slug>. Generated automatically at signup and
// changeable here. Mirrors the reserved-word rule in backend/utils/slug.py so
// the field can explain the problem before a round-trip.
function ProfileSlugRow({ slug, onSaved }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(slug || "");
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setValue(slug || ""); }, [slug]);

  async function save() {
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/auth/me/profile-slug`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ slug: value.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ type: "error", text: data.error || "Could not update." });
        return;
      }
      onSaved?.(data.slug);
      setValue(data.slug);
      setMsg({ type: "success", text: "Saved. Your old link still works via redirect." });
    } catch {
      setMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function reroll() {
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/auth/me/profile-slug/random`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ type: "error", text: data.error || "Could not generate." });
        return;
      }
      onSaved?.(data.slug);
      setValue(data.slug);
      setMsg({ type: "success", text: "New name generated." });
    } catch {
      setMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Row
        icon={FiLink}
        title="Public profile link"
        desc={slug ? `${window.location.origin}/in/${slug}` : "Your public profile address."}
        onClick={() => setOpen((o) => !o)}
      />
      {open && (
        <div className="pb-4 space-y-2.5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Your profile name
            </label>
            <div className="flex items-stretch gap-2">
              <span className="inline-flex items-center rounded-lg border border-line bg-gray-50 px-2.5 text-[12px] text-gray-500 shrink-0 dark:bg-gray-25">
                recruai.menteeai.org/in/
              </span>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                maxLength={30}
                placeholder="yourname"
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-gray-100/50 dark:focus:ring-gray-600/50"
              />
            </div>
            <p className="mt-1 text-[10.5px] text-gray-500">
              Lowercase letters, numbers and hyphens. 3–30 characters. Some names
              are reserved because they clash with app pages.
            </p>
          </div>

          {msg && (
            <p className={`text-[11.5px] font-medium ${msg.type === "success" ? "text-green-700" : "text-red-700"}`}>
              {msg.text}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving || value.trim().toLowerCase() === (slug || "")}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-gray-900 px-4 text-xs font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={reroll}
              disabled={saving}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-line bg-surface px-4 text-xs font-semibold text-ink transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Generate random
            </button>
            {slug && (
              <a
                href={`/in/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11.5px] font-semibold text-ink hover:text-brand-text"
              >
                View profile
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function Settings() {

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
        setDiscoverable(user?.is_discoverable !== false);
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

  // Company pages are created at /page/create, after signup — there is no
  // company registration. The founder stays an `individual` account and
  // administers the page through its team members.
  const [myPages, setMyPages] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Global-search opt-out. Distinct from email verification: you can stay
  // findable by name while your address is still unverified.
  const [discoverable, setDiscoverable] = useState(true);
  const [savingDiscoverable, setSavingDiscoverable] = useState(false);

  // Privacy controls. Export and deletion both require the current password:
  // a stolen access token alone must not be enough to take a copy of the
  // account or destroy it.
  const [exportOpen, setExportOpen] = useState(false);
  const [exportPassword, setExportPassword] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState(null);
  const [deletionInfo, setDeletionInfo] = useState(null);

  const toggleDiscoverable = async () => {
    const next = !discoverable;
    setDiscoverable(next); // optimistic
    setSavingDiscoverable(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/auth/me`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ is_discoverable: next }),
      });
      if (!res.ok) throw new Error();
      showToast({
        message: next ? "You're findable in search again" : "You've been hidden from search",
        type: "success",
        position: "side",
        duration: 2400,
      });
    } catch {
      setDiscoverable(!next); // revert
      showToast({ message: "Could not update. Please try again.", type: "error", position: "side", duration: 3000 });
    } finally {
      setSavingDiscoverable(false);
    }
  };

  useEffect(() => {
    if (active !== "security" || !userId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/users/me/deletion`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && data.scheduled) setDeletionInfo(data);
      } catch {
        // The status endpoint is advisory; the form still works if it fails.
      }
    })();
    return () => { cancelled = true; };
  }, [active, userId]);

  const handleExport = async (e) => {
    e.preventDefault();
    setExportMsg(null);
    setExporting(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/users/me/export`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ password: exportPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setExportMsg({
          type: "error",
          text: data.error || "Could not export your data. Check your password and try again.",
        });
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
      const filename = filenameMatch?.[1] || `recruai-account-${userId || "data"}.json`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Give the browser a moment to start the download before revoking it.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportPassword("");
      setExportMsg({ type: "success", text: "Your data download has started." });
    } catch {
      setExportMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setDeleteMsg(null);
    if (deleteConfirm.trim().toUpperCase() !== "DELETE") {
      setDeleteMsg({ type: "error", text: "Type DELETE to confirm." });
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/users/me`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ password: deletePassword, reason: deleteReason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const orgNames = Array.isArray(data.organizations)
          ? ` (${data.organizations.map((o) => o.name).join(", ")})`
          : "";
        setDeleteMsg({
          type: "error",
          text: `${data.error || "Could not schedule deletion."}${orgNames}`,
        });
        return;
      }
      setDeletionInfo(data);
      setDeleteOpen(false);
      setDeletePassword("");
      setDeleteReason("");
      setDeleteConfirm("");
      const when = data.scheduled_for
        ? new Date(data.scheduled_for).toLocaleDateString()
        : "in 30 days";
      setDeleteMsg({
        type: "success",
        text: `Your account is scheduled for deletion on ${when}. You have been signed out. Contact support if you need to reverse this.`,
      });
      // The server revoked every session. Clear local state and leave the
      // authenticated area rather than letting the next request 401.
      setTimeout(() => {
        clearLocalAuth();
        navigate("/login?account_deletion_scheduled=1", { replace: true });
      }, 2500);
    } catch {
      setDeleteMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setDeleting(false);
    }
  };

  const loadPages = async () => {
    setPagesLoading(true);
    setPageError(null);
    try {
      const res = await fetch(`${getBackendUrl()}/api/organizations/mine`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ([]));
      if (!res.ok) {
        setPageError(data?.error || "Could not load your company pages.");
        return;
      }
      setMyPages(Array.isArray(data) ? data : []);
    } catch {
      setPageError("Network error. Please try again.");
    } finally {
      setPagesLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  // Coming back from the create-page redirect — refetch so the new page shows.
  useEffect(() => {
    if (active !== "page") return;
    loadPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

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
  const trialEnd = status?.trial_end_date
    ? new Date(status.trial_end_date).toLocaleDateString()
    : null;

  const inputCls = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-gray-500 outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-gray-100/50 dark:focus:ring-gray-600/50";
  const labelCls = "mb-1.5 block text-xs font-medium text-gray-600";

  return (
    <AppShell rail={<RailSection />}>
      <CenterBar title="Settings" />

      <div className="px-4 pb-1 pt-3">
        <p className="text-[11px] text-gray-500">Manage your account, plan, and preferences.</p>
      </div>

      <div className="px-4 py-4 lg:grid lg:grid-cols-12 lg:gap-3">
        {/* Desktop section nav */}
        <nav className="hidden h-fit lg:col-span-4 lg:sticky lg:top-16 lg:block xl:col-span-3">
          <div className="rounded-xl border border-line bg-surface p-1.5">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = active === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(s.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                    isActive ? "bg-gray-50 font-semibold text-ink" : "text-gray-600 hover:bg-gray-50 hover:text-ink"
                  }`}>
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-ink" : "text-gray-500"}`} strokeWidth={isActive ? 2 : 1.6} />
                  {s.label}
                  {s.id === "plan" && (
                    <span className={`ml-auto shrink-0 whitespace-nowrap rounded px-1.5 py-px text-[10px] font-bold ${isPaid ? "bg-brand/10 text-brand-text" : "bg-gray-100 text-gray-600"}`}>
                      {isPaid ? "PRO" : isTrial ? "TRIAL" : "FREE"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile section chips */}
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
          {SECTIONS.map((s) => {
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                  isActive ? "border-gray-900 bg-gray-900 text-white dark:border-gray-50 dark:bg-gray-50 dark:text-ink" : "border-line bg-surface text-ink hover:bg-gray-50"
                }`}>
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Right content panel */}
        <div className="h-fit rounded-xl border border-line bg-surface px-4 py-1.5 lg:col-span-8 xl:col-span-9">
            {active === "account" && (
              <div className="divide-y divide-line">
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
                      <div className="rounded-xl border border-line bg-gray-50 p-3 dark:bg-gray-25">
                        <OtpVerify
                          email={userData?.email}
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
                    <button type="submit" disabled={emailSaving} className="px-3.5 py-1.5 inline-flex h-9 items-center justify-center rounded-xl bg-gray-900 px-4 text-xs font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50">
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
                    <TimezoneSelector userId={userId} value={userData?.timezone} showCurrentTime={true} />
                  </div>
                )}
                <Row
                  icon={FiUser}
                  title="Profile"
                  desc="Edit your public candidate profile."
                  right={<span className="text-xs font-semibold text-ink">Open</span>}
                  onClick={() => (window.location.href = "/in/profile")}
                />
                <ProfileSlugRow
                  slug={userData?.profile_slug}
                  onSaved={(s) => {
                    setUserData((p) => ({ ...p, profile_slug: s }));
                    showToast({ message: `Your profile is now /in/${s}`, type: "success", position: "side", duration: 2600 });
                  }}
                />
              </div>
            )}

            {active === "page" && (
              <div className="divide-y divide-line">
                <div className="py-3">
                  <p className="text-[13px] font-semibold text-ink">Company pages</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Your account is personal. A company page is a separate presence on
                    RecruAI for your business — you administer it as the first Admin, and
                    your personal profile stays untouched.
                  </p>

                  {myPages.length > 0 && (
                    <button
                      onClick={() => navigate("/page")}
                      className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
                    >
                      <FiBriefcase className="h-3.5 w-3.5" /> Manage your page
                    </button>
                  )}

                  {pageError && (
                    <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-700">
                      {pageError}
                    </div>
                  )}

                  {pagesLoading ? (
                    <div className="mt-3 text-xs text-gray-500">Loading your pages…</div>
                  ) : myPages.length > 0 ? (
                    <ul className="mt-3 space-y-1.5">
                      {myPages.map((p) => (
                        <li key={p.id}>
                          <button
                            onClick={() => navigate("/page")}
                            className="w-full flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                          >
                            <div className="h-8 w-8 shrink-0 rounded-md bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white text-[11px] font-bold uppercase">
                              {p.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-semibold text-ink truncate">
                                {p.name}
                              </p>
                              {(p.industry || p.location) && (
                                <p className="text-xs text-gray-500 truncate">
                                  {[p.industry, p.location].filter(Boolean).join(" · ")}
                                </p>
                              )}
                            </div>
                            {p.is_primary && (
                              <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded shrink-0">
                                PRIMARY
                              </span>
                            )}
                            <FiChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-3 rounded-lg border border-dashed border-line px-3.5 py-5 text-center">
                      <FiBriefcase className="h-6 w-6 mx-auto text-gray-300" />
                      <p className="mt-2 text-[13px] font-semibold text-ink">
                        No company page yet
                      </p>
                      <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                        Create one to post jobs, hire candidates and invite teammates.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => navigate("/page/create")}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
                  >
                    <FiBriefcase className="h-3.5 w-3.5" />
                    {myPages.length > 0 ? "Create another page" : "Create a company page"}
                  </button>
                </div>

                {myPages.length > 0 && (
                  <div className="py-3">
                    <p className="text-[13px] font-semibold text-ink mb-1.5">
                      Admin tools
                    </p>
                    <div className="space-y-1">
                      <Row
                        icon={FiBriefcase}
                        title="Post jobs"
                        desc="Create and manage job posts on your page."
                        right={<span className="text-xs font-semibold text-ink">Open</span>}
                        ariaLabel="Open Post jobs"
                        onClick={() => navigate("/page/posts")}
                      />
                      <Row
                        icon={FiUsers}
                        title="Team members"
                        desc="Invite colleagues and manage their access."
                        right={<span className="text-xs font-semibold text-ink">Open</span>}
                        ariaLabel="Open Team members"
                        onClick={() => navigate("/page/team")}
                      />
                      <Row
                        icon={FiSliders}
                        title="Visibility"
                        desc="Decide who can find this page and apply."
                        right={<span className="text-xs font-semibold text-ink">Open</span>}
                        ariaLabel="Open Visibility"
                        onClick={() => navigate("/page/visibility")}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {active === "plan" && (
              <div className="divide-y divide-line">
                <Row
                  icon={FiAward}
                  title="Current plan"
                  desc={`${isPaid ? "Pro — full access" : isTrial ? "Trial — full access" : "Free — basic tools"} · ${status?.tokens_used?.toLocaleString() || "0"} tokens used${isTrial && trialEnd ? ` · expires ${trialEnd}` : ""}`}
                  right={
                    isPaid ? (
                      <span className="text-[10px] font-bold bg-brand/10 text-brand-text px-1.5 py-0.5 rounded">ACTIVE</span>
                    ) : isTrial ? (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">TRIAL</span>
                    ) : (
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">FREE</span>
                    )
                  }
                />
                <div className="py-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className={`border rounded-lg p-3 ${!isPaid ? "border-amber-400 bg-amber-50/40" : "border-line"}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-ink">Trial</p>
                      {!isPaid && <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-px rounded">Current</span>}
                    </div>
                    <p className="text-lg font-bold text-ink mt-1">Free</p>
                    <ul className="mt-2 space-y-1 text-xs text-gray-600">
                      <li className="flex gap-1.5"><FiCheckCircle className="h-3.5 w-3.5 text-gray-500 shrink-0 mt-px" /> Profile management</li>
                      <li className="flex gap-1.5"><FiCheckCircle className="h-3.5 w-3.5 text-gray-500 shrink-0 mt-px" /> Interview scheduling</li>
                      <li className="flex gap-1.5"><FiCheckCircle className="h-3.5 w-3.5 text-gray-500 shrink-0 mt-px" /> Basic job tracking</li>
                      <li className="flex gap-1.5"><FiXCircle className="h-3.5 w-3.5 text-gray-300 shrink-0 mt-px" /> Limited analytics</li>
                    </ul>
                  </div>
                  <div className={`border rounded-lg p-3 ${isPaid ? "border-green-500 bg-green-50/40" : "border-line"}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-ink">Pro</p>
                      {isPaid
                        ? <span className="text-[10px] font-bold bg-green-600 text-white px-1.5 py-px rounded">Active</span>
                        : <span className="text-[10px] text-gray-500">Most popular</span>}
                    </div>
                    <p className="text-lg font-bold text-ink mt-1">
                      {BILLING_ENABLED ? <>$9.99<span className="text-xs font-normal text-gray-500">/mo</span></> : "Included during beta"}
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-gray-600">
                      <li className="flex gap-1.5"><FiCheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0 mt-px" /> Everything in Trial</li>
                      <li className="flex gap-1.5"><FiCheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0 mt-px" /> Advanced analytics</li>
                      <li className="flex gap-1.5"><FiCheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0 mt-px" /> Resume builder & job alerts</li>
                      <li className="flex gap-1.5"><FiCheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0 mt-px" /> Coaching & unlimited interviews</li>
                    </ul>
                    {isPaid ? (
                      <span className="inline-block mt-2.5 text-[11px] font-semibold bg-green-600 text-white px-2.5 py-1 rounded-full">Current plan</span>
                    ) : BILLING_ENABLED ? (
                      <button className="mt-2.5 inline-flex items-center gap-1 rounded-xl bg-brand-action px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand/90">Upgrade <FiArrowRight className="h-3.5 w-3.5" /></button>
                    ) : (
                      <span className="inline-block mt-2.5 text-[11px] text-gray-500">Paid upgrades are closed during the beta.</span>
                    )}
                  </div>
                </div>
                <div className="py-3 flex items-center gap-1.5 text-xs text-gray-500">
                  <FiZap className="h-3.5 w-3.5 text-brand-text" />
                  Tokens used: <span className="font-mono tabular-nums font-semibold text-gray-700">{status?.tokens_used?.toLocaleString() || "0"}</span>
                </div>
              </div>
            )}

            {active === "billing" && (
              <div className="divide-y divide-line">
                <div className="py-3">
                  <p className="text-[13px] font-semibold text-ink mb-2">Payment methods</p>
                  {BILLING_ENABLED ? (
                    <PaymentMethods storageKey="recruai_cards_individual" />
                  ) : (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">
                      {BILLING_BETA_MESSAGE}
                    </p>
                  )}
                </div>
                <div className="py-3">
                  <p className="text-[13px] font-semibold text-ink">Billing history</p>
                  <div className="mt-2 text-center py-5 border border-dashed border-line rounded-xl">
                    <FiClock className="h-6 w-6 text-gray-300 mx-auto mb-1.5" />
                    <p className="text-xs text-gray-500">
                      {BILLING_ENABLED ? "No invoices yet" : "Billing is not active during the beta"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {active === "notifications" && (
              <div>
                <p className="mb-2 text-xs leading-5 text-gray-500">
                  Preview-only — these preferences are not saved yet.
                </p>
                <div className="divide-y divide-line">
                {[
                  { title: "Email notifications", desc: "Account and interview updates", on: true, icon: FiMail },
                  { title: "Job alerts", desc: "New openings matching your profile", on: true, icon: FiBell },
                  { title: "Marketing emails", desc: "Tips and product updates", on: false, icon: FiGlobe },
                ].map((pref) => {
                  const Icon = pref.icon;
                  return (
                    <div key={pref.title} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-lg border border-line bg-gray-50 dark:bg-gray-25 flex items-center justify-center shrink-0">
                          <Icon className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-ink leading-tight">{pref.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{pref.desc}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" defaultChecked={pref.on} className="sr-only peer" />
                        <div className="peer h-5 w-9 rounded-full bg-gray-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-brand peer-checked:after:translate-x-4 dark:bg-gray-25"></div>
                      </label>
                    </div>
                  );
                })}
                </div>
              </div>
            )}

            {active === "preferences" && (
              <div className="divide-y divide-line">
                <div className="py-3">
                  <p className="text-[13px] font-semibold text-ink">Timezone</p>
                  <p className="text-xs text-gray-500 mt-0.5 mb-2">Interview times display in this timezone.</p>
                  <TimezoneSelector userId={userId} value={userData?.timezone} showCurrentTime={true} />
                </div>
                <div className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink leading-tight">Data analytics</p>
                    <p className="text-xs text-gray-500 mt-0.5">Help improve the service with usage analytics · preview-only, not saved</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="peer h-5 w-9 rounded-full bg-gray-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-brand peer-checked:after:translate-x-4 dark:bg-gray-25"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between gap-3 py-3 border-t border-line">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink leading-tight">Findable in search</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      Lets other people find you by name, headline or company in global search.
                      Turning this off hides you from results but keeps your profile link working.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={discoverable}
                    onClick={toggleDiscoverable}
                    disabled={savingDiscoverable}
                    className={`relative inline-flex items-center h-5 w-9 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
                      discoverable ? "bg-brand" : "bg-gray-200 dark:bg-gray-25"
                    }`}>
                    <span
                      className={`absolute h-4 w-4 rounded-full bg-white shadow transition-all ${
                        discoverable ? "left-[18px]" : "left-[2px]"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {active === "security" && (
              <div className="divide-y divide-line">
                <div className="py-3">
                  <p className="text-[13px] font-semibold text-ink">Your data</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Download a JSON copy of your profile, applications, interviews,
                    messages and account history. This is the same export we provide
                    for a data-access request.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setExportOpen((o) => !o); setExportMsg(null); }}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 inline-flex h-9 items-center justify-center rounded-xl border border-line bg-surface px-4 text-xs font-semibold text-ink transition-colors hover:bg-gray-50"
                  >
                    <FiDownload className="h-3.5 w-3.5" />
                    Export my data
                  </button>

                  {exportOpen && (
                    <form onSubmit={handleExport} className="mt-3 rounded-xl border border-line bg-gray-50 p-3 dark:bg-gray-25 space-y-2.5">
                      <div>
                        <label className={labelCls}>Confirm your password</label>
                        <input
                          type="password"
                          autoComplete="current-password"
                          required
                          value={exportPassword}
                          onChange={(e) => setExportPassword(e.target.value)}
                          placeholder="Current password"
                          className={inputCls}
                        />
                      </div>
                      {exportMsg && (
                        <p className={`text-[11.5px] font-medium ${exportMsg.type === "success" ? "text-green-700" : "text-red-700"}`}>
                          {exportMsg.text}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={exporting || !exportPassword}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 inline-flex h-9 items-center justify-center rounded-xl bg-gray-900 px-4 text-xs font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                        >
                          <FiDownload className="h-3.5 w-3.5" />
                          {exporting ? "Preparing…" : "Download JSON"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setExportOpen(false); setExportPassword(""); setExportMsg(null); }}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-[10.5px] text-gray-500">
                        Password hashes, session tokens and one-time codes are never included.
                      </p>
                    </form>
                  )}
                </div>

                <div className="py-3">
                  <div className="flex items-center gap-3 p-3 border border-red-200 bg-red-50/60 rounded-lg">
                    <div className="h-7 w-7 bg-surface border border-red-200 rounded-lg flex items-center justify-center shrink-0">
                      <FiTrash2 className="h-3.5 w-3.5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-ink leading-tight">Delete account</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Schedule permanent deletion after a 30-day grace period.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setDeleteOpen((o) => !o); setDeleteMsg(null); }}
                      className="px-3 py-1 bg-red-600 text-white text-xs font-semibold hover:bg-red-700 rounded-full shrink-0 transition-colors"
                    >
                      {deleteOpen ? "Close" : "Delete account"}
                    </button>
                  </div>

                  {deletionInfo?.scheduled && (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                      <p className="font-semibold">Deletion already scheduled</p>
                      <p className="mt-0.5">
                        The account and its data will be permanently removed on{" "}
                        {deletionInfo.scheduled_for
                          ? new Date(deletionInfo.scheduled_for).toLocaleDateString()
                          : "the scheduled date"}.
                      </p>
                    </div>
                  )}

                  {deleteOpen && (
                    <form onSubmit={handleDelete} className="mt-3 rounded-lg border border-red-200 bg-surface p-3 space-y-2.5">
                      <div className="rounded-md bg-red-50 border border-red-100 px-3 py-2">
                        <p className="text-[12px] font-semibold text-red-800">This cannot be undone after 30 days</p>
                        <p className="mt-1 text-[11.5px] leading-relaxed text-red-700">
                          Your profile, applications, interviews, messages, AI history and
                          uploaded files will be permanently deleted. Company pages are not
                          deleted, but you must transfer another admin first if you are the
                          last one. You can contact support during the grace period to
                          reverse this.
                        </p>
                      </div>
                      <div>
                        <label className={labelCls}>Confirm your password</label>
                        <input
                          type="password"
                          autoComplete="current-password"
                          required
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Current password"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Reason (optional)</label>
                        <input
                          type="text"
                          maxLength={255}
                          value={deleteReason}
                          onChange={(e) => setDeleteReason(e.target.value)}
                          placeholder="Help us understand why you're leaving"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Type DELETE to confirm</label>
                        <input
                          type="text"
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          placeholder="DELETE"
                          className={inputCls}
                        />
                      </div>
                      {deleteMsg && (
                        <p className={`text-[11.5px] font-medium ${deleteMsg.type === "success" ? "text-green-700" : "text-red-700"}`}>
                          {deleteMsg.text}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={deleting || !deletePassword || deleteConfirm.trim().toUpperCase() !== "DELETE"}
                          className="px-3.5 py-1.5 bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 rounded-full transition-colors"
                        >
                          {deleting ? "Scheduling…" : "Schedule deletion"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteOpen(false);
                            setDeletePassword("");
                            setDeleteReason("");
                            setDeleteConfirm("");
                            setDeleteMsg(null);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800"
                        >
                          Keep my account
                        </button>
                      </div>
                    </form>
                  )}

                  {deleteMsg && !deleteOpen && (
                    <p className={`mt-3 text-[11.5px] font-medium ${deleteMsg.type === "success" ? "text-green-700" : "text-red-700"}`}>
                      {deleteMsg.text}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
    </AppShell>
  );
}

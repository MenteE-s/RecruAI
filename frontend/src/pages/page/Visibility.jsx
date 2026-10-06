// Page manager -> Visibility.
//
// Who outside the page's admins can see and apply. Each toggle maps to a real
// server-side effect (directory listing, autocomplete, public page access), so
// the copy here states the consequence rather than just the label.
import { useEffect, useState } from "react";
import PageManagerLayout from "../../components/page/PageManagerLayout";
import { getCurrentUser, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import { FiGlobe, FiUsers, FiFileText, FiInfo, FiAlertTriangle } from "react-icons/fi";

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center w-10 h-[22px] rounded-full transition-colors shrink-0 disabled:opacity-50 ${
        checked ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${
          checked ? "left-[21px]" : "left-[2px]"
        }`}
      />
    </button>
  );
}

const SETTINGS = [
  {
    key: "is_public",
    icon: FiGlobe,
    title: "Public page",
    desc: "Anyone signed in can find this page by name, in the company directory and in search. When off, the page is hidden from everyone except your admins — direct links return 'not found'.",
  },
  {
    key: "accepting_applications",
    icon: FiFileText,
    title: "Accepting applications",
    desc: "Your open roles show an apply path. Turn this off to keep your listings visible while you pause hiring.",
  },
  {
    key: "show_public_stats",
    icon: FiUsers,
    title: "Show public stats",
    desc: "Display follower counts and page view numbers on your public page.",
  },
];

export default function PageVisibility() {
  const { showToast } = useToast();
  const [orgId, setOrgId] = useState(null);
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user?.organization_id) { setError("You don't have a company page yet."); return; }
        const res = await fetch(`${getBackendUrl()}/api/organizations/${user.organization_id}`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Could not load your page");
        const data = await res.json();
        if (cancelled) return;
        setOrgId(data.id);
        setState({
          is_public: Boolean(data.is_public),
          accepting_applications: Boolean(data.accepting_applications),
          show_public_stats: Boolean(data.show_public_stats),
        });
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load your page.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function toggle(key, value) {
    const previous = state[key];
    // Optimistic: revert if the server disagrees.
    setState((s) => ({ ...s, [key]: value }));
    setSavingKey(key);
    setError(null);
    try {
      const res = await fetch(`${getBackendUrl()}/api/organizations/${orgId}/visibility`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setState((s) => ({ ...s, [key]: previous }));
        setError(b.error || "Could not update visibility.");
        return;
      }
      showToast({
        message: "Visibility updated",
        type: "success",
        position: "side",
        duration: 2000,
      });
    } catch {
      setState((s) => ({ ...s, [key]: previous }));
      setError("Network error. Please try again.");
    } finally {
      setSavingKey(null);
    }
  }

  if (error && !state) {
    return (
      <PageManagerLayout title="Visibility">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
          <p className="text-[12.5px] text-gray-600">{error}</p>
        </div>
      </PageManagerLayout>
    );
  }

  if (!state) {
    return (
      <PageManagerLayout title="Visibility">
        <div className="py-8 text-center text-xs text-gray-500">Loading…</div>
      </PageManagerLayout>
    );
  }

  return (
    <PageManagerLayout
      title="Visibility"
      subtitle="Control who can find this page and apply to your roles."
    >
      <div className="space-y-4">
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <ul className="divide-y divide-gray-100">
            {SETTINGS.map((item) => (
              <li key={item.key} className="flex items-start gap-3.5 px-4 py-3.5">
                <div className="w-8 h-8 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-gray-900">{item.title}</p>
                  <p className="text-[11.5px] text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
                <Toggle
                  checked={state[item.key]}
                  onChange={(v) => toggle(item.key, v)}
                  disabled={savingKey === item.key}
                />
              </li>
            ))}
          </ul>
        </section>

        {!state.is_public && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-3 text-[11.5px] leading-relaxed text-amber-900">
            <FiAlertTriangle className="w-4 h-4 mt-px shrink-0 text-amber-600" />
            <span>
              This page is <strong>private</strong>. Your admins can still work normally, but
              candidates can't discover it and your open jobs won't be listed publicly.
            </span>
          </div>
        )}

        {state.is_public && !state.accepting_applications && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-3 text-[11.5px] leading-relaxed text-amber-900">
            <FiAlertTriangle className="w-4 h-4 mt-px shrink-0 text-amber-600" />
            <span>
              Your page is public but you're <strong>not accepting applications</strong>.
              Existing listings stay visible without an apply button.
            </span>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3.5 py-3 text-[11.5px] leading-relaxed text-gray-600">
          <FiInfo className="w-3.5 h-3.5 mt-px shrink-0" />
          <span>
            These settings affect everyone outside your page's team. Admins and invited
            teammates always keep full access.
          </span>
        </div>
      </div>
    </PageManagerLayout>
  );
}
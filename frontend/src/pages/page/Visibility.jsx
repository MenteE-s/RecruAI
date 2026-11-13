// Page manager -> Visibility.
//
// Who outside the page's admins can see and apply. Each toggle maps to a real
// server-side effect (directory listing, autocomplete, public page access), so
// the copy here states the consequence rather than just the label.
import { useEffect, useState } from "react";
import PageManagerLayout from "../../components/page/PageManagerLayout";
import { getCurrentUser, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import { Globe, Users, FileText, Info, AlertTriangle } from "lucide-react";

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50 ${
        checked ? "bg-brand" : "bg-gray-200 dark:bg-gray-25"
      }`}>
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-s5 transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

const SETTINGS = [
  {
    key: "is_public",
    icon: Globe,
    title: "Public page",
    desc: "Anyone signed in can find this page by name, in the company directory and in search. When off, the page is hidden from everyone except your admins — direct links return 'not found'.",
  },
  {
    key: "accepting_applications",
    icon: FileText,
    title: "Accepting applications",
    desc: "Your open roles show an apply path. Turn this off to keep your listings visible while you pause hiring.",
  },
  {
    key: "show_public_stats",
    icon: Users,
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
        <div className="bg-surface border border-line rounded-xl p-6 text-center max-w-sm mx-auto shadow-s5">
          <p className="text-[12.5px] text-gray-600 dark:text-gray-500">{error}</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main controls column */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <section className="bg-surface border border-line rounded-xl shadow-s5 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-line">
              <h2 className="text-[13.5px] font-semibold text-ink">Visibility &amp; discovery</h2>
              <p className="text-[11.5px] text-gray-500 mt-0.5">Control how your company profile and roles appear to candidates.</p>
            </div>
            <ul className="divide-y divide-line">
              {SETTINGS.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <li key={item.key} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-25/50 transition-colors">
                    <div className="h-9 w-9 rounded-xl bg-gray-50 border border-line flex items-center justify-center shrink-0 dark:bg-gray-25 shadow-s5">
                      <ItemIcon className="h-4 w-4 text-gray-500" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-ink">{item.title}</p>
                      <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                    <Toggle
                      checked={state[item.key]}
                      onChange={(v) => toggle(item.key, v)}
                      disabled={savingKey === item.key}
                      label={item.title}
                    />
                  </li>
                );
              })}
            </ul>
          </section>

          {!state.is_public && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-[12px] leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 shadow-s5">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
              <span>
                This page is <strong>private</strong>. Your admins can still work normally, but
                candidates cannot discover it and your open jobs will not be listed publicly.
              </span>
            </div>
          )}

          {state.is_public && !state.accepting_applications && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-[12px] leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 shadow-s5">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
              <span>
                Your page is public but you are <strong>not accepting applications</strong>.
                Existing listings stay visible without an apply button.
              </span>
            </div>
          )}
        </div>

        {/* Side summary column */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <section className="bg-surface border border-line rounded-xl shadow-s5 p-4 space-y-3.5">
            <h2 className="text-[13px] font-semibold text-ink">
              Current visibility status
            </h2>
            <div className="space-y-2.5 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Directory listing:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                  state.is_public
                    ? "bg-brand/10 text-brand-text"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-25 dark:text-gray-500"
                }`}>
                  {state.is_public ? "Public" : "Hidden"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Candidate applications:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                  state.accepting_applications
                    ? "bg-brand/10 text-brand-text"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                }`}>
                  {state.accepting_applications ? "Open" : "Paused"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Public statistics:</span>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-25 dark:text-gray-500">
                  {state.show_public_stats ? "Shown" : "Hidden"}
                </span>
              </div>
            </div>
          </section>

          <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 border border-line px-4 py-3.5 text-[12px] leading-relaxed text-gray-600 dark:bg-gray-25 dark:text-gray-500 shadow-s5">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" strokeWidth={1.75} />
            <span>
              These settings affect everyone outside your page's team. Admins and invited
              teammates always keep full back-office access.
            </span>
          </div>
        </div>
      </div>
    </PageManagerLayout>
  );
}

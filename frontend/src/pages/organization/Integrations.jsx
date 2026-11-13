import { useState } from "react";
import { OrgAppShell } from "../../components/layout/OrgAppShell";
import {
  Share2,
  Plus,
  Settings,
  CheckCircle,
  X,
  Shield,
  Search,
} from "lucide-react";

const DEFAULT_INTEGRATIONS = [
  {
    id: "greenhouse",
    name: "Greenhouse",
    category: "ATS",
    description: "Automatically sync candidate profiles, job postings, and interview scorecards bidirectionally.",
    connected: true,
    installedAt: "2 weeks ago",
    badge: "Enterprise",
  },
  {
    id: "lever",
    name: "Lever",
    category: "ATS",
    description: "Export RecruAI AI-scored interview transcripts and candidate feedback into your Lever hiring pipeline.",
    connected: false,
    badge: "Popular",
  },
  {
    id: "slack",
    name: "Slack",
    category: "Communication",
    description: "Receive instant notifications for high-matching candidate applications, interview completions, and stage transitions.",
    connected: true,
    installedAt: "1 month ago",
    badge: "Official",
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    category: "Calendar",
    description: "Sync interview availability and automate one-click candidate scheduling across hiring managers' calendars.",
    connected: true,
    installedAt: "3 weeks ago",
    badge: "Core",
  },
  {
    id: "workday",
    name: "Workday HCM",
    category: "HRIS",
    description: "Sync hired candidates and onboarding profiles directly to Workday Human Capital Management.",
    connected: false,
    badge: "Enterprise",
  },
  {
    id: "ashby",
    name: "Ashby",
    category: "ATS",
    description: "Modern ATS integration with full webhook support for pipeline sync and automated interview triggers.",
    connected: false,
    badge: "Fast-growing",
  },
];

export default function Integrations() {
  const [integrations, setIntegrations] = useState(DEFAULT_INTEGRATIONS);
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalItem, setModalItem] = useState(null);

  const toggleConnect = (id) => {
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, connected: !item.connected } : item
      )
    );
  };

  const filtered = integrations.filter((item) => {
    const matchesCat = filterCategory === "all" || item.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <OrgAppShell>
      <div className="space-y-4 px-4 pb-6 pt-4">
        {/* Header */}
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between shadow-s5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand-text shadow-s5">
                <Share2 className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-ink">Integrations &amp; connected apps</h1>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Connect your ATS, HRIS, calendars, and team messaging to streamline recruiter workflows.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-text">
              <CheckCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span className="font-mono tabular-nums">{integrations.filter((i) => i.connected).length}</span> active connections
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-line bg-gray-50 dark:bg-gray-25 p-1 shadow-s5">
            {["all", "ATS", "Communication", "Calendar", "HRIS"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filterCategory.toLowerCase() === cat.toLowerCase()
                    ? "bg-brand text-white shadow-s5 hover:bg-brand/90"
                    : "text-gray-600 hover:text-ink dark:text-gray-500 dark:hover:text-ink"
                }`}
              >
                {cat === "all" ? "All apps" : cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" strokeWidth={1.75} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search integrations…"
              className="w-full rounded-xl border border-line bg-surface py-2 pl-9 pr-3 text-xs text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-s5"
            />
          </div>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-line bg-surface p-5 shadow-s5 transition-all hover:border-brand/40"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-gray-50 dark:bg-gray-25 font-bold text-ink text-sm shadow-s5">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-ink">{item.name}</h3>
                      <span className="text-[11px] text-gray-500">{item.category}</span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      item.connected
                        ? "border border-brand/20 bg-brand/10 text-brand-text"
                        : "border border-line bg-gray-50 dark:bg-gray-25 text-gray-600 dark:text-gray-600"
                    }`}
                  >
                    {item.connected ? "Connected" : item.badge}
                  </span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-gray-600 dark:text-gray-500">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 border-t border-line pt-3.5 flex items-center justify-between gap-2">
                {item.connected ? (
                  <>
                    <span className="text-[11px] text-gray-500">Active · {item.installedAt}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setModalItem(item)}
                        className="rounded-xl border border-line bg-surface p-1.5 text-xs text-gray-600 hover:text-ink hover:bg-gray-50 dark:text-gray-500 dark:hover:text-ink dark:hover:bg-gray-25 shadow-s5 transition-colors"
                        title="Configure settings"
                      >
                        <Settings className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleConnect(item.id)}
                        className="rounded-xl border border-red-200 dark:border-red-500/30 bg-surface px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        Disconnect
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] text-gray-500">Instant setup</span>
                    <button
                      type="button"
                      onClick={() => toggleConnect(item.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-s5 transition-colors hover:bg-brand/90"
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={1.75} /> Connect
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Security & Webhook Info Card */}
        <div className="rounded-xl border border-line bg-surface p-5 shadow-s5">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand-text shadow-s5">
              <Shield className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-ink">Enterprise security &amp; compliance</h3>
              <p className="mt-0.5 text-xs text-gray-500">
                All external integration API keys and webhooks are encrypted with AES-256 and never shared with candidate clients.
              </p>
            </div>
          </div>
        </div>

        {/* Modal for Settings */}
        {modalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-pop">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-gray-50 dark:bg-gray-25 font-bold text-ink shadow-s5">
                    {modalItem.name.charAt(0)}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-ink">{modalItem.name} settings</h3>
                    <p className="text-[11px] text-gray-500">Connected integration</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalItem(null)}
                  className="rounded-xl border border-line bg-surface p-1.5 text-gray-500 hover:text-ink hover:bg-gray-50 dark:hover:bg-gray-25 transition-colors"
                >
                  <X className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>

              <div className="space-y-3 py-4 text-xs text-gray-600 dark:text-gray-500">
                <p>Status: <span className="font-semibold text-brand-text">Operational &amp; healthy</span></p>
                <div>
                  <span className="text-gray-500">Webhook URL:</span>
                  <code className="mt-1 block rounded-lg border border-line bg-gray-50 dark:bg-gray-25 px-2.5 py-1.5 font-mono text-[11px] text-ink break-all">
                    https://api.recruai.menteeai.org/v1/integrations/{modalItem.id}
                  </code>
                </div>
                <div className="rounded-xl border border-line bg-gray-50 dark:bg-gray-25 p-3.5 space-y-1.5">
                  <p className="font-semibold text-ink">Permissions granted:</p>
                  <p>• Candidate profile export</p>
                  <p>• Real-time interview scorecard sync</p>
                  <p>• Two-way pipeline stage synchronization</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-line pt-3">
                <button
                  type="button"
                  onClick={() => setModalItem(null)}
                  className="rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink shadow-s5 hover:bg-gray-50 dark:hover:bg-gray-25 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OrgAppShell>
  );
}

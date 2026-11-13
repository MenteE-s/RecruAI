import { useState, useEffect } from "react";
import { OrgAppShell } from "../../components/layout/OrgAppShell";
import { AppShell } from "../../components/layout/AppShell";
import { getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { Button } from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { BILLING_BETA_MESSAGE, BILLING_ENABLED } from "../../utils/billing";
import {
  CreditCard,
  Zap,
  FileText,
  Settings,
  TrendingUp,
  AlertTriangle,
  Download,
  ArrowRight,
} from "lucide-react";

export default function Billing({ audience = "organization" }) {
  const [userData, setUserData] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenUsage, setTokenUsage] = useState([]);
  const [usageLoading, setUsageLoading] = useState(true);
  const wrap = (node) =>
    audience === "individual" ? (
      // One owning header: the body renders `Billing`; there is no bar.
      <AppShell>{node}</AppShell>
    ) : (
      <OrgAppShell>{node}</OrgAppShell>
    );

  const fetchUserData = async () => {
    setError(null);
    setLoading(true);
    const controller = new AbortController();
    // A stalled /api/auth/me used to leave this page on `Loading billing…`
    // forever with an empty card. Bound it and surface a retryable error instead.
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(`${getBackendUrl()}/api/auth/me`, {
        headers: getAuthHeaders(),
        credentials: "include",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setUserData(data.user || {});
      setOrganization(data.user?.organization || null);
    } catch (err) {
      setError(
        err?.name === "AbortError"
          ? "Billing took too long to load."
          : "Couldn't load your billing details."
      );
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  const fetchTokenUsage = async () => {
    try {
      setUsageLoading(true);
      const orgId = organization?.id;
      if (orgId) {
        const response = await fetch(`${getBackendUrl()}/api/organizations/${orgId}/usage`, { headers: getAuthHeaders(), credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          setTokenUsage(data.usage || []);
        } else setTokenUsage([]);
      }
    } catch (err) {
      setTokenUsage([]);
    } finally {
      setUsageLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchUserData(); fetchTokenUsage(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (organization?.id) fetchTokenUsage(); }, [organization?.id]);

  if (loading) {
    return wrap(
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="h-44 animate-pulse rounded-xl border border-line bg-surface shadow-s5" />
          <p className="mt-4 text-xs font-medium text-gray-500">Loading billing…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return wrap(
      <div className="px-4 pb-4 pt-4">
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 shadow-s5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" strokeWidth={1.75} />
          <p className="font-medium">{error}</p>
        </div>
        <div className="mt-6 rounded-xl border border-line bg-surface p-8 text-center shadow-s5">
          <EmptyState
            icon={TrendingUp}
            title="Unable to load billing information"
            body="Please try again later."
          />
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={fetchUserData}
              className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-s5 hover:bg-brand/90 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const planName = userData?.subscription_status?.is_paid_active ? "Pro" : userData?.subscription_status?.is_trial_active ? "Trial" : "Free";
  const trialStart = userData?.subscription_status?.trial_start_date;
  const trialEnds = userData?.subscription_status?.trial_end_date
    ? new Date(userData.subscription_status.trial_end_date)
    : trialStart
      ? new Date(new Date(trialStart).getTime() + 30 * 24 * 60 * 1000)
      : null;
  const isTrialActive = userData?.subscription_status?.is_trial_active;
  const isPaidActive = userData?.subscription_status?.is_paid_active;
  const tokensUsed = userData?.subscription_status?.tokens_used || 0;

  const pillCls = "inline-flex items-center gap-1.5 rounded-full border border-line bg-gray-50 dark:bg-gray-25 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-600";
  const tokenPct = Math.min(100, (tokensUsed / 100000) * 100);

  return wrap(
    <>
      {/* Header */}
      <div className="px-4 pb-4 pt-4">
        <div className="rounded-xl border border-line bg-surface p-5 shadow-s5 card-hover">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand-text shadow-s5">
                  <CreditCard className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <h1 className="text-xl font-bold tracking-tight text-ink">Billing &amp; usage</h1>
              </div>
              <p className="mt-1 text-xs text-gray-500">Review your subscription plan, trial validity, and AI token consumption.</p>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div className={`rounded-xl border p-3 text-center shadow-s5 ${isPaidActive ? "border-brand/20 bg-brand/10" : "border-line bg-gray-50 dark:bg-gray-25"}`}>
                <p className={`text-lg font-bold ${isPaidActive ? "text-brand-text" : "text-ink"}`}>{planName}</p>
                <p className="mt-0.5 text-[11px] font-medium text-gray-500">Plan</p>
              </div>
              <div className="rounded-xl border border-line bg-gray-50 dark:bg-gray-25 p-3 text-center shadow-s5">
                <p className="text-lg font-bold font-mono tabular-nums text-ink">{tokensUsed.toLocaleString()}</p>
                <p className="mt-0.5 text-[11px] font-medium text-gray-500">Tokens</p>
              </div>
              <div className="rounded-xl border border-line bg-gray-50 dark:bg-gray-25 p-3 text-center shadow-s5">
                <p className="text-lg font-bold font-mono tabular-nums text-ink">{tokenUsage.length}</p>
                <p className="mt-0.5 text-[11px] font-medium text-gray-500">Records</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current plan */}
      <div className="px-4 pb-4">
        <div className="rounded-xl border border-line bg-surface p-5 shadow-s5 card-hover">
          <div className="flex items-center gap-2 border-b border-line pb-4">
            <TrendingUp className="h-4 w-4 text-gray-500" strokeWidth={1.75} />
            <h2 className="text-sm font-semibold text-ink">Current plan</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 pt-4 md:grid-cols-3">
            <div className="rounded-xl border border-line bg-gray-50 dark:bg-gray-25 p-4 shadow-s5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Plan type</p>
              <p className="mt-1 text-lg font-bold capitalize text-ink">{planName}</p>
              {planName === "Trial" && trialEnds && (
                <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">Expires <span className="font-mono tabular-nums">{trialEnds.toLocaleDateString()}</span></p>
              )}
            </div>
            <div className="rounded-xl border border-line bg-gray-50 dark:bg-gray-25 p-4 shadow-s5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Tokens used</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-2xl font-bold font-mono tabular-nums tracking-tight text-ink">{tokensUsed.toLocaleString()}</p>
                <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[10px] font-medium text-gray-500">tokens</span>
              </div>
              <div className="mt-2.5 h-2 rounded-full bg-line/60 dark:bg-gray-700/50">
                <div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${tokenPct}%` }} />
              </div>
              <p className="mt-1.5 text-xs font-mono tabular-nums text-gray-500">{tokensUsed.toLocaleString()} / 100,000</p>
            </div>
            <div className="rounded-xl border border-line bg-gray-50 dark:bg-gray-25 p-4 shadow-s5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</p>
              <p className="mt-1 flex items-center gap-2 text-lg font-bold">
                {isPaidActive ? (
                  <><span className="h-2 w-2 animate-pulse rounded-full bg-brand" /><span className="text-brand-text">Active</span></>
                ) : isTrialActive ? (
                  <><span className="h-2 w-2 rounded-full bg-amber-500" /><span className="text-amber-600 dark:text-amber-400">Trial</span></>
                ) : (
                  <span className="text-gray-500">Free</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Token usage history */}
      <div className="px-4 pb-4">
        <div className="rounded-xl border border-line bg-surface p-5 shadow-s5 card-hover">
          <div className="flex items-center gap-2 border-b border-line pb-4">
            <FileText className="h-4 w-4 text-gray-500" strokeWidth={1.75} />
            <h2 className="text-sm font-semibold text-ink">Token usage history</h2>
            <span className="ml-auto text-xs font-medium font-mono tabular-nums text-gray-500">{tokenUsage.length} records</span>
          </div>
          <div className="pt-4">
            {usageLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-gray-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
                Loading usage…
              </div>
            ) : tokenUsage.length === 0 ? (
              <EmptyState
                compact
                icon={Zap}
                title="No usage yet"
                body="Token usage will appear here as you use AI features like candidate search, ranking, and interview analysis."
              />
            ) : (
              <div className="max-h-[400px] space-y-3 overflow-y-auto pr-1">
                {tokenUsage.map((usage, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4 shadow-s5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-25 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{usage.operation_type || "Unknown Operation"}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{new Date(usage.created_at || usage.timestamp || Date.now()).toLocaleString()}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className={pillCls}><Zap className="h-3 w-3" strokeWidth={1.75} /> {usage.provider || "N/A"}</span>
                        <span className={pillCls}>{usage.model || "N/A"}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-sm font-bold font-mono tabular-nums text-ink">{usage.tokens_used?.toLocaleString() || "0"}</p>
                      <p className="text-[11px] text-gray-500">tokens</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Billing actions */}
      <div className="px-4 pb-4">
        <div className="rounded-xl border border-line bg-surface p-5 shadow-s5 card-hover">
          <div className="flex items-center gap-2 border-b border-line pb-4">
            <Settings className="h-4 w-4 text-gray-500" strokeWidth={1.75} />
            <h2 className="text-sm font-semibold text-ink">Billing actions</h2>
          </div>
          <div className="space-y-3 pt-4">
            {!BILLING_ENABLED && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 shadow-s5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className="leading-relaxed">{BILLING_BETA_MESSAGE}</span>
              </div>
            )}
            {BILLING_ENABLED && (
              <>
                {!isPaidActive ? (
                  <Button variant="primary" size="lg" className="w-full" onClick={() => alert("Upgrade functionality with Stripe integration")}>
                    Upgrade to Pro <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    onClick={() => { if (window.confirm("Cancel Pro subscription?")) alert("Cancellation"); }}
                  >
                    Cancel subscription
                  </Button>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button variant="secondary" className="w-full" onClick={() => alert("Invoice download")}>
                    <Download className="h-4 w-4" strokeWidth={1.75} /> Download invoice
                  </Button>
                  <Button variant="secondary" className="w-full" onClick={() => alert("Payment method update")}>
                    <CreditCard className="h-4 w-4" strokeWidth={1.75} /> Update payment
                  </Button>
                </div>
              </>
            )}
            <p className="pt-2 text-center text-xs text-gray-500">
              {BILLING_ENABLED
                ? "Secure billing via Stripe • Invoices sent to your email"
                : "No payment is required during the beta."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

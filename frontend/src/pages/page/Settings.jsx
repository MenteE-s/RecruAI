// Page manager -> Page settings.
//
// Operational settings that aren't part of the public profile: the company
// timezone (all interview times render in it) and subscription state. Billing
// card management lives on its own page.
import { useEffect, useState } from "react";
import PageManagerLayout from "../../components/page/PageManagerLayout";
import TimezoneSelector from "../../components/ui/TimezoneSelector";
import { getCurrentUser, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { Clock, Award, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function PageSettings() {
  const [org, setOrg] = useState(null);
  const [error, setError] = useState(null);

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
        if (!cancelled) setOrg(await res.json());
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load your page.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (error && !org) {
    return (
      <PageManagerLayout title="Page settings">
        <div className="bg-surface border border-line rounded-xl p-6 text-center max-w-sm mx-auto shadow-s5">
          <p className="text-[12.5px] text-gray-600 dark:text-gray-500">{error}</p>
        </div>
      </PageManagerLayout>
    );
  }

  if (!org) {
    return (
      <PageManagerLayout title="Page settings">
        <div className="py-8 text-center text-xs text-gray-500">Loading…</div>
      </PageManagerLayout>
    );
  }

  const sub = org.subscription_status || {};
  const isTrial = sub.is_trial_active;
  const isPaid = sub.is_paid_active;

  return (
    <PageManagerLayout
      title="Page settings"
      subtitle="Operational settings for your company page."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Column */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          {/* Subscription */}
          <section className="bg-surface border border-line rounded-xl shadow-s5 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-line flex items-center gap-2">
              <Award className="h-4 w-4 text-gray-500" strokeWidth={1.75} />
              <h2 className="text-[13.5px] font-semibold text-ink">Subscription plan</h2>
              <span
                className={`ml-auto text-[10.5px] font-bold font-mono px-2 py-0.5 rounded-full ${
                  isPaid ? "bg-brand/10 text-brand-text" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                }`}>
                {isPaid ? "Pro" : isTrial ? "Trial" : "Expired"}
              </span>
            </div>
            <div className="p-5">
              <p className="text-[13px] text-gray-700 dark:text-gray-600">
                {isPaid
                  ? "Your page is on the Pro plan with full access to hiring tools."
                  : isTrial
                    ? "Your page is on a free trial."
                    : "Your trial has ended. Basic page features still work."}
              </p>
              <ul className="mt-3.5 space-y-2">
                <li className="flex items-center gap-2.5 text-[12.5px] text-gray-600 dark:text-gray-500">
                  {sub.can_schedule_interview
                    ? <CheckCircle className="h-4 w-4 text-brand-text shrink-0" strokeWidth={1.75} />
                    : <XCircle className="h-4 w-4 text-gray-300 shrink-0 dark:text-gray-600" strokeWidth={1.75} />}
                  Interview scheduling {typeof sub.interviews_remaining === "number" && isTrial
                    ? `(${sub.interviews_remaining} of 5 remaining on trial)`
                    : ""}
                </li>
                <li className="flex items-center gap-2.5 text-[12.5px] text-gray-600 dark:text-gray-500">
                  <CheckCircle className="h-4 w-4 text-brand-text shrink-0" strokeWidth={1.75} />
                  Post jobs and manage candidates
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-[11.5px] text-gray-500">
                <span>Tokens used:</span>
                <span className="font-mono tabular-nums text-ink">{sub.tokens_used?.toLocaleString?.() ?? 0}</span>
              </div>
            </div>
          </section>

          {/* Danger zone */}
          <section className="bg-surface border border-red-200 rounded-xl shadow-s5 overflow-hidden dark:border-red-500/30">
            <div className="px-5 py-3.5 border-b border-red-100 dark:border-red-500/20">
              <h2 className="text-[13.5px] font-semibold text-red-700 dark:text-red-400">Danger zone</h2>
            </div>
            <div className="p-5 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-ink">Delete this company page</p>
                <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">
                  Permanently removes this company page, all active job postings, and team membership associations.
                  Your personal candidate account and profile remain intact.
                </p>
              </div>
              <button
                type="button"
                disabled
                className="px-3.5 py-2 rounded-xl border border-red-200 bg-surface text-xs font-semibold text-red-600 cursor-not-allowed opacity-60 shrink-0 dark:border-red-500/30 dark:text-red-400 shadow-s5"
              >
                Request deletion
              </button>
            </div>
          </section>
        </div>

        {/* Side Column */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          {/* Timezone */}
          <section className="bg-surface border border-line rounded-xl shadow-s5 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-line flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" strokeWidth={1.75} />
              <h2 className="text-[13.5px] font-semibold text-ink">Timezone</h2>
            </div>
            <div className="p-5">
              <p className="text-[12px] text-gray-500 mb-3.5 leading-relaxed">
                Interview schedules, candidate booking slots, and pipeline timestamps are evaluated in this timezone.
              </p>
              <TimezoneSelector
                organizationId={org.id}
                value={org.timezone || "UTC"}
                showCurrentTime={true}
              />
            </div>
          </section>

          {/* Operational Support Tip */}
          <div className="bg-gray-50 border border-line rounded-xl shadow-s5 p-4 dark:bg-gray-25 text-[12px] leading-relaxed text-gray-600 dark:text-gray-500">
            <p className="font-semibold text-ink mb-1">Company operations</p>
            <p>
              Changes to timezone take effect immediately across all scheduled interview rooms and candidate invites.
            </p>
          </div>
        </div>
      </div>
    </PageManagerLayout>
  );
}

// Page manager -> Page settings.
//
// Operational settings that aren't part of the public profile: the company
// timezone (all interview times render in it) and subscription state. Billing
// card management lives on its own page.
import { useEffect, useState } from "react";
import PageManagerLayout from "../../components/page/PageManagerLayout";
import TimezoneSelector from "../../components/ui/TimezoneSelector";
import { getCurrentUser, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { FiClock, FiAward, FiCheckCircle, FiXCircle, FiAlertTriangle } from "react-icons/fi";

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
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
          <p className="text-[12.5px] text-gray-600">{error}</p>
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
      <div className="space-y-4">
        {/* Subscription */}
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <FiAward className="w-4 h-4 text-gray-500" />
            <h2 className="text-[13px] font-semibold text-gray-900">Subscription</h2>
            <span
              className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {isPaid ? "PRO" : isTrial ? "TRIAL" : "EXPIRED"}
            </span>
          </div>
          <div className="p-4">
            <p className="text-[12.5px] text-gray-700">
              {isPaid
                ? "Your page is on the Pro plan with full access to hiring tools."
                : isTrial
                  ? "Your page is on a free trial."
                  : "Your trial has ended. Basic page features still work."}
            </p>
            <ul className="mt-3 space-y-1.5">
              <li className="flex items-center gap-2 text-[12px] text-gray-600">
                {sub.can_schedule_interview
                  ? <FiCheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  : <FiXCircle className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
                Interview scheduling {typeof sub.interviews_remaining === "number" && isTrial
                  ? `(${sub.interviews_remaining} of 5 remaining on trial)`
                  : ""}
              </li>
              <li className="flex items-center gap-2 text-[12px] text-gray-600">
                <FiCheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                Post jobs and manage candidates
              </li>
            </ul>
            <p className="mt-3 text-[11px] text-gray-400">
              Tokens used: {sub.tokens_used?.toLocaleString?.() ?? 0}
            </p>
          </div>
        </section>

        {/* Timezone */}
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <FiClock className="w-4 h-4 text-gray-500" />
            <h2 className="text-[13px] font-semibold text-gray-900">Timezone</h2>
          </div>
          <div className="p-4">
            <p className="text-[11.5px] text-gray-500 mb-3">
              Interview times and candidate availability display in this timezone.
            </p>
            <TimezoneSelector
              organizationId={org.id}
              value={org.timezone || "UTC"}
              showCurrentTime={true}
            />
          </div>
        </section>

        {/* Danger zone */}
        <section className="bg-white border border-red-200 rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-red-100">
            <h2 className="text-[13px] font-semibold text-gray-900">Danger zone</h2>
          </div>
          <div className="p-4 flex items-start gap-2.5">
            <FiAlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold text-gray-900">Delete this page</p>
              <p className="text-[11.5px] text-gray-500 mt-0.5 leading-relaxed">
                Removes the page, its job posts and its team links. Your personal account
                and profile stay intact. Contact support to proceed.
              </p>
            </div>
            <button
              type="button"
              disabled
              className="px-3 py-1.5 rounded-md border border-red-200 bg-white text-[12px] font-semibold text-red-600 cursor-not-allowed opacity-60 shrink-0"
            >
              Request deletion
            </button>
          </div>
        </section>
      </div>
    </PageManagerLayout>
  );
}
import React from "react";
import { FiLock, FiCreditCard, FiX, FiCheckCircle } from "react-icons/fi";
import { BILLING_BETA_MESSAGE, BILLING_ENABLED } from "../../utils/billing";

/**
 * A reusable paywall modal shown when an unsubscribed (lapsed) user tries to
 * access a paid CVAI feature. During the controlled beta it explains the
 * trial and does not offer a purchase that cannot complete.
 */
export default function PaywallModal({ open, feature, onClose, onUpgrade }) {
  if (!open) return null;

  const featureLabels = {
    quizzes: "Quizzes",
    projects: "Guided projects",
    "mock-interviews": "Mock interviews",
    coaching: "Coaching",
    mentorship: "Mentorship",
  };

  const label = featureLabels[feature] || "this feature";

  async function handleSubscribe() {
    try {
      if (onUpgrade) await onUpgrade();
      if (onClose) onClose();
    } catch (err) {
      if (onClose) onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-s15 animate-popIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-500 hover:text-gray-600"
          aria-label="Close"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10">
          <FiLock className="h-6 w-6 text-brand-text" />
        </div>

        <h2 className="text-lg font-bold text-ink">
          {BILLING_ENABLED ? `${label} is a paid feature` : `${label} is included in your trial`}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {BILLING_ENABLED ? (
            <>
              {label} is part of the CVAI paid tier. Every individual account gets a
              <strong> 30-day free trial</strong> with full access. After that you
              can subscribe to keep going after the trial ends.
            </>
          ) : (
            <>
              {label} is part of CVAI. Every new account gets a
              <strong> 30-day full-access trial</strong>, and paid plans are not
              available while the beta is running.
            </>
          )}
        </p>

        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <FiCheckCircle className="h-4 w-4 text-brand-text" />
            Free trial: 30 days of full access, no card needed
          </li>
          <li className="flex items-center gap-2">
            <FiCheckCircle className="h-4 w-4 text-brand-text" />
            {BILLING_ENABLED
              ? "After trial: subscribe to keep using paid features"
              : "After trial: your account stays on the free plan"}
          </li>
          <li className="flex items-center gap-2">
            <FiLock className="h-4 w-4 text-gray-500" />
            Free previews of quizzes & projects always available
          </li>
        </ul>

        {!BILLING_ENABLED && (
          <p className="mt-4 border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {BILLING_BETA_MESSAGE}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {BILLING_ENABLED && (
            <button
              onClick={handleSubscribe}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-brand bg-brand-action px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90"
            >
              <FiCreditCard className="h-4 w-4" /> Subscribe now
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full rounded-xl px-4 py-2 text-sm text-gray-600 transition-colors hover:text-ink"
          >
            {BILLING_ENABLED ? "Maybe later" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

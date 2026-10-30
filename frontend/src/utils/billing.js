/**
 * Billing is intentionally closed during the controlled beta.
 *
 * Set REACT_APP_BILLING_ENABLED=true only when a real payment provider is
 * wired to the backend. While it is false, paid CTAs are hidden and the
 * backend upgrade endpoint returns 410 instead of granting access for free.
 */
export const BILLING_ENABLED = process.env.REACT_APP_BILLING_ENABLED === "true";

export const BILLING_BETA_MESSAGE =
  "Paid plans are not available during the beta. New accounts get a 30-day full-access trial.";

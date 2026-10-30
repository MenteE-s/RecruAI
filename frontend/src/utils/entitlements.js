// Client-side mirror of backend/utils/subscription.py + User.can_access_feature.
// The backend remains authoritative; this only drives UI visibility and the
// "permission denied" popup. A 403 from the API always wins.

const BASIC_INDIVIDUAL = new Set([
  "profile_management",
  "job_search",
  "basic_matching",
]);

const BASIC_ORG = new Set([
  "profile_management",
  "job_posting",
  "basic_matching",
  "team_management",
]);

export function isTrialActive(user) {
  const s = user?.subscription_status;
  if (!s) return false;
  if (typeof s === "object") return !!s.is_trial_active;
  return s === "trial";
}

export function isPaidActive(user) {
  const s = user?.subscription_status;
  if (!s) return false;
  if (typeof s === "object") return !!s.is_paid_active;
  return s === "active" && !!user?.paid_plan;
}

// Returns true when the account may use `feature`.
export function canAccessFeature(user, feature) {
  if (!user || !feature) return false;
  const overrides = Array.isArray(user.feature_overrides) ? user.feature_overrides : [];
  if (overrides.includes(feature)) return true;
  if (isPaidActive(user) || isTrialActive(user)) return true;
  const planFeatures = Array.isArray(user.plan_features) ? user.plan_features : null;
  if (planFeatures) return planFeatures.includes(feature);
  // Fall back to the legacy basic sets when the backend did not ship a plan.
  if (user.organization_id) return BASIC_ORG.has(feature);
  return BASIC_INDIVIDUAL.has(feature);
}

// Human-readable reason for a denial, used by the popup.
export function denialReason(user, feature) {
  if (canAccessFeature(user, feature)) return null;
  if (isTrialActive(user) === false && isPaidActive(user) === false) {
    return "Your free plan does not include this feature. Upgrade to unlock it.";
  }
  return "You do not have access to this feature.";
}

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CvaiShell, { Panel, Stat, Badge, Loading, ErrorNote, LockedNote, EmptyNote, Meter } from "../cvai/CvaiShell";
import { cvai, isLocked, messageOf, levelTone, percent } from "../../utils/cvai";
import { canAccessFeature, denialReason } from "../../utils/entitlements";
import { BILLING_BETA_MESSAGE, BILLING_ENABLED } from "../../utils/billing";
import PermissionDeniedModal from "../../components/ui/PermissionDeniedModal";
import { getAuthHeaders, getBackendUrl } from "../../utils/auth";
import { ArrowRight, CheckCircle2, Code2, HelpCircle, Target, CreditCard, Lock } from "lucide-react";

/**
 * The CVAI overview.
 *
 * Deliberately a landing page rather than a dashboard of vanity numbers: it
 * answers one question — what should I do next? — and shows how much real
 * evidence sits behind the profile. Everything on it is measured, nothing is
 * mocked.
 */
export default function CvaiOverview() {
  const [levels, setLevels] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [locked, setLocked] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [deniedReason, setDeniedReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [upgrading, setUpgrading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    // Fetch the signed-in user first so per-account feature overrides (e.g.
    // career_coaching granted by an admin) are honoured before any API call.
    try {
      const meRes = await fetch(`${getBackendUrl()}/api/auth/me`, { credentials: "include", headers: getAuthHeaders() });
      if (meRes.ok) {
        const me = await meRes.json();
        const u = me?.user || null;
        if (u && !canAccessFeature(u, "career_coaching")) {
          setPermissionDenied(true);
          setDeniedReason(denialReason(u, "career_coaching"));
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fall through to the normal load; the API will enforce access.
    }
    // Projects are deliberately not fetched here. The overview links to them but
    // never renders them, and an unused request is one more way for this page to
    // fail and then show nothing at all.
    const [levelsRes, quizRes, suggestionRes, quizHistory, projectHistory, subRes] =
      await Promise.all([
        cvai.levels(),
        cvai.quizzes(),
        cvai.suggestions(),
        cvai.quizAttempts(),
        cvai.projectAttempts(),
        cvai.subscriptionStatus(),
      ]);

    if (isLocked(levelsRes)) { setLocked(true); setLoading(false); return; }
    if (!levelsRes.ok) { setError(messageOf(levelsRes, "Could not load your CVAI overview.")); setLoading(false); return; }

    setLevels(levelsRes.data || { levels: {} });
    setQuiz(quizRes.data || { quizzes: [] });
    setSuggestions((suggestionRes.data || {}).suggestions || []);
    setAttempts([
      ...(quizHistory.data?.attempts || []).map((a) => ({ ...a, kind: "quiz" })),
      ...(projectHistory.data?.attempts || []).map((a) => ({ ...a, kind: "project" })),
    ]);
    if (subRes.ok) setSubscription(subRes.data || null);
    setLocked(false);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const measured = Object.entries(levels?.levels || {});
  const verified = measured.filter(([, v]) => v.verified).length;
  const freeQuiz = (quiz?.quizzes || []).find((q) => q.is_free_preview && !q.locked);
  const top = suggestions[0];

  const recent = [...attempts]
    .filter((a) => a.score_percent !== null && a.score_percent !== undefined)
    .sort((a, b) => new Date(b.completed_at || b.created_at || 0) - new Date(a.completed_at || a.created_at || 0))
    .slice(0, 5);

  const hasEvidence = measured.length > 0;
  const isSubscribed = subscription?.is_paid_active || subscription?.is_trial_active;

  async function handleUpgrade() {
    setError("");
    setUpgrading(true);
    try {
      const res = await cvai.subscriptionUpgrade("paid");
      if (!res.ok) {
        setError(messageOf(res, "Could not upgrade subscription."));
        return;
      }
      setSubscription(res.data?.subscription || null);
    } catch (err) {
      setError(err.message || "Could not upgrade subscription.");
    } finally {
      setUpgrading(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm("Cancel your subscription? You will keep access through the current period, then revert to the basic plan.")) {
      return;
    }
    setError("");
    setUpgrading(true);
    try {
      const res = await cvai.subscriptionCancel();
      if (!res.ok) {
        setError(messageOf(res, "Could not cancel subscription."));
        return;
      }
      setSubscription(res.data?.subscription || null);
    } catch (err) {
      setError(err.message || "Could not cancel subscription.");
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <>
      <PermissionDeniedModal
        open={permissionDenied}
        title="Career coaching is a premium feature"
        message={deniedReason || "Career coaching is not included in your plan. Upgrade to unlock it."}
        onClose={() => setPermissionDenied(false)}
      />
      <CvaiShell
        title="Coaching"
        subtitle="Measure what you can do, prove it by doing, and follow a plan that fits your life."
      >
        {locked ? (
          <LockedNote what="CVAI" />
        ) : (
          <div className="space-y-5">
            {error ? <ErrorNote onRetry={load}>{error}</ErrorNote> : null}

            {loading ? (
              <Loading label="Loading your progress" />
            ) : (
              <>
                {/* Recommended next hero card */}
                <section className="relative overflow-hidden rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25/90 p-6 shadow-s5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 dark:bg-brand/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-text">
                      Recommended next
                    </span>
                    {top?.priority ? (
                      <span className="text-xs capitalize text-secondary dark:text-gray-600">{top.priority} priority</span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-xl font-bold text-ink">{top?.title || "Establish a baseline"}</h2>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-secondary dark:text-gray-700">
                    {top?.reason ||
                      "Take an assessment so your profile carries measured evidence instead of claims. Everything else here builds on that."}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link
                      to={!hasEvidence || top?.action?.type === "start_assessment" ? "/in/coaching/skills" : "/in/coaching/plan"}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white shadow-s5 transition-colors hover:bg-brand/90"
                    >
                      {!hasEvidence || top?.action?.type === "start_assessment" ? "Start an assessment" : "Open my plan"}
                      <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                    </Link>
                    {freeQuiz ? (
                      <Link
                        to="/in/coaching/quizzes"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 px-4 py-2 text-sm font-medium text-ink dark:text-gray-900 transition-colors hover:bg-gray-100 dark:hover:bg-gray-25/60"
                      >
                        Try a free quiz
                      </Link>
                    ) : null}
                  </div>
                </section>

                {!isSubscribed ? (
                  <Panel
                    title={BILLING_ENABLED ? "Subscribe to unlock CVAI" : "Your trial has ended"}
                    hint={BILLING_ENABLED
                      ? "Quizzes, guided projects, mock interviews and coaching are paid features."
                      : "Paid plans are closed while the controlled beta is running."}
                  >
                    <div className="space-y-4">
                      <p className="text-sm leading-relaxed text-secondary dark:text-gray-700">
                        {BILLING_ENABLED
                          ? "You are on the basic plan. Upgrade to unlock quizzes, guided projects, mock interviews and mentorship."
                          : "Your account is on the free plan. Free previews and your existing transcripts remain available, but paid upgrades are not open during the beta."}
                      </p>

                      <div className="grid gap-3 md:grid-cols-2 mt-1">
                        <div className="rounded-xl border border-brand/20 bg-brand/10 dark:bg-brand/15 p-4 text-sm">
                          <p className="font-medium text-brand-text mb-1.5 inline-flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} /> Free for everyone
                          </p>
                          <ul className="text-xs text-secondary dark:text-gray-700 space-y-1 leading-relaxed">
                            <li>• Profile management + job search</li>
                            <li>• Free-preview quizzes & projects</li>
                            <li>• Re-reading your past interview transcripts</li>
                          </ul>
                        </div>
                        <div className="rounded-xl border border-line dark:border-line bg-gray-50 dark:bg-gray-25/80 p-4 text-sm">
                          <p className="font-medium text-ink dark:text-gray-900 mb-1.5 inline-flex items-center gap-1.5">
                            <Lock className="h-4 w-4 text-secondary dark:text-gray-600" strokeWidth={1.75} />
                            {BILLING_ENABLED ? "Paid (free during trial)" : "Included during the 30-day trial"}
                          </p>
                          <ul className="text-xs text-secondary dark:text-gray-700 space-y-1 leading-relaxed">
                            <li>• Skill assessments + results on profile</li>
                            <li>• All quizzes + projects</li>
                            <li>• Mock interviews (start + feedback)</li>
                            <li>• Mentorship plans + coaching</li>
                          </ul>
                        </div>
                      </div>
                      <div className="text-xs leading-relaxed text-secondary dark:text-gray-600 mt-1">
                        {BILLING_ENABLED
                          ? <>Every new account gets a <strong>30-day free trial</strong> of all paid features.</>
                          : BILLING_BETA_MESSAGE}
                      </div>
                      {BILLING_ENABLED ? (
                        <button
                          type="button"
                          onClick={handleUpgrade}
                          disabled={upgrading}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-xl shadow-s5 hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {upgrading ? (
                            <span className="flex items-center gap-2 text-xs">Upgrading…</span>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <CreditCard className="h-4 w-4" strokeWidth={1.75} /> Subscribe now
                            </span>
                          )}
                        </button>
                      ) : (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-400">
                          Paid plans are not available during the beta. Your trial stays active for its full 30 days.
                        </div>
                      )}
                      {subscription && !subscription.is_trial_active && !subscription.is_paid_active && (
                        <p className="text-xs text-secondary dark:text-gray-600">
                          Status: <span className="font-mono">{subscription.status}</span>{subscription.paid_plan ? " (paid)" : ""}
                        </p>
                      )}
                    </div>
                  </Panel>
                ) : (
                  <Panel title="Your plan benefits" hint={subscription?.status === "active" ? "All CVAI features are unlocked." : "Full access during your free trial."}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-ink">
                            {subscription?.is_paid_active ? "Paid plan" : "Free trial (30 days)"}
                          </span>
                          <span className={`ml-2 text-xs px-2.5 py-0.5 rounded-full ${subscription?.is_paid_active ? "bg-brand/10 text-brand-text" : "bg-gray-50 text-secondary border border-line dark:border-line dark:bg-gray-25"}`}>
                            {subscription?.is_paid_active ? "Active" : "Trial"}
                          </span>
                        </div>
                        {subscription?.is_paid_active ? (
                          <button
                            type="button"
                            onClick={handleCancel}
                            disabled={upgrading}
                            className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            {upgrading ? "Cancelling…" : "Unsubscribe"}
                          </button>
                        ) : null}
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-brand/20 bg-brand/10 dark:bg-brand/15 p-3.5 text-sm">
                          <p className="font-medium text-brand-text inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Unlimited skill assessments</p>
                          <p className="mt-0.5 text-xs text-secondary dark:text-gray-700">Test your level on many skills with scored questions.</p>
                        </div>
                        <div className="rounded-xl border border-brand/20 bg-brand/10 dark:bg-brand/15 p-3.5 text-sm">
                          <p className="font-medium text-brand-text inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} /> All quizzes unlocked</p>
                          <p className="mt-0.5 text-xs text-secondary dark:text-gray-700">Access every quiz in the question bank.</p>
                        </div>
                        <div className="rounded-xl border border-brand/20 bg-brand/10 dark:bg-brand/15 p-3.5 text-sm">
                          <p className="font-medium text-brand-text inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Guided projects</p>
                          <p className="mt-0.5 text-xs text-secondary dark:text-gray-700">Build and get reviewed with skill write-backs.</p>
                        </div>
                        <div className="rounded-xl border border-brand/20 bg-brand/10 dark:bg-brand/15 p-3.5 text-sm">
                          <p className="font-medium text-brand-text inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Mock interviews</p>
                          <p className="mt-0.5 text-xs text-secondary dark:text-gray-700">Full 6-phase interviews with AI scoring.</p>
                        </div>
                        <div className="rounded-xl border border-brand/20 bg-brand/10 dark:bg-brand/15 p-3.5 text-sm">
                          <p className="font-medium text-brand-text inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Mentorship plans</p>
                          <p className="mt-0.5 text-xs text-secondary dark:text-gray-700">Learning plans tailored to your schedule with measured steps.</p>
                        </div>
                        <div className="rounded-xl border border-line dark:border-line bg-gray-50 dark:bg-gray-25/80 p-3.5 text-sm">
                          <p className="font-medium text-ink dark:text-gray-900 inline-flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5" strokeWidth={1.75} />
                            {BILLING_ENABLED ? "Self-service" : "Beta access"}
                          </p>
                          <p className="mt-0.5 text-xs text-secondary dark:text-gray-700">
                            {BILLING_ENABLED
                              ? "Manage your plan anytime. Cancel anytime, no lock-in."
                              : "Paid plans are closed while the controlled beta is running."}
                          </p>
                        </div>
                      </div>

                      {subscription?.is_paid_active ? (
                        <p className="text-xs text-secondary dark:text-gray-600 mt-2 text-center">
                          You can cancel anytime. Access continues until this period ends, then reverts to basic.
                        </p>
                      ) : (
                        <p className="text-xs text-secondary dark:text-gray-600 mt-2 text-center">
                          {BILLING_ENABLED
                            ? "Your 30-day trial includes every CVAI feature. Upgrade to keep them after the trial ends."
                            : "Your 30-day trial includes every CVAI feature. Paid plans are not available during the beta."}
                        </p>
                      )}
                    </div>
                  </Panel>
                )}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Stat value={measured.length} label="Skills measured" />
                  <Stat value={verified} label="Verified" tone="text-green-700 dark:text-green-400" hint="assessment-backed" />
                  <Stat value={attempts.filter((a) => a.kind === "quiz" && a.status === "completed").length} label="Quizzes taken" />
                  <Stat
                    value={attempts.filter((a) => a.kind === "project" && a.status === "reviewed").length}
                    label="Projects reviewed"
                  />
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <Panel
                    title="Your evidence"
                    hint="Verified skills are the ones an employer can trust."
                  >
                    {measured.length === 0 ? (
                      <EmptyNote>
                        Nothing measured yet. Your profile is currently all self-declared, which is
                        worth less than it looks.
                      </EmptyNote>
                    ) : (
                      <div className="space-y-3">
                        {measured.slice(0, 6).map(([slug, entry]) => (
                          <div key={slug} className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25/90 p-3.5 shadow-s5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-2 text-sm font-medium capitalize text-ink">
                                {slug.replace(/-/g, " ")}
                                {entry.verified ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-text" strokeWidth={1.75} />
                                ) : null}
                              </span>
                              <Badge className={levelTone(entry.level)}>{entry.level}</Badge>
                            </div>
                            <div className="mt-2.5">
                              <Meter value={percent(entry.score_percent)} />
                            </div>
                          </div>
                        ))}
                        {measured.length > 6 ? (
                          <Link to="/in/coaching/skills" className="inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-brand-text transition-colors hover:text-brand-text">
                            See all <span className="font-mono">{measured.length}</span> <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                          </Link>
                        ) : null}
                      </div>
                    )}
                  </Panel>

                  <div className="space-y-5">
                    <Panel title="Recent activity">
                      {recent.length === 0 ? (
                        <EmptyNote>Take a quiz or submit a project and it shows up here.</EmptyNote>
                      ) : (
                        <div className="space-y-2.5">
                          {recent.map((a) => (
                            <div key={`${a.kind}-${a.id}`} className="flex items-center justify-between rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25/90 p-3.5 shadow-s5">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium capitalize text-ink">
                                  {(a.quiz_slug || a.project_slug || "").replace(/-/g, " ")}
                                </p>
                                <p className="mt-0.5 text-xs capitalize text-secondary dark:text-gray-600">
                                  {a.kind} · {a.passed ? "passed" : a.status === "completed" || a.status === "reviewed" ? "scored" : a.status}
                                </p>
                              </div>
                              <span className="ml-3 shrink-0 text-sm font-semibold font-mono text-ink">
                                {a.score_percent}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Panel>

                    <Panel title="Jump back in">
                      <div className="space-y-2.5">
                        <Link to="/in/coaching/skills" className="flex items-center justify-between rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25/90 p-3.5 shadow-s5 transition-colors hover:border-brand/40 hover:bg-brand/5">
                          <span className="flex items-center gap-2 text-sm font-medium text-ink">
                            <Target className="h-4 w-4 text-secondary dark:text-gray-600" strokeWidth={1.75} /> Assess a skill
                          </span>
                          <ArrowRight className="h-4 w-4 text-secondary dark:text-gray-600" strokeWidth={1.75} />
                        </Link>
                        <Link to="/in/coaching/quizzes" className="flex items-center justify-between rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25/90 p-3.5 shadow-s5 transition-colors hover:border-brand/40 hover:bg-brand/5">
                          <span className="flex items-center gap-2 text-sm font-medium text-ink">
                            <HelpCircle className="h-4 w-4 text-secondary dark:text-gray-600" strokeWidth={1.75} /> Take a quiz
                            {freeQuiz ? <Badge className="border-brand/20 bg-brand/10 dark:bg-brand/15 text-brand-text"><span className="font-mono">1</span> free</Badge> : null}
                          </span>
                          <ArrowRight className="h-4 w-4 text-secondary dark:text-gray-600" strokeWidth={1.75} />
                        </Link>
                        <Link to="/in/coaching/projects" className="flex items-center justify-between rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25/90 p-3.5 shadow-s5 transition-colors hover:border-brand/40 hover:bg-brand/5">
                          <span className="flex items-center gap-2 text-sm font-medium text-ink">
                            <Code2 className="h-4 w-4 text-secondary dark:text-gray-600" strokeWidth={1.75} /> Build a project
                          </span>
                          <ArrowRight className="h-4 w-4 text-secondary dark:text-gray-600" strokeWidth={1.75} />
                        </Link>
                      </div>
                    </Panel>
                  </div>
                </div>

                {!hasEvidence ? (
                  <Panel title="Why none of this is automatic">
                    <p className="text-sm leading-relaxed text-secondary dark:text-gray-700">
                      A profile that says "Expert in React" is a claim. A profile that says "scored 85%
                      on a React assessment, twice, most recently last week" is evidence, and it is
                      what CVAI exists to produce. Nothing here is written for you by hand, and nothing
                      here is marked verified unless something was actually measured.
                    </p>
                  </Panel>
                ) : null}
              </>
            )}
          </div>
        )}
      </CvaiShell>
    </>
  );
}

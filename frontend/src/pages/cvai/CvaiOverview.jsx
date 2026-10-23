import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CvaiShell, { Panel, Stat, Badge, Loading, ErrorNote, LockedNote, EmptyNote, Meter } from "../cvai/CvaiShell";
import { cvai, isLocked, messageOf, levelTone, percent } from "../../utils/cvai";
import { FiArrowRight, FiCheckCircle, FiCode, FiHelpCircle, FiTarget, FiCreditCard } from "react-icons/fi";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [upgrading, setUpgrading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
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
    <CvaiShell
      title="Skill growth"
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
              {/* The one thing that matters most, given the top position. */}
              <section className="border border-gray-200 bg-gray-900 p-6 text-white">
                <p className="text-[11px] font-semibold tracking-widest text-gray-400">
                  RECOMMENDED NEXT
                </p>
                <h2 className="mt-2 text-xl font-bold">{top?.title || "Establish a baseline"}</h2>
                <p className="mt-1.5 max-w-2xl text-sm text-gray-300">
                  {top?.reason ||
                    "Take an assessment so your profile carries measured evidence instead of claims. Everything else here builds on that."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {!hasEvidence ? (
                    <Link to="/in/coaching/skills" className="bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100">
                      Start an assessment
                    </Link>
                  ) : top?.action?.type === "start_assessment" ? (
                    <Link to="/in/coaching/skills" className="bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100">
                      Start an assessment
                    </Link>
                  ) : (
                    <Link to="/in/coaching/plan" className="bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100">
                      Open my plan
                    </Link>
                  )}
                  {freeQuiz ? (
                    <Link
                      to="/in/coaching/quizzes"
                      className="border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
                    >
                      Try a free quiz
                    </Link>
                  ) : null}
                </div>
              </section>

              {!isSubscribed ? (
                <Panel title="Subscribe to unlock CVAI" hint="Quizzes, guided projects, mock interviews and coaching are paid features.">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      You are on the basic plan. Upgrade to unlock quizzes,
                      guided projects, mock interviews and mentorship.
                    </p>

                    <div className="grid gap-2 md:grid-cols-2 mt-1">
                      <div className="rounded border border-green-200 bg-green-50 p-3 text-sm">
                        <p className="font-medium text-green-800 mb-1">✅ Free for everyone</p>
                        <ul className="text-xs text-gray-600 space-y-0.5">
                          <li>• Profile management + job search</li>
                          <li>• Free-preview quizzes & projects</li>
                          <li>• Re-reading your past interview transcripts</li>
                        </ul>
                      </div>
                      <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm">
                        <p className="font-medium text-blue-800 mb-1">🔒 Paid (free during trial)</p>
                        <ul className="text-xs text-gray-600 space-y-0.5">
                          <li>• Skill assessments + results on profile</li>
                          <li>• All quizzes + projects</li>
                          <li>• Mock interviews (start + feedback)</li>
                          <li>• Mentorship plans + coaching</li>
                        </ul>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Every new account gets a <strong>30-day free trial</strong> of all paid features.
                    </div>
                    <button
                      onClick={handleUpgrade}
                      disabled={upgrading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {upgrading ? (
                        <span className="flex items-center gap-2 text-xs">Upgrading…</span>
                      ) : (
                        <span>
                          <FiCreditCard className="h-4 w-4" /> Subscribe now
                        </span>
                      )}
                    </button>
                    {subscription && !subscription.is_trial_active && !subscription.is_paid_active && (
                      <p className="text-xs text-gray-500">
                        Status: {subscription.status}{subscription.paid_plan ? " (paid)" : ""}
                      </p>
                    )}
                  </div>
                </Panel>
              ) : (
                <Panel title="Your plan benefits" hint={subscription?.status === "active" ? "All CVAI features are unlocked." : "Full access during your free trial."}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {subscription?.is_paid_active ? "Paid plan" : "Free trial (30 days)"}
                        </span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${subscription?.is_paid_active ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                          {subscription?.is_paid_active ? "Active" : "Trial"}
                        </span>
                      </div>
                      {subscription?.is_paid_active ? (
                        <button
                          onClick={handleCancel}
                          disabled={upgrading}
                          className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {upgrading ? "Cancelling…" : "Unsubscribe"}
                        </button>
                      ) : null}
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="rounded border border-green-200 bg-green-50 p-3 text-sm">
                        <p className="font-medium text-green-800">✅ Unlimited skill assessments</p>
                        <p className="text-xs text-gray-600">Test your level on many skills with scored questions.</p>
                      </div>
                      <div className="rounded border border-green-200 bg-green-50 p-3 text-sm">
                        <p className="font-medium text-green-800">✅ All quizzes unlocked</p>
                        <p className="text-xs text-gray-600">Access every quiz in the question bank.</p>
                      </div>
                      <div className="rounded border border-green-200 bg-green-50 p-3 text-sm">
                        <p className="font-medium text-green-800">✅ Guided projects</p>
                        <p className="text-xs text-gray-600">Build and get reviewed with skill write-backs.</p>
                      </div>
                      <div className="rounded border border-green-200 bg-green-50 p-3 text-sm">
                        <p className="font-medium text-green-800">✅ Mock interviews</p>
                        <p className="text-xs text-gray-600">Full 6-phase interviews with AI scoring.</p>
                      </div>
                      <div className="rounded border border-green-200 bg-green-50 p-3 text-sm">
                        <p className="font-medium text-green-800">✅ Mentorship plans</p>
                        <p className="text-xs text-gray-600">AI-generated learning plans with budgets and progress.</p>
                      </div>
                      <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm">
                        <p className="font-medium text-blue-800">📦 Self-service</p>
                        <p className="text-xs text-gray-600">Manage your plan anytime. Cancel anytime, no lock-in.</p>
                      </div>
                    </div>

                    {subscription?.is_paid_active ? (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        You can cancel anytime. Access continues until this period ends, then reverts to basic.
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Trial started daily. Upgrade to keep your CVAI benefits after the trial ends.
                      </p>
                    )}
                  </div>
                </Panel>
              )}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat value={measured.length} label="Skills measured" />
                <Stat value={verified} label="Verified" tone="text-green-700" hint="assessment-backed" />
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
                    <div className="space-y-2.5">
                      {measured.slice(0, 6).map(([slug, entry]) => (
                        <div key={slug}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2 text-sm capitalize text-gray-900">
                              {slug.replace(/-/g, " ")}
                              {entry.verified ? (
                                <FiCheckCircle className="h-3.5 w-3.5 text-green-600" />
                              ) : null}
                            </span>
                            <Badge className={levelTone(entry.level)}>{entry.level}</Badge>
                          </div>
                          <div className="mt-1">
                            <Meter value={percent(entry.score_percent)} />
                          </div>
                        </div>
                      ))}
                      {measured.length > 6 ? (
                        <Link to="/in/coaching/skills" className="inline-flex items-center gap-1 pt-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                          See all {measured.length} <FiArrowRight className="h-4 w-4" />
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
                      <div className="space-y-2">
                        {recent.map((a) => (
                          <div key={`${a.kind}-${a.id}`} className="flex items-center justify-between border border-gray-200 p-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium capitalize text-gray-900">
                                {(a.quiz_slug || a.project_slug || "").replace(/-/g, " ")}
                              </p>
                              <p className="text-xs capitalize text-gray-500">
                                {a.kind} · {a.passed ? "passed" : a.status === "completed" || a.status === "reviewed" ? "scored" : a.status}
                              </p>
                            </div>
                            <span className="ml-3 shrink-0 text-sm font-semibold text-gray-900">
                              {a.score_percent}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Panel>

                  <Panel title="Jump back in">
                    <div className="space-y-2">
                      <Link to="/in/coaching/skills" className="flex items-center justify-between border border-gray-200 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50">
                        <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          <FiTarget className="h-4 w-4 text-gray-500" /> Assess a skill
                        </span>
                        <FiArrowRight className="h-4 w-4 text-gray-400" />
                      </Link>
                      <Link to="/in/coaching/quizzes" className="flex items-center justify-between border border-gray-200 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50">
                        <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          <FiHelpCircle className="h-4 w-4 text-gray-500" /> Take a quiz
                          {freeQuiz ? <Badge className="border-green-200 bg-green-50 text-green-700">1 free</Badge> : null}
                        </span>
                        <FiArrowRight className="h-4 w-4 text-gray-400" />
                      </Link>
                      <Link to="/in/coaching/projects" className="flex items-center justify-between border border-gray-200 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50">
                        <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          <FiCode className="h-4 w-4 text-gray-500" /> Build a project
                        </span>
                        <FiArrowRight className="h-4 w-4 text-gray-400" />
                      </Link>
                    </div>
                  </Panel>
                </div>
              </div>

              {!hasEvidence ? (
                <Panel title="Why none of this is automatic">
                  <p className="text-sm text-gray-600">
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
  );
}

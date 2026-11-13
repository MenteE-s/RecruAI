import React, { useCallback, useEffect, useState } from "react";
import CvaiShell, { Panel, Stat, Badge, Button, Loading, ErrorNote, LockedNote, EmptyNote } from "../cvai/CvaiShell";
import { cvai, isLocked, messageOf, levelTone, grade } from "../../utils/cvai";
import { PlayCircle, Unlock, Lock, CreditCard } from "lucide-react";
import PaywallModal from "../../components/ui/PaywallModal";
import { BILLING_BETA_MESSAGE, BILLING_ENABLED } from "../../utils/billing";

/**
 * Quizzes: subscriber content built on the same question bank as assessments.
 *
 * The split the page makes visible is the split the backend makes real — a quiz
 * result records a level but is deliberately not marked verified, because a
 * handful of questions is weaker evidence than a full assessment. Saying so here
 * is better than quietly inflating the learner's profile.
 */
export default function CvaiQuizzes() {
  const [list, setList] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null);   // { quiz, attemptId, questions, answers }
  const [outcome, setOutcome] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await cvai.quizzes();
    const historyRes = await cvai.quizAttempts();
    if (isLocked(res)) { setLocked(true); setLoading(false); return; }
    if (!res.ok) { setError(messageOf(res, "Could not load quizzes.")); setLoading(false); return; }
    setList(res.data || { quizzes: [], unlocked_count: 0, locked_count: 0 });
    setAttempts(historyRes.data?.attempts || []);
    setLocked(false);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function open(quiz) {
    setError("");
    setOutcome(null);
    const res = await cvai.startQuiz(quiz.slug);
    if (!res.ok) { setError(messageOf(res, "Could not start that quiz.")); return; }
    if (res.data?.unavailable) { setError(res.data.unavailable); return; }
    setRunning({
      quiz: res.data.quiz || quiz,
      attemptId: res.data.attempt_id,
      questions: res.data.questions || [],
      answers: {},
    });
  }

  async function submit() {
    if (!running) return;
    setBusy(true);
    const payload = Object.entries(running.answers).map(([questionId, selected]) => ({
      question_id: Number(questionId),
      selected,
    }));
    const res = await cvai.submitQuiz(running.attemptId, payload);
    setBusy(false);
    if (!res.ok) { setError(messageOf(res, "Could not grade that quiz.")); return; }
    setOutcome(res.data);
    setRunning(null);
    await load();
  }

  const quizzes = list?.quizzes || [];
  const unlockedQuizzes = quizzes.filter((q) => !q.locked);
  const lockedQuizzes = quizzes.filter((q) => q.locked);
  const done = attempts.filter((a) => a.status === "completed");
  const best = done.reduce((m, a) => Math.max(m, Number(a.score_percent) || 0), 0);
  const passed = done.filter((a) => a.passed).length;

  async function handleUpgrade() {
    try {
      const res = await cvai.subscriptionUpgrade("paid");
      if (!res.ok) {
        setError(messageOf(res, "Could not upgrade subscription."));
        return;
      }
      await load();
    } catch (err) {
      setError(err.message || "Could not upgrade subscription.");
    }
  }

  return (
    <>
      <CvaiShell
        title="Quizzes"
        subtitle="Timeless question sets. The first one is free, so you can try this before deciding to subscribe."
      >
        {locked ? (
          <LockedNote what="Quizzes" />
        ) : (
          <div className="space-y-5">
            {error ? <ErrorNote onRetry={load}>{error}</ErrorNote> : null}

            {loading ? (
              <Loading label="Loading quizzes" />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Stat value={quizzes.length} label="Quizzes" />
                  <Stat value={`${grade(best)}`} label="Best grade" hint={`best score ${best}%`} />
                  <Stat value={`${passed}/${done.length}`} label="Passed" tone="text-green-700 dark:text-green-400" />
                </div>

                {lockedQuizzes.length > 0 && (
                  <Panel
                    title={BILLING_ENABLED ? "Subscribe to unlock more quizzes" : "More quizzes unlock with the trial"}
                    hint={BILLING_ENABLED
                      ? "These quizzes are part of the paid plan."
                      : "Paid plans are closed while the controlled beta is running."}
                  >
                    <div className="space-y-3">
                      {lockedQuizzes.map((quiz) => (
                        <div key={quiz.id} className="flex items-center justify-between rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-4 shadow-s5">
                          <div>
                            <h4 className="text-sm font-medium text-ink">{quiz.title}</h4>
                            <p className="mt-0.5 text-xs leading-relaxed text-secondary">{quiz.description}</p>
                          </div>
                          <Badge className="border-line dark:border-line bg-canvas dark:bg-gray-25/80 text-secondary">
                            <Lock className="h-3 w-3" strokeWidth={1.75} /> Locked
                          </Badge>
                        </div>
                      ))}
                      {BILLING_ENABLED ? (
                        <Button
                          onClick={() => setShowPaywall(true)}
                          className="w-full mt-3.5 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-xl shadow-s5 hover:bg-brand/90"
                        >
                          <CreditCard className="h-4 w-4" strokeWidth={1.75} /> Subscribe now
                        </Button>
                      ) : (
                        <div className="mt-3.5 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-400">
                          {BILLING_BETA_MESSAGE}
                        </div>
                      )}
                    </div>
                  </Panel>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {unlockedQuizzes.map((quiz) => (
                    <article key={quiz.id} className="flex flex-col rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25/90 shadow-s5 overflow-hidden">
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-base font-semibold text-ink">{quiz.title}</h3>
                          {quiz.is_free_preview ? (
                            <Badge className="border-brand/20 bg-brand/10 dark:bg-brand/15 text-brand-text">
                              <Unlock className="h-3 w-3" strokeWidth={1.75} /> Free
                            </Badge>
                          ) : null}
                        </div>

                        <p className="mt-1.5 text-sm leading-relaxed text-secondary">{quiz.description}</p>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-secondary">
                          {quiz.difficulty ? (
                            <Badge className="capitalize">{quiz.difficulty}</Badge>
                          ) : null}
                          {quiz.question_count ? <span><span className="font-mono">{quiz.question_count}</span> questions</span> : null}
                          <span>pass at <span className="font-mono">{quiz.pass_percent}%</span></span>
                        </div>

                        {quiz.skills?.length ? (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {quiz.skills.map((slug) => (
                              <span
                                key={slug}
                                className="rounded-full border border-line dark:border-line bg-surface dark:bg-gray-25 px-2.5 py-0.5 text-[11px] capitalize text-secondary dark:text-gray-700"
                              >
                                {slug.replace(/-/g, " ")}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="border-t border-line dark:border-line p-4">
                        <Button onClick={() => open(quiz)}>
                          <PlayCircle className="h-4 w-4" strokeWidth={1.75} /> Start quiz
                        </Button>
                      </div>
                    </article>
                  ))}
                  {unlockedQuizzes.length === 0 && (
                    <EmptyNote>
                      No quizzes available yet. Subscribe to unlock the quiz library.
                    </EmptyNote>
                  )}
                </div>

                {running ? (
                  <Panel
                    title={running.quiz.title}
                    hint={`${Object.keys(running.answers).length} of ${running.questions.length} answered · pass at ${running.quiz.pass_percent}%`}>
                    <div className="space-y-4">
                      {running.questions.map((q, index) => (
                        <fieldset key={q.question_id} className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25/90 p-4 shadow-s5">
                          <legend className="px-1 text-sm font-semibold text-ink">
                            {index + 1}. {q.prompt}
                          </legend>
                          <div className="mt-3 space-y-2.5">
                            {(q.options || []).map((option, optionIndex) => {
                              const selected = running.answers[q.question_id] === optionIndex;
                              return (
                                <label
                                  key={optionIndex}
                                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${
                                    selected
                                      ? "border-brand bg-brand/10 dark:bg-brand/15 font-medium text-ink"
                                      : "border-line dark:border-line bg-surface dark:bg-gray-25 text-secondary dark:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-25/60 hover:text-ink"
                                  }`}>
                                  <input
                                    type="radio"
                                    name={`qq-${q.question_id}`}
                                    className="mt-0.5 accent-[#00AA45]"
                                    checked={selected}
                                    onChange={() =>
                                      setRunning((prev) => ({
                                        ...prev,
                                        answers: { ...prev.answers, [q.question_id]: optionIndex },
                                      }))
                                    }
                                  />
                                  <span className="leading-relaxed">{option}</span>
                                </label>
                              );
                            })}
                          </div>
                        </fieldset>
                      ))}

                      <div className="flex flex-wrap gap-2.5 pt-1">
                        <Button
                          onClick={submit}
                          disabled={busy || Object.keys(running.answers).length === 0}>
                          {busy ? "Grading…" : "Submit answers"}
                        </Button>
                        <Button variant="secondary" onClick={() => setRunning(null)}>
                          Abandon
                        </Button>
                      </div>
                    </div>
                  </Panel>
                ) : null}

                {outcome ? <QuizOutcome outcome={outcome} onClose={() => setOutcome(null)} /> : null}

                <Panel title="Your quiz history" hint="Append-only: a retake is a new entry, not an overwrite.">
                  {attempts.length === 0 ? (
                    <EmptyNote>You have not taken a quiz yet.</EmptyNote>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-line dark:border-line text-left text-xs uppercase tracking-wider text-secondary">
                            <th className="pb-3 px-3.5 font-medium">Quiz</th>
                            <th className="pb-3 px-3.5 font-medium">Score</th>
                            <th className="pb-3 px-3.5 font-medium">Result</th>
                            <th className="pb-3 px-3.5 font-medium">Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attempts.map((a) => (
                            <tr key={a.id} className="border-b border-line dark:border-line last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-25/20">
                              <td className="py-3 px-3.5 capitalize text-ink">
                                {(a.quiz_slug || "").replace(/-/g, " ")}
                              </td>
                              <td className="py-3 px-3.5 font-mono text-secondary">{a.score_percent}%</td>
                              <td className="py-3 px-3.5">
                                <Badge
                                  className={
                                    a.passed
                                      ? "border-brand/20 bg-brand/10 dark:bg-brand/15 text-brand-text"
                                      : "border-line dark:border-line bg-gray-50 dark:bg-gray-25 text-secondary"
                                  }>
                                  {a.passed ? "Passed" : "Not passed"}
                                </Badge>
                              </td>
                              <td className="py-3 px-3.5">
                                {a.level_awarded ? (
                                  <Badge className={levelTone(a.level_awarded)}>{a.level_awarded}</Badge>
                                ) : (
                                  <span className="text-secondary">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>
              </>
            )}
          </div>
        )}
      </CvaiShell>
      <PaywallModal
        open={showPaywall}
        feature="quizzes"
        onClose={() => setShowPaywall(false)}
        onUpgrade={handleUpgrade}
      />
    </>
  );
}

function QuizOutcome({ outcome, onClose }) {
  const attempt = outcome.attempt || {};
  return (
    <Panel title="Quiz result">
      <div className="grid gap-5 md:grid-cols-[200px_1fr]">
        <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-5 text-center shadow-s5">
          <p className="text-4xl font-bold font-mono text-ink">{attempt.score_percent}%</p>
          <p className="mt-1 text-xs text-secondary">
            <span className="font-mono">{attempt.correct_count}</span>/<span className="font-mono">{attempt.total_questions}</span> correct
          </p>
          <Badge
            className={`mt-3 ${attempt.passed ? "border-brand/20 bg-brand/10 dark:bg-brand/15 text-brand-text" : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"}`}>
            {attempt.passed ? `Passed (${outcome.pass_mark}%)` : `Below ${outcome.pass_mark}%`}
          </Badge>
        </div>

        <div className="space-y-3">
          {(outcome.feedback || []).map((item, index) => (
            <div
              key={item.question_id}
              className={`rounded-xl border p-4 ${item.correct ? "border-brand/20 bg-brand/10 dark:bg-brand/15" : "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"}`}>
              <p className="text-sm font-medium text-ink">
                {index + 1}. {item.prompt}
              </p>
              <p className={`mt-1 text-xs font-semibold ${item.correct ? "text-brand-text" : "text-red-700 dark:text-red-400"}`}>
                {item.correct ? "Correct" : "Incorrect"}
              </p>
              {item.explanation ? (
                <p className="mt-2 border-t border-line dark:border-line pt-2 text-xs leading-relaxed text-secondary">
                  {item.explanation}
                </p>
              ) : null}
            </div>
          ))}

          {(outcome.skills_updated || []).length ? (
            <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-4 text-xs leading-relaxed text-secondary">
              Recorded on your profile:{" "}
              <span className="font-medium text-ink">{outcome.skills_updated.map((s) => s.name).join(", ")}</span> — as a quiz measurement,{" "}
              <strong className="text-ink">not</strong> verified. A full assessment is what earns that.
            </div>
          ) : null}

          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Panel>
  );
}

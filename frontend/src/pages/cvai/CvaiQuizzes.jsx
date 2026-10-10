import React, { useCallback, useEffect, useState } from "react";
import CvaiShell, { Panel, Stat, Badge, Button, Loading, ErrorNote, LockedNote, EmptyNote } from "../cvai/CvaiShell";
import { cvai, isLocked, messageOf, levelTone, grade } from "../../utils/cvai";
import { FiLock, FiPlayCircle, FiUnlock } from "react-icons/fi";

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
  const done = attempts.filter((a) => a.status === "completed");
  const best = done.reduce((m, a) => Math.max(m, Number(a.score_percent) || 0), 0);
  const passed = done.filter((a) => a.passed).length;

  return (
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
                <Stat value={`${passed}/${done.length}`} label="Passed" tone="text-green-700" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {quizzes.map((quiz) => {
                  const isLocked = quiz.locked === true;
                  return (
                    <article key={quiz.id} className="flex flex-col border border-gray-200 bg-white">
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-base font-semibold text-gray-900">{quiz.title}</h3>
                          {isLocked ? (
                            <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                              <FiLock className="h-3 w-3" /> Locked
                            </Badge>
                          ) : quiz.is_free_preview ? (
                            <Badge className="border-green-200 bg-green-50 text-green-700">
                              <FiUnlock className="h-3 w-3" /> Free
                            </Badge>
                          ) : null}
                        </div>

                        <p className="mt-2 text-sm text-gray-600">{quiz.description}</p>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          {quiz.difficulty ? (
                            <Badge className="capitalize">{quiz.difficulty}</Badge>
                          ) : null}
                          {quiz.question_count ? <span>{quiz.question_count} questions</span> : null}
                          <span>pass at {quiz.pass_percent}%</span>
                        </div>

                        {quiz.skills?.length ? (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {quiz.skills.map((slug) => (
                              <span
                                key={slug}
                                className="border border-gray-200 px-2 py-0.5 text-[11px] capitalize text-gray-600"
                              >
                                {slug.replace(/-/g, " ")}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="border-t border-gray-100 p-4">
                        {isLocked ? (
                          <p className="text-xs text-gray-500">
                            Subscribe to take this. Locked quizzes show what they cover, never their
                            contents.
                          </p>
                        ) : (
                          <Button onClick={() => open(quiz)}>
                            <FiPlayCircle className="h-4 w-4" /> Start quiz
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {running ? (
                <Panel
                  title={running.quiz.title}
                  hint={`${Object.keys(running.answers).length} of ${running.questions.length} answered · pass at ${running.quiz.pass_percent}%`}
                >
                  <div className="space-y-4">
                    {running.questions.map((q, index) => (
                      <fieldset key={q.question_id} className="border border-gray-200 p-4">
                        <legend className="px-1 text-sm font-medium text-gray-900">
                          {index + 1}. {q.prompt}
                        </legend>
                        <div className="mt-2.5 space-y-1.5">
                          {(q.options || []).map((option, optionIndex) => {
                            const selected = running.answers[q.question_id] === optionIndex;
                            return (
                              <label
                                key={optionIndex}
                                className={`flex cursor-pointer items-start gap-2.5 border px-3 py-2 text-sm transition-colors ${
                                  selected
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`qq-${q.question_id}`}
                                  className="mt-0.5"
                                  checked={selected}
                                  onChange={() =>
                                    setRunning((prev) => ({
                                      ...prev,
                                      answers: { ...prev.answers, [q.question_id]: optionIndex },
                                    }))
                                  }
                                />
                                <span>{option}</span>
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                    ))}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={submit}
                        disabled={busy || Object.keys(running.answers).length === 0}
                      >
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
                        <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                          <th className="pb-2 font-medium">Quiz</th>
                          <th className="pb-2 font-medium">Score</th>
                          <th className="pb-2 font-medium">Result</th>
                          <th className="pb-2 font-medium">Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attempts.map((a) => (
                          <tr key={a.id} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 capitalize text-gray-900">
                              {(a.quiz_slug || "").replace(/-/g, " ")}
                            </td>
                            <td className="py-2 text-gray-700">{a.score_percent}%</td>
                            <td className="py-2">
                              <Badge
                                className={
                                  a.passed
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : "border-gray-200 bg-gray-50 text-gray-600"
                                }
                              >
                                {a.passed ? "Passed" : "Not passed"}
                              </Badge>
                            </td>
                            <td className="py-2">
                              {a.level_awarded ? (
                                <Badge className={levelTone(a.level_awarded)}>{a.level_awarded}</Badge>
                              ) : (
                                <span className="text-gray-400">—</span>
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
  );
}

function QuizOutcome({ outcome, onClose }) {
  const attempt = outcome.attempt || {};
  return (
    <Panel title="Quiz result">
      <div className="grid gap-5 md:grid-cols-[200px_1fr]">
        <div className="border border-gray-200 p-4 text-center">
          <p className="text-4xl font-bold text-gray-900">{attempt.score_percent}%</p>
          <p className="mt-1 text-xs text-gray-500">
            {attempt.correct_count}/{attempt.total_questions} correct
          </p>
          <Badge
            className={`mt-3 ${attempt.passed ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}
          >
            {attempt.passed ? `Passed (${outcome.pass_mark}%)` : `Below ${outcome.pass_mark}%`}
          </Badge>
        </div>

        <div className="space-y-3">
          {(outcome.feedback || []).map((item, index) => (
            <div
              key={item.question_id}
              className={`border p-3 ${item.correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
            >
              <p className="text-sm font-medium text-gray-900">
                {index + 1}. {item.prompt}
              </p>
              <p className={`mt-1 text-xs ${item.correct ? "text-green-700" : "text-red-700"}`}>
                {item.correct ? "Correct" : "Incorrect"}
              </p>
              {item.explanation ? (
                <p className="mt-1.5 border-t border-black/5 pt-1.5 text-xs text-gray-600">
                  {item.explanation}
                </p>
              ) : null}
            </div>
          ))}

          {(outcome.skills_updated || []).length ? (
            <div className="border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              Recorded on your profile:{" "}
              {outcome.skills_updated.map((s) => s.name).join(", ")} — as a quiz measurement,{" "}
              <strong>not</strong> verified. A full assessment is what earns that.
            </div>
          ) : null}

          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Panel>
  );
}

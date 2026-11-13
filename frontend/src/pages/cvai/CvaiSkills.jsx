import React, { useCallback, useEffect, useState } from "react";
import CvaiShell, { Panel, Stat, Badge, Button, Loading, ErrorNote, LockedNote, EmptyNote, Meter } from "../cvai/CvaiShell";
import {
  cvai, isLocked, messageOf, levelTone, evidenceLabel, grade, percent,
} from "../../utils/cvai";
import { CheckCircle2, Target, Search } from "lucide-react";

/**
 * Skills: what you claim, what has actually been measured, and the assessment
 * that turns one into the other.
 *
 * The distinction is the whole point of the page. A self-declared skill and a
 * verified one look different here on purpose, because that is the difference
 * an employer is paying to see.
 */
export default function CvaiSkills() {
  const [levels, setLevels] = useState(null);
  const [history, setHistory] = useState([]);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [quiz, setQuiz] = useState(null);       // the running assessment
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [levelsRes, historyRes] = await Promise.all([
      cvai.levels(),
      cvai.assessmentHistory(),
    ]);

    if (isLocked(levelsRes)) {
      setLocked(true);
      setLoading(false);
      return;
    }
    if (!levelsRes.ok) {
      setError(messageOf(levelsRes, "Could not load your skill levels."));
      setLoading(false);
      return;
    }

    setLevels(levelsRes.data || { levels: {}, assessed_skill_count: 0, assessment_count: 0 });
    setHistory((historyRes.data?.assessments || []).filter((a) => a.status === "completed"));
    setLocked(false);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function start(skillSlug) {
    setResult(null);
    setAnswers({});
    setError("");
    const res = await cvai.startAssessment(skillSlug);
    if (!res.ok) {
      setError(messageOf(res, "Could not start the assessment."));
      return;
    }
    setQuiz({ ...(res.data?.assessment || {}), skillSlug });
  }

  async function submit() {
    if (!quiz) return;
    setSubmitting(true);
    setError("");
    const payload = Object.entries(answers).map(([questionId, selected]) => ({
      question_id: Number(questionId),
      selected,
    }));
    const res = await cvai.submitAssessment(quiz.id, payload);
    setSubmitting(false);
    if (!res.ok) {
      setError(messageOf(res, "Could not grade that submission."));
      return;
    }
    setResult(res.data);
    await load();
  }

  const measured = levels?.levels || {};
  const measuredList = Object.entries(measured);
  const verifiedCount = measuredList.filter(([, v]) => v.verified).length;
  const bestScore = measuredList.reduce(
    (best, [, v]) => Math.max(best, Number(v.score_percent) || 0), 0);

  return (
    <CvaiShell
      title="Skills"
      subtitle="What you have claimed, what has been measured, and how far apart the two are."
    >
      {locked ? (
        <LockedNote what="Skill assessment" />
      ) : (
        <div className="space-y-5">
          {error ? <ErrorNote onRetry={load}>{error}</ErrorNote> : null}

          {loading ? (
            <Loading label="Loading your skills" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat value={measuredList.length} label="Skills measured" hint="by assessment" />
                <Stat
                  value={verifiedCount}
                  label="Verified"
                  tone="text-green-700 dark:text-green-400"
                  hint="assessment-backed"
                />
                <Stat value={levels?.assessment_count || 0} label="Assessments taken" />
                <Stat value={`${grade(bestScore)}`} label="Best grade" hint={`best score ${bestScore}%`} />
              </div>

              <Panel
                title="Measured levels"
                hint="Your most recent completed assessment per skill. Retaking replaces the level rather than ratcheting it."
              >
                {measuredList.length === 0 ? (
                  <EmptyNote>
                    Nothing measured yet. Start an assessment below and your profile gains real
                    evidence instead of claims.
                  </EmptyNote>
                ) : (
                  <div className="space-y-3">
                    {measuredList.map(([slug, entry]) => (
                      <div key={slug} className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25/90 p-4 shadow-s5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium capitalize text-ink">
                              {slug.replace(/-/g, " ")}
                            </span>
                            <Badge className={levelTone(entry.level)}>{entry.level || "—"}</Badge>
                            {entry.verified ? (
                              <Badge className="border-brand/20 bg-brand/10 dark:bg-brand/15 text-brand-text">
                                <CheckCircle2 className="h-3 w-3" strokeWidth={2} /> Verified
                              </Badge>
                            ) : null}
                          </div>
                          <span className="text-sm font-semibold font-mono text-ink">
                            {entry.score_percent}%
                          </span>
                        </div>
                        <div className="mt-2.5">
                          <Meter
                            value={percent(entry.score_percent)}
                            tone={entry.score_percent >= 70 ? "bg-brand" : "bg-amber-500"}
                          />
                        </div>
                        <Button
                          variant="secondary"
                          className="mt-3.5"
                          onClick={() => start(slug)}>
                          <Target className="h-4 w-4" strokeWidth={1.75} /> Retake assessment
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel
                title="Assess a new skill"
                hint="Pick anything you want measured. Your answer key is never sent to the browser."
              >
                <SkillPicker onStart={start} />
              </Panel>

              {quiz ? (
                <AssessmentRunner
                  quiz={quiz}
                  answers={answers}
                  setAnswers={setAnswers}
                  onSubmit={submit}
                  onCancel={() => setQuiz(null)}
                  submitting={submitting}
                />
              ) : null}

              {result ? <AssessmentResult result={result} onClose={() => setResult(null)} /> : null}

              <Panel title="Assessment history" hint="Every completed attempt, newest first.">
                {history.length === 0 ? (
                  <EmptyNote>No assessments completed yet.</EmptyNote>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line dark:border-line text-left text-xs uppercase tracking-wider text-secondary">
                          <th className="pb-3 px-3.5 font-medium">Skill</th>
                          <th className="pb-3 px-3.5 font-medium">Score</th>
                          <th className="pb-3 px-3.5 font-medium">Level</th>
                          <th className="pb-3 px-3.5 font-medium">Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((row) => (
                          <tr key={row.id} className="border-b border-line dark:border-line last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-25/20">
                            <td className="py-3 px-3.5 capitalize text-ink">
                              {(row.skill_slug || "").replace(/-/g, " ") || "—"}
                            </td>
                            <td className="py-3 px-3.5 font-mono text-secondary">{row.score_percent}%</td>
                            <td className="py-3 px-3.5">
                              <Badge className={levelTone(row.level_awarded)}>
                                {row.level_awarded || "—"}
                              </Badge>
                            </td>
                            <td className="py-3 px-3.5 font-mono text-xs text-secondary">
                              {new Date(row.completed_at).toLocaleDateString()}
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

function SkillPicker({ onStart }) {
  const [term, setTerm] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  async function search(event) {
    event.preventDefault();
    if (!term.trim()) return;
    setBusy(true);
    const res = await cvai.taxonomy(term.trim());
    setBusy(false);
    if (!res.ok) return;
    const skills = res.data?.skills || [];
    setResult(skills.slice(0, 12));
  }

  return (
    <div>
      <form onSubmit={search} className="flex flex-wrap gap-2.5">
        <div className="relative min-w-[240px] flex-1">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search 137 catalogued skills — try react, postgres, k8s"
            className="w-full rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 px-3.5 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <Button type="submit" disabled={busy || !term.trim()}>
          <Search className="h-4 w-4" strokeWidth={1.75} />
          {busy ? "Searching…" : "Find skills"}
        </Button>
      </form>

      {result ? (
        result.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {result.map((skill) => (
              <button
                key={skill.slug}
                type="button"
                onClick={() => onStart(skill.slug)}
                className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 px-3.5 py-1.5 text-sm text-secondary dark:text-gray-700 transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-brand-text"
              >
                {skill.name}
                {skill.category ? (
                  <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-500">{skill.category}</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-secondary">
            No catalogued skill matches “{term}”. Add it on your profile as a self-declared skill
            instead — unlisted skills are still stored, just without a slug.
          </p>
        )
      ) : null}
    </div>
  );
}

function AssessmentRunner({ quiz, answers, setAnswers, onSubmit, onCancel, submitting }) {
  const questions = quiz.questions || [];
  const answered = questions.filter((q) => answers[q.question_id] !== undefined).length;

  return (
    <Panel
      title="Assessment in progress"
      hint={`${answered} of ${questions.length} answered`}>
      <div className="space-y-5">
        {questions.map((q, index) => (
          <fieldset key={q.question_id} className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25/90 p-4 shadow-s5">
            <legend className="px-1 text-sm font-semibold text-ink">
              {index + 1}. {q.prompt}
            </legend>
            <div className="mt-3 space-y-2.5">
              {(q.options || []).map((option, optionIndex) => {
                const selected = answers[q.question_id] === optionIndex;
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
                      name={`q-${q.question_id}`}
                      className="mt-0.5 accent-[#00AA45]"
                      checked={selected}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [q.question_id]: optionIndex }))
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
          <Button onClick={onSubmit} disabled={submitting || answered === 0}>
            {submitting ? "Grading…" : `Submit ${answered}/${questions.length} answered`}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Abandon
          </Button>
        </div>
        <p className="text-xs text-secondary">
          Unanswered questions count as wrong. That is deliberate — shrinking the denominator would
          let one answer score 100%.
        </p>
      </div>
    </Panel>
  );
}

function AssessmentResult({ result, onClose }) {
  const assessment = result.assessment || {};
  const skill = result.skill_profile || {};
  const feedback = result.feedback || [];

  return (
    <Panel title="Your result">
      <div className="grid gap-5 md:grid-cols-[200px_1fr]">
        <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-5 text-center shadow-s5">
          <p className="text-4xl font-bold font-mono text-ink">{assessment.score_percent}%</p>
          <p className="mt-1 text-xs text-secondary">
            <span className="font-mono">{assessment.correct_count}</span>/<span className="font-mono">{assessment.total_questions}</span> correct
          </p>
          {assessment.level_awarded ? (
            <Badge className={`mt-3 ${levelTone(assessment.level_awarded)}`}>
              {assessment.level_awarded}
            </Badge>
          ) : null}
          {skill?.level ? (
            <p className="mt-3.5 border-t border-line dark:border-line pt-3 text-xs text-secondary">
              Profile now shows <strong className="text-ink">{skill.level}</strong>{" "}
              {skill.verified ? (
                <span className="font-medium text-brand-text">(verified)</span>
              ) : (
                <span className="text-secondary">({evidenceLabel(skill)})</span>
              )}
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          {feedback.map((item, index) => (
            <div
              key={item.question_id}
              className={`rounded-xl border p-4 ${item.correct ? "border-brand/20 bg-brand/10 dark:bg-brand/15" : "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"}`}>
              <p className="text-sm font-medium text-ink">
                {index + 1}. {item.prompt}
              </p>
              <p className={`mt-1 text-xs font-semibold ${item.correct ? "text-brand-text" : "text-red-700 dark:text-red-400"}`}>
                {item.correct ? "Correct" : "Incorrect"}
                {!item.correct && item.correct_index !== undefined && item.correct_index !== null ? (
                  <> — the answer was option {(item.correct_index ?? 0) + 1}</>
                ) : null}
              </p>
              {item.explanation ? (
                <p className="mt-2 border-t border-line dark:border-line pt-2 text-xs leading-relaxed text-secondary">
                  {item.explanation}
                </p>
              ) : null}
            </div>
          ))}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Panel>
  );
}

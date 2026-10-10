import React, { useCallback, useEffect, useState } from "react";
import CvaiShell, { Panel, Stat, Badge, Button, Loading, ErrorNote, LockedNote, EmptyNote, Meter } from "../cvai/CvaiShell";
import {
  cvai, isLocked, messageOf, levelTone, evidenceLabel, grade, percent,
} from "../../utils/cvai";
import { FiCheckCircle, FiTarget } from "react-icons/fi";

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
      title="Your skills"
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
                  tone="text-green-700"
                  hint="assessment-backed"
                />
                <Stat value={levels?.assessment_count || 0} label="Assessments taken" />
                <Stat value={`${grade(bestScore)}`} label="Best grade" hint="across all attempts" />
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
                      <div key={slug} className="border border-gray-200 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium capitalize text-gray-900">
                              {slug.replace(/-/g, " ")}
                            </span>
                            <Badge className={levelTone(entry.level)}>{entry.level || "—"}</Badge>
                            {entry.verified ? (
                              <Badge className="border-green-200 bg-green-50 text-green-700">
                                <FiCheckCircle className="h-3 w-3" /> Verified
                              </Badge>
                            ) : null}
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {entry.score_percent}%
                          </span>
                        </div>
                        <div className="mt-2.5">
                          <Meter
                            value={percent(entry.score_percent)}
                            tone={entry.score_percent >= 70 ? "bg-green-600" : "bg-amber-500"}
                          />
                        </div>
                        <Button
                          variant="secondary"
                          className="mt-3"
                          onClick={() => start(slug)}
                        >
                          <FiTarget className="h-4 w-4" /> Retake assessment
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
                        <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                          <th className="pb-2 font-medium">Skill</th>
                          <th className="pb-2 font-medium">Score</th>
                          <th className="pb-2 font-medium">Level</th>
                          <th className="pb-2 font-medium">Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((row) => (
                          <tr key={row.id} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 capitalize text-gray-900">
                              {(row.skill_slug || "").replace(/-/g, " ") || "—"}
                            </td>
                            <td className="py-2 text-gray-700">{row.score_percent}%</td>
                            <td className="py-2">
                              <Badge className={levelTone(row.level_awarded)}>
                                {row.level_awarded || "—"}
                              </Badge>
                            </td>
                            <td className="py-2 text-gray-500">
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
    const skills = (res.data?.categories || []).flatMap((c) => c.skills || []);
    setResult(skills.slice(0, 12));
  }

  return (
    <div>
      <form onSubmit={search} className="flex flex-wrap gap-2">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search 137 catalogued skills — try react, postgres, k8s"
          className="min-w-[240px] flex-1 border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <Button type="submit" disabled={busy || !term.trim()}>
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
                className="border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
              >
                {skill.name}
                {skill.category ? (
                  <span className="ml-1.5 text-xs text-gray-400">{skill.category}</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
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
      hint={`${answered} of ${questions.length} answered`}
    >
      <div className="space-y-5">
        {questions.map((q, index) => (
          <fieldset key={q.question_id} className="border border-gray-200 p-4">
            <legend className="px-1 text-sm font-medium text-gray-900">
              {index + 1}. {q.prompt}
            </legend>
            <div className="mt-2.5 space-y-1.5">
              {(q.options || []).map((option, optionIndex) => {
                const selected = answers[q.question_id] === optionIndex;
                return (
                  <label
                    key={optionIndex}
                    className={`flex cursor-pointer items-start gap-2.5 border px-3 py-2 text-sm transition-colors ${
                      selected
                        ? "border-blue-500 bg-blue-50 text-gray-900"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.question_id}`}
                      className="mt-0.5"
                      checked={selected}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [q.question_id]: optionIndex }))
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
          <Button onClick={onSubmit} disabled={submitting || answered === 0}>
            {submitting ? "Grading…" : `Submit ${answered}/${questions.length} answered`}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Abandon
          </Button>
        </div>
        <p className="text-xs text-gray-500">
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
        <div className="border border-gray-200 p-4 text-center">
          <p className="text-4xl font-bold text-gray-900">{assessment.score_percent}%</p>
          <p className="mt-1 text-xs text-gray-500">
            {assessment.correct_count}/{assessment.total_questions} correct
          </p>
          {assessment.level_awarded ? (
            <Badge className={`mt-3 ${levelTone(assessment.level_awarded)}`}>
              {assessment.level_awarded}
            </Badge>
          ) : null}
          {skill?.level ? (
            <p className="mt-3 border-t border-gray-200 pt-3 text-xs text-gray-600">
              Profile now shows <strong>{skill.level}</strong>{" "}
              {skill.verified ? (
                <span className="text-green-700">(verified)</span>
              ) : (
                <span className="text-gray-500">({evidenceLabel(skill)})</span>
              )}
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          {feedback.map((item, index) => (
            <div
              key={item.question_id}
              className={`border p-3 ${item.correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
            >
              <p className="text-sm font-medium text-gray-900">
                {index + 1}. {item.prompt}
              </p>
              <p className={`mt-1 text-xs ${item.correct ? "text-green-700" : "text-red-700"}`}>
                {item.correct ? "Correct" : "Incorrect"}
                {!item.correct && item.correct_index !== undefined && item.correct_index !== null ? (
                  <> — the answer was option {(item.correct_index ?? 0) + 1}</>
                ) : null}
              </p>
              {item.explanation ? (
                <p className="mt-1.5 border-t border-black/5 pt-1.5 text-xs text-gray-600">
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

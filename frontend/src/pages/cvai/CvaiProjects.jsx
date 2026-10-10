import React, { useCallback, useEffect, useState } from "react";
import CvaiShell, { Panel, Stat, Badge, Button, Loading, ErrorNote, LockedNote, EmptyNote } from "../cvai/CvaiShell";
import { cvai, isLocked, messageOf, grade } from "../../utils/cvai";
import { FiCode, FiLock, FiSave, FiSend } from "react-icons/fi";

/**
 * Guided projects: build something, then have it judged against criteria you
 * could read before you started.
 *
 * The review UI makes one backend rule visible: a criterion is only counted as
 * met when the reviewer could quote the learner's own text. Where a claim was
 * unsupported, that is said plainly instead of quietly scored as a pass.
 */
export default function CvaiProjects() {
  const [list, setList] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);         // the project brief + workspace
  const [review, setReview] = useState(null);     // the returned review
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await cvai.projects();
    const historyRes = await cvai.projectAttempts();
    if (isLocked(res)) { setLocked(true); setLoading(false); return; }
    if (!res.ok) { setError(messageOf(res, "Could not load projects.")); setLoading(false); return; }
    setList(res.data || { projects: [], unlocked_count: 0, locked_count: 0 });
    setAttempts(historyRes.data?.attempts || []);
    setLocked(false);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function begin(project) {
    setError("");
    setReview(null);

    const started = await cvai.startProject(project.slug);
    if (!started.ok) { setError(messageOf(started, "Could not open that project.")); return; }

    const brief = started.data?.project || project;
    const attemptId = started.data?.attempt?.id;

    // If this project was already graded, bring the review back rather than
    // making the learner resubmit work that has a score against it.
    let previous = null;
    const existing = await cvai.projectAttempt(project.slug);
    if (existing.ok) previous = existing.data?.attempt || null;
    if (previous?.status === "reviewed" && previous.review) {
      setReview({
        attempt: previous,
        pass_mark: brief.pass_percent,
        review: previous.review,
      });
    }

    setOpen({
      brief,
      attemptId,
      step: started.data?.attempt?.current_step || 0,
      notes: previous?.notes || "",
      submission: previous?.submission || "",
      resumed: started.data?.resumed === true,
    });
  }

  async function saveProgress(patch) {
    if (!open?.attemptId) return;
    setBusy("save");
    const res = await cvai.saveProject(open.attemptId, patch);
    setBusy("");
    if (!res.ok) { setError(messageOf(res, "Could not save your progress.")); return; }
    const attempt = res.data?.attempt || {};
    setOpen((prev) => ({
      ...prev,
      step: attempt.current_step ?? prev.step,
      notes: attempt.notes ?? prev.notes,
    }));
  }

  async function submitWork() {
    if (!open?.attemptId) return;
    setBusy("submit");
    setError("");
    const res = await cvai.submitProject(open.attemptId, open.submission);
    setBusy("");
    if (!res.ok) {
      setError(messageOf(res, "Your work was not graded."));
      if (res.status === 503) {
        // Honest failure: the work is saved, nothing was scored.
        setOpen((prev) => ({ ...prev, submission: prev.submission }));
      }
      return;
    }
    setReview(res.data);
    await load();
  }

  const projects = list?.projects || [];
  const graded = attempts.filter((a) => a.score_percent !== null && a.score_percent !== undefined);
  const best = graded.reduce((m, a) => Math.max(m, Number(a.score_percent) || 0), 0);

  return (
    <CvaiShell
      title="Guided projects"
      subtitle="Build something real, then have it reviewed against criteria you can read before you start."
    >
      {locked ? (
        <LockedNote what="Guided projects" />
      ) : (
        <div className="space-y-5">
          {error ? <ErrorNote>{error}</ErrorNote> : null}

          {loading ? (
            <Loading label="Loading projects" />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Stat value={projects.length} label="Projects" />
                <Stat value={attempts.filter((a) => a.status === "reviewed").length} label="Reviewed" />
                <Stat value={`${grade(best)}`} label="Best grade" hint={`best score ${best}%`} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {projects.map((project) => {
                  const isLocked = project.locked === true;
                  return (
                    <article key={project.id} className="flex flex-col border border-gray-200 bg-white">
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-base font-semibold text-gray-900">{project.title}</h3>
                          {isLocked ? (
                            <Badge className="border-gray-200 bg-gray-50 text-gray-600">
                              <FiLock className="h-3 w-3" /> Locked
                            </Badge>
                          ) : project.is_free_preview ? (
                            <Badge className="border-green-200 bg-green-50 text-green-700">Free</Badge>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{project.summary}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          {project.difficulty ? <Badge className="capitalize">{project.difficulty}</Badge> : null}
                          <span>{project.step_count} steps</span>
                          {project.estimated_hours ? <span>~{project.estimated_hours}h</span> : null}
                          <span>pass at {project.pass_percent}%</span>
                        </div>
                      </div>
                      <div className="border-t border-gray-100 p-4">
                        {isLocked ? (
                          <p className="text-xs text-gray-500">Subscribe to see the full brief.</p>
                        ) : (
                          <Button onClick={() => begin(project)}>
                            <FiCode className="h-4 w-4" /> {project.is_free_preview ? "Try it" : "Start project"}
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {open ? (
                <Workspace
                  open={open}
                  setOpen={setOpen}
                  busy={busy}
                  onSave={saveProgress}
                  onSubmit={submitWork}
                  onClose={() => { setOpen(null); setReview(null); }}
                />
              ) : null}

              {review ? <ProjectReview review={review} onClose={() => setReview(null)} /> : null}

              <Panel title="Project history">
                {attempts.length === 0 ? (
                  <EmptyNote>You have not started a project yet.</EmptyNote>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                          <th className="pb-2 font-medium">Project</th>
                          <th className="pb-2 font-medium">Status</th>
                          <th className="pb-2 font-medium">Score</th>
                          <th className="pb-2 font-medium">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attempts.map((a) => (
                          <tr key={a.id} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 capitalize text-gray-900">
                              {(a.project_slug || "").replace(/-/g, " ")}
                            </td>
                            <td className="py-2 capitalize text-gray-600">{a.status}</td>
                            <td className="py-2 text-gray-700">
                              {a.score_percent === null || a.score_percent === undefined
                                ? "—"
                                : `${a.score_percent}%`}
                            </td>
                            <td className="py-2">
                              {a.review_status === "unavailable" ? (
                                <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                                  not scored
                                </Badge>
                              ) : a.passed ? (
                                <Badge className="border-green-200 bg-green-50 text-green-700">Passed</Badge>
                              ) : a.passed === false ? (
                                <Badge className="border-gray-200 bg-gray-50 text-gray-600">Not passed</Badge>
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

function Workspace({ open, setOpen, busy, onSave, onSubmit, onClose }) {
  const { brief } = open;
  const steps = brief.steps || [];
  const criteria = brief.acceptance_criteria || [];

  return (
    <Panel
      title={brief.title}
      hint={brief.summary}
      actions={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Steps</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Move your position as you go; it saves.
          </p>
          <div className="mt-3 space-y-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`border p-3 ${
                  open.step === index ? "border-blue-300 bg-blue-50" : "border-gray-200"
                }`}>
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-[11px] font-bold ${
                      open.step === index ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                    }`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{step.title}</p>
                    <p className="mt-0.5 text-xs text-gray-600">{step.instruction}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" disabled={open.step <= 0}
              onClick={() => { setOpen((p) => ({ ...p, step: p.step - 1 })); onSave({ current_step: open.step - 1 }); }}>
              ← Previous
            </Button>
            <Button variant="secondary" disabled={open.step >= steps.length - 1}
              onClick={() => { const n = open.step + 1; setOpen((p) => ({ ...p, step: n })); onSave({ current_step: n }); }}>
              Next →
            </Button>
          </div>

          <h3 className="mt-6 text-sm font-semibold text-gray-900">Your notes</h3>
          <textarea
            value={open.notes}
            onChange={(e) => setOpen((p) => ({ ...p, notes: e.target.value }))}
            rows={4}
            placeholder="What you tried, what broke, what you learned."
            className="mt-2 w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <Button variant="secondary" className="mt-2" disabled={busy === "save"}
            onClick={() => onSave({ notes: open.notes })}>
            <FiSave className="h-4 w-4" /> {busy === "save" ? "Saving…" : "Save notes"}
          </Button>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900">What you will be judged against</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Read these first. The reviewer decides each one and must quote your own words to say
            it is met.
          </p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5">
            {criteria.map((c, index) => (
              <li key={index} className="text-sm text-gray-700">{c.text}</li>
            ))}
          </ol>

          <h3 className="mt-6 text-sm font-semibold text-gray-900">Submit your work</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Explain what you built and how each criterion above is satisfied. This costs AI tokens.
          </p>
          <textarea
            value={open.submission}
            onChange={(e) => setOpen((p) => ({ ...p, submission: e.target.value }))}
            rows={10}
            placeholder="Walk through your solution and point at each criterion."
            className="mt-2 w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button disabled={busy === "submit" || open.submission.trim().length === 0}
              onClick={onSubmit}>
              <FiSend className="h-4 w-4" /> {busy === "submit" ? "Reviewing…" : "Submit for review"}
            </Button>
          </div>
          {open.resumed ? (
            <p className="mt-2 text-xs text-gray-500">
              You already had work in progress here, so it was resumed rather than restarted.
            </p>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

function ProjectReview({ review, onClose }) {
  const data = review.review || {};
  const attempt = review.attempt || {};
  const findings = data.findings || [];

  return (
    <Panel title="Review">
      <div className="grid gap-5 md:grid-cols-[200px_1fr]">
        <div className="border border-gray-200 p-4 text-center">
          <p className="text-4xl font-bold text-gray-900">{data.score_percent}%</p>
          <p className="mt-1 text-xs text-gray-500">
            {data.criteria_met}/{data.criteria_total} criteria met
          </p>
          <Badge
            className={`mt-3 ${attempt.passed ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
            {attempt.passed ? `Passed (${review.pass_mark}%)` : `Below ${review.pass_mark}%`}
          </Badge>
        </div>

        <div className="space-y-3">
          {data.unsupported_claims > 0 ? (
            <div className="border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              {data.unsupported_claims} claim(s) could not be backed by a quote from your write-up,
              so they were not counted as met. Point at your own words and they will count.
            </div>
          ) : null}

          {findings.map((f) => {
            const tone =
              f.verdict === "met"
                ? "border-green-200 bg-green-50"
                : f.verdict === "partially_met"
                ? "border-amber-200 bg-amber-50"
                : "border-red-200 bg-red-50";
            return (
              <div key={f.criterion_index} className={`border p-3 ${tone}`}>
                <p className="text-sm font-medium text-gray-900">{f.criterion}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-700">
                  {f.verdict === "partially_met" ? "Partially met" : f.verdict === "met" ? "Met" : "Not met"}
                </p>
                {f.feedback ? (
                  <p className="mt-1 text-xs text-gray-700">{f.feedback}</p>
                ) : null}
                {f.evidence_quote ? (
                  <blockquote className="mt-1.5 border-l-2 border-gray-400 pl-2 text-xs italic text-gray-600">
                    “{f.evidence_quote}”
                  </blockquote>
                ) : (
                  <p className="mt-1.5 text-xs italic text-gray-500">
                    No supporting text was found in your submission.
                  </p>
                )}
              </div>
            );
          })}

          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Panel>
  );
}

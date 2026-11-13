import React, { useCallback, useEffect, useState } from "react";
import CvaiShell, { Panel, Stat, Badge, Button, Loading, ErrorNote, LockedNote, EmptyNote } from "../cvai/CvaiShell";
import { cvai, isLocked, messageOf, grade } from "../../utils/cvai";
import { Code2, Lock, Save, Send, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import PaywallModal from "../../components/ui/PaywallModal";
import { BILLING_BETA_MESSAGE, BILLING_ENABLED } from "../../utils/billing";

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
  const [showPaywall, setShowPaywall] = useState(false);

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
  const unlockedProjects = projects.filter((p) => !p.locked);
  const lockedProjects = projects.filter((p) => p.locked);

  return (
    <>
      <CvaiShell
        title="Projects"
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
                  <Stat value={unlockedProjects.length} label="Projects" />
                  <Stat value={attempts.filter((a) => a.status === "reviewed").length} label="Reviewed" />
                  <Stat value={`${grade(best)}`} label="Best grade" hint={`best score ${best}%`} />
                </div>

                {lockedProjects.length > 0 && (
                  <Panel
                    title={BILLING_ENABLED ? "Subscribe to unlock more projects" : "More projects unlock with the trial"}
                    hint={BILLING_ENABLED
                      ? "These projects are part of the paid plan."
                      : "Paid plans are closed while the controlled beta is running."}
                  >
                    <div className="space-y-3">
                      {lockedProjects.map((project) => (
                        <div key={project.id} className="flex items-center justify-between rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-4 shadow-s5">
                          <div>
                            <h4 className="text-sm font-medium text-ink">{project.title}</h4>
                            <p className="mt-0.5 text-xs leading-relaxed text-secondary">{project.summary}</p>
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
                  {unlockedProjects.map((project) => (
                    <article key={project.id} className="flex flex-col rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25/90 shadow-s5 overflow-hidden">
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-base font-semibold text-ink">{project.title}</h3>
                          {project.is_free_preview ? (
                            <Badge className="border-brand/20 bg-brand/10 dark:bg-brand/15 text-brand-text">Free</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-secondary">{project.summary}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-secondary">
                          {project.difficulty ? <Badge className="capitalize">{project.difficulty}</Badge> : null}
                          <span><span className="font-mono">{project.step_count}</span> steps</span>
                          {project.estimated_hours ? <span>~<span className="font-mono">{project.estimated_hours}</span>h</span> : null}
                          <span>pass at <span className="font-mono">{project.pass_percent}%</span></span>
                        </div>
                      </div>
                      <div className="border-t border-line dark:border-line p-4">
                        <Button onClick={() => begin(project)}>
                          <Code2 className="h-4 w-4" strokeWidth={1.75} /> {project.is_free_preview ? "Try it" : "Start project"}
                        </Button>
                      </div>
                    </article>
                  ))}
                  {unlockedProjects.length === 0 && (
                    <EmptyNote>
                      No projects available yet. Subscribe to unlock the project library.
                    </EmptyNote>
                  )}
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
                          <tr className="border-b border-line dark:border-line text-left text-xs uppercase tracking-wider text-secondary">
                            <th className="pb-3 px-3.5 font-medium">Project</th>
                            <th className="pb-3 px-3.5 font-medium">Status</th>
                            <th className="pb-3 px-3.5 font-medium">Score</th>
                            <th className="pb-3 px-3.5 font-medium">Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attempts.map((a) => (
                            <tr key={a.id} className="border-b border-line dark:border-line last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-25/20">
                              <td className="py-3 px-3.5 capitalize text-ink">
                                {(a.project_slug || "").replace(/-/g, " ")}
                              </td>
                              <td className="py-3 px-3.5 capitalize text-secondary">{a.status}</td>
                              <td className="py-3 px-3.5 font-mono text-secondary">
                                {a.score_percent === null || a.score_percent === undefined
                                  ? "—"
                                  : `${a.score_percent}%`}
                              </td>
                              <td className="py-3 px-3.5">
                                {a.review_status === "unavailable" ? (
                                  <Badge className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                                    not scored
                                  </Badge>
                                ) : a.passed ? (
                                  <Badge className="border-brand/20 bg-brand/10 dark:bg-brand/15 text-brand-text">Passed</Badge>
                                ) : a.passed === false ? (
                                  <Badge className="border-line dark:border-line bg-gray-50 dark:bg-gray-25 text-secondary">Not passed</Badge>
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
      <PaywallModal open={showPaywall} feature="projects" onClose={() => setShowPaywall(false)} onUpgrade={handleUpgrade} />
    </>
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
          <h3 className="text-sm font-semibold text-ink">Steps</h3>
          <p className="mt-0.5 text-xs text-secondary">
            Move your position as you go; it saves.
          </p>
          <div className="mt-3 space-y-2.5">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`rounded-xl border p-4 transition-colors ${
                  open.step === index ? "border-brand/40 bg-brand/10 dark:bg-brand/15 shadow-s5" : "border-line dark:border-line bg-surface dark:bg-gray-25"
                }`}>
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold font-mono ${
                      open.step === index ? "bg-brand text-white shadow-s5" : "border border-line dark:border-line bg-surface dark:bg-gray-25 text-secondary"
                    }`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{step.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-secondary">{step.instruction}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button variant="secondary" disabled={open.step <= 0}
              onClick={() => { setOpen((p) => ({ ...p, step: p.step - 1 })); onSave({ current_step: open.step - 1 }); }}>
              <ChevronLeft className="h-4 w-4" strokeWidth={1.75} /> Previous
            </Button>
            <Button variant="secondary" disabled={open.step >= steps.length - 1}
              onClick={() => { const n = open.step + 1; setOpen((p) => ({ ...p, step: n })); onSave({ current_step: n }); }}>
              Next <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          </div>

          <h3 className="mt-6 text-sm font-semibold text-ink">Your notes</h3>
          <textarea
            value={open.notes}
            onChange={(e) => setOpen((p) => ({ ...p, notes: e.target.value }))}
            rows={4}
            placeholder="What you tried, what broke, what you learned."
            className="mt-2 w-full rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <Button variant="secondary" className="mt-3" disabled={busy === "save"}
            onClick={() => onSave({ notes: open.notes })}>
            <Save className="h-4 w-4" strokeWidth={1.75} /> {busy === "save" ? "Saving…" : "Save notes"}
          </Button>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink">What you will be judged against</h3>
          <p className="mt-0.5 text-xs text-secondary">
            Read these first. The reviewer decides each one and must quote your own words to say
            it is met.
          </p>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            {criteria.map((c, index) => (
              <li key={index} className="text-sm leading-relaxed text-secondary">{c.text}</li>
            ))}
          </ol>

          <h3 className="mt-6 text-sm font-semibold text-ink">Submit your work</h3>
          <p className="mt-0.5 text-xs text-secondary">
            Explain what you built and how each criterion above is satisfied. This costs AI tokens.
          </p>
          <textarea
            value={open.submission}
            onChange={(e) => setOpen((p) => ({ ...p, submission: e.target.value }))}
            rows={10}
            placeholder="Walk through your solution and point at each criterion."
            className="mt-2 w-full rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 px-3.5 py-2.5 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <div className="mt-3 flex flex-wrap gap-2.5">
            <Button disabled={busy === "submit" || open.submission.trim().length === 0}
              onClick={onSubmit}>
              <Send className="h-4 w-4" strokeWidth={1.75} /> {busy === "submit" ? "Reviewing…" : "Submit for review"}
            </Button>
          </div>
          {open.resumed ? (
            <p className="mt-2 text-xs leading-relaxed text-secondary">
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
        <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-5 text-center shadow-s5">
          <p className="text-4xl font-bold font-mono text-ink">{data.score_percent}%</p>
          <p className="mt-1 text-xs text-secondary">
            <span className="font-mono">{data.criteria_met}</span>/<span className="font-mono">{data.criteria_total}</span> criteria met
          </p>
          <Badge
            className={`mt-3 ${attempt.passed ? "border-brand/20 bg-brand/10 dark:bg-brand/15 text-brand-text" : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"}`}>
            {attempt.passed ? `Passed (${review.pass_mark}%)` : `Below ${review.pass_mark}%`}
          </Badge>
        </div>

        <div className="space-y-3">
          {data.unsupported_claims > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-800 dark:text-amber-400">
              <span className="font-mono">{data.unsupported_claims}</span> claim(s) could not be backed by a quote from your write-up,
              so they were not counted as met. Point at your own words and they will count.
            </div>
          ) : null}

          {findings.map((f) => {
            const tone =
              f.verdict === "met"
                ? "border-brand/20 bg-brand/10 dark:bg-brand/15"
                : f.verdict === "partially_met"
                ? "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
                : "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10";
            return (
              <div key={f.criterion_index} className={`rounded-xl border p-4 ${tone}`}>
                <p className="text-sm font-medium text-ink">{f.criterion}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-secondary">
                  {f.verdict === "partially_met" ? "Partially met" : f.verdict === "met" ? "Met" : "Not met"}
                </p>
                {f.feedback ? (
                  <p className="mt-1 text-xs leading-relaxed text-secondary">{f.feedback}</p>
                ) : null}
                {f.evidence_quote ? (
                  <blockquote className="mt-2 border-l-2 border-brand/40 pl-3 text-xs italic text-secondary">
                    “{f.evidence_quote}”
                  </blockquote>
                ) : (
                  <p className="mt-2 text-xs italic text-secondary">
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

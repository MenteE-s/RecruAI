import React, { useCallback, useEffect, useState } from "react";
import CvaiShell, {
  Panel, Stat, Badge, Button, Loading, ErrorNote, LockedNote, EmptyNote, Meter,
} from "../cvai/CvaiShell";
import {
  cvai, isLocked, isReviewerDown, messageOf, percent,
} from "../../utils/cvai";
import PaywallModal from "../../components/ui/PaywallModal";
import { BILLING_BETA_MESSAGE, BILLING_ENABLED } from "../../utils/billing";
import {
  Mic, MessageSquare, PlayCircle, Send, Square, CheckCircle2, RotateCcw, CreditCard,
} from "lucide-react";

/**
 * Mock interviews: the part of CVAI where you are the one being assessed.
 *
 * The page is deliberately plain. A practice interview should feel like an
 * interview, not like a dashboard, so there is one question, one box, and the
 * phase label telling you where you are.
 *
 * Two things it will not pretend:
 * - A failed review says the reviewer was unreachable and that nothing was
 *   scored. It does not show a zero, and it does not blame you.
 * - Strengths are only ever shown with the quote that earned them, because that
 *   is what the backend guarantees. Nothing appears here that you cannot check.
 */
export default function CvaiInterviews() {
  const [meta, setMeta] = useState(null);
  const [history, setHistory] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [role, setRole] = useState("");
  const [starting, setStarting] = useState(false);
  const [session, setSession] = useState(null);   // { id, phase, question, ... }
  const [answer, setAnswer] = useState("");
  const [answering, setAnswering] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState(null);
  const [notice, setNotice] = useState("");        // honest non-error messages
  const [viewing, setViewing] = useState(null);    // past interview, read-only
  const [upgrading, setUpgrading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [metaRes, historyRes, subRes] = await Promise.all([
      cvai.interviewMeta(),
      cvai.interviews(),
      cvai.subscriptionStatus(),
    ]);
    if (!historyRes.ok) {
      setError(messageOf(historyRes, "Could not load your interviews."));
      setLoading(false);
      return;
    }
    setMeta(metaRes.data || null);
    setHistory(historyRes.data?.interviews || []);
    if (subRes.ok) setSubscription(subRes.data || null);
    setLoading(false);
  }, []);

  async function handleUpgrade() {
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

  useEffect(() => { load(); }, [load]);

  async function start(event) {
    event.preventDefault();
    setStarting(true);
    setError("");
    setNotice("");
    setCannotStart(false);
    setReview(null);
    const res = await cvai.startInterview({ target_role: role.trim() });
    setStarting(false);
    if (isLocked(res)) {
      setCannotStart(true);
      return;
    }
    if (!res.ok) { setError(messageOf(res, "Could not start that interview.")); return; }
    const payload = res.data || {};
    setSession({
      id: payload.interview?.id,
      phase: payload.phase,
      question: payload.question,
      guidance: payload.guidance,
      source: payload.question_source,
      skills: payload.skills_planned || [],
      interview: payload.interview,
      finished: false,
    });
    setAnswer("");
    setViewing(null);
  }

  async function submitAnswer() {
    if (!session?.id || !answer.trim()) return;
    setAnswering(true);
    setError("");
    setNotice("");
    const res = await cvai.answerInterview(session.id, answer.trim());
    setAnswering(false);
    if (!res.ok) { setError(messageOf(res, "That answer was not saved.")); return; }
    const payload = res.data || {};
    setAnswer("");
    setSession((prev) => ({
      ...prev,
      phase: payload.phase,
      question: payload.question,
      guidance: payload.guidance,
      source: payload.question_source,
      interview: payload.interview,
      finished: payload.finished === true,
    }));
    if (payload.message) setNotice(payload.message);
    if (payload.finished) await load();
  }

  async function getFeedback() {
    if (!session?.id) return;
    setReviewing(true);
    setError("");
    setNotice("");
    const res = await cvai.interviewFeedback(session.id);
    setReviewing(false);
    if (isReviewerDown(res)) {
      setNotice(res.data.message || "The reviewer could not be reached. Nothing was scored.");
      await load();
      return;
    }
    if (!res.ok) { setError(messageOf(res, "Could not score that interview.")); return; }
    setReview(res.data);
    await load();
  }

  async function abandon() {
    if (!session?.id) return;
    const res = await cvai.abandonInterview(session.id);
    if (res.ok) {
      setNotice(res.data.message || "Abandoned.");
      setSession(null);
      await load();
    } else {
      setError(messageOf(res, "Could not stop that interview."));
    }
  }

  /** Re-enter an interview left open, putting the learner back at their question. */
  async function resume(interview) {
    setError("");
    setNotice("");
    setReview(null);
    setViewing(null);
    const res = await cvai.interview(interview.id);
    if (!res.ok) {
      setError(messageOf(res, "Could not reopen that interview."));
      return;
    }
    const payload = res.data || {};
    const data = payload.interview || {};
    setSession({
      id: data.id,
      phase: payload.phase,
      // GET one does not include the pending question, only the transcript, so
      // the last interviewer turn is the question they still need to answer.
      question: null,
      guidance: null,
      source: null,
      skills: [],
      interview: data,
      finished: data.status !== "in_progress",
    });
    setAnswer("");
  }

  async function abandonExisting(interview) {
    const res = await cvai.abandonInterview(interview.id);
    if (res.ok) await load();
    else setError(messageOf(res, "Could not discard that interview."));
  }

  async function openPast(interview) {
    setError("");
    setNotice("");
    setReview(null);
    setSession(null);
    const res = await cvai.interview(interview.id);
    if (res.ok) setViewing(res.data || null);
  }

  // ---------------------------------------------------------------- states
  // Entitlement is not checked by the read endpoints, and deliberately so: a
  // lapsed account can still re-read the interviews it already sat. So the lock
  // is discovered by pressing Begin, not by loading the page — and it is shown
  // where the button was rather than blanking the history above it.
  const [cannotStart, setCannotStart] = useState(false);

  const isSubscribed = subscription?.is_paid_active || subscription?.is_trial_active;
  const live = session && !session.finished;
  const transcript = session?.interview?.transcript || viewing?.interview?.transcript || [];
  const pastFeedback = viewing?.interview?.feedback || null;
  // The backend allows one live interview at a time, so a user who closes the
  // tab mid-session cannot start another. They need to be offered the one they
  // already have rather than a Begin button that fails.
  const open = history.find((i) => i.status === "in_progress") || null;

  return (
    <>
      <CvaiShell
        title="Mock interviews"
        subtitle="A full interview with an interviewer who has a plan. Costs AI tokens to score."
      >
        <div className="space-y-5">
          {error ? <ErrorNote>{error}</ErrorNote> : null}
          {notice ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line dark:border-line bg-gray-50 dark:bg-gray-25 px-4 py-3 text-sm text-ink dark:text-gray-800">
              <span>{notice}</span>
              {session && (
                <Button variant="secondary" onClick={getFeedback} disabled={reviewing}>
                  {reviewing ? "Asking…" : "Try scoring again"}
                </Button>
              )}
            </div>
          ) : null}

          {loading ? (
            <Loading label="Loading interviews" />
          ) : !session && !viewing ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Stat value={history.length} label="Interviews sat" />
                <Stat
                  value={history.filter((i) => i.review_status === "done").length}
                  label="Scored"
                />
                <Stat
                  value={history.filter((i) => i.passed).length}
                  label="Passed"
                  tone="text-green-700 dark:text-green-400"
                  hint={`pass at ${meta?.pass_mark_percent ?? 60}%`}
                />
              </div>

              {!isSubscribed ? (
                <Panel
                  title={BILLING_ENABLED ? "Subscribe to start mock interviews" : "Mock interviews need an active trial"}
                  hint={BILLING_ENABLED
                    ? "Mock interviews are a paid feature. Your 30-day trial includes them — after that you need a subscription."
                    : "Paid plans are closed while the controlled beta is running."}
                >
                  <div className="text-sm leading-relaxed text-secondary dark:text-gray-700">
                    {BILLING_ENABLED
                      ? "During your free trial you can run mock interviews. Once the trial ends, subscribe to keep practising."
                      : "Your 30-day trial includes mock interviews. Paid plans are not available during the beta, so this stays closed after the trial ends."}
                  </div>
                  {BILLING_ENABLED ? (
                    <Button
                      onClick={() => setShowPaywall(true)}
                      className="w-full mt-3.5 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-xl shadow-s5 hover:bg-brand/90"
                    >
                      {upgrading ? "Upgrading…" : (
                        <>
                          <CreditCard className="h-4 w-4" strokeWidth={1.75} /> Subscribe now
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="mt-3.5 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-400">
                      {BILLING_BETA_MESSAGE}
                    </div>
                  )}
                </Panel>
              ) : (
                <Panel
                  title="Start an interview"
                  hint="Name the role. We work out what to cover from the gaps in your profile."
                >
                  <form onSubmit={start} className="flex flex-wrap gap-2.5">
                    <input
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Backend Engineer"
                      maxLength={160}
                      className="min-w-[240px] flex-1 rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 px-3.5 py-2 text-sm text-ink outline-none transition-colors placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                    <Button type="submit" disabled={starting || !role.trim() || Boolean(open)}>
                      <PlayCircle className="h-4 w-4" strokeWidth={1.75} /> {starting ? "Starting…" : "Begin"}
                    </Button>
                  </form>

                  {open ? (
                    <div className="mt-3.5 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 p-4">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
                        You have an interview in progress
                      </p>
                      <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-400">
                        {open.target_role || "Practice interview"} — <span className="font-mono">{open.turn_count}</span> turn
                        {open.turn_count === 1 ? "" : "s"} so far. Only one runs at a time.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2.5">
                        <Button onClick={() => resume(open)}>
                          <MessageSquare className="h-4 w-4" strokeWidth={1.75} /> Resume
                        </Button>
                        <Button variant="secondary" onClick={() => abandonExisting(open)}>
                          Discard it
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {cannotStart ? (
                    <div className="mt-3.5">
                      <LockedNote what="Starting a new mock interview" />
                    </div>
                  ) : null}

                  {meta?.phases ? (
                    <div className="mt-4 rounded-xl border border-line dark:border-line overflow-hidden">
                      {meta.phases.map((p, i) => (
                        <div
                          key={p.key}
                          className={`flex items-baseline gap-3 p-3 text-sm ${
                            i ? "border-t border-line dark:border-line" : ""
                          }`}
                        >
                          <span className="w-6 shrink-0 font-mono text-xs font-semibold text-secondary dark:text-gray-500">
                            {i + 1}
                          </span>
                          <span className="font-medium text-ink">{p.label}</span>
                          <span className="min-w-0 flex-1 truncate text-xs text-secondary">
                            {p.blurb}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-3 text-xs leading-relaxed text-secondary">
                    Every session runs all six, in order. The interviewer decides how
                    long to spend in each — you cannot skip ahead, because the part people
                    fluster on is usually not the part they practise.
                  </p>
                </Panel>
              )}

              <Panel title="Past interviews">
                {history.length === 0 ? (
                  <EmptyNote>None yet. Your transcripts stay here so you can re-read them.</EmptyNote>
                ) : (
                  <div className="space-y-2.5">
                    {history.map((i) => (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => openPast(i)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-3.5 text-left transition-colors hover:border-brand/30 hover:bg-brand/5 shadow-s5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">
                            {i.target_role || "Practice interview"}
                          </p>
                          <p className="text-xs capitalize text-secondary">
                            {i.status}
                            {i.review_status === "unavailable" ? " · not scored" : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {i.overall_score !== null && i.overall_score !== undefined ? (
                            <>
                              <span className="text-sm font-semibold font-mono text-ink">
                                {i.overall_score}%
                              </span>
                              <Badge
                                className={
                                  i.passed
                                    ? "border-brand/20 bg-brand/10 dark:bg-brand/15 text-brand-text"
                                    : "border-line dark:border-line bg-gray-50 dark:bg-gray-25 text-secondary"
                                }
                              >
                                {i.passed ? "Passed" : "Below bar"}
                              </Badge>
                            </>
                          ) : i.status === "completed" ? (
                            <Badge className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                              not scored
                            </Badge>
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Panel>
            </>
          ) : (
            <>
              {viewing ? (
                <Panel
                  title={viewing.interview?.target_role || "Practice interview"}
                  hint={`${viewing.interview?.turn_count || 0} turns · ended ${viewing.interview?.status}`}
                  actions={
                    <Button variant="ghost" onClick={() => { setViewing(null); load(); }}>
                      Close
                    </Button>
                  }
                >
                  <div className="space-y-4">
                    <Transcript turns={transcript} />
                    {pastFeedback ? (
                      <FeedbackBlock feedback={pastFeedback} />
                    ) : viewing.interview?.review_status === "unavailable" ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-800 dark:text-amber-300">
                        This interview was never scored — the reviewer could not be reached.
                        Nothing was counted against you.
                      </div>
                    ) : (
                      <div className="rounded-xl border border-line dark:border-line bg-gray-50 dark:bg-gray-25 p-4 text-sm leading-relaxed text-secondary">
                        No feedback for this one. {viewing.interview?.status === "abandoned"
                          ? "It was abandoned before the end."
                          : ""}
                      </div>
                    )}
                  </div>
                </Panel>
              ) : (
                <>
                  {session.phase ? (
                    <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 px-4 py-3 shadow-s5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="rounded-md bg-gray-900 dark:bg-gray-25 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white capitalize">
                            {session.phase.label}
                          </span>
                          <span className="text-sm text-secondary">{session.phase.blurb}</span>
                        </div>
                        <span className="text-xs text-secondary">
                          turn <span className="font-mono">{session.phase.turns_taken}</span> of <span className="font-mono">{session.phase.max_turns}</span> in this
                          section
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <Panel
                    title={live ? "Your turn" : "That is the interview"}
                    hint={live ? "Answer as you would in the room." : "Ask for your score."}
                    actions={
                      live ? (
                        <Button variant="danger" onClick={abandon}>
                          <Square className="h-3.5 w-3.5" strokeWidth={1.75} /> Stop
                        </Button>
                      ) : null
                    }
                  >
                    <div className="space-y-4">
                      {live && !session.question ? (
                        <>
                          <p className="text-sm leading-relaxed text-ink">
                            You have an interview in progress. Answer the question below to
                            carry on — it is the last one you were asked.
                          </p>
                          <p className="border-l-2 border-line dark:border-line pl-3 text-sm italic text-secondary">
                            {(transcript.filter((t) => t.role !== "interviewer").slice(-1)[0] || {})
                              .content || "No question was pending."}
                          </p>
                          <textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            rows={7}
                            maxLength={meta?.max_answer_chars || 8000}
                            placeholder="Answer the question that was asked…"
                            className="w-full rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 px-3.5 py-2.5 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20"
                          />
                          <Button onClick={submitAnswer} disabled={answering || !answer.trim()}>
                            <Send className="h-4 w-4" strokeWidth={1.75} />
                            {answering ? "Sending…" : "Send answer"}
                          </Button>
                        </>
                      ) : live && session.question ? (
                        <>
                          <p className="text-base leading-relaxed text-ink font-medium">
                            {session.question}
                          </p>
                          {session.guidance && session.source === "bank" ? (
                            <p className="border-l-2 border-line dark:border-line pl-3 text-xs leading-relaxed text-secondary">
                              {session.guidance}
                            </p>
                          ) : null}
                          <textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            rows={7}
                            maxLength={meta?.max_answer_chars || 8000}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitAnswer();
                            }}
                            placeholder="Answer the question that was asked…"
                            className="w-full rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 px-3.5 py-2.5 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20"
                          />
                          <div className="flex flex-wrap items-center gap-3">
                            <Button
                              onClick={submitAnswer}
                              disabled={answering || !answer.trim()}
                            >
                              <Send className="h-4 w-4" strokeWidth={1.75} />
                              {answering ? "Sending…" : "Send answer"}
                            </Button>
                            <span className="text-xs text-secondary">
                              Ctrl + Enter to send · <span className="font-mono">{answer.length}</span> characters
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm leading-relaxed text-ink">
                            That is the end of the interview. Your answers are saved.
                          </p>
                          <div className="flex flex-wrap gap-2.5">
                            <Button onClick={getFeedback} disabled={reviewing}>
                              <Mic className="h-4 w-4" strokeWidth={1.75} />
                              {reviewing ? "Scoring…" : "Get my score"}
                            </Button>
                            <Button variant="secondary" onClick={() => { setSession(null); setReview(null); }}>
                              Back to list
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </Panel>

                  {review ? <FeedbackBlock feedback={review.feedback} /> : null}

                  {transcript.length ? (
                    <Panel title="Transcript" hint="Kept whole, so you can re-read exactly what you said.">
                      <Transcript turns={transcript} />
                    </Panel>
                  ) : null}
                </>
              )}
            </>
          )}
        </div>
      </CvaiShell>
      <PaywallModal open={showPaywall} feature="mock interviews" onClose={() => setShowPaywall(false)} onUpgrade={handleUpgrade} />
    </>
  );
}

function Transcript({ turns }) {
  return (
    <div className="space-y-3">
      {turns.map((turn, i) => {
        const mine = turn.role !== "interviewer";
        return (
          <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl border p-3.5 text-sm leading-relaxed ${
                mine
                  ? "border-brand/20 bg-brand/10 dark:bg-brand/15 text-ink"
                  : "border-line dark:border-line bg-gray-50 dark:bg-gray-25 text-ink dark:text-gray-800"
              }`}
            >
              {turn.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FeedbackBlock({ feedback }) {
  const scores = feedback?.scores || {};
  const dimensions = Object.entries(scores);

  return (
    <Panel
      title="Your score"
      hint="Computed from your answers, not generated. Four dimensions, averaged."
      actions={
        <span className="text-2xl font-bold font-mono text-ink">{feedback?.overall_score}%</span>
      }
    >
      <div className="space-y-5">
        <div>
          {dimensions.length ? (
            <div className="space-y-3">
              {dimensions.map(([key, value]) => (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize text-secondary">{key}</span>
                    <span className="font-semibold font-mono text-ink">{value}%</span>
                  </div>
                  <div className="mt-1.5">
                    <Meter
                      value={percent(value)}
                      tone={value >= 70 ? "bg-brand" : value >= 50 ? "bg-amber-500" : "bg-red-500"}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary">No dimension scores were returned.</p>
          )}
        </div>

        {feedback?.unverifiable_claims ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-800 dark:text-amber-400">
            <span className="font-mono">{feedback.unverifiable_claims}</span> comment(s) were dropped because they could not
            quote something you actually said. Only feedback you can check is shown here.
          </div>
        ) : null}

        {(feedback?.strengths || []).length ? (
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <CheckCircle2 className="h-4 w-4 text-brand-text" strokeWidth={1.75} /> What worked
            </h3>
            <div className="mt-2.5 space-y-2.5">
              {feedback.strengths.map((s, i) => (
                <div key={i} className="rounded-xl border border-brand/20 bg-brand/10 dark:bg-brand/15 p-4 shadow-s5">
                  {s.skill_slug ? (
                    <span className="text-[11px] font-medium capitalize text-brand-text">{s.skill_slug}</span>
                  ) : null}
                  <p className="mt-0.5 text-sm text-ink">{s.note}</p>
                  <blockquote className="mt-2 border-l-2 border-brand/40 pl-3 text-xs italic text-secondary">
                    “{s.quote}”
                  </blockquote>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {(feedback?.improvements || []).length ? (
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <RotateCcw className="h-4 w-4 text-amber-600 dark:text-amber-400" strokeWidth={1.75} /> Work on this next
            </h3>
            <div className="mt-2.5 space-y-2.5">
              {feedback.improvements.map((s, i) => (
                <div key={i} className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 p-4 shadow-s5">
                  {s.skill_slug ? (
                    <span className="text-[11px] font-medium capitalize text-amber-800 dark:text-amber-300">{s.skill_slug}</span>
                  ) : null}
                  <p className="mt-0.5 text-sm text-ink">{s.note}</p>
                  <blockquote className="mt-2 border-l-2 border-amber-400 pl-3 text-xs italic text-secondary">
                    “{s.quote}”
                  </blockquote>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!feedback?.strengths?.length && !feedback?.improvements?.length ? (
          <p className="rounded-xl border border-line dark:border-line bg-gray-50 dark:bg-gray-25 p-4 text-sm text-secondary">
            No specific notes. That usually means the reviewer could not find quotable
            evidence either way — answer a few more questions for useful feedback.
          </p>
        ) : null}
      </div>
    </Panel>
  );
}

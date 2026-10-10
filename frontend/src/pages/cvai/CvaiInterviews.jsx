import React, { useCallback, useEffect, useState } from "react";
import CvaiShell, {
  Panel, Stat, Badge, Button, Loading, ErrorNote, LockedNote, EmptyNote, Meter,
} from "../cvai/CvaiShell";
import {
  cvai, isLocked, isReviewerDown, messageOf, percent,
} from "../../utils/cvai";
import {
  FiMic, FiPlayCircle, FiSend, FiSquare, FiCheckCircle, FiRefreshCw,
} from "react-icons/fi";

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

  const load = useCallback(async () => {
    setLoading(true);
    const [metaRes, historyRes] = await Promise.all([
      cvai.interviewMeta(),
      cvai.interviews(),
    ]);
    if (!historyRes.ok) {
      setError(messageOf(historyRes, "Could not load your interviews."));
      setLoading(false);
      return;
    }
    setMeta(metaRes.data || null);
    setHistory(historyRes.data?.interviews || []);
    setLoading(false);
  }, []);

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

  const live = session && !session.finished;
  const transcript = session?.interview?.transcript || viewing?.interview?.transcript || [];
  const pastFeedback = viewing?.interview?.feedback || null;

  return (
    <CvaiShell
      title="Mock interviews"
      subtitle="A full interview with an interviewer who has a plan. Costs AI tokens to score."
    >
      <div className="space-y-5">
        {error ? <ErrorNote>{error}</ErrorNote> : null}
        {notice ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
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
                tone="text-green-700"
                hint={`pass at ${meta?.pass_mark_percent ?? 60}%`}
              />
            </div>

            <Panel
              title="Start an interview"
              hint="Name the role. We work out what to cover from the gaps in your profile."
            >
              <form onSubmit={start} className="flex flex-wrap gap-2">
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Backend Engineer"
                  maxLength={160}
                  className="min-w-[240px] flex-1 border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                <Button type="submit" disabled={starting || !role.trim()}>
                  <FiPlayCircle className="h-4 w-4" /> {starting ? "Starting…" : "Begin"}
                </Button>
              </form>

              {cannotStart ? (
                <div className="mt-3">
                  <LockedNote what="Starting a new mock interview" />
                </div>
              ) : null}

              {meta?.phases ? (
                <div className="mt-4 border border-gray-200">
                  {meta.phases.map((p, i) => (
                    <div
                      key={p.key}
                      className={`flex items-baseline gap-3 px-4 py-2 text-sm ${
                        i ? "border-t border-gray-100" : ""
                      }`}
                    >
                      <span className="w-6 shrink-0 text-xs font-semibold text-gray-400">
                        {i + 1}
                      </span>
                      <span className="font-medium text-gray-900">{p.label}</span>
                      <span className="min-w-0 flex-1 truncate text-xs text-gray-500">
                        {p.blurb}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              <p className="mt-3 text-xs text-gray-500">
                Every session runs all six, in order. The interviewer decides how
                long to spend in each — you cannot skip ahead, because the part people
                fluster on is usually not the part they practise.
              </p>
            </Panel>

            <Panel title="Past interviews">
              {history.length === 0 ? (
                <EmptyNote>None yet. Your transcripts stay here so you can re-read them.</EmptyNote>
              ) : (
                <div className="space-y-2">
                  {history.map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => openPast(i)}
                      className="flex w-full items-center justify-between gap-3 border border-gray-200 p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {i.target_role || "Practice interview"}
                        </p>
                        <p className="text-xs capitalize text-gray-500">
                          {i.status}
                          {i.review_status === "unavailable" ? " · not scored" : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {i.overall_score !== null && i.overall_score !== undefined ? (
                          <>
                            <span className="text-sm font-semibold text-gray-900">
                              {i.overall_score}%
                            </span>
                            <Badge
                              className={
                                i.passed
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : "border-gray-200 bg-gray-50 text-gray-600"
                              }
                            >
                              {i.passed ? "Passed" : "Below bar"}
                            </Badge>
                          </>
                        ) : i.status === "completed" ? (
                          <Badge className="border-amber-200 bg-amber-50 text-amber-700">
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
                    <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      This interview was never scored — the reviewer could not be reached.
                      Nothing was counted against you.
                    </div>
                  ) : (
                    <div className="border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
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
                  <div className="border border-gray-200 bg-white px-5 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="bg-gray-900 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-white">
                          {session.phase.label?.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">{session.phase.blurb}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        turn {session.phase.turns_taken} of {session.phase.max_turns} in this
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
                        <FiSquare className="h-3.5 w-3.5" /> Stop
                      </Button>
                    ) : null
                  }
                >
                  <div className="space-y-4">
                    {live && session.question ? (
                      <>
                        <p className="text-base leading-relaxed text-gray-900">
                          {session.question}
                        </p>
                        {session.guidance && session.source === "bank" ? (
                          <p className="border-l-2 border-gray-300 pl-3 text-xs text-gray-500">
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
                          className="w-full border border-gray-200 px-3 py-2 text-sm leading-relaxed outline-none focus:border-blue-500"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            onClick={submitAnswer}
                            disabled={answering || !answer.trim()}
                          >
                            <FiSend className="h-4 w-4" />
                            {answering ? "Sending…" : "Send answer"}
                          </Button>
                          <span className="text-xs text-gray-400">
                            Ctrl + Enter to send · {answer.length} characters
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-700">
                          That is the end of the interview. Your answers are saved.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={getFeedback} disabled={reviewing}>
                            <FiMic className="h-4 w-4" />
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
              className={`max-w-[85%] border px-3.5 py-2.5 text-sm leading-relaxed ${
                mine
                  ? "border-blue-200 bg-blue-50 text-gray-900"
                  : "border-gray-200 bg-gray-50 text-gray-800"
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
        <span className="text-2xl font-bold text-gray-900">{feedback?.overall_score}%</span>
      }
    >
      <div className="space-y-5">
        <div>
          {dimensions.length ? (
            <div className="space-y-2.5">
              {dimensions.map(([key, value]) => (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize text-gray-700">{key}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                  <div className="mt-1">
                    <Meter
                      value={percent(value)}
                      tone={value >= 70 ? "bg-green-600" : value >= 50 ? "bg-amber-500" : "bg-red-500"}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No dimension scores were returned.</p>
          )}
        </div>

        {feedback?.unverifiable_claims ? (
          <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            {feedback.unverifiable_claims} comment(s) were dropped because they could not
            quote something you actually said. Only feedback you can check is shown here.
          </div>
        ) : null}

        {(feedback?.strengths || []).length ? (
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <FiCheckCircle className="h-4 w-4 text-green-600" /> What worked
            </h3>
            <div className="mt-2 space-y-2">
              {feedback.strengths.map((s, i) => (
                <div key={i} className="border border-green-200 bg-green-50 p-3">
                  {s.skill_slug ? (
                    <span className="text-[11px] capitalize text-green-700">{s.skill_slug}</span>
                  ) : null}
                  <p className="text-sm text-gray-800">{s.note}</p>
                  <blockquote className="mt-1.5 border-l-2 border-green-400 pl-2 text-xs italic text-gray-600">
                    “{s.quote}”
                  </blockquote>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {(feedback?.improvements || []).length ? (
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <FiRefreshCw className="h-4 w-4 text-amber-600" /> Work on this next
            </h3>
            <div className="mt-2 space-y-2">
              {feedback.improvements.map((s, i) => (
                <div key={i} className="border border-amber-200 bg-amber-50 p-3">
                  {s.skill_slug ? (
                    <span className="text-[11px] capitalize text-amber-700">{s.skill_slug}</span>
                  ) : null}
                  <p className="text-sm text-gray-800">{s.note}</p>
                  <blockquote className="mt-1.5 border-l-2 border-amber-400 pl-2 text-xs italic text-gray-600">
                    “{s.quote}”
                  </blockquote>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!feedback?.strengths?.length && !feedback?.improvements?.length ? (
          <p className="border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            No specific notes. That usually means the reviewer could not find quotable
            evidence either way — answer a few more questions for useful feedback.
          </p>
        ) : null}
      </div>
    </Panel>
  );
}

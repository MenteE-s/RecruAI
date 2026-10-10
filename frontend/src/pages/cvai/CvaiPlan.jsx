import React, { useCallback, useEffect, useState } from "react";
import CvaiShell, { Panel, Stat, Badge, Button, Loading, ErrorNote, LockedNote, EmptyNote, Meter } from "../cvai/CvaiShell";
import {
  cvai, isLocked, messageOf, PRIORITY_TONE,
} from "../../utils/cvai";
import { FiCheckCircle, FiClock, FiPlusCircle } from "react-icons/fi";

/**
 * Your plan: what you are working towards, how far through it you are, and what
 * to do next.
 *
 * There is no money input, deliberately. A $5 learner used to get a thinner
 * curriculum than a $100 learner, which had nothing to do with what either of
 * them paid us — the subscription is what unlocks this, so the plan is the same
 * for everyone who has it.
 *
 * One question remains: how many hours a week do you actually have? That shapes
 * the schedule and is reported honestly. If the work needs nine weeks, the plan
 * says nine weeks rather than trimming steps to make the number look better.
 */
export default function CvaiPlan() {
  const [plans, setPlans] = useState([]);
  const [progress, setProgress] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [options, setOptions] = useState(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyStep, setBusyStep] = useState(null);

  const [form, setForm] = useState({ goal: "", weekly_hours: 5 });
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [plansRes, progressRes, suggestionsRes, optionsRes] = await Promise.all([
      cvai.plans(),
      cvai.overallProgress(),
      cvai.suggestions(),
      cvai.planOptions(),
    ]);

    if (isLocked(plansRes)) { setLocked(true); setLoading(false); return; }
    if (!plansRes.ok) { setError(messageOf(plansRes, "Could not load your plan.")); setLoading(false); return; }

    setPlans(plansRes.data?.plans || []);
    setProgress(progressRes.data || null);
    const s = suggestionsRes.data || {};
    setSuggestions(s.suggestions || []);
    setOptions(optionsRes.data || null);
    setLocked(false);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createPlan(event) {
    event.preventDefault();
    setCreating(true);
    setError("");
    const res = await cvai.createPlan({
      goal: form.goal,
      weekly_hours: Number(form.weekly_hours) || 5,
    });
    setCreating(false);
    if (!res.ok) { setError(messageOf(res, "Could not build a plan.")); return; }
    setForm({ goal: "", weekly_hours: 5 });
    await load();
  }

  async function toggleStep(plan, step) {
    setBusyStep(step.id);
    const next = step.status === "done" ? "in_progress" : "done";
    const res = await cvai.setStep(plan.id, step.id, next);
    setBusyStep(null);
    if (!res.ok) { setError(messageOf(res, "Could not update that step.")); return; }
    await load();
    if (expanded === plan.id) {
      const fresh = await cvai.plan(plan.id);
      if (fresh.ok) setDetail(fresh.data?.plan || null);
    }
  }

  async function expand(plan) {
    if (expanded === plan.id) { setExpanded(null); setDetail(null); return; }
    setExpanded(plan.id);
    const res = await cvai.plan(plan.id);
    setDetail(res.ok ? res.data?.plan || null : null);
  }

  const active = plans.filter((p) => p.status !== "completed");

  return (
    <CvaiShell
      title="Your plan"
      subtitle="Built from what has actually been measured on your profile, then spread across the time you can give it."
    >
      {locked ? (
        <LockedNote what="Mentorship planning" />
      ) : (
        <div className="space-y-5">
          {error ? <ErrorNote onRetry={load}>{error}</ErrorNote> : null}

          {loading ? (
            <Loading label="Loading your plan" />
          ) : (
            <>
              {progress ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Stat value={`${progress.overall_pct || 0}%`} label="Overall progress" />
                  <Stat value={active.length} label="Active plans" />
                  <Stat
                    value={progress.behind_count || 0}
                    label="Behind schedule"
                    tone={progress.behind_count ? "text-amber-700" : "text-gray-900"}
                  />
                  <Stat value={progress.skills_assessed || 0} label="Skills measured" />
                </div>
              ) : null}

              {suggestions.length ? (
                <Panel title="Do this next" hint="Ranked, and every one states its reason.">
                  <div className="space-y-2">
                    {suggestions.slice(0, 3).map((s, i) => (
                      <div key={`${s.kind}-${i}`} className={`border p-4 ${PRIORITY_TONE[s.priority] || PRIORITY_TONE.normal}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                          {s.priority === "urgent" || s.priority === "high" ? (
                            <Badge className="border-gray-300 bg-white text-gray-700 uppercase">
                              {s.priority}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-gray-600">{s.reason}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              ) : null}

              <Panel title="Build a plan" hint="Costs AI tokens. Every subscriber gets the full plan.">
                <form onSubmit={createPlan} className="grid gap-3 md:grid-cols-[3fr_1fr_auto] md:items-end">
                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">
                      What are you aiming for?
                    </span>
                    <input
                      value={form.goal}
                      onChange={(e) => setForm({ ...form, goal: e.target.value })}
                      placeholder="Become interview-ready for a backend role"
                      className="mt-1 w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">
                      Hours you can give each week
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={form.weekly_hours}
                      onChange={(e) => setForm({ ...form, weekly_hours: e.target.value })}
                      className="mt-1 w-full border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </label>
                  <Button type="submit" disabled={creating || !form.goal.trim()}>
                    <FiPlusCircle className="h-4 w-4" /> {creating ? "Building…" : "Build plan"}
                  </Button>
                </form>
                {options?.levels ? (
                  <p className="mt-2 text-xs text-gray-500">
                    Levels run {options.levels[0]} → {options.levels[options.levels.length - 1]}.
                    The plan is built from what you have already measured and spread across the
                    hours you have. If the work needs nine weeks, it says nine weeks.
                  </p>
                ) : null}
              </Panel>

              <Panel title="Your plans">
                {plans.length === 0 ? (
                  <EmptyNote>
                    No plan yet. Build one above and it will be fitted to your measured gaps and
                    the hours you can give it.
                  </EmptyNote>
                ) : (
                  <div className="space-y-4">
                    {plans.map((plan) => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        expanded={expanded === plan.id}
                        detail={expanded === plan.id ? detail : null}
                        busyStep={busyStep}
                        onExpand={() => expand(plan)}
                        onToggleStep={(step) => toggleStep(plan, step)}
                      />
                    ))}
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

function PlanCard({ plan, expanded, detail, busyStep, onExpand, onToggleStep }) {
  const done = plan.completed_step_count || 0;
  const total = plan.step_count || 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const steps = detail?.steps || [];

  return (
    <div className="border border-gray-200">
      <button
        type="button"
        onClick={onExpand}
        className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-gray-50"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{plan.goal}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <FiClock className="h-3 w-3" /> {plan.total_hours || 0}h over {plan.weeks || "?"}w
            </span>
            <span>{plan.weekly_hours}h/week</span>
            {plan.total_cost ? (
              <span className="text-gray-400">{plan.total_cost} of paid resources</span>
            ) : (
              <span>free resources</span>
            )}
          </div>
        </div>
        <div className="w-full max-w-[200px]">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{done}/{total} steps</span>
            <span>{pct}%</span>
          </div>
          <div className="mt-1">
            <Meter value={pct} tone={pct === 100 ? "bg-green-600" : "bg-blue-600"} />
          </div>
        </div>
      </button>

      {plan.trimmed ? (
        <div className="border-t border-gray-100 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Trimmed to fit the time you have. {plan.trim_reason}
        </div>
      ) : null}

      {expanded && steps.length ? (
        <ol className="space-y-2 border-t border-gray-100 p-4">
          {steps.map((step, index) => {
            const isDone = step.status === "done";
            return (
              <li key={step.id} className="flex items-start gap-3 border border-gray-200 p-3">
                <button
                  type="button"
                  disabled={busyStep === step.id}
                  onClick={() => onToggleStep(step)}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border transition-colors ${
                    isDone
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-gray-300 bg-white text-transparent hover:border-blue-500"
                  }`}
                  title={isDone ? "Mark not done" : "Mark done"}>
                  <FiCheckCircle className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${isDone ? "text-gray-500 line-through" : "text-gray-900"}`}>
                    {index + 1}. {step.title}
                  </p>
                  {step.description ? (
                    <p className="mt-0.5 text-xs text-gray-600">{step.description}</p>
                  ) : null}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                    {step.resource_name ? (
                      <Badge className="capitalize">{step.resource_type}</Badge>
                    ) : null}
                    {step.resource_name ? <span>{step.resource_name}</span> : null}
                    <span>{step.hours_estimate}h</span>
                    {step.cost ? <span>{step.cost} cost</span> : null}
                    {step.optional ? <Badge>Optional</Badge> : null}
                    {step.target_date ? <span>by {new Date(step.target_date).toLocaleDateString()}</span> : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}

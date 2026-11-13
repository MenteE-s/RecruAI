import React, { useEffect, useRef, useState } from "react";
import { Check, Users } from "lucide-react";

/* ─── Step illustrations ─────────────────────────────────────────── */

/** Step 1 — mini profile card */
const ProfileCardIllustration = () => (
  <div className="w-full h-full flex flex-col justify-between p-3.5 bg-surface dark:bg-gray-25 rounded-xl border border-line dark:border-gray-800">
    {/* Avatar + name row */}
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center shrink-0">
        <span className="text-white text-[9px] font-mono font-bold">AK</span>
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="h-2 w-16 bg-gray-800 dark:bg-gray-200 rounded-full" />
        <div className="h-1.5 w-10 bg-gray-300 dark:bg-gray-600 rounded-full" />
      </div>
    </div>
    {/* Skill bars */}
    <div className="flex flex-col gap-1.5 my-1">
      {[72, 55, 45].map((w, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="h-1.5 w-8 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0" />
          <div
            className="h-1.5 bg-brand/70 rounded-full"
            style={{ width: `${w}%` }}
          />
        </div>
      ))}
    </div>
    {/* CV chip */}
    <div className="flex items-center gap-1 self-start">
      <div className="px-2 py-0.5 rounded-full bg-brand/10 dark:bg-brand/20 border border-brand/20 text-[8px] font-semibold text-brand-text">
        CV uploaded
      </div>
    </div>
  </div>
);

/** Step 2 — animated ATS score counter */
const AiMatchIllustration = () => {
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let frame;
    const target = 91;
    const duration = 1200;
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setScore(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started]);

  const circumference = 2 * Math.PI * 22;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      ref={ref}
      className="w-full h-full flex flex-col items-center justify-between p-3.5 bg-surface dark:bg-gray-25 rounded-xl border border-line dark:border-gray-800"
    >
      {/* Ring */}
      <div className="relative w-12 h-12 shrink-0">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 52 52">
          <circle
            cx="26" cy="26" r="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-gray-200 dark:text-gray-800"
          />
          <circle
            cx="26" cy="26" r="22"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            stroke="rgb(var(--brand))"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-ink font-mono tabular-nums">{score}</span>
        </div>
      </div>
      <div className="text-[9px] font-semibold text-brand-text tracking-wide">
        ATS match
      </div>
      {/* Bars: job titles */}
      <div className="w-full flex flex-col gap-1 px-1">
        {[
          { w: "78%", accent: true },
          { w: "58%", accent: false },
        ].map((r, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="h-1.5 w-9 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0" />
            <div
              className={`h-1.5 rounded-full ${r.accent ? "bg-brand/60" : "bg-gray-200 dark:bg-gray-700"}`}
              style={{ width: r.w }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

/** Step 3 — chat bubble sequence */
const ChatIllustration = () => (
  <div className="w-full h-full flex flex-col justify-between p-3.5 bg-surface dark:bg-gray-25 rounded-xl border border-line dark:border-gray-800">
    {/* AI question bubble */}
    <div className="flex items-end gap-1.5">
      <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0 flex items-center justify-center">
        <span className="text-[7px] font-mono font-bold text-gray-600 dark:text-gray-600">AI</span>
      </div>
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl rounded-bl-sm px-2.5 py-1.5">
        <div className="h-1.5 w-20 bg-gray-300 dark:bg-gray-600 rounded-full mb-1" />
        <div className="h-1.5 w-14 bg-gray-300 dark:bg-gray-600 rounded-full" />
      </div>
    </div>
    {/* User reply */}
    <div className="flex items-end justify-end gap-1.5 my-1">
      <div className="bg-brand/15 dark:bg-brand/20 rounded-xl rounded-br-sm px-2.5 py-1.5 max-w-[85%]">
        <div className="text-[8px] font-medium text-brand-text leading-snug">
          I led the backend redesign…
        </div>
      </div>
    </div>
    {/* Score chip */}
    <div className="flex items-center justify-end">
      <div className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[8px] font-semibold text-emerald-700 dark:text-emerald-400">
        Clarity <span className="font-mono tabular-nums">+8</span>
      </div>
    </div>
  </div>
);

/** Step 4 — success badge */
const HiredIllustration = () => (
  <div className="w-full h-full flex flex-col items-center justify-between p-3.5 bg-surface dark:bg-gray-25 rounded-xl border border-line dark:border-gray-800">
    {/* Checkmark badge */}
    <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center shadow-s5">
      <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
    </div>
    <div className="text-[10px] font-bold text-ink tracking-wide">
      Offer accepted
    </div>
    {/* Metric row */}
    <div className="flex gap-4">
      {[
        ["Dubai", "Location"],
        ["90k", "PKR/mo"],
      ].map(([val, lbl], i) => (
        <div key={i} className="flex flex-col items-center">
          <span className="text-[10px] font-mono tabular-nums font-bold text-brand-text">{val}</span>
          <span className="text-[8px] text-gray-500 dark:text-gray-500">{lbl}</span>
        </div>
      ))}
    </div>
    {/* Confetti dots */}
    <div className="flex gap-1.5">
      {["bg-brand", "bg-emerald-400", "bg-teal-400", "bg-sky-400"].map(
        (c, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full ${c} opacity-70`} />
        )
      )}
    </div>
  </div>
);

/* ─── Step data ──────────────────────────────────────────────────── */

const steps = [
  {
    num: "1",
    label: "Create profile",
    sub: "Upload CV, ATS scoring, skill gaps",
    Illustration: ProfileCardIllustration,
  },
  {
    num: "2",
    label: "AI match",
    sub: "Semantic ranking across Gulf and Pakistan",
    Illustration: AiMatchIllustration,
  },
  {
    num: "3",
    label: "Practice interview",
    sub: "AI mock sessions with instant feedback",
    Illustration: ChatIllustration,
  },
  {
    num: "4",
    label: "Get hired",
    sub: "One-click apply, direct offers",
    Illustration: HiredIllustration,
  },
];

/* ─── Main component ─────────────────────────────────────────────── */
const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="py-20 sm:py-24 bg-surface dark:bg-gray-0 border-t border-line dark:border-gray-800"
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="mb-4 inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-text">
            Simple 4-step journey
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-4">
            From{" "}
            <span className="text-brand-text">practice</span> to{" "}
            <span className="text-brand-text">hired</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-500 max-w-2xl mx-auto leading-relaxed">
            RecruAI guides you through every step — profile to offer.
          </p>
        </div>

        {/* Step grid — 4-column on large, 2-column on sm, 1-column on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="flex flex-col gap-3 group"
            >
              {/* Illustrated card: 120px tall for generous 12px+ insets */}
              <div
                className="rounded-2xl border border-line dark:border-gray-800 bg-surface dark:bg-gray-25 shadow-s5 overflow-hidden transition-shadow group-hover:shadow-s10"
                style={{ height: 120 }}
              >
                <step.Illustration />
              </div>

              {/* Step label */}
              <div className="flex items-start gap-2.5 px-1">
                <div className="w-6 h-6 rounded-lg bg-brand text-white flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5 shadow-s5">
                  {step.num}
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink leading-snug">
                    {step.label}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-500 leading-snug mt-0.5">
                    {step.sub}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Org note */}
        <div className="mt-12 flex justify-center">
          <div className="inline-flex items-center gap-2.5 rounded-xl border border-line dark:border-gray-800 bg-surface dark:bg-gray-25 px-4 py-3 text-xs text-gray-600 dark:text-gray-500 shadow-s5">
            <Users
              className="h-4 w-4 shrink-0 text-brand-text"
              strokeWidth={1.8}
            />
            <span>
              Organizations get a parallel flow — post jobs, rank candidates by
              vector, screen via AI.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

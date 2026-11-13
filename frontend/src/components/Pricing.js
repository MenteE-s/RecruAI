import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { BILLING_ENABLED } from "../utils/billing";
import { VIDEO_ENABLED } from "../utils/video";

/* ─── plan data ───────────────────────────────────────────────────── */

const individualPlans = [
  {
    name: "Free forever",
    description: "Start your career journey with no cost.",
    price: 0,
    duration: "forever",
    popular: false,
    cta: "Get started free",
    link: "/register",
    focusFeatures: [
      "3 AI mock interviews / month",
      "Basic ATS resume scoring",
      "Public shareable profile",
    ],
    extraCount: 2, // placeholder bars for remaining features
  },
  {
    name: BILLING_ENABLED ? "Individual pro" : "Controlled beta",
    description: BILLING_ENABLED
      ? "Full CVAI suite for serious candidates."
      : "Every CVAI capability — free for 30 days.",
    price: BILLING_ENABLED ? 15 : "Free",
    duration: BILLING_ENABLED ? "/ month" : "30-day trial",
    popular: true,
    cta: BILLING_ENABLED ? "Start free trial" : "Join the beta",
    link: "/register",
    focusFeatures: [
      "Unlimited AI mock interviews",
      "12-week personalized CVAI plan",
      "Gulf and Pakistan keyword rewrites",
      ...(VIDEO_ENABLED ? ["Live WebRTC interview simulations"] : []),
      "Priority recruiter exposure",
    ],
    extraCount: 2,
  },
];

const organizationPlans = [
  {
    name: "Enterprise",
    description: "Custom hiring architecture for teams of any size.",
    price: "Custom",
    duration: "per seat / team",
    popular: true,
    cta: "Contact us",
    link: "/contact",
    focusFeatures: [
      "Unlimited job postings",
      "Semantic candidate matching",
      "Collaborative ATS pipeline",
      "Automated AI screening",
    ],
    extraCount: 2,
  },
];

/* ─── sub-components ──────────────────────────────────────────────── */

function PlaceholderBar({ width = "60%" }) {
  return (
    <div
      className="h-2 rounded-full bg-gray-200 dark:bg-gray-700"
      style={{ width }}
    />
  );
}

function PlanCard({ plan, single }) {
  const { popular } = plan;

  return (
    <div
      className={[
        "rounded-2xl bg-surface dark:bg-gray-25 flex flex-col transition-all",
        popular
          ? "border-2 border-brand shadow-[0_0_0_4px_rgba(0,180,80,0.08)] scale-[1.02]"
          : "border border-line dark:border-gray-800 shadow-s5 hover:border-brand/40",
        single ? "max-w-md mx-auto w-full" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* card body — at least 12px insets (p-6 = 24px) */}
      <div className="p-6">
        {/* badge */}
        <div className="mb-3 h-5">
          {popular && (
            <span className="inline-flex items-center rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-semibold text-white tracking-wide">
              Most popular
            </span>
          )}
        </div>

        {/* name + description */}
        <div className="mb-5">
          <div
            className={[
              "font-bold text-ink leading-tight",
              popular ? "text-xl" : "text-base",
            ].join(" ")}
          >
            {plan.name}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
            {plan.description}
          </div>
        </div>

        {/* price — the one big number, formatted with monospace tabular figures */}
        <div className="mb-5 pb-5 border-b border-line dark:border-gray-800">
          {typeof plan.price === "number" ? (
            <div className="flex items-baseline gap-1.5">
              <span
                className={[
                  "font-mono tabular-nums font-extrabold text-ink leading-none",
                  popular ? "text-4xl sm:text-5xl" : "text-3xl",
                ].join(" ")}
              >
                ${plan.price}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500 font-mono">{plan.duration}</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span
                className={[
                  "font-mono tabular-nums font-extrabold text-ink leading-none",
                  popular ? "text-4xl sm:text-5xl" : "text-3xl",
                ].join(" ")}
              >
                {plan.price}
              </span>
              {plan.duration && (
                <span className="text-xs text-gray-500 dark:text-gray-500 font-mono">({plan.duration})</span>
              )}
            </div>
          )}
        </div>

        {/* feature rows — real words on focal features */}
        <ul className="space-y-2.5 mb-6">
          {plan.focusFeatures.map((f, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <div className="shrink-0 w-4 h-4 rounded-full bg-brand/10 dark:bg-brand/20 border border-brand/25 flex items-center justify-center">
                <Check className="h-2.5 w-2.5 text-brand-text" strokeWidth={2.5} />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-500 leading-snug">
                {f}
              </span>
            </li>
          ))}

          {/* placeholder rows for non-focal extras */}
          {Array.from({ length: plan.extraCount }).map((_, i) => (
            <li key={`bar-${i}`} className="flex items-center gap-2.5">
              <div className="shrink-0 w-4 h-4 rounded-full bg-line dark:bg-gray-800 flex items-center justify-center">
                <div className="w-2 h-px bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>
              <PlaceholderBar width={i % 2 === 0 ? "55%" : "68%"} />
            </li>
          ))}
        </ul>
      </div>

      {/* CTA — anchored to bottom with clearance */}
      <div className="px-6 pb-6 mt-auto">
        <Link
          to={plan.link}
          className={[
            "block w-full text-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
            popular
              ? "bg-brand text-white hover:bg-brand/90 shadow-s5"
              : "border border-line dark:border-gray-800 bg-surface dark:bg-gray-50/20 text-ink hover:bg-gray-50 dark:hover:bg-gray-50/30",
          ].join(" ")}
        >
          {plan.cta}
        </Link>
      </div>
    </div>
  );
}

/* ─── section ─────────────────────────────────────────────────────── */

const Pricing = () => {
  const [userType, setUserType] = useState("individual");
  const plans = userType === "individual" ? individualPlans : organizationPlans;

  return (
    <section id="pricing" className="py-20 sm:py-24 bg-surface dark:bg-gray-0 border-t border-line dark:border-gray-800">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* header */}
        <div className="text-center mb-12">
          <div className="mb-4 inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-text">
            Simple and transparent
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-4">
            Clear plans for <span className="text-brand-text">every ambition</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-500 max-w-xl mx-auto leading-relaxed">
            {BILLING_ENABLED
              ? "Start free, scale as you grow. No hidden fees, cancel anytime."
              : "All new accounts receive a 30-day full-access trial. Billing opens after the beta."}
          </p>
        </div>

        {/* toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-xl border border-line dark:border-gray-800 bg-surface dark:bg-gray-25 p-1 shadow-s5">
            {["individual", "organization"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setUserType(t)}
                className={[
                  "rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
                  userType === t
                    ? "bg-brand text-white shadow-s5"
                    : "text-gray-500 dark:text-gray-500 hover:text-ink",
                ].join(" ")}
              >
                {t === "individual" ? "Job seekers" : "Organizations"}
              </button>
            ))}
          </div>
        </div>

        {/* cards */}
        <div
          className={[
            "grid gap-5 mx-auto",
            plans.length === 1
              ? "grid-cols-1 max-w-sm"
              : "grid-cols-1 md:grid-cols-2 max-w-3xl items-stretch",
          ].join(" ")}
        >
          {plans.map((plan, i) => (
            <PlanCard key={`${userType}-${i}`} plan={plan} single={plans.length === 1} />
          ))}
        </div>

        {/* trust row */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-500">
          {[
            BILLING_ENABLED ? "Cancel anytime" : "No credit card required",
            BILLING_ENABLED ? "30-day money back" : "Full access included",
            "Enterprise data privacy",
          ].map((label) => (
            <span key={label} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;

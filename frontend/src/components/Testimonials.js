import React, { useState } from "react";
import { Avatar } from "./ui/Avatar";

/* ─── data ─────────────────────────────────────────────────────────── */

const testimonials = [
  {
    name: "Ahmed Khan",
    role: "Senior software engineer · Dubai",
    quote:
      "RecruAI pushed my ATS score from 52 to 91 and surfaced Dubai roles I hadn't seen anywhere else.",
    achievement: "Hired in Dubai",
  },
  {
    name: "Fatima Raza",
    role: "Lead talent partner · Karachi",
    quote:
      "We cut our screening cycle by 40%. The AI-scored summaries give our managers real signal before the first human call.",
    achievement: "40% time saved",
  },
  {
    name: "Bilal Ahmed",
    role: "Full-stack engineer · Doha",
    quote:
      "Practicing with RecruAI's bots as a FAST graduate gave me the confidence to ace system-design rounds at Talabat.",
    achievement: "Offer in Doha",
  },
  {
    name: "Sara Qureshi",
    role: "Product manager · Riyadh",
    quote:
      "Semantic matching understood my product roadmap background and recommended positions I actually wanted.",
    achievement: "Perfect match",
  },
  {
    name: "Omar Al-Farsi",
    role: "Recruitment director · Abu Dhabi",
    quote:
      "Scorecards from RecruAI give our distributed team a consistent hiring standard across Dubai, Lahore, and Riyadh.",
    achievement: "Unified standard",
  },
  {
    name: "Hassan Mirza",
    role: "DevOps engineer · Lahore",
    quote:
      "RecruAI mapped exactly the skill gaps between my backend profile and DevOps specs, then helped me close them.",
    achievement: "Career transition",
  },
];

const stats = [
  { number: "25,000+", label: "Verified candidates" },
  { number: "95%", label: "Satisfaction rate" },
  { number: "500+", label: "Hiring organizations" },
];

/* ─── rating dots (5 filled circles) ───────────────────────────────── */

function RatingDots({ count = 5 }) {
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={[
            "inline-block w-1.5 h-1.5 rounded-full",
            i < count
              ? "bg-brand"
              : "bg-gray-200 dark:bg-gray-700",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

/* ─── single testimonial card ───────────────────────────────────────── */

function TestimonialCard({ item, featured = false }) {
  return (
    <div
      className={[
        "rounded-2xl border border-line dark:border-gray-800 bg-surface dark:bg-gray-25 p-6 shadow-s5 flex flex-col",
        featured ? "border-brand/30 ring-1 ring-brand/10" : "hover:border-brand/30 transition-colors",
      ].join(" ")}
    >
      {/* rating */}
      <div className="mb-4">
        <RatingDots count={5} />
      </div>

      {/* quote — focal text */}
      <p
        className={[
          "leading-relaxed text-ink flex-1 mb-5",
          featured ? "text-base sm:text-lg" : "text-sm",
        ].join(" ")}
      >
        "{item.quote}"
      </p>

      {/* author row — clearance and insets */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-line dark:border-gray-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={item.name} size="md" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink leading-tight truncate">
              {item.name}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-500 leading-tight truncate">
              {item.role}
            </div>
          </div>
        </div>

        <span className="shrink-0 rounded-full border border-brand/20 bg-brand/10 dark:bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand-text whitespace-nowrap">
          {item.achievement}
        </span>
      </div>
    </div>
  );
}

/* ─── section ───────────────────────────────────────────────────────── */

const Testimonials = () => {
  const [active, setActive] = useState(0);
  const featured = testimonials[active];
  const grid = testimonials.filter((_, i) => i !== active);

  return (
    <section id="testimonials" className="py-20 sm:py-24 bg-surface dark:bg-gray-0 border-t border-line dark:border-gray-800">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* header */}
        <div className="text-center mb-12">
          <div className="mb-4 inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-text">
            Proven outcomes
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-4">
            Trusted in <span className="text-brand-text">Pakistan and the Gulf</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-500 max-w-xl mx-auto leading-relaxed">
            Engineers, product managers, and talent leaders who achieved their goals on RecruAI.
          </p>
        </div>

        {/* featured testimonial */}
        <div className="max-w-2xl mx-auto mb-8">
          <TestimonialCard item={featured} featured />
        </div>

        {/* navigation dots */}
        <div className="flex justify-center gap-2 mb-12">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show testimonial ${i + 1}`}
              aria-current={i === active ? "true" : undefined}
              className={[
                "h-6 min-w-6 px-1 rounded-full transition-all inline-flex items-center justify-center",
                i === active ? "w-8 bg-brand" : "w-6 bg-line dark:bg-gray-700 hover:bg-gray-400",
              ].join(" ")}
            />
          ))}
        </div>

        {/* grid of remaining cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {grid.map((item, i) => (
            <TestimonialCard key={i} item={item} />
          ))}
        </div>

        {/* stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-10">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-line dark:border-gray-800 bg-surface dark:bg-gray-25 p-6 text-center shadow-s5"
            >
              <div className="text-2xl sm:text-3xl font-mono tabular-nums font-bold text-brand-text mb-1 leading-tight">
                {stat.number}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

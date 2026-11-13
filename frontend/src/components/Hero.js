import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion, useInView, animate } from "motion/react";
import { Avatar, AvatarStack } from "./ui/Avatar";
import ShimmerButton from "./motion/ShimmerButton";
import { ArrowRight, Check, MapPin, Briefcase } from "lucide-react";

/**
 * Hero — Peerlist reference architecture, adapted for RecruAI.
 *
 * Layout is ported from the reference Landing.tsx: an emerald gradient wash,
 * a 1120px measure, a serif (Instrument Serif) headline, a username-claim
 * style input, an avatar-stack builder counter, and a floating HeroIllustration
 * on wide screens. Copy stays recruitment-specific.
 */

const builders = [
  { name: "Ahmed Khan" },
  { name: "Fatima Raza" },
  { name: "Usman Tariq" },
  { name: "Ayesha Malik" },
  { name: "Bilal Ahmed" },
  { name: "Zainab Noor" },
];

function UsernameClaim() {
  const [value, setValue] = useState("");
  const navigate = useNavigate();

  const submit = (event) => {
    event.preventDefault();
    navigate("/register");
  };

  return (
    <form onSubmit={submit} className="mt-7 w-full max-w-[420px]">
      <div className="flex items-center gap-2 rounded-xl border border-line dark:border-gray-800 bg-surface dark:bg-gray-25 p-1.5 pl-3 shadow-s5 focus-within:border-brand dark:focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
        <span className="text-[13px] text-gray-500 dark:text-gray-500 sm:text-sm font-mono">recruai.org/</span>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value.replace(/\s+/g, "").toLowerCase())}
          placeholder="your-name"
          aria-label="Claim your username"
          className="h-8 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-gray-500 dark:placeholder:text-gray-500"
        />
        <button
          type="submit"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3 text-[13px] font-semibold text-white transition-colors hover:bg-brand/90 shadow-s5"
        >
          Claim
          <ArrowRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        </button>
      </div>
      <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-500">
        Free to claim. Your profile, resume and AI-verified skills live at one address.
      </p>
    </form>
  );
}

/** Animated ATS score counter — counts up from 0 to target once in view. */
function AtsCounter({ target = 91, reduce }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const [display, setDisplay] = useState(reduce ? target : 0);

  useEffect(() => {
    if (reduce || !isInView) return;
    const controls = animate(0, target, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(v) {
        setDisplay(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [isInView, reduce, target]);

  return (
    <span ref={ref} className="font-mono tabular-nums">
      {display}
    </span>
  );
}

/** Placeholder bar — varying width to avoid a skeleton ladder look. */
function Bar({ w = "60%", h = "h-2", className = "" }) {
  return (
    <div
      className={`rounded-full bg-gray-200 dark:bg-gray-700 ${h} ${className}`}
      style={{ width: w }}
    />
  );
}

/**
 * HeroIllustration — stageshow-quality faux RecruAI candidate dashboard.
 *
 * Story: viewer sees Ahmed's candidate card → ATS score counts up to 91 →
 * a "Job Match" notification pill slides in from the right.
 *
 * Craft rules applied:
 *   - 6 real strings: "Ahmed Khan", "Software Engineer", "React · Python · SQL",
 *     "ATS Score", "91", "Senior Frontend Engineer"
 *   - Bars everywhere else; filler never under a real name
 *   - One number big: 91 (ATS score)
 *   - Named avatar gets its own color (via Avatar component default)
 *   - 12px insets from card edges; 8–12px between controls
 *   - Motion has cause: counter runs when card enters view, pill arrives after
 *   - No sparkles, no invented logos, no purple AI decoration
 */
function HeroIllustration({ reduce }) {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: "0px 0px -60px 0px" });

  const reveal = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 8 },
          animate: isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
          transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
        };

  const pillReveal = reduce
    ? {}
    : {
        initial: { opacity: 0, x: 28 },
        animate: isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 28 },
        transition: { duration: 0.5, delay: 1.6, ease: [0.22, 1, 0.36, 1] },
      };

  return (
    <div
      ref={cardRef}
      className="relative select-none"
      aria-label="RecruAI candidate dashboard — fictional data"
      aria-hidden="true"
    >
      {/* ── Main candidate card ── */}
      <div className="rounded-2xl border border-line dark:border-gray-800 bg-surface dark:bg-gray-25 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.10),0_1px_4px_-1px_rgba(0,0,0,0.06)]">

        {/* Cover band */}
        <div className="h-[72px] w-full rounded-t-2xl bg-gradient-to-br from-[#DFF3E6] to-[#9DD4B0] dark:from-[#1b3827] dark:to-[#0f2418]" />

        {/* Profile body — at least 12px insets */}
        <div className="p-3.5 sm:p-4">

          {/* Avatar row */}
          <div className="flex items-end justify-between">
            <Avatar name="Ahmed Khan" size="2xl" className="-mt-9 ring-4 ring-surface dark:ring-gray-25" />
            {/* Open to work badge */}
            <span className="mb-1 inline-flex h-6 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              Open to work
            </span>
          </div>

          {/* Name & role */}
          <motion.div {...reveal(0.1)} className="mt-2.5">
            <p className="text-[14px] font-semibold text-ink">Ahmed Khan</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-500 dark:text-gray-500" strokeWidth={1.8} />
              Software engineer · Lahore, PK
            </p>
          </motion.div>

          {/* ── ATS Score block — the ONE big number ── */}
          <motion.div
            {...reveal(0.22)}
            className="mt-3 flex items-center gap-3.5 rounded-xl border border-line dark:border-gray-800 bg-[#F7FDF9] dark:bg-[#0d1f14] p-3"
          >
            {/* Score ring */}
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 56 56">
                <circle
                  cx="28" cy="28" r="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-gray-200 dark:text-gray-800"
                />
                <motion.circle
                  cx="28" cy="28" r="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  className="text-brand-text"
                  initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                  animate={
                    reduce
                      ? { strokeDashoffset: 2 * Math.PI * 22 * (1 - 0.91) }
                      : isInView
                      ? { strokeDashoffset: 2 * Math.PI * 22 * (1 - 0.91) }
                      : { strokeDashoffset: 2 * Math.PI * 22 }
                  }
                  transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>
              <span className="relative text-[18px] font-bold leading-none text-ink font-mono tabular-nums">
                <AtsCounter target={91} reduce={reduce} />
              </span>
            </div>

            {/* Score label + sub-bars */}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-500">
                ATS score
              </p>
              <div className="mt-2 space-y-1.5">
                {/* Sub-score bars — filler, varying widths */}
                {[
                  { w: "88%", label: "Keywords" },
                  { w: "74%", label: "Format" },
                  { w: "95%", label: "Experience" },
                ].map(({ w, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Bar w={w} h="h-1.5" className="flex-1" />
                    <span className="shrink-0 text-[10px] font-mono tabular-nums text-gray-500 dark:text-gray-500">{w}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Skills */}
          <motion.div {...reveal(0.34)} className="mt-3 flex flex-wrap gap-1.5">
            {["React", "Python", "SQL"].map((s) => (
              <span
                key={s}
                className="inline-flex h-6 items-center rounded-lg border border-line dark:border-gray-800 bg-surface dark:bg-gray-50 px-2 text-[11px] font-medium text-ink"
              >
                {s}
              </span>
            ))}
          </motion.div>

          {/* Experience row — real company row + two filler rows */}
          <motion.div {...reveal(0.42)} className="mt-3 space-y-2">
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-500">
              Experience
            </p>

            {/* Real row with 12px padding */}
            <div className="flex items-center gap-2.5 rounded-lg border border-line/60 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-50/20 p-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-gray-100 text-[10px] font-mono font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-600">
                RS
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <Bar w="72%" h="h-2" />
                <Bar w="52%" h="h-1.5" />
              </div>
            </div>

            {/* Filler rows */}
            {[
              { initials: "GP", w1: "60%", w2: "45%" },
              { initials: "FT", w1: "55%", w2: "40%" },
            ].map(({ initials, w1, w2 }) => (
              <div key={initials} className="flex items-center gap-2.5 p-1.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-gray-100 text-[9px] font-mono font-bold text-gray-500 dark:bg-gray-800">
                  {initials}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <Bar w={w1} h="h-2" />
                  <Bar w={w2} h="h-1.5" />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Job Match notification pill — satellite with >= 12px insets ── */}
      <motion.div
        {...pillReveal}
        className="absolute -bottom-3 -right-3 flex items-center gap-2.5 rounded-xl border border-line dark:border-gray-800 bg-surface dark:bg-gray-25 p-3 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.12),0_1px_3px_-1px_rgba(0,0,0,0.07)]"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 dark:bg-brand/20">
          <Briefcase className="h-4 w-4 text-brand-text" strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-[11px] font-semibold text-ink">Senior frontend engineer</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-500">
            <span className="font-mono tabular-nums font-medium text-brand-text">91%</span> match · Dubai, UAE
          </p>
        </div>
      </motion.div>
    </div>
  );
}

const Hero = () => {
  const reduce = useReducedMotion();
  const reveal = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-[#F3FBF6] to-transparent dark:from-[#12241A]" />
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-10 -z-10 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
          animate={{ y: [0, -14, 0], opacity: [0.55, 0.8, 0.55] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="mx-auto w-full max-w-[1120px] px-4 pb-14 pt-12 sm:px-6 sm:pt-16">
        <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="min-w-0">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full border border-line dark:border-gray-800 bg-surface dark:bg-gray-25 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-600 transition-colors hover:text-ink"
            >
              <span className="inline-flex h-4 items-center rounded-full bg-brand-action px-1.5 text-[9px] font-bold uppercase tracking-wide text-white">
                New
              </span>
              CVAI career coaching is live
              <ArrowRight className="h-3 w-3 shrink-0" strokeWidth={2} />
            </Link>

            <motion.h1
              {...reveal(0.05)}
              className="mt-5 font-serif text-[40px] leading-[1.06] tracking-[-0.01em] text-ink sm:text-[56px]"
            >
              Find your perfect job <span className="italic text-brand-text">with AI</span> matching.
            </motion.h1>
            <motion.p
              {...reveal(0.12)}
              className="mt-4 max-w-[480px] text-[15px] leading-7 text-gray-600 dark:text-gray-500"
            >
              Pakistan&apos;s smartest job portal — now expanding across the Gulf. Discover jobs
              tailored to you, optimize your CV with ATS scoring, practice mock interviews, and
              get hired faster.
            </motion.p>

            <UsernameClaim />

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <AvatarStack people={builders} size="lg" extra={25} />
              <div>
                <p className="text-[13px] font-semibold text-ink">
                  <span className="font-mono tabular-nums">25,000+</span> candidates
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-500">Engineers, designers and professionals</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-gray-500 dark:text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-brand-text shrink-0" strokeWidth={2.4} /> AI job matching
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-brand-text shrink-0" strokeWidth={2.4} /> ATS resume scoring
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-brand-text shrink-0" strokeWidth={2.4} /> Free forever plan
              </span>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ShimmerButton as={Link} to="/register">
                Find my perfect job
                <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2} />
              </ShimmerButton>
              <a
                href="#features"
                className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-line dark:border-gray-800 bg-surface dark:bg-gray-25 px-5 text-sm font-semibold text-ink transition-colors hover:bg-gray-100 dark:hover:bg-gray-50/20 shadow-s5"
              >
                Optimize my CV
                <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2} />
              </a>
            </div>
          </div>

          <div className="min-w-0 pb-6 lg:pt-4">
            <HeroIllustration reduce={reduce} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

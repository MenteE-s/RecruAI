import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { AppShell, CenterBar } from "../../components/layout/AppShell";
import { RailCard, TipCard, QuickLinksCard } from "../../components/layout/UtilityRail";
import AnimatedTabBar from "../../components/motion/AnimatedTabBar";
import AnimatedNumber from "../../components/motion/AnimatedNumber";
import { Activity, CheckSquare, Code2, HelpCircle, Mic, Target, Award } from "lucide-react";

/**
 * The CVAI section: one sidebar entry, five pages.
 *
 * Each capability is its own page rather than tabs buried in a dashboard,
 * because they are different kinds of work — measuring yourself, being tested,
 * building something, and following a plan. A learner doing one of them should
 * not have to scroll past three others to find it.
 */

const TABS = [
  // /in/coaching is the product name; "cvai" is only ever our internal name.
  // Keeping it in the URL would mean shipping a codename to users for no reason.
  { to: "/in/coaching", label: "Overview", icon: Activity, end: true },
  { to: "/in/coaching/skills", label: "Skills", icon: CheckSquare },
  { to: "/in/coaching/quizzes", label: "Quizzes", icon: HelpCircle },
  { to: "/in/coaching/projects", label: "Projects", icon: Code2 },
  { to: "/in/coaching/interviews", label: "Mock interviews", icon: Mic },
  { to: "/in/coaching/plan", label: "My plan", icon: Target },
];

export { TABS as CVAI_TABS };

/**
 * Default right-rail widget for the CVAI suite.
 * Standardizes desktop layout to a cohesive 3-column shell and eliminates dead space.
 */
export function CvaiDefaultRail() {
  return (
    <>
      <RailCard title="Career goal">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-ink">Senior AI / Full-Stack Engineer</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-600">Target level: L5 / Staff</p>
            </div>
            <span className="rounded-full border border-brand/20 bg-brand/10 dark:bg-brand/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-text">
              <span className="font-mono">88%</span> match
            </span>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-600">
              <span>Roadmap progress</span>
              <span className="font-semibold text-ink">
                Week <span className="font-mono">4</span> of <span className="font-mono">12</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-line dark:bg-gray-25/60">
              <div className="h-full rounded-full bg-brand" style={{ width: "33%" }} />
            </div>
          </div>
        </div>
      </RailCard>

      <RailCard title="Milestones">
        <ul className="flex flex-col gap-2.5">
          {[
            { label: "Baseline assessment", done: true },
            { label: "Verified skills (Python, React)", done: true },
            { label: "First guided project", done: false },
            { label: "Mock interview practice", done: false },
            { label: "12-week roadmap completion", done: false },
          ].map((m) => (
            <li key={m.label} className="flex items-center gap-2.5 py-0.5">
              <span
                className={
                  m.done
                    ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-s5"
                    : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line dark:border-line bg-surface dark:bg-gray-25"
                }
              >
                {m.done ? (
                  <Award className="h-3 w-3" strokeWidth={2} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-50" />
                )}
              </span>
              <span className={`text-[13px] ${m.done ? "font-medium text-ink" : "text-gray-500 dark:text-gray-600"}`}>
                {m.label}
              </span>
            </li>
          ))}
        </ul>
        <Link to="/in/coaching/plan" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-text hover:underline">
          View full plan →
        </Link>
      </RailCard>

      <TipCard
        icon={Target}
        title="Recruiter visibility"
        body="Profiles with verified skill badges receive 3.8x more recruiter direct messages on RecruAI."
      />

      <QuickLinksCard
        title="Quick actions"
        links={[
          { to: "/in/coaching/skills", label: "Take skill assessment", icon: CheckSquare },
          { to: "/in/coaching/quizzes", label: "Browse quiz question bank", icon: HelpCircle },
          { to: "/in/coaching/projects", label: "Start a guided project", icon: Code2 },
          { to: "/in/practice", label: "Practice AI mock interview", icon: Mic },
        ]}
      />
    </>
  );
}

export function CvaiRail() {
  return <CvaiDefaultRail />;
}

export default function CvaiShell({ title, subtitle, actions, rail, children }) {
  const { pathname } = useLocation();
  const effectiveRail = rail !== undefined ? rail : <CvaiDefaultRail />;
  return (
    <AppShell rail={effectiveRail}>
      <CenterBar title={title} actions={actions}>
        {/* A visible horizontal scrollbar under a six-item tab strip read as a
            broken control; hide the track but keep the ability to scroll over
            narrow viewports. */}
        <div className="px-4 pb-2.5 pt-1.5">
          <AnimatedTabBar
            id="cvai-sections"
            className="w-full"
            options={TABS.map((tab) => ({ to: tab.to, label: tab.label, icon: tab.icon }))}
            active={pathname}
          />
        </div>
        {subtitle ? <p className="px-4 pb-3 text-[13px] leading-relaxed text-secondary">{subtitle}</p> : null}
      </CenterBar>
      <div className="space-y-5 px-4 pb-6 pt-4">{children}</div>
    </AppShell>
  );
}

/** Small shared presentational bits, so five pages look like one product. */

export function Panel({ title, hint, actions, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-line bg-surface dark:bg-gray-25/90 dark:border-line shadow-s5 ${className}`}>
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line dark:border-line px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
            {hint ? <p className="mt-1 text-xs leading-relaxed text-secondary">{hint}</p> : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Stat({ value, label, tone = "text-ink", hint }) {
  const numeric =
    typeof value === "number" ||
    (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)));
  return (
    <div className="rounded-xl border border-line bg-surface dark:bg-gray-25 dark:border-line px-4 py-3 shadow-s5 transition-colors hover:border-brand/25 dark:hover:border-brand/40">
      {numeric ? (
        <AnimatedNumber value={Number(value)} className={`text-2xl font-bold font-mono tracking-tight leading-none ${tone}`} />
      ) : (
        <p className={`text-2xl font-bold font-mono tracking-tight leading-none ${tone}`}>{value}</p>
      )}
      <p className="mt-1.5 text-xs text-secondary">{label}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-secondary/70">{hint}</p> : null}
    </div>
  );
}

export function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-line bg-surface dark:bg-gray-25 dark:border-line px-2.5 py-0.5 text-[11px] font-medium ${className}`}>
      {children}
    </span>
  );
}

export function Button({ children, variant = "primary", className = "", ...rest }) {
  const variants = {
    primary: "bg-brand text-white hover:bg-brand/90 shadow-s5 border border-brand",
    secondary: "bg-surface dark:bg-gray-25 text-ink dark:text-ink border border-line dark:border-line hover:bg-gray-100 dark:hover:bg-gray-25/60",
    ghost: "bg-transparent text-secondary dark:text-gray-600 border border-transparent hover:bg-canvas dark:hover:bg-gray-25 hover:text-ink dark:hover:text-gray-100",
    danger: "bg-surface dark:bg-gray-25 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10",
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...rest}>
      {children}
    </button>
  );
}

export function Loading({ label = "Loading" }) {
  return (
    <div className="space-y-3" role="status" aria-label={label}>
      <div className="skeleton h-24 rounded-xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ErrorNote({ children, onRetry }) {
  if (!children) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
      <span>{children}</span>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function LockedNote({ what = "this" }) {
  return (
    <div className="rounded-xl border border-line dark:border-line bg-canvas dark:bg-gray-25/60 px-5 py-6 text-center">
      <p className="text-sm font-medium text-ink">{what} needs an active subscription</p>
      <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-secondary">
        CVAI unlocks with an individual subscription. Everything you have already done stays on your
        profile.
      </p>
    </div>
  );
}

export function EmptyNote({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-line dark:border-line bg-canvas/50 dark:bg-gray-25/40 px-5 py-8 text-center text-sm leading-relaxed text-secondary">
      {children}
    </div>
  );
}

/** A horizontal bar. Used for score, progress and budget alike. */
export function Meter({ value, tone = "bg-brand", height = "h-1.5" }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-line/50 dark:bg-gray-25/60 ${height}`}>
      <motion.div
        className={`rounded-full ${tone} ${height}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

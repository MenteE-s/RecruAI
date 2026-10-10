import React from "react";
import { NavLink } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { FiActivity, FiCheckSquare, FiCode, FiHelpCircle, FiTarget } from "react-icons/fi";

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
  { to: "/in/coaching", label: "Overview", icon: FiActivity, end: true },
  { to: "/in/coaching/skills", label: "Skills", icon: FiCheckSquare },
  { to: "/in/coaching/quizzes", label: "Quizzes", icon: FiHelpCircle },
  { to: "/in/coaching/projects", label: "Projects", icon: FiCode },
  { to: "/in/coaching/plan", label: "My plan", icon: FiTarget },
];

export { TABS as CVAI_TABS };

export default function CvaiShell({ title, subtitle, actions, children }) {
  return (
    <DashboardLayout>
      <div className="mb-5 border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-gray-900 px-2.5 py-1 text-[10px] font-semibold tracking-widest text-white">
              <FiActivity className="h-3 w-3" />
              CVAI
            </div>
            <h1 className="mt-2 text-2xl font-bold leading-tight text-gray-900">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-gray-600">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>

        <nav className="flex flex-wrap border-t border-gray-200">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-blue-600 text-blue-700"
                      : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
                  }`
                }>
                <Icon className="h-4 w-4" />
                {tab.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {children}
    </DashboardLayout>
  );
}

/** Small shared presentational bits, so five pages look like one product. */

export function Panel({ title, hint, children, className = "" }) {
  return (
    <section className={`border border-gray-200 bg-white ${className}`}>
      {title ? (
        <header className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {hint ? <p className="mt-0.5 text-xs text-gray-500">{hint}</p> : null}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Stat({ value, label, tone = "text-gray-900", hint }) {
  return (
    <div className="border border-gray-200 bg-white px-4 py-3">
      <p className={`text-2xl font-bold leading-none ${tone}`}>{value}</p>
      <p className="mt-1.5 text-xs text-gray-600">{label}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p> : null}
    </div>
  );
}

export function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-medium ${className}`}>
      {children}
    </span>
  );
}

export function Button({ children, variant = "primary", className = "", ...rest }) {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 border border-blue-600",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
    ghost: "bg-transparent text-gray-600 border border-transparent hover:bg-gray-50",
    danger: "bg-white text-red-700 border border-red-200 hover:bg-red-50",
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...rest}>
      {children}
    </button>
  );
}

export function Loading({ label = "Loading" }) {
  return (
    <div className="flex items-center gap-2 border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
      <span className="h-3 w-3 animate-pulse rounded-full bg-blue-600" />
      {label}…
    </div>
  );
}

export function ErrorNote({ children, onRetry }) {
  if (!children) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
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
    <div className="border border-gray-200 bg-gray-50 px-5 py-6 text-center">
      <p className="text-sm font-medium text-gray-800">{what} needs an active subscription</p>
      <p className="mx-auto mt-1.5 max-w-md text-xs text-gray-600">
        CVAI unlocks with an individual subscription. Everything you have already done stays on your
        profile.
      </p>
    </div>
  );
}

export function EmptyNote({ children }) {
  return (
    <div className="border border-dashed border-gray-300 bg-gray-50/50 px-5 py-8 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}

/** A horizontal bar. Used for score, progress and budget alike. */
export function Meter({ value, tone = "bg-blue-600", height = "h-1.5" }) {
  return (
    <div className={`w-full bg-gray-200 ${height}`}>
      <div className={tone} style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} />
    </div>
  );
}

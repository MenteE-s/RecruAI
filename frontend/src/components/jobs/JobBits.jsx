import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { cn } from "../../lib/cn";
export { JobCard } from "./JobCard";

/* ------------------------------------------------------------------ */
/* FilterChip — Stageshow-aligned filter chip (h-7, radius-8).        */
/* Selected = dark/ink fill; unselected = border-line on surface.      */
/* ------------------------------------------------------------------ */
export function FilterChip({ children, className, selected, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-7 items-center gap-2 rounded-lg border px-2.5 text-xs font-medium transition-colors select-none",
        selected
          ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
          : "border-line bg-surface text-ink hover:bg-gray-50 dark:border-line dark:bg-gray-25/80 dark:text-gray-200 dark:hover:bg-gray-25",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* StatusTag — Stageshow-aligned colored status chip.                  */
/* Tracks application stage with subtle depth and dark-mode parity.    */
/* ------------------------------------------------------------------ */
const STATUS_COLORS = {
  pending:   "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300",
  reviewed:  "border-brand/20 bg-brand/10 text-brand-border dark:border-brand/30 dark:bg-brand/15 dark:text-brand-underline",
  accepted:  "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300",
  rejected:  "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300",
  withdrawn: "border-line bg-surface text-gray-500 dark:border-line dark:bg-gray-25 dark:text-gray-500",
  screening: "border-line bg-gray-50 text-gray-700 dark:border-line dark:bg-gray-25/80 dark:text-gray-700",
  offer:     "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700/60 dark:bg-emerald-950/50 dark:text-emerald-200",
};

export function StatusTag({ children, status, className }) {
  const colorClass = STATUS_COLORS[status] ?? "border-line bg-surface text-gray-600 dark:border-line dark:bg-gray-25 dark:text-gray-500";
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-lg border px-2 text-xs font-medium leading-4 capitalize-none",
        colorClass,
        className
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* JobRow — Stageshow-aligned list row with exactly 12px padding.     */
/* Inset 12px vertical padding (py-3), 8-12px clearance for actions.  */
/* ------------------------------------------------------------------ */
export function JobRow({
  avatar,
  title,
  titleSuffix,
  meta,
  time,
  to,
  actions,
  mobileActions,
  className,
}) {
  const Tag = to ? Link : "div";
  return (
    <div
      className={cn(
        "border-b border-line dark:border-line transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-25/50",
        className
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Tag
          to={to}
          className="group flex min-w-0 flex-1 items-center gap-3"
        >
          {avatar ?? null}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-5 text-ink transition-colors group-hover:text-brand-text">
              {title}
              {titleSuffix && (
                <span className="font-normal text-gray-500 dark:text-gray-500"> {titleSuffix}</span>
              )}
            </p>
            {meta && (
              <p className="mt-0.5 truncate text-xs leading-4 text-gray-500 dark:text-gray-500">
                {meta}
              </p>
            )}
          </div>
        </Tag>
        {time && (
          <span className="hidden shrink-0 text-[11px] font-mono tabular-nums text-gray-500 dark:text-gray-500 sm:inline">
            {time}
          </span>
        )}
        {actions && <div className="hidden shrink-0 items-center gap-2 sm:flex">{actions}</div>}
      </div>
      {mobileActions && (
        <div className="flex items-center gap-2 px-4 pb-3 sm:hidden">
          {mobileActions}
        </div>
      )}
    </div>
  );
}

/**
 * Company/org mark — 40px square, radius 12 using Avatar primitive or img.
 */
export function OrgMark({ name, image, size = "lg" }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        loading="lazy"
        decoding="async"
        className={cn(
          "shrink-0 rounded-xl border border-line dark:border-line object-cover",
          size === "lg" && "h-10 w-10",
          size === "2xl" && "h-16 w-16 rounded-2xl"
        )}
      />
    );
  }
  return <Avatar name={name} size={size} rounded="xl" />;
}

/* ------------------------------------------------------------------ */
/* JobMetaGrid — 2-col on sm, 11px uppercase gray-400 labels,         */
/* 13px medium ink values with tabular metrics.                       */
/* ------------------------------------------------------------------ */
export function JobMetaGrid({ items }) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">
            <item.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            {item.label}
          </span>
          <span className={cn("text-[13px] font-medium leading-5 text-ink", item.mono && "font-mono tabular-nums")}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SkillGroup — neutral h-7 chips with 12px+ clearance and insets.    */
/* ------------------------------------------------------------------ */
export function SkillGroup({ title, skills }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold leading-4 text-ink">{title}</p>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex h-7 items-center rounded-lg border border-line bg-surface px-2.5 text-xs font-medium leading-4 text-ink dark:border-line dark:bg-gray-25/80 dark:text-gray-200"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ApplyButton — primary brand apply button (with arrow).              */
/* ------------------------------------------------------------------ */
export function ApplyButton({ children = "Apply", className, ...props }) {
  return (
    <Button variant="primary" size="md" className={cn("w-full sm:w-auto shadow-s5", className)} {...props}>
      {children}
      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
    </Button>
  );
}

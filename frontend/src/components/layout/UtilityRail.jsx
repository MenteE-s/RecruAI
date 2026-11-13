import { Link } from "react-router-dom";
import { FiArrowRight, FiZap } from "react-icons/fi";
import { cn } from "../../lib/cn";

/**
 * Shared Peerlist-style rail cards (rounded-xl / border-line / bg-surface /
 * shadow-s5). These match the reference RightRail card anatomy and are used
 * to fill the right rail on routes that previously rendered a narrow center
 * column with empty dead space on wide screens.
 */

export function RailCard({ title, action, children, className }) {
  return (
    <section className={cn("rounded-xl border border-line bg-surface p-4 shadow-s5", className)}>
      {(title || action) && (
        <div className="mb-2.5 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function QuickLinksCard({ title = "Quick links", links, className }) {
  return (
    <RailCard title={title} className={className}>
      <ul className="flex flex-col">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <li key={link.to}>
              <Link
                to={link.to}
                className="group flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-ink dark:text-gray-500 dark:hover:bg-gray-25 dark:hover:text-ink"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-gray-500 transition-colors group-hover:text-brand-text" />
                <span className="min-w-0 flex-1 truncate">{link.label}</span>
                <FiArrowRight className="h-3 w-3 shrink-0 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          );
        })}
      </ul>
    </RailCard>
  );
}

export function TipCard({ icon: Icon = FiZap, title = "Tip", body, className }) {
  return (
    <RailCard className={className}>
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-text">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-ink">{title}</p>
          {body && <p className="mt-0.5 text-xs leading-5 text-gray-500">{body}</p>}
        </div>
      </div>
    </RailCard>
  );
}

export function StatListCard({ title, stats, className }) {
  return (
    <RailCard title={title} className={className}>
      <div className="flex flex-col gap-2">
        {stats.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{row.label}</span>
            <span className="text-[13px] font-medium text-ink">{row.value}</span>
          </div>
        ))}
      </div>
    </RailCard>
  );
}

export function PeopleCard({ title = "People you may know", people, empty = "No suggestions yet.", onView, className }) {
  return (
    <RailCard title={title} className={className}>
      {people.length === 0 ? (
        <p className="py-2 text-center text-[11px] text-gray-500">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {people.map((person) => (
            <li key={person.id ?? person.name}>
              <button
                type="button"
                onClick={() => onView && onView(person)}
                className="flex w-full items-center gap-2.5 rounded-lg p-1 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-25"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E7F6EC] to-[#BFE3CF] text-[10px] font-bold text-[#334155]">
                  {(person.name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-ink">{person.name}</span>
                  {person.sub && <span className="block truncate text-[11px] text-gray-500">{person.sub}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </RailCard>
  );
}

/* ------------------------------------------------------------------ */
/* Candidate / organization workspace rails                           */
/* ------------------------------------------------------------------ */
/*
 * These used to hold a `Career toolkit` / `Recruitment` quick-link card plus a
 * marketing tip. Both repeated destinations that the sidebar already owns, so
 * they were removed (visual audit, Part B.1: one navigation per section). A
 * rail is now reserved for data — next interview, plan progress, preview — and
 * these helpers return null so a page can keep calling them safely until every
 * caller is migrated.
 */

export function CandidateQuickRail() {
  return null;
}

export function OrgQuickRail() {
  return null;
}

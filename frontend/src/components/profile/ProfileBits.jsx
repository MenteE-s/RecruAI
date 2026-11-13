import { Link } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import { Avatar } from "../ui/Avatar";
import { CenterBar } from "../layout/AppShell";
import { cn } from "../../lib/cn";

/* ------------------------------------------------------------------ */
/* ProfileBits — ports of the Peerlist reference profile components.   */
/* Visual source of truth: peerlist-reference-clone/src/components/    */
/* profile/ProfileBits.tsx. Data-agnostic: callers pass display values */
/* (P2 pages map backend DTOs onto these props).                        */
/* ------------------------------------------------------------------ */

/**
 * ProfileSkillChip — neutral Peerlist skill-chip styling (h-7, radius 8,
 * border-line on surface, 12px medium). No invented taxonomy glyphs.
 */
export function ProfileSkillChip({ label, className }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-lg border border-line bg-surface px-2 text-xs font-medium text-ink",
        className
      )}
    >
      {label}
    </span>
  );
}

/**
 * ProfileHero — avatar-centric hero (no banner). Reference: ProfileHero
 * in ProfileBits.tsx: centered 96px avatar, 20px/600 name, 13px headline,
 * 11px meta row, then skill-chip row.
 */
export function ProfileHero({ avatar, name, headline, meta, skills, className }) {
  return (
    <section className={cn("border-b border-line px-4 pb-5 pt-6 text-center", className)}>
      {avatar ?? <Avatar name={name} size="3xl" />}
      <h1 className="mt-3 text-[20px] font-semibold leading-7 text-ink">{name}</h1>
      {headline && (
        <p className="mx-auto mt-1 max-w-[420px] text-[13px] leading-5 text-gray-600">{headline}</p>
      )}
      {meta && (
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 text-[11px] text-gray-500">
          {meta}
        </div>
      )}
      {skills && skills.length > 0 && (
        <div className="mt-3.5 flex flex-wrap justify-center gap-1.5">
          {skills.map((skill) => (
            <ProfileSkillChip key={skill} label={skill} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * ProfileTopBar — reference ProfileTopBar: CenterBar with small avatar +
 * name + subtitle title, and an actions cluster (menu/message/follow in
 * the reference). We render whatever actions callers provide; no fake
 * actions are added here.
 */
export function ProfileTopBar({ backTo, backLabel, avatar, title, subtitle, actions, className }) {
  return (
    <CenterBar
      backTo={backTo}
      backLabel={backLabel}
      title={
        <div className="flex min-w-0 items-center gap-2">
          {avatar ?? null}
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-ink">{title}</p>
            {subtitle && <p className="truncate text-[11px] text-gray-500">{subtitle}</p>}
          </div>
        </div>
      }
      actions={actions}
      className={className}
    />
  );
}

/**
 * ExperienceRow — reference ExperienceRow: 36px initials tile, 13px/600
 * role, 12px company, 11px period/location meta, optional summary and an
 * optional verified indicator (brand check — Peerlist's BadgeCheck
 * equivalent).
 */
export function ExperienceRow({
  role,
  company,
  period,
  location,
  summary,
  verified,
  initials,
  logo,
  className,
}) {
  return (
    <div className={cn("flex gap-3 py-3.5", className)}>
      {logo ?? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-gray-50 text-[10px] font-bold uppercase text-gray-600 dark:bg-gray-25">
          {initials || (company || "?").slice(0, 2)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-ink">{role}</p>
            {company && <p className="truncate text-[12px] text-gray-600">{company}</p>}
          </div>
          {verified && (
            <span title="Verified" className="inline-flex shrink-0 items-center gap-1 text-[10px] text-gray-500">
              <FiCheckCircle className="h-3.5 w-3.5 text-brand-text" strokeWidth={2} />
            </span>
          )}
        </div>
        {(period || location) && (
          <p className="mt-1 text-[11px] text-gray-500">
            {period}
            {period && location && " · "}
            {location}
          </p>
        )}
        {summary && <p className="mt-1.5 text-[12px] leading-5 text-gray-600">{summary}</p>}
      </div>
    </div>
  );
}

/**
 * ProjectCard — reference ProjectCard: 64px gradient tile, 13px/600 title
 * (link optional), 13px tagline, 11px count row. Counts/links are props —
 * no fake interactions.
 */
export function ProjectCard({
  title,
  tagline,
  counts,
  to,
  icon,
  initials,
  className,
}) {
  return (
    <div className={cn("flex items-start gap-3 py-3.5", className)}>
      {icon ?? (
        <Avatar name={title} size="2xl" rounded="xl" className="shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        {to ? (
          <Link to={to} className="block truncate text-[13px] font-semibold text-ink hover:underline">
            {title}
          </Link>
        ) : (
          <p className="truncate text-[13px] font-semibold text-ink">{title}</p>
        )}
        {tagline && (
          <p className="mt-0.5 clamp-2 text-[13px] leading-5 text-gray-600">{tagline}</p>
        )}
        {counts && (
          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-500">
            {counts}
          </div>
        )}
      </div>
    </div>
  );
}

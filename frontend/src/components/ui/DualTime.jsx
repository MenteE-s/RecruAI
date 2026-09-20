import {
  formatDateTime,
  formatDateTimeCompact,
  formatDate,
  formatInTimezone,
  getRelativeTime,
  getUserTimezone,
  parseUTC,
} from "../../utils/timezone";

/**
 * Dual-time display: the viewer's local time (primary) side-by-side with
 * the other party's local time (secondary), plus relative time.
 *
 * Props:
 * - value: UTC datetime string (with or without offset) or ms timestamp
 * - otherTimezone: IANA timezone of the other party (org or person), or null
 * - otherLabel: display name of the other party (org name / person name)
 * - others: optional array of { timezone, label } for additional zones
 *   (zones matching the viewer's are hidden automatically)
 * - variant: "full" (date+time) | "compact" (short, for lists) | "date"
 * - showRelative: show "in 3h" / "2 days ago" line (default true)
 */
export default function DualTime({
  value,
  otherTimezone = null,
  otherLabel = null,
  others = null,
  variant = "full",
  showRelative = true,
  className = "",
}) {
  if (!value) return null;
  if (isNaN(parseUTC(value).getTime())) return null;

  const viewerTz = getUserTimezone();

  const zones = [];
  if (otherTimezone) zones.push({ timezone: otherTimezone, label: otherLabel });
  if (Array.isArray(others)) {
    for (const z of others) {
      if (z && z.timezone) zones.push({ timezone: z.timezone, label: z.label || null });
    }
  }
  const visible = zones.filter(
    (z, i) =>
      z.timezone !== viewerTz &&
      zones.findIndex((zz) => zz.timezone === z.timezone) === i
  );

  const primary =
    variant === "compact"
      ? formatDateTimeCompact(value)
      : variant === "date"
        ? formatDate(value)
        : formatDateTime(value);

  const secondaryOpts = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  };

  const relative = showRelative ? getRelativeTime(value) : null;

  return (
    <span className={`dual-time ${className}`}>
      <span className="dual-time-primary">{primary}</span>
      {visible.map((z) => (
        <span key={z.timezone} className="dual-time-secondary text-gray-500 text-sm">
          {" "}
          · {formatInTimezone(value, z.timezone, secondaryOpts)}
          {z.label ? ` (${z.label})` : ""}
        </span>
      ))}
      {relative && (
        <span className="dual-time-relative text-gray-500 text-sm">
          {" "}
          · {relative}
        </span>
      )}
    </span>
  );
}

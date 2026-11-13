import NumberFlow from "@number-flow/react";
import { cn } from "../../lib/cn";

/**
 * AnimatedNumber — NumberFlow wrapper for KPI counters and scores.
 * Falls back to a plain value when the input is missing.
 */
export default function AnimatedNumber({
  value,
  prefix,
  suffix,
  format,
  className,
  respectMotionPreference = true,
}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return <span className={className}>{prefix || ""}—</span>;
  }

  return (
    <span className={cn("inline-flex items-baseline", className)}>
      {prefix ? <span>{prefix}</span> : null}
      <NumberFlow
        value={numeric}
        format={format}
        respectMotionPreference={respectMotionPreference}
        className="tabular-nums"
      />
      {suffix ? <span>{suffix}</span> : null}
    </span>
  );
}

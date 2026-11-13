import { cn } from "../../lib/cn";
import { FiSearch } from "react-icons/fi";

/**
 * EmptyState — port of the Peerlist reference empty-state pattern.
 * Illustration block (soft tile + accent dots), title, optional body and action.
 */
export default function EmptyState({
  icon,
  title,
  body,
  action,
  className,
  compact,
}) {
  const Icon = icon || FiSearch;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center animate-popIn",
        compact ? "py-10" : "py-16",
        className
      )}
    >
      <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 rounded-2xl bg-gray-50 dark:bg-gray-25" aria-hidden />
        <span className="absolute -right-1 top-1 h-3 w-3 rounded-full bg-brand/25" aria-hidden />
        <span className="absolute -left-2 bottom-2 h-2 w-2 rounded-full bg-gray-300" aria-hidden />
        <Icon className="relative h-7 w-7 text-gray-500" strokeWidth={1.5} aria-hidden />
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {body && <p className="mt-1 max-w-[280px] text-[13px] leading-5 text-gray-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

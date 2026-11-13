import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";

/**
 * AnimatedTabBar — shared sliding-indicator tab switcher.
 *
 * Two modes:
 *  - links:   options={[{ to, label }]} active={currentPath}
 *  - buttons: tabs={[{ id, label }]} active={id} onChange={setId}
 *
 * The indicator uses a shared layoutId so it glides between tabs. Fast spring,
 * 150–250ms, and it collapses to a static state under reduced motion.
 */
export default function AnimatedTabBar({
  id = "tab",
  options,
  tabs,
  active,
  onChange,
  className,
  size = "sm",
}) {
  const reduce = useReducedMotion();
  const items = tabs || options || [];
  const wrap = items.length > 4;

  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center rounded-xl border border-line bg-gray-50 p-0.5 dark:bg-gray-50",
        wrap ? "h-auto max-w-full flex-wrap" : size === "sm" ? "h-[34px]" : "h-10",
        className
      )}
    >
      {items.map((item) => {
        const value = item.to ?? item.id;
        const isActive = value === active;
        const content = (
          <>
            {isActive && (
              <motion.span
                layoutId={reduce ? undefined : `tab-indicator-${id}`}
                className="absolute inset-0 rounded-[10px] border border-line bg-surface shadow-s5"
                transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {item.icon ? <item.icon className="h-4 w-4" strokeWidth={1.75} /> : null}
              {item.label}
            </span>
          </>
        );

        const classes = cn(
          "relative inline-flex items-center justify-center rounded-[10px] px-3 font-semibold transition-colors duration-150",
          size === "sm" ? "h-[30px] text-xs" : "h-9 text-[13px]",
          isActive ? "text-ink" : "text-gray-500 hover:text-ink"
        );

        if (item.to) {
          return (
            <Link
              key={value}
              to={item.to}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? "page" : undefined}
              className={classes}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange?.(value)}
            className={classes}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

import { cn } from "../../lib/cn";

/**
 * MotionIcon — CSS-only hover/active micro-motion for sidebar and header icons.
 * Transform-only, 150ms, so dense navigation stays smooth.
 */
export default function MotionIcon({
  icon: Icon,
  active = false,
  className,
  size = 18,
  strokeWidth,
  ...props
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 transition-transform duration-150 ease-out hover:scale-110 active:scale-95",
        active && "scale-105",
        className
      )}
    >
      <Icon
        size={size}
        strokeWidth={strokeWidth ?? (active ? 2 : 1.7)}
        {...props}
      />
    </span>
  );
}

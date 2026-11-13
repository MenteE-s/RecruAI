import { cn } from "../../lib/cn";

/**
 * ShimmerButton — Magic UI-style CTA with a slow, tasteful highlight sweep.
 * Renders an anchor or button; the sweep is pure CSS (transform only).
 */
export default function ShimmerButton({
  children,
  as: Component = "button",
  className,
  ...props
}) {
  return (
    <Component
      className={cn(
        "group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl",
        "border border-brand-action bg-brand-action px-7 text-sm font-semibold text-white",
        "transition-colors duration-150 hover:bg-brand/90 focus-visible:outline-none",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full motion-reduce:hidden"
      />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </Component>
  );
}

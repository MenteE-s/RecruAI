import { motion, useReducedMotion } from "motion/react";
import { cn } from "../../lib/cn";

/**
 * InteractiveCard — shared surface with a crisp hover lift.
 * Keeps the border treatment stable so dense grids never jitter.
 */
export default function InteractiveCard({
  children,
  className,
  onClick,
  as = "div",
  lift = 2,
  ...props
}) {
  const reduce = useReducedMotion();
  const Component = motion[as] || motion.div;
  const interactive = Boolean(onClick) || as === "button" || as === "a";

  return (
    <Component
      onClick={onClick}
      whileHover={reduce || !interactive ? undefined : { y: -lift }}
      whileTap={reduce || !interactive ? undefined : { scale: 0.995 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-xl border border-line bg-surface transition-[border-color,box-shadow,background-color] duration-150",
        interactive && "cursor-pointer hover:border-brand/35 hover:shadow-s10",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

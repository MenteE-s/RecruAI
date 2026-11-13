import { motion, useReducedMotion } from "motion/react";
import { cn } from "../../lib/cn";

const listVariants = (step, delay) => ({
  hidden: {},
  show: {
    transition: { staggerChildren: step, delayChildren: delay },
  },
});

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * StaggerList / StaggerItem — fast 30ms stagger for card lists and rows.
 * Items only animate transform + opacity so dense lists stay smooth.
 */
export function StaggerList({
  children,
  className,
  step = 0.03,
  delay = 0,
  as = "div",
  ...props
}) {
  const reduce = useReducedMotion();
  const Component = motion[as] || motion.div;

  if (reduce) {
    const Plain = as;
    return (
      <Plain className={className} {...props}>
        {children}
      </Plain>
    );
  }

  return (
    <Component
      initial="hidden"
      animate="show"
      variants={listVariants(step, delay)}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({ children, className, as = "div", ...props }) {
  const reduce = useReducedMotion();
  const Component = motion[as] || motion.div;

  if (reduce) {
    const Plain = as;
    return (
      <Plain className={className} {...props}>
        {children}
      </Plain>
    );
  }

  return (
    <Component variants={itemVariants} className={cn(className)} {...props}>
      {children}
    </Component>
  );
}

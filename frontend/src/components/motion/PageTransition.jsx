import { cn } from "../../lib/cn";

/**
 * PageTransition — subtle route settle used by every shell.
 * Pure CSS (opacity + 6px rise, 180ms) so the shared shell stays out of the
 * Motion feature bundle. Respects prefers-reduced-motion via index.css.
 */
export default function PageTransition({ children, className }) {
  return <div className={cn("page-transition", className)}>{children}</div>;
}

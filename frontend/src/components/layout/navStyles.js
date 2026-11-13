import { cn } from "../../lib/cn";

/** Shared sidebar geometry + item treatment for every app shell. */
export const sidebarShellClass =
  "sticky top-0 hidden h-screen w-[208px] shrink-0 flex-col border-r border-line bg-surface px-4 pb-5 pt-0 lg:flex xl:w-[220px] xl:px-5";

export const navRailClass =
  "pointer-events-none absolute left-0 top-0 z-10 w-0.5 rounded-full bg-brand transition-[transform,height,opacity] duration-200 ease-out";

export function navItemClass(active) {
  return cn(
    "group relative flex items-center gap-3 rounded-xl px-3 py-1.5 text-sm leading-normal transition-colors",
    active
      ? "bg-brand/10 font-semibold text-ink dark:bg-brand/20 dark:text-ink"
      : "font-normal text-gray-600 hover:bg-gray-100 hover:text-ink dark:text-gray-500 dark:hover:bg-gray-25/40 dark:hover:text-ink"
  );
}

export function navIconClass(active) {
  return cn(
    "h-4 w-4 shrink-0 transition-colors",
    active
      ? "text-brand-text"
      : "text-gray-500 group-hover:text-ink dark:text-gray-500 dark:group-hover:text-ink"
  );
}

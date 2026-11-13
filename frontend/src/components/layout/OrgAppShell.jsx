import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiActivity,
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiCreditCard,
  FiCpu,
  FiFileText,
  FiGlobe,
  FiMonitor,
  FiMoon,
  FiSearch,
  FiSettings,
  FiShare2,
  FiSun,
  FiTrendingUp,
  FiUserPlus,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { PageManagerContext } from "../page/PageManagerContext";
import { useTheme } from "../theme/ThemeContext";
import { CenterBar } from "./AppShell";
import { RightRail } from "./RightRail";
import PageTransition from "../motion/PageTransition";
import MotionIcon from "../motion/MotionIcon";
import useActiveRail from "./useActiveRail";
import { sidebarShellClass, navRailClass, navItemClass, navIconClass } from "./navStyles";
import { cn } from "../../lib/cn";

/**
 * Organization recruitAppShell — Peerlist-inspired recruiter shell.
 *
 * - Desktop: compact org sidebar (grouped navigation) + CenterBar + main
 *   content + optional rail.
 * - Mobile: recruiter-specific bottom navigation.
 * - When rendered inside PageManagerLayout (/page/*), the manager shell
 *   already provides chrome; this shell renders children bare (same
 *   contract as DashboardLayout).
 */
export const ORG_NAV = [
  {
    group: "Workspace",
    items: [
      { to: "/org/jobs", label: "Jobs", icon: FiBriefcase },
      { to: "/org/candidates", label: "Candidates", icon: FiUsers },
      { to: "/org/pipeline", label: "Pipeline", icon: FiTrendingUp },
      { to: "/org/interviews", label: "Interviews", icon: FiCalendar },
    ],
  },
  {
    group: "Recruitment",
    items: [
      { to: "/org/hire", label: "Hire people", icon: FiSearch },
      { to: "/org/candidate-analysis", label: "Candidate analysis", icon: FiZap },
      { to: "/org/ai-agents", label: "AI agents", icon: FiCpu },
    ],
  },
  {
    group: "Organization",
    items: [
      { to: "/org/team", label: "Team", icon: FiUserPlus },
      { to: "/org/reports", label: "Reports", icon: FiFileText },
      { to: "/org/analytics", label: "Analytics", icon: FiBarChart2 },
      { to: "/org/insights", label: "Insights", icon: FiActivity },
      { to: "/org/integrations", label: "Integrations", icon: FiShare2 },
      { to: "/org/browse", label: "Browse organizations", icon: FiGlobe },
    ],
  },
  {
    group: "Account",
    items: [
      { to: "/settings", label: "Settings", icon: FiSettings },
      { to: "/org/billing", label: "Billing", icon: FiCreditCard },
    ],
  },
];

export const ORG_MOBILE_NAV = [
  { to: "/org/jobs", label: "Jobs", icon: FiBriefcase },
  { to: "/org/candidates", label: "Candidates", icon: FiUsers },
  { to: "/org/pipeline", label: "Pipeline", icon: FiTrendingUp },
  { to: "/org/interviews", label: "Interviews", icon: FiCalendar },
  { to: "/settings", label: "Settings", icon: FiSettings },
];

export function isOrgNavActive(pathname, to) {
  if (to === "/settings") return pathname === "/settings" || pathname === "/org/profile";
  if (to === "/org/jobs") return pathname.startsWith("/org/jobs");
  if (to === "/org/candidate-analysis") return pathname.startsWith("/org/candidate-analysis");
  if (to === "/org/team") return pathname.startsWith("/org/team");
  return pathname === to || pathname.startsWith(to + "/");
}

export function OrgSidebar() {
  const { pathname } = useLocation();
  const { theme, cycleTheme } = useTheme();
  const { containerRef, rail } = useActiveRail(pathname);
  const ThemeIcon = theme === "dark" ? FiMoon : theme === "light" ? FiSun : FiMonitor;

  return (
    <div className={sidebarShellClass}>
      <div className="flex h-14 shrink-0 items-center">
        <Link to="/feed" className="text-base font-bold tracking-tight text-brand-text">RecruAI</Link>
      </div>

      <nav aria-label="Organization primary" ref={containerRef} className="relative mt-2 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-2">
        <span aria-hidden className={navRailClass} style={rail} />
        {ORG_NAV.map((group) => (
          <div key={group.group}>
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">{group.group}</p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isOrgNavActive(pathname, item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    data-nav-active={active ? "true" : undefined}
                    aria-current={active ? "page" : undefined}
                    className={navItemClass(active)}
                  >
                    <MotionIcon
                      icon={item.icon}
                      active={active}
                      size={16}
                      className={navIconClass(active)}
                      strokeWidth={active ? 2 : 1.6}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3 pt-6">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
          <Link to="/blog" className="t-min inline-flex items-center hover:text-ink">Blog</Link>
          <span aria-hidden>•</span>
          <Link to="/careers" className="t-min inline-flex items-center hover:text-ink">Careers</Link>
          <span aria-hidden>•</span>
          <Link to="/contact" className="t-min inline-flex items-center hover:text-ink">Support</Link>
          <span aria-hidden>•</span>
          <Link to="/terms" className="t-min inline-flex items-center hover:text-ink">Legal</Link>
        </div>

        <button
          type="button"
          onClick={cycleTheme}
          className="t-min flex w-fit items-center gap-1.5 rounded-lg text-xs text-gray-500 transition-colors hover:text-ink"
        >
          <ThemeIcon className="h-3.5 w-3.5" strokeWidth={1.6} />
          <span>Change {theme === "system" ? "System" : theme === "light" ? "Light" : "Dark"} theme</span>
        </button>

        <div className="flex flex-col gap-1">
          <p className="text-xs text-gray-500">© 2026 RecruAI, Inc.</p>
        </div>
      </div>
    </div>
  );
}

export function OrgMobileNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Organization primary mobile"
      className="fixed inset-x-0 bottom-0 z-50 flex h-[74px] items-start justify-around border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] pt-2 lg:hidden"
    >
      {ORG_MOBILE_NAV.map((item) => {
        const active = isOrgNavActive(pathname, item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex w-16 flex-col items-center gap-1 rounded-lg py-1 text-[10px] font-medium transition-colors",
              active ? "text-brand-text font-semibold" : "text-gray-500 hover:text-ink dark:text-gray-500 dark:hover:text-ink"
            )}
          >
            <item.icon className="h-5 w-5" strokeWidth={active ? 2 : 1.6} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function OrgAppShell({ title, subtitle, actions, rail, children, className }) {
  const insidePageManager = useContext(PageManagerContext);
  const { pathname } = useLocation();
  if (insidePageManager) return <>{children}</>;

  const hasRail = Boolean(rail);

  return (
    <div className="min-h-full bg-surface org-shell">
      <div
        className={cn(
          "mx-auto flex w-full items-start",
          hasRail ? "max-w-[1200px]" : "max-w-[1280px]"
        )}
      >
        <OrgSidebar />
        <main
          className={cn(
            "min-h-screen min-w-0 flex-1",
            hasRail ? "xl:w-[640px] xl:flex-none" : "max-w-5xl",
            className
          )}
        >
          <CenterBar title={title} subtitle={subtitle} actions={actions} />
          <PageTransition key={pathname}>{children}</PageTransition>
        </main>
        {hasRail && <RightRail>{rail}</RightRail>}
      </div>
      <OrgMobileNav />
    </div>
  );
}

export default OrgAppShell;

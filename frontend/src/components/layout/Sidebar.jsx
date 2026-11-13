import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Briefcase,
  Users,
  Compass,
  Video,
  User,
  Share2,
  Bell,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import MotionIcon from "../motion/MotionIcon";
import useActiveRail from "./useActiveRail";
import { sidebarShellClass, navRailClass, navItemClass, navIconClass } from "./navStyles";

const nav = [
  { to: "/feed", label: "Feed", icon: Home },
  { to: "/in/jobs", label: "Jobs", icon: Briefcase },
  { to: "/in/network", label: "Network", icon: Users },
  { to: "/in/coaching", label: "Coaching", icon: Compass },
  { to: "/in/interviews", label: "Interviews", icon: Video },
  { to: "/in/profile", label: "Profile", icon: User },
  { to: "/in/shareable-profiles", label: "Shareable profiles", icon: Share2 },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

export function isActivePath(pathname, to) {
  if (to === "/feed") return pathname === "/feed" || pathname.startsWith("/feed/");
  if (to === "/in/jobs") return pathname.startsWith("/in/jobs");
  if (to === "/in/network") return pathname.startsWith("/in/network");
  if (to === "/in/coaching") return pathname.startsWith("/in/coaching");
  if (to === "/in/interviews") return pathname.startsWith("/in/interviews");
  if (to === "/notifications") return pathname.startsWith("/notifications");
  return pathname === to;
}

export function Sidebar() {
  const { pathname } = useLocation();
  const { theme, cycleTheme } = useTheme();
  const { containerRef, rail } = useActiveRail(pathname);
  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <aside className={sidebarShellClass}>
      <div className="flex h-14 shrink-0 items-center px-1">
        <Link to="/feed" className="text-base font-bold tracking-tight text-brand-text hover:opacity-90 transition-opacity">
          RecruAI
        </Link>
      </div>

      <nav aria-label="Primary" ref={containerRef} className="relative mt-2 flex flex-col gap-0.5">
        <span aria-hidden className={navRailClass} style={rail} />
        {nav.map((item) => {
          const active = isActivePath(pathname, item.to);
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
                strokeWidth={active ? 2 : 1.75}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-line/60">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-500 px-1">
          <Link to="/blog" className="t-min inline-flex items-center hover:text-ink transition-colors">Blog</Link>
          <span aria-hidden className="text-gray-300 dark:text-gray-600">•</span>
          <Link to="/careers" className="t-min inline-flex items-center hover:text-ink transition-colors">Careers</Link>
          <span aria-hidden className="text-gray-300 dark:text-gray-600">•</span>
          <Link to="/contact" className="t-min inline-flex items-center hover:text-ink transition-colors">Support</Link>
          <span aria-hidden className="text-gray-300 dark:text-gray-600">•</span>
          <Link to="/terms" className="t-min inline-flex items-center hover:text-ink transition-colors">Legal</Link>
        </div>

        <button
          type="button"
          onClick={cycleTheme}
          className="t-min flex w-fit items-center gap-2 rounded-lg px-1.5 py-1 text-xs text-gray-500 transition-colors hover:text-ink hover:bg-gray-100/60 dark:text-gray-500 dark:hover:text-ink dark:hover:bg-gray-25/40"
        >
          <ThemeIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          <span>Change {theme === "system" ? "system" : theme === "light" ? "light" : "dark"} theme</span>
        </button>

        <div className="flex flex-col gap-1 px-1">
          <p className="text-[11px] text-gray-500 dark:text-gray-500">© 2026 RecruAI, Inc.</p>
        </div>
      </div>
    </aside>
  );
}
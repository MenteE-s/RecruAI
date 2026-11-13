import { Link, useLocation } from "react-router-dom";
import { FiArrowLeft, FiBriefcase, FiEdit2, FiHome, FiSearch, FiShare2, FiUser } from "react-icons/fi";
import { Sidebar } from "./Sidebar";
import { RightRail } from "./RightRail";
import SignedInAccountBar from "./SignedInAccountBar";
import { IconButton } from "../ui/Button";
import PageTransition from "../motion/PageTransition";
import { cn } from "../../lib/cn";

export function AppShell({ children, rail, railActions, className }) {
  const hasRail = Boolean(rail);
  const { pathname } = useLocation();

  return (
    <div className="min-h-full bg-surface">
      <div
        className={cn(
          "mx-auto flex w-full items-start",
          hasRail ? "max-w-[1200px]" : "max-w-[1280px]"
        )}
      >
        <Sidebar />
        <main
          className={cn(
            "min-h-screen min-w-0 flex-1",
            hasRail ? "xl:w-[640px] xl:flex-none" : "max-w-5xl",
            className
          )}
        >
          <PageTransition key={pathname}>{children}</PageTransition>
        </main>
        {hasRail ? <RightRail actions={railActions}>{rail}</RightRail> : null}
      </div>
      <ComposeFab />
      <MobileNav />
    </div>
  );
}

export function CenterBar({ title, subtitle, backTo, backLabel, actions, children, className }) {
  const isAuth = typeof window !== "undefined" && localStorage.getItem("isAuthenticated") === "true";

  return (
    <header className={cn("sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-[6px]", className)}>
      <div className="flex h-14 items-center gap-2 px-4">
        {backTo ? (
          <Link
            to={backTo}
            aria-label={backLabel ?? "Go back"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-ink transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <FiArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </Link>
        ) : null}
        <div className="min-w-0 flex-1">
          {typeof title === "string" ? (
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-ink">{title}</h1>
              {subtitle ? <p className="truncate text-[11px] text-gray-500">{subtitle}</p> : null}
            </div>
          ) : (
            title
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {actions ? <div className="hidden items-center gap-1.5 sm:flex">{actions}</div> : null}
          {isAuth ? <SignedInAccountBar compact className="shrink-0" /> : null}
        </div>
      </div>
      {children}
    </header>
  );
}

export function ComposeFab() {
  return (
    <button
      type="button"
      aria-label="Write a post"
      className="fixed bottom-20 right-[18px] z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-action text-white shadow-s15 transition-transform hover:scale-[1.03] active:scale-95 lg:hidden"
    >
      <FiEdit2 className="h-5 w-5" strokeWidth={1.9} />
    </button>
  );
}

const mobileNav = [
  { to: "/feed", label: "Feed", icon: FiHome },
  { to: "/in/jobs", label: "Jobs", icon: FiBriefcase },
  { to: "/search", label: "Search", icon: FiSearch },
  { to: "/in/coaching", label: "Coaching", icon: FiEdit2 },
  { to: "/in/profile", label: "Profile", icon: FiUser },
  { to: "/in/shareable-profiles", label: "Shareable", icon: FiShare2 },
];

export function MobileNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-50 flex h-[74px] items-start justify-around border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] pt-2 lg:hidden"
    >
      {mobileNav.map((item) => {
        const active = pathname === item.to || pathname.startsWith(item.to + "/");
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex w-16 flex-col items-center gap-1 rounded-lg py-1 text-[10px] font-medium transition-colors",
              active ? "text-brand-text" : "text-gray-500"
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

export function BackIconButton({ to, label }) {
  return (
    <Link to={to} aria-label={label} className="inline-flex h-8 w-8 items-center justify-center rounded-xl hover:bg-gray-50">
      <FiArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.8} />
    </Link>
  );
}

export { IconButton };

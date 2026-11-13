// Page manager — the back office for a company page.
//
// Signup is individuals-only, so the person who founded a page is still an
// `individual` account. This is where they run the company side: change the
// page profile, post jobs, run interviews, manage the team, and decide who can
// see the page at all. Their personal dashboard stays separate and untouched.
//
// It owns the header/footer chrome and renders the page sidebar. Existing
// /organization/* pages are reused as children unchanged — DashboardLayout
// detects the PageManagerContext and renders bare.
import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { PageManagerContext } from "./PageManagerContext";
import { getCurrentUser, getBackendUrl, getAuthHeaders, getUploadUrl, orgPath } from "../../utils/auth";
import PageTransition from "../motion/PageTransition";
import { sidebarShellClass, navRailClass, navItemClass, navIconClass } from "../layout/navStyles";
import useActiveRail from "../layout/useActiveRail";
import { useTheme } from "../theme/ThemeContext";
import {
  Home,
  User,
  FileText,
  Calendar,
  Users,
  TrendingUp,
  BarChart2,
  Cpu,
  Settings,
  Eye,
  PlusCircle,
  ChevronRight,
  Briefcase,
  CreditCard,
  Menu,
  X,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";

const SECTIONS = [
  {
    group: "Page",
    items: [
      { to: "/page", label: "Overview", icon: Home, exact: true, permission: "org.view" },
      { to: "/page/profile", label: "Page profile", icon: User, permission: "org.edit" },
      { to: "/page/visibility", label: "Visibility", icon: Eye, permission: "org.edit" },
    ],
  },
  {
    group: "Hiring",
    items: [
      { to: "/page/posts", label: "Job posts", icon: FileText, permission: "hiring.view" },
      { to: "/page/candidates", label: "Candidates", icon: Users, permission: "hiring.view" },
      { to: "/page/interviews", label: "Interviews", icon: Calendar, permission: "interviews.view" },
      { to: "/page/pipeline", label: "Pipeline", icon: TrendingUp, permission: "hiring.view" },
    ],
  },
  {
    group: "Manage",
    items: [
      { to: "/page/team", label: "Team members", icon: Users, permission: "team.view" },
      { to: "/page/analytics", label: "Analytics", icon: BarChart2, permission: "analytics.view" },
      { to: "/page/agents", label: "AI agents", icon: Cpu, permission: "ai_agents.view" },
      { to: "/page/billing", label: "Billing", icon: CreditCard, permission: "org.edit" },
      { to: "/page/settings", label: "Page settings", icon: Settings, permission: "org.edit" },
    ],
  },
];

export default function PageManagerLayout({ children, title, subtitle, action }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { containerRef: navRef, rail } = useActiveRail(location.pathname);
  const { theme, cycleTheme } = useTheme();
  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await getCurrentUser();
        if (cancelled) return;
        if (!user?.organization_id) {
          setOrg(null);
          setLoading(false);
          return;
        }
        const res = await fetch(`${getBackendUrl()}/api/organizations/${user.organization_id}`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Could not load your page");
        if (!cancelled) setOrg(await res.json());
      } catch (err) {
        if (!cancelled) setError("Could not load your company page.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileNavOpen(false); }, [location.pathname]);

  // Loading skeleton maintaining full layout chrome
  if (loading) {
    return (
      <PageManagerContext.Provider value={true}>
        <div className="min-h-screen bg-surface flex overflow-hidden org-shell">
          <aside className="sticky top-0 hidden h-screen w-[210px] shrink-0 flex-col border-r border-line bg-surface px-5 pb-5 pt-0 lg:flex xl:w-[220px] xl:px-6">
            <div className="flex h-14 shrink-0 items-center px-1 border-b border-line">
              <span className="text-base font-bold tracking-tight text-brand-text">RecruAI</span>
            </div>
            <div className="flex items-center gap-2.5 px-1 py-3 border-b border-line">
              <div className="h-9 w-9 shrink-0 rounded-lg skeleton" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded skeleton" />
                <div className="h-2.5 w-16 rounded skeleton" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-6 rounded-lg skeleton" />
              ))}
            </div>
          </aside>
          <main className="flex-1 min-w-0 overflow-y-auto px-4 md:px-6 py-5" aria-busy="true">
            <div className="mx-auto w-full max-w-5xl">
              <div className="flex h-14 items-center border-b border-line">
                <div className="h-3.5 w-40 rounded skeleton" />
              </div>
              <div className="mt-5 space-y-3">
                <div className="h-28 rounded-xl skeleton" />
                <div className="h-40 rounded-xl skeleton" />
              </div>
            </div>
          </main>
        </div>
      </PageManagerContext.Provider>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4 dark:bg-gray-25">
        <div className="bg-surface border border-line rounded-xl p-6 text-center max-w-sm shadow-s5">
          <p className="text-sm font-semibold text-ink">Something went wrong</p>
          <p className="mt-1.5 text-xs text-gray-500">{error}</p>
          <Link
            to="/feed"
            className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand/90 shadow-s5 transition-colors"
          >
            Back to my feed
          </Link>
        </div>
      </div>
    );
  }

  // No page yet: offer to create one rather than showing an empty sidebar.
  if (!org) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4 dark:bg-gray-25">
        <div className="bg-surface border border-line rounded-xl p-6 text-center max-w-md shadow-s5">
          <div className="h-12 w-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto">
            <Briefcase className="h-5 w-5 text-brand-text" strokeWidth={1.75} />
          </div>
          <h1 className="mt-3.5 text-base font-bold text-ink">You don't have a page yet</h1>
          <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
            A company page is where you post jobs and hire. Creating one takes a minute,
            and you'll be its first admin.
          </p>
          <button
            onClick={() => navigate("/page/create")}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand/90 shadow-s5 transition-colors"
          >
            <PlusCircle className="h-4 w-4" strokeWidth={1.75} /> Create a company page
          </button>
          <Link
            to="/feed"
            className="mt-3 block text-[11.5px] font-medium text-gray-500 hover:text-ink transition-colors"
          >
            Back to my feed
          </Link>
        </div>
      </div>
    );
  }

  const permissions = org?.access?.permissions || [];
  const hasPermission = (permission) => !permission || permissions.includes(permission);
  const visibleSections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => hasPermission(item.permission)),
  })).filter((section) => section.items.length > 0);
  const currentAllowed = visibleSections.some((section) =>
    section.items.some((item) =>
      item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)
    )
  );

  const isActive = (item) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);

  const sectionTitle =
    title ||
    SECTIONS.flatMap((section) => section.items).find((item) => isActive(item))?.label ||
    "Page manager";

  const logo = org.profile_image
    ? getUploadUrl(org.profile_image)
    : null;

  const sidebar = (
    <nav ref={navRef} className="relative space-y-3">
      <span aria-hidden className={navRailClass} style={rail} />
      <div className="flex h-14 shrink-0 items-center px-1 border-b border-line">
        <Link to="/feed" className="text-base font-bold tracking-tight text-brand-text">RecruAI</Link>
      </div>

      {/* Page identity */}
      <div className="flex items-center gap-2.5 px-1 pb-3 border-b border-line">
        {logo ? (
          <img src={logo} alt="" className="h-9 w-9 rounded-lg object-cover border border-line shrink-0" />
        ) : (
          <div className="h-9 w-9 rounded-lg bg-brand flex items-center justify-center text-white text-[13px] font-bold shrink-0 uppercase shadow-s5">
            {(org.name || "?").charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[12.5px] font-bold text-ink truncate leading-tight">{org.name}</p>
          <p className="text-[10.5px] text-gray-500 truncate">
            {org.is_public ? "Public page" : "Private page"}
            {org.access?.role ? ` · ${org.access.role}` : ""}
          </p>
        </div>
      </div>

      {visibleSections.map((section) => (
        <div key={section.group}>
          <p className="px-1 mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            {section.group}
          </p>
          <ul className="relative space-y-1">
            {section.items.map((item) => {
              const active = isActive(item);
              const ItemIcon = item.icon;
              return (
                <li key={item.to}>
                  <button
                    onClick={() => navigate(item.to)}
                    data-nav-active={active ? "true" : undefined}
                    className={`w-full ${navItemClass(active)}`}>
                    <ItemIcon className={navIconClass(active)} strokeWidth={1.75} />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="pt-3 border-t border-line space-y-1">
        <button
          onClick={() => navigate("/page/create")}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12.5px] text-gray-600 hover:bg-gray-100 hover:text-ink dark:text-gray-500 dark:hover:bg-gray-25 dark:hover:text-ink transition-colors"
        >
          <PlusCircle className="h-4 w-4 text-gray-500 shrink-0" strokeWidth={1.75} />
          <span>Add another page</span>
        </button>
        <Link
          to={orgPath(org)}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12.5px] text-gray-600 hover:bg-gray-100 hover:text-ink dark:text-gray-500 dark:hover:bg-gray-25 dark:hover:text-ink transition-colors"
        >
          <Eye className="h-4 w-4 text-gray-500 shrink-0" strokeWidth={1.75} />
          <span className="truncate">View public page</span>
          <ChevronRight className="h-3.5 w-3.5 text-gray-500 ml-auto shrink-0" strokeWidth={1.75} />
        </Link>
        {/* Synchronized micro-footer links */}
        <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-line">
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
            className="flex w-fit items-center gap-1.5 rounded-xl text-xs text-gray-500 transition-colors hover:text-ink"
          >
            <ThemeIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Change {theme === "system" ? "System" : theme === "light" ? "Light" : "Dark"} theme</span>
          </button>

          <div className="flex flex-col gap-1">
            <p className="text-xs text-gray-500">© 2026 RecruAI, Inc.</p>
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <PageManagerContext.Provider value={true}>
      <div className="min-h-screen bg-surface flex flex-col overflow-hidden org-shell">
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop sidebar */}
          <aside className={`${sidebarShellClass} overflow-y-auto`}>
            {sidebar}
          </aside>

          {/* Mobile drawer */}
          {mobileNavOpen && (
            <div className="md:hidden fixed inset-0 z-40">
              <div
                className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
                onClick={() => setMobileNavOpen(false)}
              />
              <aside className="absolute left-0 top-0 bottom-0 w-64 bg-surface overflow-y-auto px-4 py-4 border-r border-line shadow-s15">
                <div className="flex justify-end pb-2">
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    className="p-1 rounded-xl text-gray-500 hover:text-ink hover:bg-gray-100 dark:hover:bg-gray-25"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
                {sidebar}
              </aside>
            </div>
          )}

          <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth px-4 md:px-6 py-5">
            <div className="flex items-start gap-3 mb-4 md:hidden">
              <button
                type="button"
                onClick={() => setMobileNavOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-surface text-xs font-semibold text-ink hover:bg-gray-100 dark:hover:bg-gray-25 shadow-s5 transition-colors"
              >
                <Menu className="h-4 w-4 text-gray-500" strokeWidth={1.75} />
                <span>Menu</span>
              </button>
            </div>
            <div className="w-full max-w-5xl mx-auto">
              <span className="sr-only">
                {sectionTitle}
                {subtitle ? ` — ${subtitle}` : ""}
              </span>
              {action ? <div className="mb-4">{action}</div> : null}
              {permissions.length === 0 || !currentAllowed ? (
                <div className="bg-surface border border-line rounded-xl p-6 text-center max-w-lg mx-auto shadow-s5">
                  <p className="text-sm font-semibold text-ink">You don't have access to this page</p>
                  <p className="mt-1.5 text-xs text-gray-500">
                    Your role on this page doesn't include this action. Ask an admin if you need access.
                  </p>
                  <button
                    onClick={() => navigate("/page")}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand/90 shadow-s5 transition-colors"
                  >
                    Back to overview
                  </button>
                </div>
              ) : (
                <PageTransition key={location.pathname}>{children}</PageTransition>
              )}
            </div>
          </main>
        </div>
      </div>
    </PageManagerContext.Provider>
  );
}

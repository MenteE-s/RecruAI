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
import Header from "../layout/Header";
import DashboardFooter from "../layout/DashboardFooter";
import { PageManagerContext } from "./PageManagerContext";
import MenteeLoader from "../ui/MenteeLoader";
import { getCurrentUser, getBackendUrl, getAuthHeaders, getUploadUrl, orgPath } from "../../utils/auth";
import {
  FiHome, FiUser, FiFileText, FiCalendar, FiUsers, FiTrendingUp,
  FiBarChart2, FiCpu, FiSettings, FiEye, FiPlusCircle, FiChevronRight,
  FiBriefcase,
} from "react-icons/fi";

const SECTIONS = [
  {
    group: "Page",
    items: [
      { to: "/page", label: "Overview", icon: FiHome, exact: true },
      { to: "/page/profile", label: "Page profile", icon: FiUser },
      { to: "/page/visibility", label: "Visibility", icon: FiEye },
    ],
  },
  {
    group: "Recruiting",
    items: [
      { to: "/page/posts", label: "Job posts", icon: FiFileText },
      { to: "/page/candidates", label: "Candidates", icon: FiUsers },
      { to: "/page/interviews", label: "Interviews", icon: FiCalendar },
      { to: "/page/pipeline", label: "Pipeline", icon: FiTrendingUp },
    ],
  },
  {
    group: "Insights",
    items: [
      { to: "/page/analytics", label: "Analytics", icon: FiBarChart2 },
      { to: "/page/agents", label: "AI agents", icon: FiCpu },
    ],
  },
  {
    group: "Manage",
    items: [
      { to: "/page/team", label: "Team members", icon: FiUsers },
      { to: "/page/settings", label: "Page settings", icon: FiSettings },
    ],
  },
];

export default function PageManagerLayout({ children, title, subtitle, action }) {
  const navigate = useNavigate();
  const location = useLocation();
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

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <MenteeLoader size={60} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center max-w-sm">
          <p className="text-sm font-semibold text-gray-900">Something went wrong</p>
          <p className="mt-1 text-xs text-gray-500">{error}</p>
          <Link
            to="/feed"
            className="mt-4 inline-block px-3.5 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 text-center max-w-md">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto">
            <FiBriefcase className="w-5 h-5 text-blue-600" />
          </div>
          <h1 className="mt-3 text-base font-bold text-gray-900">You don't have a page yet</h1>
          <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
            A company page is where you post jobs and hire. Creating one takes a minute,
            and you'll be its first admin.
          </p>
          <button
            onClick={() => navigate("/page/create")}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            <FiPlusCircle className="w-3.5 h-3.5" /> Create a company page
          </button>
          <Link
            to="/feed"
            className="mt-3 block text-[11.5px] font-medium text-gray-500 hover:text-gray-800"
          >
            Back to my feed
          </Link>
        </div>
      </div>
    );
  }

  const isActive = (item) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);

  const logo = org.profile_image
    ? getUploadUrl(org.profile_image)
    : null;

  const sidebar = (
    <nav className="space-y-4">
      {/* Page identity */}
      <div className="flex items-center gap-2.5 px-1 pb-3 border-b border-gray-200">
        {logo ? (
          <img src={logo} alt="" className="w-9 h-9 rounded-lg object-cover border border-gray-200 shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-[13px] font-bold shrink-0 uppercase">
            {(org.name || "?").charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[12.5px] font-bold text-gray-900 truncate leading-tight">{org.name}</p>
          <p className="text-[10.5px] text-gray-500 truncate">
            {org.is_public ? "Public page" : "Private page"}
          </p>
        </div>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.group}>
          <p className="px-1 mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {section.group}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(item);
              return (
                <li key={item.to}>
                  <button
                    onClick={() => navigate(item.to)}
                    className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[12.5px] transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-blue-600" : "text-gray-400"}`} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="pt-3 border-t border-gray-200">
        <button
          onClick={() => navigate("/page/create")}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[12.5px] text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <FiPlusCircle className="w-3.5 h-3.5 text-gray-400" />
          Add another page
        </button>
        <Link
          to={orgPath(org)}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[12.5px] text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <FiEye className="w-3.5 h-3.5 text-gray-400" />
          View public page
          <FiChevronRight className="w-3 h-3 text-gray-300 ml-auto" />
        </Link>
      </div>
    </nav>
  );

  return (
    <PageManagerContext.Provider value={true}>
      <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 flex overflow-hidden">
          {/* Desktop sidebar */}
          <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white overflow-y-auto px-3 py-3">
            {sidebar}
          </aside>

          {/* Mobile drawer */}
          {mobileNavOpen && (
            <div className="md:hidden fixed inset-0 z-40">
              <div
                className="absolute inset-0 bg-gray-900/50"
                onClick={() => setMobileNavOpen(false)}
              />
              <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white overflow-y-auto px-3 py-3 border-r border-gray-200">
                {sidebar}
              </aside>
            </div>
          )}

          <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth px-3 md:px-5 py-4">
            {(title || mobileNavOpen) && (
              <div className="flex items-start gap-3 mb-4 md:hidden">
                <button
                  onClick={() => setMobileNavOpen((o) => !o)}
                  className="px-2.5 py-1.5 rounded-md border border-gray-200 bg-white text-xs font-semibold text-gray-600"
                >
                  Menu
                </button>
              </div>
            )}
            <div className="w-full max-w-4xl mx-auto">
              {(title || action) && (
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    {title && <h1 className="text-base font-bold text-gray-900 tracking-tight">{title}</h1>}
                    {subtitle && <p className="text-[11.5px] text-gray-500 mt-0.5">{subtitle}</p>}
                  </div>
                  {action && <div className="shrink-0">{action}</div>}
                </div>
              )}
              {children}
            </div>
          </main>
        </div>

        <DashboardFooter />
      </div>
    </PageManagerContext.Provider>
  );
}
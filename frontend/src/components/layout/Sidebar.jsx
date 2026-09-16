import { useLocation, useNavigate } from "react-router-dom";
import { FiMenu, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import SignOutButton from "../ui/SignOutButton";

export default function Sidebar({ open, toggleSidebar, items = [], collapsed = false, onToggleCollapse }) {
  const location = useLocation();
  const navigate = useNavigate();

  const mainItems = items.filter((i) => i.section === "main");
  const interviewItems = items.filter((i) => i.section === "interviews");
  const jobItems = items.filter((i) => i.section === "jobs");
  const activityItems = items.filter((i) => i.section === "activity");
  const aiItems = items.filter((i) => i.section === "ai");
  const proItems = items.filter((i) => i.section === "pro");
  const candidateItems = items.filter((i) => i.section === "candidates");
  const bottomItems = items.filter((i) => i.section === "bottom");
  const settingsItem = bottomItems.find((i) => i.name === "Settings");
  const signOutItem = bottomItems.find((i) => i.name === "Sign Out");

  const isActive = (link) => location.pathname === link;

  const handleNavClick = (item) => {
    navigate(item.link);
    if (open) toggleSidebar();
  };

  const NavItem = ({ item }) => {
    const active = isActive(item.link);
    return (
      <li>
        <button
          onClick={() => handleNavClick(item)}
          title={collapsed ? item.name : undefined}
          className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
            collapsed ? "md:justify-center md:px-0" : ""
          } ${
            active
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <item.icon
            className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-gray-400"}`}
          />
          <span className={collapsed ? "md:hidden" : ""}>{item.name}</span>
        </button>
      </li>
    );
  };

  const Section = ({ children }) => {
    if (!children || children.length === 0) return null;
    return (
      <ul className="space-y-0.5">
        {children.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </ul>
    );
  };

  const Separator = () => (
    <div className="border-t border-gray-200 my-2" />
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-30 p-1 rounded-lg bg-white shadow-md border border-gray-200"
      >
        <FiMenu className="h-5 w-5 text-gray-600" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 w-48 ${
          collapsed ? "md:w-16" : "md:w-48"
        } md:shrink-0 bg-white border-r border-gray-200 transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-all duration-200 ease-in-out h-screen flex flex-col`}
      >
        {/* Brand */}
        <div className={`px-3 py-3 flex items-center gap-2 ${collapsed ? "md:justify-center md:px-0" : ""}`}>
          <img
            src="/mentee-logo.png"
            alt="MenteE Logo"
            className="w-6 h-6 rounded-lg object-contain shrink-0"
          />
          <span className={`text-sm font-medium text-gray-900 ${collapsed ? "md:hidden" : ""}`}>RecruAI</span>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden md:flex ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {collapsed ? <FiChevronsRight className="w-4 h-4" /> : <FiChevronsLeft className="w-4 h-4" />}
            </button>
          )}
        </div>



        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <Section>{mainItems}</Section>

          {interviewItems.length > 0 && (
            <>
              <Separator />
              <Section>{interviewItems}</Section>
            </>
          )}

          {jobItems.length > 0 && (
            <>
              <Separator />
              <Section>{jobItems}</Section>
            </>
          )}

          {candidateItems.length > 0 && (
            <>
              <Separator />
              <Section>{candidateItems}</Section>
            </>
          )}

          {activityItems.length > 0 && (
            <>
              <Separator />
              <Section>{activityItems}</Section>
            </>
          )}

          {proItems.length > 0 && (
            <>
              <Separator />
              <Section>{proItems}</Section>
            </>
          )}

          {aiItems.length > 0 && (
            <>
              <Separator />
              <Section>{aiItems}</Section>
            </>
          )}
        </nav>

        {/* Bottom section - Settings & Sign Out */}
        <div className="px-2 py-2 border-t border-gray-200">
          {settingsItem && (
            <button
              onClick={() => handleNavClick(settingsItem)}
              title={collapsed ? "Settings" : undefined}
              className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
                collapsed ? "md:justify-center md:px-0" : ""
              } ${
                isActive(settingsItem.link)
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <settingsItem.icon
                className={`w-5 h-5 shrink-0 ${isActive(settingsItem.link) ? "text-white" : "text-gray-400"}`}
              />
              <span className={collapsed ? "md:hidden" : ""}>Settings</span>
            </button>
          )}
          {signOutItem && <SignOutButton variant="sidebar" iconOnly={collapsed} />}
        </div>
      </aside>
    </>
  );
}

import { useLocation, useNavigate } from "react-router-dom";
import { FiMenu, FiLogOut } from "react-icons/fi";
import { getBackendUrl } from "../../utils/auth";

export default function Sidebar({ open, toggleSidebar, items = [] }) {
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
    if (item.name === "Sign Out") {
      handleSignOut();
      return;
    }
    navigate(item.link);
    if (open) toggleSidebar();
  };

  const handleSignOut = async () => {
    try {
      await fetch(`${getBackendUrl()}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {}
    localStorage.removeItem("access_token");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("authRole");
    localStorage.removeItem("authPlan");
    navigate("/signin", { replace: true });
  };

  const NavItem = ({ item }) => {
    const active = isActive(item.link);
    return (
      <li>
        <button
          onClick={() => handleNavClick(item)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
            active
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <item.icon
            className={`w-5 h-5 shrink-0 ${active ? "text-white" : "text-gray-400"}`}
          />
          <span>{item.name}</span>
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
    <div className="border-t border-gray-200 my-3" />
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-white shadow-md border border-gray-200"
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
        className={`fixed md:relative inset-y-0 left-0 z-40 w-64 md:w-64 md:shrink-0 bg-white border-r border-gray-200 transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-200 ease-in-out h-screen flex flex-col`}
      >
        {/* Brand */}
        <div className="px-5 py-5 flex items-center gap-2.5">
          <img
            src="/mentee-logo.png"
            alt="MenteE Logo"
            className="w-8 h-8 rounded-lg object-contain"
          />
          <span className="text-lg font-bold text-gray-900">RecruAI</span>
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
        <div className="px-3 py-3 border-t border-gray-200">
          {settingsItem && (
            <button
              onClick={() => handleNavClick(settingsItem)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive(settingsItem.link)
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <settingsItem.icon
                className={`w-5 h-5 shrink-0 ${isActive(settingsItem.link) ? "text-white" : "text-gray-400"}`}
              />
              <span>Settings</span>
            </button>
          )}
          {signOutItem && (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
            >
              <FiLogOut className="w-5 h-5 shrink-0 text-gray-400" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

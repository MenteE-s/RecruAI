// src/components/layout/Sidebar.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import { getBackendUrl, getAuthHeaders } from "../../utils/auth";

export default function Sidebar({ open, toggleSidebar, items = [] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  // Separate settings from other items if it exists
  const topItems = items.filter((i) => i.name !== "Setting");
  const settingsItem = items.find((i) => i.name === "Setting");

  // Helper function to check if link is active
  const isActive = (link) => {
    return location.pathname === link;
  };

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!settingsOpen) return;
      if (!settingsRef.current) return;
      if (settingsRef.current.contains(e.target)) return;
      setSettingsOpen(false);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [settingsOpen]);

  const signOut = async () => {
    try {
      await fetch(`${getBackendUrl()}/api/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
    } catch (e) {
      // ignore network errors
    }
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("authRole");
      localStorage.removeItem("authPlan");
    } catch (e) {
      // ignore
    }
    setSettingsOpen(false);
    navigate("/signin", { replace: true });
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-20 p-2 rounded-lg bg-white shadow"
      >
        <FiMenu className="h-6 w-6 text-secondary-700" />
      </button>

      {/* Sidebar - use flex-col so we can pin settings to the bottom */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-10 w-64 bg-white border-r border-secondary-200 transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out h-full md:h-screen flex flex-col`}
        aria-label="Sidebar"
      >
        <div className="p-6 border-b border-secondary-200">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary-600 to-accent-500 font-display">
            MenteE / RecruAI
          </h1>
        </div>

        {/* main nav grows */}
        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {topItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.link}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    isActive(item.link)
                      ? "bg-primary-100 text-primary-700 border-r-2 border-primary-500"
                      : "text-secondary-700 hover:bg-primary-50 hover:text-primary-700"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* pinned footer */}
        {settingsItem && (
          <div className="p-4 border-t border-secondary-200 mt-auto">
            <div className="relative" ref={settingsRef}>
              {settingsOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-secondary-200 rounded-lg shadow-lg overflow-hidden">
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      navigate(settingsItem.link);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-secondary-700 hover:bg-primary-50"
                  >
                    Settings
                  </button>
                  <button
                    onClick={signOut}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition ${
                  isActive(settingsItem.link)
                    ? "bg-primary-100 text-primary-700 border-r-2 border-primary-500"
                    : "text-secondary-700 hover:bg-primary-50 hover:text-primary-700"
                }`}
              >
                <span className="flex items-center space-x-3">
                  <settingsItem.icon className="h-5 w-5" />
                  <span>{settingsItem.name}</span>
                </span>
                <span className="text-xs">{settingsOpen ? "▲" : "▼"}</span>
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

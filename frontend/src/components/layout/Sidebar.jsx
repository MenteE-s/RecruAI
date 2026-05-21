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

  const topItems = items.filter((i) => i.name !== "Setting");
  const settingsItem = items.find((i) => i.name === "Setting");

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
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-20 p-2 rounded-lg bg-white shadow-md"
      >
        <FiMenu className="h-6 w-6 text-gray-600" />
      </button>

      <aside
        className={`fixed md:relative inset-y-0 left-0 z-10 w-64 md:w-64 md:shrink-0 bg-white border-r border-gray-200 transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out h-screen flex flex-col overflow-hidden`}
        aria-label="Sidebar"
      >
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900 tracking-wide">
            MenteE / RecruAI
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Intelligent Hiring</p>
        </div>

        <nav className="px-3 py-4 flex-1 overflow-y-auto scroll-smooth">
          <ul className="space-y-1">
            {topItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.link}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                    isActive(item.link)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {settingsItem && (
          <div className="px-3 py-3 border-t border-gray-200">
            <div className="relative" ref={settingsRef}>
              {settingsOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      navigate(settingsItem.link);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Settings
                  </button>
                  <button
                    onClick={signOut}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    Logout
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                  isActive(settingsItem.link)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="flex items-center gap-3">
                  <settingsItem.icon className="h-5 w-5 shrink-0" />
                  <span>{settingsItem.name}</span>
                </span>
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                    settingsOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

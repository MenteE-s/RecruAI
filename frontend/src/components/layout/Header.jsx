import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { getCurrentUser, getUploadUrl, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import SignOutButton from "../ui/SignOutButton";
import {
  FiHome,
  FiBell,
  FiSettings,
  FiSearch,
  FiChevronDown,
  FiUser,
  FiAward,
  FiBriefcase,
  FiLink,
  FiFileText,
  FiTrendingUp,
  FiUsers,
  FiVideo,
} from "react-icons/fi";

export default function Header({ sidebarItems = [] }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [headerUser, setHeaderUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Real unread notification count — refreshed on every navigation
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/notifications/stats`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          setUnreadCount(Number(data.unread) || 0);
        }
      } catch {
        // leave previous count on network errors
      }
    })();
    return () => { cancelled = true; };
  }, [location.pathname]);

  const navItems = [
    { name: "Home", link: "/dashboard", icon: FiHome },
    { name: "My Network", link: "/network", icon: FiUsers },
    { name: "Interviews", link: "/interviews", icon: FiVideo },
    { name: "Notifications", link: "/notifications", icon: FiBell, badge: unreadCount > 0 ? unreadCount : null },
  ];

  const isActive = (link) => {
    return location.pathname === link || location.pathname.startsWith(link + "/");
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await getCurrentUser();
      if (!cancelled) setHeaderUser(u);
    })();
    return () => { cancelled = true; };
  }, []);

  // Close the profile dropdown on any outside click — except clicks inside
  // the sign-out confirm dialog (a portal outside this subtree; closing here
  // would unmount it before its click handler fires, swallowing sign-out).
  useEffect(() => {
    if (!dropdownOpen) return;
    const onDown = (e) => {
      if (e.target.closest && e.target.closest("[data-signout-dialog]")) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [dropdownOpen]);

  const firstName = headerUser?.name ? headerUser.name.trim().split(/\s+/)[0] : "You";
  const avatarUrl = headerUser?.profile_picture ? getUploadUrl(headerUser.profile_picture) : "";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-2 md:gap-3 h-11 px-3 md:px-4 w-full max-w-5xl mx-auto">
        {/* Brand */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex-shrink-0 flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <img
            src="/mentee-logo.png"
            alt="RecruAI"
            className="w-6 h-6 rounded-md object-contain"
          />
          <span className="text-sm font-extrabold text-blue-700 tracking-tight hidden lg:block">
            RecruAI
          </span>
        </button>

        {/* Search Bar - compact, stretches to fill header width */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search jobs, people..."
              readOnly
              className="w-full h-7 pl-8 pr-3 bg-[#f5f5f5] border border-transparent rounded-md text-xs text-gray-800 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all cursor-default select-none"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-0 md:gap-0.5">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.link)}
              className={`group relative flex flex-col items-center gap-0 px-1.5 py-1 rounded transition-all duration-150 min-w-[48px] ${
                isActive(item.link)
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
              title={item.name}
            >
              <div className="relative">
                <item.icon className="w-4 h-4" />
                {item.badge ? (
                  <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] font-medium leading-none hidden md:block">
                {item.name}
              </span>
              {isActive(item.link) && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* User / Business Dropdown */}
        <div ref={dropdownRef} className="relative flex-shrink-0">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-1.5 py-1 rounded-md hover:bg-gray-50 transition-colors text-xs text-gray-700"
            title="Your profile"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={firstName}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-gray-200 shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-[11px] font-bold ring-1 ring-gray-200 shrink-0">
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden md:flex flex-col items-start max-w-[80px]">
              <span className="text-[11px] font-semibold leading-tight text-gray-900 truncate w-full">{firstName}</span>
              <span className="text-[9px] text-gray-400 leading-tight">For Business</span>
            </div>
            <FiChevronDown className={`w-3 h-3 text-gray-400 hidden md:block transition-transform duration-150 ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-gray-200 rounded-lg shadow-xl shadow-gray-200/50 overflow-hidden z-50 animate-in slide-in-from-top-1 duration-150">
              <div className="py-1">
                <button onClick={() => { navigate("/profile"); setDropdownOpen(false); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <FiUser className="w-3.5 h-3.5 text-gray-400" /> Profile
                </button>
                <button onClick={() => { navigate("/interviews/analysis"); setDropdownOpen(false); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <FiTrendingUp className="w-3.5 h-3.5 text-gray-400" /> Analytics
                </button>
                <button onClick={() => { navigate("/jobs"); setDropdownOpen(false); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <FiBriefcase className="w-3.5 h-3.5 text-gray-400" /> Jobs
                </button>
                <button onClick={() => { navigate("/jobs/alerts"); setDropdownOpen(false); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <FiBell className="w-3.5 h-3.5 text-gray-400" /> Job Alerts
                </button>
                <button onClick={() => { navigate("/shareable-profiles"); setDropdownOpen(false); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <FiLink className="w-3.5 h-3.5 text-gray-400" /> Shareable Profiles
                </button>
                <button onClick={() => { navigate("/coaching"); setDropdownOpen(false); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <FiAward className="w-3.5 h-3.5 text-gray-400" /> Career Coaching
                </button>
                <button onClick={() => { navigate("/resume/builder"); setDropdownOpen(false); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <FiFileText className="w-3.5 h-3.5 text-gray-400" /> Resume Builder
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button onClick={() => { navigate("/settings"); setDropdownOpen(false); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors">
                  <FiSettings className="w-3.5 h-3.5" /> Settings
                </button>
                <div className="border-t border-gray-100 my-1" />
                <div className="px-1.5 py-1">
                  <SignOutButton variant="sidebar" className="text-xs rounded-md" onSignedOut={() => setDropdownOpen(false)} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

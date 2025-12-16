import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

export default function IndividualNavbar({ isAuthenticated }) {
  const navigate = useNavigate();
  const signedIn =
    isAuthenticated || localStorage.getItem("isAuthenticated") === "true";

  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (signedIn) fetchNotificationCount();
  }, [signedIn]);

  const fetchNotificationCount = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/stats`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setNotificationCount(data.unread || 0);
      }
    } catch (err) {
      console.error("Notification fetch failed", err);
    }
  };

  const signOut = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (_) {}
    localStorage.clear();
    navigate("/signin", { replace: true });
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Left */}
          <Link
            to="/"
            className="text-lg font-semibold text-primary-700 tracking-tight"
          >
            RecruAI
          </Link>

          {/* Right */}
          <div className="flex items-center gap-4">
            {!signedIn ? (
              <>
                <Link
                  to="/signin"
                  className="text-sm font-medium text-gray-600 hover:text-primary-700"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 bg-primary-700 text-white text-sm rounded-md hover:bg-primary-800 transition"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/notifications"
                  className="relative text-gray-600 hover:text-primary-700"
                >
                  <i className="fa-solid fa-bell text-lg">Notifications</i>
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] h-5 w-5 rounded-full flex items-center justify-center">
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/profile"
                  className="text-sm font-medium text-gray-600 hover:text-primary-700"
                >
                  Profile
                </Link>

                <button
                  onClick={signOut}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

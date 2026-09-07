import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import socketService from "../../utils/socket";
import { getBackendUrl } from "../../utils/auth";

export default function IndividualNavbar({ isAuthenticated }) {
  const navigate = useNavigate();
  const signedIn =
    isAuthenticated || localStorage.getItem("isAuthenticated") === "true";

  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (signedIn) {
      fetchNotificationCount();

      const handleNewNotification = () => {
        setNotificationCount((prev) => prev + 1);
      };

      socketService.on("notification_created", handleNewNotification);

      return () => {
        socketService.off("notification_created", handleNewNotification);
      };
    }
  }, [signedIn]);

  const fetchNotificationCount = async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/notifications/stats`, {
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
      await fetch(`${getBackendUrl()}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (_) {}
    localStorage.removeItem("access_token");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("authRole");
    socketService.disconnect();
    navigate("/signin", { replace: true });
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <Link
            to="/"
            className="text-lg font-semibold text-blue-700 tracking-tight"
          >
            RecruAI
          </Link>

          <div className="flex items-center gap-4">
            {!signedIn ? (
              <>
                <Link
                  to="/signin"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 bg-blue-700 text-white text-sm rounded-md hover:bg-blue-800 transition"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/notifications"
                  className="relative text-gray-600 hover:text-gray-900"
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
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
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

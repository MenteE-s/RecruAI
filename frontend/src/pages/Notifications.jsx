import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import socketService from "../utils/socket";
import { getBackendUrl, verifyTokenWithServer, getSidebarItems } from "../utils/auth";
import { formatDate } from "../utils/timezone";
import {
  FiBell,
  FiEye,
  FiArchive,
  FiTrash2,
  FiStar,
  FiFilter,
  FiCheckCircle,
  FiClock,
  FiInbox,
  FiX,
  FiSearch,
  FiArrowRight,
} from "react-icons/fi";

export default function Notifications() {
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, unread: 0, archived: 0, favorited: 0 });
  const [filters, setFilters] = useState({ archived: false, read: "all", favorited: false });
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchNotifications();
    fetchStats();
    const handleNewNotification = (data) => {
      const newNotif = data.data;
      if (newNotif) {
        setNotifications((prev) => [newNotif, ...prev]);
        setStats((prev) => ({ ...prev, total: prev.total + 1, unread: prev.unread + 1 }));
      }
    };
    socketService.on("notification_created", handleNewNotification);
    return () => socketService.off("notification_created", handleNewNotification);
  }, [currentPage, filters]);

  const fetchNotifications = async () => {
    try {
      const user = await verifyTokenWithServer();
      if (!user) return;
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 20,
        archived: filters.archived,
        read: filters.read,
        favorited: filters.favorited,
      });
      const response = await fetch(`${getBackendUrl()}/api/notifications?${params}`, { credentials: "include" });
      if (response.ok) {
        const responseData = await response.json();
        setNotifications(responseData.data || []);
        setTotalPages(responseData.pagination?.total_pages || 1);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/notifications/stats`, { credentials: "include" });
      if (response.ok) setStats(await response.json());
    } catch (error) {
      console.error("Error fetching notification stats:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/notifications/${notificationId}/read`, { method: "PUT", credentials: "include" });
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)));
        fetchStats();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const archiveNotification = async (notificationId) => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/notifications/${notificationId}/archive`, { method: "PUT", credentials: "include" });
      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        fetchStats();
      }
    } catch (error) {
      console.error("Error archiving notification:", error);
    }
  };

  const favoriteNotification = async (notificationId) => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/notifications/${notificationId}/favorite`, { method: "PUT", credentials: "include" });
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_favorited: !n.is_favorited } : n)));
        fetchStats();
      }
    } catch (error) {
      console.error("Error favoriting notification:", error);
    }
  };

  const unarchiveNotification = async (notificationId) => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/notifications/${notificationId}/unarchive`, { method: "PUT", credentials: "include" });
      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        fetchStats();
      }
    } catch (error) {
      console.error("Error unarchiving notification:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;
    try {
      const response = await fetch(`${getBackendUrl()}/api/notifications/${notificationId}/delete`, { method: "DELETE", credentials: "include" });
      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        fetchStats();
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const bulkMarkAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    try {
      const response = await fetch(`${getBackendUrl()}/api/notifications/bulk/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notification_ids: unreadIds }),
      });
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => (unreadIds.includes(n.id) ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)));
        fetchStats();
      }
    } catch (error) {
      console.error("Error bulk marking as read:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "interview_scheduled":
      case "interview_cancelled":
      case "interview_passed":
        return <FiClock className="h-5 w-5 text-blue-600" />;
      case "profile_favorited":
        return <FiStar className="h-5 w-5 text-amber-600" />;
      case "profile_viewed":
        return <FiEye className="h-5 w-5 text-green-600" />;
      default:
        return <FiBell className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
    setCurrentPage(1);
  };

  const filteredBySearch = notifications.filter((n) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-gray-900 h-48 animate-pulse" />
          <div className="bg-white border border-gray-200 p-4">
            <div className="h-10 bg-gray-100 animate-pulse" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white border border-gray-200 animate-pulse" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-xs font-medium tracking-wide mb-3">
                <FiBell className="w-3.5 h-3.5" />
                INBOX
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">Notifications</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Stay updated with interviews, applications, and profile activity.</p>
              <div className="mt-5 relative max-w-xl">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Search notifications…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-9 py-3 bg-white text-gray-900 placeholder-gray-400 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded text-gray-500">
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 lg:w-[440px]">
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-300 mt-1">Total</p>
              </div>
              <div className="bg-orange-500/20 backdrop-blur border border-orange-400/20 p-4 text-center">
                <p className="text-2xl font-bold text-orange-200">{stats.unread}</p>
                <p className="text-xs text-orange-200 mt-1">Unread</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{stats.archived}</p>
                <p className="text-xs text-gray-300 mt-1">Archived</p>
              </div>
              <div className="bg-amber-500/20 backdrop-blur border border-amber-400/20 p-4 text-center">
                <p className="text-2xl font-bold text-amber-200">{stats.favorited}</p>
                <p className="text-xs text-amber-200 mt-1">Starred</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions bar */}
      <div className="bg-white border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border transition-colors ${showFilters ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
              <FiFilter className="w-4 h-4" /> Filters {showFilters ? <FiX className="w-3.5 h-3.5" /> : null}
            </button>
            {filteredBySearch.length !== notifications.length && <span className="text-xs text-gray-500">{filteredBySearch.length} filtered by search</span>}
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              <button onClick={() => handleFilterChange("read", "all")} className={`px-3 py-1.5 text-xs font-medium border ${filters.read === "all" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"}`}>All</button>
              <button onClick={() => handleFilterChange("read", "unread")} className={`px-3 py-1.5 text-xs font-medium border ${filters.read === "unread" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"}`}>Unread</button>
              <button onClick={() => handleFilterChange("read", "read")} className={`px-3 py-1.5 text-xs font-medium border ${filters.read === "read" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"}`}>Read</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.is_read) && (
              <button onClick={bulkMarkAsRead} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                <FiCheckCircle className="w-4 h-4" /> Mark all read
              </button>
            )}
          </div>
        </div>
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Read status</label>
              <select value={filters.read} onChange={(e) => handleFilterChange("read", e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white">
                <option value="all">All notifications</option>
                <option value="read">Read only</option>
                <option value="unread">Unread only</option>
              </select>
            </div>
            <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 cursor-pointer hover:bg-white">
              <input type="checkbox" checked={filters.archived} onChange={(e) => handleFilterChange("archived", e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <span className="text-sm text-gray-700 flex items-center gap-1.5"><FiArchive className="w-4 h-4 text-gray-500" /> Show archived</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 cursor-pointer hover:bg-white">
              <input type="checkbox" checked={filters.favorited} onChange={(e) => handleFilterChange("favorited", e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <span className="text-sm text-gray-700 flex items-center gap-1.5"><FiStar className="w-4 h-4 text-amber-500" /> Favorites only</span>
            </label>
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filteredBySearch.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 text-center">
            <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FiInbox className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No notifications</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">{filters.archived || filters.favorited || filters.read !== "all" || search ? "No notifications match your filters or search." : "You’re all caught up! New notifications will appear here."}</p>
            {(filters.archived || filters.favorited || filters.read !== "all" || search) && (
              <button
                onClick={() => {
                  setFilters({ archived: false, read: "all", favorited: false });
                  setSearch("");
                  setShowFilters(false);
                }}
                className="mt-5 inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-black transition-colors"
              >
                Clear filters <FiArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          filteredBySearch.map((notification) => (
            <div
              key={notification.id}
              className={`group relative bg-white border hover:shadow-sm transition-all ${!notification.is_read ? "border-l-4 border-l-blue-600 border-y border-r border-y-gray-200 border-r-gray-200" : "border-gray-200 hover:border-gray-300"} `}
            >
              <div className="p-4 flex gap-4">
                <div className={`hidden sm:flex w-10 h-10 items-center justify-center border shrink-0 ${!notification.is_read ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-[15px] font-semibold leading-tight ${!notification.is_read ? "text-gray-900" : "text-gray-800"}`}>{notification.title}</h3>
                        {!notification.is_read && <span className="text-xs bg-blue-600 text-white px-2 py-0.5">New</span>}
                        {notification.is_favorited && <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5"><FiStar className="w-3 h-3 fill-amber-500" /> Favorited</span>}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-2">{formatDate(notification.created_at)}</p>
                    </div>
                    <div className="hidden md:flex items-center gap-1 shrink-0">
                      {!notification.is_read && (
                        <button onClick={() => markAsRead(notification.id)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200" title="Mark as read">
                          <FiEye className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => favoriteNotification(notification.id)} className={`p-2 border ${notification.is_favorited ? "text-amber-600 bg-amber-50 border-amber-200" : "text-gray-400 hover:text-amber-600 hover:bg-amber-50 border-transparent hover:border-amber-200"}`} title="Favorite">
                        <FiStar className={`w-4 h-4 ${notification.is_favorited ? "fill-amber-500" : ""}`} />
                      </button>
                      {filters.archived ? (
                        <button onClick={() => unarchiveNotification(notification.id)} className="p-2 text-green-600 hover:bg-green-50 border border-transparent hover:border-green-200" title="Unarchive">
                          <FiInbox className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => archiveNotification(notification.id)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200" title="Archive">
                          <FiArchive className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => deleteNotification(notification.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200" title="Delete">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex md:hidden flex-wrap gap-2">
                    {!notification.is_read && (
                      <button onClick={() => markAsRead(notification.id)} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 text-white font-medium">
                        <FiEye className="w-3.5 h-3.5" /> Mark read
                      </button>
                    )}
                    <button onClick={() => favoriteNotification(notification.id)} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border font-medium ${notification.is_favorited ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-white text-gray-600 border-gray-200"}`}>
                      <FiStar className={`w-3.5 h-3.5 ${notification.is_favorited ? "fill-amber-500" : ""}`} /> {notification.is_favorited ? "Favorited" : "Favorite"}
                    </button>
                    <button onClick={() => (filters.archived ? unarchiveNotification(notification.id) : archiveNotification(notification.id))} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white border border-gray-200 text-gray-600 font-medium">
                      {filters.archived ? <FiInbox className="w-3.5 h-3.5" /> : <FiArchive className="w-3.5 h-3.5" />} {filters.archived ? "Unarchive" : "Archive"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-200">
          <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700 flex items-center gap-2">
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                return (
                  <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-9 h-9 flex items-center justify-center text-sm font-medium border ${currentPage === pageNum ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700 flex items-center gap-2">
              Next
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

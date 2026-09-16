import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  FiCheckCircle,
  FiClock,
  FiInbox,
  FiX,
  FiSearch,
} from "react-icons/fi";

export default function Notifications() {
  const navigate = useNavigate();
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, unread: 0, archived: 0, favorited: 0 });
  const [filters, setFilters] = useState({ archived: false, read: "all", favorited: false });
  const [search, setSearch] = useState("");

  const fetchStats = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/notifications/stats`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setStats({
          total: Number(data.total) || 0,
          unread: Number(data.unread) || 0,
          archived: Number(data.archived) || 0,
          favorited: Number(data.favorited) || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching notification stats:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchStats();
    const handleNewNotification = (data) => {
      const newNotif = data.data;
      if (newNotif) {
        setNotifications((prev) => (prev.some((n) => n.id === newNotif.id) ? prev : [newNotif, ...prev]));
        fetchStats(); // server is the source of truth for counts
      }
    };
    socketService.on("notification_created", handleNewNotification);
    return () => socketService.off("notification_created", handleNewNotification);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const getNotificationLink = (n) => {
    if (n.type?.includes("interview") && n.related_interview_id) return `/interviews/${n.related_interview_id}`;
    if ((n.type === "profile_favorited" || n.type === "profile_viewed") && n.related_user_id) return `/profile`;
    if (n.related_organization_id) return `/organization/profile/${n.related_organization_id}`;
    if (n.type?.includes("interview")) return `/interviews/upcoming`;
    return null;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "interview_scheduled":
      case "interview_cancelled":
      case "interview_passed":
        return <FiClock className="w-4 h-4 text-blue-600" />;
      case "profile_favorited":
        return <FiStar className="w-4 h-4 text-amber-600" />;
      case "profile_viewed":
        return <FiEye className="w-4 h-4 text-green-600" />;
      default:
        return <FiBell className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
    setCurrentPage(1);
  };

  const clearAll = () => {
    setFilters({ archived: false, read: "all", favorited: false });
    setSearch("");
    setCurrentPage(1);
  };

  const hasActiveFilters = filters.archived || filters.favorited || filters.read !== "all" || search;

  const filteredBySearch = notifications.filter((n) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="w-full max-w-3xl mx-auto space-y-2.5">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white border border-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="w-full max-w-3xl mx-auto space-y-2.5">
        {/* Title + accurate counts */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Notifications</h1>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {stats.total} total · {stats.unread} unread
              {stats.archived > 0 ? ` · ${stats.archived} archived` : ""}
            </p>
          </div>
          {notifications.some((n) => !n.is_read) && (
            <button onClick={bulkMarkAsRead} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors rounded-full shrink-0">
              <FiCheckCircle className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search notifications…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded text-gray-500">
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { label: "All", value: "all" },
            { label: `Unread${stats.unread > 0 ? ` (${stats.unread})` : ""}`, value: "unread" },
            { label: "Read", value: "read" },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => handleFilterChange("read", p.value)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-colors ${
                filters.read === p.value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => handleFilterChange("favorited", !filters.favorited)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-colors ${
              filters.favorited ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            ★ Starred{filters.favorited && stats.favorited > 0 ? ` (${stats.favorited})` : ""}
          </button>
          <button
            onClick={() => handleFilterChange("archived", !filters.archived)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-colors ${
              filters.archived ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            Archived
          </button>
          {hasActiveFilters && (
            <button onClick={clearAll} className="text-[11px] font-medium text-blue-600 hover:underline px-1">
              Clear
            </button>
          )}
        </div>

        {/* List */}
        {filteredBySearch.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
            <FiInbox className="w-7 h-7 text-gray-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-900">No notifications</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {hasActiveFilters ? "Nothing matches your filters." : "You're all caught up!"}
            </p>
            {hasActiveFilters && (
              <button onClick={clearAll} className="mt-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium hover:bg-black rounded-full transition-colors">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          filteredBySearch.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                const link = getNotificationLink(n);
                if (link) navigate(link);
              }}
              className={`bg-white border rounded-lg shadow-sm p-3 flex gap-2.5 cursor-pointer hover:shadow transition-shadow ${
                !n.is_read ? "border-blue-200" : "border-gray-200"
              }`}
            >
              <div className={`w-8 h-8 rounded-md flex items-center justify-center border shrink-0 ${!n.is_read ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
                {getNotificationIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                  <h3 className="text-[13px] font-semibold text-gray-900 leading-tight truncate">{n.title}</h3>
                  {n.is_favorited && <FiStar className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                </div>
                <p className="text-xs text-gray-600 leading-snug line-clamp-2 mt-0.5">{n.message}</p>
                <p className="text-[11px] text-gray-400 mt-1">{formatDate(n.created_at)}</p>
              </div>
              <div className="flex md:flex-col flex-row items-center gap-0.5 shrink-0">
                {!n.is_read && (
                  <button onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Mark as read">
                    <FiEye className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); favoriteNotification(n.id); }}
                  className={`p-1.5 rounded-md ${n.is_favorited ? "text-amber-500 hover:bg-amber-50" : "text-gray-300 hover:text-amber-500 hover:bg-amber-50"}`}
                  title="Star"
                >
                  <FiStar className={`w-3.5 h-3.5 ${n.is_favorited ? "fill-amber-500" : ""}`} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); filters.archived ? unarchiveNotification(n.id) : archiveNotification(n.id); }}
                  className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                  title={filters.archived ? "Unarchive" : "Archive"}
                >
                  {filters.archived ? <FiInbox className="w-3.5 h-3.5" /> : <FiArchive className="w-3.5 h-3.5" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-md" title="Delete">
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-gray-500">Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Prev
              </button>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

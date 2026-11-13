import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell, CenterBar } from "../components/layout/AppShell";
import socketService from "../utils/socket";
import { getBackendUrl, verifyTokenWithServer, getUploadUrl, orgPath, postPath } from "../utils/auth";
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

  const rel = (n) => n.related_entities || {};
  const orgOf = (n) => n.organization || null;
  const postOf = (n) => n.post || null;

  const BROADCAST_TYPES = ["announcement", "promotion", "promo", "info", "system", "welcome"];
  const isBroadcast = (n) => !orgOf(n) && !postOf(n) && BROADCAST_TYPES.includes(n.type);

  const getNotificationLink = (n) => {
    const r = rel(n);
    const post = postOf(n);
    const postId = post?.id ?? r.post_id;
    // postPath prefers the slug; with only an id it falls back to the numeric
    // form, which GET /api/posts/by-slug/<slug> also resolves.
    if (post) return postPath(post);
    if (postId) return postPath(postId);
    const orgId = orgOf(n)?.id ?? r.organization_id;
    if (orgId) return orgPath(orgId);
    const interviewId = r.interview_id;
    if (n.type?.includes("interview") && interviewId) return `/in/interviews/${interviewId}`;
    if ((n.type === "profile_favorited" || n.type === "profile_viewed") && r.user_id) return `/in/profile`;
    if (n.type?.includes("interview")) return `/in/interviews/upcoming`;
    return null;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "interview_scheduled":
      case "interview_cancelled":
      case "interview_passed":
        return <FiClock className="h-4 w-4 text-brand-text" />;
      case "profile_favorited":
        return <FiStar className="h-4 w-4 text-amber-600" />;
      case "profile_viewed":
        return <FiEye className="h-4 w-4 text-gray-500" />;
      default:
        return <FiBell className="h-4 w-4 text-gray-500" />;
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
      <AppShell>
        <CenterBar title="Notifications" />
        <div className="w-full max-w-3xl mx-auto space-y-2.5 px-4 pb-6 pt-4">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-25" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-line bg-surface" />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <CenterBar
        title="Notifications"
        subtitle={`${stats.total} total · ${stats.unread} unread${stats.archived > 0 ? ` · ${stats.archived} archived` : ""}`}
        actions={
          notifications.some((n) => !n.is_read) ? (
            <button onClick={bulkMarkAsRead} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-action px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand/90">
              <FiCheckCircle className="h-3.5 w-3.5" /> Mark all read
            </button>
          ) : null
        }
      />
      <div className="w-full max-w-3xl mx-auto space-y-2.5 px-4 pb-6 pt-4">

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 h-3.5 w-3.5" />
          <input
            type="text"
            placeholder="Search notifications…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface py-1.5 pl-8 pr-8 text-xs text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-gray-100/50 dark:focus:ring-gray-600/50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded text-gray-500">
              <FiX className="h-3.5 w-3.5" />
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
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                filters.read === p.value
                  ? "border-brand bg-brand-action text-white"
                  : "border-line bg-surface text-gray-600 hover:bg-gray-50 dark:text-gray-500 dark:hover:bg-gray-25"
              }`}>
              {p.label}
            </button>
          ))}
          <button
            onClick={() => handleFilterChange("favorited", !filters.favorited)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              filters.favorited ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400" : "border-line bg-surface text-gray-600 hover:bg-gray-50 dark:text-gray-500 dark:hover:bg-gray-25"
            }`}>
            <FiStar className="h-3 w-3" aria-hidden /> Starred{filters.favorited && stats.favorited > 0 ? ` (${stats.favorited})` : ""}
          </button>
          <button
            onClick={() => handleFilterChange("archived", !filters.archived)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              filters.archived ? "border-brand bg-brand-action text-white" : "border-line bg-surface text-gray-600 hover:bg-gray-50 dark:text-gray-500 dark:hover:bg-gray-25"
            }`}>
            Archived
          </button>
          {hasActiveFilters && (
            <button onClick={clearAll} className="px-1 text-[11px] font-medium text-brand-text hover:underline">
              Clear
            </button>
          )}
        </div>

        {/* List */}
        {filteredBySearch.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-8 text-center">
            <FiInbox className="h-7 w-7 text-gray-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-ink">No notifications</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {hasActiveFilters ? "Nothing matches your filters." : "You're all caught up!"}
            </p>
            {hasActiveFilters && (
              <button onClick={clearAll} className="mt-3 rounded-full bg-brand-action px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand/90">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          filteredBySearch.map((n) => {
            const org = orgOf(n);
            const post = postOf(n);
            const broadcast = isBroadcast(n);
            return (
            <div
              key={n.id}
              onClick={() => {
                const link = getNotificationLink(n);
                if (link) navigate(link);
              }}
              className={`flex cursor-pointer gap-2.5 rounded-xl border bg-surface p-3 transition-shadow hover:shadow-s10 ${
                !n.is_read ? "border-brand/30" : "border-line"
              }`}>
              {org?.profile_image ? (
                <img
                  src={getUploadUrl(org.profile_image)}
                  alt={org.name}
                  className="h-10 w-10 rounded-xl object-cover border border-line shrink-0"
                />
              ) : org ? (
                <div className="h-10 w-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {(org.name || "?").charAt(0).toUpperCase()}
                </div>
              ) : broadcast ? (
                <img
                  src="/mentee-logo.png"
                  alt="RecruAI"
                  className="h-10 w-10 rounded-xl object-contain border border-line bg-gray-50 p-1 shrink-0 dark:bg-gray-25"
                />
              ) : (
                <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${!n.is_read ? "border-brand/20 bg-brand/10" : "border-line bg-gray-50 dark:bg-gray-25"}`}>
                  {getNotificationIcon(n.type)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0" />}
                  <h3 className="text-[13px] font-semibold text-ink leading-tight truncate">{n.title}</h3>
                  {n.is_favorited && <FiStar className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                </div>
                <p className="text-xs text-gray-600 leading-snug line-clamp-2 mt-0.5">{n.message}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[11px] text-gray-500 font-mono tabular-nums">{formatDate(n.created_at)}</span>
                  {org && (
                    <span className="truncate text-[11px] font-medium text-gray-500">
                      {org.name}
                    </span>
                  )}
                  {post && (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(postPath(post)); }}
                      className="text-[11px] font-semibold text-brand-text hover:underline"
                    >
                      View job →
                    </button>
                  )}
                </div>
              </div>
              <div className="flex md:flex-col flex-row items-center gap-0.5 shrink-0">
                {!n.is_read && (
                  <button onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }} className="rounded-lg p-1.5 text-gray-500 hover:bg-brand/10 hover:text-brand-text" title="Mark as read">
                    <FiEye className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); favoriteNotification(n.id); }}
                  className={`rounded-lg p-1.5 ${n.is_favorited ? "text-amber-500 hover:bg-amber-50" : "text-gray-300 hover:text-amber-500 hover:bg-amber-50"}`}
                  title="Star"
                >
                  <FiStar className={`h-3.5 w-3.5 ${n.is_favorited ? "fill-amber-500" : ""}`} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); filters.archived ? unarchiveNotification(n.id) : archiveNotification(n.id); }}
                  className="rounded-lg p-1.5 text-gray-300 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-25"
                  title={filters.archived ? "Unarchive" : "Archive"}>
                  {filters.archived ? <FiInbox className="h-3.5 w-3.5" /> : <FiArchive className="h-3.5 w-3.5" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-600" title="Delete">
                  <FiTrash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            );
          })
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-gray-500">Page <span className="font-mono tabular-nums">{currentPage}</span> of <span className="font-mono tabular-nums">{totalPages}</span></span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-600 dark:hover:bg-gray-25 disabled:opacity-50 disabled:cursor-not-allowed">
                Prev
              </button>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-600 dark:hover:bg-gray-25 disabled:opacity-50 disabled:cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

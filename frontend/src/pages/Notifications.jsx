import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import IndividualNavbar from "../components/layout/IndividualNavbar";
import Card from "../components/ui/Card";
import {
  getBackendUrl,
  verifyTokenWithServer,
  getSidebarItems,
} from "../utils/auth";
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
  FiUser,
  FiBriefcase,
  FiCalendar,
  FiInbox,
} from "react-icons/fi";

export default function Notifications() {
  const navigate = useNavigate();
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    archived: 0,
    favorited: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    archived: false,
    read: "all", // "all", "read", "unread"
    favorited: false,
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchStats();
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

      const response = await fetch(
        `${getBackendUrl()}/api/notifications?${params}`,
        {
          credentials: "include",
        }
      );

      console.log("Notifications API Response Status:", response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log("Notifications API Response Data:", responseData);

        // Update to use responseData.data instead of responseData.items
        const notificationsData = responseData.data || [];
        setNotifications(notificationsData);

        // Update pagination to use responseData.pagination
        setTotalPages(responseData.pagination?.total_pages || 1);

        // Log the first few notifications for debugging
        if (notificationsData.length > 0) {
          console.log("First notification:", notificationsData[0]);
        }
      } else {
        console.error(
          "Error response from notifications API:",
          await response.text()
        );
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/notifications/stats`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching notification stats:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          credentials: "include",
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId
              ? { ...notif, is_read: true, read_at: new Date().toISOString() }
              : notif
          )
        );
        fetchStats(); // Update stats
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const archiveNotification = async (notificationId) => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/notifications/${notificationId}/archive`,
        {
          method: "PUT",
          credentials: "include",
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.filter((notif) => notif.id !== notificationId)
        );
        fetchStats(); // Update stats
      }
    } catch (error) {
      console.error("Error archiving notification:", error);
    }
  };

  const favoriteNotification = async (notificationId) => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/notifications/${notificationId}/favorite`,
        {
          method: "PUT",
          credentials: "include",
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId
              ? { ...notif, is_favorited: true }
              : notif
          )
        );
        fetchStats(); // Update stats
      }
    } catch (error) {
      console.error("Error favoriting notification:", error);
    }
  };

  const unarchiveNotification = async (notificationId) => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/notifications/${notificationId}/unarchive`,
        {
          method: "PUT",
          credentials: "include",
        }
      );

      if (response.ok) {
        // Remove the notification from the list
        setNotifications((prev) =>
          prev.filter((notif) => notif.id !== notificationId)
        );
        // Update stats
        fetchStats();
      }
    } catch (error) {
      console.error("Error unarchiving notification:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!Window.confirm("Are you sure you want to delete this notification?"))
      return;

    try {
      const response = await fetch(
        `${getBackendUrl()}/api/notifications/${notificationId}/delete`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.filter((notif) => notif.id !== notificationId)
        );
        fetchStats(); // Update stats
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const bulkMarkAsRead = async () => {
    const unreadIds = notifications
      .filter((notif) => !notif.is_read)
      .map((notif) => notif.id);

    if (unreadIds.length === 0) return;

    try {
      const response = await fetch(
        `${getBackendUrl()}/api/notifications/bulk/read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ notification_ids: unreadIds }),
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            unreadIds.includes(notif.id)
              ? { ...notif, is_read: true, read_at: new Date().toISOString() }
              : notif
          )
        );
        fetchStats(); // Update stats
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
        return <FiCalendar className="h-5 w-5 text-blue-500" />;
      case "profile_favorited":
        return <FiStar className="h-5 w-5 text-yellow-500" />;
      case "profile_viewed":
        return <FiEye className="h-5 w-5 text-green-500" />;
      default:
        return <FiBell className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={IndividualNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      NavbarComponent={IndividualNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Notifications
            </h1>
            <p className="text-gray-600 mt-1">
              Stay updated with your latest activities
            </p>
          </div>

          {/* Stats Cards */}
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-1 min-w-[140px]
                        hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FiBell className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
              </div>
            </div>
            <div
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-1 min-w-[140px]
                        hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <FiClock className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unread
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.unread}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters
                  ? "bg-blue-100 text-blue-700"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              } shadow-sm border border-gray-200`}
            >
              <FiFilter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters</span>
            </button>

            {notifications.some((n) => !n.is_read) && (
              <button
                onClick={bulkMarkAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg
                           transition-colors text-sm font-medium shadow-sm"
              >
                <FiCheckCircle className="h-4 w-4" />
                Mark All as Read
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-6 border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Filter Notifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Read Status
                  </label>
                  <select
                    value={filters.read}
                    onChange={(e) => handleFilterChange("read", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">All Notifications</option>
                    <option value="read">Read Only</option>
                    <option value="unread">Unread Only</option>
                  </select>
                </div>

                <div className="flex items-center p-2 rounded-lg border border-gray-200 bg-white">
                  <input
                    type="checkbox"
                    id="archived"
                    checked={filters.archived}
                    onChange={(e) =>
                      handleFilterChange("archived", e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="archived"
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    Show Archived
                  </label>
                </div>

                <div className="flex items-center p-2 rounded-lg border border-gray-200 bg-white">
                  <input
                    type="checkbox"
                    id="favorited"
                    checked={filters.favorited}
                    onChange={(e) =>
                      handleFilterChange("favorited", e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="favorited"
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    Favorites Only
                  </label>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-200 hover:border-blue-200 transition-colors">
              <div className="p-8 text-center">
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-50 mb-4">
                  <FiBell className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No notifications yet
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {filters.archived ||
                  filters.favorited ||
                  filters.read !== "all"
                    ? "No notifications match your current filters."
                    : "You're all caught up! New notifications will appear here."}
                </p>
                {(filters.archived ||
                  filters.favorited ||
                  filters.read !== "all") && (
                  <button
                    onClick={() => {
                      setFilters({
                        archived: false,
                        read: "all",
                        favorited: false,
                      });
                      setShowFilters(false);
                    }}
                    className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </Card>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`group relative p-4 rounded-xl transition-all duration-200 ease-in-out ${
                  !notification.is_read
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : "bg-white hover:bg-gray-50 border border-gray-100"
                } shadow-sm hover:shadow-md`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 mt-1 p-2 rounded-lg ${
                      !notification.is_read ? "bg-blue-100" : "bg-gray-100"
                    }`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-sm font-medium ${
                              !notification.is_read
                                ? "text-gray-900"
                                : "text-gray-800"
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center mt-2">
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.created_at)}
                          </span>
                          {notification.is_favorited && (
                            <span className="ml-2 inline-flex items-center text-xs text-amber-600">
                              <FiStar className="h-3 w-3 mr-1" /> Favorited
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Mark as read"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            favoriteNotification(notification.id);
                          }}
                          className={`p-2 rounded-lg ${
                            notification.is_favorited
                              ? "text-yellow-500 hover:bg-yellow-50"
                              : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
                          }`}
                          title={
                            notification.is_favorited
                              ? "Remove from favorites"
                              : "Add to favorites"
                          }
                        >
                          <FiStar
                            className={`h-4 w-4 ${
                              notification.is_favorited ? "fill-current" : ""
                            }`}
                          />
                        </button>

                        {filters.archived ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              unarchiveNotification(notification.id);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Unarchive"
                          >
                            <FiInbox className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveNotification(notification.id);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                            title="Archive"
                          >
                            <FiArchive className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons for mobile */}
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100 md:hidden">
                  {!notification.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-md hover:bg-blue-50"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      favoriteNotification(notification.id);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-md ${
                      notification.is_favorited
                        ? "text-yellow-600 hover:bg-yellow-50"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {notification.is_favorited ? "Favorited" : "Favorite"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
                           text-sm font-medium text-gray-700 transition-colors flex items-center gap-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span className="px-2 text-gray-400">...</span>
                )}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
                           text-sm font-medium text-gray-700 transition-colors flex items-center gap-2"
              >
                Next
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

import React, { useState, useEffect } from "react";
import RecruAINavbar from "../components/product/RecruAINavbar";
import Footer from "../components/Footer";

const SystemStatus = () => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showReportForm, setShowReportForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [systemIssues, setSystemIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    issue_type: "bug",
    severity: "medium",
    email: "",
  });

  const issuesPerPage = 10;

  // API functions
  const fetchSystemIssues = async (page = 1, status = "all", type = "all") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: issuesPerPage.toString(),
        status,
        type,
      });

      const response = await fetch(
        `http://localhost:5000/api/system-issues?${params}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch system issues");
      }
      const data = await response.json();
      setSystemIssues(
        data.data.active_issues.concat(data.data.resolved_issues)
      );
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching system issues:", err);
    } finally {
      setLoading(false);
    }
  };

  const submitIssue = async (issueData) => {
    try {
      const response = await fetch("http://localhost:5000/api/system-issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(issueData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit issue");
      }

      const data = await response.json();
      alert(
        "Thank you for reporting this issue! We will investigate and get back to you soon."
      );

      // Refresh the issues list
      fetchSystemIssues(currentPage, filterStatus, filterType);

      return data;
    } catch (err) {
      console.error("Error submitting issue:", err);
      alert("Failed to submit issue. Please try again.");
      throw err;
    }
  };

  const services = [
    {
      name: "RecruAI Platform",
      status: "operational",
      uptime: "99.9%",
      lastIncident: "None",
    },
    {
      name: "AI Interview Engine",
      status: "operational",
      uptime: "99.8%",
      lastIncident: "None",
    },
    {
      name: "User Authentication",
      status: "operational",
      uptime: "99.9%",
      lastIncident: "None",
    },
    {
      name: "File Upload Service",
      status: "operational",
      uptime: "99.7%",
      lastIncident: "2 hours ago",
    },
    {
      name: "Email Notifications",
      status: "operational",
      uptime: "99.9%",
      lastIncident: "None",
    },
    {
      name: "API Services",
      status: "operational",
      uptime: "99.9%",
      lastIncident: "None",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "operational":
        return "text-green-600 bg-green-100";
      case "degraded":
        return "text-yellow-600 bg-yellow-100";
      case "outage":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "operational":
        return "✅";
      case "degraded":
        return "⚠️";
      case "outage":
        return "❌";
      default:
        return "❓";
    }
  };

  const getIssueStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "investigating":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Separate active and resolved issues
  const activeIssues = systemIssues.filter((issue) =>
    ["open", "investigating", "in_progress"].includes(issue.status)
  );

  const resolvedIssues = systemIssues.filter((issue) =>
    ["resolved", "closed"].includes(issue.status)
  );

  // Filter issues based on current filters
  const filteredActiveIssues = activeIssues.filter((issue) => {
    const statusMatch = filterStatus === "all" || issue.status === filterStatus;
    const typeMatch = filterType === "all" || issue.issue_type === filterType;
    return statusMatch && typeMatch;
  });

  const filteredResolvedIssues = resolvedIssues.filter((issue) => {
    const statusMatch = filterStatus === "all" || issue.status === filterStatus;
    const typeMatch = filterType === "all" || issue.issue_type === filterType;
    return statusMatch && typeMatch;
  });

  // Pagination logic
  const totalIssues =
    filteredActiveIssues.length + filteredResolvedIssues.length;
  const totalPages = Math.ceil(totalIssues / issuesPerPage);

  // Get current page issues (prioritize active issues first)
  const getCurrentPageIssues = () => {
    const allFilteredIssues = [
      ...filteredActiveIssues,
      ...filteredResolvedIssues,
    ];
    const startIndex = (currentPage - 1) * issuesPerPage;
    const endIndex = startIndex + issuesPerPage;
    return allFilteredIssues.slice(startIndex, endIndex);
  };

  const currentIssues = getCurrentPageIssues();

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === "status") {
      setFilterStatus(value);
    } else if (filterType === "type") {
      setFilterType(value);
    }
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    try {
      await submitIssue(formData);
      setFormData({
        title: "",
        description: "",
        issue_type: "bug",
        severity: "medium",
        email: "",
      });
      setShowReportForm(false);
    } catch (err) {
      // Error handling is done in submitIssue function
    }
  };

  useEffect(() => {
    // Fetch issues on component mount and when filters change
    fetchSystemIssues(currentPage, filterStatus, filterType);

    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [currentPage, filterStatus, filterType]);

  return (
    <div className="min-h-screen bg-gray-50">
      <RecruAINavbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              System Status
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto">
              Real-time status of all MenteE services and systems.
            </p>
            <div className="mt-6 text-indigo-200">
              Last updated: {lastUpdated.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Overall Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                All Systems Operational
              </h2>
              <p className="text-gray-600 mt-1">
                All MenteE services are running normally
              </p>
            </div>
            <div className="flex items-center">
              <span className="text-4xl mr-3">✅</span>
              <span className="text-green-600 font-semibold text-lg">
                99.9% Uptime
              </span>
            </div>
          </div>
        </div>

        {/* Service Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {services.map((service, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {service.name}
                </h3>
                <span className="text-2xl">
                  {getStatusIcon(service.status)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      service.status
                    )}`}
                  >
                    {service.status.charAt(0).toUpperCase() +
                      service.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Uptime:</span>
                  <span className="font-medium text-green-600">
                    {service.uptime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Incident:</span>
                  <span className="text-sm text-gray-500">
                    {service.lastIncident}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* System Issues */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              System Issues & Feedback
            </h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Status:
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Type:
                </label>
                <select
                  value={filterType}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Types</option>
                  <option value="bug">Bug</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="improvement">Improvement</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading system issues...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-red-600 mb-4">Failed to load system issues</p>
              <button
                onClick={() =>
                  fetchSystemIssues(currentPage, filterStatus, filterType)
                }
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
          ) : totalIssues === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-gray-600">
                No issues found matching your filters. All systems are running
                smoothly!
              </p>
            </div>
          ) : (
            <>
              {/* Active Issues Section */}
              {filteredActiveIssues.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                    Active Issues ({filteredActiveIssues.length})
                  </h4>
                  <div className="space-y-4 mb-6">
                    {currentIssues
                      .filter((issue) =>
                        ["open", "investigating", "in_progress"].includes(
                          issue.status
                        )
                      )
                      .map((issue) => (
                        <div
                          key={issue.id}
                          className="border-l-4 border-red-500 bg-red-50 pl-6 py-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <h5 className="text-lg font-semibold text-gray-900 mr-3">
                                  {issue.title}
                                </h5>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getIssueStatusColor(
                                    issue.status
                                  )}`}
                                >
                                  {issue.status.replace("_", " ").toUpperCase()}
                                </span>
                                <span
                                  className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                                    issue.severity
                                  )}`}
                                >
                                  {issue.severity.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-2">
                                {issue.description}
                              </p>
                              <div className="flex items-center text-sm text-gray-500">
                                <span>
                                  {new Date(
                                    issue.created_at
                                  ).toLocaleDateString()}
                                </span>
                                <span className="mx-2">•</span>
                                <span>
                                  Type: {issue.issue_type.replace("_", " ")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Resolved Issues Section */}
              {filteredResolvedIssues.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    Resolved Issues ({filteredResolvedIssues.length})
                  </h4>
                  <div className="space-y-4">
                    {currentIssues
                      .filter((issue) =>
                        ["resolved", "closed"].includes(issue.status)
                      )
                      .map((issue) => (
                        <div
                          key={issue.id}
                          className="border-l-4 border-green-500 bg-green-50 pl-6 py-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <h5 className="text-lg font-semibold text-gray-900 mr-3">
                                  {issue.title}
                                </h5>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getIssueStatusColor(
                                    issue.status
                                  )}`}
                                >
                                  {issue.status.toUpperCase()}
                                </span>
                                <span
                                  className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                                    issue.severity
                                  )}`}
                                >
                                  {issue.severity.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-2">
                                {issue.description}
                              </p>
                              <div className="flex items-center text-sm text-gray-500">
                                <span>
                                  {new Date(
                                    issue.created_at
                                  ).toLocaleDateString()}
                                </span>
                                <span className="mx-2">•</span>
                                <span>
                                  Type: {issue.issue_type.replace("_", " ")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8">
                  <div className="text-sm text-gray-700">
                    Showing {(currentPage - 1) * issuesPerPage + 1} to{" "}
                    {Math.min(currentPage * issuesPerPage, totalIssues)} of{" "}
                    {totalIssues} issues
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 text-sm border rounded-md ${
                            currentPage === page
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Report an Issue */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Report an Issue
              </h3>
              <p className="text-gray-600 mt-1">
                Found a bug or have a suggestion? Let us know!
              </p>
            </div>
            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              {showReportForm ? "Cancel" : "Report Issue"}
            </button>
          </div>

          {showReportForm && (
            <form onSubmit={handleSubmitIssue} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Type
                  </label>
                  <select
                    name="issue_type"
                    value={formData.issue_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="bug">Bug Report</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="improvement">Improvement</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Severity
                  </label>
                  <select
                    name="severity"
                    value={formData.severity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Detailed description of the issue, steps to reproduce, expected behavior, etc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="your.email@example.com"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Provide your email if you'd like us to follow up on this
                  issue.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Submit Issue
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Subscribe to Updates */}
        <div className="mt-12 bg-indigo-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Stay Informed
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Get notified about system status updates, maintenance windows, and
            any service disruptions.
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SystemStatus;

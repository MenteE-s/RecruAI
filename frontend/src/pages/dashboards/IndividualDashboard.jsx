import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import {
  getSidebarItems,
  verifyTokenWithServer,
  getBackendUrl,
} from "../../utils/auth";
import { formatDate } from "../../utils/timezone";
import {
  FiUsers,
  FiActivity,
  FiTrendingUp,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiBookmark,
  FiArrowRight,
  FiZap,
  FiTarget,
} from "react-icons/fi";

export default function IndividualDashboard() {
  const navigate = useNavigate();
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    completedInterviews: 0,
    passedInterviews: 0,
    upcomingInterviews: 0,
    appliedJobs: 0,
    savedJobs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const user = await verifyTokenWithServer();
      const userId = user && user.id ? user.id : 1;
      if (user && user.name) {
        setUserName(user.name.split(" ")[0]);
      }

      const interviewsResponse = await fetch(
        `${getBackendUrl()}/api/interviews?user_id=${userId}`,
        { credentials: "include" }
      );

      const appliedResponse = await fetch(
        `${getBackendUrl()}/api/applied-jobs/user/${userId}`,
        { credentials: "include" }
      );

      const savedResponse = await fetch(
        `${getBackendUrl()}/api/saved-jobs/user/${userId}`,
        { credentials: "include" }
      );

      let interviewsData = [];
      let appliedData = [];
      let savedData = [];

      if (interviewsResponse.ok) {
        const data = await interviewsResponse.json();
        interviewsData = data.data || [];
        setInterviews(interviewsData.slice(0, 5));
      }

      if (appliedResponse.ok) {
        appliedData = await appliedResponse.json();
      }

      if (savedResponse.ok) {
        savedData = await savedResponse.json();
      }

      const realTotal = interviewsData.length;
      const realCompleted = interviewsData.filter(
        (i) => i.status === "completed" || i.status === "cancelled"
      ).length;
      const realPassed = interviewsData.filter(
        (i) =>
          i.final_decision === "passed" ||
          i.final_decision === "second_round" ||
          i.final_decision === "third_round"
      ).length;
      const realUpcoming = interviewsData.filter(
        (i) => i.status === "scheduled" || i.status === "in_progress"
      ).length;
      const realApplied = appliedData.length;
      const realSaved = savedData.length;

      setStats({
        totalInterviews: realTotal,
        completedInterviews: realCompleted,
        passedInterviews: realPassed,
        upcomingInterviews: realUpcoming,
        appliedJobs: realApplied,
        savedJobs: realSaved,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (interview) => {
    if (interview.final_decision === "passed")
      return { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" };
    if (interview.final_decision === "failed")
      return { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" };
    if (interview.status === "completed")
      return { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" };
    if (interview.status === "in_progress")
      return { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" };
    return { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400" };
  };

  const getStatusText = (interview) => {
    if (interview.final_decision === "passed") return "Passed";
    if (interview.final_decision === "failed") return "Not Selected";
    if (interview.final_decision === "second_round") return "Round 2";
    if (interview.final_decision === "third_round") return "Round 3";
    if (interview.status === "completed") return "Completed";
    if (interview.status === "in_progress") return "In Progress";
    return "Scheduled";
  };

  return (
    <DashboardLayout
      NavbarComponent={IndividualNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {userName ? `Welcome back, ${userName}` : "Welcome back"}
            </h1>
            <p className="text-gray-500 mt-1">
              Here's what's happening with your job search.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/jobs")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <FiBriefcase className="w-4 h-4" />
              Browse Jobs
            </button>
            <button
              onClick={() => navigate("/practice")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 transition-colors"
            >
              <FiTarget className="w-4 h-4" />
              Practice
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox
            label="Total Interviews"
            value={stats.totalInterviews}
            icon={FiActivity}
            color="blue"
            loading={loading}
          />
          <StatBox
            label="Completed"
            value={stats.completedInterviews}
            icon={FiCheckCircle}
            color="green"
            loading={loading}
          />
          <StatBox
            label="Upcoming"
            value={stats.upcomingInterviews}
            icon={FiCalendar}
            color="amber"
            loading={loading}
          />
          <StatBox
            label="Applied Jobs"
            value={stats.appliedJobs}
            icon={FiBriefcase}
            color="purple"
            loading={loading}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Interviews - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Recent Interviews</h2>
              {interviews.length > 0 && (
                <button
                  onClick={() => navigate("/interviews/history")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  View all
                  <FiArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : interviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <FiCalendar className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-900 font-medium">No interviews yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  Start applying to see your interviews here
                </p>
                <button
                  onClick={() => navigate("/jobs")}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Browse jobs →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {interviews.map((interview) => {
                  const status = getStatusColor(interview);
                  return (
                    <button
                      key={interview.id}
                      onClick={() => navigate(`/interviews/${interview.id}/analysis`)}
                      className="w-full flex items-center justify-between p-3.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status.bg} shrink-0`}>
                          <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 group-hover:text-blue-600 truncate">
                            {interview.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {interview.organization} • Round {interview.current_round}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                          {getStatusText(interview)}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(interview.scheduled_at)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar - Quick Actions */}
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Your Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-600">Interview Success Rate</span>
                    <span className="font-medium text-gray-900">
                      {stats.completedInterviews > 0
                        ? Math.round((stats.passedInterviews / stats.completedInterviews) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          stats.completedInterviews > 0
                            ? Math.round((stats.passedInterviews / stats.completedInterviews) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-600">Applications Sent</span>
                    <span className="font-medium text-gray-900">{stats.appliedJobs}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(stats.appliedJobs * 10, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-600">Saved Jobs</span>
                    <span className="font-medium text-gray-900">{stats.savedJobs}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(stats.savedJobs * 15, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Access</h3>
              <div className="space-y-1">
                <QuickLink
                  icon={FiCalendar}
                  label="Upcoming Interviews"
                  count={stats.upcomingInterviews}
                  onClick={() => navigate("/interviews/upcoming")}
                />
                <QuickLink
                  icon={FiBookmark}
                  label="Saved Jobs"
                  count={stats.savedJobs}
                  onClick={() => navigate("/jobs/saved")}
                />
                <QuickLink
                  icon={FiCheckCircle}
                  label="Applied Jobs"
                  count={stats.appliedJobs}
                  onClick={() => navigate("/jobs/applied")}
                />
                <QuickLink
                  icon={FiZap}
                  label="AI Practice"
                  onClick={() => navigate("/practice")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatBox({ label, value, icon: Icon, color, loading }) {
  const colors = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100" },
    green: { bg: "bg-green-50", icon: "text-green-600", border: "border-green-100" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-100" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-100" },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? (
              <span className="inline-block w-8 h-6 bg-gray-100 rounded animate-pulse" />
            ) : (
              value
            )}
          </p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ icon: Icon, label, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left group"
    >
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
      </div>
      {count !== undefined && (
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </button>
  );
}

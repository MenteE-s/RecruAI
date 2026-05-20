import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
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
  FiDollarSign,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiXCircle,
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

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const user = await verifyTokenWithServer();
      const userId = user && user.id ? user.id : 1; // Default to 1 if not authenticated

      // Fetch interviews
      const interviewsResponse = await fetch(
        `${getBackendUrl()}/api/interviews?user_id=${userId}`,
        {
          credentials: "include",
        }
      );

      // Fetch applied jobs
      const appliedResponse = await fetch(
        `${getBackendUrl()}/api/applied-jobs/user/${userId}`,
        {
          credentials: "include",
        }
      );

      // Fetch saved jobs
      const savedResponse = await fetch(
        `${getBackendUrl()}/api/saved-jobs/user/${userId}`,
        {
          credentials: "include",
        }
      );

      let interviewsData = [];
      let appliedData = [];
      let savedData = [];

      if (interviewsResponse.ok) {
        const data = await interviewsResponse.json();
        interviewsData = data.data || [];
        setInterviews(interviewsData.slice(0, 5)); // Show only recent 5
      }

      if (appliedResponse.ok) {
        appliedData = await appliedResponse.json();
      }

      if (savedResponse.ok) {
        savedData = await savedResponse.json();
      }

      // Calculate stats from real data
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

      // Use real data if available, otherwise show realistic sample data
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

  const getStatusIcon = (interview) => {
    if (interview.final_decision === "passed")
      return <FiCheckCircle className="text-green-500" />;
    if (interview.final_decision === "failed")
      return <FiXCircle className="text-red-500" />;
    if (interview.status === "completed")
      return <FiCheckCircle className="text-blue-500" />;
    if (interview.status === "in_progress")
      return <FiActivity className="text-yellow-500" />;
    return <FiClock className="text-gray-500" />;
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
      {/* Header */}
      <div className="mb-8">
        <div className="rounded-2xl bg-slate-800 border border-slate-700 p-6 md:p-8 text-white shadow-lg">
          <h1 className="text-2xl md:text-3xl font-bold">Welcome back</h1>
          <p className="mt-1 text-slate-400 text-sm md:text-base">
            Here's a quick snapshot of your interview journey.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
        <StatCard
          title="Total Interviews"
          value={stats.totalInterviews}
          icon={FiActivity}
        />
        <StatCard
          title="Completed"
          value={stats.completedInterviews}
          icon={FiCheckCircle}
        />
        <StatCard
          title="Passed"
          value={stats.passedInterviews}
          icon={FiTrendingUp}
        />
        <StatCard
          title="Upcoming"
          value={stats.upcomingInterviews}
          icon={FiCalendar}
        />
        <StatCard
          title="Applied Jobs"
          value={stats.appliedJobs}
          icon={FiUsers}
        />
        <StatCard
          title="Saved Jobs"
          value={stats.savedJobs}
          icon={FiDollarSign}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Interviews */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Interviews</h3>
            <span className="text-xs text-slate-400">Last 5 activities</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : interviews.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No interviews yet.
              <div className="text-sm mt-1">
                Start applying to unlock insights
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {interviews.map((interview) => (
                <div
                  key={interview.id}
                  onClick={() =>
                    navigate(`/interviews/${interview.id}/analysis`)
                  }
                  className="group flex items-center justify-between rounded-xl border border-slate-700 p-4 hover:border-blue-600 hover:bg-slate-700/50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg">{getStatusIcon(interview)}</div>
                    <div>
                      <p className="font-medium text-white group-hover:text-blue-400">
                        {interview.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        Round {interview.current_round} •{" "}
                        {interview.organization}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {getStatusText(interview)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(interview.scheduled_at)}
                    </p>
                  </div>
                </div>
              ))}

              {interviews.length >= 5 && (
                <button
                  onClick={() => navigate("/interviews/history")}
                  className="w-full mt-2 rounded-lg py-2 text-sm font-medium text-blue-400 hover:bg-slate-700 transition"
                >
                  View Full Interview History →
                </button>
              )}
            </div>
          )}
        </Card>

        {/* Saved Jobs */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Saved Jobs</h3>
            <span className="text-xs text-slate-400">Quick access</span>
          </div>

          <div className="h-64 rounded-xl border border-dashed border-slate-600 flex items-center justify-center text-slate-400 text-sm">
            Saved jobs will appear here
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

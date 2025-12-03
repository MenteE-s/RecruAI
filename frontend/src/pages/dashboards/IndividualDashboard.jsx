import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import { getSidebarItems, verifyTokenWithServer } from "../../utils/auth";
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
        `/api/interviews?user_id=${userId}`,
        {
          credentials: "include",
        }
      );

      // Fetch applied jobs
      const appliedResponse = await fetch(`/api/applied-jobs/user/${userId}`, {
        credentials: "include",
      });

      // Fetch saved jobs
      const savedResponse = await fetch(`/api/saved-jobs/user/${userId}`, {
        credentials: "include",
      });

      let interviewsData = [];
      let appliedData = [];
      let savedData = [];

      if (interviewsResponse.ok) {
        const data = await interviewsResponse.json();
        interviewsData = data.interviews;
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
      <div className="mb-6">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-600/80 via-purple-600/60 to-cyan-500/60 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">
                Your Dashboard
              </h1>
              <p className="mt-1 text-white/90">
                Personal activity and summaries just for you.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Interviews"
          value={stats.totalInterviews}
          change=""
          icon={FiActivity}
          trend="neutral"
        />
        <StatCard
          title="Completed"
          value={stats.completedInterviews}
          change=""
          icon={FiCheckCircle}
          trend="neutral"
        />
        <StatCard
          title="Passed"
          value={stats.passedInterviews}
          change=""
          icon={FiTrendingUp}
          trend="neutral"
        />
        <StatCard
          title="Upcoming"
          value={stats.upcomingInterviews}
          change=""
          icon={FiCalendar}
          trend="neutral"
        />
        <StatCard
          title="Applied Jobs"
          value={stats.appliedJobs}
          change=""
          icon={FiUsers}
          trend="neutral"
        />
        <StatCard
          title="Saved Jobs"
          value={stats.savedJobs}
          change=""
          icon={FiDollarSign}
          trend="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">
            Recent Interviews
          </h3>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : interviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No interviews yet. Start applying to jobs!
            </div>
          ) : (
            <div className="space-y-3">
              {interviews.map((interview) => (
                <div
                  key={interview.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() =>
                    navigate(`/interviews/${interview.id}/analysis`)
                  }
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(interview)}
                    <div>
                      <p className="font-medium text-gray-900">
                        {interview.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        Round {interview.current_round} •{" "}
                        {interview.organization}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {getStatusText(interview)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(interview.scheduled_at)}
                    </p>
                  </div>
                </div>
              ))}
              {interviews.length >= 5 && (
                <button
                  onClick={() => navigate("/interviews/history")}
                  className="w-full text-center py-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  View All Interviews →
                </button>
              )}
            </div>
          )}
        </Card>
        <Card>
          <h3 className="font-semibold text-secondary-800 mb-4">Saved Jobs</h3>
          <div className="h-64 bg-secondary-50 rounded-lg flex items-center justify-center text-secondary-400">
            Saved jobs placeholder
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

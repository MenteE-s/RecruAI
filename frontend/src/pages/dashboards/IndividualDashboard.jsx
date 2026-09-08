import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, verifyTokenWithServer, getBackendUrl } from "../../utils/auth";
import { formatDate } from "../../utils/timezone";
import {
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiBookmark,
  FiArrowRight,
  FiTarget,
  FiActivity,
  FiTrendingUp,
  FiUsers,
  FiZap,
} from "react-icons/fi";

export default function IndividualDashboard() {
  const navigate = useNavigate();
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState({ totalInterviews: 0, completedInterviews: 0, passedInterviews: 0, upcomingInterviews: 0, appliedJobs: 0, savedJobs: 0 });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => { fetchInterviews(); }, []);

  const fetchInterviews = async () => {
    try {
      const user = await verifyTokenWithServer();
      const userId = user && user.id ? user.id : 1;
      if (user && user.name) setUserName(user.name.split(" ")[0]);
      const [interviewsRes, appliedRes, savedRes] = await Promise.all([
        fetch(`${getBackendUrl()}/api/interviews?user_id=${userId}`, { credentials: "include" }),
        fetch(`${getBackendUrl()}/api/applied-jobs/user/${userId}`, { credentials: "include" }),
        fetch(`${getBackendUrl()}/api/saved-jobs/user/${userId}`, { credentials: "include" }),
      ]);
      let interviewsData = [], appliedData = [], savedData = [];
      if (interviewsRes.ok) {
        const data = await interviewsRes.json();
        interviewsData = data.data || [];
        setInterviews(interviewsData.slice(0, 5));
      }
      if (appliedRes.ok) appliedData = await appliedRes.json();
      if (savedRes.ok) savedData = await savedRes.json();
      setStats({
        totalInterviews: interviewsData.length,
        completedInterviews: interviewsData.filter((i) => i.status === "completed" || i.status === "cancelled").length,
        passedInterviews: interviewsData.filter((i) => ["passed", "second_round", "third_round"].includes(i.final_decision)).length,
        upcomingInterviews: interviewsData.filter((i) => ["scheduled", "in_progress"].includes(i.status)).length,
        appliedJobs: Array.isArray(appliedData) ? appliedData.length : appliedData.data?.length || 0,
        savedJobs: Array.isArray(savedData) ? savedData.length : 0,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusMeta = (interview) => {
    if (interview.final_decision === "passed") return { label: "Passed", color: "bg-green-50 text-green-700 border-green-200" };
    if (interview.final_decision === "failed") return { label: "Not selected", color: "bg-red-50 text-red-700 border-red-200" };
    if (interview.status === "in_progress") return { label: "In progress", color: "bg-amber-50 text-amber-700 border-amber-200" };
    if (interview.status === "completed") return { label: "Completed", color: "bg-blue-50 text-blue-700 border-blue-200" };
    return { label: "Scheduled", color: "bg-gray-50 text-gray-700 border-gray-200" };
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-sm text-blue-200">Welcome back{userName ? `, ${userName}` : ""} 👋</p>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight mt-1">Your job search, at a glance</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Track interviews, applications, and saved roles — all in one place.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => navigate("/jobs")} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 text-sm font-medium hover:bg-gray-100 transition-colors"><FiBriefcase className="w-4 h-4" /> Browse jobs</button>
                <button onClick={() => navigate("/practice")} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/15 transition-colors"><FiTarget className="w-4 h-4" /> Practice</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[380px]">
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{stats.upcomingInterviews}</p>
                <p className="text-xs text-gray-300 mt-1">Upcoming</p>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{stats.appliedJobs}</p>
                <p className="text-xs text-gray-300 mt-1">Applied</p>
              </div>
              <div className="bg-blue-500/20 backdrop-blur border border-blue-400/20 p-4 text-center">
                <p className="text-2xl font-bold text-blue-200">{stats.passedInterviews}</p>
                <p className="text-xs text-blue-200 mt-1">Passed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total interviews", value: stats.totalInterviews, icon: FiActivity, color: "text-blue-600 bg-blue-50 border-blue-100" },
          { label: "Completed", value: stats.completedInterviews, icon: FiCheckCircle, color: "text-green-600 bg-green-50 border-green-100" },
          { label: "Upcoming", value: stats.upcomingInterviews, icon: FiCalendar, color: "text-amber-600 bg-amber-50 border-amber-100" },
          { label: "Applied jobs", value: stats.appliedJobs, icon: FiBriefcase, color: "text-purple-600 bg-purple-50 border-purple-100" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white border border-gray-200 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 flex items-center justify-center border ${stat.color}`}><Icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xl font-bold text-gray-900">{loading ? "—" : stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Interviews */}
        <div className="lg:col-span-2 bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Recent interviews</h2>
            {interviews.length > 0 && (
              <button onClick={() => navigate("/interviews/history")} className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {loading ? (
            <div className="p-6 flex justify-center"><div className="animate-spin h-8 w-8 border-2 border-gray-200 border-t-blue-600 rounded-full" /></div>
          ) : interviews.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto mb-3"><FiCalendar className="w-6 h-6 text-gray-400" /></div>
              <p className="text-sm font-medium text-gray-900">No interviews yet</p>
              <p className="text-xs text-gray-500 mt-1">Start applying to see your interviews here</p>
              <button onClick={() => navigate("/jobs")} className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700">Browse jobs →</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {interviews.map((interview) => {
                const meta = getStatusMeta(interview);
                return (
                  <button key={interview.id} onClick={() => navigate(`/interviews/${interview.id}/analysis`)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-gray-900 text-white flex items-center justify-center text-xs font-bold shrink-0">{interview.title?.[0] || "I"}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{interview.title}</p>
                        <p className="text-xs text-gray-500 truncate">{interview.organization} • Round {interview.current_round}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <span className={`inline-flex text-xs font-medium border px-2 py-0.5 ${meta.color}`}>{meta.label}</span>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(interview.scheduled_at)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Progress */}
          <div className="bg-white border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900">Your progress</h3>
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-600">Success rate</span><span className="font-medium text-gray-900">{stats.completedInterviews ? Math.round((stats.passedInterviews / stats.completedInterviews) * 100) : 0}%</span></div>
                <div className="h-1.5 bg-gray-100"><div className="h-1.5 bg-green-600" style={{ width: `${stats.completedInterviews ? Math.round((stats.passedInterviews / stats.completedInterviews) * 100) : 0}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-600">Applications</span><span className="font-medium text-gray-900">{stats.appliedJobs}</span></div>
                <div className="h-1.5 bg-gray-100"><div className="h-1.5 bg-blue-600" style={{ width: `${Math.min(stats.appliedJobs * 10, 100)}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-600">Saved jobs</span><span className="font-medium text-gray-900">{stats.savedJobs}</span></div>
                <div className="h-1.5 bg-gray-100"><div className="h-1.5 bg-purple-600" style={{ width: `${Math.min(stats.savedJobs * 15, 100)}%` }} /></div>
              </div>
            </div>
          </div>

          {/* Quick Access */}
          <div className="bg-white border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900">Quick access</h3>
            <div className="mt-3 space-y-1">
              {[
                { icon: FiCalendar, label: "Upcoming interviews", count: stats.upcomingInterviews, link: "/interviews/upcoming" },
                { icon: FiBookmark, label: "Saved jobs", count: stats.savedJobs, link: "/jobs/saved" },
                { icon: FiCheckCircle, label: "Applied jobs", count: stats.appliedJobs, link: "/jobs/applied" },
                { icon: FiZap, label: "AI practice", link: "/practice" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} onClick={() => navigate(item.link)} className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 transition-colors text-left">
                    <span className="flex items-center gap-2.5 text-sm text-gray-700"><Icon className="w-4 h-4 text-gray-400" />{item.label}</span>
                    {item.count !== undefined && <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5">{item.count}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-blue-600 text-white p-5">
            <h3 className="text-sm font-semibold flex items-center gap-2"><FiTrendingUp className="w-4 h-4" /> Keep going</h3>
            <p className="text-sm text-blue-50 mt-1">You’ve completed {stats.completedInterviews} interviews. Practice more to boost your pass rate.</p>
            <button onClick={() => navigate("/practice")} className="mt-3 w-full bg-white text-blue-600 py-2.5 text-sm font-medium hover:bg-blue-50 transition-colors">Practice now</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

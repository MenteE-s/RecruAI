import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { formatDateTime, getRelativeTime } from "../../utils/timezone";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiBriefcase,
  FiSearch,
  FiX,
  FiVideo,
  FiPhone,
  FiMessageSquare,
  FiCpu,
  FiUsers,
  FiCheckCircle,
  FiAlertCircle,
  FiPlayCircle,
  FiArrowRight,
  FiFilter,
} from "react-icons/fi";

export default function UpcomingInterviews() {
  const navigate = useNavigate();
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    const fetchUpcomingInterviews = async () => {
      try {
        const response = await fetch(`${getBackendUrl()}/api/interviews/upcoming`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          setInterviews(data.interviews || []);
        } else setError("Failed to load upcoming interviews");
      } catch (err) {
        console.error("Error fetching interviews:", err);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchUpcomingInterviews();
  }, []);

  const getInterviewTypeMeta = (type) => {
    switch (type) {
      case "text":
        return { icon: FiMessageSquare, label: "Text", color: "bg-gray-50 text-gray-700 border-gray-200" };
      case "ai_video":
        return { icon: FiCpu, label: "AI Video", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "human_video":
        return { icon: FiUsers, label: "Human Video", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "video":
        return { icon: FiVideo, label: "Video", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "phone":
        return { icon: FiPhone, label: "Phone", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "in-person":
        return { icon: FiBriefcase, label: "On-site", color: "bg-amber-50 text-amber-700 border-amber-200" };
      default:
        return { icon: FiCalendar, label: type || "Interview", color: "bg-gray-50 text-gray-700 border-gray-200" };
    }
  };

  const getStatusBadge = (interview) => {
    const now = new Date();
    const scheduledTime = new Date(interview.scheduled_at_iso || interview.scheduled_at);
    const timeDiff = scheduledTime - now;
    const minutesDiff = timeDiff / (1000 * 60);
    if (interview.status === "completed") return <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2.5 py-1"><FiCheckCircle className="w-3.5 h-3.5" /> Completed</span>;
    if (interview.status === "cancelled") return <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 px-2.5 py-1"><FiX className="w-3.5 h-3.5" /> Cancelled</span>;
    if (minutesDiff < 0 && minutesDiff >= -interview.duration_minutes) return <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-600 text-white px-2.5 py-1 animate-pulse"><FiPlayCircle className="w-3.5 h-3.5" /> Join now</span>;
    if (minutesDiff < -interview.duration_minutes) return <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-1">Ended</span>;
    if (minutesDiff <= 15) return <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-600 text-white px-2.5 py-1 animate-pulse"><FiClock className="w-3.5 h-3.5" /> Starting soon</span>;
    return <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1"><FiCalendar className="w-3.5 h-3.5" /> Scheduled</span>;
  };

  const canJoinInterview = (interview) => {
    const scheduledAt = interview.scheduled_at_iso || interview.scheduled_at;
    if (!scheduledAt) return false;
    const nowUTC = new Date();
    const scheduledTime = new Date(scheduledAt + (scheduledAt.includes("Z") ? "" : "Z"));
    const timeDiff = scheduledTime - nowUTC;
    const minutesDiff = timeDiff / (1000 * 60);
    return minutesDiff <= 0 && minutesDiff >= -interview.duration_minutes;
  };

  const getJoinButtonText = (interview) => {
    const scheduledAt = interview.scheduled_at_iso || interview.scheduled_at;
    if (!scheduledAt) return "Unknown";
    const nowUTC = new Date();
    const scheduledTime = new Date(scheduledAt + (scheduledAt.includes("Z") ? "" : "Z"));
    const timeDiff = scheduledTime - nowUTC;
    const minutesDiff = timeDiff / (1000 * 60);
    if (minutesDiff > 15) return "Scheduled";
    if (minutesDiff > 0) return `Starts in ${Math.ceil(minutesDiff)}m`;
    if (minutesDiff >= -interview.duration_minutes) return "Join now";
    return "Ended";
  };

  const filteredInterviews = interviews.filter((interview) => {
    if (!filterText) return true;
    const text = filterText.toLowerCase();
    return (
      interview.id?.toString().includes(text) ||
      interview.title?.toLowerCase().includes(text) ||
      interview.organization?.toLowerCase().includes(text) ||
      interview.post_title?.toLowerCase().includes(text) ||
      interview.interview_type?.toLowerCase().includes(text) ||
      interview.location?.toLowerCase().includes(text)
    );
  });

  const stats = {
    total: interviews.length,
    joinable: interviews.filter(canJoinInterview).length,
    startingSoon: interviews.filter((i) => {
      const sd = new Date(i.scheduled_at_iso || i.scheduled_at);
      const diff = (sd - new Date()) / 60000;
      return diff > 0 && diff <= 15 && i.status !== "completed" && i.status !== "cancelled";
    }).length,
    scheduled: interviews.filter((i) => i.status !== "completed" && i.status !== "cancelled").length,
  };

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-gray-900 h-48 animate-pulse" />
          <div className="bg-white border border-gray-200 p-4">
            <div className="h-10 bg-gray-100 rounded animate-pulse" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 p-5 animate-pulse">
              <div className="h-5 bg-gray-100 w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 w-1/2 mb-4" />
              <div className="h-3 bg-gray-100 w-full" />
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 px-4 py-3 flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900 p-1">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-xs font-medium tracking-wide mb-3">
                <FiCalendar className="w-3.5 h-3.5" />
                INTERVIEWS
              </div>
              <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">Upcoming interviews</h1>
              <p className="text-gray-300 mt-2 max-w-xl text-sm md:text-[15px]">Your scheduled sessions, prep materials, and join links — all in one place.</p>
              <div className="mt-5 flex gap-2">
                <button onClick={() => navigate("/interviews/history")} className="bg-white text-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors">View history</button>
                <button onClick={() => navigate("/jobs")} className="bg-white/10 backdrop-blur border border-white/20 text-white px-4 py-2 text-sm font-medium hover:bg-white/15 transition-colors">Browse jobs</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[380px]">
              <div className="bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-300 mt-1">Total</p>
              </div>
              <div className="bg-green-500/20 backdrop-blur border border-green-400/20 p-4 text-center">
                <p className="text-2xl font-bold text-green-300">{stats.joinable}</p>
                <p className="text-xs text-green-200 mt-1">Joinable</p>
              </div>
              <div className="bg-blue-500/20 backdrop-blur border border-blue-400/20 p-4 text-center">
                <p className="text-2xl font-bold text-blue-200">{stats.startingSoon}</p>
                <p className="text-xs text-blue-200 mt-1">Starting soon</p>
              </div>
              <div className="col-span-3 bg-white text-gray-900 p-3 flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2"><FiClock className="w-4 h-4 text-gray-500" /> Next up: {filteredInterviews[0] ? getRelativeTime(filteredInterviews[0].scheduled_at) : "—"}</span>
                <span className="text-xs text-gray-500">{stats.scheduled} scheduled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xl">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Filter by title, ID, organization, position…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
          {filterText && (
            <button onClick={() => setFilterText("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded text-gray-500">
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FiFilter className="w-3.5 h-3.5" />
          {filteredInterviews.length} of {interviews.length} shown
          {filterText && <button onClick={() => setFilterText("")} className="text-blue-600 hover:text-blue-700 font-medium ml-1">Clear filter</button>}
        </div>
      </div>

      {/* List */}
      {filteredInterviews.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FiCalendar className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{filterText ? "No matching interviews" : "No upcoming interviews"}</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">{filterText ? "Try adjusting your search terms or clear the filter." : "You don’t have any interviews scheduled at the moment. Once an organization schedules you, it will appear here."}</p>
          <div className="mt-6 flex justify-center gap-3">
            {filterText ? (
              <button onClick={() => setFilterText("")} className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-black transition-colors"><FiX className="w-4 h-4" /> Clear filter</button>
            ) : (
              <>
                <button onClick={() => navigate("/jobs")} className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-black transition-colors">Browse jobs <FiArrowRight className="w-4 h-4" /></button>
                <button onClick={() => navigate("/interviews/history")} className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 text-sm font-medium hover:bg-gray-50">View history</button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInterviews.map((interview) => {
            const typeMeta = getInterviewTypeMeta(interview.interview_type);
            const TypeIcon = typeMeta.icon;
            const canJoin = canJoinInterview(interview);
            const joinText = getJoinButtonText(interview);
            return (
              <div key={interview.id} className="group bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="p-5">
                  <div className="flex gap-4">
                    <div className={`hidden sm:flex w-11 h-11 items-center justify-center border shrink-0 ${typeMeta.color}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[15px] font-semibold text-gray-900 leading-tight">{interview.title}</h3>
                            {interview.current_round && <span className="text-xs bg-blue-600 text-white px-2 py-0.5">Round {interview.current_round}</span>}
                            {getStatusBadge(interview)}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 flex flex-wrap items-center gap-1.5">
                            <span>{interview.organization}</span>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1"><FiClock className="w-3.5 h-3.5 text-gray-400" />{formatDateTime(interview.scheduled_at)}</span>
                            <span className="text-gray-300 hidden sm:inline">•</span>
                            <span className="text-xs text-gray-500">{getRelativeTime(interview.scheduled_at)}</span>
                          </p>
                          {interview.post_title && <p className="text-xs text-blue-600 mt-1.5 inline-flex items-center gap-1"><FiBriefcase className="w-3 h-3" /> Position: {interview.post_title}</p>}
                        </div>
                        <span className={`hidden md:inline-flex items-center gap-1.5 text-xs border px-2.5 py-1 shrink-0 ${typeMeta.color}`}><TypeIcon className="w-3 h-3" /> {typeMeta.label}</span>
                      </div>

                      {interview.description && <p className="text-sm text-gray-600 mt-3 line-clamp-2 leading-relaxed">{interview.description}</p>}

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1.5 text-xs bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1"><FiClock className="w-3 h-3 text-gray-400" />{interview.duration_minutes} min</span>
                        {interview.location && <span className="inline-flex items-center gap-1.5 text-xs bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1"><FiMapPin className="w-3 h-3 text-gray-400" />{interview.location}</span>}
                        <span className={`inline-flex md:hidden items-center gap-1.5 text-xs border px-2.5 py-1 ${typeMeta.color}`}><TypeIcon className="w-3 h-3" />{typeMeta.label}</span>
                      </div>
                    </div>
                    <div className="hidden lg:flex flex-col gap-2 shrink-0 w-[160px]">
                      {canJoin ? (
                        <button onClick={() => navigate(`/interview/${interview.id}`)} className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors animate-pulse">
                          <FiPlayCircle className="w-4 h-4" /> {joinText}
                        </button>
                      ) : (
                        <button disabled className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-500 border border-gray-200 text-sm font-medium cursor-not-allowed">
                          <FiClock className="w-4 h-4" /> {joinText}
                        </button>
                      )}
                      <button onClick={() => navigate(`/interviews/${interview.id}`)} className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors">Prepare <FiArrowRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="mt-4 flex lg:hidden gap-2">
                    {canJoin ? (
                      <button onClick={() => navigate(`/interview/${interview.id}`)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"><FiPlayCircle className="w-4 h-4" /> {joinText}</button>
                    ) : (
                      <button disabled className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-500 border border-gray-200 text-sm font-medium cursor-not-allowed"><FiClock className="w-4 h-4" /> {joinText}</button>
                    )}
                    <button onClick={() => navigate(`/interviews/${interview.id}`)} className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium">Prepare</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import MenteeLoader from "../../components/ui/MenteeLoader";
import { getSidebarItems, getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { formatDateTime } from "../../utils/timezone";
import {
  FiCalendar,
  FiClock,
  FiVideo,
  FiPhone,
  FiMessageSquare,
  FiCpu,
  FiBriefcase,
  FiCheckCircle,
  FiXCircle,
  FiPlayCircle,
  FiStar,
  FiSearch,
  FiX,
  FiEye,
  FiBarChart2,
} from "react-icons/fi";

function typeMeta(type) {
  switch (type) {
    case "ai_video":
      return { icon: FiCpu, label: "AI Video" };
    case "human_video":
    case "video":
      return { icon: FiVideo, label: "Video" };
    case "phone":
      return { icon: FiPhone, label: "Phone" };
    case "text":
      return { icon: FiMessageSquare, label: "Text" };
    case "in-person":
      return { icon: FiBriefcase, label: "On-site" };
    default:
      return { icon: FiCalendar, label: type || "Interview" };
  }
}

function canJoin(iv) {
  const at = iv.scheduled_at_iso || iv.scheduled_at;
  if (!at) return false;
  const diff = (new Date(at + (at.includes("Z") ? "" : "Z")) - new Date()) / 60000;
  return diff <= 0 && diff >= -(iv.duration_minutes || 60);
}

function joinLabel(iv) {
  const at = iv.scheduled_at_iso || iv.scheduled_at;
  if (!at) return "Unknown";
  const diff = (new Date(at + (at.includes("Z") ? "" : "Z")) - new Date()) / 60000;
  if (diff > 15) return "Scheduled";
  if (diff > 0) return `Starts in ${Math.ceil(diff)}m`;
  if (diff >= -(iv.duration_minutes || 60)) return "Join now";
  return "Ended";
}

function statusChip(iv) {
  if (iv.status === "completed" || iv.final_decision === "passed")
    return <span className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-1.5 py-px rounded">Completed</span>;
  if (iv.status === "cancelled" || iv.final_decision === "rejected")
    return <span className="text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 px-1.5 py-px rounded">Cancelled</span>;
  if (canJoin(iv))
    return <span className="text-[10px] font-semibold bg-green-600 text-white px-1.5 py-px rounded animate-pulse">Join now</span>;
  return <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-px rounded">Scheduled</span>;
}

export default function Interviews() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "history" ? "history" : "scheduled";
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [upRes, histRes] = await Promise.all([
          fetch(`${getBackendUrl()}/api/interviews/upcoming`, { credentials: "include", headers: getAuthHeaders() }).catch(() => null),
          fetch(`${getBackendUrl()}/api/interviews/history`, { credentials: "include", headers: getAuthHeaders() }).catch(() => null),
        ]);
        if (upRes && upRes.ok) setUpcoming((await upRes.json()).interviews || []);
        if (histRes && histRes.ok) setHistory((await histRes.json()).interviews || []);
      } catch (e) {
        console.error("Error loading interviews:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const setTab = (t) => setParams(t === "history" ? { tab: "history" } : {});

  const scheduledList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return upcoming.filter((iv) => {
      if (!q) return true;
      return (
        iv.title?.toLowerCase().includes(q) ||
        iv.organization?.toLowerCase().includes(q) ||
        iv.post_title?.toLowerCase().includes(q)
      );
    });
  }, [upcoming, search]);

  const historyList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return history.filter((iv) => {
      if (!q) return true;
      return (
        iv.title?.toLowerCase().includes(q) ||
        iv.organization?.toLowerCase().includes(q) ||
        iv.post_title?.toLowerCase().includes(q)
      );
    });
  }, [history, search]);

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="w-full max-w-3xl mx-auto space-y-2.5">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight">Interviews</h1>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {upcoming.length} scheduled · {history.length} in history
          </p>
        </div>

        {/* Internal tabs */}
        <div className="flex gap-1.5 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          {[
            { id: "scheduled", label: `Scheduled (${upcoming.length})`, icon: FiCalendar },
            { id: "history", label: `History (${history.length})`, icon: FiClock },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Filter by title, organization, position…"
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

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
            <MenteeLoader size={52} text="Loading interviews…" />
          </div>
        ) : tab === "scheduled" ? (
          scheduledList.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
              <FiCalendar className="w-7 h-7 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-900">No scheduled interviews</p>
              <p className="text-xs text-gray-500 mt-0.5">Once an organization schedules you, it appears here.</p>
            </div>
          ) : (
            scheduledList.map((iv) => {
              const meta = typeMeta(iv.interview_type);
              const TypeIcon = meta.icon;
              const joinable = canJoin(iv);
              return (
                <div key={iv.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <TypeIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-[13px] font-semibold text-gray-900 leading-tight truncate">{iv.title}</h3>
                        {iv.current_round && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-px rounded">R{iv.current_round}</span>}
                        {statusChip(iv)}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {iv.organization || "Unknown org"} · {iv.scheduled_at ? formatDateTime(iv.scheduled_at) : "Unscheduled"}
                      </p>
                      {iv.post_title && <p className="text-[11px] text-blue-600 truncate mt-px">{iv.post_title}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-50">
                    {joinable ? (
                      <button onClick={() => navigate(`/interview/${iv.id}`)} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700 rounded-md animate-pulse">
                        <FiPlayCircle className="w-3 h-3" /> {joinLabel(iv)}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-500 text-[11px] font-medium rounded-md">
                        <FiClock className="w-3 h-3" /> {joinLabel(iv)}
                      </span>
                    )}
                    <button onClick={() => navigate(`/interviews/${iv.id}`)} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 text-gray-600 text-[11px] font-medium hover:bg-gray-50 rounded-md">
                      <FiEye className="w-3 h-3" /> Prepare
                    </button>
                  </div>
                </div>
              );
            })
          )
        ) : historyList.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
            <FiClock className="w-7 h-7 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-900">No interview history</p>
            <p className="text-xs text-gray-500 mt-0.5">Completed interviews will appear here.</p>
          </div>
        ) : (
          historyList.map((iv) => {
            const passed = iv.final_decision === "passed" || iv.status === "completed";
            return (
              <div key={iv.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
                <div className="flex items-start gap-2.5">
                  <div className={`w-9 h-9 rounded-md border flex items-center justify-center shrink-0 ${passed ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                    {passed
                      ? <FiCheckCircle className="w-4 h-4 text-green-600" />
                      : iv.status === "cancelled" || iv.final_decision === "rejected"
                        ? <FiXCircle className="w-4 h-4 text-red-500" />
                        : <FiClock className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-[13px] font-semibold text-gray-900 leading-tight truncate">{iv.title}</h3>
                      {statusChip(iv)}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                      {iv.organization || "Unknown org"} · {iv.scheduled_at ? formatDateTime(iv.scheduled_at_iso || iv.scheduled_at) : ""}
                    </p>
                    {iv.rating ? (
                      <p className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <FiStar key={s} className={`w-3 h-3 ${s <= iv.rating ? "fill-amber-500 text-amber-500" : "text-gray-300"}`} />
                        ))}
                        <span className="text-[11px] text-gray-500 ml-1">{iv.rating}/5</span>
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-50">
                  <button onClick={() => navigate(`/interviews/${iv.id}`)} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 text-gray-600 text-[11px] font-medium hover:bg-gray-50 rounded-md">
                    <FiEye className="w-3 h-3" /> Details
                  </button>
                  {(iv.status === "completed" || iv.rating) && (
                    <button onClick={() => navigate(`/interviews/${iv.id}/analysis`)} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 text-blue-600 text-[11px] font-medium hover:bg-blue-50 rounded-md">
                      <FiBarChart2 className="w-3 h-3" /> Analysis
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}

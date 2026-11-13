import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppShell, CenterBar } from "../../components/layout/AppShell";
import MenteeLoader from "../../components/ui/MenteeLoader";
import AnimatedTabBar from "../../components/motion/AnimatedTabBar";
import { getBackendUrl, getAuthHeaders } from "../../utils/auth";
import { parseUTC } from "../../utils/timezone";
import DualTime from "../../components/ui/DualTime";
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MessageSquare,
  Cpu,
  Briefcase,
  CheckCircle2,
  XCircle,
  Play,
  Star,
  Search,
  X,
  Eye,
  BarChart3,
} from "lucide-react";

function typeMeta(type) {
  switch (type) {
    case "ai_video":
      return { icon: Cpu, label: "AI video" };
    case "human_video":
    case "video":
      return { icon: Video, label: "Video" };
    case "phone":
      return { icon: Phone, label: "Phone" };
    case "text":
      return { icon: MessageSquare, label: "Text" };
    case "in-person":
      return { icon: Briefcase, label: "On-site" };
    default:
      return { icon: Calendar, label: type ? type.replace(/_/g, " ") : "Interview" };
  }
}

function canJoin(iv) {
  const at = iv.scheduled_at_iso || iv.scheduled_at;
  if (!at) return false;
  const diff = (parseUTC(at) - new Date()) / 60000;
  return diff <= 0 && diff >= -(iv.duration_minutes || 60);
}

function joinLabel(iv) {
  const at = iv.scheduled_at_iso || iv.scheduled_at;
  if (!at) return "Unknown";
  const diff = (parseUTC(at) - new Date()) / 60000;
  if (diff > 15) return "Scheduled";
  if (diff > 0) return `Starts in ${Math.ceil(diff)}m`;
  if (diff >= -(iv.duration_minutes || 60)) return "Join now";
  return "Ended";
}

function statusChip(iv) {
  if (iv.status === "completed" || iv.final_decision === "passed")
    return (
      <span className="rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-text dark:border-brand/30 dark:bg-brand/15">
        Completed
      </span>
    );
  if (iv.status === "cancelled" || iv.final_decision === "rejected")
    return (
      <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
        Cancelled
      </span>
    );
  if (canJoin(iv))
    return (
      <span className="animate-pulse rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-s5">
        Join now
      </span>
    );
  return (
    <span className="rounded-full border border-line bg-gray-50 px-2.5 py-0.5 text-[11px] font-semibold text-secondary dark:border-gray-800 dark:bg-gray-25 dark:text-gray-600">
      Scheduled
    </span>
  );
}

export default function Interviews() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "history" ? "history" : "scheduled";
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
    <AppShell>
      <CenterBar
        title="Interviews"
        subtitle={`${upcoming.length} scheduled · ${history.length} in history`}
      />
      <div className="w-full max-w-4xl mx-auto px-4 pb-12 pt-2 space-y-4">
        {/* Internal tabs with sliding indicator */}
        <AnimatedTabBar
          id="interviews-scheduled-history"
          className="w-full"
          tabs={[
            { id: "scheduled", label: `Scheduled (${upcoming.length})`, icon: Calendar },
            { id: "history", label: `History (${history.length})`, icon: Clock },
          ]}
          active={tab}
          onChange={setTab}
        />

        {/* Filter input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/60 h-4 w-4" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Filter by title, organization, position…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-9 text-xs text-ink outline-none transition-colors placeholder:text-secondary/50 focus:border-brand focus:ring-2 focus:ring-brand/20 dark:bg-gray-25/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-canvas rounded-lg text-secondary transition-colors"
              aria-label="Clear filter"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="rounded-xl border border-line bg-surface p-10 text-center shadow-s5 dark:bg-gray-25/50">
            <MenteeLoader size={52} text="Loading interviews…" />
          </div>
        ) : tab === "scheduled" ? (
          scheduledList.length === 0 ? (
            <div className="rounded-xl border border-line bg-surface p-12 text-center shadow-s5 dark:bg-gray-25/50">
              <div className="h-12 w-12 rounded-xl bg-canvas border border-line flex items-center justify-center mx-auto mb-3 dark:bg-gray-25">
                <Calendar className="h-6 w-6 text-secondary/60" strokeWidth={1.75} />
              </div>
              <p className="text-sm font-semibold text-ink">No scheduled interviews</p>
              <p className="text-xs text-secondary mt-1">Once an organization schedules you, it appears here.</p>
            </div>
          ) : (
            scheduledList.map((iv) => {
              const meta = typeMeta(iv.interview_type);
              const TypeIcon = meta.icon;
              const joinable = canJoin(iv);
              return (
                <div
                  key={iv.id}
                  className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-s5 transition-all hover:border-brand/40 dark:bg-gray-25/60 dark:hover:border-brand/50"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-canvas border border-line flex items-center justify-center shrink-0 dark:bg-gray-25">
                      <TypeIcon className="h-4 w-4 text-secondary" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-ink leading-snug truncate">{iv.title}</h3>
                        {iv.current_round && (
                          <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white shadow-s5 font-mono">
                            Round {iv.current_round}
                          </span>
                        )}
                        {statusChip(iv)}
                      </div>
                      <p className="text-xs text-secondary truncate mt-1">
                        {iv.organization || "Unknown organization"} · {iv.scheduled_at ? (
                          <DualTime
                            value={iv.scheduled_at_iso || iv.scheduled_at}
                            otherTimezone={iv.organization_timezone}
                            otherLabel={iv.organization}
                            variant="compact"
                          />
                        ) : (
                          "Unscheduled"
                        )}
                      </p>
                      {iv.post_title && (
                        <p className="text-xs text-brand-text font-medium truncate mt-0.5">{iv.post_title}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3 border-t border-line">
                    {joinable ? (
                      <button
                        onClick={() => navigate(`/in/interview/${iv.id}`)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-s5 hover:bg-brand/90 transition-colors animate-pulse"
                      >
                        <Play className="h-3.5 w-3.5" strokeWidth={1.75} />
                        <span>{joinLabel(iv)}</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-canvas border border-line text-secondary text-xs font-medium rounded-xl dark:bg-gray-25">
                        <Clock className="h-3.5 w-3.5 text-secondary/70" strokeWidth={1.75} />
                        <span>{joinLabel(iv)}</span>
                      </span>
                    )}
                    <button
                      onClick={() => navigate(`/in/interviews/${iv.id}`)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink shadow-s5 hover:bg-gray-100 dark:hover:bg-gray-25 dark:bg-gray-25/50 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-secondary" strokeWidth={1.75} />
                      <span>Prepare</span>
                    </button>
                  </div>
                </div>
              );
            })
          )
        ) : historyList.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-12 text-center shadow-s5 dark:bg-gray-25/50">
            <div className="h-12 w-12 rounded-xl bg-canvas border border-line flex items-center justify-center mx-auto mb-3 dark:bg-gray-25">
              <Clock className="h-6 w-6 text-secondary/60" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-ink">No interview history</p>
            <p className="text-xs text-secondary mt-1">Completed interviews will appear here.</p>
          </div>
        ) : (
          historyList.map((iv) => {
            const passed = iv.final_decision === "passed" || iv.status === "completed";
            return (
              <div
                key={iv.id}
                className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-s5 transition-all hover:border-brand/40 dark:bg-gray-25/60 dark:hover:border-brand/50"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${
                      passed
                        ? "border-brand/20 bg-brand/10 dark:border-brand/30 dark:bg-brand/15"
                        : iv.status === "cancelled" || iv.final_decision === "rejected"
                        ? "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"
                        : "border-line bg-canvas dark:bg-gray-25"
                    }`}
                  >
                    {passed ? (
                      <CheckCircle2 className="h-4 w-4 text-brand-text" strokeWidth={1.75} />
                    ) : iv.status === "cancelled" || iv.final_decision === "rejected" ? (
                      <XCircle className="h-4 w-4 text-red-500" strokeWidth={1.75} />
                    ) : (
                      <Clock className="h-4 w-4 text-secondary" strokeWidth={1.75} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-ink leading-snug truncate">{iv.title}</h3>
                      {statusChip(iv)}
                    </div>
                    <p className="text-xs text-secondary truncate mt-1">
                      {iv.organization || "Unknown organization"} · {iv.scheduled_at ? (
                        <DualTime
                          value={iv.scheduled_at_iso || iv.scheduled_at}
                          otherTimezone={iv.organization_timezone}
                          otherLabel={iv.organization}
                          variant="compact"
                        />
                      ) : (
                        ""
                      )}
                    </p>
                    {iv.rating ? (
                      <p className="flex items-center gap-1 mt-1.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s <= iv.rating ? "fill-amber-500 text-amber-500" : "text-gray-300 dark:text-gray-600"
                            }`}
                            strokeWidth={1.75}
                          />
                        ))}
                        <span className="text-xs font-mono text-secondary ml-1">{iv.rating}/5</span>
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3 border-t border-line">
                  <button
                    onClick={() => navigate(`/in/interviews/${iv.id}`)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink shadow-s5 hover:bg-gray-100 dark:hover:bg-gray-25 dark:bg-gray-25/50 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5 text-secondary" strokeWidth={1.75} />
                    <span>Details</span>
                  </button>
                  {(iv.status === "completed" || iv.rating) && (
                    <button
                      onClick={() => navigate(`/in/interviews/${iv.id}/analysis`)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-brand/30 bg-surface px-3 py-1.5 text-xs font-medium text-brand-text shadow-s5 hover:bg-brand/10 dark:bg-gray-25/50 transition-colors"
                    >
                      <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      <span>Analysis</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </AppShell>
  );
}

import React from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Calendar, Eye, Video, CheckCircle } from "lucide-react";
import { getUploadUrl } from "../../utils/auth";
import EmploymentBadge from "../ui/EmploymentStatus";

const STATUS_META = {
  pending: {
    label: "Pending",
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  },
  reviewed: {
    label: "Reviewed",
    color: "bg-gray-50 text-gray-600 border-line dark:bg-gray-25 dark:border-line dark:text-gray-700",
  },
  accepted: {
    label: "Accepted",
    color: "bg-brand/10 text-brand-text border-brand/20",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  },
};

function metaFor(status) {
  return (
    STATUS_META[status] || {
      label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown",
      color: "bg-gray-50 text-gray-600 border-line dark:bg-gray-25 dark:border-line dark:text-gray-700",
    }
  );
}

/**
 * Compact applicant card for the organization dashboard and candidates panel.
 * Denser sibling of the Candidates directory card: identity + post + time,
 * status chip, cover-letter preview, and inline review actions.
 */
export default function ApplicantCard({
  application,
  timeLabel,
  scheduled,
  onStatusChange,
  onSchedule,
  onViewProfile,
}) {
  const navigate = useNavigate();
  const meta = metaFor(application.status);
  const name = application.user?.name || "Anonymous";
  const photo = application.user?.profile_picture
    ? getUploadUrl(application.user.profile_picture)
    : null;

  return (
    <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-3.5 shadow-s5 transition-all hover:border-brand/40">
      <div className="flex gap-3">
        <div className="relative hidden h-10 w-10 shrink-0 sm:block">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-xs font-bold text-white dark:bg-gray-25">
            {name.charAt(0).toUpperCase()}
          </div>
          {photo && (
            <img
              src={photo}
              alt={name}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              className="absolute inset-0 h-10 w-10 rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-1.5">
            <div className="min-w-0">
              <h3 className="truncate text-[13px] font-semibold leading-tight text-ink">{name}</h3>
              {application.user?.headline && (
                <p className="mt-0.5 truncate text-[11.5px] font-medium text-gray-500 dark:text-gray-500">
                  {application.user.headline}
                </p>
              )}
              <div className="mt-1">
                <EmploymentBadge
                  status={application.user?.employment_status}
                  className="!px-1.5 !py-px !text-[10px]"
                />
              </div>
              <p className="mt-1 flex items-center gap-1.5 truncate text-[11.5px] font-medium text-brand-text">
                <Briefcase className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{application.post?.title || "Unknown role"}</span>
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 font-mono tabular-nums text-[11px] text-gray-500 dark:text-gray-500">
                <Calendar className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                <span>{timeLabel}</span>
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}
            >
              {meta.label}
            </span>
          </div>
          {application.cover_letter && (
            <p className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed text-gray-600 dark:text-gray-500">
              {application.cover_letter}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line dark:border-line pt-3">
        <select
          value={application.status}
          onChange={(e) => onStatusChange(application.id, e.target.value)}
          aria-label={`Status for ${name}`}
          className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-900/60 px-2.5 py-1.5 text-[11px] font-medium text-ink transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        >
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
        {scheduled ? (
          <button
            type="button"
            onClick={() => navigate("/org/interviews")}
            title="Interview already scheduled — view interviews"
            className="inline-flex items-center gap-1.5 rounded-xl border border-brand/20 bg-brand/10 px-2.5 py-1.5 text-[11px] font-semibold text-brand-text transition-colors hover:bg-brand/20"
          >
            <CheckCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Scheduled</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSchedule(application)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-brand bg-brand px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-s5 transition-colors hover:bg-brand/90 active:bg-brand/80"
          >
            <Video className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Schedule</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onViewProfile(application.user_id)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-900/60 px-2.5 py-1.5 text-[11px] font-medium text-ink transition-colors hover:bg-gray-50 dark:hover:bg-gray-25"
        >
          <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span>View</span>
        </button>
      </div>
    </div>
  );
}

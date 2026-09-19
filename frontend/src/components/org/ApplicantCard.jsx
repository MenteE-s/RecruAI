import React from "react";
import { FiBriefcase, FiCalendar, FiEye, FiVideo } from "react-icons/fi";

const STATUS_META = {
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" },
  reviewed: { label: "Reviewed", color: "bg-blue-50 text-blue-700 border-blue-200" },
  accepted: { label: "Accepted", color: "bg-green-50 text-green-700 border-green-200" },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200" },
};

function metaFor(status) {
  return STATUS_META[status] || { label: status || "Unknown", color: "bg-gray-50 text-gray-600 border-gray-200" };
}

/**
 * Compact applicant row for the organization dashboard stream.
 * Denser sibling of the Candidates page card: identity + post + time,
 * status chip, cover-letter preview, and inline review actions.
 */
export default function ApplicantCard({ application, timeLabel, onStatusChange, onSchedule, onViewProfile }) {
  const meta = metaFor(application.status);
  const name = application.user?.name || "Anonymous";
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 hover:shadow transition-all">
      <div className="p-3">
        <div className="flex gap-2.5">
          <div className="hidden sm:flex w-9 h-9 rounded-lg bg-gray-900 text-white items-center justify-center text-xs font-bold shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-1.5">
              <div className="min-w-0">
                <h3 className="text-[13px] font-semibold text-gray-900 leading-tight truncate">{name}</h3>
                <p className="text-[11px] text-blue-600 flex items-center gap-1 mt-px truncate">
                  <FiBriefcase className="w-3 h-3 shrink-0" />
                  <span className="truncate">{application.post?.title || "Unknown role"}</span>
                </p>
                <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-px">
                  <FiCalendar className="w-3 h-3 shrink-0" /> {timeLabel}
                </p>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold border rounded-full shrink-0 ${meta.color}`}>
                {meta.label}
              </span>
            </div>
            {application.cover_letter && (
              <p className="text-[11px] text-gray-500 mt-1.5 leading-snug line-clamp-2">{application.cover_letter}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-gray-100">
          <select
            value={application.status}
            onChange={(e) => onStatusChange(application.id, e.target.value)}
            aria-label={`Status for ${name}`}
            className="px-2 py-1.5 bg-gray-50 border border-gray-200 text-[11px] font-medium text-gray-700 focus:outline-none focus:border-blue-500 focus:bg-white rounded-md"
          >
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={() => onSchedule(application)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700 rounded-md"
          >
            <FiVideo className="w-3 h-3" /> Schedule
          </button>
          <button
            onClick={() => onViewProfile(application.user_id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 text-gray-600 text-[11px] font-medium hover:bg-gray-50 rounded-md"
          >
            <FiEye className="w-3 h-3" /> View
          </button>
        </div>
      </div>
    </div>
  );
}

import { FiCheckCircle, FiVideo } from "react-icons/fi";
import { timeAgo, getStatusMeta } from "./peopleMeta";

/**
 * One applicant in the side panel: identity + status chip on top,
 * review controls (status select / schedule / onboard) underneath.
 */
export default function ApplicantActionRow({ app, scheduled, onOpenProfile, onStatusChange, onSchedule, onToggleOnboard }) {
  const meta = getStatusMeta(app.status);
  const name = app.user?.name || "Anonymous";
  const dot = app.status === "accepted" ? "bg-green-500" : app.status === "rejected" ? "bg-red-500" : app.status === "reviewed" ? "bg-blue-500" : "bg-amber-500";
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <button onClick={onOpenProfile} className="w-full flex items-center gap-2 text-left group">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-blue-700 leading-tight">{name}</p>
          <p className="text-[11px] text-gray-400 truncate mt-px">{app.post?.title || "—"} · {timeAgo(app.applied_at)}</p>
        </div>
        <span className={`shrink-0 text-[10px] font-semibold border px-1.5 py-px rounded-full ${meta.color}`}>{meta.label}</span>
      </button>
      <div className="flex gap-1.5 mt-1.5">
        <select
          value={app.status}
          onChange={(e) => onStatusChange(app.id, e.target.value)}
          aria-label={`Status for ${name}`}
          className="flex-1 min-w-0 px-1.5 py-1 bg-gray-50 border border-gray-200 text-[11px] font-medium rounded-md focus:outline-none focus:border-blue-500"
        >
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          onClick={onSchedule}
          disabled={scheduled}
          title={scheduled ? "Interview already scheduled" : "Schedule interview"}
          className={`p-1.5 rounded-md shrink-0 ${scheduled ? "bg-green-50 text-green-700 border border-green-200 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
        >
          {scheduled ? <FiCheckCircle className="w-3.5 h-3.5" /> : <FiVideo className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onToggleOnboard}
          title={app.onboarded ? "Offboard" : "Mark as onboarded"}
          className={`px-2 py-1 text-[11px] font-semibold rounded-md border shrink-0 ${app.onboarded ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"}`}
        >
          {app.onboarded ? "Hired ✓" : "Onboard"}
        </button>
      </div>
    </div>
  );
}

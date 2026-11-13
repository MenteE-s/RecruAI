import { FiCheckCircle, FiVideo } from "react-icons/fi";
import { timeAgo, getStatusMeta } from "./peopleMeta";
import { Button } from "../ui/Button";

/**
 * One applicant in the side panel: identity + status chip on top,
 * review controls (status select / schedule / onboard) underneath.
 */
export default function ApplicantActionRow({ app, scheduled, onOpenProfile, onStatusChange, onSchedule, onToggleOnboard }) {
  const meta = getStatusMeta(app.status);
  const name = app.user?.name || "Anonymous";
  return (
    <div className="border-b border-line py-2 last:border-0">
      <button onClick={onOpenProfile} className="group flex w-full items-center gap-2 text-left">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold leading-tight text-ink group-hover:text-brand-text">{name}</p>
          <p className="mt-px truncate text-[11px] text-gray-500">{app.post?.title || "—"} · {timeAgo(app.applied_at)}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-1.5 py-px text-[10px] font-semibold ${meta.color}`}>{meta.label}</span>
      </button>
      <div className="mt-1.5 flex gap-1.5">
        <select
          value={app.status}
          onChange={(e) => onStatusChange(app.id, e.target.value)}
          aria-label={`Status for ${name}`}
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-1.5 py-1 text-[11px] font-medium text-ink outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-gray-100/50 dark:focus:ring-gray-600/50"
        >
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
        <Button
          variant={scheduled ? "quiet" : "primary"}
          size="sm"
          className="px-2"
          onClick={onSchedule}
          disabled={scheduled}
          title={scheduled ? "Interview already scheduled" : "Schedule interview"}
          aria-label={scheduled ? "Interview already scheduled" : "Schedule interview"}
        >
          {scheduled ? <FiCheckCircle className="h-3.5 w-3.5" /> : <FiVideo className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant={app.onboarded ? "danger" : "secondary"}
          size="sm"
          className="border px-2"
          onClick={onToggleOnboard}
          title={app.onboarded ? "Offboard" : "Mark as onboarded"}
        >
          {app.onboarded ? "Hired" : "Onboard"}
        </Button>
      </div>
    </div>
  );
}

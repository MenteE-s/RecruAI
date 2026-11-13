import { FiCalendar, FiCheckCircle, FiLayers, FiPlus, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Button, ButtonLink } from "../ui/Button";
import ApplicantActionRow from "./ApplicantActionRow";

/**
 * Side rail for the People page: applicant quick-actions (status / schedule /
 * onboard), recently accepted, and the hiring CTA card.
 */
export default function ApplicantsPanel({ recentApps, acceptedApps, scheduledSet, onOpenProfile, onStatusChange, onSchedule, onToggleOnboard }) {
  const navigate = useNavigate();
  return (
    <aside className="space-y-3">
      <div className="rounded-xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-ink">Applicants · quick actions</h3>
          <FiCalendar className="h-3.5 w-3.5 text-gray-500" />
        </div>
        <div className="mt-1.5">
          {recentApps.length === 0 && (
            <p className="py-2 text-center text-[11px] text-gray-500">No applications yet.</p>
          )}
          {recentApps.map((app) => (
            <ApplicantActionRow
              key={`recent-${app.id}`}
              app={app}
              scheduled={scheduledSet.has(`${app.user_id}:${app.post_id}`)}
              onOpenProfile={() => onOpenProfile(app.user_id)}
              onStatusChange={onStatusChange}
              onSchedule={() => onSchedule(app)}
              onToggleOnboard={() => onToggleOnboard(app.id, app.onboarded)}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-3">
        <h3 className="text-xs font-bold text-ink">Recently accepted</h3>
        {acceptedApps.length === 0 ? (
          <p className="py-2 text-center text-[11px] text-gray-500">No acceptances yet.</p>
        ) : (
          <div className="mt-1 divide-y divide-line">
            {acceptedApps.map((app) => (
              <button key={`acc-${app.id}`} onClick={() => onOpenProfile(app.user_id)} className="group flex w-full items-center gap-2 py-2 text-left">
                <FiCheckCircle className="h-3.5 w-3.5 shrink-0 text-brand-text" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold leading-tight text-ink group-hover:text-brand-text">{app.user?.name || "Anonymous"}</p>
                  <p className="mt-px truncate text-[11px] text-gray-500">{app.post?.title || "—"}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h3 className="text-sm font-semibold text-ink">Hire faster</h3>
        <p className="mt-1 text-[11px] leading-snug text-gray-500">Source talent, open roles, and move people through your pipeline.</p>
        <div className="mt-3 space-y-1.5">
          <Button variant="secondary" className="w-full" onClick={() => navigate("/org/hire")}>
            <FiSearch className="h-3.5 w-3.5" /> AI talent search
          </Button>
          <Button variant="primary" className="w-full" onClick={() => navigate("/org/jobs")}>
            <FiPlus className="h-3.5 w-3.5" /> New job post
          </Button>
          <ButtonLink to="/org/pipeline" variant="ghost" className="w-full">
            <FiLayers className="h-3.5 w-3.5" /> Open pipeline
          </ButtonLink>
        </div>
      </div>
    </aside>
  );
}

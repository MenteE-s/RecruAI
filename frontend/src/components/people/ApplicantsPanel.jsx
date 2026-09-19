import { FiCalendar, FiCheckCircle, FiLayers, FiPlus, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import ApplicantActionRow from "./ApplicantActionRow";

/**
 * Side rail for the People page: applicant quick-actions (status / schedule /
 * onboard), recently accepted, and the hiring CTA card.
 */
export default function ApplicantsPanel({ recentApps, acceptedApps, scheduledSet, onOpenProfile, onStatusChange, onSchedule, onToggleOnboard }) {
  const navigate = useNavigate();
  return (
    <aside className="space-y-3">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-900">Applicants · quick actions</h3>
          <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
        </div>
        <div className="mt-1.5">
          {recentApps.length === 0 && (
            <p className="text-[11px] text-gray-400 py-2 text-center">No applications yet.</p>
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

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3">
        <h3 className="text-xs font-bold text-gray-900">Recently accepted</h3>
        {acceptedApps.length === 0 ? (
          <p className="text-[11px] text-gray-400 py-2 text-center">No acceptances yet.</p>
        ) : (
          <div className="mt-1 divide-y divide-gray-100">
            {acceptedApps.map((app) => (
              <button key={`acc-${app.id}`} onClick={() => onOpenProfile(app.user_id)} className="w-full flex items-center gap-2 py-2 text-left group">
                <FiCheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-blue-700 leading-tight">{app.user?.name || "Anonymous"}</p>
                  <p className="text-[11px] text-gray-400 truncate mt-px">{app.post?.title || "—"}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-900 text-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-bold">Hire faster</h3>
        <p className="text-[11px] text-gray-400 mt-1 leading-snug">Source talent, open roles, and move people through your pipeline.</p>
        <div className="mt-3 space-y-1.5">
          <button onClick={() => navigate("/organization/hire")} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-100 rounded-md">
            <FiSearch className="w-3.5 h-3.5" /> AI talent search
          </button>
          <button onClick={() => navigate("/organization/jobs")} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 rounded-md">
            <FiPlus className="w-3.5 h-3.5" /> New job post
          </button>
          <button onClick={() => navigate("/organization/pipeline")} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 border border-white/15 text-white text-xs font-semibold hover:bg-white/15 rounded-md">
            <FiLayers className="w-3.5 h-3.5" /> Open pipeline
          </button>
        </div>
      </div>
    </aside>
  );
}

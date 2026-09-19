import { FiEye } from "react-icons/fi";
import { getUploadUrl } from "../../utils/auth";
import EmploymentBadge from "../ui/EmploymentStatus";

/**
 * Square person card used in the starred strip and the talent directory.
 * `footer` is rendered below the badge (star button, view button, etc.).
 */
export default function PersonCard({ person, onView, footer }) {
  const name = person.name || "Unnamed";
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 text-center hover:border-blue-200 hover:shadow-sm transition-all">
      <div className="relative w-14 h-14 mx-auto">
        <div className="absolute inset-0 rounded-xl bg-gray-900 text-white flex items-center justify-center text-lg font-bold">
          {name.charAt(0).toUpperCase()}
        </div>
        {person.profile_picture && (
          <img
            src={getUploadUrl(person.profile_picture)}
            alt={name}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            className="absolute inset-0 w-14 h-14 rounded-xl object-cover border border-gray-200 bg-white"
          />
        )}
      </div>
      <p className="text-[13px] font-semibold text-gray-900 mt-2 leading-tight truncate">{name}</p>
      {person.headline && <p className="text-[11px] text-gray-500 truncate mt-px font-medium">{person.headline}</p>}
      <div className="mt-1.5 flex justify-center">
        <EmploymentBadge status={person.employment_status} className="!px-1.5 !py-px !text-[10px]" />
      </div>
      {onView && (
        <button
          onClick={onView}
          className="mt-2 w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded-md"
        >
          <FiEye className="w-3 h-3" /> View profile
        </button>
      )}
      {footer}
    </div>
  );
}

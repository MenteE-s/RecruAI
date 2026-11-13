import { Eye } from "lucide-react";
import { getUploadUrl } from "../../utils/auth";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import EmploymentBadge from "../ui/EmploymentStatus";

/**
 * Square person card used in the starred strip and the talent directory.
 * `footer` is rendered below the badge (star button, view button, etc.).
 */
export default function PersonCard({ person, onView, footer }) {
  const name = person.name || "Unnamed";
  return (
    <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-3.5 text-center shadow-s5 transition-all duration-150 hover:border-brand/35 dark:hover:border-line hover:shadow-s10 hover:-translate-y-0.5">
      <div className="relative mx-auto h-14 w-14">
        {person.profile_picture ? (
          <img
            src={getUploadUrl(person.profile_picture)}
            alt={name}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            className="absolute inset-0 h-14 w-14 rounded-xl border border-line dark:border-line object-cover bg-surface dark:bg-gray-25"
          />
        ) : (
          <Avatar name={name} size="2xl" rounded="xl" className="absolute inset-0 h-14 w-14" />
        )}
      </div>
      <p className="mt-2.5 truncate text-[13px] font-semibold leading-snug text-ink">{name}</p>
      {person.headline && (
        <p className="mt-1 truncate text-[11px] font-medium leading-relaxed text-gray-500 dark:text-gray-600">
          {person.headline}
        </p>
      )}
      <div className="mt-2.5 flex justify-center">
        <EmploymentBadge status={person.employment_status} className="!px-2 !py-0.5 !text-[10px]" />
      </div>
      {onView && (
        <Button variant="secondary" size="sm" className="mt-2.5 w-full shadow-s5 text-xs" onClick={onView}>
          <Eye className="h-3.5 w-3.5 shrink-0 stroke-[1.75]" /> View profile
        </Button>
      )}
      {footer && <div className="mt-2.5 w-full">{footer}</div>}
    </div>
  );
}

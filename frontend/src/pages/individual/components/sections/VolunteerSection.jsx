import { FiHeart, FiEdit2, FiTrash2 } from "react-icons/fi";
import { ProfileSection as Card } from "../../../../components/profile/ProfileSection";
import SectionHeader from "../SectionHeader";

export default function VolunteerSection({ volunteerExperiences, onAdd, onEdit, onRemove }) {
  return (
    <Card>
      <SectionHeader icon={<FiHeart size={18} />} title="Volunteer Experience" onAdd={onAdd} />
      {(volunteerExperiences || []).length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No volunteer experience added yet</p>
      ) : (
        <div className="space-y-4">
          {(volunteerExperiences || []).map((vol, index) => (
            <div key={vol.id || index} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-25 transition-colors">
              <div className="flex-1">
                <h4 className="font-medium text-ink">{vol.role}</h4>
                <p className="text-sm text-gray-600">{vol.organization}</p>
                {vol.location && <p className="text-xs text-gray-500">{vol.location}</p>}
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => onEdit("volunteerExperiences", vol, index)} className="text-gray-500 hover:text-brand-text transition-colors"><FiEdit2 size={14} /></button>
                <button onClick={() => onRemove("volunteerExperiences", index)} className="text-gray-500 hover:text-red-600 transition-colors"><FiTrash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

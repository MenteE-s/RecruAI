import { FiBriefcase, FiMapPin, FiEdit2, FiTrash2 } from "react-icons/fi";
import Card from "../../../../components/ui/Card";
import SectionHeader from "../SectionHeader";
import { formatDate } from "../utils";

export default function ExperienceSection({ experiences, onAdd, onEdit, onRemove }) {
  return (
    <Card>
      <SectionHeader
        icon={<FiBriefcase size={18} />}
        title="Experience"
        onAdd={onAdd}
      />
      {(experiences || []).length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No experience added yet</p>
      ) : (
        <div className="space-y-4">
          {(experiences || []).map((exp, index) => (
            <div key={exp.id || index} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{exp.title}</h4>
                <p className="text-sm text-gray-600">{exp.company}</p>
                {exp.location && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <FiMapPin size={12} /> {exp.location}
                  </p>
                )}
                {exp.start_date && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(exp.start_date, "full")} -{" "}
                    {exp.end_date ? formatDate(exp.end_date, "full") : "Present"}
                  </p>
                )}
                {exp.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{exp.description}</p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => onEdit("experiences", exp, index)} className="text-gray-400 hover:text-blue-600 transition-colors">
                  <FiEdit2 size={14} />
                </button>
                <button onClick={() => onRemove("experiences", index)} className="text-gray-400 hover:text-red-600 transition-colors">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

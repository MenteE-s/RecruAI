import { FiBook, FiEdit2, FiTrash2 } from "react-icons/fi";
import Card from "../../../../components/ui/Card";
import SectionHeader from "../SectionHeader";
import { formatDate } from "../utils";

export default function EducationSection({ educations, onAdd, onEdit, onRemove }) {
  return (
    <Card>
      <SectionHeader
        icon={<FiBook size={18} />}
        title="Education"
        onAdd={onAdd}
      />
      {(educations || []).length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No education added yet</p>
      ) : (
        <div className="space-y-4">
          {(educations || []).map((edu, index) => (
            <div key={edu.id || index} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                <p className="text-sm text-gray-600">{edu.school}</p>
                {edu.field && <p className="text-xs text-gray-500">{edu.field}</p>}
                {(edu.start_date || edu.end_date) && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {edu.start_date && formatDate(edu.start_date, "full")} -{" "}
                    {edu.end_date ? formatDate(edu.end_date, "full") : "Present"}
                  </p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => onEdit("educations", edu, index)} className="text-gray-400 hover:text-blue-600 transition-colors">
                  <FiEdit2 size={14} />
                </button>
                <button onClick={() => onRemove("educations", index)} className="text-gray-400 hover:text-red-600 transition-colors">
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

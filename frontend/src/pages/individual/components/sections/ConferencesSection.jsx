import { FiUsers, FiEdit2, FiTrash2 } from "react-icons/fi";
import Card from "../../../../components/ui/Card";
import SectionHeader from "../SectionHeader";
import { formatDate } from "../utils";

export default function ConferencesSection({ conferences, onAdd, onEdit, onRemove }) {
  return (
    <Card>
      <SectionHeader icon={<FiUsers size={18} />} title="Conferences" onAdd={onAdd} />
      {(conferences || []).length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No conferences added yet</p>
      ) : (
        <div className="space-y-4">
          {(conferences || []).map((conference, index) => (
            <div key={conference.id || index} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{conference.name}</h4>
                <p className="text-sm text-gray-600">Role: {conference.role}</p>
                <p className="text-xs text-gray-500">
                  {conference.location}
                  {conference.date && ` - ${formatDate(conference.date)}`}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => onEdit("conferences", conference, index)} className="text-gray-400 hover:text-blue-600 transition-colors"><FiEdit2 size={14} /></button>
                <button onClick={() => onRemove("conferences", index)} className="text-gray-400 hover:text-red-600 transition-colors"><FiTrash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

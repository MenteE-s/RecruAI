import { FiUsers, FiEdit2, FiTrash2 } from "react-icons/fi";
import Card from "../../../../components/ui/Card";
import SectionHeader from "../SectionHeader";
import { formatDate } from "../utils";

export default function SpeakingSection({ speakingEngagements, onAdd, onEdit, onRemove }) {
  return (
    <Card>
      <SectionHeader icon={<FiUsers size={18} />} title="Speaking Engagements" onAdd={onAdd} />
      {(speakingEngagements || []).length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No speaking engagements added yet</p>
      ) : (
        <div className="space-y-4">
          {(speakingEngagements || []).map((engagement, index) => (
            <div key={engagement.id || index} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{engagement.title}</h4>
                <p className="text-sm text-gray-600">{engagement.event_name} ({engagement.event_type})</p>
                <p className="text-xs text-gray-500">
                  {engagement.location}
                  {engagement.date && ` - ${formatDate(engagement.date, "full")}`}
                  {engagement.audience_size && ` - Audience: ${engagement.audience_size}`}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => onEdit("speakingEngagements", engagement, index)} className="text-gray-400 hover:text-blue-600 transition-colors"><FiEdit2 size={14} /></button>
                <button onClick={() => onRemove("speakingEngagements", index)} className="text-gray-400 hover:text-red-600 transition-colors"><FiTrash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

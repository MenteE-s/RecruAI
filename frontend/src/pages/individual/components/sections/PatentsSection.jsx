import { FiFileText, FiEdit2, FiTrash2 } from "react-icons/fi";
import Card from "../../../../components/ui/Card";
import SectionHeader from "../SectionHeader";
import { formatDate } from "../utils";

export default function PatentsSection({ patents, onAdd, onEdit, onRemove }) {
  return (
    <Card>
      <SectionHeader icon={<FiFileText size={18} />} title="Patents" onAdd={onAdd} />
      {(patents || []).length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No patents added yet</p>
      ) : (
        <div className="space-y-4">
          {(patents || []).map((patent, index) => (
            <div key={patent.id || index} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{patent.title}</h4>
                {patent.patent_number && <p className="text-sm text-gray-600">Patent #: {patent.patent_number}</p>}
                {(patent.filing_date || patent.grant_date) && (
                  <p className="text-xs text-gray-500">
                    {patent.filing_date && `Filed: ${formatDate(patent.filing_date)}`}
                    {patent.grant_date && ` - Granted: ${formatDate(patent.grant_date)}`}
                  </p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => onEdit("patents", patent, index)} className="text-gray-400 hover:text-blue-600 transition-colors"><FiEdit2 size={14} /></button>
                <button onClick={() => onRemove("patents", index)} className="text-gray-400 hover:text-red-600 transition-colors"><FiTrash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

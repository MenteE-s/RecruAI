import { FiFileText, FiEdit2, FiTrash2 } from "react-icons/fi";
import Card from "../../../../components/ui/Card";
import SectionHeader from "../SectionHeader";

export default function PublicationsSection({ publications, onAdd, onEdit, onRemove }) {
  return (
    <Card>
      <SectionHeader icon={<FiFileText size={18} />} title="Publications" onAdd={onAdd} />
      {(publications || []).length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No publications added yet</p>
      ) : (
        <div className="space-y-4">
          {(publications || []).map((pub, index) => (
            <div key={pub.id || index} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{pub.title}</h4>
                <p className="text-sm text-gray-600">{pub.journal} {pub.year && `(${pub.year})`}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => onEdit("publications", pub, index)} className="text-gray-400 hover:text-blue-600 transition-colors"><FiEdit2 size={14} /></button>
                <button onClick={() => onRemove("publications", index)} className="text-gray-400 hover:text-red-600 transition-colors"><FiTrash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

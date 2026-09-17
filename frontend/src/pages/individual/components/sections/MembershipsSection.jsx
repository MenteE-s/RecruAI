import { FiBriefcase, FiEdit2, FiTrash2 } from "react-icons/fi";
import Card from "../../../../components/ui/Card";
import SectionHeader from "../SectionHeader";
import { formatDate } from "../utils";

export default function MembershipsSection({ professionalMemberships, onAdd, onEdit, onRemove }) {
  return (
    <Card>
      <SectionHeader icon={<FiBriefcase size={18} />} title="Professional Memberships" onAdd={onAdd} />
      {(professionalMemberships || []).length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No professional memberships added yet</p>
      ) : (
        <div className="space-y-4">
          {(professionalMemberships || []).map((membership, index) => (
            <div key={membership.id || index} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{membership.organization}</h4>
                {membership.membership_id && <p className="text-sm text-gray-600">ID: {membership.membership_id}</p>}
                {(membership.start_date || membership.end_date) && (
                  <p className="text-xs text-gray-500">
                    {membership.start_date && `From: ${formatDate(membership.start_date)}`}
                    {membership.end_date && ` - To: ${formatDate(membership.end_date)}`}
                  </p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => onEdit("professionalMemberships", membership, index)} className="text-gray-400 hover:text-blue-600 transition-colors"><FiEdit2 size={14} /></button>
                <button onClick={() => onRemove("professionalMemberships", index)} className="text-gray-400 hover:text-red-600 transition-colors"><FiTrash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

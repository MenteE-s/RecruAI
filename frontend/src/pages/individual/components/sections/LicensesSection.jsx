import { FiCheck, FiEdit2, FiTrash2 } from "react-icons/fi";
import Card from "../../../../components/ui/Card";
import SectionHeader from "../SectionHeader";
import { formatDate } from "../utils";

export default function LicensesSection({ licenses, onAdd, onEdit, onRemove }) {
  return (
    <Card>
      <SectionHeader icon={<FiCheck size={18} />} title="Licenses" onAdd={onAdd} />
      {(licenses || []).length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No licenses added yet</p>
      ) : (
        <div className="space-y-4">
          {(licenses || []).map((license, index) => (
            <div key={license.id || index} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{license.name}</h4>
                <p className="text-sm text-gray-600">{license.issuing_authority}</p>
                {license.license_number && <p className="text-xs text-gray-500">License #: {license.license_number}</p>}
                {(license.issue_date || license.expiry_date) && (
                  <p className="text-xs text-gray-500">
                    {license.issue_date && `Issued: ${formatDate(license.issue_date)}`}
                    {license.expiry_date && ` - Expires: ${formatDate(license.expiry_date)}`}
                    {license.is_active && " (Active)"}
                  </p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => onEdit("licenses", license, index)} className="text-gray-400 hover:text-blue-600 transition-colors"><FiEdit2 size={14} /></button>
                <button onClick={() => onRemove("licenses", index)} className="text-gray-400 hover:text-red-600 transition-colors"><FiTrash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

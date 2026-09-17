import { FiCheck, FiEdit2, FiTrash2 } from "react-icons/fi";
import Card from "../../../../components/ui/Card";
import SectionHeader from "../SectionHeader";
import { formatDate } from "../utils";

export default function CertificationsSection({ certifications, onAdd, onEdit, onRemove }) {
  return (
    <Card>
      <SectionHeader icon={<FiCheck size={18} />} title="Certifications" onAdd={onAdd} />
      {(certifications || []).length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No certifications added yet</p>
      ) : (
        <div className="space-y-4">
          {(certifications || []).map((cert, index) => (
            <div key={cert.id || index} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{cert.name}</h4>
                <p className="text-sm text-gray-600">{cert.issuer}</p>
                {cert.date_obtained && (
                  <p className="text-xs text-gray-500">
                    Obtained: {formatDate(cert.date_obtained)}
                    {cert.expiry_date && ` - Expires: ${formatDate(cert.expiry_date)}`}
                  </p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => onEdit("certifications", cert, index)} className="text-gray-400 hover:text-blue-600 transition-colors"><FiEdit2 size={14} /></button>
                <button onClick={() => onRemove("certifications", index)} className="text-gray-400 hover:text-red-600 transition-colors"><FiTrash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

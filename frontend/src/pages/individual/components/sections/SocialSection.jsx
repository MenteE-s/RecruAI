import { FiLink, FiEdit2, FiTrash2, FiExternalLink } from "react-icons/fi";
import Card from "../../../../components/ui/Card";
import SectionHeader from "../SectionHeader";

export default function SocialSection({ socialMediaLinks, onAdd, onEdit, onRemove }) {
  return (
    <Card>
      <SectionHeader icon={<FiLink size={18} />} title="Social Media Links" onAdd={onAdd} />
      {(socialMediaLinks || []).length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No social media links added yet</p>
      ) : (
        <div className="space-y-4">
          {(socialMediaLinks || []).map((link, index) => (
            <div key={link.id || index} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{link.platform}</h4>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
                  <FiExternalLink size={12} /> {link.url}
                </a>
                {link.username && <p className="text-xs text-gray-500">@{link.username}</p>}
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => onEdit("socialMediaLinks", link, index)} className="text-gray-400 hover:text-blue-600 transition-colors"><FiEdit2 size={14} /></button>
                <button onClick={() => onRemove("socialMediaLinks", index)} className="text-gray-400 hover:text-red-600 transition-colors"><FiTrash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

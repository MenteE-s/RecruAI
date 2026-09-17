import { FiGlobe, FiX } from "react-icons/fi";
import Card from "../../../../components/ui/Card";
import SectionHeader from "../SectionHeader";

export default function LanguagesSection({ languages, onAdd, onRemove }) {
  return (
    <Card>
      <SectionHeader icon={<FiGlobe size={18} />} title="Languages" onAdd={onAdd} />
      {(languages || []).length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No languages added yet</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(languages || []).map((lang, index) => (
            <span key={lang.id || index} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-green-50 text-green-700 border border-green-200">
              {lang.name} - {lang.proficiency_level}
              <button onClick={() => onRemove("languages", index)} className="ml-2 text-green-400 hover:text-green-600">
                <FiX size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

import { FiCode, FiX } from "react-icons/fi";
import Card from "../../../../components/ui/Card";
import SectionHeader from "../SectionHeader";

export default function HobbiesSection({ hobbyInterests, onAdd, onRemove }) {
  return (
    <Card>
      <SectionHeader icon={<FiCode size={18} />} title="Hobby Interests" onAdd={onAdd} />
      {(hobbyInterests || []).length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No hobby interests added yet</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(hobbyInterests || []).map((hobby, index) => (
            <span key={hobby.id || index} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-pink-50 text-pink-700 border border-pink-200">
              {hobby.name}
              <button onClick={() => onRemove("hobbyInterests", index)} className="ml-2 text-pink-400 hover:text-pink-600">
                <FiX size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

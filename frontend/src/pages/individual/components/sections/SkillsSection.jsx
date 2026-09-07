import { FiTarget, FiX } from "react-icons/fi";
import Card from "../../../../components/ui/Card";
import SectionHeader from "../SectionHeader";

export default function SkillsSection({ skills, onAdd, onRemove }) {
  return (
    <Card>
      <SectionHeader
        icon={<FiTarget size={18} />}
        title="Skills"
        onAdd={onAdd}
      />
      {(skills || []).length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No skills added yet</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(skills || []).map((skill, index) => (
            <span
              key={skill.id || index}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200"
            >
              {skill.name}
              <button onClick={() => onRemove("skills", index)} className="ml-2 text-blue-400 hover:text-blue-600">
                <FiX size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

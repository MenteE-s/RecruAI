import { motion, useReducedMotion } from "motion/react";
import { FiTarget, FiX } from "react-icons/fi";
import { ProfileSection as Card } from "../../../../components/profile/ProfileSection";
import SectionHeader from "../SectionHeader";

export default function SkillsSection({ skills, onAdd, onRemove }) {
  const reduce = useReducedMotion();
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
            <motion.span
              key={skill.id || index}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.18, delay: Math.min(index * 0.02, 0.2) }}
              whileHover={reduce ? undefined : { y: -1, borderColor: "rgb(var(--brand) / 0.45)" }}
              className="inline-flex items-center rounded-full border border-line bg-gray-50 px-3 py-1.5 text-sm text-gray-700 transition-colors dark:bg-gray-25 dark:text-gray-200"
            >
              {skill.name}
              <button
                onClick={() => onRemove("skills", index)}
                aria-label={`Remove ${skill.name}`}
                className="ml-2 text-gray-500 transition-colors hover:text-red-600"
              >
                <FiX size={12} />
              </button>
            </motion.span>
          ))}
        </div>
      )}
    </Card>
  );
}

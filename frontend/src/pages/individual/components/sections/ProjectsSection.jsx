import { FiCode, FiEdit2, FiTrash2, FiExternalLink } from "react-icons/fi";
import { ProfileSection as Card } from "../../../../components/profile/ProfileSection";
import SectionHeader from "../SectionHeader";

export default function ProjectsSection({ projects, onAdd, onEdit, onRemove }) {
  return (
    <Card>
      <SectionHeader
        icon={<FiCode size={18} />}
        title="Projects"
        onAdd={onAdd}
      />
      {(projects || []).length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No projects added yet</p>
      ) : (
        <div className="space-y-4">
          {(projects || []).map((project, index) => (
            <div key={project.id || index} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-25 transition-colors">
              <div className="flex-1">
                <h4 className="font-medium text-ink">{project.name}</h4>
                {project.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                )}
                {project.url && (
                  <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-text inline-flex items-center gap-1 mt-1 hover:underline">
                    <FiExternalLink size={12} /> View Project
                  </a>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => onEdit("projects", project, index)} className="text-gray-500 hover:text-brand-text transition-colors">
                  <FiEdit2 size={14} />
                </button>
                <button onClick={() => onRemove("projects", index)} className="text-gray-500 hover:text-red-600 transition-colors">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

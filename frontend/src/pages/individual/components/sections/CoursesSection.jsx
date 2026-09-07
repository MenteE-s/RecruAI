import { FiBook, FiEdit2, FiTrash2 } from "react-icons/fi";
import Card from "../../../../components/ui/Card";
import SectionHeader from "../SectionHeader";
import { formatDate } from "../utils";

export default function CoursesSection({ courseTrainings, onAdd, onEdit, onRemove }) {
  return (
    <Card>
      <SectionHeader icon={<FiBook size={18} />} title="Course Trainings" onAdd={onAdd} />
      {(courseTrainings || []).length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No course trainings added yet</p>
      ) : (
        <div className="space-y-4">
          {(courseTrainings || []).map((course, index) => (
            <div key={course.id || index} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{course.name}</h4>
                {course.provider && <p className="text-sm text-gray-600">{course.provider}</p>}
                {course.completion_date && (
                  <p className="text-xs text-gray-500">Completed: {formatDate(course.completion_date, "full")}</p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => onEdit("courseTrainings", course, index)} className="text-gray-400 hover:text-blue-600 transition-colors"><FiEdit2 size={14} /></button>
                <button onClick={() => onRemove("courseTrainings", index)} className="text-gray-400 hover:text-red-600 transition-colors"><FiTrash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

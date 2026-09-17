import { FiAward, FiEdit2, FiTrash2 } from "react-icons/fi";
import Card from "../../../../components/ui/Card";
import SectionHeader from "../SectionHeader";
import { formatDate } from "../utils";

export default function AchievementsSection({ keyAchievements, onAdd, onEdit, onRemove }) {
  return (
    <Card>
      <SectionHeader icon={<FiAward size={18} />} title="Key Achievements" onAdd={onAdd} />
      {(keyAchievements || []).length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No key achievements added yet</p>
      ) : (
        <div className="space-y-4">
          {(keyAchievements || []).map((achievement, index) => (
            <div key={achievement.id || index} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                <p className="text-sm text-gray-600">{achievement.category}</p>
                {achievement.date && <p className="text-xs text-gray-500">{formatDate(achievement.date)}</p>}
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => onEdit("keyAchievements", achievement, index)} className="text-gray-400 hover:text-blue-600 transition-colors"><FiEdit2 size={14} /></button>
                <button onClick={() => onRemove("keyAchievements", index)} className="text-gray-400 hover:text-red-600 transition-colors"><FiTrash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

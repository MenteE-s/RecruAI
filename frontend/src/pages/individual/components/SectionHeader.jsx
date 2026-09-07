import { FiPlus } from "react-icons/fi";

export default function SectionHeader({ icon, title, onAdd }) {
  return (
    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {onAdd && (
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          <FiPlus size={16} />
          Add
        </button>
      )}
    </div>
  );
}

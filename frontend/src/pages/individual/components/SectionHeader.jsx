import { FiPlus } from "react-icons/fi";

export default function SectionHeader({ icon, title, onAdd }) {
  return (
    <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <span className="text-gray-500">{icon}</span>
        {title}
      </h3>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-text transition-colors hover:text-brand-text"
        >
          <FiPlus size={16} strokeWidth={2} />
          Add
        </button>
      )}
    </div>
  );
}

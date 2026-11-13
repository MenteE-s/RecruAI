import { FiCheckCircle, FiX } from "react-icons/fi";
import { formatDate } from "../../utils/timezone";

export function timeAgo(dateString) {
  if (!dateString) return "Recently";
  const mins = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return formatDate(dateString);
}

export function getStatusMeta(status) {
  switch (status) {
    case "pending": return { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400" };
    case "reviewed": return { label: "Reviewed", color: "bg-gray-100 text-gray-600 border-line dark:bg-gray-25 dark:text-gray-500 dark:border-line" };
    case "accepted": return { label: "Accepted", color: "bg-brand/10 text-brand-text border-transparent" };
    case "rejected": return { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400" };
    default: return { label: status, color: "bg-gray-50 text-gray-600 border-line dark:bg-gray-25 dark:text-gray-500" };
  }
}

export function ClearFiltersButton({ onClear }) {
  return (
    <button onClick={onClear} className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-gray-50 dark:hover:bg-gray-25">
      <FiX className="h-3.5 w-3.5" /> Clear filters
    </button>
  );
}

export function HiredTick() {
  return <FiCheckCircle className="h-3.5 w-3.5" />;
}

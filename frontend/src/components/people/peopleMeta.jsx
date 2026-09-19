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
    case "pending": return { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" };
    case "reviewed": return { label: "Reviewed", color: "bg-blue-50 text-blue-700 border-blue-200" };
    case "accepted": return { label: "Accepted", color: "bg-green-50 text-green-700 border-green-200" };
    case "rejected": return { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200" };
    default: return { label: status, color: "bg-gray-50 text-gray-600 border-gray-200" };
  }
}

export function ClearFiltersButton({ onClear }) {
  return (
    <button onClick={onClear} className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 text-xs font-semibold hover:bg-black rounded-md">
      <FiX className="w-3.5 h-3.5" /> Clear filters
    </button>
  );
}

export function HiredTick() {
  return <FiCheckCircle className="w-3.5 h-3.5" />;
}

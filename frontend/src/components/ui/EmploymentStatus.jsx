import { FiCheckCircle } from "react-icons/fi";

// Single source of truth for employment-status presentation.
// Trust model (enforced backend-side): 'hired' is set ONLY via organization
// onboarding, and 'working' requires 'hired' first — so those badges are
// org-verified. 'unemployed'/missing means open to work (self-evident).
export function employmentMeta(status) {
  switch (status) {
    case "hired":
      return {
        label: "Hired",
        verified: true,
        chip: "bg-[#FAF4E3] text-[#7A5F22] border-[#E5D3A6]",
        ring: "ring-[#C6A15B]",
        banner: "bg-[#9A7B3F]",
      };
    case "working":
      return {
        label: "Working",
        verified: true,
        chip: "bg-[#FAF4E3] text-[#7A5F22] border-[#E5D3A6]",
        ring: "ring-[#C6A15B]",
        banner: "bg-[#9A7B3F]",
      };
    case "onboarding":
      return {
        label: "Onboarding",
        verified: true,
        chip: "bg-amber-50 text-amber-700 border-amber-200",
        ring: "ring-amber-500",
        banner: "bg-amber-500",
      };
    case "unemployed":
    default:
      return {
        label: "Open to Work",
        verified: false,
        chip: "bg-green-50 text-green-700 border-green-200",
        ring: "ring-green-500",
        banner: "bg-green-600",
      };
  }
}

// Compact status chip. Verified states get a check.
export default function EmploymentBadge({ status, className = "" }) {
  const meta = employmentMeta(status);
  return (
    <span
      title={meta.verified ? "Verified by hiring organization" : "Looking for opportunities"}
      className={`inline-flex items-center gap-1 text-xs font-semibold border px-2 py-0.5 rounded-full ${meta.chip} ${className}`}
    >
      {meta.verified && <FiCheckCircle className="w-3 h-3" />}
      {meta.label}
      {meta.verified && <span className="font-normal opacity-75">· Verified</span>}
    </span>
  );
}

// Full-width photo-frame banner (LinkedIn-style) for profile headers.
export function EmploymentFrame({ status, company }) {
  const meta = employmentMeta(status);
  return (
    <div className={`w-full rounded-lg ${meta.banner} text-white px-3 py-2 flex items-center justify-center gap-1.5 shadow-sm`}>
      {meta.verified && <FiCheckCircle className="w-4 h-4 shrink-0" />}
      <span className="text-xs font-bold tracking-wide uppercase">
        {meta.verified ? `${meta.label}${company ? ` · ${company}` : ""}` : meta.label}
      </span>
    </div>
  );
}

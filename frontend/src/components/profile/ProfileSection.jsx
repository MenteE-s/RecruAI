import { cn } from "../../lib/cn";

/**
 * ProfileSection — Peerlist neutral surface used by every profile section.
 * Drop-in replacement for the legacy card shell (rounded-xl, border-line,
 * bg-surface, 16px padding) so section components keep their structure.
 */
export function ProfileSection({ children, className }) {
  return (
    <div className={cn("rounded-xl border border-line bg-surface p-4", className)}>
      {children}
    </div>
  );
}

export default ProfileSection;

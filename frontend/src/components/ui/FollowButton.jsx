import { useState, useEffect } from "react";
import { Plus, Check } from "lucide-react";
import { followOrg, unfollowOrg, checkFollow } from "../../utils/follows";
import { useToast } from "./ToastContext";

export default function FollowButton({ orgId, size = "sm", onChange }) {
  const { showToast } = useToast();
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!orgId) return;
      const v = await checkFollow(orgId);
      if (!cancelled) setFollowing(v);
    })();
    return () => { cancelled = true; };
  }, [orgId]);

  const toggle = async (e) => {
    e.stopPropagation();
    if (busy || !orgId) return;
    setBusy(true);
    try {
      if (following) {
        await unfollowOrg(orgId);
        setFollowing(false);
        showToast({ message: "Unfollowed company", type: "success" });
      } else {
        await followOrg(orgId);
        setFollowing(true);
        showToast({ message: "Following company — see it in My Network", type: "success" });
      }
      if (onChange) onChange(!following);
    } catch (err) {
      showToast({ message: err.message || "Action failed", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const cls =
    size === "xs"
      ? "px-2.5 py-1 text-xs"
      : "px-3.5 py-1.5 text-xs";

  if (following) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 font-medium rounded-xl border border-line bg-surface text-ink shadow-s5 hover:bg-gray-100 dark:hover:bg-gray-25/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${cls}`}
      >
        <Check className="h-3.5 w-3.5 text-brand-text shrink-0" strokeWidth={2} />
        <span>Following</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 font-medium rounded-xl border border-line bg-surface text-ink shadow-s5 hover:bg-gray-100 dark:hover:bg-gray-25/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${cls}`}
    >
      <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      <span>Follow</span>
    </button>
  );
}

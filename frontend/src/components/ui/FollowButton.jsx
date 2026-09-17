import { useState, useEffect } from "react";
import { FiPlus, FiCheck } from "react-icons/fi";
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
      ? "px-2 py-0.5 text-[11px]"
      : "px-3 py-1.5 text-xs";

  if (following) {
    return (
      <button
        onClick={toggle}
        disabled={busy}
        className={`inline-flex items-center gap-1 font-semibold rounded-full border border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-60 ${cls}`}
      >
        <FiCheck className="w-3.5 h-3.5" /> Following
      </button>
    );
  }
  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`inline-flex items-center gap-1 font-semibold rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-60 ${cls}`}
    >
      <FiPlus className="w-3.5 h-3.5" /> Follow
    </button>
  );
}

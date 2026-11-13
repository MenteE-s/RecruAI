import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { getBackendUrl, clearLocalAuth } from "../../utils/auth";

const VARIANT_STYLES = {
  // Neutral bordered button for navbars and rails
  solid:
    "inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-ink transition-colors",
  // Quiet row for the sidebar
  sidebar:
    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-ink transition-all duration-150",
};

/**
 * Shared red sign-out button with a "Want to sign out?" confirm dialog.
 * `onSignedOut` runs after local auth is cleared (e.g. to flip navbar state).
 */
export default function SignOutButton({ variant = "solid", className = "", iconOnly = false, onSignedOut }) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const doSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch(`${getBackendUrl()}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      // ignore network errors — still clear local session
    }
    clearLocalAuth();
    try {
      const socketService = (await import("../../utils/socket")).default;
      socketService.disconnect();
    } catch (e) {
      // socket optional
    }
    if (onSignedOut) onSignedOut();
    setConfirmOpen(false);
    navigate("/signin", { replace: true });
  };

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        title={iconOnly ? "Sign out" : undefined}
        className={`${VARIANT_STYLES[variant] || VARIANT_STYLES.solid} ${className} ${iconOnly ? "md:justify-center md:px-0" : ""}`}>
        <FiLogOut className={variant === "sidebar" ? "w-4 h-4 shrink-0" : "w-3 h-3"} />
        <span className={iconOnly ? "md:hidden" : ""}>Sign out</span>
      </button>

      {confirmOpen &&
        createPortal(
          <div data-signout-dialog="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-surface w-full max-w-sm rounded-xl border border-line p-6 shadow-s15 animate-popIn">
              <h3 className="text-lg font-semibold text-ink">Want to sign out?</h3>
              <p className="text-sm text-gray-600 mt-2">
                You'll need to sign in again to access your account.
              </p>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={doSignOut}
                  disabled={signingOut}
                  className="flex-1 rounded-xl border border-gray-900 bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signingOut ? "Signing out…" : "Yes, sign out"}
                </button>
                <button
                  onClick={() => setConfirmOpen(false)}
                  disabled={signingOut}
                  className="rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Stay
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

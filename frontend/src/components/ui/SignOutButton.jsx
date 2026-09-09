import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { getBackendUrl, clearLocalAuth } from "../../utils/auth";

const VARIANT_STYLES = {
  // Solid red button for navbars
  solid:
    "inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors",
  // Red-tinted row for the sidebar
  sidebar:
    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-all duration-150",
};

/**
 * Shared red sign-out button with a "Want to sign out?" confirm dialog.
 * `onSignedOut` runs after local auth is cleared (e.g. to flip navbar state).
 */
export default function SignOutButton({ variant = "solid", className = "", onSignedOut }) {
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
      <button onClick={() => setConfirmOpen(true)} className={VARIANT_STYLES[variant] || VARIANT_STYLES.solid}>
        <FiLogOut className={variant === "sidebar" ? "w-5 h-5 shrink-0" : "w-4 h-4"} />
        <span>Sign out</span>
      </button>

      {confirmOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900">Want to sign out?</h3>
              <p className="text-sm text-gray-600 mt-2">
                You'll need to sign in again to access your account.
              </p>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={doSignOut}
                  disabled={signingOut}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signingOut ? "Signing out…" : "Yes, sign out"}
                </button>
                <button
                  onClick={() => setConfirmOpen(false)}
                  disabled={signingOut}
                  className="px-5 py-2.5 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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

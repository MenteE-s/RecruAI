// src/components/RequireOrganization.js
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { verifyTokenWithServer } from "../utils/auth";
import { FiBriefcase } from "react-icons/fi";

/**
 * Route guard for organization workspace pages.
 *
 * - Unauthenticated / unverified users are sent to /signin (same contract as
 *   ProtectedRoute).
 * - Authenticated users without an organization context get a clear, neutral
 *   "no organization access" panel instead of a misleading workspace shell.
 * - Members with an organization_id pass through unchanged; the backend still
 *   enforces per-permission authorization on every data request.
 *
 * Verification is skipped while the shared short-TTL /api/auth/me cache is
 * resolving, so no spinner flash and no duplicate network verify.
 */
export default function RequireOrganization({ children }) {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const u = await verifyTokenWithServer();
        if (!cancelled) setUser(u);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) return null;
  if (!user || user.email_verified === false) return <Navigate to="/signin" replace />;
  if (!user.organization_id) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-line bg-surface p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-25">
            <FiBriefcase className="h-6 w-6 text-gray-500" />
          </div>
          <h1 className="text-base font-semibold text-ink">No organization access</h1>
          <p className="mt-1.5 text-sm leading-6 text-gray-500">
            This workspace is available to organization members. If you believe this is a mistake, ask an admin.
          </p>
        </div>
      </div>
    );
  }
  return children;
}

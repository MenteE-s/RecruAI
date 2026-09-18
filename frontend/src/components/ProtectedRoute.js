// src/components/ProtectedRoute.js
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { verifyTokenWithServer } from "../utils/auth";

// Uses the shared short-TTL cached /api/auth/me (single-flight) so mounting
// N protected routes does not fan out N network verifies.
// Unverified accounts are bounced to /signin even with a valid token —
// signing in then routes them through the OTP step.
export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const user = await verifyTokenWithServer();
        if (!cancelled) setOk(!!user && user.email_verified !== false);
      } catch {
        if (!cancelled) setOk(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Render nothing while checking (no spinner flash: the shared cached
  // /api/auth/me usually resolves synchronously from memory).
  if (checking) return null;
  if (!ok) return <Navigate to="/signin" replace />;
  return children;
}

// src/components/ProtectedRoute.js
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { verifyTokenWithServer } from "../utils/auth";
import MenteeLoader from "./ui/MenteeLoader";

// Uses the shared short-TTL cached /api/auth/me (single-flight) so mounting
// N protected routes does not fan out N network verifies.
export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const user = await verifyTokenWithServer();
        if (!cancelled) setOk(!!user);
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

  if (checking)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <MenteeLoader size={64} />
      </div>
    );
  if (!ok) return <Navigate to="/signin" replace />;
  return children;
}

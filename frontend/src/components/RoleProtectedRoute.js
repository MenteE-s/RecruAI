// src/components/RoleProtectedRoute.js
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { verifyTokenWithServer } from "../utils/auth";

export default function RoleProtectedRoute({
  children,
  allowedRoles = [],
  fallbackRoute = "/dashboard",
}) {
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const user = await verifyTokenWithServer();
        if (!cancelled) {
          if (user && allowedRoles.includes(user.role)) {
            setOk(true);
          } else {
            setOk(false);
          }
        }
      } catch (err) {
        if (!cancelled) setOk(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [allowedRoles]);

  if (checking) return null;
  if (!ok) return <Navigate to={fallbackRoute} replace />;
  return children;
}

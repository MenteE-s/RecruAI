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
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // First check cached authentication data to avoid duplicate server calls
        const existingRole = localStorage.getItem("authRole");
        const isAuthenticated = localStorage.getItem("isAuthenticated");

        let userRole = existingRole;

        // Only verify with server if we don't have cached data or if it might be stale
        if (!existingRole || !isAuthenticated || isAuthenticated !== "true") {
          const user = await verifyTokenWithServer();
          if (!cancelled && user && user.role) {
            userRole = user.role;
            setUserRole(userRole);
          } else {
            // Not authenticated
            if (!cancelled) {
              setOk(false);
              setChecking(false);
            }
            return;
          }
        } else {
          setUserRole(existingRole);
        }

        // Check if user's role is in the allowed roles for this route
        if (allowedRoles.includes(userRole)) {
          if (!cancelled) {
            setOk(true);
          }
        } else {
          // User doesn't have permission to access this route
          if (!cancelled) {
            setOk(false);
          }
        }
      } catch (err) {
        // Network error - treat as not authenticated
        if (!cancelled) {
          setOk(false);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [allowedRoles]);

  if (checking) {
    return null; // or a loading component
  }

  if (!ok) {
    // Redirect to appropriate dashboard based on user's actual role
    return <Navigate to={fallbackRoute} replace />;
  }

  return children;
}

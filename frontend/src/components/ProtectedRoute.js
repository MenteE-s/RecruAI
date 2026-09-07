// src/components/ProtectedRoute.js
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuthHeaders, getBackendUrl } from "../utils/auth";

// ProtectedRoute now performs a lightweight token validation with the backend
// If a token exists we call /api/auth/me to verify it and refresh the stored role.
export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        if (!cancelled) {
          setChecking(false);
          setOk(false);
        }
        return;
      }

      try {
        const res = await fetch(`${getBackendUrl()}/api/auth/me`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        console.log("/api/auth/me status:", res.status);
        if (!res.ok) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("isAuthenticated");
          localStorage.removeItem("authRole");
          if (!cancelled) setOk(false);
        } else {
          const data = await res.json();
          if (!cancelled) {
            localStorage.setItem("isAuthenticated", "true");
            if (data.user && data.user.role) {
              localStorage.setItem("authRole", data.user.role);
            }
            setOk(true);
          }
        }
      } catch (err) {
        console.error("/api/auth/me network error:", err);
        localStorage.removeItem("access_token");
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("authRole");
        if (!cancelled) setOk(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) return null;
  if (!ok) return <Navigate to="/signin" replace />;
  return children;
}

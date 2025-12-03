// src/components/ProtectedRoute.js
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://recruai-production.up.railway.app";

// ProtectedRoute now performs a lightweight token validation with the backend
// If a token exists we call /api/auth/me to verify it and refresh the stored role.
export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // rely on HttpOnly cookies; include credentials so browser sends the cookie
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: "include",
        });
        // debug log
        // eslint-disable-next-line no-console
        console.log("/api/auth/me status:", res.status);
        if (!res.ok) {
          // clear any local flags and let the user sign in again
          localStorage.removeItem("access_token");
          localStorage.removeItem("isAuthenticated");
          localStorage.removeItem("authRole");
          if (!cancelled) setOk(false);
        } else {
          const data = await res.json();
          if (!cancelled) {
            // mark authenticated in localStorage
            localStorage.setItem("isAuthenticated", "true");
            if (data.user && data.user.role) {
              localStorage.setItem("authRole", data.user.role);
            }
            setOk(true);
          }
        }
      } catch (err) {
        // network error - be conservative: treat as not authenticated
        // eslint-disable-next-line no-console
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

  if (checking) return null; // or a loader component
  if (!ok) return <Navigate to="/signin" replace />;
  return children;
}

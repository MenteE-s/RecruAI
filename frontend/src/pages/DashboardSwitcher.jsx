import { useEffect, useState } from "react";
import IndividualDashboard from "./dashboards/individual/Dashboard";
import OrganizationDashboard from "./dashboards/organization/Dashboard";

export default function DashboardSwitcher() {
  const [role, setRole] = useState(
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null
  );

  useEffect(() => {
    // If we have an access token, fetch server-verified profile to determine role.
    const token = localStorage.getItem("access_token");
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          // if token invalid or expired, keep existing role (or null) and let ProtectedRoute handle redirect
          return;
        }
        const data = await res.json();
        if (!cancelled && data.user && data.user.role) {
          setRole(data.user.role);
          localStorage.setItem("authRole", data.user.role);
        }
      } catch (err) {
        // ignore network errors here; keep existing local role
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (role === "organization") return <OrganizationDashboard />;
  return <IndividualDashboard />;
}

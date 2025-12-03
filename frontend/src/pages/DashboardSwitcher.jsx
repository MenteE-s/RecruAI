import { useEffect, useState } from "react";
import IndividualDashboard from "./dashboards/IndividualDashboard";
import OrganizationDashboard from "./dashboards/OrganizationDashboard";

import { verifyTokenWithServer } from "../utils/auth";

export default function DashboardSwitcher() {
  // Start with cached role if available to avoid blank screen
  const cachedRole =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const [role, setRole] = useState(cachedRole);
  const [loading, setLoading] = useState(!cachedRole);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await verifyTokenWithServer();
        if (!cancelled && user && user.role) {
          setRole(user.role);
        }
      } catch (err) {
        // ignore network errors here; keep existing local role
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="p-8">Loading dashboard…</div>;
  if (role === "organization") return <OrganizationDashboard />;
  return <IndividualDashboard />;
}

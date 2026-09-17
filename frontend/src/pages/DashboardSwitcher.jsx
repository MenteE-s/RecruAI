import { useEffect, useState } from "react";
import IndividualDashboard from "./dashboards/IndividualDashboard";
import OrganizationDashboard from "./dashboards/OrganizationDashboard";
import MenteeLoader from "../components/ui/MenteeLoader";

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

  if (loading)
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <MenteeLoader size={60} />
      </div>
    );
  if (role === "organization") return <OrganizationDashboard />;
  return <IndividualDashboard />;
}

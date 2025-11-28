import { useEffect, useState } from "react";
import IndividualSettings from "./individual/Settings";
import OrganizationSettings from "./organization/Settings";

import { verifyTokenWithServer } from "../utils/auth";

export default function SettingsSwitcher() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await verifyTokenWithServer();
        if (!cancelled && user && user.role) {
          setRole(user.role);
        }
      } catch (err) {
        // ignore network errors
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="p-8">Loading settings…</div>;
  if (role === "organization") return <OrganizationSettings />;
  return <IndividualSettings />;
}

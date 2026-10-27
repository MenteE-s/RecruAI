import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export default function Plans() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api("/api/admin/plans")
      .then((body) => { if (!cancelled) setData(body); })
      .catch((err) => { if (!cancelled) setError(err.message || "Could not load plans"); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!data) return <p className="sub">Loading…</p>;

  return (
    <>
      <h1>Plans</h1>
      <p className="sub">What free includes, what paid unlocks, and who is on what. Edit tiers per account from People and Organizations.</p>
      <div className="cards">
        <div className="card"><div className="k">Paid people</div><div className="v">{data.subscribers.paid_users}</div><div className="s">{data.subscribers.trial_users} on trial</div></div>
        <div className="card"><div className="k">Paid organizations</div><div className="v">{data.subscribers.paid_organizations}</div></div>
      </div>
      <div className="two-col">
        <div className="panel" style={{ padding: 16 }}>
          <h3 style={{ margin: "0 0 8px" }}>Individual · Free</h3>
          <ul className="plain">
            {data.individual_free.map((f) => <li key={f}><code className="inline">{f}</code></li>)}
          </ul>
          <p className="sub" style={{ marginTop: 12 }}>
            Manage per account in <Link to="/users">People</Link>: status, paid flag, AI allowance.
          </p>
        </div>
        <div className="panel" style={{ padding: 16 }}>
          <h3 style={{ margin: "0 0 8px" }}>Individual · Premium ($15/mo)</h3>
          <ul className="plain">
            {data.individual_premium.map((f) => <li key={f}><code className="inline">{f}</code></li>)}
          </ul>
          <p className="sub" style={{ marginTop: 12 }}>
            Organization premium ($20/mo) is the paid flag on the company page — see <Link to="/organizations">Organizations</Link>.
          </p>
        </div>
      </div>
      <div className="notice" style={{ marginTop: 12 }}>
        Stripe checkout, webhooks, and the customer portal are not wired yet — plan changes here take effect immediately and are audited server-side.
      </div>
    </>
  );
}

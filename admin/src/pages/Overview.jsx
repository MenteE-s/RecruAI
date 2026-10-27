import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

function Stat({ label, value, sub, tone }) {
  return (
    <div className={"card " + (tone || "")}>
      <div className="k">{label}</div>
      <div className="v">{value}</div>
      {sub && <div className="s">{sub}</div>}
    </div>
  );
}

export default function Overview() {
  const [data, setData] = useState(null);
  const [sched, setSched] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [overview, scheduler] = await Promise.all([
          api("/api/admin/overview"),
          api("/api/health/scheduler").catch(() => null),
        ]);
        if (!cancelled) {
          setData(overview);
          setSched(scheduler);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load overview");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!data) return <p className="sub">Loading…</p>;

  const dead = data.outbox.dead || 0;

  return (
    <>
      <h1>Overview</h1>
      <p className="sub">People, organizations, plans, and worker health at a glance.</p>
      <div className="cards">
        <Stat label="People" value={data.users.total} sub={`${data.users.paid} paid · ${data.users.trial} trial`} />
        <Stat label="Organizations" value={data.organizations.total} sub={`${data.organizations.paid} paid`} />
        <Stat label="Outbox pending" value={data.outbox.pending} sub={`${data.outbox.failed} failed`} />
        <Stat label="Outbox dead" value={dead} tone={dead > 0 ? "bad" : "ok"} sub={dead > 0 ? "needs triage → Outbox" : "queue draining"} />
        <Stat label="Scheduler" value={data.scheduler_healthy ? "healthy" : "stale"} tone={data.scheduler_healthy ? "ok" : "bad"} />
        {sched && (
          <Stat label="Scheduler jobs" value={Object.keys(sched.jobs || {}).length} sub={Object.entries(sched.jobs || {}).filter(([, j]) => j.stale).map(([k]) => k).join(", ") || "all fresh"} />
        )}
      </div>
      {dead > 0 && (
        <div className="notice">
          {dead} dead outbox event{dead === 1 ? "" : "s"} need attention. <Link to="/outbox?status=dead">Open the dead-letter queue</Link>.
        </div>
      )}
    </>
  );
}

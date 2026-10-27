import { useCallback, useEffect, useState } from "react";
import { api, formatDate } from "../lib/api";

const STATUSES = ["", "pending", "failed", "processing", "dead", "done"];

export default function Outbox() {
  const params = new URLSearchParams(window.location.search);
  const [status, setStatus] = useState(params.get("status") || "dead");
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState("");
  const [acting, setActing] = useState(null);

  const load = useCallback(async (nextPage = 1, nextStatus = status) => {
    setError("");
    const query = new URLSearchParams({ page: String(nextPage), per_page: "20" });
    if (nextStatus) query.set("status", nextStatus);
    try {
      const body = await api(`/api/admin/outbox?${query.toString()}`);
      setRows(body.data || []);
      setPagination(body.pagination || null);
      setPage(nextPage);
    } catch (err) {
      setError(err.message || "Could not load outbox");
    }
  }, [status]);

  useEffect(() => { load(1, status); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function retry(id) {
    setActing(id);
    setError("");
    try {
      await api(`/api/admin/outbox/${id}/retry`, { method: "POST" });
      load(page);
    } catch (err) {
      setError(err.message || "Retry failed");
    } finally {
      setActing(null);
    }
  }

  return (
    <>
      <h1>Outbox &amp; retries</h1>
      <p className="sub">Queued email, Kafka fan-out, and notifications. Dead rows need a human look before retry.</p>
      {error && <div className="alert">{error}</div>}
      <div className="panel">
        <div className="toolbar">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s === "" ? "All statuses" : s}</option>)}
          </select>
          <button className="btn" onClick={() => load(1)}>Refresh</button>
        </div>
        <table className="grid">
          <thead><tr><th>ID</th><th>Type</th><th>Status</th><th>Attempts</th><th>Next run</th><th>Last error</th><th></th></tr></thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td className="mono">{e.id}</td>
                <td className="mono">{e.type}</td>
                <td><span className={"pill " + (e.status === "dead" ? "red" : e.status === "failed" ? "amber" : e.status === "done" ? "green" : "grey")}>{e.status}</span></td>
                <td>{e.attempts}/{e.max_attempts}</td>
                <td>{formatDate(e.next_run_at)}</td>
                <td style={{ maxWidth: 320 }}>{e.last_error || "—"}</td>
                <td>
                  {(e.status === "failed" || e.status === "dead") && (
                    <button className="btn small" disabled={acting === e.id} onClick={() => retry(e.id)}>
                      {acting === e.id ? "…" : "Retry"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="7" style={{ color: "var(--muted)" }}>Nothing here. A quiet outbox is a healthy outbox.</td></tr>}
          </tbody>
        </table>
        <div className="pager">
          <button className="btn ghost small" disabled={!pagination?.has_prev} onClick={() => load(page - 1)}>← Prev</button>
          <span>Page {pagination?.page || 1}{pagination ? ` of ${pagination.total_pages} (${pagination.total} total)` : ""}</span>
          <button className="btn ghost small" disabled={!pagination?.has_next} onClick={() => load(page + 1)}>Next →</button>
        </div>
      </div>
    </>
  );
}

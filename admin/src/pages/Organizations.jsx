import { useCallback, useEffect, useState } from "react";
import { api, formatDate } from "../lib/api";

export default function Organizations() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (nextPage = 1, query = q) => {
    setError("");
    const params = new URLSearchParams({ page: String(nextPage), per_page: "20" });
    if (query.trim()) params.set("q", query.trim());
    try {
      const body = await api(`/api/admin/organizations?${params.toString()}`);
      setRows(body.data || []);
      setPagination(body.pagination || null);
      setPage(nextPage);
    } catch (err) {
      setError(err.message || "Could not load organizations");
    }
  }, [q]);

  useEffect(() => { load(1, ""); }, [load]);

  function openEditor(org) {
    setEditing({ ...org, _status: org.subscription_status || "trial", _paid: !!org.paid_plan });
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      await api(`/api/admin/organizations/${editing.id}`, {
        method: "PATCH",
        body: { subscription_status: editing._status, paid_plan: editing._paid },
      });
      setEditing(null);
      load(page);
    } catch (err) {
      setError(err.message || "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1>Organizations</h1>
      <p className="sub">Company pages, visibility, and paid status.</p>
      {error && <div className="alert">{error}</div>}
      <div className="panel">
        <div className="toolbar">
          <input type="text" placeholder="Search company name…" value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") load(1); }} />
          <button className="btn" onClick={() => load(1)}>Search</button>
        </div>
        <table className="grid">
          <thead><tr><th>Company</th><th>Slug</th><th>Public</th><th>Status</th><th>Paid</th><th>Created</th><th></th></tr></thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>{o.name}</td>
                <td className="mono">/org/{o.slug}</td>
                <td>{o.is_public ? "yes" : "no"}</td>
                <td>{o.subscription_status || "—"}</td>
                <td>{o.paid_plan ? "yes" : "—"}</td>
                <td>{formatDate(o.created_at)}</td>
                <td><button className="btn ghost small" onClick={() => openEditor(o)}>Manage</button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="7" style={{ color: "var(--muted)" }}>No organizations found.</td></tr>}
          </tbody>
        </table>
        <div className="pager">
          <button className="btn ghost small" disabled={!pagination?.has_prev} onClick={() => load(page - 1)}>← Prev</button>
          <span>Page {pagination?.page || 1}{pagination ? ` of ${pagination.total_pages} (${pagination.total} total)` : ""}</span>
          <button className="btn ghost small" disabled={!pagination?.has_next} onClick={() => load(page + 1)}>Next →</button>
        </div>
      </div>

      {editing && (
        <div className="modal-back" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Manage {editing.name}</h2>
            <div className="row">
              <div>
                <label>Status</label>
                <select value={editing._status} onChange={(e) => setEditing({ ...editing, _status: e.target.value })}>
                  <option value="trial">trial</option>
                  <option value="active">active</option>
                  <option value="expired">expired</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
            </div>
            <label className="checkline">
              <input type="checkbox" checked={editing._paid}
                onChange={(e) => setEditing({ ...editing, _paid: e.target.checked })} />
              Paid plan
            </label>
            <div className="actions">
              <button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

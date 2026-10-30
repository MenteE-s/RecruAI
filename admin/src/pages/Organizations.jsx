import { useCallback, useEffect, useState } from "react";
import { api, formatDate } from "../lib/api";
import { ORGANIZATION_FEATURE_KEYS as FEATURE_KEYS } from "../lib/features";

export default function Organizations() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api("/api/admin/plans")
      .then((body) => {
        if (!cancelled) setPlans((body || []).filter((p) => p.scope === "organization"));
      })
      .catch(() => { /* non-fatal; the selector falls back to "free" */ });
    return () => { cancelled = true; };
  }, []);

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
    setEditing({
      ...org,
      _status: org.subscription_status || "trial",
      _paid: !!org.paid_plan,
      _plan: org.plan || "free",
      _overrides: org.feature_overrides || [],
      _allowance: org.token_allowance ?? "",
    });
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError("");
    const body = {
      subscription_status: editing._status,
      paid_plan: editing._paid,
      plan: editing._plan,
      feature_overrides: editing._overrides,
    };
    if (editing._allowance !== "" && editing._allowance !== null) {
      body.token_allowance = Number(editing._allowance);
    }
    try {
      await api(`/api/admin/organizations/${editing.id}`, {
        method: "PATCH",
        body,
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
          <thead><tr><th>Company</th><th>Slug</th><th>Public</th><th>Status</th><th>Plan</th><th>Paid</th><th>Created</th><th></th></tr></thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>{o.name}</td>
                <td className="mono">/org/{o.slug}</td>
                <td>{o.is_public ? "yes" : "no"}</td>
                <td>{o.subscription_status || "—"}</td>
                <td>{o.plan || "free"}</td>
                <td>{o.paid_plan ? "yes" : "—"}</td>
                <td>{formatDate(o.created_at)}</td>
                <td><button className="btn ghost small" onClick={() => openEditor(o)}>Manage</button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="8" style={{ color: "var(--muted)" }}>No organizations found.</td></tr>}
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
          <div className="modal wide" onClick={(e) => e.stopPropagation()}>
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
              <div>
                <label>AI token allowance</label>
                <input type="number" min="0" value={editing._allowance}
                  onChange={(e) => setEditing({ ...editing, _allowance: e.target.value })} />
              </div>
            </div>
            <label className="checkline">
              <input type="checkbox" checked={editing._paid}
                onChange={(e) => setEditing({ ...editing, _paid: e.target.checked })} />
              Paid plan
            </label>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Plan</label>
              <select value={editing._plan} onChange={(e) => setEditing({ ...editing, _plan: e.target.value })}>
                {plans.map((p) => <option key={p.id} value={p.slug}>{p.name} (${(p.price_cents / 100).toFixed(2)})</option>)}
                {plans.length === 0 && <option value="free">free</option>}
              </select>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Per-organization feature grants (unlock without changing plan)</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {FEATURE_KEYS.map((f) => (
                  <label key={f} className="checkline" style={{ margin: 0 }}>
                    <input type="checkbox" checked={(editing._overrides || []).includes(f)}
                      onChange={() => {
                        const set = new Set(editing._overrides || []);
                        if (set.has(f)) set.delete(f);
                        else set.add(f);
                        setEditing({ ...editing, _overrides: Array.from(set) });
                      }} />
                    {f}
                  </label>
                ))}
              </div>
            </div>
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

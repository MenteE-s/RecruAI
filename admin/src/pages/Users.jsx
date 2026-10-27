import { useCallback, useEffect, useState } from "react";
import { api, formatDate } from "../lib/api";

function StatusPill({ value }) {
  const tone = value === "active" ? "green" : value === "trial" ? "amber" : "grey";
  return <span className={"pill " + tone}>{value || "—"}</span>;
}

export default function Users() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (nextPage = 1, query = q, planFilter = plan) => {
    setError("");
    const params = new URLSearchParams({ page: String(nextPage), per_page: "20" });
    if (query.trim()) params.set("q", query.trim());
    if (planFilter) params.set("plan", planFilter);
    try {
      const body = await api(`/api/admin/users?${params.toString()}`);
      setRows(body.data || []);
      setPagination(body.pagination || null);
      setPage(nextPage);
    } catch (err) {
      setError(err.message || "Could not load people");
    }
  }, [q, plan]);

  useEffect(() => { load(1, "", ""); }, [load]);

  function openEditor(user) {
    setEditing({
      ...user,
      _status: user.subscription_status || "trial",
      _paid: !!user.paid_plan,
      _allowance: user.token_allowance ?? "",
      _superadmin: !!user.is_superadmin,
    });
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError("");
    const body = {
      subscription_status: editing._status,
      paid_plan: editing._paid,
    };
    if (editing._allowance !== "" && editing._allowance !== null) {
      body.token_allowance = Number(editing._allowance);
    }
    if (editing._superadmin !== !!editing.is_superadmin) {
      if (!window.confirm(
        editing._superadmin
          ? `Grant superadmin to ${editing.email}? They will bypass every org scope.`
          : `Remove superadmin from ${editing.email}?`
      )) {
        setSaving(false);
        return;
      }
      body.is_superadmin = editing._superadmin;
    }
    try {
      await api(`/api/admin/users/${editing.id}`, { method: "PATCH", body });
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
      <h1>People</h1>
      <p className="sub">Search accounts, manage plans and AI allowances, grant platform access.</p>
      {error && <div className="alert">{error}</div>}
      <div className="panel">
        <div className="toolbar">
          <input type="text" placeholder="Search name or email…" value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") load(1); }} />
          <select value={plan} onChange={(e) => { setPlan(e.target.value); }}>
            <option value="">All plans</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="btn" onClick={() => load(1)}>Search</button>
        </div>
        <table className="grid">
          <thead><tr><th>Email</th><th>Name</th><th>Status</th><th>Paid</th><th>Role</th><th></th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>{u.email}{u.is_superadmin && <span className="pill green" style={{ marginLeft: 6 }}>superadmin</span>}</td>
                <td>{u.name || "—"}</td>
                <td><StatusPill value={u.subscription_status} /></td>
                <td>{u.paid_plan ? "yes" : "—"}</td>
                <td><span className="pill grey">{u.role}</span></td>
                <td><button className="btn ghost small" onClick={() => openEditor(u)}>Manage</button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="6" style={{ color: "var(--muted)" }}>No accounts found.</td></tr>}
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
            <h2>Manage {editing.email}</h2>
            <p className="sub">Joined {formatDate(editing.created_at)} · {editing.tokens_used ?? 0} tokens used</p>
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
            <label className="checkline">
              <input type="checkbox" checked={editing._superadmin}
                onChange={(e) => setEditing({ ...editing, _superadmin: e.target.checked })} />
              Platform superadmin (bypasses every org scope)
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

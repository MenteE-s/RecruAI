import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

const SCOPES = ["individual", "organization"];
const ALL_FEATURES = [
  "profile_management", "job_search", "basic_matching", "job_posting", "team_management",
  "cvai_skill_assessment", "cvai_quizzes", "cvai_projects", "cvai_mentorship",
  "cvai_mock_interview", "career_coaching", "practice_ai_agents",
  "ai_screening", "ai_interview_agents", "analytics", "reports",
];

export default function Plans() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const body = await api("/api/admin/plans");
      setRows(body || []);
    } catch (err) {
      setError(err.message || "Could not load plans");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function emptyPlan() {
    return { slug: "", name: "", scope: "individual", price_cents: 0, features: [], is_default: false, is_active: true };
  }

  function openCreate() {
    setCreating(true);
    setEditing({ ...emptyPlan(), _new: true });
  }

  function openEdit(plan) {
    setEditing({ ...plan, _new: false });
  }

  function toggleFeature(f) {
    setEditing((prev) => {
      const set = new Set(prev.features || []);
      if (set.has(f)) set.delete(f);
      else set.add(f);
      return { ...prev, features: Array.from(set) };
    });
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError("");
    const body = {
      name: editing.name,
      price_cents: Number(editing.price_cents) || 0,
      features: editing.features || [],
      is_default: !!editing.is_default,
      is_active: !!editing.is_active,
    };
    try {
      if (editing._new) {
        body.slug = editing.slug;
        body.scope = editing.scope;
        await api("/api/admin/plans", { method: "POST", body });
      } else {
        await api(`/api/admin/plans/${editing.id}`, { method: "PATCH", body });
      }
      setEditing(null);
      setCreating(false);
      load();
    } catch (err) {
      setError(err.message || "Could not save plan");
    } finally {
      setSaving(false);
    }
  }

  async function remove(plan) {
    if (!window.confirm(`Delete plan "${plan.slug}"?`)) return;
    setError("");
    try {
      await api(`/api/admin/plans/${plan.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message || "Could not delete plan");
    }
  }

  return (
    <>
      <h1>Plans</h1>
      <p className="sub">Catalogue, pricing, and feature entitlements. Trial and paid unlocks override these; lapsed accounts fall back to the plan's feature list.</p>
      {error && <div className="alert">{error}</div>}
      <div style={{ marginBottom: 12 }}>
        <button className="btn" onClick={openCreate}>+ New plan</button>
      </div>
      <div className="panel">
        <table className="grid">
          <thead><tr><th>Slug</th><th>Scope</th><th>Name</th><th>Price</th><th>Default</th><th>Active</th><th>Features</th><th></th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="mono">{p.slug}</td>
                <td>{p.scope}</td>
                <td>{p.name}</td>
                <td>{p.price_display}</td>
                <td>{p.is_default ? "yes" : "—"}</td>
                <td>{p.is_active ? "yes" : "no"}</td>
                <td style={{ maxWidth: 360, fontSize: 11 }}>{(p.features || []).join(", ") || "—"}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="btn ghost small" onClick={() => openEdit(p)}>Edit</button>{" "}
                  {!p.is_default && <button className="btn danger small" onClick={() => remove(p)}>Delete</button>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="8" style={{ color: "var(--muted)" }}>No plans. Seed the defaults via migration.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal-back" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing._new ? "New plan" : `Edit ${editing.slug}`}</h2>
            <div className="row">
              <div>
                <label>Slug</label>
                <input value={editing.slug} disabled={!editing._new}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
              </div>
              <div>
                <label>Scope</label>
                <select value={editing.scope} disabled={!editing._new}
                  onChange={(e) => setEditing({ ...editing, scope: e.target.value })}>
                  {SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="row">
              <div>
                <label>Name</label>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label>Price (cents)</label>
                <input type="number" min="0" value={editing.price_cents}
                  onChange={(e) => setEditing({ ...editing, price_cents: e.target.value })} />
              </div>
            </div>
            <label className="checkline">
              <input type="checkbox" checked={editing.is_default}
                onChange={(e) => setEditing({ ...editing, is_default: e.target.checked })} />
              Default plan for this scope
            </label>
            <label className="checkline">
              <input type="checkbox" checked={editing.is_active}
                onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
              Active
            </label>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Features</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {ALL_FEATURES.map((f) => (
                  <label key={f} className="checkline" style={{ margin: 0 }}>
                    <input type="checkbox" checked={(editing.features || []).includes(f)}
                      onChange={() => toggleFeature(f)} />
                    {f}
                  </label>
                ))}
              </div>
            </div>
            <div className="actions">
              <button className="btn ghost" onClick={() => { setEditing(null); setCreating(false); }}>Cancel</button>
              <button className="btn" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

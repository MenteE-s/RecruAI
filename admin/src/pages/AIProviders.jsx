import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const PROVIDERS = {
  llm: ["groq", "openai", "openrouter"],
  embedding: ["openai", "openrouter", "huggingface"],
};

const KIND_LABELS = {
  llm: "LLM",
  embedding: "Embedding",
};

const MODEL_HINTS = {
  groq: "llama-3.3-70b-versatile",
  openai: "gpt-4o-mini",
  openrouter: "openai/gpt-4o-mini",
  huggingface: "bge-small-en-v1.5",
};

function emptyConfig(kind) {
  return {
    _new: true,
    kind,
    provider: PROVIDERS[kind][0],
    model: "",
    base_url: "",
    dimensions: kind === "embedding" ? 1536 : "",
    api_key: "",
    has_api_key: false,
    is_active: true,
  };
}

function needsApiKey(kind, provider) {
  return kind === "llm" || provider === "openai" || provider === "openrouter";
}

export default function AIProviders() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const body = await api("/api/admin/ai-providers");
      setRows(Array.isArray(body) ? body : []);
    } catch (err) {
      setError(err.message || "Could not load AI providers");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byKind = useMemo(
    () => ({
      llm: rows.filter((row) => row.kind === "llm"),
      embedding: rows.filter((row) => row.kind === "embedding"),
    }),
    [rows]
  );

  const active = useMemo(
    () => ({
      llm: byKind.llm.find((row) => row.is_active) || null,
      embedding: byKind.embedding.find((row) => row.is_active) || null,
    }),
    [byKind]
  );

  function openCreate(kind) {
    setError("");
    setTestResult(null);
    setEditing(emptyConfig(kind));
  }

  function openEdit(row) {
    setError("");
    setTestResult(null);
    setEditing({
      ...row,
      _new: false,
      base_url: row.base_url || "",
      dimensions: row.dimensions ?? "",
      api_key: "",
    });
  }

  function setField(field, value) {
    setEditing((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    if (!editing.model.trim()) return "A model is required.";
    if (editing.kind === "embedding" && editing.dimensions !== "") {
      const dimensions = Number(editing.dimensions);
      if (!Number.isInteger(dimensions) || dimensions <= 0) {
        return "Embedding dimensions must be a positive integer.";
      }
    }
    if (editing.provider === "huggingface" && !editing.base_url.trim()) {
      return "A HuggingFace endpoint URL is required.";
    }
    if (editing.is_active && needsApiKey(editing.kind, editing.provider)) {
      if (!editing.has_api_key && !editing.api_key.trim()) {
        return "An API key is required before activating this provider.";
      }
    }
    if (editing._new && editing.is_active && needsApiKey(editing.kind, editing.provider)) {
      if (!editing.api_key.trim()) {
        return "An API key is required before activating this provider.";
      }
    }
    return "";
  }

  async function save() {
    if (!editing) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    const body = {
      provider: editing.provider,
      model: editing.model.trim(),
      base_url: editing.base_url.trim() || null,
      is_active: !!editing.is_active,
    };
    if (editing.kind === "embedding") {
      body.dimensions = editing.dimensions === "" ? null : Number(editing.dimensions);
    }
    if (editing.api_key.trim()) {
      body.api_key = editing.api_key.trim();
    }

    try {
      if (editing._new) {
        body.kind = editing.kind;
        await api("/api/admin/ai-providers", { method: "POST", body });
      } else {
        await api(`/api/admin/ai-providers/${editing.id}`, { method: "PATCH", body });
      }
      setEditing(null);
      setTestResult(null);
      await load();
    } catch (err) {
      setError(err.message || "Could not save the provider");
    } finally {
      setSaving(false);
    }
  }

  async function activate(row) {
    setError("");
    setTestResult(null);
    try {
      await api(`/api/admin/ai-providers/${row.id}`, {
        method: "PATCH",
        body: { is_active: true },
      });
      await load();
    } catch (err) {
      setError(err.message || "Could not activate the provider");
    }
  }

  async function remove(row) {
    if (!window.confirm(`Delete the ${row.provider} ${KIND_LABELS[row.kind]} config?`)) return;
    setError("");
    setTestResult(null);
    try {
      await api(`/api/admin/ai-providers/${row.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message || "Could not delete the provider");
    }
  }

  async function testConfigs() {
    setTesting(true);
    setError("");
    setTestResult(null);
    try {
      const body = await api("/api/admin/ai-providers/test", { method: "POST" });
      setTestResult(body);
    } catch (err) {
      setError(err.message || "Could not test the active providers");
    } finally {
      setTesting(false);
    }
  }

  return (
    <>
      <h1>AI providers</h1>
      <p className="sub">
        The source of truth for RecruAI's LLM and embedding models. One active
        row per kind wins over environment variables; keep a second row
        inactive as a ready fallback.
      </p>

      {error && <div className="alert">{error}</div>}

      {(!active.llm || !active.embedding) && (
        <div className="notice">
          {!active.llm && <div>No active DB-backed LLM. Chat and generation will fall back to environment configuration until one is activated.</div>}
          {!active.embedding && <div>No active DB-backed embedding model. Semantic search and RAG will fall back to environment configuration until one is activated.</div>}
        </div>
      )}

      <div className="toolbar" style={{ padding: 0, border: 0, marginBottom: 8 }}>
        <button className="btn" onClick={testConfigs} disabled={testing}>
          {testing ? "Testing active configs…" : "Test active configs"}
        </button>
        <button className="btn ghost" onClick={load}>Refresh</button>
      </div>

      {testResult && (
        <div className="panel" style={{ padding: 16, marginBottom: 20 }}>
          <div className="section-head" style={{ marginBottom: 10 }}>
            <div>
              <h2>Active config test</h2>
              <p className="section-sub">Provider health and the model RecruAI will use.</p>
            </div>
            <span className={"pill " + (testResult.health?.llm ? "green" : "red")}>
              LLM {testResult.health?.llm ? "healthy" : "unhealthy"}
            </span>
          </div>
          <div className="cards" style={{ marginBottom: 0 }}>
            <div className="card">
              <div className="k">LLM</div>
              <div className="v" style={{ fontSize: 18 }}>{testResult.llm || "none"}</div>
              <div className="s">{testResult.llm_model || "no model reported"}</div>
            </div>
            <div className="card">
              <div className="k">Embedding</div>
              <div className="v" style={{ fontSize: 18 }}>{testResult.embedding || "none"}</div>
              <div className="s">
                {testResult.embedding_model || "no model reported"}
                {testResult.embedding_dimension ? ` · ${testResult.embedding_dimension}d` : ""}
              </div>
            </div>
            <div className="card">
              <div className="k">RAG</div>
              <div className="v" style={{ fontSize: 18 }}>{testResult.rag_enabled ? "enabled" : "disabled"}</div>
              <div className="s">semantic search and retrieval</div>
            </div>
          </div>
          <p className="field-help" style={{ marginBottom: 0 }}>
            LLM health makes a live provider API call. Embedding health is
            configuration-level; run a real embedding job to validate an
            endpoint.
          </p>
        </div>
      )}

      <ProviderSection
        kind="llm"
        rows={byKind.llm}
        active={active.llm}
        onAdd={openCreate}
        onEdit={openEdit}
        onActivate={activate}
        onRemove={remove}
      />
      <ProviderSection
        kind="embedding"
        rows={byKind.embedding}
        active={active.embedding}
        onAdd={openCreate}
        onEdit={openEdit}
        onActivate={activate}
        onRemove={remove}
      />

      {editing && (
        <div className="modal-back" onClick={() => setEditing(null)}>
          <div className="modal wide" onClick={(event) => event.stopPropagation()}>
            <h2>
              {editing._new ? `Add ${KIND_LABELS[editing.kind]} provider` : `Edit ${editing.provider} ${KIND_LABELS[editing.kind]}`}
            </h2>
            <p className="section-sub">
              {editing.is_active
                ? "Activating this config deactivates the current active config of the same kind."
                : "Inactive configs stay available as a fallback."}
            </p>

            <div className="form-grid">
              <div>
                <label>Provider</label>
                <select value={editing.provider} onChange={(event) => setField("provider", event.target.value)}>
                  {PROVIDERS[editing.kind].map((provider) => (
                    <option key={provider} value={provider}>{provider}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Model</label>
                <input
                  value={editing.model}
                  placeholder={MODEL_HINTS[editing.provider] || "model name"}
                  onChange={(event) => setField("model", event.target.value)}
                />
              </div>

              {editing.kind === "embedding" && (
                <div>
                  <label>Dimensions</label>
                  <input
                    type="number"
                    min="1"
                    value={editing.dimensions}
                    onChange={(event) => setField("dimensions", event.target.value)}
                  />
                </div>
              )}

              {editing.provider === "huggingface" && (
                <div className={editing.kind === "embedding" ? "" : "full"}>
                  <label>Endpoint URL</label>
                  <input
                    value={editing.base_url}
                    placeholder="https://your-space.hf.space"
                    onChange={(event) => setField("base_url", event.target.value)}
                  />
                </div>
              )}

              {needsApiKey(editing.kind, editing.provider) && (
                <div className="full">
                  <label>API key</label>
                  <input
                    type="password"
                    value={editing.api_key}
                    placeholder={editing.has_api_key ? "••••••••  leave blank to keep the current key" : "paste the provider API key"}
                    onChange={(event) => setField("api_key", event.target.value)}
                  />
                  <div className="field-help">
                    Keys are stored with deploy-secret obfuscation and only ever
                    shown masked. Leave blank to keep the existing key.
                  </div>
                </div>
              )}

              <label className="checkline full" style={{ marginTop: 0 }}>
                <input
                  type="checkbox"
                  checked={!!editing.is_active}
                  onChange={(event) => setField("is_active", event.target.checked)}
                />
                Make this the active {KIND_LABELS[editing.kind].toLowerCase()} config
              </label>
            </div>

            <div className="actions">
              <button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn" disabled={saving} onClick={save}>
                {saving ? "Saving…" : "Save provider"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProviderSection({ kind, rows, active, onAdd, onEdit, onActivate, onRemove }) {
  return (
    <section className="provider-section">
      <div className="section-head">
        <div>
          <h2>{KIND_LABELS[kind]}s</h2>
          <p className="section-sub">
            {active
              ? `Active: ${active.provider} / ${active.model}`
              : "No active config. RecruAI is using environment fallback."}
          </p>
        </div>
        <button className="btn" onClick={() => onAdd(kind)}>+ Add {KIND_LABELS[kind]}</button>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="grid">
            <thead>
              <tr>
                <th>State</th>
                <th>Provider</th>
                <th>Model</th>
                <th>API key</th>
                <th>Base URL</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className={"pill " + (row.is_active ? "green" : "grey")}>
                      {row.is_active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="mono">{row.provider}</td>
                  <td>
                    <div>{row.model}</div>
                    {row.dimensions ? <div className="field-help" style={{ margin: 0 }}>{row.dimensions}d</div> : null}
                  </td>
                  <td className="mono">{row.has_api_key ? row.api_key || "stored" : "not set"}</td>
                  <td className="mono">{row.base_url || "—"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="btn ghost small" onClick={() => onEdit(row)}>Edit</button>{" "}
                    {!row.is_active && (
                      <>
                        <button className="btn ghost small" onClick={() => onActivate(row)}>Activate</button>{" "}
                        <button className="btn danger small" onClick={() => onRemove(row)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ color: "var(--muted)" }}>
                    No {KIND_LABELS[kind].toLowerCase()} configs yet. Add one to use the
                    DB-backed provider.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

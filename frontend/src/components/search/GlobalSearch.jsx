// Global omnibox search.
//
// Replaces the old decorative read-only search field. One query fans out to
// people, companies and jobs; results are grouped in the dropdown with
// keyboard navigation, and "see all" hands off to the full results page.
//
// Debounced and abortable on purpose: without both, every keystroke fires a
// three-query endpoint and out-of-order responses repaint the list randomly.
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getBackendUrl, getAuthHeaders, getUploadUrl, orgPath } from "../../utils/auth";
import {
  FiSearch, FiX, FiFileText, FiArrowRight, FiCornerDownLeft,
} from "react-icons/fi";

const DEBOUNCE_MS = 250;
const MIN_CHARS = 2;

// Flattened rows so arrow keys move through groups continuously.
function buildRows(data) {
  const rows = [];
  if (data.people?.length) {
    rows.push({ kind: "header", label: "People" });
    data.people.forEach((p) => rows.push({ kind: "person", item: p }));
  }
  if (data.companies?.length) {
    rows.push({ kind: "header", label: "Companies" });
    data.companies.forEach((c) => rows.push({ kind: "company", item: c }));
  }
  if (data.jobs?.length) {
    rows.push({ kind: "header", label: "Jobs" });
    data.jobs.forEach((j) => rows.push({ kind: "job", item: j }));
  }
  return rows;
}

export function resultTarget(kind, item) {
  switch (kind) {
    case "person":
      return `/org/user/${item.id}`;
    case "company":
      return `orgPath(item)`;
    case "job":
      return `/in/jobs/${item.id}`;
    default:
      return "/feed";
  }
}

function subtitleFor(kind, item) {
  if (kind === "person") {
    return item.headline || item.current_position || item.current_company || item.location || "";
  }
  if (kind === "company") {
    return [item.industry, item.location, item.company_size].filter(Boolean).join(" · ");
  }
  return [item.organization_name, item.location, item.employment_type]
    .filter(Boolean)
    .join(" · ");
}

function Avatar({ kind, item }) {
  const url = item.profile_image ? getUploadUrl(item.profile_image) : null;
  if (url) {
    return <img src={url} alt="" className="w-7 h-7 rounded-full object-cover border border-gray-200 shrink-0" />;
  }
  const glyph = kind === "person" ? (item.name || "?").charAt(0).toUpperCase()
    : kind === "company" ? (item.name || "?").charAt(0).toUpperCase()
    : null;
  if (kind === "job") {
    return (
      <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center shrink-0">
        <FiFileText className="w-3.5 h-3.5 text-gray-400" />
      </div>
    );
  }
  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${
        kind === "person" ? "bg-gradient-to-br from-blue-600 to-indigo-700" : "bg-gray-800"
      }`}
    >
      {glyph}
    </div>
  );
}

export default function GlobalSearch({ placeholder = "Search people, companies, jobs..." }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [term, setTerm] = useState("");
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Clear on navigation so a stale dropdown can't follow you around.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Click outside closes.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const run = useCallback((value) => {
    if (abortRef.current) abortRef.current.abort();
    if (value.trim().length < MIN_CHARS) {
      setData(null);
      setLoading(false);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    fetch(`${getBackendUrl()}/api/search?q=${encodeURIComponent(value.trim())}&limit=6`, {
      credentials: "include",
      headers: getAuthHeaders(),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (controller.signal.aborted) return;
        setData(json);
        setActive(0);
        setOpen(true);
      })
      .catch(() => { /* aborted or offline — leave the previous state alone */ })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  }, []);

  // Debounce. `term` is the only dependency so each keystroke schedules one run.
  useEffect(() => {
    const t = setTimeout(() => run(term), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [term, run]);

  const rows = data ? buildRows(data) : [];
  const selectable = rows.filter((r) => r.kind !== "header");

  function go(kind, item) {
    setOpen(false);
    setTerm("");
    navigate(resultTarget(kind, item));
  }

  function submit() {
    if (term.trim().length < MIN_CHARS) return;
    const row = selectable[active];
    if (row) {
      go(row.kind, row.item);
    } else {
      setOpen(false);
      navigate(`/search?q=${encodeURIComponent(term.trim())}`);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) return;
      setActive((i) => (selectable.length ? (i + 1) % selectable.length : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return;
      setActive((i) => (selectable.length ? (i - 1 + selectable.length) % selectable.length : 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  const total = data?.total ?? 0;

  return (
    <div ref={wrapRef} className="relative flex-1 min-w-0">
      <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
      <input
        ref={inputRef}
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onFocus={() => { if (data && term.trim().length >= MIN_CHARS) setOpen(true); }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label="Search"
        role="combobox"
        aria-expanded={open}
        aria-controls="global-search-results"
        aria-autocomplete="list"
        className="w-full h-7 pl-8 pr-7 bg-[#f5f5f5] border border-transparent rounded-md text-xs text-gray-800 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
      />
      {term && (
        <button
          type="button"
          onClick={() => { setTerm(""); setData(null); inputRef.current?.focus(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          aria-label="Clear search"
        >
          <FiX className="w-3 h-3" />
        </button>
      )}

      {open && (
        <div
            id="global-search-results"
            className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-xl shadow-gray-200/50 overflow-hidden z-50"
          >
          {loading && !data ? (
            <p className="px-3.5 py-3 text-xs text-gray-400">Searching…</p>
          ) : total === 0 ? (
            <p className="px-3.5 py-3 text-xs text-gray-500">
              No results for <span className="font-semibold text-gray-800">{term.trim()}</span>
            </p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto py-1" role="listbox">
              {rows.map((row, i) => {
                if (row.kind === "header") {
                  return (
                    <li key={`h-${row.label}`} className="px-3.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {row.label}
                    </li>
                  );
                }
                const selIndex = selectable.indexOf(row);
                const isActive = selIndex === active;
                const sub = subtitleFor(row.kind, row.item);
                return (
                  <li key={`${row.kind}-${row.item.id}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActive(selIndex)}
                      onClick={() => go(row.kind, row.item)}
                      className={`w-full text-left flex items-center gap-2.5 px-3.5 py-1.5 transition-colors ${
                        isActive ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <Avatar kind={row.kind} item={row.item} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {row.kind === "job" ? row.item.title : row.item.name}
                        </p>
                        {sub && <p className="text-[11px] text-gray-500 truncate">{sub}</p>}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {total > 0 && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(`/search?q=${encodeURIComponent(term.trim())}`);
              }}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2 border-t border-gray-100 text-[11.5px] font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <span>See all results for “{term.trim()}”</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {selectable.length > 0 && (
            <p className="px-3.5 py-1.5 border-t border-gray-100 text-[10px] text-gray-400 flex items-center gap-1">
              <FiCornerDownLeft className="w-3 h-3" />
              ↑↓ to navigate · Enter to open · Esc to close
            </p>
          )}
        </div>
      )}
    </div>
  );
}
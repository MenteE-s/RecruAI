import { useState, useEffect, useRef } from "react";
import { FiBriefcase, FiLoader } from "react-icons/fi";
import { getBackendUrl, getUploadUrl, getAuthHeaders } from "../../../utils/auth";

/**
 * LinkedIn-style company input: typing searches platform organizations,
 * picking one links the experience (organization_id); free text stays unlinked.
 * Works inside an uncontrolled <form>: company text via name="company",
 * linked org id via hidden name="organization_id".
 */
export default function CompanySearchInput({
  name = "company",
  orgIdName = "organization_id",
  defaultCompany = "",
  defaultOrg = null,
  required = false,
  placeholder = "Ex: Microsoft",
}) {
  const [text, setText] = useState(defaultCompany || "");
  const [selected, setSelected] = useState(defaultOrg || null);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const search = (value) => {
    setText(value);
    // Retyping after a pick unlinks (same as LinkedIn clearing the company).
    if (selected && value !== selected.name) setSelected(null);
    if (timer.current) clearTimeout(timer.current);
    if (!value || value.trim().length < 2) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${getBackendUrl()}/api/organizations/suggest?q=${encodeURIComponent(value.trim())}&limit=8`,
          { credentials: "include", headers: getAuthHeaders() }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data) ? data : []);
          setOpen(true);
        }
      } catch { /* keep free text on network failure */ }
      finally { setLoading(false); }
    }, 250);
  };

  const pick = (org) => {
    setText(org.name);
    setSelected(org);
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        name={name}
        value={text}
        onChange={(e) => search(e.target.value)}
        onFocus={() => { if (results.length) setOpen(true); }}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className="w-full p-2 pr-8 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
      />
      <input type="hidden" name={orgIdName} value={selected?.id || ""} />
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
        {loading ? <FiLoader className="animate-spin" size={14} /> : selected ? (
          selected.profile_image ? (
            <img src={getUploadUrl(selected.profile_image)} alt="" className="w-5 h-5 rounded object-cover border border-gray-200" />
          ) : (
            <FiBriefcase size={14} className="text-blue-600" />
          )
        ) : null}
      </span>
      {open && results.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
          {results.map((org) => (
            <li key={org.id}>
              <button
                type="button"
                onClick={() => pick(org)}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 text-left"
              >
                {org.profile_image ? (
                  <img src={getUploadUrl(org.profile_image)} alt="" className="w-8 h-8 rounded object-cover border border-gray-200 shrink-0" />
                ) : (
                  <span className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                    <FiBriefcase size={14} className="text-gray-400" />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-900 truncate">{org.name}</span>
                  <span className="block text-xs text-gray-500 truncate">
                    {[org.industry, org.location].filter(Boolean).join(" • ") || "Company"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

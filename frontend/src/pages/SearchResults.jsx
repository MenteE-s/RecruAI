// Full search results, reached from the omnibox's "See all results".
// Groups are tabbed rather than stacked so a long jobs list doesn't bury the
// people you were probably looking for.
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import GlobalSearch, { resultTarget } from "../components/search/GlobalSearch";
import MenteeLoader from "../components/ui/MenteeLoader";
import { getBackendUrl, getAuthHeaders, getUploadUrl } from "../utils/auth";
import {
  FiSearch, FiUser, FiBriefcase, FiFileText, FiClock,
} from "react-icons/fi";

const TABS = [
  { key: "all", label: "All", icon: FiSearch },
  { key: "people", label: "People", icon: FiUser },
  { key: "companies", label: "Companies", icon: FiBriefcase },
  { key: "jobs", label: "Jobs", icon: FiFileText },
];

function Avatar({ item }) {
  const url = item.profile_image ? getUploadUrl(item.profile_image) : null;
  return url ? (
    <img src={url} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0" />
  ) : (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-bold shrink-0 uppercase">
      {(item.name || "?").charAt(0)}
    </div>
  );
}

function Section({ title, items, kind, emptyText }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="text-[13px] font-semibold text-gray-900 mb-2">{title}</h2>
      <ul className="space-y-1.5">
        {items.map((item) => {
          const sub = kind === "person"
            ? item.headline || item.current_position || item.current_company
            : kind === "company"
              ? [item.industry, item.location, item.company_size].filter(Boolean).join(" · ")
              : [item.organization_name, item.location, item.employment_type].filter(Boolean).join(" · ");
          const meta = kind === "person" ? item.location
            : kind === "job" ? item.created_at?.slice(0, 10) : null;

          return (
            <li key={item.id}>
              <Link
                to={resultTarget(kind, item)}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3.5 py-3 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
              >
                {kind === "job" ? (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <FiFileText className="w-4 h-4 text-gray-400" />
                  </div>
                ) : (
                  <Avatar item={item} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">
                    {kind === "job" ? item.title : item.name}
                    {kind === "company" && item.is_public === false && (
                      <span className="ml-2 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded align-middle">
                        PRIVATE
                      </span>
                    )}
                  </p>
                  {sub && <p className="text-[11.5px] text-gray-500 truncate mt-0.5">{sub}</p>}
                  {meta && (
                    <p className="text-[10.5px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <FiClock className="w-3 h-3" /> {meta}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function SearchResults() {
  const [params] = useSearchParams();
  const query = (params.get("q") || "").trim();
  const [tab, setTab] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (query.length < 2) {
      setData(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`${getBackendUrl()}/api/search?q=${encodeURIComponent(query)}&limit=20`, {
      credentials: "include",
      headers: getAuthHeaders(),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setData)
      .catch((e) => { if (e.name !== "AbortError") setError("Search failed. Please try again."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query]);

  const counts = data?.counts ?? { people: 0, companies: 0, jobs: 0 };
  const show = (k) => tab === "all" || tab === k;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/feed" className="text-[12.5px] font-medium text-gray-500 hover:text-gray-900 shrink-0">
              Back
            </Link>
            <GlobalSearch placeholder="Search people, companies, jobs..." />
          </div>
        </div>
      </header>

      <main className="w-full max-w-3xl mx-auto px-4 py-5 pb-10">
        {query.length < 2 ? (
          <p className="text-center text-xs text-gray-400 py-10">
            Type at least two characters to search.
          </p>
        ) : (
          <>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">
              Results for “{query}”
            </h1>
            <p className="text-[11.5px] text-gray-500 mt-0.5 mb-3">
              {loading ? "Searching…" : `${data?.total ?? 0} result${data?.total === 1 ? "" : "s"}`}
            </p>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
              {TABS.map((t) => {
                const n = t.key === "all" ? data?.total ?? 0 : counts[t.key];
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${
                      active
                        ? "border-blue-600 text-blue-700"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                    <span className={`text-[10px] px-1.5 py-px rounded ${active ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] text-red-700">
                {error}
              </p>
            )}

            {loading && <div className="py-10 flex justify-center"><MenteeLoader size={40} /></div>}

            {!loading && data && data.total === 0 && !error && (
              <p className="text-center text-xs text-gray-400 py-10">
                Nothing matched “{query}”.
              </p>
            )}

            <div className="space-y-5">
              {show("people") && <Section title="People" kind="person" items={data?.people ?? []} />}
              {show("companies") && <Section title="Companies" kind="company" items={data?.companies ?? []} />}
              {show("jobs") && <Section title="Jobs" kind="job" items={data?.jobs ?? []} />}
            </div>

            {data?.has_more && (
              <p className="mt-5 text-center text-[11.5px] text-gray-400">
                Showing the top 20 of each type. Narrow your search to see more.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
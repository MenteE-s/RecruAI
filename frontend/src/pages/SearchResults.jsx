// Full search results, reached from the omnibox's "See all results".
// The best match gets a prominent card, then the rest of the matching people,
// companies and job posts are grouped below. Groups stay tabbed so a long jobs
// list doesn't bury the people you were probably looking for.
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import GlobalSearch, { resultTarget } from "../components/search/GlobalSearch";
import MenteeLoader from "../components/ui/MenteeLoader";
import { getBackendUrl, getAuthHeaders, getUploadUrl } from "../utils/auth";
import { bestResult, withoutTopResult } from "../utils/searchRanking";
import {
  FiSearch, FiUser, FiBriefcase, FiFileText, FiClock, FiArrowRight,
} from "react-icons/fi";

const TABS = [
  { key: "all", label: "All", icon: FiSearch },
  { key: "people", label: "People", icon: FiUser },
  { key: "companies", label: "Companies", icon: FiBriefcase },
  { key: "jobs", label: "Job posts", icon: FiFileText },
];

const TYPE_META = {
  person: { label: "Person", cta: "View profile" },
  company: { label: "Company", cta: "View company" },
  job: { label: "Job post", cta: "View job post" },
};

function Avatar({ item, kind, size = "w-10 h-10" }) {
  // People and companies name their image field differently.
  const image = kind === "person" ? item.profile_picture : item.profile_image;
  const url = image ? getUploadUrl(image) : null;
  return url ? (
    <img src={url} alt="" className={`${size} rounded-full object-cover border border-gray-200 shrink-0`} />
  ) : (
    <div className={`${size} rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-bold shrink-0 uppercase`}>
      {(item.name || "?").charAt(0)}
    </div>
  );
}

function ResultAvatar({ item, kind, size = "w-10 h-10" }) {
  if (kind === "job") {
    return (
      <div className={`${size} rounded-lg bg-gray-100 flex items-center justify-center shrink-0`}>
        <FiFileText className="w-4 h-4 text-gray-400" />
      </div>
    );
  }
  return <Avatar item={item} kind={kind} size={size} />;
}

function subtitleFor(kind, item) {
  if (kind === "person") {
    return item.headline || item.current_position || item.current_company || item.location || "";
  }
  if (kind === "company") {
    return [item.industry, item.location, item.company_size].filter(Boolean).join(" · ");
  }
  return [item.organization_name, item.location, item.employment_type].filter(Boolean).join(" · ");
}

function TopResult({ result }) {
  if (!result) return null;
  const { kind, item } = result;
  const meta = TYPE_META[kind];
  const name = kind === "job" ? item.title : item.name;
  const sub = subtitleFor(kind, item);
  const posted = kind === "job" ? item.created_at?.slice(0, 10) : null;

  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Top result
        </h2>
        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
          {meta.label}
        </span>
      </div>
      <Link
        to={resultTarget(kind, item)}
        className="group flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-3.5 hover:border-blue-300 hover:bg-blue-50/20 transition-colors"
      >
        <ResultAvatar item={item} kind={kind} size="w-12 h-12" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-gray-900 truncate">
            {name}
            {kind === "company" && item.is_public === false && (
              <span className="ml-2 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded align-middle">
                PRIVATE
              </span>
            )}
          </p>
          {sub && <p className="text-[12px] text-gray-500 truncate mt-0.5">{sub}</p>}
          {posted && (
            <p className="text-[10.5px] text-gray-400 mt-1 flex items-center gap-1">
              <FiClock className="w-3 h-3" /> Posted {posted}
            </p>
          )}
        </div>
        <span className="hidden sm:flex items-center gap-1.5 text-[12px] font-semibold text-blue-700 shrink-0">
          {meta.cta} <FiArrowRight className="w-3.5 h-3.5" />
        </span>
      </Link>
    </section>
  );
}

function Section({ title, items, kind }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="text-[13px] font-semibold text-gray-900 mb-2">{title}</h2>
      <ul className="space-y-1.5">
        {items.map((item) => {
          const sub = subtitleFor(kind, item);
          const meta = kind === "person" ? item.location
            : kind === "job" ? item.created_at?.slice(0, 10) : null;

          return (
            <li key={item.id}>
              <Link
                to={resultTarget(kind, item)}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3.5 py-3 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
              >
                <ResultAvatar item={item} kind={kind} />
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
  const [params, setSearchParams] = useSearchParams();
  const query = (params.get("q") || "").trim();
  // Filters live in the URL so a narrowed search can be shared or
  // bookmarked; the fetch re-runs when any of them changes.
  const locationFilter = params.get("location") || "";
  const typeFilter = params.get("employment_type") || "";
  const postedFilter = params.get("posted") || "";
  const sortFilter = params.get("sort") || "";
  const [tab, setTab] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locInput, setLocInput] = useState(locationFilter);

  // Debounce the location box into the URL — every keystroke would
  // otherwise fire a three-query search.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (locInput.trim() === (prev.get("location") || "")) return prev;
        if (locInput.trim()) next.set("location", locInput.trim());
        else next.delete("location");
        return next;
      });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locInput]);

  const setParam = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  };

  const clearFilters = () => {
    setLocInput("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      ["location", "employment_type", "posted", "sort"].forEach((k) => next.delete(k));
      return next;
    });
  };

  const anyFilter = Boolean(locationFilter || typeFilter || postedFilter || sortFilter);

  useEffect(() => {
    if (query.length < 2) {
      setData(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({ q: query, limit: "20" });
    if (locationFilter) qs.set("location", locationFilter);
    if (typeFilter) qs.set("employment_type", typeFilter);
    if (postedFilter) qs.set("posted", postedFilter);
    if (sortFilter) qs.set("sort", sortFilter);
    fetch(`${getBackendUrl()}/api/search?${qs.toString()}`, {
      credentials: "include",
      headers: getAuthHeaders(),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setData)
      .catch((e) => { if (e.name !== "AbortError") setError("Search failed. Please try again."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, locationFilter, typeFilter, postedFilter, sortFilter]);

  const counts = data?.counts ?? { people: 0, companies: 0, jobs: 0 };
  const show = (k) => tab === "all" || tab === k;
  const top = loading ? null : bestResult(data, query);
  // On "All", the top result is shown once in its own card instead of being
  // repeated at the head of its group. A specific tab still lists everything.
  const related = (kind, items = []) => (
    tab === "all" ? withoutTopResult(kind, items, top) : items
  );
  const people = related("person", data?.people ?? []);
  const companies = related("company", data?.companies ?? []);
  const jobs = related("job", data?.jobs ?? []);
  const relatedTotal = people.length + companies.length + jobs.length;

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

            {/* Filters — time and location narrow the same query, and living
                them in the URL keeps a narrowed search shareable. */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <input
                value={locInput}
                onChange={(e) => setLocInput(e.target.value)}
                placeholder="Location"
                aria-label="Filter by location"
                className="px-3 py-1.5 text-[12.5px] bg-white border border-gray-200 rounded-full placeholder-gray-400 focus:outline-none focus:border-blue-500 w-36"
              />
              <select
                value={typeFilter}
                onChange={(e) => setParam("employment_type", e.target.value)}
                aria-label="Filter by employment type"
                className="px-2.5 py-1.5 text-[12.5px] bg-white border border-gray-200 rounded-full text-gray-700 focus:outline-none focus:border-blue-500"
              >
                <option value="">All types</option>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
              <select
                value={postedFilter}
                onChange={(e) => setParam("posted", e.target.value)}
                aria-label="Filter by date posted"
                className="px-2.5 py-1.5 text-[12.5px] bg-white border border-gray-200 rounded-full text-gray-700 focus:outline-none focus:border-blue-500"
              >
                <option value="">Any time</option>
                <option value="24h">Past 24 hours</option>
                <option value="week">Past week</option>
                <option value="month">Past month</option>
              </select>
              <select
                value={sortFilter}
                onChange={(e) => setParam("sort", e.target.value)}
                aria-label="Sort results"
                className="px-2.5 py-1.5 text-[12.5px] bg-white border border-gray-200 rounded-full text-gray-700 focus:outline-none focus:border-blue-500"
              >
                <option value="">Most relevant</option>
                <option value="recent">Most recent</option>
              </select>
              {anyFilter && (
                <button
                  onClick={clearFilters}
                  className="text-[12px] font-medium text-blue-600 hover:text-blue-800 px-1"
                >
                  Clear all
                </button>
              )}
            </div>

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
                    }`}>
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
                No people, companies, or job posts matched “{query}”.
              </p>
            )}

            {!loading && tab === "all" && top && <TopResult result={top} />}

            {!loading && tab === "all" && top && relatedTotal > 0 && (
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                Related results
              </p>
            )}

            <div className="space-y-5">
              {show("people") && <Section title="People" kind="person" items={people} />}
              {show("companies") && <Section title="Companies" kind="company" items={companies} />}
              {show("jobs") && <Section title="Job posts" kind="job" items={jobs} />}
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
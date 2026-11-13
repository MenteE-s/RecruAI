// Full search results, reached from the omnibox's "See all results".
// The best match gets a prominent card, then the rest of the matching people,
// companies and job posts are grouped below. Groups stay tabbed so a long jobs
// list doesn't bury the people you were probably looking for.
import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { AppShell, CenterBar } from "../components/layout/AppShell";
import { RailSection } from "../components/layout/RightRail";
import { TipCard } from "../components/layout/UtilityRail";
import GlobalSearch, { resultTarget } from "../components/search/GlobalSearch";
import MenteeLoader from "../components/ui/MenteeLoader";
import EmptyState from "../components/ui/EmptyState";
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

function Avatar({ item, kind, size = "h-10 w-10" }) {
  // People and companies name their image field differently.
  const image = kind === "person" ? item.profile_picture : item.profile_image;
  const url = image ? getUploadUrl(image) : null;
  return url ? (
    <img src={url} alt="" className={`${size} rounded-full object-cover border border-line shrink-0`} />
  ) : (
    <div className={`${size} rounded-full bg-brand-action flex items-center justify-center text-white text-sm font-bold shrink-0 uppercase`}>
      {(item.name || "?").charAt(0)}
    </div>
  );
}

function ResultAvatar({ item, kind, size = "h-10 w-10" }) {
  if (kind === "job") {
    return (
      <div className={`${size} rounded-lg bg-gray-50 dark:bg-gray-25 border border-line flex items-center justify-center shrink-0`}>
        <FiFileText className="h-4 w-4 text-gray-500 dark:text-gray-500" />
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
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500">
          Top result
        </h2>
        <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-text">
          {meta.label}
        </span>
      </div>
      <Link
        to={resultTarget(kind, item)}
        className="group flex items-center gap-4 rounded-xl border border-line bg-surface px-4 py-3.5 transition-colors hover:border-brand/30 hover:bg-brand/5"
      >
        <ResultAvatar item={item} kind={kind} size="h-12 w-12" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-ink truncate">
            {name}
            {kind === "company" && item.is_public === false && (
              <span className="ml-2 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 px-1.5 py-0.5 rounded align-middle">
                PRIVATE
              </span>
            )}
          </p>
          {sub && <p className="text-[12px] text-gray-500 dark:text-gray-500 truncate mt-0.5">{sub}</p>}
          {posted && (
            <p className="text-[10.5px] text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
              <FiClock className="h-3 w-3" /> Posted <span className="font-mono tabular-nums">{posted}</span>
            </p>
          )}
        </div>
        <span className="hidden sm:flex items-center gap-1.5 text-[12px] font-semibold text-brand-text shrink-0">
          {meta.cta} <FiArrowRight className="h-3.5 w-3.5" />
        </span>
      </Link>
    </section>
  );
}

function Section({ title, items, kind }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="text-[13px] font-semibold text-ink mb-2">{title}</h2>
      <ul className="space-y-1.5">
        {items.map((item) => {
          const sub = subtitleFor(kind, item);
          const meta = kind === "person" ? item.location
            : kind === "job" ? item.created_at?.slice(0, 10) : null;

          return (
            <li key={item.id}>
              <Link
                to={resultTarget(kind, item)}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 transition-colors hover:border-brand/30 hover:bg-brand/5"
              >
                <ResultAvatar item={item} kind={kind} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink truncate">
                    {kind === "job" ? item.title : item.name}
                    {kind === "company" && item.is_public === false && (
                      <span className="ml-2 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 px-1.5 py-0.5 rounded align-middle">
                        PRIVATE
                      </span>
                    )}
                  </p>
                  {sub && <p className="text-[11.5px] text-gray-500 dark:text-gray-500 truncate mt-0.5">{sub}</p>}
                  {meta && (
                    <p className="text-[10.5px] text-gray-500 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                      <FiClock className="h-3 w-3" /> <span className="font-mono tabular-nums">{meta}</span>
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
  const [facets, setFacets] = useState({ location: [], type: [], industry: [], category: [] });
  const [matchAll, setMatchAll] = useState(true);

  // Sync locInput if location param in URL changes externally (e.g. clearFilters)
  useEffect(() => {
    setLocInput(locationFilter);
  }, [locationFilter]);

  // Debounce the location box into the URL — only fire when locInput actually
  // differs from the URL param.
  useEffect(() => {
    const currentLoc = params.get("location") || "";
    if (locInput.trim() === currentLoc) {
      return;
    }
    const t = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (locInput.trim()) next.set("location", locInput.trim());
        else next.delete("location");
        return next;
      });
    }, 400);
    return () => clearTimeout(t);
  }, [locInput, params, setSearchParams]);

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

  // Client-side facet options derived from the fetched results. Facets are a
  // Peerlist-style filter rail; they narrow what is *shown* without touching
  // the server query (location/type/posted/sort stay in the URL).
  const facetOptions = useMemo(() => {
    const uniq = (vals) => [...new Set(vals.filter(Boolean))].sort();
    return {
      location: uniq([...people.map((p) => p.location), ...companies.map((c) => c.location), ...jobs.map((j) => j.location)]),
      type: uniq(jobs.map((j) => j.employment_type)),
      industry: uniq(companies.map((c) => c.industry)),
      category: uniq(jobs.map((j) => j.category)),
    };
  }, [people, companies, jobs]);

  const FACET_GET = {
    location: (kind, item) => item.location,
    type: (kind, item) => (kind === "job" ? item.employment_type : null),
    industry: (kind, item) => (kind === "company" ? item.industry : null),
    category: (kind, item) => (kind === "job" ? item.category : null),
  };

  const toggleFacet = (key, value) => {
    setFacets((prev) => {
      const cur = prev[key] || [];
      return { ...prev, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });
  };

  const activeFacetCount = Object.values(facets).reduce((sum, arr) => sum + arr.length, 0);

  const passesFacets = (kind, item) => {
    const active = Object.entries(facets).filter(([, vals]) => vals.length > 0);
    if (active.length === 0) return true;
    const verdicts = active.map(([key, vals]) => {
      const got = FACET_GET[key](kind, item);
      return got ? vals.includes(got) : false;
    });
    return matchAll ? verdicts.every(Boolean) : verdicts.some(Boolean);
  };

  const peopleF = people.filter((p) => passesFacets("person", p));
  const companiesF = companies.filter((c) => passesFacets("company", c));
  const jobsF = jobs.filter((j) => passesFacets("job", j));
  const facetVisible = activeFacetCount > 0;
  const shownTotal = peopleF.length + companiesF.length + jobsF.length;

  const searchRail = (
    <>
      <RailSection
        title="Filters"
        action={
          activeFacetCount + (anyFilter ? 1 : 0) > 0 ? (
            <button
              type="button"
              onClick={() => {
                setFacets({ location: [], type: [], industry: [], category: [] });
                clearFilters();
              }}
              className="text-[11px] font-semibold text-brand-text hover:underline"
            >
              Clear all
            </button>
          ) : null
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Location</label>
            <input
              value={locInput}
              onChange={(e) => setLocInput(e.target.value)}
              placeholder="City or country"
              aria-label="Filter by location"
              className="h-8 rounded-xl border border-line bg-surface px-3 text-[13px] text-ink outline-none transition-colors placeholder:text-gray-500 focus:border-brand focus:ring-4 focus:ring-gray-100/50 dark:focus:ring-gray-600/50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Employment type</label>
            <select
              value={typeFilter}
              onChange={(e) => setParam("employment_type", e.target.value)}
              aria-label="Filter by employment type"
              className="h-8 rounded-xl border border-line bg-surface px-2.5 text-[13px] text-ink outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-gray-100/50 dark:focus:ring-gray-600/50"
            >
              <option value="">All types</option>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
              <option>Internship</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Posted</label>
            <select
              value={postedFilter}
              onChange={(e) => setParam("posted", e.target.value)}
              aria-label="Filter by date posted"
              className="h-8 rounded-xl border border-line bg-surface px-2.5 text-[13px] text-ink outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-gray-100/50 dark:focus:ring-gray-600/50"
            >
              <option value="">Any time</option>
              <option value="24h">Past 24 hours</option>
              <option value="week">Past week</option>
              <option value="month">Past month</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Sort</label>
            <select
              value={sortFilter}
              onChange={(e) => setParam("sort", e.target.value)}
              aria-label="Sort results"
              className="h-8 rounded-xl border border-line bg-surface px-2.5 text-[13px] text-ink outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-gray-100/50 dark:focus:ring-gray-600/50"
            >
              <option value="">Most relevant</option>
              <option value="recent">Most recent</option>
            </select>
          </div>

          {[
            { key: "industry", label: "Industry", options: facetOptions.industry },
            { key: "category", label: "Job category", options: facetOptions.category },
            { key: "type", label: "Type", options: facetOptions.type },
            { key: "location", label: "Where", options: facetOptions.location },
          ].map((group) =>
            group.options.length > 0 ? (
              <div key={group.key} className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{group.label}</label>
                <div className="flex flex-wrap gap-1.5">
                  {group.options.map((opt) => {
                    const selected = (facets[group.key] || []).includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleFacet(group.key, opt)}
                        className={`inline-flex h-7 items-center rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                          selected
                            ? "border-gray-900 bg-gray-900 text-white dark:border-gray-50 dark:bg-gray-50 dark:text-ink"
                            : "border-line bg-surface text-ink hover:bg-gray-50"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null
          )}

          <button
            type="button"
            onClick={() => setMatchAll((m) => !m)}
            className="flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-25"
          >
            <span className="text-[12.5px] font-medium text-ink">Match all facets</span>
            <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${matchAll ? "bg-brand" : "bg-gray-200 dark:bg-gray-700"}`}>
              <span className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${matchAll ? "translate-x-4" : "translate-x-0"}`} />
            </span>
          </button>
        </div>
      </RailSection>
      <TipCard
        title="Facets narrow what you see"
        body="Filters apply to the fetched results. Location, type and posted also refine the query itself."
      />
    </>
  );

  return (
    <AppShell rail={searchRail}>
      <CenterBar title="Search">
        <div className="flex items-center gap-2 px-4 pb-3">
          <Link to="/feed" className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-gray-500 hover:text-ink dark:text-gray-500">
            ← Back
          </Link>
          <div className="min-w-0 flex-1">
            <GlobalSearch placeholder="Search people, companies, jobs..." />
          </div>
        </div>
      </CenterBar>

      <main className="px-4 py-5 pb-10">
        {query.length < 2 ? (
          <EmptyState
            icon={FiSearch}
            title="Search RecruAI"
            body="Type at least two characters to search for people, companies, and job posts."
          />
        ) : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-ink tracking-tight">
                  Results for “{query}”
                </h2>
                <p className="text-[11.5px] text-gray-500 dark:text-gray-500 mt-0.5">
                  {loading ? "Searching…" : `<span className="font-mono tabular-nums">${data?.total ?? 0}</span> result${data?.total === 1 ? "" : "s"}`}
                  {!loading && facetVisible && (
                    <span className="text-brand-text">
                      {" "}· <span className="font-mono tabular-nums">{shownTotal}</span> shown
                    </span>
                  )}
                </p>
              </div>
              {facetVisible && (
                <button
                  type="button"
                  onClick={() => setFacets({ location: [], type: [], industry: [], category: [] })}
                  className="text-[11.5px] font-semibold text-brand-text hover:underline"
                >
                  Clear facets
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-line mb-4 overflow-x-auto">
              {TABS.map((t) => {
                const n = t.key === "all" ? data?.total ?? 0 : counts[t.key];
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-[12.5px] font-semibold -mb-px transition-colors ${
                      active
                        ? "border-brand text-brand-text"
                        : "border-transparent text-gray-500 hover:text-ink dark:text-gray-500"
                    }`}>
                    <t.icon className="h-3.5 w-3.5" />
                    {t.label}
                    <span className={`rounded-full px-1.5 py-px text-[10px] font-mono tabular-nums ${active ? "bg-brand/10 text-brand-text" : "bg-gray-50 text-gray-500 dark:bg-gray-25 dark:text-gray-500"}`}>
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-500/30 dark:bg-red-500/10">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
                <p className="mt-1 text-xs text-red-600 dark:text-red-300">A network or server issue prevented loading results for “{query}”.</p>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSearchParams(new URLSearchParams(params));
                  }}
                  className="mt-3 inline-flex items-center rounded-lg border border-red-300 bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-sm hover:bg-gray-50 dark:border-red-500/40 dark:hover:bg-gray-25"
                >
                  Retry search
                </button>
              </div>
            )}

            {loading && <div className="py-12 flex justify-center"><MenteeLoader size={40} /></div>}

            {!loading && data && data.total === 0 && !error && (
              anyFilter ? (
                <EmptyState
                  icon={FiSearch}
                  title={`No results for “${query}”`}
                  body="No people, companies, or job posts matched your search with the active filters. Try adjusting your query or clearing filters."
                  action={
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink shadow-sm transition-colors hover:border-brand/40 hover:bg-brand/5"
                    >
                      Clear all filters
                    </button>
                  }
                />
              ) : (
                <EmptyState
                  icon={FiSearch}
                  title={`No results for “${query}”`}
                  body="No people, companies, or job posts matched your search. Check for typos or try searching with more general keywords."
                />
              )
            )}

            {!loading && data && data.total > 0 && !error && tab !== "all" && counts[tab] === 0 && (
              <EmptyState
                icon={FiSearch}
                compact
                title={`No ${tab === "jobs" ? "job posts" : tab} found`}
                body={`There are no ${tab === "jobs" ? "job posts" : tab} matching “${query}”.`}
                action={
                  <button
                    type="button"
                    onClick={() => setTab("all")}
                    className="inline-flex items-center rounded-xl border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition-colors hover:border-brand/40 hover:bg-brand/5"
                  >
                    View all results (<span className="font-mono tabular-nums">{data.total}</span>)
                  </button>
                }
              />
            )}

            {!loading && tab === "all" && top && <TopResult result={top} />}

            {!loading && tab === "all" && top && relatedTotal > 0 && (
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-2">
                Related results
              </p>
            )}

            <div className="space-y-5">
              {show("people") && <Section title="People" kind="person" items={peopleF} />}
              {show("companies") && <Section title="Companies" kind="company" items={companiesF} />}
              {show("jobs") && <Section title="Job posts" kind="job" items={jobsF} />}
              {facetVisible && shownTotal === 0 && !loading && (
                <EmptyState
                  icon={FiSearch}
                  compact
                  title="No results match facets"
                  body="Try removing a few facet chips, or widen the location."
                  action={
                    <button
                      type="button"
                      onClick={() => setFacets({ location: [], type: [], industry: [], category: [] })}
                      className="inline-flex items-center rounded-xl border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm transition-colors hover:border-brand/40 hover:bg-brand/5"
                    >
                      Clear facets
                    </button>
                  }
                />
              )}
            </div>

            {data?.has_more && (
              <p className="mt-5 text-center text-[11.5px] text-gray-500 dark:text-gray-500">
                Showing the top 20 of each type. Narrow your search to see more.
              </p>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}

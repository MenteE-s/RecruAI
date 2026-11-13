import { OrgAppShell } from "../../components/layout/OrgAppShell";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getBackendUrl, getUploadUrl, getAuthHeaders } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import EmptyState from "../../components/ui/EmptyState";
import { Avatar } from "../../components/ui/Avatar";
import {
  Users,
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Briefcase,
} from "lucide-react";
import EmploymentBadge, { employmentMeta } from "../../components/ui/EmploymentStatus";
import AnimatedNumber from "../../components/motion/AnimatedNumber";
import { SkeletonCard, SkeletonStatGrid } from "../../components/motion/SmartSkeleton";

const MATCH_COLORS = {
  excellent: {
    badge: "bg-brand/10 text-brand-text border-brand/20",
    bar: "bg-brand",
    dot: "bg-brand",
  },
  good: {
    badge:
      "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20",
    bar: "bg-teal-500",
    dot: "bg-teal-500",
  },
  possible: {
    badge:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
  },
  poor: {
    badge:
      "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-25 dark:text-gray-500 dark:border-line",
    bar: "bg-gray-400 dark:bg-gray-50",
    dot: "bg-gray-400",
  },
};

export default function HirePeople() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [searchMode, setSearchMode] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [explainingUser, setExplainingUser] = useState(null);
  const [empStatusFilter, setEmpStatusFilter] = useState("");
  const [expFilter, setExpFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const lastSearchedQuery = useRef("");
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const lastSearchKey = useRef("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getBackendUrl()}/api/users`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const result = await res.json();
        const individuals = (result.data || []).filter((u) => u.role === "individual");
        setUsers(individuals);
        setFilteredUsers(individuals);
      } else {
        setError("Failed to load users");
        showToast("Failed to load candidates", "error");
      }
    } catch {
      setError("Network error. Please try again.");
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const parseExpFilter = (v) => {
    if (!v) return {};
    const parts = v.split("-").map(Number);
    const out = {};
    if (!Number.isNaN(parts[0])) out.min_exp = parts[0];
    if (parts[1]) out.max_exp = parts[1];
    return out;
  };

  const triggerSearch = useCallback(
    async (searchQuery, page = 1, filterOverrides = {}) => {
      if (!searchQuery || !searchQuery.trim()) {
        setSearchMode(false);
        setAiResults(null);
        return;
      }
      const emp =
        filterOverrides.empStatusFilter !== undefined
          ? filterOverrides.empStatusFilter
          : empStatusFilter;
      const exp =
        filterOverrides.expFilter !== undefined ? filterOverrides.expFilter : expFilter;
      const pln =
        filterOverrides.planFilter !== undefined ? filterOverrides.planFilter : planFilter;
      const key = JSON.stringify({ q: searchQuery, page, emp, exp, pln });
      if (key === lastSearchKey.current) return;
      lastSearchKey.current = key;
      lastSearchedQuery.current = searchQuery;
      setExplanations({});
      setExpandedRow(null);
      setIsSearching(true);
      setSearchMode(true);
      setCurrentPage(page);
      try {
        const res = await fetch(`${getBackendUrl()}/api/recommendations/search`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            query: searchQuery,
            top_k: 50,
            page,
            per_page: pageSize,
            min_similarity: 0.15,
            filters: {
              employment_status: emp || undefined,
              plan: pln || undefined,
              ...parseExpFilter(exp),
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setAiResults(data.results || []);
          setFilteredUsers(data.results || []);
          setSearchTotal(data.total || 0);
          setSearchTotalPages(data.total_pages || 1);
          setCurrentPage(data.page || page);
        } else {
          showToast(
            (await res.json().catch(() => ({}))).error || "Search failed. Try again.",
            "error"
          );
          setSearchMode(false);
          setAiResults(null);
        }
      } catch {
        showToast("Search request failed. Is the backend running?", "error");
        setSearchMode(false);
        setAiResults(null);
      } finally {
        setIsSearching(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [empStatusFilter, expFilter, planFilter]
  );

  const loadExplanation = useCallback(async (userId, searchQuery) => {
    if (explainingUser) return;
    setExplainingUser(userId);
    try {
      const res = await fetch(`${getBackendUrl()}/api/recommendations/explain`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ user_id: userId, query: searchQuery }),
      });
      if (res.ok) {
        const data = await res.json();
        setExplanations((prev) => ({ ...prev, [userId]: data }));
      } else showToast("Failed to load AI analysis", "error");
    } catch {
      showToast("Network error. Try again.", "error");
    } finally {
      setExplainingUser(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!searchMode) {
      let list = [...users];
      if (empStatusFilter)
        list = list.filter(
          (u) => (u.employment_status || "").toLowerCase() === empStatusFilter.toLowerCase()
        );
      if (planFilter)
        list = list.filter((u) => (u.plan || "").toLowerCase() === planFilter.toLowerCase());
      setFilteredUsers(list);
    }
  }, [empStatusFilter, planFilter, searchMode, users]);

  const totalPages = searchMode
    ? searchTotalPages
    : Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginated = searchMode
    ? filteredUsers
    : filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const clearSearch = () => {
    setQuery("");
    setSearchMode(false);
    setAiResults(null);
    setExpandedRow(null);
    setExplanations({});
    setSearchTotal(0);
    setSearchTotalPages(1);
    lastSearchedQuery.current = "";
    lastSearchKey.current = "";
  };

  const viewProfile = (userId) => navigate(`/org/user/${userId}`);
  const getUserId = (c) => c.user_id || c.id;

  const MatchBadge = ({ level, similarity }) => {
    const colors = MATCH_COLORS[level] || MATCH_COLORS.poor;
    return (
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colors.badge}`}
        >
          {level.charAt(0).toUpperCase() + level.slice(1)}
        </span>
        <div className="hidden items-center gap-1.5 sm:flex">
          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-25">
            <div
              className={`h-1.5 rounded-full ${colors.bar}`}
              style={{ width: `${Math.min(100, (similarity || 0) * 100)}%` }}
            />
          </div>
          <span className="w-8 font-mono tabular-nums text-xs font-medium text-gray-500 dark:text-gray-500">
            <AnimatedNumber
              value={(similarity || 0) * 100}
              format={{ maximumFractionDigits: 0 }}
              suffix="%"
            />
          </span>
        </div>
      </div>
    );
  };

  const selectCls =
    "h-9 rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-900/60 px-3 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-brand/10";

  if (loading) {
    return (
      <OrgAppShell>
        <div className="space-y-4 px-4 py-4">
          <SkeletonCard className="h-32" />
          <SkeletonStatGrid count={3} />
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </OrgAppShell>
    );
  }

  return (
    <OrgAppShell>
      <div className="space-y-4 px-4 py-4">
        {/* Header card */}
        <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-5 shadow-s5">
          <h1 className="text-[20px] font-semibold leading-7 text-ink">Discover top talent</h1>
          <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-500">
            Describe the candidate profile and let vector embeddings match top candidates from your pool.
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line dark:border-line bg-gray-50 dark:bg-gray-25 px-2.5 py-1 text-gray-600 dark:text-gray-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
              <span className="font-mono tabular-nums">
                <AnimatedNumber value={searchMode ? searchTotal : filteredUsers.length} />
              </span>{" "}
              candidates
            </span>
            {searchMode && aiResults && (
              <span className="inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-2.5 py-1 font-semibold text-brand-text">
                Semantic AI match
              </span>
            )}
          </div>
        </div>

        {/* Search + filters card */}
        <div className="rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 p-4 shadow-s5">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-600" strokeWidth={1.75} />
              <Input
                type="text"
                placeholder='Try "Senior React developer with Node.js experience"…'
                value={query}
                onKeyDown={(e) => {
                  if (e.key === "Enter") triggerSearch(query);
                }}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-28"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-24 top-1/2 -translate-y-1/2 rounded-xl p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-ink dark:bg-transparent dark:hover:bg-gray-25"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" strokeWidth={1.75} />
                </button>
              )}
              <Button
                variant="primary"
                size="sm"
                className="absolute right-1.5 top-1.5 bottom-1.5"
                onClick={() => triggerSearch(query)}
                disabled={isSearching || !query.trim()}
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : "Search"}
              </Button>
            </div>
          </div>
          {isSearching && (
            <p className="mt-3 flex items-center gap-2 text-sm text-brand-text font-medium">
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> AI is matching candidate embeddings…
            </p>
          )}
          {searchMode && aiResults && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-500">
                Found <span className="font-mono tabular-nums">{searchTotal}</span> matching candidate(s)
              </span>
              <button
                type="button"
                onClick={clearSearch}
                className="text-xs font-semibold text-ink transition-colors hover:text-brand-text"
              >
                Show all candidates
              </button>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              aria-label="Employment status filter"
              value={empStatusFilter}
              onChange={(e) => {
                const v = e.target.value;
                setEmpStatusFilter(v);
                if (searchMode && query.trim()) triggerSearch(query, 1, { empStatusFilter: v });
                else setCurrentPage(1);
              }}
              className={selectCls}
            >
              <option value="">All employment statuses</option>
              <option value="unemployed">Unemployed</option>
              <option value="working">Working</option>
              <option value="hired">Hired</option>
              <option value="onboarding">Onboarding</option>
            </select>
            <select
              aria-label="Experience level filter"
              value={expFilter}
              onChange={(e) => {
                const v = e.target.value;
                setExpFilter(v);
                if (searchMode && query.trim()) triggerSearch(query, 1, { expFilter: v });
                else setCurrentPage(1);
              }}
              className={selectCls}
            >
              <option value="">All experience levels</option>
              <option value="0-2">Junior (0–2 yrs)</option>
              <option value="3-5">Mid-level (3–5 yrs)</option>
              <option value="5-">Senior (5+ yrs)</option>
            </select>
            <select
              aria-label="Plan filter"
              value={planFilter}
              onChange={(e) => {
                const v = e.target.value;
                setPlanFilter(v);
                if (searchMode && query.trim()) triggerSearch(query, 1, { planFilter: v });
                else setCurrentPage(1);
              }}
              className={selectCls}
            >
              <option value="">All member tiers</option>
              <option value="trial">Trial</option>
              <option value="pro">Pro</option>
            </select>
          </div>
        </div>

        {/* Results table card */}
        <div className="overflow-hidden rounded-xl border border-line dark:border-line bg-surface dark:bg-gray-25 shadow-s5">
          {paginated.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No candidates found"
              body={query ? "Try adjusting your search criteria" : "No candidates currently registered"}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-line dark:border-line bg-gray-50 dark:bg-gray-25 text-left">
                      <th className="w-[28%] min-w-[240px] px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-500">
                        Candidate
                      </th>
                      <th className="w-[15%] min-w-[125px] whitespace-nowrap px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-500">
                        Status
                      </th>
                      <th className="hidden w-[12%] min-w-[105px] whitespace-nowrap px-4 py-3 text-xs font-semibold text-gray-500 sm:table-cell dark:text-gray-500">
                        Experience
                      </th>
                      <th className="hidden w-[18%] min-w-[160px] px-4 py-3 text-xs font-semibold text-gray-500 lg:table-cell dark:text-gray-500">
                        Skills
                      </th>
                      <th className="w-[15%] min-w-[130px] whitespace-nowrap px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-500">
                        Match
                      </th>
                      <th className="w-[12%] min-w-[112px] whitespace-nowrap px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line dark:divide-line">
                    {paginated.map((candidate) => {
                      const cid = getUserId(candidate);
                      const isExpanded = expandedRow === cid;
                      return (
                        <tr
                          key={cid}
                          onClick={() => viewProfile(cid)}
                          className={`cursor-pointer transition-colors ${
                            isExpanded ? "bg-gray-50 dark:bg-gray-25/80" : "hover:bg-gray-50 dark:hover:bg-gray-25/60"
                          }`}
                        >
                          <td className="min-w-[240px] px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="shrink-0">
                                {candidate.profile_picture ? (
                                  <img
                                    src={getUploadUrl(candidate.profile_picture)}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                    className={`h-9 w-9 rounded-full border border-line dark:border-line object-cover ring-2 ${
                                      employmentMeta(candidate.employment_status).ring
                                    }`}
                                  />
                                ) : (
                                  <div
                                    className={`rounded-full ring-2 ${
                                      employmentMeta(candidate.employment_status).ring
                                    }`}
                                  >
                                    <Avatar name={candidate.name || "?"} size="md" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="break-words text-sm font-semibold leading-snug text-ink">
                                  {candidate.name || "Anonymous"}
                                </p>
                                <p className="line-clamp-2 break-words text-xs leading-normal text-gray-500 dark:text-gray-500">
                                  {candidate.headline || candidate.current_position || "—"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="min-w-[125px] whitespace-nowrap px-4 py-3">
                            <EmploymentBadge status={candidate.employment_status} />
                          </td>
                          <td className="hidden min-w-[105px] whitespace-nowrap px-4 py-3 text-xs text-gray-600 sm:table-cell dark:text-gray-600">
                            <span className="font-mono tabular-nums">
                              {candidate.experience_years
                                ? `${candidate.experience_years.toFixed(1)} yrs`
                                : "—"}
                            </span>
                            {candidate.education_level && (
                              <span className="ml-1 text-gray-500 dark:text-gray-500">
                                ({candidate.education_level.split(" ").slice(0, 2).join(" ")})
                              </span>
                            )}
                          </td>
                          <td className="hidden min-w-[160px] px-4 py-3 lg:table-cell">
                            <div className="flex max-w-[220px] flex-wrap gap-1">
                              {(() => {
                                const displaySkills = candidate.matching_skills?.length
                                  ? candidate.matching_skills
                                  : candidate.skills?.length
                                  ? candidate.skills
                                  : [];
                                return displaySkills
                                  .slice(0, 3)
                                  .map((s, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex whitespace-nowrap rounded-lg border border-line dark:border-line bg-gray-50 dark:bg-gray-25 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-700"
                                    >
                                      {s}
                                    </span>
                                  ));
                              })()}
                              {candidate.skills_count > 0 &&
                                !candidate.matching_skills?.length &&
                                !candidate.skills?.length && (
                                  <span className="font-mono tabular-nums text-xs text-gray-500 dark:text-gray-500">
                                    {candidate.skills_count} skills
                                  </span>
                                )}
                            </div>
                          </td>
                          <td className="min-w-[130px] whitespace-nowrap px-4 py-3">
                            <MatchBadge
                              level={candidate.match_level || "possible"}
                              similarity={candidate.similarity || 0}
                            />
                          </td>
                          <td className="min-w-[112px] whitespace-nowrap px-4 py-3 text-center">
                            <div className="flex shrink-0 items-center justify-center gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 px-0 rounded-xl hover:bg-gray-100 dark:bg-transparent dark:hover:bg-gray-25"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewProfile(cid);
                                }}
                                title="View profile"
                                aria-label={`View ${candidate.name || "candidate"}`}
                              >
                                <Eye className="h-4 w-4" strokeWidth={1.75} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 px-0 rounded-xl text-brand-text hover:bg-brand/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/org/candidate-analysis/${cid}`);
                                }}
                                title="Candidate analysis"
                                aria-label={`Analysis for ${candidate.name || "candidate"}`}
                              >
                                <Briefcase className="h-4 w-4" strokeWidth={1.75} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 px-0 rounded-xl hover:bg-gray-100 dark:bg-transparent dark:hover:bg-gray-25"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isExpanded) setExpandedRow(null);
                                  else {
                                    setExpandedRow(cid);
                                    loadExplanation(cid, query);
                                  }
                                }}
                                aria-label={isExpanded ? "Collapse analysis" : "Expand analysis"}
                              >
                                {explainingUser === cid ? (
                                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                                ) : isExpanded ? (
                                  <ChevronUp className="h-4 w-4" strokeWidth={1.75} />
                                ) : (
                                  <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {expandedRow && (
                <div className="border-t border-line dark:border-line bg-gray-50 dark:bg-gray-25/80 px-5 py-4">
                  {(() => {
                    const candidate = filteredUsers.find((u) => getUserId(u) === expandedRow);
                    const explanation = explanations[expandedRow];
                    if (!candidate) return null;
                    const level = explanation?.match_level || candidate.match_level || "possible";
                    const colors = MATCH_COLORS[level] || MATCH_COLORS.poor;
                    return (
                      <div className="flex gap-3">
                        <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${colors.dot}`} />
                        <div>
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-500">
                            AI match explanation
                          </p>
                          {explanation ? (
                            <>
                              <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-600">
                                {explanation.explanation}
                              </p>
                              {explanation.matching_skills?.length > 0 && (
                                <div className="mt-2.5 flex flex-wrap gap-1.5">
                                  {explanation.matching_skills.map((s, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex rounded-lg border border-line dark:border-line bg-surface dark:bg-gray-25 px-2.5 py-1 text-xs text-gray-700 dark:text-gray-700"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="mt-1 text-sm italic text-gray-500 dark:text-gray-500">
                              Analyzing candidate compatibility…
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-line dark:border-line bg-surface dark:bg-gray-25 px-5 py-4">
                  <span className="font-mono tabular-nums text-xs text-gray-600 dark:text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (searchMode) triggerSearch(query, Math.max(1, currentPage - 1));
                        else setCurrentPage((p) => Math.max(1, p - 1));
                      }}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      return (
                        <Button
                          key={pageNum}
                          variant="secondary"
                          size="sm"
                          className={`min-w-[32px] px-2.5 font-mono tabular-nums ${
                            currentPage === pageNum
                              ? "border-gray-900 text-ink dark:border-gray-100 dark:text-gray-0 pointer-events-none"
                              : ""
                          }`}
                          onClick={() => {
                            if (searchMode) triggerSearch(query, pageNum);
                            else setCurrentPage(pageNum);
                          }}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (searchMode) triggerSearch(query, Math.min(totalPages, currentPage + 1));
                        else setCurrentPage((p) => Math.min(totalPages, p + 1));
                      }}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </OrgAppShell>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import OrganizationNavbar from "../../components/layout/OrganizationNavbar";
import Card from "../../components/ui/Card";
import {
  getSidebarItems,
  getBackendUrl,
  getUploadUrl,
  getAuthHeaders,
} from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import {
  FiUser,
  FiUsers,
  FiSearch,
  FiEye,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiLoader,
} from "react-icons/fi";

const MATCH_COLORS = {
  excellent: {
    badge: "bg-green-100 text-green-800",
    bar: "bg-green-500",
    dot: "bg-green-500",
  },
  good: {
    badge: "bg-blue-100 text-blue-800",
    bar: "bg-blue-500",
    dot: "bg-blue-500",
  },
  possible: {
    badge: "bg-yellow-100 text-yellow-800",
    bar: "bg-yellow-500",
    dot: "bg-yellow-500",
  },
  poor: {
    badge: "bg-gray-100 text-gray-800",
    bar: "bg-gray-300",
    dot: "bg-gray-400",
  },
};

export default function HirePeople() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [searchMode, setSearchMode] = useState(false);

  const [expandedRow, setExpandedRow] = useState(null);

  const [empStatusFilter, setEmpStatusFilter] = useState("");
  const [expFilter, setExpFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const lastSearchedQuery = useRef("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getBackendUrl()}/api/users`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const result = await response.json();
        const individualUsers = (result.data || []).filter(
          (u) => u.role === "individual"
        );
        setUsers(individualUsers);
        setFilteredUsers(individualUsers);
      } else {
        setError("Failed to load users");
      showToast("Failed to load candidates", "error");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const triggerSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) {
      setSearchMode(false);
      setAiResults(null);
      return;
    }
    if (searchQuery === lastSearchedQuery.current) return;
    lastSearchedQuery.current = searchQuery;
    setIsSearching(true);
    setSearchMode(true);
    setCurrentPage(1);
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/recommendations/search`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ query: searchQuery, top_k: 50 }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setAiResults(data.results || []);
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || "Search failed. Try again.", "error");
        setSearchMode(false);
        setAiResults(null);
      }
    } catch (err) {
      showToast("Search request failed. Is the backend running?", "error");
      setSearchMode(false);
      setAiResults(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const performSearch = useCallback((q) => triggerSearch(q), [triggerSearch]);

  useEffect(() => {
    if (debouncedQuery) {
      triggerSearch(debouncedQuery);
    } else {
      setSearchMode(false);
      setAiResults(null);
    }
  }, [debouncedQuery, triggerSearch]);

  useEffect(() => {
    if (searchMode && aiResults) {
      let list = [...aiResults];
      if (empStatusFilter) {
        list = list.filter(
          (u) =>
            (u.employment_status || "").toLowerCase() ===
            empStatusFilter.toLowerCase()
        );
      }
      if (expFilter) {
        const [min, max] = expFilter.split("-").map(Number);
        list = list.filter((u) => {
          const yrs = u.experience_years || 0;
          if (max) return yrs >= min && yrs <= max;
          return yrs >= min;
        });
      }
      if (planFilter) {
        list = list.filter(
          (u) => (u.plan || "").toLowerCase() === planFilter.toLowerCase()
        );
      }
      setFilteredUsers(list);
    } else if (!searchMode) {
      let list = [...users];
      if (empStatusFilter) {
        list = list.filter(
          (u) =>
            (u.employment_status || "").toLowerCase() ===
            empStatusFilter.toLowerCase()
        );
      }
      if (planFilter) {
        list = list.filter(
          (u) => (u.plan || "").toLowerCase() === planFilter.toLowerCase()
        );
      }
      setFilteredUsers(list);
    }
  }, [empStatusFilter, expFilter, planFilter, searchMode, aiResults, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginated = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const clearSearch = () => {
    setQuery("");
    setDebouncedQuery("");
    setSearchMode(false);
    setAiResults(null);
    setExpandedRow(null);
    lastSearchedQuery.current = "";
  };

  const viewProfile = (userId) => {
    navigate(`/organization/user/${userId}`);
  };

  const getUserId = (candidate) => candidate.user_id || candidate.id;

  const MatchBadge = ({ level, similarity }) => {
    const colors = MATCH_COLORS[level] || MATCH_COLORS.poor;
    return (
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors.badge}`}
        >
          {level.charAt(0).toUpperCase() + level.slice(1)}
        </span>
        <div className="hidden lg:flex items-center gap-1.5">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${colors.bar}`}
              style={{ width: `${Math.min(100, (similarity || 0) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 w-10">
            {((similarity || 0) * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    );
  };

  const SkillTag = ({ skill }) => (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 mr-1 mb-1">
      {skill}
    </span>
  );

  if (loading) {
    return (
      <DashboardLayout
        NavbarComponent={OrganizationNavbar}
        sidebarItems={sidebarItems}
      >
        <div className="flex justify-center items-center py-20">
          <div className="text-center animate-pulse">
            <div className="w-8 h-8 mx-auto mb-4 rounded-full bg-gray-300" />
            <div className="text-gray-500">Loading candidates...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      NavbarComponent={OrganizationNavbar}
      sidebarItems={sidebarItems}
    >
      <div className="mb-8">
        <div className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold font-display text-gray-900 mb-2">
                Discover Top Talent
              </h1>
              <p className="text-gray-500 mb-4">
                Describe the ideal candidate and let AI find the best matches
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  <span className="text-gray-600">
                    {filteredUsers.length} candidates
                  </span>
                </div>
                {searchMode && aiResults && (
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                    <span className="text-gray-600">
                      AI ranked results
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="mb-8">
        <div className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                placeholder='Try "Senior React developer with Node.js experience"...'
                value={query}
                onKeyDown={(e) => {
                  if (e.key === "Enter") triggerSearch(query);
                }}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-36 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute right-24 top-3 text-gray-400 hover:text-gray-600"
                >
                  <FiX size={18} />
                </button>
              )}
              <button
                onClick={() => triggerSearch(query)}
                disabled={isSearching || !query.trim()}
                className="absolute right-1 top-1 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isSearching ? (
                  <FiLoader className="animate-spin inline" size={16} />
                ) : (
                  "Search"
                )}
              </button>
            </div>
          </div>

          {isSearching && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <FiLoader className="animate-spin" />
              <span>AI is analyzing candidates...</span>
            </div>
          )}

          {searchMode && aiResults && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Found {aiResults.length} candidates for this search
              </span>
              <button
                onClick={clearSearch}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Show all candidates
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <select
              value={empStatusFilter}
              onChange={(e) => {
                setEmpStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="unemployed">Unemployed</option>
              <option value="working">Working</option>
              <option value="hired">Hired</option>
              <option value="onboarding">Onboarding</option>
            </select>
            <select
              value={expFilter}
              onChange={(e) => {
                setExpFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Experience</option>
              <option value="0-2">Junior (0-2 yrs)</option>
              <option value="3-5">Mid (3-5 yrs)</option>
              <option value="5-">Senior (5+ yrs)</option>
            </select>
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Plans</option>
              <option value="trial">Trial</option>
              <option value="pro">Pro</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {paginated.length === 0 ? (
          <div className="text-center py-16">
            <FiUsers size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Candidates Found
            </h3>
            <p className="text-gray-500 text-sm">
              {query
                ? "Try a different search query"
                : "No candidates available at the moment"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-700 text-white">
                    <th className="text-left px-4 py-3 font-semibold">
                      Candidate
                    </th>
                    <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">
                      Experience
                    </th>
                    <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">
                      Skills
                    </th>
                    <th className="text-left px-4 py-3 font-semibold">
                      Match
                    </th>
                    <th className="text-center px-4 py-3 font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginated.map((candidate) => {
                    const colors =
                      MATCH_COLORS[candidate.match_level] ||
                      MATCH_COLORS.poor;
                    const cid = getUserId(candidate);
                    const isExpanded = expandedRow === cid;
                    return (
                      <tr
                        key={cid}
                        className={`hover:bg-gray-50 transition-colors ${
                          isExpanded ? "bg-gray-50" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {candidate.profile_picture ? (
                                <img
                                  src={getUploadUrl(candidate.profile_picture)}
                                  alt=""
                                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">
                                    {(candidate.name || "?")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {candidate.name || "Anonymous"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {candidate.current_position || "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              candidate.employment_status === "unemployed"
                                ? "bg-green-50 text-green-700"
                                : candidate.employment_status === "working" ||
                                  candidate.employment_status === "hired"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-gray-50 text-gray-600"
                            }`}
                          >
                            {candidate.employment_status || "unknown"}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-gray-700">
                            {candidate.experience_years
                              ? `${candidate.experience_years.toFixed(1)} yrs`
                              : "—"}
                          </span>
                          {candidate.education_level && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({candidate.education_level.split(" ").slice(0, 2).join(" ")})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-wrap max-w-[200px]">
                            {(() => {
                              const displaySkills =
                                (candidate.matching_skills && candidate.matching_skills.length > 0
                                  ? candidate.matching_skills
                                  : candidate.skills && candidate.skills.length > 0
                                  ? candidate.skills
                                  : []);
                              return displaySkills.slice(0, 4).map((skill, i) => (
                                <SkillTag key={i} skill={skill} />
                              ));
                            })()}
                            {candidate.skills_count > 0 &&
                              !candidate.matching_skills?.length &&
                              !candidate.skills?.length && (
                                <span className="text-xs text-gray-500">
                                  {candidate.skills_count} skills
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <MatchBadge
                            level={candidate.match_level || "possible"}
                            similarity={candidate.similarity || 0}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => viewProfile(cid)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Profile"
                            >
                              <FiEye size={16} />
                            </button>
                            {candidate.explanation && (
                              <button
                                onClick={() =>
                                  setExpandedRow(
                                    isExpanded ? null : cid
                                  )
                                }
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                title="AI Explanation"
                              >
                                {isExpanded ? (
                                  <FiChevronUp size={16} />
                                ) : (
                                  <FiChevronDown size={16} />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {expandedRow && (
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                  {(() => {
                  const candidate = filteredUsers.find(
                    (u) => getUserId(u) === expandedRow
                  );
                  if (!candidate || !candidate.explanation) return null;
                  const colors =
                    MATCH_COLORS[candidate.match_level] ||
                    MATCH_COLORS.poor;
                  return (
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${colors.dot}`}
                      />
                      <div>
                        <div className="text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                          AI Match Analysis
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {candidate.explanation}
                        </p>
                        {candidate.matching_skills && candidate.matching_skills.length > 0 && (
                          <div className="mt-2 flex flex-wrap">
                            {candidate.matching_skills.map((skill, i) => (
                              <SkillTag key={i} skill={skill} />
                            ))}
                          </div>
                        )}
                        {(!candidate.matching_skills || candidate.matching_skills.length === 0) &&
                         candidate.skills && candidate.skills.length > 0 && (
                          <div className="mt-2 flex flex-wrap">
                            {candidate.skills.map((skill, i) => (
                              <SkillTag key={i} skill={skill} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
                  >
                    Previous
                  </button>
                  {Array.from(
                    { length: Math.min(5, totalPages) },
                    (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 text-sm border rounded-lg ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </DashboardLayout>
  );
}

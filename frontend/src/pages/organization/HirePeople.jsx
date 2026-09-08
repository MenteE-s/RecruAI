import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, getBackendUrl, getUploadUrl, getAuthHeaders } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import { FiUsers, FiSearch, FiEye, FiChevronDown, FiChevronUp, FiX, FiLoader, FiBriefcase, FiStar, FiMapPin, FiAward } from "react-icons/fi";

const MATCH_COLORS = {
  excellent: { badge: "bg-green-50 text-green-700 border-green-200", bar: "bg-green-600", dot: "bg-green-500" },
  good: { badge: "bg-blue-50 text-blue-700 border-blue-200", bar: "bg-blue-600", dot: "bg-blue-500" },
  possible: { badge: "bg-amber-50 text-amber-700 border-amber-200", bar: "bg-amber-500", dot: "bg-amber-500" },
  poor: { badge: "bg-gray-50 text-gray-600 border-gray-200", bar: "bg-gray-300", dot: "bg-gray-400" },
};

export default function HirePeople() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  const loadUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${getBackendUrl()}/api/users`, { credentials: "include", headers: getAuthHeaders() });
      if (res.ok) {
        const result = await res.json();
        const individuals = (result.data || []).filter((u) => u.role === "individual");
        setUsers(individuals); setFilteredUsers(individuals);
      } else { setError("Failed to load users"); showToast("Failed to load candidates", "error"); }
    } catch { setError("Network error. Please try again."); showToast("Network error. Please try again.", "error"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  const triggerSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) { setSearchMode(false); setAiResults(null); return; }
    if (searchQuery === lastSearchedQuery.current) return;
    lastSearchedQuery.current = searchQuery;
    setExplanations({}); setExpandedRow(null); setIsSearching(true); setSearchMode(true); setCurrentPage(1);
    try {
      const res = await fetch(`${getBackendUrl()}/api/recommendations/search`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body: JSON.stringify({ query: searchQuery, top_k: 50 }) });
      if (res.ok) setAiResults((await res.json()).results || []);
      else { showToast((await res.json().catch(() => ({}))).error || "Search failed. Try again.", "error"); setSearchMode(false); setAiResults(null); }
    } catch { showToast("Search request failed. Is the backend running?", "error"); setSearchMode(false); setAiResults(null); }
    finally { setIsSearching(false); }
  }, []);

  const loadExplanation = useCallback(async (userId, searchQuery) => {
    if (explainingUser) return;
    setExplainingUser(userId);
    try {
      const res = await fetch(`${getBackendUrl()}/api/recommendations/explain`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body: JSON.stringify({ user_id: userId, query: searchQuery }) });
      if (res.ok) setExplanations((prev) => ({ ...prev, [userId]: await res.json() }));
      else showToast("Failed to load AI analysis", "error");
    } catch { showToast("Network error. Try again.", "error"); }
    finally { setExplainingUser(null); }
  }, []);

  useEffect(() => {
    if (searchMode && aiResults) {
      let list = [...aiResults];
      if (empStatusFilter) list = list.filter((u) => (u.employment_status || "").toLowerCase() === empStatusFilter.toLowerCase());
      if (expFilter) { const [min, max] = expFilter.split("-").map(Number); list = list.filter((u) => { const yrs = u.experience_years || 0; if (max) return yrs >= min && yrs <= max; return yrs >= min; }); }
      if (planFilter) list = list.filter((u) => (u.plan || "").toLowerCase() === planFilter.toLowerCase());
      setFilteredUsers(list);
    } else if (!searchMode) {
      let list = [...users];
      if (empStatusFilter) list = list.filter((u) => (u.employment_status || "").toLowerCase() === empStatusFilter.toLowerCase());
      if (planFilter) list = list.filter((u) => (u.plan || "").toLowerCase() === planFilter.toLowerCase());
      setFilteredUsers(list);
    }
  }, [empStatusFilter, expFilter, planFilter, searchMode, aiResults, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginated = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const clearSearch = () => { setQuery(""); setSearchMode(false); setAiResults(null); setExpandedRow(null); setExplanations({}); lastSearchedQuery.current = ""; };
  const viewProfile = (userId) => navigate(`/organization/user/${userId}`);
  const getUserId = (c) => c.user_id || c.id;
  const MatchBadge = ({ level, similarity }) => {
    const colors = MATCH_COLORS[level] || MATCH_COLORS.poor;
    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium border ${colors.badge}`}>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="w-14 h-1.5 bg-gray-100 border border-gray-200">
            <div className={`h-1.5 ${colors.bar}`} style={{ width: `${Math.min(100, (similarity || 0) * 100)}%` }} />
          </div>
          <span className="text-xs text-gray-500 w-8">{((similarity || 0) * 100).toFixed(0)}%</span>
        </div>
      </div>
    );
  };
  const SkillTag = ({ skill }) => <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 mr-1 mb-1">{skill}</span>;

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-gray-900 h-48 animate-pulse" />
          <div className="bg-white border border-gray-200 h-32 animate-pulse" />
          <div className="bg-white border border-gray-200 h-96 animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative p-6 md:p-8">
          <h1 className="text-3xl md:text-[2rem] font-bold leading-tight">Discover top talent</h1>
          <p className="text-gray-300 mt-2 max-w-2xl text-sm md:text-[15px]">Describe the ideal candidate and let AI find the best matches from your talent pool.</p>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 px-2.5 py-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />{filteredUsers.length} candidates</span>
            {searchMode && aiResults && <span className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 px-2.5 py-1 text-blue-200">AI ranked</span>}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 mb-6">
        <div className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder='Try "Senior React developer with Node.js experience"...' value={query} onKeyDown={(e) => { if (e.key === "Enter") triggerSearch(query); }} onChange={(e) => setQuery(e.target.value)} className="w-full pl-10 pr-28 py-3 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white" />
              {query && <button onClick={clearSearch} className="absolute right-20 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded text-gray-400"><FiX className="w-4 h-4" /></button>}
              <button onClick={() => triggerSearch(query)} disabled={isSearching || !query.trim()} className="absolute right-1 top-1 bottom-1 px-5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">{isSearching ? <FiLoader className="animate-spin w-4 h-4" /> : "Search"}</button>
            </div>
          </div>
          {isSearching && <p className="text-sm text-blue-600 flex items-center gap-2"><FiLoader className="animate-spin w-4 h-4" /> AI is analyzing candidates…</p>}
          {searchMode && aiResults && <div className="flex items-center justify-between text-sm"><span className="text-gray-600">Found {aiResults.length} candidates</span><button onClick={clearSearch} className="text-blue-600 hover:text-blue-700 font-medium text-xs">Show all</button></div>}
          <div className="flex flex-wrap gap-2">
            <select value={empStatusFilter} onChange={(e) => { setEmpStatusFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white">
              <option value="">All status</option>
              <option value="unemployed">Unemployed</option>
              <option value="working">Working</option>
              <option value="hired">Hired</option>
              <option value="onboarding">Onboarding</option>
            </select>
            <select value={expFilter} onChange={(e) => { setExpFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white">
              <option value="">All experience</option>
              <option value="0-2">Junior (0-2 yrs)</option>
              <option value="3-5">Mid (3-5 yrs)</option>
              <option value="5-">Senior (5+ yrs)</option>
            </select>
            <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2 bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white">
              <option value="">All plans</option>
              <option value="trial">Trial</option>
              <option value="pro">Pro</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        {paginated.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto mb-3"><FiUsers className="w-6 h-6 text-gray-400" /></div>
            <h3 className="text-sm font-semibold text-gray-900">No candidates found</h3>
            <p className="text-xs text-gray-500 mt-1">{query ? "Try a different search query" : "No candidates available at the moment"}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="text-left px-4 py-3 font-medium">Candidate</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Status</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Experience</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Skills</th>
                    <th className="text-left px-4 py-3 font-medium">Match</th>
                    <th className="text-center px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map((candidate) => {
                    const cid = getUserId(candidate);
                    const isExpanded = expandedRow === cid;
                    return (
                      <tr key={cid} className={`hover:bg-gray-50 ${isExpanded ? "bg-gray-50" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0">
                              {candidate.profile_picture ? <img src={getUploadUrl(candidate.profile_picture)} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200" /> : <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">{(candidate.name || "?")[0].toUpperCase()}</div>}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{candidate.name || "Anonymous"}</p>
                              <p className="text-xs text-gray-500">{candidate.current_position || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium border ${candidate.employment_status === "unemployed" ? "bg-green-50 text-green-700 border-green-200" : candidate.employment_status === "working" || candidate.employment_status === "hired" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>{candidate.employment_status || "unknown"}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-600">
                          {candidate.experience_years ? `${candidate.experience_years.toFixed(1)} yrs` : "—"}
                          {candidate.education_level && <span className="text-gray-400 ml-1">({candidate.education_level.split(" ").slice(0, 2).join(" ")})</span>}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-wrap max-w-[200px] gap-1">
                            {(() => {
                              const displaySkills = candidate.matching_skills?.length ? candidate.matching_skills : candidate.skills?.length ? candidate.skills : [];
                              return displaySkills.slice(0, 3).map((s, i) => <span key={i} className="inline-flex px-2 py-0.5 text-xs bg-blue-50 text-blue-700 border border-blue-200">{s}</span>);
                            })()}
                            {candidate.skills_count > 0 && !candidate.matching_skills?.length && !candidate.skills?.length && <span className="text-xs text-gray-500">{candidate.skills_count} skills</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3"><MatchBadge level={candidate.match_level || "possible"} similarity={candidate.similarity || 0} /></td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => viewProfile(cid)} className="p-1.5 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200" title="View"><FiEye className="w-4 h-4" /></button>
                            <button onClick={() => navigate(`/organization/candidate-analysis/${cid}`)} className="p-1.5 text-green-600 hover:bg-green-50 border border-transparent hover:border-green-200" title="Analysis"><FiBriefcase className="w-4 h-4" /></button>
                            <button onClick={() => { if (isExpanded) setExpandedRow(null); else { setExpandedRow(cid); loadExplanation(cid, query); } }} className="p-1.5 text-gray-500 hover:bg-gray-100 border border-transparent hover:border-gray-200">
                              {explainingUser === cid ? <FiLoader className="animate-spin w-4 h-4" /> : isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                            </button>
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
                  const candidate = filteredUsers.find((u) => getUserId(u) === expandedRow);
                  const explanation = explanations[expandedRow];
                  if (!candidate) return null;
                  const level = explanation?.match_level || candidate.match_level || "possible";
                  const colors = MATCH_COLORS[level] || MATCH_COLORS.poor;
                  return (
                    <div className="flex gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${colors.dot}`} />
                      <div>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">AI match analysis</p>
                        {explanation ? (
                          <>
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{explanation.explanation}</p>
                            {explanation.matching_skills?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{explanation.matching_skills.map((s, i) => <span key={i} className="inline-flex px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200">{s}</span>)}</div>}
                          </>
                        ) : <p className="text-sm text-gray-500 italic mt-1">Loading AI analysis…</p>}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
                <span className="text-xs text-gray-600">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-1.5">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-1.5 text-sm border ${currentPage === pageNum ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 hover:bg-gray-50"}`}>{pageNum}</button>;
                  })}
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

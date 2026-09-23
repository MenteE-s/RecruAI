import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSidebarItems, getBackendUrl, getAuthHeaders, getUploadUrl, getCurrentUser } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastContext";
import MenteeLoader from "../../components/ui/MenteeLoader";
import {
  FiBriefcase,
  FiMapPin,
  FiBookmark,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiEye,
  FiUsers,
} from "react-icons/fi";

function getJobCountry(location) {
  if (!location) return "Unknown";
  const parts = location.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0] || "Unknown";
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
}

function getCompanyInitials(name) {
  if (!name) return "CO";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function formatSalary(min, max, currency) {
  if (!min && !max) return null;
  const cur = currency || "$";
  if (min && max) return `${cur}${Number(min).toLocaleString()} - ${cur}${Number(max).toLocaleString()}`;
  return `${cur}${Number(min || max).toLocaleString()}`;
}

function truncateText(text, max = 110) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
}

export default function IndividualDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const role = typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);

  const [userData, setUserData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState({ location: "", country: "", time: "" });
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applying, setApplying] = useState(false);
  const [nextInterview, setNextInterview] = useState(null);

  const PER_PAGE = 10;

  const fetchJobsPage = async (page) => {
    const jobsRes = await fetch(`${getBackendUrl()}/api/posts?status=active&per_page=${PER_PAGE}&page=${page}`, {
      credentials: "include",
      headers: getAuthHeaders(),
    });
    if (!jobsRes.ok) return { list: [], more: false };
    const data = await jobsRes.json();
    const list = data.data || [];
    const pagination = data.pagination || {};
    const more = pagination.has_next ?? list.length === PER_PAGE;
    return { list, more };
  };

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      try {
        // Parallel: user (shared cached /me single-flight) + jobs page 1 + next interview.
        // Previously user -> jobs -> saved -> applied were sequential awaits.
        const [user, jobsPage, upcomingList] = await Promise.all([
          getCurrentUser().catch(() => null),
          fetchJobsPage(1).catch(() => ({ list: [], more: false })),
          (async () => {
            try {
              const ivRes = await fetch(`${getBackendUrl()}/api/interviews/upcoming`, {
                credentials: "include",
                headers: getAuthHeaders(),
              });
              if (!ivRes.ok) return [];
              const ivData = await ivRes.json();
              return ivData.interviews || [];
            } catch {
              return [];
            }
          })(),
        ]);
        if (cancelled) return;
        if (user) setUserData(user);
        setJobs(jobsPage.list);
        setHasMore(jobsPage.more);
        const next = (upcomingList || [])
          .filter((iv) => iv.status !== "cancelled" && iv.status !== "completed")
          .map((iv) => ({ ...iv, _at: new Date(iv.scheduled_at_iso || iv.scheduled_at).getTime() }))
          .filter((iv) => !Number.isNaN(iv._at))
          .sort((a, b) => a._at - b._at)
          .filter((iv) => iv._at >= Date.now() - 2 * 60 * 60 * 1000)[0] || null;
        setNextInterview(next);
        const userId = user?.id || null;

        if (userId) {
          // Saved + applied in parallel; backend caches both in Redis (60s).
          const [savedList, appliedList] = await Promise.all([
            (async () => {
              try {
                const savedRes = await fetch(`${getBackendUrl()}/api/saved-jobs/user/${userId}`, {
                  credentials: "include",
                  headers: getAuthHeaders(),
                });
                if (!savedRes.ok) return [];
                const data = await savedRes.json();
                return Array.isArray(data) ? data : data.data || [];
              } catch {
                return [];
              }
            })(),
            (async () => {
              try {
                const appliedRes = await fetch(
                  `${getBackendUrl()}/api/applications/user/${userId}`,
                  {
                    credentials: "include",
                    headers: getAuthHeaders(),
                  }
                );
                if (!appliedRes.ok) return [];
                const data = await appliedRes.json();
                return Array.isArray(data) ? data : data.data || [];
              } catch {
                return [];
              }
            })(),
          ]);
          if (cancelled) return;
          setSavedJobs(new Set(savedList.map((s) => s.post_id)));
          setAppliedJobs(new Set(appliedList.map((a) => a.post_id)));
        }
      } catch (e) {
        console.error("Error loading dashboard:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveJob = async (postId) => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/saved-jobs`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ post_id: postId }),
      });
      if (res.ok) {
        setSavedJobs((prev) => new Set([...prev, postId]));
        showToast({ message: "Job saved successfully!", type: "success" });
      } else {
        showToast({ message: "Failed to save job", type: "error" });
      }
    } catch {
      showToast({ message: "Failed to save job", type: "error" });
    }
  };

  const handleApplyJob = async (postId) => {
    if (applying) return;
    setApplying(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/applications`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ post_id: postId, cover_letter: "", resume_url: "" }),
      });
      if (res.ok) {
        setAppliedJobs((prev) => new Set([...prev, postId]));
        // Reflect the new application immediately on the card
        setJobs((prev) => prev.map((j) => (j.id === postId ? { ...j, application_count: (j.application_count ?? 0) + 1 } : j)));
        setSelectedJob((prev) => (prev && prev.id === postId ? { ...prev, application_count: (prev.application_count ?? 0) + 1 } : prev));
        setShowApplyConfirm(false);
        setSelectedJob(null);
        showToast({ message: "Application submitted successfully!", type: "success", position: "center" });
      } else {
        showToast({ message: "Failed to submit application", type: "error" });
      }
    } catch {
      showToast({ message: "Failed to submit application", type: "error" });
    } finally {
      setApplying(false);
    }
  };

  const handleShowMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = Math.floor(jobs.length / PER_PAGE) + 1;
      const { list, more } = await fetchJobsPage(nextPage);
      const seen = new Set(jobs.map((j) => j.id));
      setJobs((prev) => [...prev, ...list.filter((j) => !seen.has(j.id))]);
      setHasMore(more);
    } catch (e) {
      console.error("Error loading more jobs:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const userName = userData?.name || "You";
  const userTitle = userData?.title || userData?.headline || "Member · RecruAI";
  const userLocation = userData?.location || "Unknown";
  const userImage = userData?.profile_picture ? getUploadUrl(userData.profile_picture) : null;
  const userCover = userData?.banner ? getUploadUrl(userData.banner) : null;

  const uniqueLocations = useMemo(() => {
    const vals = jobs.map((j) => j.location).filter(Boolean);
    return [...new Set(vals)].sort();
  }, [jobs]);

  const uniqueCountries = useMemo(() => {
    const vals = jobs.map((j) => getJobCountry(j.location)).filter(Boolean);
    return [...new Set(vals)].sort();
  }, [jobs]);

  const activeFilterCount = [filters.location, filters.country, filters.time].filter(Boolean).length;
  const clearFilters = () => setFilters({ location: "", country: "", time: "" });

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (filters.location && j.location !== filters.location) return false;
      if (filters.country && getJobCountry(j.location) !== filters.country) return false;
      if (filters.time && j.created_at) {
        const ageMs = Date.now() - new Date(j.created_at).getTime();
        const days = ageMs / (1000 * 60 * 60 * 24);
        if (filters.time === "24h" && days > 1) return false;
        if (filters.time === "7d" && days > 7) return false;
        if (filters.time === "30d" && days > 30) return false;
      }
      return true;
    });
  }, [jobs, filters]);

  const isDeadlineSoon = (deadline) => {
    if (!deadline) return false;
    const diff = (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  };

  const timeAgo = (dateString) => {
    if (!dateString) return "Recently";
    const mins = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
    if (mins < 60) return `${Math.max(mins, 1)}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return formatDate(dateString);
  };

  const countdownTo = (ts) => {
    const diffMs = ts - Date.now();
    if (diffMs <= 0) return "Now";
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `in ${hours}h${mins % 60 ? ` ${mins % 60}m` : ""}`;
    const days = Math.floor(hours / 24);
    return `in ${days}d${hours % 24 ? ` ${hours % 24}h` : ""}`;
  };

  // Right rail — all derived from real loaded jobs
  const recentJobs = useMemo(() => {
    return [...jobs]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5);
  }, [jobs]);

  const popularJobs = useMemo(() => {
    // In-demand first: closing soon, then newest
    return [...jobs]
      .sort((a, b) => {
        const da = a.application_deadline ? new Date(a.application_deadline).getTime() : Infinity;
        const db = b.application_deadline ? new Date(b.application_deadline).getTime() : Infinity;
        if (da !== db) return da - db;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      })
      .slice(0, 5);
  }, [jobs]);

  const topCompanies = useMemo(() => {
    const map = new Map();
    jobs.forEach((j) => {
      const name = j.organization?.name || "Unknown organization";
      const key = j.organization?.id ?? name;
      if (!map.has(key)) {
        map.set(key, {
          id: j.organization?.id || null,
          name,
          image: j.organization?.profile_image || null,
          count: 0,
        });
      }
      map.get(key).count += 1;
    });
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [jobs]);

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 w-full max-w-5xl mx-auto justify-center">
        {/* Left column — Contact / profile card (real data, compact) */}
        <aside className="lg:col-span-3 space-y-3 order-2 lg:order-1">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {userCover ? (
              <img src={userCover} alt="Cover" className="w-full h-14 object-cover" />
            ) : (
              <div className="h-14 bg-gradient-to-br from-blue-600/20 via-indigo-400/10 to-purple-500/20" />
            )}
            <div className="px-3 pb-3 relative">
              {userImage ? (
                <img
                  src={userImage}
                  alt={userName}
                  className="w-10 h-10 rounded-full border-2 border-white shadow -mt-5 mb-1.5 object-cover bg-gray-100"
                />
              ) : (
                <div className="w-10 h-10 rounded-full border-2 border-white shadow -mt-5 mb-1.5 bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <h2 className="text-sm font-bold text-gray-900 leading-tight truncate">{userName}</h2>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-1">{userTitle}</p>
              <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                <FiMapPin className="w-3 h-3" /> <span className="truncate">{userLocation}</span>
              </div>
              <span className="inline-block mt-1.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-px rounded-full">
                {plan ? plan.toUpperCase() : "FREE"}
              </span>
              {/* Contact info */}
              <div className="mt-2.5 pt-2.5 border-t border-gray-100 space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact</p>
                {userData?.email && (
                  <p className="flex items-center gap-1.5 text-[11px] text-gray-600 truncate">
                    <FiMail className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{userData.email}</span>
                  </p>
                )}
                <p className="flex items-center gap-1.5 text-[11px] text-gray-600">
                  <FiMapPin className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="truncate">{userLocation}</span>
                </p>
                <button
                  onClick={() => navigate("/profile")}
                  className="text-[11px] font-semibold text-blue-600 hover:underline px-0 py-0.5"
                >
                  View full profile →
                </button>
              </div>
            </div>
            <div className="border-t border-gray-100 px-3 py-2 flex gap-5">
              <div className="text-center">
                <p className="text-sm font-extrabold text-gray-900 leading-none">{loading ? "—" : appliedJobs.size}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Applied</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-extrabold text-gray-900 leading-none">{loading ? "—" : savedJobs.size}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Saved</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-extrabold text-gray-900 leading-none">{jobs.length}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Live</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl px-3 py-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Next interview
              </h3>
              <button onClick={() => navigate("/interviews")} className="text-[11px] font-semibold text-red-600 hover:underline">
                All →
              </button>
            </div>
            {loading ? (
              <p className="text-[11px] text-red-400 mt-1.5">Loading…</p>
            ) : nextInterview ? (
              <button onClick={() => navigate(`/interviews/${nextInterview.id}`)} className="w-full text-left mt-1.5 group">
                <p className="text-xs font-bold text-red-900 group-hover:text-red-600 leading-tight truncate">
                  {nextInterview.title || "Interview"}
                </p>
                <p className="text-[11px] text-red-600 truncate mt-px">
                  {nextInterview.organization || ""}
                </p>
                <p className="mt-1.5 inline-block text-[11px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-full animate-pulse">
                  {countdownTo(nextInterview._at)}
                </p>
              </button>
            ) : (
              <p className="text-[11px] text-red-400 mt-1.5">Nothing scheduled.</p>
            )}
          </div>

          {/* From MenteE — plain promo links, no card */}
          <div className="px-1 pt-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">From MenteE</p>
            <div className="mt-1.5 space-y-1">
              <a href="https://menteeai.org/products/recruai" target="_blank" rel="noopener noreferrer" className="block text-[11px] font-semibold text-gray-700 hover:text-blue-600 hover:underline leading-snug">
                RecruAI — AI hiring platform
              </a>
              <a href="https://menteeai.org/products/swe" target="_blank" rel="noopener noreferrer" className="block text-[11px] font-semibold text-gray-700 hover:text-blue-600 hover:underline leading-snug">
                MenteE SWE — terminal AI agent
              </a>
              <a href="https://menteeai.org/embed-models" target="_blank" rel="noopener noreferrer" className="block text-[11px] font-semibold text-gray-700 hover:text-blue-600 hover:underline leading-snug">
                mentee-embed — trilingual AI models
              </a>
              <a href="https://menteeai.org/careers" target="_blank" rel="noopener noreferrer" className="block text-[11px] font-semibold text-gray-700 hover:text-blue-600 hover:underline leading-snug">
                Careers at MenteE
              </a>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[11px]">
              <a href="https://www.linkedin.com/company/menteeai" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 hover:underline">LinkedIn</a>
              <span className="text-gray-200">·</span>
              <a href="https://x.com/menteeaiorg" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 hover:underline">X</a>
              <span className="text-gray-200">·</span>
              <a href="https://github.com/MenteE-s/mentee-embeddings" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 hover:underline">GitHub</a>
              <span className="text-gray-200">·</span>
              <a href="https://menteeai.org/contact" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 hover:underline">Contact</a>
            </div>
          </div>
        </aside>

        {/* Middle column — Jobs feed */}
        <main className="lg:col-span-6 order-1 lg:order-2">
          <div className="w-full space-y-2.5">
          <div className="flex items-center gap-2 justify-between">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 tracking-tight leading-tight">Latest Jobs</h1>
              <p className="text-[11px] text-gray-500 leading-tight">{filteredJobs.length} openings · from database</p>
            </div>
          </div>

          {/* Filters — location / country / posted time */}
          <div className="grid grid-cols-3 gap-1.5">
            <select
              value={filters.location}
              onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
              className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-blue-500 shadow-sm truncate"
            >
              <option value="">All locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <select
              value={filters.country}
              onChange={(e) => setFilters((p) => ({ ...p, country: e.target.value }))}
              className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-blue-500 shadow-sm truncate"
            >
              <option value="">All countries</option>
              {uniqueCountries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={filters.time}
              onChange={(e) => setFilters((p) => ({ ...p, time: e.target.value }))}
              className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-blue-500 shadow-sm truncate"
            >
              <option value="">Any time</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-[11px] font-medium text-blue-600 hover:underline self-start px-1">
              Clear filters ({activeFilterCount})
            </button>
          )}

          {loading ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm">
              <MenteeLoader size={52} text="Loading jobs…" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm">
              <FiBriefcase className="w-6 h-6 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-gray-900">No jobs found</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {jobs.length === 0
                  ? "No active openings in the database yet."
                  : "No openings match these filters."}
              </p>
              {jobs.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors rounded-lg"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            filteredJobs.map((job) => {
              const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
              const soon = isDeadlineSoon(job.application_deadline);
              const applied = appliedJobs.has(job.id);
              const saved = savedJobs.has(job.id);
              const orgName = job.organization?.name || "Unknown organization";
              return (
                <article
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow hover:border-gray-300 transition-all cursor-pointer"
                >
                  <div className="p-3">
                    <div className="flex items-start gap-2">
                      {job.organization?.profile_image ? (
                        <img
                          src={getUploadUrl(job.organization.profile_image)}
                          alt={orgName}
                          loading="lazy"
                          decoding="async"
                          className="w-8 h-8 rounded-md object-cover border border-gray-200 bg-gray-100 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-900 text-white rounded-md flex items-center justify-center text-[11px] font-bold shrink-0">
                          {getCompanyInitials(orgName)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-[11px] font-medium text-gray-500 truncate">{orgName}</h4>
                          <span className="text-[11px] text-gray-300">· {job.created_at ? formatDate(job.created_at) : "New"}</span>
                          {applied && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-px rounded">
                              <FiCheckCircle className="w-2.5 h-2.5" /> Applied
                            </span>
                          )}
                          {soon && !applied && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-px rounded">
                              <FiClock className="w-2.5 h-2.5" /> Closing soon
                            </span>
                          )}
                        </div>
                        <h2 className="text-[13px] font-semibold text-gray-900 leading-tight mt-0.5 line-clamp-1">{job.title}</h2>
                        <p className="text-xs text-gray-500 leading-snug mt-0.5 line-clamp-1">{truncateText(job.description) || "No description."}</p>

                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {job.location && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                              <FiMapPin className="w-3 h-3 text-gray-400" /> {job.location}
                            </span>
                          )}
                          {job.employment_type && (
                            <span className="text-[11px] text-gray-300">·</span>
                          )}
                          {job.employment_type && (
                            <span className="text-[11px] text-gray-600">{job.employment_type}</span>
                          )}
                          {job.category && (
                            <span className="text-[11px] text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-px rounded">{job.category}</span>
                          )}
                          {salary && (
                            <span className="text-[11px] text-emerald-700 font-medium">{salary}</span>
                          )}
                          {job.application_deadline && (
                            <span className="text-[11px] text-gray-400">· due {formatDate(job.application_deadline)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                          <span className="inline-flex items-center gap-1">
                            <FiEye className="w-3 h-3" /> {job.view_count ?? 0} view{(job.view_count ?? 0) === 1 ? "" : "s"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <FiUsers className="w-3 h-3" /> {job.application_count ?? 0} applicant{(job.application_count ?? 0) === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-50">
                      {applied ? (
                        <button disabled className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 text-[11px] font-medium rounded-md cursor-not-allowed">
                          <FiCheckCircle className="w-3 h-3" /> Applied
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedJob(job); setShowApplyConfirm(true); }}
                          className="inline-flex items-center px-2.5 py-1 bg-blue-600 text-white text-[11px] font-medium hover:bg-blue-700 transition-colors rounded-md"
                        >
                          Apply
                        </button>
                      )}
                      {saved ? (
                        <button disabled className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-500 text-[11px] font-medium rounded-md cursor-default">
                          <FiBookmark className="w-3 h-3 fill-gray-400" /> Saved
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSaveJob(job.id); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 text-gray-600 text-[11px] font-medium hover:bg-gray-50 transition-colors rounded-md"
                        >
                          <FiBookmark className="w-3 h-3" /> Save
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}
                        className="ml-auto text-[11px] text-blue-600 font-medium hover:underline px-1 py-1"
                      >
                        Details →
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}

          {!loading && hasMore && (
            <button
              onClick={handleShowMore}
              disabled={loadingMore}
              className="w-full py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {loadingMore ? (<><MenteeLoader size={20} text={null} inline /> Loading…</>) : "Show more jobs"}
            </button>
          )}
          </div>
        </main>

        {/* Right column — discovery rail (real data, compact) */}
        <aside className="lg:col-span-3 space-y-3 order-3">
          {/* Recent jobs */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-900">Recent jobs</h3>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-px rounded-full">
                {recentJobs.length} new
              </span>
            </div>
            <div className="mt-1.5 space-y-1">
              {recentJobs.length === 0 && (
                <p className="text-[11px] text-gray-400 py-2 text-center">No openings yet.</p>
              )}
              {recentJobs.map((j) => {
                const isNew = j.created_at && Date.now() - new Date(j.created_at).getTime() < 24 * 60 * 60 * 1000;
                const orgName = j.organization?.name || "Unknown";
                return (
                  <button
                    key={`recent-${j.id}`}
                    onClick={() => navigate(`/jobs/${j.id}`)}
                    className="w-full flex items-center gap-2 p-1.5 -mx-1.5 rounded-lg hover:bg-blue-50/60 text-left group transition-colors"
                  >
                    {j.organization?.profile_image ? (
                      <img
                        src={getUploadUrl(j.organization.profile_image)}
                        alt={orgName}
                        loading="lazy"
                        decoding="async"
                        className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                        {getCompanyInitials(orgName)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 group-hover:text-blue-700 leading-tight truncate">
                        {j.title}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate mt-px">
                        {orgName} · {timeAgo(j.created_at)}
                      </p>
                    </div>
                    {isNew && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-px rounded-full shrink-0">
                        NEW
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Popular jobs — closing soon first, then newest */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3">
            <h3 className="text-xs font-bold text-gray-900">Popular jobs</h3>
            <p className="text-[10px] text-gray-400">In demand · closing soon</p>
            <div className="mt-1 divide-y divide-gray-100">
              {popularJobs.length === 0 && (
                <p className="text-[11px] text-gray-400 py-2">No openings yet.</p>
              )}
              {popularJobs.map((j) => (
                <button
                  key={`popular-${j.id}`}
                  onClick={() => navigate(`/jobs/${j.id}`)}
                  className="w-full text-left py-2 group"
                >
                  <p className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 group-hover:underline leading-tight line-clamp-1">
                    {j.title}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">
                    {j.organization?.name || "Unknown"}
                    {j.application_deadline ? ` · Apply by ${formatDate(j.application_deadline)}` : ""}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Most hiring companies */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3">
            <h3 className="text-xs font-bold text-gray-900">Most hiring</h3>
            <p className="text-[10px] text-gray-400">Companies with most openings</p>
            <div className="mt-1 divide-y divide-gray-100">
              {topCompanies.length === 0 && (
                <p className="text-[11px] text-gray-400 py-2">No companies yet.</p>
              )}
              {topCompanies.map((c) => (
                <button
                  key={`top-${c.id ?? c.name}`}
                  onClick={() => c.id && navigate(`/organization/profile/${c.id}`)}
                  disabled={!c.id}
                  title={c.id ? `View ${c.name}` : c.name}
                  className={`w-full flex items-center gap-2 py-2 text-left ${c.id ? "group cursor-pointer" : "cursor-default"}`}
                >
                  {c.image ? (
                    <img
                      src={getUploadUrl(c.image)}
                      alt={c.name}
                      loading="lazy"
                      decoding="async"
                      className="w-7 h-7 rounded-md object-cover border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-md bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {getCompanyInitials(c.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold text-gray-900 truncate ${c.id ? "group-hover:text-blue-600 group-hover:underline" : ""}`}>{c.name}</p>
                    <p className="text-[11px] text-gray-400">{c.count} open role{c.count === 1 ? "" : "s"}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {showApplyConfirm && selectedJob && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-sm w-full border border-gray-200 shadow-xl rounded-lg overflow-hidden">
            <div className="px-4 pt-4">
              <h3 className="text-sm font-semibold text-gray-900">Apply for this role?</h3>
              <p className="text-xs text-gray-600 mt-1.5">
                Apply for <span className="font-semibold text-gray-900">{selectedJob.title}</span> at{" "}
                <span className="font-semibold text-gray-900">{selectedJob.organization?.name}</span>?
              </p>
            </div>
            <div className="px-4 py-3 flex gap-2">
              <button onClick={() => handleApplyJob(selectedJob.id)} disabled={applying} className="flex-1 bg-blue-600 text-white py-1.5 text-xs font-medium hover:bg-blue-700 transition-colors rounded-md disabled:opacity-70 inline-flex items-center justify-center gap-2">
                {applying ? (<><MenteeLoader size={18} text={null} inline /> Applying…</>) : "Yes, apply"}
              </button>
              <button onClick={() => { setShowApplyConfirm(false); setSelectedJob(null); }} className="px-4 py-1.5 bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import IndividualFeed from "./IndividualFeed";
import { getBackendUrl, getAuthHeaders, getCurrentUser } from "../../utils/auth";
import { useToast } from "../ui/ToastContext";
import { formatSalaryRange as formatSalary } from "../../utils/jobMeta";

function getJobCountry(location) {
  if (!location) return "Unknown";
  const parts = location.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0] || "Unknown";
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
}

export default function IndividualFeedContainer() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const plan = typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;

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

  const recentJobs = useMemo(() => {
    return [...jobs]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5);
  }, [jobs]);

  const popularJobs = useMemo(() => {
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
    <IndividualFeed
      loading={loading}
      userData={userData}
      userName={userName}
      userTitle={userTitle}
      userLocation={userLocation}
      plan={plan}
      jobs={jobs}
      filteredJobs={filteredJobs}
      filters={filters}
      setFilters={setFilters}
      uniqueLocations={uniqueLocations}
      uniqueCountries={uniqueCountries}
      activeFilterCount={activeFilterCount}
      clearFilters={clearFilters}
      hasMore={hasMore}
      loadingMore={loadingMore}
      handleShowMore={handleShowMore}
      savedJobs={savedJobs}
      appliedJobs={appliedJobs}
      handleSaveJob={handleSaveJob}
      selectedJob={selectedJob}
      setSelectedJob={setSelectedJob}
      showApplyConfirm={showApplyConfirm}
      setShowApplyConfirm={setShowApplyConfirm}
      applying={applying}
      handleApplyJob={handleApplyJob}
      nextInterview={nextInterview}
      countdownTo={countdownTo}
      recentJobs={recentJobs}
      popularJobs={popularJobs}
      topCompanies={topCompanies}
      timeAgo={timeAgo}
      formatSalary={formatSalary}
      navigate={navigate}
    />
  );
}


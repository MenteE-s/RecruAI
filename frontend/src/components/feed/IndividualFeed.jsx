import React from "react";
import { AppShell, CenterBar } from "../layout/AppShell";
import { RailSection } from "../layout/RightRail";
import { Avatar } from "../ui/Avatar";
import { getUploadUrl, postPath, orgPath } from "../../utils/auth";
import {
  Briefcase,
  Bookmark,
  CheckCircle2,
  Clock,
  Eye,
  MapPin,
  Users,
} from "lucide-react";
import MenteeLoader from "../ui/MenteeLoader";
import AnimatedNumber from "../motion/AnimatedNumber";
import { StaggerList, StaggerItem } from "../motion/Stagger";
import InteractiveCard from "../motion/InteractiveCard";
import { SkeletonJobList } from "../motion/SmartSkeleton";
import FollowButton from "../ui/FollowButton";

export default function IndividualFeed({
  loading,
  userData,
  userName,
  userTitle,
  userLocation,
  plan,
  jobs,
  filteredJobs,
  filters,
  setFilters,
  uniqueLocations,
  uniqueCountries,
  activeFilterCount,
  clearFilters,
  hasMore,
  loadingMore,
  handleShowMore,
  savedJobs,
  appliedJobs,
  handleSaveJob,
  selectedJob,
  setSelectedJob,
  showApplyConfirm,
  setShowApplyConfirm,
  applying,
  handleApplyJob,
  nextInterview,
  countdownTo,
  recentJobs,
  popularJobs: _popularJobs,
  topCompanies,
  timeAgo,
  formatSalary,
  navigate,
}) {
  const firstName = userData?.name ? userData.name.trim().split(/\s+/)[0] : "You";

  const getCompanyInitials = (name) => {
    if (!name) return "CO";
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  };

  const renderJobCard = (job) => {
    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
    const soon = job.application_deadline && (new Date(job.application_deadline) - new Date()) / (1000 * 60 * 60 * 24) >= 0 && (new Date(job.application_deadline) - new Date()) / (1000 * 60 * 60 * 24) <= 3;
    const applied = appliedJobs.has(job.id);
    const saved = savedJobs.has(job.id);
    const orgName = job.organization?.name || "Unknown organization";
    const orgImage = job.organization?.profile_image ? getUploadUrl(job.organization.profile_image) : null;
    return (
      <InteractiveCard
        as="article"
        key={job.id}
        onClick={() => navigate(postPath(job))}
        className="p-4 shadow-s5"
      >
        <div className="flex items-start gap-3.5">
          {orgImage ? (
            <img
              src={orgImage}
              alt={orgName}
              loading="lazy"
              decoding="async"
              className="h-11 w-11 shrink-0 rounded-xl border border-line bg-gray-50 dark:bg-gray-25 object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-xs font-bold text-white dark:bg-gray-800">
              {getCompanyInitials(orgName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-500">{orgName}</span>
              <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
              <span className="font-mono tabular-nums text-xs text-gray-500 dark:text-gray-500">{timeAgo(job.created_at)}</span>
              {applied && (
                <span className="inline-flex items-center gap-1 rounded-md border border-line bg-gray-50 dark:bg-gray-25 px-1.5 py-px text-[10px] font-medium text-gray-600 dark:text-gray-600">
                  <CheckCircle2 className="h-3 w-3 text-brand-text" strokeWidth={2} /> Applied
                </span>
              )}
              {soon && !applied && (
                <span className="inline-flex items-center gap-1 rounded-md border border-line bg-gray-50 dark:bg-gray-25 px-1.5 py-px text-[10px] font-medium text-gray-600 dark:text-gray-600">
                  <Clock className="h-3 w-3 text-amber-500" strokeWidth={1.75} /> Closing soon
                </span>
              )}
            </div>
            <h2 className="mt-1 line-clamp-1 text-sm font-semibold text-ink leading-snug">{job.title}</h2>
            <p className="mt-0.5 line-clamp-1 text-xs text-gray-500 dark:text-gray-500 leading-relaxed">{job.description || "No description provided."}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-500 dark:text-gray-500">
              {job.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-gray-500" strokeWidth={1.75} /> {job.location}
                </span>
              )}
              {job.employment_type && <span className="text-gray-300 dark:text-gray-600">·</span>}
              {job.employment_type && <span>{job.employment_type}</span>}
              {job.category && (
                <span className="rounded-md border border-line bg-gray-50 dark:bg-gray-25 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-600">{job.category}</span>
              )}
              {salary && <span className="font-mono tabular-nums font-semibold text-brand-text text-xs">{salary}</span>}
            </div>
            <div className="mt-2 flex items-center gap-3.5 text-xs text-gray-500 dark:text-gray-500">
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" strokeWidth={1.75} /> <span className="font-mono tabular-nums">{job.view_count ?? 0}</span> view{(job.view_count ?? 0) === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" strokeWidth={1.75} /> <span className="font-mono tabular-nums">{job.application_count ?? 0}</span> applicant{(job.application_count ?? 0) === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3.5 flex items-center gap-2 border-t border-line pt-3">
          {applied ? (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-line bg-gray-50 dark:bg-gray-25 px-3 text-xs font-medium text-gray-500 dark:text-gray-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-brand-text" strokeWidth={2} /> Applied
            </span>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setSelectedJob(job); setShowApplyConfirm(true); }}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-xs font-semibold text-white shadow-s5 transition-colors hover:bg-brand/90"
            >
              Apply
            </button>
          )}
          {saved ? (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-line bg-gray-50 dark:bg-gray-25 px-3 text-xs font-medium text-gray-500 dark:text-gray-500">
              <Bookmark className="h-3.5 w-3.5 fill-gray-400 text-gray-500" strokeWidth={1.75} /> Saved
            </span>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleSaveJob(job.id); }}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-medium text-ink shadow-s5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-25"
            >
              <Bookmark className="h-3.5 w-3.5" strokeWidth={1.75} /> Save
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate(postPath(job)); }}
            className="t-min ml-auto inline-flex items-center text-xs font-semibold text-brand-text hover:underline"
          >
            Details →
          </button>
        </div>
      </InteractiveCard>
    );
  };

  const renderProfileCard = () => (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-s5">
      <div className="flex items-center gap-3">
        <Avatar name={userName} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{userName}</p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-500">{userTitle}</p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
          <MapPin className="h-3.5 w-3.5 text-gray-500" strokeWidth={1.75} /> {userLocation}
        </span>
        <span className="rounded-full border border-line bg-gray-50 dark:bg-gray-25 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:text-gray-600">
          {plan ? (plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase()) : "Free"}
        </span>
      </div>
      <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
        <div>
          <AnimatedNumber value={loading ? 0 : appliedJobs.size} className="font-mono tabular-nums text-sm font-bold text-ink" />
          <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">Applied</p>
        </div>
        <div>
          <AnimatedNumber value={loading ? 0 : savedJobs.size} className="font-mono tabular-nums text-sm font-bold text-ink" />
          <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">Saved</p>
        </div>
        <div>
          <AnimatedNumber value={jobs.length} className="font-mono tabular-nums text-sm font-bold text-ink" />
          <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">Live</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate("/in/profile")}
        className="mt-3.5 w-full text-left text-xs font-semibold text-brand-text hover:underline"
      >
        View full profile →
      </button>
    </div>
  );

  const renderNextInterview = () => (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-s5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold text-ink">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand" /> Next interview
        </h3>
        <button type="button" onClick={() => navigate("/in/interviews")} className="text-[11px] font-semibold text-brand-text hover:underline">
          All →
        </button>
      </div>
      {loading ? (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">Loading…</p>
      ) : nextInterview ? (
        <button type="button" onClick={() => navigate(`/in/interviews/${nextInterview.id}`)} className="group mt-2.5 w-full text-left">
          <p className="truncate text-xs font-bold text-ink group-hover:text-brand-text">{nextInterview.title || "Interview"}</p>
          <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-500">{nextInterview.organization}</p>
          <span className="mt-2 inline-block rounded-full bg-brand px-2.5 py-0.5 font-mono tabular-nums text-[11px] font-semibold text-white shadow-s5">
            {countdownTo(nextInterview._at)}
          </span>
        </button>
      ) : (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">Nothing scheduled.</p>
      )}
    </div>
  );

  const renderTopCompanies = () => {
    if (!topCompanies || topCompanies.length === 0) return null;
    return (
      <div className="rounded-xl border border-line bg-surface p-4 shadow-s5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-ink">Top hiring companies</h3>
          <button
            type="button"
            onClick={() => navigate("/network")}
            className="text-[11px] font-semibold text-brand-text hover:underline"
          >
            Network →
          </button>
        </div>
        <ul className="mt-3 space-y-2.5">
          {topCompanies.slice(0, 4).map((c) => (
            <li key={c.id || c.name} className="flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => c.id && navigate(orgPath(c))}
                className="group flex min-w-0 items-center gap-2.5 text-left"
              >
                {c.image ? (
                  <img
                    src={getUploadUrl(c.image)}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-xl border border-line object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-[10px] font-bold text-white dark:bg-gray-800">
                    {getCompanyInitials(c.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-ink group-hover:text-brand-text">{c.name}</p>
                  <p className="truncate text-[10px] text-gray-500 dark:text-gray-500">
                    <span className="font-mono tabular-nums">{c.count}</span> open role{c.count === 1 ? "" : "s"}
                  </p>
                </div>
              </button>
              {c.id && <FollowButton orgId={c.id} size="xs" />}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const railActions = (
    <div className="flex items-center gap-2">
      <Avatar name={userName} size="md" />
      <span className="max-w-[140px] truncate text-xs font-semibold text-ink">{firstName}</span>
    </div>
  );

  const railContent = (
    <>
      <RailSection>{renderProfileCard()}</RailSection>
      <RailSection>{renderNextInterview()}</RailSection>
      {topCompanies && topCompanies.length > 0 && <RailSection>{renderTopCompanies()}</RailSection>}
    </>
  );

  const centerContent = (
    <div className="relative flex min-w-0 flex-1 flex-col">
      <CenterBar title="Feed" />
      <div className="px-4 pb-24 pt-4 sm:px-5 lg:pb-4">
        <div className="mb-4 space-y-3 lg:hidden">
          {renderProfileCard()}
          {renderNextInterview()}
        </div>

        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-ink">Latest jobs</h2>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              <AnimatedNumber value={filteredJobs.length} className="font-mono tabular-nums font-semibold" /> openings · from database
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <select
            value={filters.location}
            onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
            aria-label="Filter jobs by location"
            className="h-9 w-full rounded-xl border border-line bg-surface px-2.5 text-xs font-medium text-ink focus:border-brand focus:ring-1 focus:ring-brand/30 focus:outline-none transition-colors"
          >
            <option value="">All locations</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <select
            value={filters.country}
            onChange={(e) => setFilters((p) => ({ ...p, country: e.target.value }))}
            aria-label="Filter jobs by country"
            className="h-9 w-full rounded-xl border border-line bg-surface px-2.5 text-xs font-medium text-ink focus:border-brand focus:ring-1 focus:ring-brand/30 focus:outline-none transition-colors"
          >
            <option value="">All countries</option>
            {uniqueCountries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filters.time}
            onChange={(e) => setFilters((p) => ({ ...p, time: e.target.value }))}
            aria-label="Filter jobs by posting time"
            className="h-9 w-full rounded-xl border border-line bg-surface px-2.5 text-xs font-medium text-ink focus:border-brand focus:ring-1 focus:ring-brand/30 focus:outline-none transition-colors"
          >
            <option value="">Any time</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
        {activeFilterCount > 0 && (
          <button type="button" onClick={clearFilters} className="mt-2 self-start px-1 text-xs font-medium text-brand-text hover:underline">
            Clear filters ({activeFilterCount})
          </button>
        )}

        <div className="mt-4 space-y-2.5">
          {loading ? (
            <SkeletonJobList count={4} />
          ) : filteredJobs.length === 0 ? (
            <div className="rounded-xl border border-line bg-surface p-6 text-center shadow-s5">
              <Briefcase className="mx-auto mb-2 h-6 w-6 text-gray-300 dark:text-gray-600" strokeWidth={1.75} />
              <h3 className="text-sm font-semibold text-ink">No jobs found</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                {jobs.length === 0 ? "No active openings in the database yet." : "No openings match these filters."}
              </p>
              {jobs.length > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-s5 transition-colors hover:bg-brand/90"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <StaggerList className="space-y-2.5" step={0.025}>
              {filteredJobs.map((job) => (
                <StaggerItem key={job.id}>{renderJobCard(job)}</StaggerItem>
              ))}
            </StaggerList>
          )}
          {!loading && hasMore && (
            <button
              type="button"
              onClick={handleShowMore}
              disabled={loadingMore}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface py-2 text-xs font-semibold text-ink shadow-s5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-25 disabled:opacity-60"
            >
              {loadingMore ? (<><MenteeLoader size={18} text={null} inline /> Loading…</>) : "Show more jobs"}
            </button>
          )}
        </div>

      </div>
    </div>
  );

  return (
    <>
      <AppShell rail={railContent} railActions={railActions}>
        {centerContent}
      </AppShell>
      {showApplyConfirm && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-xl border border-line bg-surface shadow-s15 animate-popIn">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-ink">Apply for this role?</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-600 dark:text-gray-600">
                Apply for <span className="font-semibold text-ink">{selectedJob.title}</span> at{" "}
                <span className="font-semibold text-ink">{selectedJob.organization?.name}</span>?
              </p>
            </div>
            <div className="flex gap-2.5 border-t border-line bg-gray-50/50 px-4 py-3 dark:bg-gray-25/30">
              <button
                type="button"
                onClick={() => handleApplyJob(selectedJob.id)}
                disabled={applying}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand py-2 text-xs font-semibold text-white shadow-s5 transition-colors hover:bg-brand/90 disabled:opacity-70"
              >
                {applying ? (<><MenteeLoader size={16} text={null} inline /> Applying…</>) : "Yes, apply"}
              </button>
              <button
                type="button"
                onClick={() => { setShowApplyConfirm(false); setSelectedJob(null); }}
                className="rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink shadow-s5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-25"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

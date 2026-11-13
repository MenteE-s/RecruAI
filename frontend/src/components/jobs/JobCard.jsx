import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Briefcase,
  CreditCard,
  Calendar,
  Bookmark,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { OrgMark } from "./JobBits";
import { Button, IconButton } from "../ui/Button";
import { cn } from "../../lib/cn";
import { postPath, getUploadUrl } from "../../utils/auth";
import { formatSalaryRange as formatSalary } from "../../utils/jobMeta";
import { formatDate } from "../../utils/timezone";

export function JobCard({
  job,
  to,
  saved = false,
  applied = false,
  onSave,
  onUnsave,
  onApply,
  actions,
  className,
}) {
  if (!job) return null;

  const targetPath = to || postPath(job);
  const orgName = job.organization?.name || "Unknown organization";
  const orgImage = job.organization?.profile_image
    ? getUploadUrl(job.organization.profile_image)
    : null;
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);

  const handleBookmarkClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (saved) {
      onUnsave?.(job.id);
    } else {
      onSave?.(job.id);
    }
  };

  const handleApplyClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onApply?.(job.id);
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border border-line bg-surface p-4 shadow-s5 transition-all hover:border-gray-300 dark:border-line dark:bg-gray-25/80 dark:hover:border-line hover:shadow-s10",
        className
      )}
    >
      <div>
        {/* Header row: Org mark + Job title & Org info + Save button */}
        <div className="flex items-start justify-between gap-3">
          <Link to={targetPath} className="flex min-w-0 flex-1 items-start gap-3">
            <OrgMark name={orgName} image={orgImage} size="lg" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold leading-5 text-ink transition-colors group-hover:text-brand-text">
                {job.title}
              </h3>
              <p className="mt-0.5 truncate text-xs leading-4 text-gray-500 dark:text-gray-500">
                {orgName}
              </p>
            </div>
          </Link>

          {(onSave || onUnsave) && (
            <IconButton
              label={saved ? "Unsave job" : "Save job"}
              onClick={handleBookmarkClick}
              active={saved}
              className="shrink-0"
            >
              <Bookmark
                className={cn(
                  "h-4 w-4",
                  saved ? "fill-brand text-brand-text" : "text-gray-500 dark:text-gray-500"
                )}
                strokeWidth={1.75}
              />
            </IconButton>
          )}
        </div>

        {/* Metadata items */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs leading-4 text-gray-500 dark:text-gray-500">
          {job.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-500 dark:text-gray-500" strokeWidth={1.75} />
              <span className="truncate">{job.location}</span>
            </span>
          )}
          {job.employment_type && (
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 shrink-0 text-gray-500 dark:text-gray-500" strokeWidth={1.75} />
              <span>{job.employment_type}</span>
            </span>
          )}
          {salary && (
            <span className="inline-flex items-center gap-1.5 font-medium text-ink">
              <CreditCard className="h-3.5 w-3.5 shrink-0 text-brand-text" strokeWidth={1.75} />
              <span className="font-mono tabular-nums">{salary}</span>
            </span>
          )}
        </div>

        {/* Requirements / Skill badges */}
        {Array.isArray(job.requirements) && job.requirements.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {job.requirements.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="inline-flex h-6 items-center rounded-lg border border-line bg-gray-50 px-2.5 text-[11px] font-medium leading-4 text-ink dark:border-line dark:bg-gray-25/50 dark:text-gray-200"
              >
                {skill}
              </span>
            ))}
            {job.requirements.length > 3 && (
              <span className="inline-flex h-6 items-center px-1 text-[11px] font-mono tabular-nums font-medium text-gray-500 dark:text-gray-500">
                +{job.requirements.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer row: posted time and action CTA */}
      <div className="mt-4 flex items-center justify-between border-t border-line dark:border-line pt-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] leading-4 text-gray-500 dark:text-gray-500">
          <Calendar className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          {job.created_at ? (
            <span>
              Posted <span className="font-mono tabular-nums">{formatDate(job.created_at)}</span>
            </span>
          ) : (
            "Recently"
          )}
        </span>

        {actions ? (
          <div className="flex items-center gap-2">{actions}</div>
        ) : (
          <div className="flex items-center gap-2">
            {applied ? (
              <span className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-line bg-gray-50 px-2.5 text-xs font-medium text-gray-600 dark:border-line dark:bg-gray-25/50 dark:text-gray-600">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-text" strokeWidth={1.75} />
                Applied
              </span>
            ) : onApply ? (
              <Button variant="primary" size="sm" onClick={handleApplyClick}>
                Apply
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Button>
            ) : (
              <Link
                to={targetPath}
                className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-line bg-surface px-2.5 text-xs font-semibold text-ink transition-colors hover:bg-gray-50 dark:border-line dark:bg-gray-25 dark:text-gray-200 dark:hover:bg-gray-25"
              >
                View
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default JobCard;

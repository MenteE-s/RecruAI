import { cn } from "../../lib/cn";

/**
 * SmartSkeleton — geometry-matched shimmer placeholders.
 * Uses the `.skeleton` sweep defined in index.css, so no raw "Loading…" text
 * and no layout jump when real content arrives.
 */
export function Skeleton({ className, style }) {
  return <div aria-hidden className={cn("skeleton rounded-xl", className)} style={style} />;
}

export function SkeletonText({ lines = 2, className }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-2.5 rounded-md", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn("rounded-xl border border-line bg-surface p-4", className)} aria-hidden>
      <div className="flex items-start gap-3">
        <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-2.5 w-1/3 rounded-md" />
          <Skeleton className="h-3.5 w-3/4 rounded-md" />
          <Skeleton className="h-2.5 w-full rounded-md" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
        <Skeleton className="h-8 w-20 rounded-xl" />
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonJobList({ count = 4, className }) {
  return (
    <div className={cn("space-y-2.5", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonRow({ className }) {
  return (
    <div className={cn("flex items-center gap-3 border-b border-line px-4 py-4", className)} aria-hidden>
      <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3 w-2/5 rounded-md" />
        <Skeleton className="h-2.5 w-3/5 rounded-md" />
      </div>
      <Skeleton className="hidden h-8 w-24 rounded-xl sm:block" />
    </div>
  );
}

export function SkeletonTable({ rows = 6, className }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-line bg-surface", className)} aria-hidden>
      <div className="flex gap-4 border-b border-line px-4 py-3">
        {[28, 24, 16, 14, 12].map((w, i) => (
          <Skeleton key={i} className="h-2.5 rounded-md" style={{ width: `${w}%` }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-4 last:border-b-0">
          <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
          <Skeleton className="h-3 w-1/4 rounded-md" />
          <Skeleton className="h-3 w-1/5 rounded-md" />
          <Skeleton className="ml-auto h-7 w-20 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatGrid({ count = 4, className }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-line bg-surface p-4">
          <Skeleton className="h-2.5 w-2/3 rounded-md" />
          <Skeleton className="mt-3 h-7 w-1/3" />
          <Skeleton className="mt-2 h-2 w-1/2 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonKanban({ columns = 4, className }) {
  return (
    <div className={cn("flex gap-3 overflow-hidden", className)} aria-hidden>
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="w-[260px] shrink-0 rounded-xl border border-line bg-surface p-3">
          <Skeleton className="mb-3 h-3 w-1/2 rounded-md" />
          <div className="space-y-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;

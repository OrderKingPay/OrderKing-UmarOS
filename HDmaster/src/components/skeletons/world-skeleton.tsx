import { cn } from "@/lib/utils";

export interface WorldSkeletonProps {
  world?: string;
  className?: string;
}

/**
 * WorldSkeleton - Ultra-fast zero-latency skeleton for the 10 Worlds of Umar OS
 * (Home, Operations, King Pay, Travel & Work, B2B & Growth, UMAR AI, Media & Studio,
 * Global Tech & Connections, Alerts & Governance, Enterprise Settings).
 *
 * Guaranteed to paint in <16ms without waiting for network pings or server functions.
 */
export function WorldSkeleton({ world = "general", className }: WorldSkeletonProps) {
  return (
    <div
      className={cn("w-full space-y-5 animate-pulse select-none", className)}
      aria-busy="true"
      aria-label={`Loading Umar OS World: ${world}`}
    >
      {/* ─── World Top Navigation & Executive Header Skeleton ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm">
            <span className="text-xl">🌐</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-5 w-40 rounded-lg bg-surface border border-border" />
              <div className="h-4 w-16 rounded-full bg-amber-500/20 border border-amber-500/30" />
            </div>
            <div className="h-3 w-64 rounded bg-surface/70" />
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-28 rounded-xl bg-surface border border-border" />
          <div className="h-9 w-32 rounded-xl bg-amber-500/30 border border-amber-500/40" />
        </div>
      </div>

      {/* ─── World Sub-Category Pills Bar Skeleton ─── */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={cn(
              "h-8 shrink-0 rounded-xl px-3 flex items-center gap-2 border",
              i === 1
                ? "bg-amber-500/15 border-amber-500/40 w-32"
                : "bg-surface/80 border-border w-24"
            )}
          >
            <div className="size-2 rounded-full bg-amber-400/60" />
            <div className="h-2.5 flex-1 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* ─── 4-Card Executive KPI Metrics Grid Skeleton ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="size-7 rounded-xl bg-muted/60" />
            </div>
            <div className="space-y-1">
              <div className="h-7 w-32 rounded-lg bg-muted" />
              <div className="h-3 w-20 rounded bg-muted/60" />
            </div>
            <div className="flex items-center gap-1.5 border-t border-border/60 pt-2.5">
              <div className="size-2 rounded-full bg-emerald-400/60" />
              <div className="h-2.5 w-28 rounded bg-muted/60" />
            </div>
          </div>
        ))}
      </div>

      {/* ─── Main Operational Data Grid / Control Panel Skeleton ─── */}
      <div className="rounded-3xl border border-border bg-surface shadow-xs overflow-hidden">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
          <div className="space-y-1">
            <div className="h-5 w-48 rounded-lg bg-muted" />
            <div className="h-3 w-72 rounded bg-muted/60" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-44 rounded-xl bg-bg border border-border" />
            <div className="h-9 w-24 rounded-xl bg-muted" />
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="divide-y divide-border">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex items-center justify-between p-4 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-xl bg-muted/80 shrink-0" />
                <div className="space-y-1.5 min-w-0">
                  <div className="h-4 w-36 sm:w-48 rounded bg-muted" />
                  <div className="h-2.5 w-24 sm:w-32 rounded bg-muted/60" />
                </div>
              </div>
              <div className="hidden md:flex flex-col gap-1 text-right">
                <div className="h-3.5 w-24 rounded bg-muted ml-auto" />
                <div className="h-2.5 w-16 rounded bg-muted/60 ml-auto" />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="h-6 w-16 rounded-full bg-muted/70" />
                <div className="h-8 w-20 rounded-xl bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

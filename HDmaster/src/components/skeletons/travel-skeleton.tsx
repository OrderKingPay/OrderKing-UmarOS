import { cn } from "@/lib/utils";

/**
 * TravelSkeleton - Ultra-fast zero-latency skeleton for Umar OS Travel & Transit World
 * Guaranteed to paint in <16ms without waiting for network pings.
 */
export function TravelSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("w-full space-y-5 animate-pulse select-none", className)}
      aria-busy="true"
      aria-label="Loading Umar OS Travel & Logistics Hub"
    >
      {/* ─── Travel World Header Skeleton ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-sm">
            <span className="text-xl">✈️</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-5 w-44 rounded-lg bg-surface border border-border" />
              <div className="h-4 w-20 rounded-full bg-sky-500/20 border border-sky-500/30" />
            </div>
            <div className="h-3 w-64 rounded bg-surface/70" />
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-28 rounded-xl bg-surface border border-border" />
          <div className="h-9 w-32 rounded-xl bg-sky-500/30 border border-sky-500/40" />
        </div>
      </div>

      {/* ─── Mode Pills Bar Skeleton ─── */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {["Flights", "Trains", "Intercity Buses", "Hotels", "Cabs", "FASTag", "Corporate Logistics"].map((label, idx) => (
          <div
            key={label}
            className={cn(
              "h-8 shrink-0 rounded-xl px-3 flex items-center gap-2 border",
              idx === 0
                ? "bg-sky-500/15 border-sky-500/40 w-28"
                : "bg-surface/80 border-border w-24"
            )}
          >
            <div className="size-2 rounded-full bg-sky-400/60" />
            <div className="h-2.5 flex-1 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* ─── 4 Travel KPI Cards ─── */}
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
              <div className="h-7 w-28 rounded-lg bg-muted" />
              <div className="h-3 w-20 rounded bg-muted/60" />
            </div>
            <div className="flex items-center gap-1.5 border-t border-border/60 pt-2.5">
              <div className="size-2 rounded-full bg-sky-400/60" />
              <div className="h-2.5 w-24 rounded bg-muted/60" />
            </div>
          </div>
        ))}
      </div>

      {/* ─── Search & Itinerary Control Console ─── */}
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <div className="h-5 w-40 rounded-lg bg-muted" />
          <div className="h-6 w-24 rounded-full bg-sky-500/20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="h-16 rounded-2xl bg-bg border border-border p-3 space-y-1.5">
            <div className="h-2.5 w-16 rounded bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>
          <div className="h-16 rounded-2xl bg-bg border border-border p-3 space-y-1.5">
            <div className="h-2.5 w-16 rounded bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>
          <div className="h-16 rounded-2xl bg-bg border border-border p-3 space-y-1.5">
            <div className="h-2.5 w-16 rounded bg-muted" />
            <div className="h-4 w-28 rounded bg-muted" />
          </div>
        </div>
        <div className="h-11 w-full rounded-2xl bg-sky-500/30 border border-sky-500/40" />
      </div>
    </div>
  );
}

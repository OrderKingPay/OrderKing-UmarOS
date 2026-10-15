import { cn } from "@/lib/utils";

/**
 * CustomerAppSkeleton - Ultra-fast zero-latency skeleton for OrderKing Customer App
 * Guaranteed to paint in <16ms without waiting for network pings or server responses.
 */
export function CustomerAppSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-[#FCFAF7] pb-24 md:max-w-5xl select-none animate-pulse",
        className
      )}
      aria-busy="true"
      aria-label="Loading OrderKing"
    >
      {/* Luxury Golden Header Skeleton */}
      <div className="sticky top-0 z-30 bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] border-b border-amber-900/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-gradient-to-tr from-amber-400/40 via-yellow-300/30 to-amber-500/20 flex items-center justify-center">
            <span className="text-sm">👑</span>
          </div>
          <div className="space-y-1">
            <div className="h-4 w-24 bg-amber-200/50 rounded-md" />
            <div className="h-2 w-14 bg-amber-200/30 rounded-xs" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-20 bg-amber-200/40 rounded-full" />
          <div className="size-7 bg-amber-200/40 rounded-full" />
        </div>
      </div>

      {/* Main Body Skeleton */}
      <div className="px-4 py-4 space-y-4">
        {/* Search Bar Skeleton */}
        <div className="h-10 w-full bg-white/80 rounded-xl border border-amber-200/60 shadow-2xs flex items-center px-3 gap-2">
          <div className="size-4 rounded-full bg-amber-200/50" />
          <div className="h-3 w-40 bg-amber-100 rounded" />
        </div>

        {/* Categories Circular Skeletons */}
        <div className="flex gap-3 overflow-hidden py-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="size-16 rounded-full bg-gradient-to-tr from-amber-200/60 to-yellow-100/60 p-0.5">
                <div className="size-full rounded-full bg-white/90" />
              </div>
              <div className="h-2.5 w-12 bg-amber-200/40 rounded" />
            </div>
          ))}
        </div>

        {/* Card Grid Skeletons */}
        <div className="grid gap-4 md:grid-cols-2 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-3xl border border-amber-900/10 bg-white shadow-xs flex flex-col"
            >
              <div className="aspect-[16/10] w-full bg-gradient-to-r from-amber-100/60 via-amber-50 to-amber-100/60" />
              <div className="p-4 space-y-2 bg-gradient-to-b from-white to-amber-50/20">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-3/5 bg-amber-200/60 rounded" />
                  <div className="h-4 w-10 bg-amber-200/40 rounded" />
                </div>
                <div className="h-3 w-2/5 bg-amber-100/80 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

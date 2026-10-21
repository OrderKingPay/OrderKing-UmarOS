import { cn } from "@/lib/utils";

/**
 * TravelSkeleton - Ultra-fast zero-latency skeleton for Travel, Transit & Stays
 * Guaranteed to paint in <16ms without waiting for network pings or server responses.
 */
export function TravelSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-[#FAF9F5] pb-24 md:max-w-5xl select-none animate-pulse",
        className
      )}
      aria-busy="true"
      aria-label="Loading OrderKing Travel Hub"
    >
      {/* ─── Luxury Sapphire Travel Header ─── */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-sky-900/10 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-blue-600/30 flex items-center justify-center">
            <span className="text-base">✈️</span>
          </div>
          <div className="space-y-1">
            <div className="h-4 w-32 rounded-md bg-sky-200/60" />
            <div className="h-2.5 w-20 rounded bg-sky-100" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-20 rounded-full bg-sky-100/80" />
          <div className="size-7 rounded-full bg-sky-100" />
        </div>
      </div>

      <div className="space-y-4 px-4 py-4">
        {/* ─── Category Navigation Bar Skeleton ─── */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {["Flights", "Trains", "Buses", "Hotels", "Cabs", "FASTag", "My Trips"].map((label, idx) => (
            <div
              key={label}
              className={cn(
                "h-8 shrink-0 rounded-full px-3 flex items-center gap-1.5 border",
                idx === 0
                  ? "bg-sky-600/20 border-sky-400/40 w-24"
                  : "bg-white/80 border-slate-200/80 w-20"
              )}
            >
              <div className="size-3 rounded-full bg-sky-300/60" />
              <div className="h-2.5 flex-1 rounded bg-sky-200/50" />
            </div>
          ))}
        </div>

        {/* ─── Hero Booking Engine Search Card Skeleton ─── */}
        <div className="overflow-hidden rounded-3xl border border-sky-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-lg bg-sky-100" />
              <div className="h-6 w-24 rounded-lg bg-slate-100" />
            </div>
            <div className="h-5 w-24 rounded-full bg-amber-100/70" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="h-16 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3 space-y-2">
              <div className="h-2.5 w-16 rounded bg-slate-200" />
              <div className="h-4 w-36 rounded bg-slate-300/80" />
            </div>
            <div className="h-16 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3 space-y-2">
              <div className="h-2.5 w-16 rounded bg-slate-200" />
              <div className="h-4 w-36 rounded bg-slate-300/80" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="h-14 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3 space-y-1.5">
              <div className="h-2 w-14 rounded bg-slate-200" />
              <div className="h-3.5 w-24 rounded bg-slate-300/80" />
            </div>
            <div className="h-14 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3 space-y-1.5">
              <div className="h-2 w-16 rounded bg-slate-200" />
              <div className="h-3.5 w-20 rounded bg-slate-300/80" />
            </div>
          </div>

          <div className="h-12 w-full rounded-2xl bg-gradient-to-r from-sky-400/60 via-blue-500/60 to-sky-600/60" />
        </div>

        {/* ─── Carrier Live Guarantee Banner Skeleton ─── */}
        <div className="h-14 rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-emerald-200/80" />
            <div className="space-y-1">
              <div className="h-3 w-36 rounded bg-emerald-200" />
              <div className="h-2 w-48 rounded bg-emerald-100" />
            </div>
          </div>
          <div className="h-6 w-16 rounded-full bg-emerald-200/60" />
        </div>

        {/* ─── Popular Travel Routes Skeletons ─── */}
        <div className="space-y-3 pt-1">
          <div className="flex justify-between items-center">
            <div className="h-4 w-36 rounded bg-slate-300/70" />
            <div className="h-3 w-16 rounded bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div className="h-3 w-28 rounded bg-slate-200" />
                  <div className="h-5 w-16 rounded-full bg-sky-100" />
                </div>
                <div className="flex items-center justify-between py-1">
                  <div className="space-y-1">
                    <div className="h-4 w-12 rounded bg-slate-300" />
                    <div className="h-2.5 w-16 rounded bg-slate-200" />
                  </div>
                  <div className="h-2 w-16 rounded bg-sky-200" />
                  <div className="space-y-1 text-right">
                    <div className="h-4 w-12 rounded bg-slate-300 ml-auto" />
                    <div className="h-2.5 w-16 rounded bg-slate-200 ml-auto" />
                  </div>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                  <div className="h-4 w-20 rounded bg-slate-300" />
                  <div className="h-7 w-20 rounded-xl bg-sky-200/70" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

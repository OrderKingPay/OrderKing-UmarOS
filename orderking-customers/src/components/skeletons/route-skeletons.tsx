import { cn } from "@/lib/utils";

/**
 * EarnPageSkeleton - Ultra-luxurious skeleton for /earn (Crown Opportunities)
 */
export function EarnPageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-[#FCFAF7] pb-28 md:max-w-5xl select-none animate-pulse",
        className
      )}
      aria-busy="true"
      aria-label="Loading Crown Opportunities"
    >
      {/* Top Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-amber-900/10 bg-[#FFFDF9]/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-amber-400/30 flex items-center justify-center">
            <span className="text-sm">👑</span>
          </div>
          <div className="space-y-1">
            <div className="h-4 w-28 rounded-md bg-amber-200/60" />
            <div className="h-2.5 w-16 rounded bg-amber-100" />
          </div>
        </div>
        <div className="h-7 w-20 rounded-full bg-amber-200/40" />
      </div>

      <div className="space-y-6 px-4 py-5">
        {/* Royal Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-amber-400/40 bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-amber-400/40" />
            <div className="h-3 w-36 rounded bg-amber-200/40" />
          </div>
          <div className="h-8 w-3/4 rounded-xl bg-stone-700/60" />
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded bg-stone-700/40" />
            <div className="h-3 w-5/6 rounded bg-stone-700/40" />
          </div>
          <div className="flex gap-2 pt-2">
            <div className="h-6 w-32 rounded-full bg-amber-400/20" />
            <div className="h-6 w-28 rounded-full bg-emerald-400/20" />
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-amber-900/10 bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-100" />
              <div className="space-y-1">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="h-2.5 w-24 rounded bg-slate-100" />
              </div>
            </div>
            <div className="h-10 w-full rounded-lg bg-slate-50" />
          </div>
          <div className="rounded-3xl border border-amber-900/10 bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-100" />
              <div className="space-y-1">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="h-2.5 w-24 rounded bg-slate-100" />
              </div>
            </div>
            <div className="h-10 w-full rounded-lg bg-slate-50" />
          </div>
        </div>

        {/* Task List Skeletons */}
        <div className="space-y-3">
          <div className="h-5 w-40 rounded bg-amber-200/50" />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-2xl border border-amber-900/10 bg-white p-4 shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-amber-100/70" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 rounded bg-slate-200" />
                  <div className="h-2.5 w-20 rounded bg-slate-100" />
                </div>
              </div>
              <div className="h-8 w-24 rounded-xl bg-amber-400/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * KingPayPageSkeleton - Ultra-luxurious fintech dark skeleton for /king-pay
 */
export function KingPayPageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-[#0a0a0f] text-white pb-28 md:max-w-5xl select-none animate-pulse",
        className
      )}
      aria-busy="true"
      aria-label="Loading KingPay Hub"
    >
      {/* Top Fintech Nav */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-amber-500/20 bg-[#0a0a0f]/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-gradient-to-tr from-amber-400/40 to-yellow-500/20 flex items-center justify-center">
            <span className="text-sm">👑</span>
          </div>
          <div className="h-5 w-24 rounded bg-amber-400/40" />
        </div>
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-zinc-800" />
          <div className="size-8 rounded-full bg-zinc-800" />
        </div>
      </div>

      <div className="space-y-5 px-4 py-4">
        {/* Wallet Balance Hero Card */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-amber-950/40 p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 rounded bg-zinc-700" />
            <div className="h-5 w-16 rounded-full bg-emerald-500/20" />
          </div>
          <div className="h-10 w-44 rounded-xl bg-gradient-to-r from-amber-400/50 to-yellow-200/50" />
          <div className="h-3 w-32 rounded bg-zinc-700" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="h-11 rounded-2xl bg-amber-500/30 border border-amber-400/40" />
            <div className="h-11 rounded-2xl bg-zinc-800/80 border border-zinc-700" />
          </div>
        </div>

        {/* Quick Actions 4x2 Grid */}
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="size-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <div className="size-6 rounded-lg bg-zinc-700/60" />
              </div>
              <div className="h-2.5 w-12 rounded bg-zinc-800" />
            </div>
          ))}
        </div>

        {/* Recent Transactions List */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <div className="h-4 w-32 rounded bg-zinc-700" />
            <div className="h-3 w-16 rounded bg-zinc-800" />
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-zinc-800" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 rounded bg-zinc-700" />
                  <div className="h-2 w-20 rounded bg-zinc-800" />
                </div>
              </div>
              <div className="h-4 w-16 rounded bg-zinc-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * OrdersPageSkeleton - Ultra-luxurious skeleton for /orders
 */
export function OrdersPageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-[#FCFAF7] pb-28 md:max-w-5xl select-none animate-pulse",
        className
      )}
      aria-busy="true"
      aria-label="Loading Orders"
    >
      {/* Top Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-amber-900/10 bg-[#FFFDF9]/90 px-4 py-3 backdrop-blur-md">
        <div className="space-y-1">
          <div className="h-5 w-28 rounded-md bg-amber-200/60" />
          <div className="h-2.5 w-36 rounded bg-amber-100" />
        </div>
        <div className="h-8 w-24 rounded-full bg-amber-200/40" />
      </div>

      <div className="space-y-4 px-4 py-4">
        {/* Search Input */}
        <div className="h-10 w-full rounded-2xl border border-amber-200/60 bg-white p-3 flex items-center gap-2">
          <div className="size-4 rounded-full bg-amber-200" />
          <div className="h-3 w-40 rounded bg-amber-100" />
        </div>

        {/* Order Status Tabs */}
        <div className="flex gap-2">
          {["All Orders", "In Progress", "Delivered"].map((tab, i) => (
            <div
              key={tab}
              className={cn(
                "h-7 rounded-full px-3.5 flex items-center",
                i === 0 ? "bg-amber-500/20 border border-amber-300 w-24" : "bg-white border border-stone-200 w-20"
              )}
            >
              <div className="h-2.5 w-full rounded bg-stone-300/60" />
            </div>
          ))}
        </div>

        {/* Order Cards */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-3xl border border-amber-900/10 bg-white p-5 shadow-xs space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-amber-100/70" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 rounded bg-stone-300/80" />
                  <div className="h-2.5 w-20 rounded bg-stone-200" />
                </div>
              </div>
              <div className="h-6 w-20 rounded-full bg-emerald-100 border border-emerald-200" />
            </div>

            <div className="border-t border-amber-900/5 pt-3 space-y-2">
              <div className="h-3 w-3/4 rounded bg-stone-200/70" />
              <div className="h-3 w-1/2 rounded bg-stone-200/50" />
            </div>

            <div className="flex items-center justify-between border-t border-amber-900/5 pt-3">
              <div className="h-4 w-16 rounded bg-stone-300" />
              <div className="flex gap-2">
                <div className="h-8 w-20 rounded-xl bg-stone-100 border border-stone-200" />
                <div className="h-8 w-24 rounded-xl bg-amber-500/20 border border-amber-300" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * CartPageSkeleton - Ultra-luxurious skeleton for /cart
 */
export function CartPageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-[#FCFAF7] pb-28 md:max-w-5xl select-none animate-pulse",
        className
      )}
      aria-busy="true"
      aria-label="Loading Cart"
    >
      {/* Top Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-amber-900/10 bg-[#FFFDF9]/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-stone-200/60" />
          <div className="space-y-1">
            <div className="h-4 w-24 rounded bg-amber-200/60" />
            <div className="h-2.5 w-32 rounded bg-amber-100" />
          </div>
        </div>
        <div className="h-6 w-16 rounded-full bg-amber-200/40" />
      </div>

      <div className="space-y-4 px-4 py-4">
        {/* Restaurant Banner Skeleton */}
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-3.5 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-200/60" />
          <div className="space-y-1">
            <div className="h-3.5 w-32 rounded bg-amber-300/70" />
            <div className="h-2.5 w-24 rounded bg-amber-200/50" />
          </div>
        </div>

        {/* Cart Item Rows */}
        <div className="rounded-3xl border border-amber-900/10 bg-white p-4 shadow-xs space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
              <div className="flex items-center gap-2.5">
                <div className="size-4 rounded border border-emerald-500 bg-emerald-50" />
                <div className="space-y-1">
                  <div className="h-3.5 w-32 rounded bg-stone-300" />
                  <div className="h-2.5 w-16 rounded bg-stone-200" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-7 w-20 rounded-xl bg-amber-100/70 border border-amber-200" />
                <div className="h-3.5 w-12 rounded bg-stone-300" />
              </div>
            </div>
          ))}
        </div>

        {/* Coupon Card */}
        <div className="h-12 rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded bg-amber-300/60" />
            <div className="h-3 w-28 rounded bg-amber-200" />
          </div>
          <div className="h-6 w-16 rounded-lg bg-amber-400/30" />
        </div>

        {/* Bill Summary */}
        <div className="rounded-3xl border border-amber-900/10 bg-white p-5 shadow-xs space-y-3">
          <div className="h-4 w-28 rounded bg-stone-300 mb-2" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3 w-24 rounded bg-stone-200" />
              <div className="h-3 w-12 rounded bg-stone-200" />
            </div>
          ))}
          <div className="border-t border-stone-200 pt-3 flex justify-between">
            <div className="h-4 w-20 rounded bg-stone-400" />
            <div className="h-4 w-16 rounded bg-amber-500/70" />
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-amber-900/10 bg-[#FFFDF9]/95 p-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg md:max-w-5xl items-center justify-between">
          <div className="space-y-1">
            <div className="h-2.5 w-14 rounded bg-stone-300" />
            <div className="h-5 w-20 rounded bg-amber-500/60" />
          </div>
          <div className="h-12 w-48 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 shadow-md" />
        </div>
      </div>
    </div>
  );
}

/**
 * CheckoutPageSkeleton - Ultra-luxurious skeleton for /checkout
 */
export function CheckoutPageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-[#FCFAF7] pb-32 md:max-w-5xl select-none animate-pulse",
        className
      )}
      aria-busy="true"
      aria-label="Loading Checkout"
    >
      {/* Top Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-amber-900/10 bg-[#FFFDF9]/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-stone-200/60" />
          <div className="space-y-1">
            <div className="h-4 w-28 rounded bg-amber-200/60" />
            <div className="h-2.5 w-20 rounded bg-amber-100" />
          </div>
        </div>
        <div className="h-6 w-24 rounded-full bg-emerald-100 border border-emerald-200" />
      </div>

      <div className="space-y-4 px-4 py-4">
        {/* Address Card */}
        <div className="rounded-3xl border border-amber-900/10 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-amber-400/30" />
              <div className="h-4 w-32 rounded bg-stone-300" />
            </div>
            <div className="h-6 w-14 rounded-lg bg-stone-100" />
          </div>
          <div className="space-y-1.5 pl-8">
            <div className="h-3 w-5/6 rounded bg-stone-200" />
            <div className="h-3 w-2/3 rounded bg-stone-200" />
          </div>
        </div>

        {/* Delivery Options */}
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 rounded-2xl border border-amber-400/50 bg-amber-50/60 p-3 space-y-1.5">
            <div className="h-3 w-20 rounded bg-amber-300" />
            <div className="h-2.5 w-16 rounded bg-amber-200" />
          </div>
          <div className="h-16 rounded-2xl border border-stone-200 bg-white p-3 space-y-1.5">
            <div className="h-3 w-20 rounded bg-stone-300" />
            <div className="h-2.5 w-16 rounded bg-stone-200" />
          </div>
        </div>

        {/* Payment Methods */}
        <div className="rounded-3xl border border-amber-900/10 bg-white p-5 shadow-xs space-y-3">
          <div className="h-4 w-36 rounded bg-stone-300 mb-2" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-stone-100" />
                <div className="h-3.5 w-32 rounded bg-stone-200" />
              </div>
              <div className="size-5 rounded-full border-2 border-stone-300" />
            </div>
          ))}
        </div>

        {/* Bill Summary */}
        <div className="rounded-3xl border border-amber-900/10 bg-white p-5 shadow-xs space-y-3">
          <div className="h-4 w-28 rounded bg-stone-300 mb-2" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-24 rounded bg-stone-200" />
              <div className="h-3 w-12 rounded bg-stone-200" />
            </div>
            <div className="flex justify-between">
              <div className="h-3 w-28 rounded bg-stone-200" />
              <div className="h-3 w-12 rounded bg-stone-200" />
            </div>
            <div className="flex justify-between border-t border-stone-100 pt-2">
              <div className="h-4 w-20 rounded bg-stone-400" />
              <div className="h-4 w-16 rounded bg-amber-500/70" />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Place Order Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-amber-900/10 bg-[#FFFDF9]/95 p-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg md:max-w-5xl items-center justify-between">
          <div className="space-y-1">
            <div className="h-2.5 w-16 rounded bg-stone-300" />
            <div className="h-5 w-24 rounded bg-amber-500/70" />
          </div>
          <div className="h-12 w-48 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 shadow-md" />
        </div>
      </div>
    </div>
  );
}

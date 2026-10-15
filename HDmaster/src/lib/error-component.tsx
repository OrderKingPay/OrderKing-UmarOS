import type { ErrorComponentProps } from "@tanstack/react-router";
import { AlertTriangle, RotateCcw, LayoutDashboard, RefreshCw, ShieldCheck } from "lucide-react";
import { isChunkLoadError, triggerSelfHealingReload } from "@/lib/lazy-retry";
import { SlowNetworkFallbackCard } from "@/components/ui/slow-network-fallback";

export function isNetworkTimeoutError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    /network|timeout|timed out|offline|fetch failed|failed to fetch|networkerror|abort|connection refused/i.test(msg) ||
    (typeof navigator !== "undefined" && !navigator.onLine)
  );
}

export function AppErrorComponent({ error, reset }: ErrorComponentProps) {
  const isChunk = isChunkLoadError(error);
  const isNetwork = isNetworkTimeoutError(error);
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "An unexpected route transition error occurred.";

  const handleRetry = () => {
    if (typeof reset === "function") {
      try {
        reset();
        return;
      } catch {}
    }
    window.location.reload();
  };

  const handlePurgeAndReload = async () => {
    try {
      if ("caches" in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((k) => window.caches.delete(k)));
      }
      sessionStorage.clear();
      localStorage.removeItem("hdmaster_chunk_reload_lock");
    } catch {}
    window.location.reload();
  };

  if (isNetwork) {
    return (
      <main
        role="alert"
        className="fixed inset-0 z-[9999] flex min-h-screen w-full flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-zinc-900 dark:text-zinc-50 select-none overflow-y-auto"
      >
        <SlowNetworkFallbackCard
          title="Slow Network Timeout"
          message={message.includes("timeout") || message.includes("timed out")
            ? message
            : "Umar OS module data took too long to load over the current connection. System state is safe."}
          onRetry={handleRetry}
        />
      </main>
    );
  }

  return (
    <main
      role="alert"
      className="fixed inset-0 z-[9999] flex min-h-screen w-full flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-zinc-900 dark:text-zinc-50 select-none overflow-y-auto"
    >
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 text-center shadow-2xl space-y-5">
        <div className="relative mx-auto flex size-16 items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-md animate-pulse" />
          <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md">
            <AlertTriangle className="size-8 stroke-[2.2]" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight">
            {isChunk ? "Version Synchronization" : "Umar OS Route Recovery"}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {isChunk
              ? "New application bundle deployed. Auto-syncing route components..."
              : "We caught a momentary transition hiccup. System state and credentials are fully intact."}
          </p>
        </div>

        {message && (
          <div className="rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 text-left">
            <p className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 break-words line-clamp-3">
              {message}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleRetry}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 px-5 py-3 text-sm font-bold text-white shadow-md transition cursor-pointer"
          >
            <RotateCcw className="size-4 stroke-[2.2]" />
            Try Again Instantly
          </button>

          <button
            type="button"
            onClick={handlePurgeAndReload}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 transition cursor-pointer"
          >
            <RefreshCw className="size-4 stroke-[2]" />
            Purge Cache & Refresh
          </button>

          <a
            href="/app"
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 px-5 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
          >
            <LayoutDashboard className="size-4 stroke-[2]" />
            Back to Command Hub
          </a>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 pt-1">
          <ShieldCheck className="size-4 stroke-[2.2]" />
          <span>Umar OS Zero-White-Screen SafeShield</span>
        </div>
      </div>
    </main>
  );
}

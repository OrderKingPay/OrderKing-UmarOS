import React, { Component, Suspense, type ReactNode } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { isChunkLoadError, triggerSelfHealingReload } from "@/lib/lazy-retry";
import { WorldSkeleton } from "@/components/skeletons/world-skeleton";
import { RotateCcw, AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";

interface ResilientOutletBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  currentPath: string;
}

interface ResilientOutletBoundaryState {
  hasError: boolean;
  error: unknown;
  retryAttempt: number;
  isRetrying: boolean;
}

class ResilientOutletBoundary extends Component<
  ResilientOutletBoundaryProps,
  ResilientOutletBoundaryState
> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: ResilientOutletBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryAttempt: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: unknown): Partial<ResilientOutletBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown) {
    const isChunk = isChunkLoadError(error);
    const { retryAttempt } = this.state;

    console.warn(
      `[HDmaster ResilientRouteOutlet] Intercepted outlet error (chunkError=${isChunk}, attempt=${retryAttempt}/3):`,
      error
    );

    if (isChunk && retryAttempt < 3) {
      // 3x exponential backoff: 400ms, 800ms, 1600ms
      const delay = 400 * Math.pow(2, retryAttempt);
      this.setState({ isRetrying: true });

      if (this.retryTimeout) clearTimeout(this.retryTimeout);
      this.retryTimeout = setTimeout(() => {
        this.setState((prev) => ({
          hasError: false,
          error: null,
          isRetrying: false,
          retryAttempt: prev.retryAttempt + 1,
        }));
      }, delay);
    } else if (isChunk && retryAttempt >= 3) {
      // Self-healing cache purge reload
      triggerSelfHealingReload("outlet_chunk_retry_exhausted");
    }
  }

  componentDidUpdate(prevProps: ResilientOutletBoundaryProps) {
    // If route changes (e.g. browser back button / reverse navigation), immediately reset error state
    if (prevProps.currentPath !== this.props.currentPath && this.state.hasError) {
      if (this.retryTimeout) clearTimeout(this.retryTimeout);
      this.setState({
        hasError: false,
        error: null,
        retryAttempt: 0,
        isRetrying: false,
      });
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) clearTimeout(this.retryTimeout);
  }

  handleManualRetry = () => {
    if (this.retryTimeout) clearTimeout(this.retryTimeout);
    this.setState({
      hasError: false,
      error: null,
      isRetrying: false,
      retryAttempt: 0,
    });
  };

  handleHardRefresh = async () => {
    try {
      if (typeof window !== "undefined") {
        if ("caches" in window) {
          const keys = await window.caches.keys();
          await Promise.all(keys.map((k) => window.caches.delete(k)));
        }
        sessionStorage.clear();
        localStorage.removeItem("hdmaster_chunk_reload_lock");
        window.location.reload();
      }
    } catch {
      if (typeof window !== "undefined") window.location.reload();
    }
  };

  render() {
    const { hasError, error, isRetrying, retryAttempt } = this.state;
    const { fallback, children } = this.props;

    if (hasError) {
      const isChunk = isChunkLoadError(error);

      // If actively retrying in the background with backoff, show the ultra-luxurious skeleton
      if (isRetrying || (isChunk && retryAttempt < 3)) {
        return fallback || <WorldSkeleton />;
      }

      // If max retries reached or non-recoverable error, show luxury zero-white-screen recovery card
      return (
        <div className="relative min-h-[70vh] w-full flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 select-none">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 text-center shadow-2xl space-y-5">
            <div className="relative mx-auto flex size-16 items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-md animate-pulse" />
              <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md">
                <AlertTriangle className="size-8 stroke-[2.2]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {isChunk ? "Version Synchronization" : "Umar OS Route Recovery"}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {isChunk
                  ? "A new platform version was deployed. We attempted auto-syncing, tap below to finalize."
                  : "We caught a momentary transition condition. Control state and credentials remain 100% secure."}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={this.handleManualRetry}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 px-5 py-3 text-sm font-bold text-white shadow-md transition cursor-pointer"
              >
                <RotateCcw className="size-4 stroke-[2.2]" />
                Resume View
              </button>

              <button
                type="button"
                onClick={this.handleHardRefresh}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 transition cursor-pointer"
              >
                <RefreshCw className="size-4 stroke-[2]" />
                Purge Cache & Refresh
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 pt-1">
              <ShieldCheck className="size-4 stroke-[2.2]" />
              <span>Umar OS Zero-White-Screen SafeShield</span>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * ResilientRouteOutlet - Wraps TanStack Router's <Outlet /> with:
 * 1. 3x exponential backoff retry on ChunkLoadError
 * 2. Instant reset on route/pathname change (reverse navigation)
 * 3. Ultra-luxurious skeleton suspense fallback to eliminate white screens
 */
export function ResilientRouteOutlet({ fallback }: { fallback?: ReactNode }) {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const activeFallback = fallback || <WorldSkeleton />;

  return (
    <ResilientOutletBoundary currentPath={currentPath} fallback={activeFallback}>
      <Suspense fallback={activeFallback}>
        <Outlet />
      </Suspense>
    </ResilientOutletBoundary>
  );
}

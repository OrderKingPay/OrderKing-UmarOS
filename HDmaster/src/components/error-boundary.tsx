import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, LayoutDashboard, RefreshCw, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { isChunkLoadError, triggerSelfHealingReload } from "@/lib/lazy-retry";

export interface AdminErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  inline?: boolean;
  sectionName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class AdminErrorBoundary extends Component<AdminErrorBoundaryProps, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error(`[Umar OS ErrorBoundary${this.props.sectionName ? `:${this.props.sectionName}` : ""}] Uncaught error:`, error, errorInfo.componentStack);

    // Auto-heal chunk mismatches immediately if not already reloaded
    if (isChunkLoadError(error)) {
      triggerSelfHealingReload(`boundary_catch_${this.props.sectionName || "admin"}`);
    }
  }

  resetError = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  handleClearCacheAndReload = async () => {
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

  render() {
    if (this.state.hasError && this.state.error) {
      const error = this.state.error;
      const isChunk = isChunkLoadError(error);

      if (typeof this.props.fallback === "function") {
        return this.props.fallback(error, this.resetError);
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // INLINE FALLBACK (for cards, tabs, charts, sub-modules)
      if (this.props.inline) {
        return (
          <div
            role="alert"
            className="w-full my-3 p-5 rounded-2xl border border-red-200/80 bg-red-50/50 dark:border-red-900/60 dark:bg-red-950/20 text-foreground shadow-xs"
          >
            <div className="flex items-start gap-3.5">
              <div className="size-9 rounded-xl bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="size-5 stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground">
                  {this.props.sectionName ? `${this.props.sectionName} Encountered a Glitch` : "Module Fault Intercepted"}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {isChunk
                    ? "A newer bundle hash was deployed or network hiccuped while loading this component."
                    : error.message || "An unexpected exception was caught in this section."}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={this.resetError}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <RotateCcw className="size-3.5" />
                    Retry Component
                  </button>
                  <button
                    type="button"
                    onClick={this.handleClearCacheAndReload}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background hover:bg-muted border border-border text-foreground text-xs font-semibold transition cursor-pointer"
                  >
                    <RefreshCw className="size-3.5" />
                    Purge & Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // FULL SCREEN RESILIENT FALLBACK (for root and unhandled top-level crashes)
      return (
        <main
          role="alert"
          className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col items-center justify-center p-6 select-none"
        >
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 text-center shadow-2xl space-y-5">
            {/* Ambient luxury shield icon */}
            <div className="relative mx-auto flex size-16 items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-md animate-pulse" />
              <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md">
                <AlertTriangle className="size-8 stroke-[2.2]" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight">
                {isChunk ? "Control Center Synchronization" : "Umar OS Resilient Recovery"}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {isChunk
                  ? "A newer platform update was published. Synchronizing your active control deck..."
                  : (error.message || "An unexpected error occurred. Central state and credentials remain fully protected.")}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.resetError}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 px-5 py-3 text-sm font-bold text-white shadow-md transition cursor-pointer"
              >
                <RotateCcw className="size-4 stroke-[2.2]" />
                Try Again Instantly
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 transition cursor-pointer"
              >
                <RefreshCw className="size-4 stroke-[2]" />
                Purge Cache & Hard Refresh
              </button>

              <a
                href="/app"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 px-5 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              >
                <LayoutDashboard className="size-4 stroke-[2]" />
                Return to Command Overview
              </a>
            </div>

            {/* Collapsible diagnostic details */}
            <div className="pt-2 text-left">
              <button
                type="button"
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                <span>Diagnostic Details</span>
                {this.state.showDetails ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </button>
              {this.state.showDetails && (
                <div className="mt-2 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 text-[10px] font-mono text-zinc-800 dark:text-zinc-200 max-h-36 overflow-auto">
                  <p className="font-bold text-red-500">{error.name}: {error.message}</p>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="mt-1 text-zinc-500 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                  )}
                </div>
              )}
            </div>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 pt-1">
              <ShieldCheck className="size-4 stroke-[2.2]" />
              <span>Umar OS Zero-Crash Architecture</span>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

// Export both ErrorBoundary and AdminErrorBoundary for seamless drop-in
export const ErrorBoundary = AdminErrorBoundary;

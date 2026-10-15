import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RotateCcw, Home, RefreshCw, ChevronDown, ChevronUp, Sparkles, ShieldCheck } from "lucide-react";
import { isChunkLoadError, triggerSelfHealingReload } from "@/lib/lazy-retry";

export interface ErrorBoundaryProps {
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

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
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
    console.error(`[OrderKing ErrorBoundary${this.props.sectionName ? `:${this.props.sectionName}` : ""}] Uncaught error:`, error, errorInfo.componentStack);

    // Auto-heal chunk mismatches immediately if not already reloaded
    if (isChunkLoadError(error)) {
      triggerSelfHealingReload(`boundary_catch_${this.props.sectionName || "app"}`);
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
      localStorage.removeItem("orderking_chunk_reload_lock");
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

      // INLINE FALLBACK (for dialogs, drawers, widgets, maps)
      if (this.props.inline) {
        return (
          <div
            role="alert"
            className="w-full my-2 p-4 rounded-2xl border border-amber-200/90 bg-amber-50/70 text-slate-900 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-xl bg-amber-500/15 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="size-5 stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900">
                  {this.props.sectionName ? `${this.props.sectionName} Temporarily Unavailable` : "Section Hiccup"}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                  {isChunk
                    ? "A newer version was deployed or network hiccuped while loading this component."
                    : error.message || "An unexpected issue occurred in this section."}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={this.resetError}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <RotateCcw className="size-3.5" />
                    Retry Section
                  </button>
                  <button
                    type="button"
                    onClick={this.handleClearCacheAndReload}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                  >
                    <RefreshCw className="size-3.5" />
                    Refresh App
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // FULL SCREEN RESILIENT FALLBACK (for root and major layouts)
      return (
        <main
          role="alert"
          className="min-h-screen w-full bg-[#FAF7F2] text-gray-900 flex flex-col items-center justify-center p-6 select-none"
        >
          <div className="w-full max-w-md rounded-3xl bg-white border border-amber-200/90 p-8 text-center shadow-[0_20px_50px_rgba(245,158,11,0.12)] space-y-5">
            {/* Ambient luxury icon */}
            <div className="relative mx-auto flex size-16 items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-amber-400/25 blur-md animate-pulse" />
              <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-amber-600/20 border border-amber-300 text-amber-700 shadow-sm">
                <AlertCircle className="size-8 stroke-[2.2]" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-gray-950 tracking-tight">
                {isChunk ? "Seamless App Synchronization" : "Safe Transition Recovery"}
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                {isChunk
                  ? "OrderKing was updated with fresh speeds and enhancements. One click syncs your active session instantly."
                  : (error.message || "An unexpected condition occurred. We've captured the diagnostics and secured your state.")}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.resetError}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-amber-500/25 transition-all hover:brightness-105 active:scale-98 cursor-pointer"
              >
                <RotateCcw className="size-4 stroke-[2.2]" />
                Try Again Instantly
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200/70 px-5 py-3 text-sm font-bold text-amber-900 transition-all active:scale-98 cursor-pointer"
              >
                <RefreshCw className="size-4 stroke-[2]" />
                Clear Cache & Refresh
              </button>

              <a
                href="/"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-100 hover:bg-stone-200/80 px-5 py-3 text-sm font-semibold text-stone-800 transition-all active:scale-98 cursor-pointer"
              >
                <Home className="size-4 stroke-[2]" />
                Back to Food Delivery
              </a>
            </div>

            {/* Collapsible diagnostic details */}
            <div className="pt-2 text-left">
              <button
                type="button"
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800"
              >
                <span>Diagnostic Details</span>
                {this.state.showDetails ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </button>
              {this.state.showDetails && (
                <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-[10px] font-mono text-slate-700 max-h-36 overflow-auto">
                  <p className="font-bold text-red-600">{error.name}: {error.message}</p>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="mt-1 text-slate-500 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                  )}
                </div>
              )}
            </div>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-700 pt-1">
              <ShieldCheck className="size-4 text-emerald-600 stroke-[2.2]" />
              <span>OrderKing SafeShield Protected</span>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

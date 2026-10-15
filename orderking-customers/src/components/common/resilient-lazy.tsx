import React, { Component, lazy, type ComponentType, type ReactNode } from "react";
import { AlertCircle, RefreshCw, X, RotateCcw } from "lucide-react";
import { isChunkLoadError, triggerSelfHealingReload } from "@/lib/lazy-retry";

interface ResilientModalFallbackProps {
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  componentName?: string;
  onRetry?: () => void;
}

/**
 * Resilient non-crashing fallback rendered when a lazy modal chunk fails
 * to load over a degraded, offline, or slow network.
 */
export function ResilientModalFallback({
  onClose,
  onOpenChange,
  componentName = "Feature",
  onRetry,
}: ResilientModalFallbackProps) {
  const dismiss = () => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  const handleClearCacheAndReload = async () => {
    try {
      if (typeof window !== "undefined") {
        if ("caches" in window) {
          const keys = await window.caches.keys();
          await Promise.all(keys.map((k) => window.caches.delete(k)));
        }
        sessionStorage.clear();
        localStorage.removeItem("orderking_chunk_reload_lock");
        window.location.reload();
      }
    } catch {
      if (typeof window !== "undefined") window.location.reload();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="degraded-network-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div className="relative max-w-sm w-full rounded-3xl bg-white border border-amber-200/90 p-6 text-center shadow-[0_20px_50px_rgba(245,158,11,0.15)] space-y-4">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition"
          aria-label="Dismiss modal"
        >
          <X className="size-4" />
        </button>

        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 shadow-xs">
          <AlertCircle className="size-6 stroke-[2.2]" />
        </div>

        <div className="space-y-1">
          <h3 id="degraded-network-title" className="text-base font-black text-stone-900 tracking-tight">
            Seamless Recovery
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed max-w-xs mx-auto">
            {componentName} could not be loaded due to a bundle update or network hiccup. Your active order and cart remain 100% secure.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={dismiss}
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-bold text-stone-700 transition"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => {
                if (onRetry) {
                  onRetry();
                } else if (typeof window !== "undefined") {
                  window.location.reload();
                }
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-xs font-black text-white shadow-sm transition"
            >
              <RotateCcw className="size-3.5" />
              <span>Retry</span>
            </button>
          </div>
          <button
            type="button"
            onClick={handleClearCacheAndReload}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-bold transition"
          >
            <RefreshCw className="size-3" />
            <span>Clear Cache & Reload App</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Higher-order error boundary protecting modal rendering from crashing the host shell.
 */
export class ModalErrorBoundary extends Component<
  { children: ReactNode; onClose?: () => void; componentName?: string },
  { hasError: boolean; error: Error | null }
> {
  state: { hasError: boolean; error: Error | null } = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn(
      `[ModalErrorBoundary] Safely caught error in ${this.props.componentName || "Modal"}:`,
      error,
      errorInfo.componentStack
    );
    if (isChunkLoadError(error)) {
      triggerSelfHealingReload(`modal_error_${this.props.componentName || "modal"}`);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ResilientModalFallback
          componentName={this.props.componentName}
          onClose={() => {
            this.reset();
            if (this.props.onClose) this.props.onClose();
          }}
          onRetry={this.reset}
        />
      );
    }
    return this.props.children;
  }
}

/**
 * Creates a resilient lazy component with retry backoff, chunk detection, and auto-reload on failure,
 * ensuring the host shell never crashes if network is offline or degraded.
 */
export function resilientLazy<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T } | { [key: string]: any }>,
  componentName = "Feature",
  retries = 3,
  baseDelay = 500
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: any = null;
    let delay = baseDelay;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const module = await importer();
        if ("default" in module) {
          return { default: module.default as T };
        }
        const keys = Object.keys(module);
        for (const k of keys) {
          if (typeof (module as any)[k] === "function") {
            return { default: (module as any)[k] as T };
          }
        }
        return { default: module as unknown as T };
      } catch (err) {
        lastError = err;
        const isChunk = isChunkLoadError(err);
        console.warn(
          `[resilientLazy] Attempt ${attempt}/${retries} to load ${componentName} failed (chunkError=${isChunk}):`,
          err
        );

        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2;
        } else {
          // If all retries failed and it's a chunk error, auto-heal via reload
          if (isChunk) {
            const reloaded = triggerSelfHealingReload(`resilient_lazy_${componentName}`);
            if (reloaded) {
              return new Promise<never>(() => {});
            }
          }
        }
      }
    }

    console.error(
      `[resilientLazy] All ${retries} attempts to load ${componentName} failed. Rendering safe fallback.`,
      lastError
    );

    // Provide a resilient fallback component that conforms to standard modal props
    const SafeFallbackComponent = (props: any) => (
      <ResilientModalFallback
        componentName={componentName}
        onClose={props.onClose}
        onOpenChange={props.onOpenChange}
      />
    );

    return { default: SafeFallbackComponent as unknown as T };
  });
}

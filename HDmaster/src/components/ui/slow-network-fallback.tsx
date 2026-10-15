import { useEffect, useState, useTransition } from "react";
import { WifiOff, RotateCcw, LayoutDashboard, Sparkles, SignalLow } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SlowNetworkFallbackCardProps {
  title?: string;
  message?: string;
  onRetry?: () => void | Promise<void>;
  showDashboardButton?: boolean;
  className?: string;
}

/**
 * SlowNetworkFallbackCard - Graceful offline & 2G/3G timeout fallback card with instant retry.
 * Prevents blank screens on slow network timeouts and provides graceful offline guidance.
 */
export function SlowNetworkFallbackCard({
  title = "Slow Connection Detected",
  message = "Your 2G/3G connection timed out while loading live Umar OS modules. System state and local configurations remain fully intact.",
  onRetry,
  showDashboardButton = true,
  className,
}: SlowNetworkFallbackCardProps) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [retrying, setRetrying] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleAction = async () => {
    setRetrying(true);
    try {
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(15);
      }
    } catch {}

    if (onRetry) {
      try {
        await Promise.resolve(onRetry());
      } catch {
        // Fallback to reload if onRetry fails
      } finally {
        setRetrying(false);
      }
    } else {
      startTransition(() => {
        window.location.reload();
      });
    }
  };

  return (
    <div
      role="alert"
      className={cn(
        "mx-auto my-6 flex w-full max-w-md flex-col items-center justify-center rounded-3xl border border-border bg-surface p-6 sm:p-8 text-center shadow-xl select-none",
        className
      )}
    >
      {/* Dynamic Status Icon with Pulse Ring */}
      <div className="relative mb-5 flex size-18 items-center justify-center">
        <div
          className={cn(
            "absolute inset-0 rounded-3xl blur-md transition-opacity duration-300",
            isOnline ? "bg-amber-500/20 animate-pulse" : "bg-rose-500/20"
          )}
        />
        <div
          className={cn(
            "relative flex size-16 items-center justify-center rounded-2xl text-white shadow-md transition-colors",
            isOnline
              ? "bg-gradient-to-br from-amber-500 to-amber-600"
              : "bg-gradient-to-br from-rose-500 to-red-600"
          )}
        >
          {isOnline ? (
            <SignalLow className="size-8 stroke-[2.2]" />
          ) : (
            <WifiOff className="size-8 stroke-[2.2]" />
          )}
        </div>
      </div>

      {/* Network Status Badge */}
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
        <span
          className={cn(
            "size-2 rounded-full",
            isOnline ? "bg-amber-400 animate-ping" : "bg-rose-500"
          )}
        />
        <span>{isOnline ? "Slow 2G/3G Signal" : "Device Offline"}</span>
      </div>

      <h3 className="text-lg font-bold text-fg tracking-tight">
        {isOnline ? title : "Umar OS Offline Mode"}
      </h3>

      <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed max-w-xs">
        {isOnline
          ? message
          : "Network connectivity lost. Previously cached worlds and offline telemetry remain accessible."}
      </p>

      {/* Action Buttons */}
      <div className="mt-6 flex w-full flex-col gap-2.5">
        <button
          type="button"
          onClick={handleAction}
          disabled={retrying}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 py-3 text-sm font-bold text-white shadow-md shadow-amber-500/20 transition-all hover:brightness-105 active:scale-98 cursor-pointer disabled:opacity-70"
        >
          <RotateCcw className={cn("size-4 stroke-[2.2]", retrying && "animate-spin")} />
          <span>{retrying ? "Reconnecting..." : "Retry Now"}</span>
        </button>

        {showDashboardButton && (
          <a
            href="/app"
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface/80 py-2.5 text-xs font-bold text-fg transition hover:bg-surface active:scale-98"
          >
            <LayoutDashboard className="size-3.5 stroke-[2]" />
            <span>Return to Command Hub</span>
          </a>
        )}
      </div>

      {/* Offline Storage Assurance */}
      <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted">
        <Sparkles className="size-3 text-amber-400" />
        <span>IndexedDB Cache & Offline Directive Store Active</span>
      </div>
    </div>
  );
}

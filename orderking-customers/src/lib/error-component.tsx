
import type { ErrorComponentProps } from "@tanstack/react-router";
import { AlertTriangle, RotateCcw, Home, ShieldCheck } from "lucide-react";

export function AppErrorComponent({ error, reset }: ErrorComponentProps) {
  const errorMessage =
    error instanceof Error ? error.message : typeof error === "string" ? error : "An unexpected transition error occurred.";

  const handleRetry = () => {
    if (typeof reset === "function") {
      try {
        reset();
        return;
      } catch {
        // Fallback to window reload
      }
    }
    window.location.reload();
  };

  return (
    <main
      role="alert"
      className="fixed inset-0 z-[9999] flex min-h-screen w-full flex-col items-center justify-center bg-[#FAF7F2] p-6 text-slate-900 select-none overflow-y-auto"
    >
      <div className="w-full max-w-md rounded-3xl bg-white border border-amber-200/90 p-7 sm:p-9 text-center shadow-[0_25px_60px_rgba(245,158,11,0.15)] space-y-6">
        {/* Luxury Shield Icon with Ambient Gold Ring */}
        <div className="relative mx-auto flex size-20 items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-amber-400/20 blur-md animate-pulse" />
          <div className="relative flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-white shadow-[0_8px_20px_rgba(245,158,11,0.35),inset_0_1px_2px_rgba(255,255,255,0.7)]">
            <AlertTriangle className="size-10 stroke-[2.2] drop-shadow-sm" />
          </div>
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Seamless Recovery
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
            We caught a momentary transition hiccup. Your cart, orders, and wallet balance remain 100% secure.
          </p>
        </div>

        {/* Technical summary (compact) */}
        {errorMessage && (
          <div className="rounded-2xl bg-amber-50/70 border border-amber-200/60 p-3 text-left">
            <p className="text-[11px] font-mono text-amber-950 break-words line-clamp-3">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-1">
          <button
            type="button"
            onClick={handleRetry}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-amber-500/25 transition-all hover:brightness-105 active:scale-98 cursor-pointer"
          >
            <RotateCcw className="size-4 stroke-[2.4]" />
            Try Again Instantly
          </button>

          <a
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-100 hover:bg-stone-200/80 px-6 py-3.5 text-sm font-bold text-stone-800 transition-all active:scale-98 cursor-pointer"
          >
            <Home className="size-4 stroke-[2.2]" />
            Go to Food Delivery
          </a>
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

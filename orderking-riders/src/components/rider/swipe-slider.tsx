import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SwipeSliderProps {
  label: string;
  onComplete: () => Promise<void> | void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "online" | "offline" | "gold" | "sapphire" | "emerald";
  icon?: ReactNode;
  completedLabel?: string;
  className?: string;
  confirmThreshold?: number; // 0 to 1, default 0.82
}

export function SwipeSlider({
  label,
  onComplete,
  disabled = false,
  loading = false,
  variant = "gold",
  icon,
  completedLabel,
  className,
  confirmThreshold = 0.82,
}: SwipeSliderProps) {
  const [dragProgress, setDragProgress] = useState(0); // 0 to 1
  const [isDragging, setIsDragging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentDragRef = useRef(0);

  // Trigger haptic feedback when supported
  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([40, 25, 60]);
      } catch {
        // Ignore haptic failures
      }
    }
  }, []);

  const handleComplete = useCallback(async () => {
    setIsCompleted(true);
    triggerHaptic();
    try {
      await onComplete();
    } finally {
      // Reset after a brief pause so slider can be used again if needed
      setTimeout(() => {
        setIsCompleted(false);
        setDragProgress(0);
        currentDragRef.current = 0;
      }, 750);
    }
  }, [onComplete, triggerHaptic]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || loading || isCompleted) return;
    setIsDragging(true);
    startXRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || disabled || loading || isCompleted) return;
    if (!trackRef.current || !thumbRef.current) return;

    const trackWidth = trackRef.current.clientWidth;
    const thumbWidth = thumbRef.current.clientWidth;
    const maxDragDistance = trackWidth - thumbWidth;

    if (maxDragDistance <= 0) return;

    const deltaX = e.clientX - startXRef.current;
    const clampedDelta = Math.max(0, Math.min(deltaX, maxDragDistance));
    const progress = clampedDelta / maxDragDistance;

    currentDragRef.current = progress;
    setDragProgress(progress);

    if (progress >= confirmThreshold && !isCompleted) {
      setIsDragging(false);
      setDragProgress(1);
      void handleComplete();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore capture release error
    }

    if (currentDragRef.current >= confirmThreshold) {
      setDragProgress(1);
      void handleComplete();
    } else {
      // Spring back to start
      setDragProgress(0);
      currentDragRef.current = 0;
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || loading || isCompleted) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setDragProgress(1);
      void handleComplete();
    }
  };

  // Styles based on variant
  const variantStyles = {
    gold: {
      trackBg: "bg-gradient-to-r from-[#121723] via-[#1a2234] to-[#121723]",
      trackBorder: "border-[#E5A93C]/40 shadow-[0_0_15px_rgba(229,169,60,0.15)]",
      fillBg: "bg-gradient-to-r from-amber-600/30 to-[#E5A93C]/40",
      thumbBg: "bg-gradient-to-br from-amber-400 via-[#E5A93C] to-amber-600 text-slate-950",
      thumbShadow: "shadow-[0_0_16px_rgba(229,169,60,0.5)]",
      textColor: "text-[#E5A93C]",
      shimmer: "rgba(229,169,60,0.6)",
    },
    sapphire: {
      trackBg: "bg-gradient-to-r from-[#0c1322] via-[#111c34] to-[#0c1322]",
      trackBorder: "border-blue-500/40 shadow-[0_0_15px_rgba(37,99,235,0.15)]",
      fillBg: "bg-gradient-to-r from-blue-700/30 to-blue-500/40",
      thumbBg: "bg-gradient-to-br from-blue-400 via-[#2563EB] to-blue-700 text-white",
      thumbShadow: "shadow-[0_0_16px_rgba(37,99,235,0.5)]",
      textColor: "text-blue-400",
      shimmer: "rgba(37,99,235,0.6)",
    },
    online: {
      trackBg: "bg-gradient-to-r from-[#0a1b14] via-[#0e271c] to-[#0a1b14]",
      trackBorder: "border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
      fillBg: "bg-gradient-to-r from-emerald-600/30 to-emerald-500/50",
      thumbBg: "bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-slate-950",
      thumbShadow: "shadow-[0_0_16px_rgba(16,185,129,0.6)]",
      textColor: "text-emerald-400",
      shimmer: "rgba(16,185,129,0.6)",
    },
    emerald: {
      trackBg: "bg-gradient-to-r from-[#0a1b14] via-[#0e271c] to-[#0a1b14]",
      trackBorder: "border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
      fillBg: "bg-gradient-to-r from-emerald-600/30 to-emerald-500/50",
      thumbBg: "bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-slate-950",
      thumbShadow: "shadow-[0_0_16px_rgba(16,185,129,0.6)]",
      textColor: "text-emerald-400",
      shimmer: "rgba(16,185,129,0.6)",
    },
    offline: {
      trackBg: "bg-gradient-to-r from-[#1c0c10] via-[#2a1016] to-[#1c0c10]",
      trackBorder: "border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]",
      fillBg: "bg-gradient-to-r from-rose-700/30 to-rose-500/40",
      thumbBg: "bg-gradient-to-br from-rose-400 via-rose-500 to-rose-700 text-white",
      thumbShadow: "shadow-[0_0_16px_rgba(244,63,94,0.6)]",
      textColor: "text-rose-400",
      shimmer: "rgba(244,63,94,0.6)",
    },
  }[variant];

  return (
    <div
      ref={trackRef}
      className={cn(
        "relative select-none overflow-hidden rounded-2xl border p-1.5 transition-all duration-200",
        variantStyles.trackBg,
        variantStyles.trackBorder,
        disabled && "opacity-50 pointer-events-none cursor-not-allowed",
        className,
      )}
      style={{ touchAction: "none" }}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(dragProgress * 100)}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      {/* Active progress fill */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 rounded-2xl transition-all",
          variantStyles.fillBg,
          !isDragging && "duration-300",
        )}
        style={{ width: `${Math.max(8, dragProgress * 100)}%` }}
      />

      {/* Shimmering Center Label */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-12 text-center">
        <span
          className={cn(
            "font-display text-xs sm:text-sm font-bold uppercase tracking-wider transition-opacity duration-200 flex items-center gap-1.5",
            variantStyles.textColor,
            dragProgress > 0.4 ? "opacity-30" : "opacity-95",
          )}
        >
          {loading
            ? "Verifying..."
            : isCompleted
              ? completedLabel || "Confirmed ✓"
              : label}
          {!isCompleted && !loading && (
            <span className="inline-flex animate-pulse items-center">
              <ChevronRight className="size-3.5 opacity-60" />
              <ChevronRight className="size-3.5 -ml-2 opacity-90" />
              <ChevronRight className="size-3.5 -ml-2 text-white" />
            </span>
          )}
        </span>
      </div>

      {/* Draggable Thumb Knob */}
      <div
        ref={thumbRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={cn(
          "relative z-10 flex size-12 cursor-grab items-center justify-center rounded-xl font-bold transition-transform active:cursor-grabbing",
          variantStyles.thumbBg,
          variantStyles.thumbShadow,
          !isDragging && "transition-all duration-300 ease-out",
        )}
        style={{
          transform: `translateX(${
            trackRef.current && thumbRef.current
              ? dragProgress * (trackRef.current.clientWidth - thumbRef.current.clientWidth - 12)
              : 0
          }px)`,
        }}
      >
        {loading ? (
          <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : isCompleted ? (
          <Check className="size-6 stroke-[3]" />
        ) : (
          icon || <ChevronRight className="size-6 stroke-[2.5]" />
        )}
      </div>
    </div>
  );
}

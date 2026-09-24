import { Link } from "@tanstack/react-router";
import { Mic, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { useLocationStore } from "@/lib/stores/location";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";

interface EcosystemSwitchBarProps {
  currentApp: "FOODS" | "KINGPAY";
  onOpenAiSupport?: () => void;
  className?: string;
}

/**
 * 👑 SUPREME 3D GLOWING + HAPTIC + MAGNETIC SWITCH BAR
 * 
 * Strict Final Work Order Requirements:
 * - Text must be mixed case: “Order King FOODS” ↔️ “King Pay”
 * - Size must be the absolute largest possible so text fully fills and covers the entire bottom bar.
 * - Remove outer frame/border completely to free all space.
 * - 3D sparkling + luxurious + highest eye-catching design (1000x more attractive).
 * - AI Support button: larger, sparkling, remove "12 LANG" text completely.
 * - Small referral/share icon on the opposite side of AI Support (left).
 * - Middle = Order King FOODS + King Pay only.
 * - 1,000x Strict Geofencing: If delivery is inactive, Order King FOODS is completely hidden!
 */
export function EcosystemSwitchBar({
  currentApp,
  onOpenAiSupport,
  className = "",
}: EcosystemSwitchBarProps) {
  const location = useLocationStore((s) => s.location);
  const isDeliveryActive = isDeliveryActiveInLocation(location.lat, location.lng, location.cityId);
  const isFood = currentApp === "FOODS" && isDeliveryActive;

  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([20, 35, 20]);
      } catch {
        // Fallback
      }
    }
  };

  const handleAiClick = () => {
    triggerHaptic();
    if (onOpenAiSupport) {
      onOpenAiSupport();
    } else {
      window.dispatchEvent(
        new CustomEvent(isFood ? "open-food-ai-concierge" : "open-royal-ai-concierge")
      );
    }
  };

  const handleShareClick = () => {
    triggerHaptic();
    const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://orderking.in";
    const shareText = "👑 Experience Order King FOODS (0% markup biryani & feasts) & King Pay (0-fee UPI & lowest flights)! Join now:";
    
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: "Order King & King Pay",
          text: shareText,
          url: shareUrl,
        })
        .catch(() => {
          // fallback to clipboard
          copyShareLink(shareUrl);
        });
    } else {
      copyShareLink(shareUrl);
    }
  };

  const copyShareLink = (url: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(`${url}/?ref=KINGVIP`);
      toast.success("🎁 Referral link copied! Share with friends to earn ₹40 cash!");
    }
  };

  return (
    <div
      className={`relative z-20 flex items-center justify-between gap-1.5 sm:gap-2.5 w-full border-0 p-0 shadow-none bg-transparent ${className}`}
    >
      {/* 1. LEFT: SMALL ROUND REFERRAL / GIFT ICON ONLY (FREES UP FULL SPACE FOR CENTER) */}
      <button
        type="button"
        onClick={handleShareClick}
        title="Share & Earn ₹40 Cash"
        aria-label="Share & Earn Rewards"
        className="group relative flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-slate-950 font-black shadow-[0_4px_20px_rgba(245,158,11,0.55)] ring-2 ring-amber-300/90 transition-all duration-200 active:scale-95 hover:scale-105 touch-manipulation cursor-pointer"
      >
        <span className="text-xl sm:text-2xl leading-none animate-bounce">🎁</span>
        <span className="absolute -top-1 -right-1 flex size-3">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-300 opacity-90" />
          <span className="relative inline-flex size-3 rounded-full bg-amber-600 shadow-[0_0_8px_#f59e0b]" />
        </span>
      </button>

      {/* 2. MIDDLE: SWITCH OR EXCLUSIVE KING PAY BANNER */}
      <div className="flex-1 min-w-0 h-11 sm:h-12">
        {!isDeliveryActive ? (
          /* When outside delivery geofence: Order King FOODS is 100% hidden; King Pay takes full glory */
          <div className="relative flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-500/25 via-neutral-950/95 to-emerald-500/25 h-full ring-2 ring-amber-400/90 shadow-[0_6px_25px_rgba(245,158,11,0.45)] px-3 sm:px-4">
            <div className="flex items-center gap-2 truncate">
              <span className="text-xl sm:text-2xl leading-none animate-bounce shrink-0">👑</span>
              <span className="font-display font-black text-sm sm:text-base md:text-lg text-white tracking-tight whitespace-nowrap">
                King <span className="text-emerald-400">Pay</span>
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-extrabold px-2 py-0.5 whitespace-nowrap">
                0% Fee UPI · Live India
              </span>
            </div>
            <span className="hidden sm:inline-block text-[10px] font-bold text-amber-300 font-mono">
              ⚡ {location.cityName || "India"} Active
            </span>
          </div>
        ) : (
          <div className="relative grid grid-cols-2 rounded-2xl bg-gradient-to-b from-black/95 via-neutral-950/90 to-black/95 h-full ring-2 ring-amber-400/90 shadow-[inset_0_3px_15px_rgba(0,0,0,0.95),0_10px_35px_rgba(245,158,11,0.5),0_0_25px_rgba(249,115,22,0.35)] p-0.5 sm:p-1">
            {/* FOODS Segment */}
            {isFood ? (
              <div
                className="relative flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 w-full h-full px-1 text-center font-black text-white shadow-[0_8px_32px_rgba(249,115,22,0.95),inset_0_2px_6px_rgba(255,255,255,0.6)] ring-1 ring-white/70 select-none cursor-default overflow-hidden"
                aria-current="page"
              >
                <span className="text-lg sm:text-2xl leading-none animate-bounce shrink-0">🍔</span>
                <span className="font-display font-black text-sm sm:text-base md:text-lg lg:text-xl text-white tracking-tight leading-none whitespace-nowrap drop-shadow-[0_2px_0_#c2410c] drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                  Order King <span className="text-amber-200 drop-shadow-[0_1px_0_#ea580c]">FOODS</span>
                </span>
                <span className="absolute top-1 right-1 size-2 rounded-full bg-white shadow-[0_0_10px_#ffffff] animate-ping" />
              </div>
            ) : (
              <Link
                to="/"
                onClick={triggerHaptic}
                className="group relative flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl w-full h-full px-1 text-center font-black text-slate-200 hover:text-white transition-all duration-200 active:scale-95 touch-manipulation cursor-pointer no-underline overflow-hidden"
                title="Switch to Order King FOODS"
              >
                <span className="text-lg sm:text-2xl leading-none opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-transform shrink-0">
                  🍔
                </span>
                <span className="font-display font-black text-sm sm:text-base md:text-lg lg:text-xl text-slate-200 group-hover:text-orange-400 transition-colors tracking-tight leading-none whitespace-nowrap drop-shadow-[0_2px_0_#1e293b]">
                  Order King <span className="text-amber-300">FOODS</span>
                </span>
              </Link>
            )}

            {/* KING PAY Segment */}
            {!isFood ? (
              <div
                className="relative flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 w-full h-full px-1 text-center font-black text-slate-950 shadow-[0_8px_32px_rgba(245,158,11,0.95),inset_0_2px_6px_rgba(255,255,255,0.8)] ring-1 ring-amber-200 select-none cursor-default overflow-hidden"
                aria-current="page"
              >
                <span className="text-lg sm:text-2xl leading-none animate-bounce shrink-0">👑</span>
                <span className="font-display font-black text-sm sm:text-base md:text-lg lg:text-xl text-slate-950 tracking-tight leading-none whitespace-nowrap drop-shadow-[0_2px_0_#fef08a] drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
                  King <span className="text-emerald-950 drop-shadow-[0_1px_0_#a7f3d0]">Pay</span>
                </span>
                <span className="absolute top-1 right-1 size-2 rounded-full bg-slate-950 shadow-[0_0_10px_#f59e0b] animate-ping" />
              </div>
            ) : (
              <Link
                to="/king-pay"
                onClick={triggerHaptic}
                className="group relative flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl w-full h-full px-1 text-center font-black text-slate-200 hover:text-white transition-all duration-200 active:scale-95 touch-manipulation cursor-pointer no-underline overflow-hidden"
                title="Switch to King Pay"
              >
                <span className="text-lg sm:text-2xl leading-none opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-transform shrink-0">
                  👑
                </span>
                <span className="font-display font-black text-sm sm:text-base md:text-lg lg:text-xl text-slate-200 group-hover:text-amber-400 transition-colors tracking-tight leading-none whitespace-nowrap drop-shadow-[0_2px_0_#1e293b]">
                  King <span className="text-emerald-400">Pay</span>
                </span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* 3. RIGHT: SMALL ROUND AI SUPPORT ICON ONLY (NO BIG BUTTON, NO 12 LANG) */}
      <button
        type="button"
        onClick={handleAiClick}
        title={isFood ? "Food AI Support" : "King Pay AI Support"}
        aria-label={isFood ? "Open Food AI Concierge" : "Open King Pay Royal AI Concierge"}
        className={`group relative flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-full text-white shadow-[0_4px_22px_rgba(16,185,129,0.6)] transition-all duration-200 active:scale-95 hover:scale-105 touch-manipulation cursor-pointer ${
          isFood
            ? "border-2 border-primary/90 bg-gradient-to-tr from-primary via-emerald-700 to-[#07241C] ring-2 ring-emerald-400/80 hover:border-emerald-300"
            : "border-2 border-amber-400 bg-gradient-to-tr from-[#0D3B2E] via-emerald-700 to-[#07241C] ring-2 ring-amber-300/80 hover:border-yellow-200"
        }`}
      >
        <div className="relative flex size-7 sm:size-8 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 shadow-md">
          <Mic className="size-4 sm:size-4.5 text-slate-950 animate-bounce" />
          <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-300 opacity-90" />
            <span className="relative inline-flex size-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]" />
          </span>
        </div>
        <Sparkles className="absolute -top-1 -right-1 size-3.5 text-amber-300 opacity-95 group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import {
  loadTravelpayoutsWhiteLabelScript,
  TP_WL_ID,
  TP_MARKER,
  TP_WL_DOMAIN,
} from "@/lib/travel/travelpayouts-config";
import { ShieldCheck, Sparkles, AlertCircle, RefreshCw, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  wlId?: string;
  marker?: string;
  subId?: string;
}

export function TravelpayoutsWhiteLabel({
  wlId = TP_WL_ID,
  marker = TP_MARKER,
  subId = "kingpay_travel",
}: Props) {
  const isLoadedRef = useRef(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    loadTravelpayoutsWhiteLabelScript(wlId);
    isLoadedRef.current = true;

    // Timeout check: if after 7 seconds tpwl-search has no children and user has aggressive content blocker
    const timer = setTimeout(() => {
      const searchBox = document.getElementById("tpwl-search");
      if (searchBox && searchBox.children.length === 0) {
        setLoadTimedOut(true);
      }
    }, 7000);

    return () => clearTimeout(timer);
  }, [wlId]);

  const handleRetry = () => {
    setLoadTimedOut(false);
    loadTravelpayoutsWhiteLabelScript(wlId);
  };

  return (
    <div className="w-full space-y-4 my-4 font-sans">
      {/* Sovereign Trust & Branding Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-gradient-to-r from-sky-950/70 via-slate-900 to-indigo-950/80 border border-sky-400/30 p-3.5 sm:p-4 text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30">
            <Plane className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-white">
                OrderKingPay Live Aviation Metasearch
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                WL #{wlId}
              </span>
            </div>
            <p className="text-[11px] text-sky-200/80">
              1,000+ Verified Airlines &amp; OTAs · ₹0 Convenience Fee Guarantee · Official KingPay Settlement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-black text-emerald-300">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>₹0 Markup (Pure Tariff)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Tracking: #{marker}
          </span>
        </div>
      </div>

      {/* Travelpayouts Metasearch Container */}
      <div className="orderking-tpwl-search-container relative w-full min-h-[140px] rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 sm:p-5 shadow-sm transition-all overflow-hidden">
        <div
          id="tpwl-search"
          className="w-full"
          data-marker={marker}
          data-sub-id={subId}
        />
        {loadTimedOut && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-xs text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-3 mt-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-700 shrink-0" />
              <span>
                Search widget taking longer than expected to render. If you use a strict ad-blocker, please whitelist <code>tpwidg.com</code> or use our direct airline booking buttons below.
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              className="text-xs shrink-0 rounded-xl border-amber-400 text-amber-900 hover:bg-amber-100"
            >
              <RefreshCw className="size-3 mr-1" /> Reload Widget
            </Button>
          </div>
        )}
      </div>

      {/* Travelpayouts Search Results Container */}
      <div
        id="tpwl-tickets"
        className="w-full min-h-[350px] rounded-3xl"
        data-marker={marker}
        data-sub-id={subId}
      />
    </div>
  );
}

import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown, Plane, ShieldCheck } from "lucide-react";

// Public Travelpayouts White Label identifier provided by the OrderKing owner.
// This is a partner metasearch widget, not a ticket-issuing or payment API.
const WHITE_LABEL_SCRIPT_URL = "https://tpwidg.com/wl_web/main.js?wl_id=23797";
const WHITE_LABEL_SCRIPT_ID = "orderking-tpwl-23797-script";

function WhiteLabelResults() {
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    // React has mounted both containers before running this effect.
    // The vendor script must be inserted into <head>, but only on demand.
    const existing = document.getElementById(WHITE_LABEL_SCRIPT_ID);
    if (existing) return;

    const script = document.createElement("script");
    script.id = WHITE_LABEL_SCRIPT_ID;
    script.type = "module";
    script.async = true;
    script.src = WHITE_LABEL_SCRIPT_URL;
    script.setAttribute("data-noptimize", "1");
    script.setAttribute("data-cfasync", "false");
    script.setAttribute("data-wpfc-render", "false");
    script.setAttribute("data-no-defer", "1");

    const onError = () => setLoadFailed(true);
    script.addEventListener("error", onError);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("error", onError);
      // Re-insert on a future visit to /travel; do not affect Drive's
      // independent root-level Travelpayouts installation.
      script.remove();
    };
  }, []);

  return (
    <div className="space-y-4">
      {loadFailed && (
        <p role="alert" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
          Partner flight search could not load. Check your connection or use the existing flight options below.
        </p>
      )}
      <div id="tpwl-search" className="min-h-20" aria-label="Travelpayouts flight search form" />
      <div id="tpwl-tickets" className="min-h-16" aria-label="Travelpayouts flight search results" />
    </div>
  );
}

/**
 * Optional partner fare comparison. Existing OrderKing flight search and
 * direct airline checkout remain available and are not replaced.
 */
export function TravelpayoutsFlightWidget() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="overflow-hidden rounded-3xl border border-[#334155] bg-gradient-to-b from-[#0A1020] to-[#111827] text-white shadow-lg">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="orderking-tpwl-panel"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-white/5 sm:p-5"
      >
        <span className="flex items-center gap-3">
          <span className="rounded-xl bg-[#D4AF37]/15 p-2.5 text-[#D4AF37]">
            <Plane className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-bold text-white sm:text-base">Compare partner flight fares</span>
            <span className="mt-1 block text-xs text-slate-300">Travelpayouts metasearch · INR and international routes</span>
          </span>
        </span>
        <ChevronDown className={`size-5 shrink-0 text-[#D4AF37] transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {expanded && (
        <div id="orderking-tpwl-panel" className="space-y-4 border-t border-white/10 p-4 sm:p-5">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-300">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#D4AF37]" aria-hidden="true" />
            Compare fares with our travel partner. Availability, final prices, booking, payment and tickets are confirmed by the chosen travel provider, not OrderKing.
            <ArrowUpRight className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          </p>
          <WhiteLabelResults />
        </div>
      )}
    </section>
  );
}

import { useEffect, useState } from "react";
import { getConfiguredWhiteLabelId, TP_CONSENT_KEY, whiteLabelScriptUrl } from "@/lib/travel/travelpayouts-config";

declare global {
  interface Window {
    TPWL_CONFIGURATION?: Record<string, unknown>;
  }
}

/**
 * Official Travelpayouts White Label Web flight SEARCH only.
 * A provider, not OrderKingPay, handles booking, payment and ticket issuance.
 */
export function TravelpayoutsWhiteLabelWidget() {
  const scriptUrl = whiteLabelScriptUrl(getConfiguredWhiteLabelId());
  const [hasConsent, setHasConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");

  useEffect(() => {
    if (!scriptUrl) return;
    try {
      if (window.localStorage.getItem(TP_CONSENT_KEY) === "granted") setHasConsent(true);
    } catch {
      // Private browsing may deny storage; consent can still be granted for this session.
    }
  }, [scriptUrl]);

  useEffect(() => {
    if (!scriptUrl || !hasConsent) return;
    setStatus("loading");
    window.TPWL_CONFIGURATION = {
      ...window.TPWL_CONFIGURATION,
      resultsURL: window.location.origin + "/travel",
    };
    const existing = document.querySelector<HTMLScriptElement>('script[data-orderking-tp-wl="true"]');
    if (existing) {
      setStatus("loaded");
      return;
    }
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.type = "module";
    script.async = true;
    script.dataset.orderkingTpWl = "true";
    const onLoad = () => setStatus("loaded");
    const onError = () => setStatus("error");
    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);
    document.head.appendChild(script);
    return () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };
  }, [scriptUrl, hasConsent]);

  // Do not present a pretend flight search when no real owner-generated ID exists.
  if (!scriptUrl) return null;

  const enable = () => {
    try { window.localStorage.setItem(TP_CONSENT_KEY, "granted"); } catch { /* optional storage */ }
    setHasConsent(true);
  };
  const disable = () => {
    try { window.localStorage.removeItem(TP_CONSENT_KEY); } catch { /* optional storage */ }
    // Stop any already executed third-party scripts for this page lifecycle.
    window.location.reload();
  };

  return (
    <section aria-label="Travelpayouts flight search" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 text-slate-900">
      <div className="mb-3">
        <h2 className="text-base font-bold">Compare flights with Travelpayouts</h2>
        <p className="mt-1 text-xs text-slate-600">Flight search results appear here. You complete booking, payment, changes and refunds with the selected external airline or travel agency.</p>
      </div>
      {!hasConsent ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-xs text-slate-600">Optional third-party flight search. Enabling it loads Travelpayouts scripts and may set partner cookies. You can decline and use the official carrier links already on this page.</p>
          <button type="button" onClick={enable} className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white">Enable flight comparison</button>
        </div>
      ) : (
        <>
          <button type="button" onClick={disable} className="mb-3 text-xs text-sky-800 underline">Disable future widget loads</button>
          {status === "loading" && <p role="status" className="mb-2 text-xs">Loading external flight search…</p>}
          {status === "error" && <p role="alert" className="mb-2 text-xs text-red-700">The provider's flight widget did not load. Use an official airline website below.</p>}
          <div id="tpwl-search" className="min-h-20 w-full" />
          <div id="tpwl-tickets" className="w-full" />
          <p className="mt-3 text-[11px] text-slate-500">Disabling stops future widget loads and refreshes this page; existing third-party cookies may need clearing in your browser settings. Script loading alone does not confirm live availability.</p>
        </>
      )}
    </section>
  );
}

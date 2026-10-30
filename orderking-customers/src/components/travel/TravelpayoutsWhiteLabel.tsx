import React, { useEffect, useState } from 'react';
import {
  resolveWhiteLabelWidgetConfig,
  TRAVELPAYOUTS_MARKER,
  TRAVELPAYOUTS_PROJECT_NAME,
} from '../../lib/travel/travelpayouts';
declare global {
  interface Window {
    TPWL_CONFIGURATION?: Record<string, unknown>;
  }
}
interface TravelpayoutsWhiteLabelProps {
  wlId?: string;
  resultsUrl?: string;
  hasTrackingConsent: boolean;
  onGrantConsent: () => void;
}
export const TravelpayoutsWhiteLabel: React.FC<TravelpayoutsWhiteLabelProps> = ({
  wlId,
  resultsUrl,
  hasTrackingConsent,
  onGrantConsent,
}) => {
  const config = resolveWhiteLabelWidgetConfig({ VITE_TP_WL_ID: wlId });
  const [scriptStatus, setScriptStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  useEffect(() => {
    if (typeof window === 'undefined' || !config.enabled || !config.scriptSrc || !hasTrackingConsent) {
      return;
    }
    setScriptStatus('loading');
    window.TPWL_CONFIGURATION = {
      ...(window.TPWL_CONFIGURATION || {}),
      ...(resultsUrl ? { resultsURL: resultsUrl } : {}),
    };
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${config.scriptSrc}"]`
    );
    if (existing) {
      setScriptStatus('ready');
      return;
    }
    const script = document.createElement('script');
    script.async = true;
    script.type = 'module';
    script.src = config.scriptSrc;
    script.setAttribute('data-noptimize', '1');
    script.setAttribute('data-cfasync', 'false');
    script.setAttribute('data-wpfc-render', 'false');
    script.onload = () => setScriptStatus('ready');
    script.onerror = () => setScriptStatus('error');
    document.head.appendChild(script);
  }, [config.enabled, config.scriptSrc, hasTrackingConsent, resultsUrl]);
  if (!hasTrackingConsent) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-4 text-slate-100">
        <p className="text-sm font-semibold text-amber-300">
          Partner Search &amp; Cookie Consent Required
        </p>
        <p className="mt-1 text-xs text-slate-300">
          In-page flight search loads the official Travelpayouts White Label widget (project{' '}
          <span className="font-mono">{TRAVELPAYOUTS_PROJECT_NAME}</span>, marker{' '}
          <span className="font-mono">{TRAVELPAYOUTS_MARKER}</span>).
        </p>
        <button
          type="button"
          onClick={onGrantConsent}
          className="mt-3 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
        >
          Allow Partner Search Widget
        </button>
      </div>
    );
  }
  if (!config.enabled) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-xs text-slate-300"
      >
        <p className="font-semibold text-slate-200">
          Verified Partner Deep-Link Search Active (Marker {TRAVELPAYOUTS_MARKER})
        </p>
        <p className="mt-1 text-slate-400">
          Use the flight and hotel search controls above to compare live fares on Aviasales, Hotellook, IndiGo, Air India, IRCTC, and redBus.
        </p>
      </div>
    );
  }
  return (
    <section aria-label="In-page Flight Search and Results" className="w-full space-y-4">
      {scriptStatus === 'loading' && (
        <div className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-xs text-slate-400">
          Loading live partner flight search engine...
        </div>
      )}
      {scriptStatus === 'error' && (
        <div className="rounded-2xl border border-red-500/40 bg-red-950/30 p-4 text-xs text-red-200">
          Unable to load the embedded widget. Use the direct partner search form above to continue to partner checkout.
        </div>
      )}
      <div id="tpwl-search" className="min-h-[80px] w-full" />
      <div id="tpwl-tickets" className="w-full" />
    </section>
  );
};


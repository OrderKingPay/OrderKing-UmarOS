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
export const TravelpayoutsWhiteLabel: React.FC&lt;TravelpayoutsWhiteLabelProps&gt; = ({
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
    const existing = document.querySelector&lt;HTMLScriptElement&gt;(
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
      &lt;div className=&quot;rounded-2xl border border-amber-500/30 bg-slate-900/90 p-4 text-slate-100&quot;&gt;
        &lt;p className=&quot;text-sm font-semibold text-amber-300&quot;&gt;
          Partner Search &amp; Cookie Consent Required
        &lt;/p&gt;
        &lt;p className=&quot;mt-1 text-xs text-slate-300&quot;&gt;
          In-page flight search loads the official Travelpayouts White Label widget (project{' '}
          &lt;span className=&quot;font-mono&quot;&gt;{TRAVELPAYOUTS_PROJECT_NAME}&lt;/span&gt;, marker{' '}
          &lt;span className=&quot;font-mono&quot;&gt;{TRAVELPAYOUTS_MARKER}&lt;/span&gt;).
        &lt;/p&gt;
        &lt;button
          type=&quot;button&quot;
          onClick={onGrantConsent}
          className=&quot;mt-3 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400&quot;
        &gt;
          Allow Partner Search Widget
        &lt;/button&gt;
      &lt;/div&gt;
    );
  }
  if (!config.enabled) {
    return (
      &lt;div
        role=&quot;status&quot;
        className=&quot;rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-xs text-slate-300&quot;
      &gt;
        &lt;p className=&quot;font-semibold text-slate-200&quot;&gt;
          Verified Partner Deep-Link Search Active (Marker {TRAVELPAYOUTS_MARKER})
        &lt;/p&gt;
        &lt;p className=&quot;mt-1 text-slate-400&quot;&gt;
          Use the flight and hotel search controls above to compare live fares on Aviasales, Hotellook, IndiGo, Air India, IRCTC, and redBus.
        &lt;/p&gt;
      &lt;/div&gt;
    );
  }
  return (
    &lt;section aria-label=&quot;In-page Flight Search and Results&quot; className=&quot;w-full space-y-4&quot;&gt;
      {scriptStatus === 'loading' && (
        &lt;div className=&quot;animate-pulse rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-xs text-slate-400&quot;&gt;
          Loading live partner flight search engine...
        &lt;/div&gt;
      )}
      {scriptStatus === 'error' && (
        &lt;div className=&quot;rounded-2xl border border-red-500/40 bg-red-950/30 p-4 text-xs text-red-200&quot;&gt;
          Unable to load the embedded widget. Use the direct partner search form above to continue to partner checkout.
        &lt;/div&gt;
      )}
      &lt;div id=&quot;tpwl-search&quot; className=&quot;min-h-[80px] w-full&quot; /&gt;
      &lt;div id=&quot;tpwl-tickets&quot; className=&quot;w-full&quot; /&gt;
    &lt;/section&gt;
  );
};

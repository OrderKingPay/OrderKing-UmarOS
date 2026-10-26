/**
 * 👑 OrderKing & KingPay Travelpayouts Sovereign Configuration
 *
 * Travelpayouts Affiliate Marker: 794122 (affiliate marker for tracking commissions)
 * Travelpayouts Project ID: 589554 (Orderkingpay project)
 * White Label ID: 23797 (metasearch web widget)
 * Custom Domain: www.orderkingpay.com
 */

export const TP_MARKER = "794122";
export const TP_PROJECT_ID = "589554";
export const TP_WL_ID = "23797";
export const TP_WL_DOMAIN = "www.orderkingpay.com";
export const TP_WL_NAME = "Orderkingpay";
export const TP_CONSENT_KEY = "orderking_tp_wl_consent_v1";
export const TP_WL_SCRIPT_URL = "https://tpwidg.com/wl_web/main.js?wl_id=23797";

/**
 * Resolves the active Travelpayouts affiliate marker from Vite client env,
 * Node/process server env, or sovereign default (794122).
 */
export function getTravelpayoutsMarker(): string {
  if (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_TRAVELPAYOUTS_MARKER) {
    const val = String((import.meta as any).env.VITE_TRAVELPAYOUTS_MARKER).trim();
    if (val && !/^(TODO|REPLACE_ME|EXAMPLE)$/i.test(val)) return val;
  }
  if (typeof process !== "undefined" && process.env?.TRAVELPAYOUTS_MARKER) {
    const val = String(process.env.TRAVELPAYOUTS_MARKER).trim();
    if (val && !/^(TODO|REPLACE_ME|EXAMPLE)$/i.test(val)) return val;
  }
  return TP_MARKER;
}

/**
 * Resolves the active Travelpayouts Project ID (589554).
 */
export function getTravelpayoutsProjectId(): string {
  if (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_TRAVELPAYOUTS_PROJECT_ID) {
    const val = String((import.meta as any).env.VITE_TRAVELPAYOUTS_PROJECT_ID).trim();
    if (val && !/^(TODO|REPLACE_ME|EXAMPLE)$/i.test(val)) return val;
  }
  if (typeof process !== "undefined" && process.env?.TRAVELPAYOUTS_PROJECT_ID) {
    const val = String(process.env.TRAVELPAYOUTS_PROJECT_ID).trim();
    if (val && !/^(TODO|REPLACE_ME|EXAMPLE)$/i.test(val)) return val;
  }
  return TP_PROJECT_ID;
}

export function getConfiguredWhiteLabelId(): string {
  if (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_TP_WL_ID) {
    const validated = validateWhiteLabelId((import.meta as any).env.VITE_TP_WL_ID);
    if (validated) return validated;
  }
  return TP_WL_ID;
}

export function validateWhiteLabelId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  if (!id || /^(TODO|REPLACE_ME|EXAMPLE|undefined|null)$/i.test(id)) return null;
  return /^[A-Za-z0-9_-]{1,64}$/.test(id) ? id : null;
}

export function whiteLabelScriptUrl(value: unknown): string | null {
  const id = validateWhiteLabelId(value);
  return id ? `https://tpwidg.com/wl_web/main.js?wl_id=${encodeURIComponent(id)}` : null;
}

/**
 * Injects the official Travelpayouts White Label script into <head> with deduping.
 * Attributes match official Travelpayouts snippet:
 * nowprocket, data-noptimize="1", data-cfasync="false", data-wpfc-render="false",
 * seraph-accel-crit="1", data-no-defer="1".
 */
export function loadTravelpayoutsWhiteLabelScript(customId?: string): HTMLScriptElement | null {
  if (typeof document === "undefined") return null;
  const wlId = customId ? (validateWhiteLabelId(customId) || TP_WL_ID) : getConfiguredWhiteLabelId();
  const scriptUrl = whiteLabelScriptUrl(wlId) || TP_WL_SCRIPT_URL;

  // Check if already injected
  const existing = document.querySelector<HTMLScriptElement>(`script[src*="tpwidg.com/wl_web/main.js"], script[src*="tpwgts.com/wl_web/main.js"]`);
  if (existing) {
    return existing;
  }

  const script = document.createElement("script");
  script.id = `tpwl-script-${wlId}`;
  script.async = true;
  script.type = "module";
  script.src = scriptUrl;
  script.setAttribute("nowprocket", "");
  script.setAttribute("data-noptimize", "1");
  script.setAttribute("data-cfasync", "false");
  script.setAttribute("data-wpfc-render", "false");
  script.setAttribute("seraph-accel-crit", "1");
  script.setAttribute("data-no-defer", "1");
  document.head.appendChild(script);
  return script;
}

/**
 * Travelpayouts White Label Web. Project IDs and live supplier access must be
 * obtained from the owner's dashboard. No synthetic affiliate IDs are used.
 */
export const TP_MARKER = "589554";
// Public White Label widget ID supplied by the OrderKing project owner on 2026-10-24.
// This is not a secret, provider credential or proof of an attributed sale.
export const TP_PUBLIC_WHITE_LABEL_ID = "23797";
export const TP_CONSENT_KEY = "orderking_tp_wl_consent_v1";

export function getConfiguredWhiteLabelId(): string | null {
  // Static Vite reference: do not access import.meta.env with a computed key.
  return validateWhiteLabelId(import.meta.env.VITE_TP_WL_ID) ?? TP_PUBLIC_WHITE_LABEL_ID;
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

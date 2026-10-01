export type ViralShareIntent = {
  link: string; text: string;
  navigatorShare: { title: string; text: string; url: string } | null;
  whatsapp: string; telegram: string;
};
function publicOrigin() {
  if (typeof window !== "undefined") return window.location.origin;
  if (typeof process !== "undefined" && process.env.CUSTOMER_APP_URL) return process.env.CUSTOMER_APP_URL;
  return "https://orderking.in";
}
export async function referralCodeForUser(userId: string, secret: string) {
  if (!userId || !secret) throw new Error("REFERRAL_CONFIGURATION_REQUIRED");
  const input = new TextEncoder().encode(`${userId}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  const bytes = new Uint8Array(digest);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `OK-${hex.slice(0, 8)}`;
}

export function createReferralLink(code: string, campaign = "organic") {
  const url = new URL("/r/" + encodeURIComponent(code), publicOrigin());
  url.searchParams.set("utm_source", "orderking");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}
export function buildShareIntent(code: string, campaign = "organic"): ViralShareIntent {
  const link = createReferralLink(code, campaign);
  const text = `👑 Join OrderKing for food and everyday services. ${link}`;
  return {
    link, text,
    navigatorShare: typeof navigator !== "undefined" && typeof navigator.share === "function" ? { title: "Join OrderKing", text, url: link } : null,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Join OrderKing")}`,
  };
}
export async function generateDedupeKey(parts: string[]) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(parts.join("|")));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
export function generateClickId() {
  if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
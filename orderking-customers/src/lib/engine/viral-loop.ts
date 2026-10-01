import { createHash, randomBytes } from "node:crypto";
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
export function referralCodeForUser(userId: string, secret: string) {
  if (!userId || !secret) throw new Error("REFERRAL_CONFIGURATION_REQUIRED");
  const digest = createHash("sha256").update(`${userId}:${secret}`).digest("hex").toUpperCase();
  return `OK-${digest.slice(0, 8)}`;
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
export function generateDedupeKey(parts: string[]) { return createHash("sha256").update(parts.join("|")).digest("hex"); }
export function generateClickId() { return randomBytes(12).toString("base64url"); }
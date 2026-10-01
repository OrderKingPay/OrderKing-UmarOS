export type ViralSharePayload = {
  referralCode: string;
  link: string;
  campaign?: string;
  rewardLabel?: string;
};

function publicOrigin(): string {
  return typeof window !== "undefined" ? window.location.origin : "https://orderking.in";
}

export async function generateReferralCode(userId: string): Promise<string> {
  if (!userId?.trim()) throw new Error("REFERRAL_USER_REQUIRED");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(userId.trim()),
  );
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return "OK-" + hex.slice(0, 8);
}

export function generateDeepLink(referralCode: string, campaign = "organic"): string {
  const url = new URL("/r/" + encodeURIComponent(referralCode), publicOrigin());
  url.searchParams.set("utm_source", "orderking");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}

export function createViralShareIntent(
  referralCode: string,
  rewardLabel = "Verified rewards appear when an active campaign qualifies.",
  campaign = "organic",
) {
  const link = generateDeepLink(referralCode, campaign);
  const copy = [
    "👑 Join me on OrderKing for food and everyday services.",
    rewardLabel,
    "Claim here: " + link,
  ].join("\n\n");
  const encodedCopy = encodeURIComponent(copy);

  return {
    link,
    copy,
    whatsapp: "https://wa.me/?text=" + encodedCopy,
    telegram: "https://t.me/share/url?url=" + encodeURIComponent(link) +
      "&text=" + encodeURIComponent("Join me on OrderKing"),
    navigatorShare:
      typeof navigator !== "undefined" && typeof navigator.share === "function"
        ? { title: "Join OrderKing", text: copy, url: link }
        : null,
  };
}

export async function generateShareDedupeKey(parts: string[]): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(parts.join("|")),
  );
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateShareClickId(): string {
  if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Financial referral qualification is intentionally server-owned.
// Use src/lib/server/referrals.ts from authenticated server code.
export async function processReferralActivation(): Promise<{
  success: false;
  amountCredited: 0;
  message: string;
}> {
  return {
    success: false,
    amountCredited: 0,
    message: "Referral qualification must be processed by the authenticated server ledger.",
  };
}

export const ViralGrowthEngine = {
  generateReferralCode,
  generateDeepLink,
  createViralShareIntent,
  generateShareDedupeKey,
  generateShareClickId,
  processReferralActivation,
};

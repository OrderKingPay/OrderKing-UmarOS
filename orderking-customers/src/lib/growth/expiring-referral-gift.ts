/**
 * 👑 OrderKing Expiring Referral Gift & Viral Share Engine
 * 
 * Strict 7-Day Expiry Architecture:
 * - Gift bonuses have a strict 7-day (168-hour) validity window.
 * - If not redeemed via an order within 7 days, the credit permanently expires back to platform treasury.
 * - Protects the founder against perpetual financial liabilities.
 * - Generates high-urgency FOMO for viral recipients across WhatsApp and social channels.
 */

export const GIFT_REWARD_RUPEES = 50;
export const GIFT_REWARD_PAISE = 5000;
export const GIFT_VALIDITY_DAYS = 7;
export const GIFT_VALIDITY_MS = GIFT_VALIDITY_DAYS * 24 * 60 * 60 * 1000;

export interface ExpiringGiftStatus {
  rewardRupees: number;
  rewardPaise: number;
  validityDays: number;
  isExpired: boolean;
  hoursRemaining: number;
  minutesRemaining: number;
  expiresAt: string; // ISO String
}

/**
 * Calculates remaining validity of an issued gift.
 */
export function checkGiftExpiry(issuedAtTimestampMs: number): ExpiringGiftStatus {
  const now = Date.now();
  const expiryTimestamp = issuedAtTimestampMs + GIFT_VALIDITY_MS;
  const msRemaining = expiryTimestamp - now;
  const isExpired = msRemaining <= 0;

  const hoursRemaining = isExpired ? 0 : Math.floor(msRemaining / (1000 * 60 * 60));
  const minutesRemaining = isExpired ? 0 : Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return {
    rewardRupees: GIFT_REWARD_RUPEES,
    rewardPaise: GIFT_REWARD_PAISE,
    validityDays: GIFT_VALIDITY_DAYS,
    isExpired,
    hoursRemaining,
    minutesRemaining,
    expiresAt: new Date(expiryTimestamp).toISOString(),
  };
}

/**
 * Generates viral sharing URLs with 7-day expiration urgency copy.
 */
export function createExpiringViralShare(referralCode: string, originUrl = "https://orderkingpay.com") {
  const cleanCode = referralCode.trim() || "FOUNDER50";
  const deepLink = `${originUrl}/?ref=${encodeURIComponent(cleanCode)}`;
  
  const headline = `🎁 ₹${GIFT_REWARD_RUPEES} Gift for your next meal on OrderKing!`;
  const bodyText = `${headline}\n\nTap below to claim ₹${GIFT_REWARD_RUPEES} off your order. ⚠️ Hurry, this gift expires in 7 days!\n\n👉 Order now: ${deepLink}`;
  const encodedText = encodeURIComponent(bodyText);

  return {
    deepLink,
    shareText: bodyText,
    whatsappUrl: `https://api.whatsapp.com/send?text=${encodedText}`,
    telegramUrl: `https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent(headline + " (Expires in 7 days)")}`,
    twitterUrl: `https://twitter.com/intent/tweet?text=${encodedText}`,
    canNativeShare: typeof navigator !== "undefined" && typeof navigator.share === "function",
  };
}

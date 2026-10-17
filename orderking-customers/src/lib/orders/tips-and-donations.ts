/**
 * Zomato Parity: Pre-Order Delivery Partner Tips & Feeding India Micro-Donations
 * 100% of tips go to riders with 0% platform commission or fee.
 * 100% of Feeding India micro-donations (₹2) go to daily wage and child meal programs.
 */

export interface TipOption {
  label: string;
  valuePaise: number;
  tag: string;
  emoji: string;
}

export const TIP_PRESETS: readonly TipOption[] = [
  { label: "₹20", valuePaise: 2000, tag: "Thank you 🙏", emoji: "🙏" },
  { label: "₹30", valuePaise: 3000, tag: "Most Popular ⭐", emoji: "⭐" },
  { label: "₹50", valuePaise: 5000, tag: "Super Hero 🦸", emoji: "🦸" },
] as const;

export const FEEDING_INDIA_DONATION_PAISE = 200; // ₹2.00
export const MAX_TIP_PAISE = 100_000; // ₹1,000.00 ceiling

/**
 * Validates and converts a custom rupee tip input into integer paise.
 * Rejects negative numbers, non-numerics, or amounts exceeding MAX_TIP_PAISE.
 */
export function parseCustomTip(rupees: string | number): number {
  if (typeof rupees === "number") {
    if (!Number.isFinite(rupees) || rupees < 0) return 0;
    const paise = Math.round(rupees * 100);
    return Math.min(paise, MAX_TIP_PAISE);
  }
  const raw = String(rupees).trim();
  if (!raw || raw.startsWith("-")) return 0;
  const clean = raw.replace(/[^0-9.]/g, "");
  if (!clean) return 0;
  const num = parseFloat(clean);
  if (isNaN(num) || num < 0) return 0;
  const paise = Math.round(num * 100);
  return Math.min(paise, MAX_TIP_PAISE);
}

/**
 * Calculates delivery partner tip payout.
 * Enforces OrderKing's 0% platform commission pledge on tips.
 */
export function calculateTipPayout(tipPaise: number): {
  tipPaise: number;
  platformFeePaise: number;
  platformCommissionBps: number;
  riderPayoutPaise: number;
  note: string;
} {
  const safeTip = Number.isInteger(tipPaise) && tipPaise >= 0 ? Math.min(tipPaise, MAX_TIP_PAISE) : 0;
  return {
    tipPaise: safeTip,
    platformFeePaise: 0,
    platformCommissionBps: 0,
    riderPayoutPaise: safeTip,
    note: "100% of your tip goes directly to your delivery partner. OrderKing charges 0% commission or fee on tips.",
  };
}

/**
 * Calculates Feeding India micro-donation ledger entry.
 */
export function calculateDonationLedger(optIn: boolean): {
  donationPaise: number;
  platformFeePaise: number;
  charityPayoutPaise: number;
  label: string;
  description: string;
} {
  const donationPaise = optIn ? FEEDING_INDIA_DONATION_PAISE : 0;
  return {
    donationPaise,
    platformFeePaise: 0,
    charityPayoutPaise: donationPaise,
    label: "Donate ₹2 to Feeding India — feed a daily wage earner or child in need",
    description: "100% of your ₹2 micro-donation goes directly to Feeding India meal distribution. Zero platform fee.",
  };
}

/**
 * Dynamically updates the total payable amount reflecting quote total, tip, and donation.
 */
export function calculateCheckoutTotal(
  quoteTotalPaise: number,
  tipPaise: number,
  donateFeedingIndia: boolean
): {
  quoteTotalPaise: number;
  tipPaise: number;
  donationPaise: number;
  totalPayablePaise: number;
} {
  const safeQuote = Math.max(0, Math.floor(quoteTotalPaise || 0));
  const safeTip = Number.isInteger(tipPaise) && tipPaise >= 0 ? Math.min(tipPaise, MAX_TIP_PAISE) : 0;
  const safeDonation = donateFeedingIndia ? FEEDING_INDIA_DONATION_PAISE : 0;
  return {
    quoteTotalPaise: safeQuote,
    tipPaise: safeTip,
    donationPaise: safeDonation,
    totalPayablePaise: safeQuote + safeTip + safeDonation,
  };
}


/**
 * King Reward & Scratch Card Voucher Engine
 * 100% Legal Trade Promotion & Customer Rewards under Indian Law
 * (Compliant with Lotteries (Regulation) Act 1998, Prize Chits Act, and Consumer Protection Act 2019).
 * 
 * Rules:
 * 1. Zero entry fee: Rewards are unlocked organically via food orders >= ₹299 or friend referrals.
 * 2. Guaranteed value: Every scratch card has real, redeemable food discount value.
 * 3. 100% Authentic: Only real merchant dining vouchers and food discount cashback in integer paise.
 */

export type RewardType = "CASHBACK" | "PARTNER_VOUCHER";

export type ScratchReward = {
  id: string;
  type: RewardType;
  title: string;
  description: string;
  amountPaise: number;
  partnerName?: string;
  voucherCode?: string;
  unlockedAt: string;
  isScratched: boolean;
};

export type ScratchTrigger = "ORDER_ABOVE_299" | "REFERRAL_MILESTONE" | "FIRST_ORDER";

export function generateScratchCard(
  userId: string,
  trigger: ScratchTrigger,
  orderTotalPaise?: number,
): ScratchReward {
  const buf = new Uint32Array(2);
  crypto.getRandomValues(buf);
  const seed = buf[0] % 100;
  const id = `sc_${Date.now()}_${buf[1] % 1000}`;
  const unlockedAt = new Date().toISOString();

  // 35% chance: Partner Dining Voucher (e.g. Biryani Darbar / Bombay Restaurant)
  if (seed < 35) {
    const partners = ["Biryani Darbar", "Bombay Restaurant", "Karimganj Dhaba", "Zaika Royal"];
    const partner = partners[seed % partners.length];
    return {
      id,
      type: "PARTNER_VOUCHER",
      title: `₹75 Off at ${partner}`,
      description: `Discount voucher on your next order from ${partner}.`,
      amountPaise: 7500,
      partnerName: partner,
      voucherCode: `KING${partner.replace(/\s+/g, "").toUpperCase().slice(0, 4)}75`,
      unlockedAt,
      isScratched: false,
    };
  }

  // 65% chance: Food Discount Cashback (₹20 to ₹50 in integer paise)
  const cashbackPaise = (20 + (seed % 31)) * 100;
  return {
    id,
    type: "CASHBACK",
    title: `₹${cashbackPaise / 100} Food Cashback`,
    description: "Credited to your King Coins balance for your next meal.",
    amountPaise: cashbackPaise,
    unlockedAt,
    isScratched: false,
  };
}

export function isEligibleForScratchCard(orderTotalPaise: number, isFirstOrder: boolean): boolean {
  if (isFirstOrder) return true;
  return orderTotalPaise >= 29900; // ₹299.00
}

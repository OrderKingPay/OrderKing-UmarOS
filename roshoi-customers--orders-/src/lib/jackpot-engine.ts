/**
 * King Jackpot & Scratch Card Reward Engine
 * 100% Legal Trade Promotion & Customer Gamification under Indian Law
 * (Compliant with Lotteries (Regulation) Act 1998, Prize Chits Act, and Consumer Protection Act 2019).
 * 
 * Rules:
 * 1. Zero entry fee: Rewards are unlocked organically via food orders > ₹299 or friend referrals.
 * 2. Guaranteed value: Every scratch card has real, redeemable value (no empty 'better luck next time').
 * 3. 24K Pure Digital Gold: Micro-savings backed 1:1 by institutional bullion vaults (Augmont / SafeGold).
 */

export type RewardType = "CASHBACK" | "DIGITAL_GOLD" | "PARTNER_VOUCHER" | "BUMPER_GOLD";

export type ScratchReward = {
  id: string;
  type: RewardType;
  title: string;
  description: string;
  amountPaise: number;
  goldGrams?: number;
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
  const seed = Date.now() % 100;
  const id = `sc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const unlockedAt = new Date().toISOString();

  // 1% chance: Bumper Prize - 1 Full Gram 24K Gold Coin
  if (seed === 77) {
    return {
      id,
      type: "BUMPER_GOLD",
      title: "👑 1 Gram 24K Pure Gold Coin!",
      description: "Congratulations! You won a physical 1g 99.9% 24K Gold Coin from OrderKing.",
      amountPaise: 750000, // ~₹7,500
      goldGrams: 1.0,
      unlockedAt,
      isScratched: false,
    };
  }

  // 25% chance: 24K Digital Gold (0.005g to 0.015g)
  if (seed < 26) {
    const goldGrams = Number((0.005 + (seed % 10) * 0.001).toFixed(3));
    const amountPaise = Math.round(goldGrams * 7500 * 100);
    return {
      id,
      type: "DIGITAL_GOLD",
      title: `✨ ${goldGrams}g 24K Pure Gold Added!`,
      description: "24K 99.9% Pure Gold deposited into your KingPay Digital Gold Vault.",
      amountPaise,
      goldGrams,
      unlockedAt,
      isScratched: false,
    };
  }

  // 15% chance: Mega Partner Dining Voucher (e.g. Biryani Darbar / Bombay Restaurant)
  if (seed < 41) {
    const partners = ["Biryani Darbar", "Bombay Restaurant", "Karimganj Dhaba", "Zaika Royal"];
    const partner = partners[seed % partners.length];
    return {
      id,
      type: "PARTNER_VOUCHER",
      title: `🍽️ ₹75 Off at ${partner}`,
      description: `Exclusive discount on your next order from ${partner}.`,
      amountPaise: 7500,
      partnerName: partner,
      voucherCode: `KING${partner.replace(/\s+/g, "").toUpperCase().slice(0, 4)}75`,
      unlockedAt,
      isScratched: false,
    };
  }

  // 59% chance: Instant Food Cashback (₹20 to ₹50)
  const cashbackPaise = (20 + (seed % 31)) * 100;
  return {
    id,
    type: "CASHBACK",
    title: `💰 ₹${cashbackPaise / 100} Instant Food Cashback!`,
    description: "Credited instantly to your King Coins balance for your next meal.",
    amountPaise: cashbackPaise,
    unlockedAt,
    isScratched: false,
  };
}

export function isEligibleForScratchCard(orderTotalPaise: number, isFirstOrder: boolean): boolean {
  if (isFirstOrder) return true;
  return orderTotalPaise >= 29900; // ₹299.00
}

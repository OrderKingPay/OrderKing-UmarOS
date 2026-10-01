/**
 * Reward interface retained for compatibility. Production reward issuance is provider-backed.
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
  void userId;
  void trigger;
  void orderTotalPaise;

  return {
    id: `sc-pending-${Date.now()}`,
    type: "CASHBACK",
    title: "Reward pending verification",
    description: "Rewards are issued only by a verified promotion and ledger provider. No cash, gold or voucher has been credited.",
    amountPaise: 0,
    unlockedAt: new Date().toISOString(),
    isScratched: false,
  };
}

export function isEligibleForScratchCard(orderTotalPaise: number, isFirstOrder: boolean): boolean {
  if (isFirstOrder) return true;
  return orderTotalPaise >= 29900;
}

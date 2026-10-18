export interface UmarOsConfigRow {
  key: string;
  value: Record<string, any>;
  updated_at: string;
  updated_by: string;
}

export interface ParsedCommandResult {
  category: "FEE_UPDATE" | "COMMISSION_UPDATE" | "SURGE_UPDATE" | "GENERIC";
  targetKey: string; // 'founder_fees' | 'economics'
  patch: Record<string, any>;
  summary: string;
  fieldLabel: string;
  displayValue: string;
}

export interface CommandHistoryItem {
  id: string;
  command: string;
  summary: string;
  timestamp: string;
  success: boolean;
}

/**
 * Natural Language Command Parser
 * Parses founder instructions into target table keys and patch payloads
 */
export function parseNaturalLanguageConfigCommand(raw: string): ParsedCommandResult | null {
  const prompt = raw.trim();
  const lower = prompt.toLowerCase();

  // 1. Food Platform Fee: 'set food platform fee to 12' or 'set platform fee to 15'
  const foodFeeMatch =
    lower.match(/set\s+(?:food\s+)?platform\s+fee\s+(?:to|=)\s*₹?\s*(\d+(?:\.\d+)?)/i) ||
    lower.match(/(?:food\s+)?platform\s+fee\s+(?:to|=)\s*₹?\s*(\d+(?:\.\d+)?)/i);
  if (foodFeeMatch) {
    const fee = parseFloat(foodFeeMatch[1] ?? "0");
    return {
      category: "FEE_UPDATE",
      targetKey: "founder_fees",
      patch: {
        food_platform_fee: fee,
        platform_fee_inr: fee,
        platform_fee_paise: Math.round(fee * 100),
      },
      summary: `Updated food platform fee to ₹${fee}`,
      fieldLabel: "Food Platform Fee",
      displayValue: `₹${fee}`,
    };
  }

  // 2. Remittance / KingPay Remit Fee: 'set remit fee to 1.5' or 'set remittance fee to 2.0%'
  const remitFeeMatch =
    lower.match(/set\s+(?:remit|remittance|kingpay\s+remit)\s+fee\s+(?:to|=)\s*(\d+(?:\.\d+)?)\s*%?/i) ||
    lower.match(/(?:remit|remittance)\s+fee\s+(?:to|=)\s*(\d+(?:\.\d+)?)\s*%?/i);
  if (remitFeeMatch) {
    const feePct = parseFloat(remitFeeMatch[1] ?? "0");
    return {
      category: "FEE_UPDATE",
      targetKey: "founder_fees",
      patch: {
        remit_fee: feePct,
        remit_fee_pct: feePct,
      },
      summary: `Updated KingPay remit fee to ${feePct}%`,
      fieldLabel: "Remit Fee",
      displayValue: `${feePct}%`,
    };
  }

  // 3. Travel PNR Convenience Fee: 'set travel pnr fee to 35' or 'set pnr fee to 29'
  const pnrFeeMatch =
    lower.match(/set\s+(?:travel\s+)?pnr\s+(?:convenience\s+)?fee\s+(?:to|=)\s*₹?\s*(\d+(?:\.\d+)?)/i) ||
    lower.match(/(?:travel\s+)?pnr\s+fee\s+(?:to|=)\s*₹?\s*(\d+(?:\.\d+)?)/i);
  if (pnrFeeMatch) {
    const fee = parseFloat(pnrFeeMatch[1] ?? "0");
    return {
      category: "FEE_UPDATE",
      targetKey: "founder_fees",
      patch: {
        travel_pnr_convenience_fee_inr: fee,
      },
      summary: `Updated Travel PNR convenience fee to ₹${fee}`,
      fieldLabel: "PNR Convenience Fee",
      displayValue: `₹${fee}`,
    };
  }

  // 4. Wallet Cashback Reward: 'set cashback to 10' or 'set wallet cashback to 10'
  const cashbackMatch =
    lower.match(/set\s+(?:wallet\s+)?cashback\s+(?:reward\s+)?(?:to|=)\s*₹?\s*(\d+(?:\.\d+)?)/i) ||
    lower.match(/(?:wallet\s+)?cashback\s+(?:to|=)\s*₹?\s*(\d+(?:\.\d+)?)/i);
  if (cashbackMatch) {
    const cashback = parseFloat(cashbackMatch[1] ?? "0");
    return {
      category: "FEE_UPDATE",
      targetKey: "founder_fees",
      patch: {
        wallet_cashback_reward_inr: cashback,
      },
      summary: `Updated Wallet cashback reward to ₹${cashback}`,
      fieldLabel: "Wallet Cashback",
      displayValue: `₹${cashback}`,
    };
  }

  // 5. Merchant Commission: 'set commission to 20' or 'set restaurant commission to 18%'
  const commMatch =
    lower.match(/set\s+(?:restaurant\s+)?commission\s+(?:to|=)\s*(\d+(?:\.\d+)?)\s*%?/i) ||
    lower.match(/commission\s+(?:to|=)\s*(\d+(?:\.\d+)?)\s*%?/i);
  if (commMatch) {
    const comm = parseFloat(commMatch[1] ?? "0");
    return {
      category: "COMMISSION_UPDATE",
      targetKey: "economics",
      patch: {
        default_commission_percent: comm,
        restaurantCommissionPct: comm,
      },
      summary: `Updated restaurant commission rate to ${comm}%`,
      fieldLabel: "Commission Rate",
      displayValue: `${comm}%`,
    };
  }

  // 6. Surge Multiplier: 'set surge multiplier to 1.5' or 'set surge to 1.3'
  const surgeMatch =
    lower.match(/set\s+surge(?:\s+multiplier)?\s+(?:to|=)\s*(\d+(?:\.\d+)?)/i) ||
    lower.match(/surge(?:\s+multiplier)?\s+(?:to|=)\s*(\d+(?:\.\d+)?)/i);
  if (surgeMatch) {
    const surge = parseFloat(surgeMatch[1] ?? "1.0");
    return {
      category: "SURGE_UPDATE",
      targetKey: "economics",
      patch: {
        surge_multiplier: surge,
      },
      summary: `Updated dynamic surge multiplier to ${surge}x`,
      fieldLabel: "Surge Multiplier",
      displayValue: `${surge}x`,
    };
  }

  // 7. Base Delivery Fee: 'set delivery fee to 35' or 'set base delivery fee to 25'
  const delFeeMatch =
    lower.match(/set\s+(?:base\s+)?delivery\s+fee\s+(?:to|=)\s*₹?\s*(\d+(?:\.\d+)?)/i) ||
    lower.match(/delivery\s+fee\s+(?:to|=)\s*₹?\s*(\d+(?:\.\d+)?)/i);
  if (delFeeMatch) {
    const fee = parseFloat(delFeeMatch[1] ?? "0");
    return {
      category: "FEE_UPDATE",
      targetKey: "economics",
      patch: {
        base_delivery_fee_inr: fee,
      },
      summary: `Updated base delivery fee to ₹${fee}`,
      fieldLabel: "Base Delivery Fee",
      displayValue: `₹${fee}`,
    };
  }

  // 8. Generic Key-Value: 'set <key> to <value>'
  const genericMatch = lower.match(/(?:set|update)\s+([a-z0-9_.-]+)\s+(?:to|=)\s*([a-z0-9_.#-]+)/i);
  if (genericMatch) {
    const key = genericMatch[1] ?? "";
    const rawVal = genericMatch[2] ?? "";
    const numVal = Number(rawVal);
    const parsedVal = !isNaN(numVal) ? numVal : rawVal === "true" ? true : rawVal === "false" ? false : rawVal;

    return {
      category: "GENERIC",
      targetKey: "economics",
      patch: {
        [key]: parsedVal,
      },
      summary: `Updated config [${key}] to ${String(parsedVal)}`,
      fieldLabel: key,
      displayValue: String(parsedVal),
    };
  }

  return null;
}

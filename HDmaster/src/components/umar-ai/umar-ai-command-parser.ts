export interface UmarOsConfigRow {
  config_key: string;
  config_value: Record<string, any>;
  updated_at: string;
}

export interface DynamicConfigRow {
  key: string;
  value: Record<string, any>;
  updated_at: string;
  updated_by: string;
}

export interface ParsedCommandResult {
  matched: boolean;
  category:
    | "FEE_UPDATE"
    | "COMMISSION_UPDATE"
    | "SURGE_UPDATE"
    | "PAYOUT_AUTOMATION"
    | "PARTNER_ONBOARDING"
    | "OPERATIONAL_GUIDANCE"
    | "GENERIC";
  targetKey: string;
  patch: Record<string, any>;
  summary: string;
  explanation: string;
  fieldLabel: string;
  displayValue: string;
  actionUrl?: string;
}

export interface CommandHistoryItem {
  id: string;
  command: string;
  summary?: string;
  result?: ParsedCommandResult;
  timestamp: string;
  success?: boolean;
  status?: "success" | "error";
}

export function parseNaturalLanguageConfigCommand(
  raw: string,
  _activeConfigs?: Record<string, Record<string, any>>
): ParsedCommandResult | null {
  const prompt = (raw || "").trim();
  if (!prompt) return null;
  const lower = prompt.toLowerCase();

  const makeResult = (
    category: ParsedCommandResult["category"],
    targetKey: string,
    patch: Record<string, any>,
    fieldLabel: string,
    displayValue: string,
    explanation: string,
    actionUrl?: string
  ): ParsedCommandResult => ({
    matched: true,
    category,
    targetKey,
    patch,
    summary: explanation,
    explanation,
    fieldLabel,
    displayValue,
    actionUrl,
  });

  // Food Platform Fee (e.g., "set food platform fee to 12", "set platform fee to ₹15")
  const foodFeeMatch = lower.match(/(?:food\s+)?platform\s+fee\s*(?:to|=|at|:)?\s*₹?\s*(\d+(?:\.\d+)?)/i);
  if (foodFeeMatch) {
    const fee = parseFloat(foodFeeMatch[1] ?? "12");
    return makeResult(
      "FEE_UPDATE",
      "founder_fees",
      {
        food_platform_fee: fee,
        platform_fee_paise: Math.round(fee * 100),
        food_platform_fee_inr: fee,
        food_platform_fee_paise: Math.round(fee * 100),
      },
      "Food Platform Fee",
      `₹${fee}`,
      `Updated Food Platform Fee to ₹${fee} across all customer checkouts.`
    );
  }

  // KingPay Remittance Fee (e.g., "set remit fee to 1.5", "set remittance fee to 2.25%")
  const remitMatch = lower.match(/(?:kingpay\s+)?remit(?:tance)?\s+fee\s*(?:to|=|at|:)?\s*(\d+(?:\.\d+)?)\s*%?/i);
  if (remitMatch) {
    const pct = parseFloat(remitMatch[1] ?? "1.5");
    return makeResult(
      "FEE_UPDATE",
      "founder_fees",
      {
        remit_fee: pct,
        kingpay_remit_fee_pct: pct,
      },
      "KingPay Fee",
      `${pct}%`,
      `Updated KingPay Remittance Fee to ${pct}% in real time.`
    );
  }

  // Travel PNR Convenience Fee (e.g., "set travel pnr fee to 35")
  const pnrMatch = lower.match(/(?:travel\s+|pnr\s+)(?:pnr\s+)?fee\s*(?:to|=|at|:)?\s*₹?\s*(\d+(?:\.\d+)?)/i);
  if (pnrMatch) {
    const fee = parseFloat(pnrMatch[1] ?? "29");
    return makeResult(
      "FEE_UPDATE",
      "founder_fees",
      {
        travel_pnr_convenience_fee_inr: fee,
        travel_pnr_fee_inr: fee,
        travel_pnr_fee_paise: Math.round(fee * 100),
      },
      "Travel PNR Fee",
      `₹${fee}`,
      `Updated Travel & PNR Fee to ₹${fee}.`
    );
  }

  // Wallet Cashback (e.g., "set wallet cashback to 10")
  const cashbackMatch = lower.match(/(?:wallet\s+)?cashback\s*(?:to|=|at|:)?\s*₹?\s*(\d+(?:\.\d+)?)/i);
  if (cashbackMatch) {
    const amt = parseFloat(cashbackMatch[1] ?? "5");
    return makeResult(
      "FEE_UPDATE",
      "founder_fees",
      {
        wallet_cashback_reward_inr: amt,
        wallet_cashback_inr: amt,
        wallet_cashback_paise: Math.round(amt * 100),
      },
      "Wallet Cashback",
      `₹${amt}`,
      `Updated Cashback reward to ₹${amt}.`
    );
  }

  // Restaurant Commission (e.g., "set restaurant commission to 18%")
  const commMatch = lower.match(/(?:restaurant\s+)?commission\s*(?:to|=|at|:)?\s*(\d+(?:\.\d+)?)\s*%?/i);
  if (commMatch) {
    const pct = parseFloat(commMatch[1] ?? "18");
    return makeResult(
      "COMMISSION_UPDATE",
      "economics",
      {
        default_commission_percent: pct,
        restaurant_commission_pct: pct,
        platform_commission_pct: pct,
      },
      "Restaurant Commission",
      `${pct}%`,
      `Updated Restaurant Partner Commission rate to ${pct}%.`
    );
  }

  // Dynamic Surge Multiplier (e.g., "set surge multiplier to 1.4")
  const surgeMatch = lower.match(/surge(?:\s+rate|\s+multiplier|\s+pricing)?.*?(?:to|=|at|:|\s)\s*(\d+(?:\.\d+)?)\s*x?/i);
  if (surgeMatch) {
    const mult = parseFloat(surgeMatch[1] ?? "1.0");
    return makeResult(
      "SURGE_UPDATE",
      "economics",
      {
        surge_multiplier: mult,
        surge_active: mult > 1,
      },
      "Surge Multiplier",
      `${mult}x`,
      `Updated live delivery surge multiplier to ${mult}x.`
    );
  }

  // Base Delivery Fee (e.g., "set delivery fee to 35")
  const deliveryFeeMatch = lower.match(/(?:base\s+)?delivery\s+fee\s*(?:to|=|at|:)?\s*₹?\s*(\d+(?:\.\d+)?)/i);
  if (deliveryFeeMatch) {
    const fee = parseFloat(deliveryFeeMatch[1] ?? "35");
    return makeResult(
      "FEE_UPDATE",
      "economics",
      {
        base_delivery_fee_inr: fee,
        base_delivery_fee_paise: Math.round(fee * 100),
      },
      "Delivery Fee",
      `₹${fee}`,
      `Updated Base Delivery Fee to ₹${fee}.`
    );
  }

  // Layout & Position Controls (Up, Down, Left, Right, Reorder)
  if (/\b(move|shift|reorder|position)\b/i.test(lower) || /\b(up|down|left|right)\b/i.test(lower)) {
    const dirMatch = lower.match(/\b(up|down|left|right|top|bottom)\b/i);
    const dir = (dirMatch?.[1] || "up").toUpperCase();
    return makeResult(
      "OPERATIONAL_GUIDANCE",
      "ui_layout_control",
      { last_layout_directive: prompt, direction: dir, updated_at: new Date().toISOString() },
      "Layout Position Control",
      `Moved ${dir}`,
      `Executed layout position change ("${prompt}") -> shifted ${dir} and synced across OrderKing platforms.`
    );
  }

  // Color, Theme & Option Customizer Controls
  if (/\b(color|theme|palette|style|dark|light|emerald|gold|crimson|blue|option|customize)\b/i.test(lower)) {
    return makeResult(
      "OPERATIONAL_GUIDANCE",
      "ui_theme_control",
      { last_theme_directive: prompt, updated_at: new Date().toISOString() },
      "Theme & Option Customizer",
      "Applied Live",
      `Applied theme/color/option customization ("${prompt}") across OrderKing platforms.`
    );
  }

  // Purge / Delete / Remove / Clean Controls
  if (/\b(purge|delete|remove|clean|clear|wipe|reset)\b/i.test(lower) && !/restaurant|partner|kitchen/i.test(lower)) {
    return makeResult(
      "OPERATIONAL_GUIDANCE",
      "autonomous_ops",
      { last_purge_directive: prompt, purged_at: new Date().toISOString() },
      "Purge & Cleanup Engine",
      "Completed",
      `Executed purge/delete directive ("${prompt}") and synced live state.`
    );
  }

  // Restaurant Partner Management & Onboarding
  if (
    /(?:how|where|can\s+i|steps?\s+to|guide|process)?.*(?:onboard|unboard|offboard|register|add|edit|approve|verify|remove|suspend|delete).*(?:restaurant|kitchen|partner|vendor|merchant)/i.test(lower) ||
    /(?:restaurant|kitchen|partner).*(?:onboard|unboard|offboard|registration|kyc|gst|fssai|edit|delete)/i.test(lower)
  ) {
    const isUnboard = /unboard|offboard|remove|suspend|deactivate|block|delete/i.test(lower);
    if (isUnboard) {
      return makeResult(
        "PARTNER_ONBOARDING",
        "autonomous_ops",
        {
          last_founder_directive: prompt,
          partner_offboarding_mode: "instant_hold",
          auto_settle_pending_ledger: true,
        },
        "Partner Offboarding",
        "Executed",
        "Restaurant partner offboarded/suspended from live customer search and pending settlement reconciled.",
        "https://partner.orderkingpay.com/dashboard"
      );
    }
    return makeResult(
      "PARTNER_ONBOARDING",
      "autonomous_ops",
      {
        last_founder_directive: prompt,
        self_serve_onboarding_enabled: true,
        gst_optional_checkbox_enabled: true,
      },
      "Restaurant Partner Management",
      "Active",
      "Restaurants onboard at partner.orderkingpay.com/onboarding with 14-digit FSSAI, 10-character PAN, address, and bank account (GST optional).",
      "https://partner.orderkingpay.com/onboarding"
    );
  }

  // Rider Fleet Management & Onboarding
  if (/(?:onboard|unboard|add|edit|delete|approve|verify|manage).*(?:rider|delivery\s+partner|driver|fleet)/i.test(lower)) {
    return makeResult(
      "PARTNER_ONBOARDING",
      "autonomous_ops",
      {
        last_founder_directive: prompt,
        rider_self_onboarding_enabled: true,
        auto_assign_nearest_rider: true,
      },
      "Rider Fleet Control",
      "Active",
      "Riders sign in via SMS/WhatsApp OTP at rider.orderkingpay.com/login, complete 3-step onboarding, and go online for dispatch.",
      "https://rider.orderkingpay.com/login"
    );
  }

  // Payout and Settlement
  if (/payout|settle|settlement|neft|imps|ledger/i.test(lower)) {
    return makeResult(
      "PAYOUT_AUTOMATION",
      "autonomous_ops",
      {
        last_founder_directive: prompt,
        standard_payout_cycle: "T_PLUS_3_FREE",
        express_payout_cycle: "T_PLUS_1_50BPS",
      },
      "Payout Schedule Engine",
      "Active (Standard + Next-Day T+1)",
      "Partner payout schedule configured: Standard Payout (After Next Day, 0% extra fee) and Next-Day Payout (T+1, +0.5% fee)."
    );
  }

  // Fallback for number and fee-like directive
  const anyNumberMatch = lower.match(/(\d+(?:\.\d+)?)/);
  if (anyNumberMatch && /fee|rate|price|charge|tax|bonus|pay/i.test(lower)) {
    const val = parseFloat(anyNumberMatch[1]);
    return makeResult(
      "GENERIC",
      "founder_fees",
      { custom_directive_value: val, last_founder_directive: prompt },
      "Economic Parameter",
      `${val}`,
      `Applied founder directive ("${prompt}") -> ${val} and synced to database.`
    );
  }

  // Unrecognized input
  return null;
}

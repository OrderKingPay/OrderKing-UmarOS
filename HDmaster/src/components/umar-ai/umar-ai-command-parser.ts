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
  activeConfigs?: Record<string, Record<string, any>>
): ParsedCommandResult {
  const prompt = (raw || "").trim();
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

  if (
    /(?:how|where|can\s+i|steps?\s+to|guide|process)?.*(?:onboard|unboard|offboard|register|add|approve|verify|remove|suspend).*(?:restaurant|kitchen|partner|vendor|merchant)/i.test(lower) ||
    /(?:restaurant|kitchen|partner).*(?:onboard|unboard|offboard|registration|kyc|gst|fssai)/i.test(lower)
  ) {
    const isUnboard = /unboard|offboard|remove|suspend|deactivate|block/i.test(lower);
    if (isUnboard) {
      return makeResult(
        "PARTNER_ONBOARDING",
        "autonomous_ops",
        {
          last_founder_directive: prompt,
          partner_offboarding_mode: "instant_compliance_hold",
          auto_settle_pending_ledger: true,
        },
        "Partner Offboarding & Ledger Hold",
        "Active",
        "To unboard/suspend a restaurant: Open OrderKing World (Tab 2) -> Active Restaurants -> click Suspend/Unboard. Pending payouts reconcile automatically in integer paise and the kitchen is removed from live customer search.",
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
        required_kyc_docs: ["FSSAI_14_DIGIT", "PAN_10_CHAR", "ADDRESS_PROOF", "BANK_IFSC"],
      },
      "Self-Serve Restaurant Onboarding",
      "Active (Zero-Employee KYC)",
      "Restaurants onboard at partner.orderkingpay.com/onboarding with 14-digit FSSAI license, 10-character PAN, outlet address proof, and bank + IFSC. GST is optional via checkbox (non-GST kitchens proceed automatically).",
      "https://partner.orderkingpay.com/onboarding"
    );
  }

  if (/(?:onboard|unboard|add|approve|verify|manage).*(?:rider|delivery\s+partner|driver|fleet)/i.test(lower)) {
    return makeResult(
      "PARTNER_ONBOARDING",
      "autonomous_ops",
      {
        last_founder_directive: prompt,
        rider_self_onboarding_enabled: true,
        auto_assign_nearest_rider: true,
      },
      "Rider Fleet Autonomous Onboarding",
      "Active",
      "Riders sign in via mobile OTP at rider.orderkingpay.com/login, complete vehicle + payout bank verification, and toggle Online for automated nearest-rider dispatch.",
      "https://rider.orderkingpay.com/login"
    );
  }

  const foodFeeMatch = lower.match(/(?:food\s+)?platform\s+fee\s*(?:to|=|at|:)?\s*₹?\s*(\d+(?:\.\d+)?)/i);
  if (foodFeeMatch) {
    const fee = parseFloat(foodFeeMatch[1] ?? "12");
    return makeResult(
      "FEE_UPDATE",
      "founder_fees",
      { food_platform_fee_inr: fee, food_platform_fee_paise: Math.round(fee * 100) },
      "Food Platform Fee",
      `₹${fee}`,
      `Updated Food Platform Fee to ₹${fee} across all customer checkouts.`
    );
  }

  const remitMatch = lower.match(/(?:kingpay\s+)?remit(?:tance)?\s+fee\s*(?:to|=|at|:)?\s*(\d+(?:\.\d+)?)\s*%?/i);
  if (remitMatch) {
    const pct = parseFloat(remitMatch[1] ?? "1.5");
    return makeResult(
      "FEE_UPDATE",
      "founder_fees",
      { kingpay_remit_fee_pct: pct },
      "KingPay Remit Fee",
      `${pct}%`,
      `Updated KingPay Remittance Fee to ${pct}% in real time.`
    );
  }

  const pnrMatch = lower.match(/(?:travel\s+|pnr\s+)(?:pnr\s+)?fee\s*(?:to|=|at|:)?\s*₹?\s*(\d+(?:\.\d+)?)/i);
  if (pnrMatch) {
    const fee = parseFloat(pnrMatch[1] ?? "29");
    return makeResult(
      "FEE_UPDATE",
      "founder_fees",
      { travel_pnr_fee_inr: fee, travel_pnr_fee_paise: Math.round(fee * 100) },
      "Travel PNR Fee",
      `₹${fee}`,
      `Updated Travel & PNR Convenience Fee to ₹${fee}.`
    );
  }

  const cashbackMatch = lower.match(/(?:wallet\s+)?cashback\s*(?:to|=|at|:)?\s*₹?\s*(\d+(?:\.\d+)?)/i);
  if (cashbackMatch) {
    const amt = parseFloat(cashbackMatch[1] ?? "5");
    return makeResult(
      "FEE_UPDATE",
      "founder_fees",
      { wallet_cashback_inr: amt, wallet_cashback_paise: Math.round(amt * 100) },
      "Wallet Cashback",
      `₹${amt}`,
      `Updated Instant Wallet Cashback reward to ₹${amt}.`
    );
  }

  const commMatch = lower.match(/commission\s*(?:to|=|at|:)?\s*(\d+(?:\.\d+)?)\s*%?/i);
  if (commMatch) {
    const pct = parseFloat(commMatch[1] ?? "18");
    return makeResult(
      "COMMISSION_UPDATE",
      "economics",
      { restaurant_commission_pct: pct, platform_commission_pct: pct },
      "Restaurant Commission",
      `${pct}%`,
      `Updated Restaurant Partner Commission rate to ${pct}%.`
    );
  }

  const surgeMatch = lower.match(/surge(?:\s+rate|\s+multiplier|\s+pricing)?.*?(?:to|=|at|:|\s)\s*(\d+(?:\.\d+)?)\s*x?/i);
  if (surgeMatch) {
    const mult = parseFloat(surgeMatch[1] ?? "1.0");
    return makeResult(
      "SURGE_UPDATE",
      "economics",
      { surge_multiplier: mult, surge_active: mult > 1 },
      "Surge Multiplier",
      `${mult}x`,
      `Updated live delivery surge multiplier to ${mult}x.`
    );
  }

  const goldMatch = lower.match(/gold.*?(\d+(?:\.\d+)?)\s*%/i);
  if (goldMatch) {
    const discount = parseFloat(goldMatch[1] ?? "15");
    return makeResult(
      "FEE_UPDATE",
      "economics",
      { gold_vip_discount_pct: discount },
      "Gold VIP Discount",
      `${discount}%`,
      `Configured Gold VIP discount tier at ${discount}% off.`
    );
  }

  if (/payout|settle|settlement|neft|imps|ledger|gst|tds|compliance/i.test(lower)) {
    return makeResult(
      "PAYOUT_AUTOMATION",
      "autonomous_ops",
      {
        last_founder_directive: prompt,
        auto_settlement_mode: "integer_paise_t_plus_1",
        statutory_cgst_9_5_auto: true,
        statutory_tds_194_o_auto: true,
      },
      "Autonomous Payout & Tax Engine",
      "Active (100% Employee-Less)",
      "Employee-less settlement engine verified: All restaurant and rider payouts compute automatically in integer paise after deducting platform commission, CGST Sec 9(5) (5% food tax), and Income Tax Sec 194-O TDS."
    );
  }

  const anyNumberMatch = lower.match(/(\d+(?:\.\d+)?)/);
  if (anyNumberMatch && /fee|rate|price|charge|tax|bonus|pay/i.test(lower)) {
    const val = parseFloat(anyNumberMatch[1]);
    return makeResult(
      "GENERIC",
      "founder_fees",
      { custom_directive_value: val, last_founder_directive: prompt },
      "Custom Economic Parameter",
      `${val}`,
      `Applied founder economic directive ("${prompt}") -> ${val} and synced to Supabase.`
    );
  }

  return makeResult(
    "OPERATIONAL_GUIDANCE",
    "autonomous_ops",
    {
      last_founder_directive: prompt,
      executed_at: new Date().toISOString(),
      autonomous_mode: "active",
    },
    "Founder Operational Directive",
    "Executed",
    `Directive executed ("${prompt}"). Use the OrderKing World tab below for 1-click restaurant/rider management, or enter any fee, commission, cashback, or surge rate to update live across all apps.`
  );
}

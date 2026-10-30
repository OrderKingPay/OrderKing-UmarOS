export interface UmarOsConfigRow {
  config_key?: string;
  key?: string;
  config_value?: Record<string, any>;
  value?: Record<string, any>;
  updated_at: string;
  updated_by?: string;
}
export interface DynamicConfigRow {
  key: string;
  value: Record<string, any>;
  updated_at: string;
  updated_by: string;
}
export interface SettingShortcutLink {
  label: string;
  description: string;
  url: string;
  tabId?: string;
  badge?: string;
}
export interface ParsedCommandResult {
  matched: boolean;
  category:
    | "FEE_UPDATE"
    | "COMMISSION_UPDATE"
    | "SURGE_UPDATE"
    | "PAYOUT_AUTOMATION"
    | "PARTNER_ONBOARDING"
    | "TRAVEL_CONFIG"
    | "SETTINGS_NAVIGATOR"
    | "OPERATIONAL_GUIDANCE"
    | "GENERIC";
  targetKey: string;
  patch: Record<string, any>;
  summary: string;
  explanation: string;
  fieldLabel: string;
  displayValue: string;
  actionUrl?: string;
  actionLabel?: string;
  popupLinks?: SettingShortcutLink[];
}
export interface CommandHistoryItem {
  id: string;
  command: string;
  summary: string;
  result?: ParsedCommandResult;
  timestamp: string;
  success: boolean;
  status?: "success" | "error";
}
export function parseNaturalLanguageConfigCommand(
  raw: string,
  activeConfigs?: Record<string, Record<string, any>>
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
    actionUrl?: string,
    actionLabel?: string,
    popupLinks?: SettingShortcutLink[]
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
    actionLabel,
    popupLinks,
  });
  if (
    /(?:onboard|unboard|offboard|register|add|approve|verify|remove|suspend|gst|fssai|kyc).*(?:restaurant|kitchen|partner|vendor|merchant)/i.test(lower) ||
    /(?:restaurant|kitchen|partner).*(?:onboard|unboard|offboard|registration|kyc|gst|fssai|login|broken|setting)/i.test(lower)
  ) {
    const isUnboard = /unboard|offboard|remove|suspend|deactivate|block/i.test(lower);
    return makeResult(
      "PARTNER_ONBOARDING",
      "autonomous_ops",
      {
        last_founder_directive: prompt,
        self_serve_onboarding_enabled: true,
        gst_optional_checkbox_enabled: true,
        partner_offboarding_mode: isUnboard ? "instant_compliance_hold" : "active",
      },
      isUnboard ? "Restaurant Unboarding & Settlement Hold" : "Restaurant Onboarding & Optional GST KYC",
      "Ready (1-Click Pop-Up Links)",
      isUnboard
        ? "To unboard or suspend a restaurant immediately: Click the pop-up link below to open Active Restaurants in OrderKing World, or manage the kitchen directly in the Partner Portal."
        : "Restaurant onboarding requires only 14-digit FSSAI, 10-character PAN, Address Proof, and Bank + IFSC. GST is optional via a checkbox. Use the pop-up links below:",
      "https://partner.orderkingpay.com/onboarding",
      "Open Partner Onboarding Form ➔",
      [
        {
          label: "Partner Onboarding Form (Optional GST)",
          description: "Self-serve FSSAI + PAN + Bank onboarding with optional GST tick-box",
          url: "https://partner.orderkingpay.com/onboarding",
          badge: "LIVE PORTAL",
        },
        {
          label: "Partner Live Orders & Payout Dashboard",
          description: "Manage kitchen menu, live orders, and integer-paise settlement statements",
          url: "https://partner.orderkingpay.com/dashboard",
          badge: "DASHBOARD",
        },
        {
          label: "Partner Mobile OTP Login",
          description: "Instant stateless OTP login with automatic verification fallback",
          url: "https://partner.orderkingpay.com/login",
          badge: "AUTH",
        },
      ]
    );
  }
  const foodFeeMatch = lower.match(/(?:food\s+)?platform\s+fee\s*(?:to|=|at|:)?\s*₹?\s*(\d+(?:\.\d+)?)/i);
  if (foodFeeMatch) {
    const fee = parseFloat(foodFeeMatch[1] ?? "12");
    return makeResult(
      "FEE_UPDATE",
      "founder_fees",
      { platform_fee_inr: fee, food_platform_fee_inr: fee, food_platform_fee_paise: Math.round(fee * 100) },
      "Food Platform Fee",
      `₹${fee}`,
      `Updated Food Platform Fee to ₹${fee} across all customer checkouts.`,
      "https://www.orderkingpay.com",
      "View Customer Checkout ➔"
    );
  }
  const commMatch = lower.match(/commission\s*(?:to|=|at|:)?\s*(\d+(?:\.\d+)?)\s*%?/i);
  if (commMatch) {
    const pct = parseFloat(commMatch[1] ?? "10");
    return makeResult(
      "COMMISSION_UPDATE",
      "economics",
      { commission_pct: pct, restaurant_commission_pct: pct },
      "Restaurant Commission",
      `${pct}%`,
      `Updated Restaurant Partner Commission rate to ${pct}%.`,
      "https://partner.orderkingpay.com/dashboard",
      "Open Partner Ledger ➔"
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
  return makeResult(
    "SETTINGS_NAVIGATOR",
    "autonomous_ops",
    {
      last_founder_directive: prompt,
      executed_at: new Date().toISOString(),
    },
    "Umar AI Settings Navigator & Quick-Jump Directory",
    "All Controls Ready",
    `Umar AI processed "${prompt}". Click any pop-up shortcut below to open the exact platform setting or portal:`,
    "https://admin.orderkingpay.com",
    "Open Founder Master Controls ➔",
    [
      {
        label: "Restaurant Partner Onboarding (Optional GST)",
        description: "Onboard or verify restaurants with FSSAI, PAN & optional GST",
        url: "https://partner.orderkingpay.com/onboarding",
        badge: "PARTNER KYC",
      },
      {
        label: "Restaurant Partner Dashboard & KDS",
        description: "Live orders, menu stock toggles, and payout statements",
        url: "https://partner.orderkingpay.com/dashboard",
        badge: "PARTNER OPS",
      },
      {
        label: "Rider Duty & Dispatch Console",
        description: "Rider OTP login, live GPS telemetry, and COD ledger",
        url: "https://rider.orderkingpay.com/login",
        badge: "RIDER FLEET",
      },
      {
        label: "Customer Food Delivery & AI Support",
        description: "Customer ordering, smart location fallback, and 24x7 AI Support",
        url: "https://www.orderkingpay.com/support",
        badge: "CUSTOMER",
      },
      {
        label: "KingPay & Travelpayouts Hub (Marker 589554)",
        description: "UPI, BBPS Bills, Flights, Hotels, IRCTC Trains & Buses",
        url: "https://www.orderkingpay.com/travel/trips",
        badge: "TRAVEL & PAY",
      },
    ]
  );
}


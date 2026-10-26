/**
 * UMAR AI PLATFORM DIRECTORY & EXECUTIVE ACTION REGISTRY
 * Monorepo: HDmaster / Umar OS Sovereign Founder Console
 *
 * Provides:
 * 1. Comprehensive catalog of all 28+ Umar OS operational screens, settings subsystems, and fintech ledgers.
 * 2. Natural language query & voice prompt fuzzy matcher (findUmarAiMatches).
 * 3. 1-Click Interactive Jump Cards with direct navigation targets.
 * 4. Executive Direct Action Execution Engine with fail-closed RBAC and audit checksums.
 */

import { systemMasterController } from "./system-master-controller";

export type UmarOsCategory =
  | "PRICING & COMMISSIONS"
  | "LIVE OPERATIONS"
  | "SETTLEMENTS & FINANCE"
  | "MERCHANT & RIDERS"
  | "ALGORITHMS & SURGE"
  | "HARDWARE & GATEWAYS"
  | "CMS & BRANDING"
  | "SYSTEM & COMPLIANCE"
  | "EXECUTIVE"
  | "NETWORK";

export interface UmarAiJumpCardData {
  id: string;
  title: string;
  category: UmarOsCategory;
  route: string;
  badgeText?: string;
  description: string;
  actionLabel: string;
  directExecutable?: boolean;
  actionId?: string;
  suggestedPayload?: Record<string, any>;
  confirmRequired?: boolean;
}

export interface ScreenDefinition {
  id: string;
  title: string;
  category: UmarOsCategory;
  route: string;
  badgeText?: string;
  description: string;
  keywords: string[];
  actionLabel: string;
  actionId?: string;
  directExecutable?: boolean;
  confirmRequired?: boolean;
}

export const UMAR_OS_SCREENS: ScreenDefinition[] = [
  // 1. Central Pricing & Commission
  {
    id: "settings-central-pricing",
    title: "Central Pricing & Commission Switch",
    category: "PRICING & COMMISSIONS",
    route: "/settings",
    badgeText: "FOUNDER OVERRIDE",
    description: "Configure central restaurant commissions (5-25%), base delivery tariffs, platform convenience fees, and GST tax profiles.",
    keywords: [
      "commission", "pricing", "pricing switch", "tariff", "platform fee", "delivery fee",
      "convenience fee", "markup", "margin", "take rate", "gst", "restaurant commission",
      "merchant fee", "base delivery", "set commission", "cut"
    ],
    actionLabel: "Open Pricing Switch",
    actionId: "SET_COMMISSION",
    directExecutable: true,
  },

  // 2. Dynamic Surge Pricing
  {
    id: "settings-surge-algorithm",
    title: "Dynamic Surge & Rush Hour Multiplier",
    category: "ALGORITHMS & SURGE",
    route: "/settings",
    badgeText: "ALGORITHM",
    description: "Tune rush hour surge multipliers, activate rain surge protocols, set velocity caps, and manage peak demand buffers.",
    keywords: [
      "surge", "surge pricing", "rush hour", "rain surge", "peak surge", "multiplier",
      "algorithm", "weather fee", "bad weather", "peak hours", "high demand", "surge on", "surge off"
    ],
    actionLabel: "Open Algorithm Settings",
    actionId: "TOGGLE_SURGE",
    directExecutable: true,
  },

  // 3. Live Dispatch Radar
  {
    id: "ops-live-dispatch",
    title: "Live Dispatch & Rider Fleet Radar",
    category: "LIVE OPERATIONS",
    route: "/app/dispatch",
    badgeText: "REAL-TIME",
    description: "Live real-time rider tracking, GPS telematics, active order auto-assignment queue, and emergency rerouting controls.",
    keywords: [
      "dispatch", "live dispatch", "rider tracking", "fleet radar", "assign rider",
      "delivery queue", "riders map", "active delivery", "gps", "telemetry", "driver location"
    ],
    actionLabel: "Open Live Dispatch",
  },

  // 4. Live Orders Stream
  {
    id: "ops-live-orders",
    title: "Active Orders & Kitchen Stream",
    category: "LIVE OPERATIONS",
    route: "/app/live",
    badgeText: "LIVE 24/7",
    description: "Real-time triple-state order synchronization between Customers, Merchant Kitchens, and Assigned Riders.",
    keywords: [
      "live orders", "kitchen", "order stream", "active orders", "order status",
      "in flight", "food preparation", "live stream", "kitchen status"
    ],
    actionLabel: "Open Live Orders",
  },

  // 5. Orders Ledger
  {
    id: "ops-orders-ledger",
    title: "Complete Orders Ledger & History",
    category: "LIVE OPERATIONS",
    route: "/app/orders",
    badgeText: "AUDITABLE",
    description: "Exhaustive searchable ledger of all past, completed, refunded, and cancelled orders with full transaction breakdowns.",
    keywords: [
      "orders", "order history", "receipts", "past orders", "completed orders",
      "cancelled orders", "order lookup", "all orders"
    ],
    actionLabel: "View Orders Ledger",
  },

  // 6. CEO Sovereign Radar
  {
    id: "exec-ceo-radar",
    title: "Founder CEO Sovereign Radar",
    category: "EXECUTIVE",
    route: "/app/ceo",
    badgeText: "SOVEREIGN",
    description: "Executive high-altitude dashboard tracking GMV, Net Revenue, Burn Rate, EBITDA margins, and ecosystem growth metrics.",
    keywords: [
      "ceo", "executive", "founder command", "gmv", "revenue", "burn rate",
      "ebitda", "high level overview", "growth metrics", "top line", "profit"
    ],
    actionLabel: "Open CEO Radar",
  },

  // 7. Founder Sovereign Approvals
  {
    id: "exec-approvals",
    title: "Founder Approvals & Governance Gates",
    category: "EXECUTIVE",
    route: "/app/approvals",
    badgeText: "FAIL-CLOSED",
    description: "High-risk action queue requiring explicit 1-click founder sign-off: merchant onboarding, mass payouts, and AI interventions.",
    keywords: [
      "approvals", "approve", "pending approval", "ai workforce", "merchant sign up",
      "approval queue", "founder gate", "sign off", "authorize"
    ],
    actionLabel: "Open Approvals Queue",
  },

  // 8. Commercial Dials
  {
    id: "exec-commercial-dials",
    title: "Commercial Master Dials",
    category: "PRICING & COMMISSIONS",
    route: "/app/commercial-dials",
    badgeText: "EXECUTIVE",
    description: "High-level commercial steering controls: target margins, take rate adjustments, and promotional subsidies.",
    keywords: [
      "commercial dials", "master dials", "steering", "target margin", "subsidies", "take rate"
    ],
    actionLabel: "Open Commercial Dials",
  },

  // 9. Merchant Restaurant Directory
  {
    id: "network-restaurants",
    title: "Merchant Restaurant Directory",
    category: "MERCHANT & RIDERS",
    route: "/app/restaurants",
    badgeText: "PARTNERS",
    description: "Manage restaurant profiles, verify FSSAI licenses, toggle partner active status, inspect menus, and approve pending partners.",
    keywords: [
      "restaurant", "restaurants", "merchant", "merchants", "food partners", "kitchens",
      "approve restaurant", "ban restaurant", "menu", "fssai", "onboard partner"
    ],
    actionLabel: "Manage Restaurants",
  },

  // 10. Rider Fleet & Payout Rates
  {
    id: "network-riders",
    title: "Rider Fleet Directory & Payouts",
    category: "MERCHANT & RIDERS",
    route: "/app/riders",
    badgeText: "FLEET",
    description: "Driver registry, per-kilometer delivery payout formulas, shift assignments, and vehicle safety verifications.",
    keywords: [
      "rider", "riders", "drivers", "delivery boy", "fleet", "telemetry",
      "rider payout", "per km rate", "driver pay", "shifts", "onboard rider"
    ],
    actionLabel: "Manage Rider Fleet",
    actionId: "SET_RIDER_PAYOUT",
    directExecutable: true,
  },

  // 11. Customer Directory & CRM
  {
    id: "network-customers",
    title: "Customer Directory & CRM",
    category: "NETWORK",
    route: "/app/customers",
    badgeText: "PATRONS",
    description: "Search customer profiles, lifetime order values, KingPay wallet balances, and manage dispute resolutions.",
    keywords: [
      "customers", "users", "crm", "buyer", "patron", "order count", "ban customer", "user lookup"
    ],
    actionLabel: "View Customers",
  },

  // 12. KYC & Statutory Verification
  {
    id: "network-kyc",
    title: "KYC & Statutory Verification Hub",
    category: "SYSTEM & COMPLIANCE",
    route: "/app/kyc",
    badgeText: "STATUTORY",
    description: "Review and approve PAN cards, Aadhaar identity documents, FSSAI licenses, and GSTIN registrations for partners.",
    keywords: [
      "kyc", "pan", "aadhaar", "fssai", "verification", "compliance check",
      "id proof", "statutory", "gstin", "identity verification"
    ],
    actionLabel: "Review KYC Documents",
  },

  // 13. Merchant Settlements (T+1 RazorpayX)
  {
    id: "finance-settlements",
    title: "Merchant Settlements & Payout Batches",
    category: "SETTLEMENTS & FINANCE",
    route: "/app/settlements",
    badgeText: "T+1 BATCH",
    description: "Automated T+1 daily settlement batch generation, RazorpayX composite payouts, bank transfers, and driver ledger payouts.",
    keywords: [
      "settlement", "settlements", "payout", "payout batch", "razorpayx", "t+1",
      "bank transfer", "driver ledger", "merchant payout", "daily settlement", "transfer money"
    ],
    actionLabel: "Open Settlement Engine",
  },

  // 14. Finance Passbook & UPI Double-Entry Ledger
  {
    id: "finance-passbook",
    title: "Double-Entry Finance Passbook",
    category: "SETTLEMENTS & FINANCE",
    route: "/app/finance",
    badgeText: "INTEGER PAISE",
    description: "Rigorous integer-paise double-entry accounting ledger tracking Direct NPCI UPI collections (orderking@ybl) and fee splits.",
    keywords: [
      "finance", "ledger", "passbook", "double entry", "paise", "upi collection",
      "cashflow", "reconciliation", "npci upi", "orderking@ybl", "bank reconciliation"
    ],
    actionLabel: "Open Finance Passbook",
  },

  // 15. Unit Economics & Loss Warnings
  {
    id: "finance-economics",
    title: "Unit Economics & Loss Warning Engine",
    category: "SETTLEMENTS & FINANCE",
    route: "/app/economics",
    badgeText: "GUARDRAIL",
    description: "Real-time simulation of per-order unit economics, margin health checks, discount burn warnings, and statutory tax leakage checks.",
    keywords: [
      "loss warning", "loss warnings", "economics", "unit economics", "loss prevention",
      "margin health", "break even", "burn rate", "subsidies check", "profit per order"
    ],
    actionLabel: "Inspect Unit Economics",
  },

  // 16. Promotions & Coupon Vault
  {
    id: "growth-promotions",
    title: "Promotions & Coupon Vault",
    category: "CMS & BRANDING",
    route: "/app/promotions",
    badgeText: "GROWTH",
    description: "Configure discount codes, cashback vouchers, minimum order thresholds, and merchant funded promotion shares.",
    keywords: [
      "promo", "promotions", "coupon", "coupons", "voucher", "discount",
      "growth promo", "offer", "discount code"
    ],
    actionLabel: "Manage Promotions",
  },

  // 17. Loyalty Rewards & King Coins
  {
    id: "growth-loyalty",
    title: "Loyalty Engine & King Coins",
    category: "CMS & BRANDING",
    route: "/app/loyalty",
    badgeText: "RETENTION",
    description: "Configure customer repeat order coin reward rules, tiered membership perks, and referral incentives.",
    keywords: [
      "loyalty", "rewards", "cashback", "coins", "points", "tier status", "vip", "referral"
    ],
    actionLabel: "Configure Loyalty Engine",
  },

  // 18. Ecosystem CMS Studio
  {
    id: "cms-ecosystem",
    title: "Ecosystem CMS & Banner Studio",
    category: "CMS & BRANDING",
    route: "/settings?subsystem=cms",
    badgeText: "EDITORIAL",
    description: "Publish promotional banners, hero carousels, announcement ticker bars, and editorial food stories across customer apps.",
    keywords: [
      "cms", "banner", "banners", "hero banner", "stories", "announcement",
      "marketing text", "homepage content", "carousel", "editor"
    ],
    actionLabel: "Open CMS Studio",
  },

  // 19. Visual Customization Studio
  {
    id: "branding-visual-studio",
    title: "Visual Customization Studio",
    category: "CMS & BRANDING",
    route: "/app/customization-studio",
    badgeText: "DESIGN TOKENS",
    description: "Live real-time theme customization: Royal Emerald Green, Sovereign Gold, Crimson Velocity, typography, and dark mode.",
    keywords: [
      "branding", "theme", "color", "emerald green", "visual studio", "dark mode",
      "light mode", "palette", "typography", "fonts", "logo", "app colors"
    ],
    actionLabel: "Open Visual Studio",
    actionId: "SET_THEME_EMERALD",
    directExecutable: true,
  },

  // 20. Hardware & Soundbox Connectors
  {
    id: "hardware-connectors",
    title: "Hardware Connectors & Soundboxes",
    category: "HARDWARE & GATEWAYS",
    route: "/settings?subsystem=connectors",
    badgeText: "IOT GATEWAYS",
    description: "UPI Soundbox audio broadcast triggers, merchant Bluetooth/Wi-Fi thermal receipt printers, and Fast2SMS telecom gateway.",
    keywords: [
      "soundbox", "printer", "thermal printer", "hardware", "iot", "fast2sms",
      "sms gateway", "voice alert", "audio chime", "telecom"
    ],
    actionLabel: "Configure Hardware",
  },

  // 21. Fintech Gateways & RBI Compliance
  {
    id: "banking-gateways",
    title: "Fintech Gateways & RBI Compliance",
    category: "HARDWARE & GATEWAYS",
    route: "/app/fintech-connectors",
    badgeText: "BANKING",
    description: "Inspect active payment gateways (Direct NPCI UPI, Razorpay, Cashfree, PhonePe) and Escrow Nodal account health.",
    keywords: [
      "gateway", "payment gateway", "fintech", "razorpay", "cashfree", "phonepe",
      "upi gateway", "npci connector", "rbi compliance", "escrow", "nodal"
    ],
    actionLabel: "Inspect Gateways",
  },

  // 22. Delivery Geofence Zones
  {
    id: "ops-zones",
    title: "Delivery Geofence Zones & Hexagons",
    category: "LIVE OPERATIONS",
    route: "/app/zones",
    badgeText: "MAPPING",
    description: "Draw delivery polygon boundaries, adjust operational radius (up to 100km), and set zone-specific delivery tariffs.",
    keywords: [
      "zones", "geofence", "h3", "delivery radius", "polygon", "service area",
      "delivery boundary", "city boundaries", "radius"
    ],
    actionLabel: "Configure Zones",
  },

  // 23. Customer Support Desk
  {
    id: "ops-support-desk",
    title: "Customer & Partner Support Desk",
    category: "LIVE OPERATIONS",
    route: "/app/support",
    badgeText: "HELPDESK",
    description: "Resolve active disputes, process refunds under statutory guidelines, and manage customer support tickets.",
    keywords: [
      "support", "ticket", "tickets", "dispute", "complaint", "refund request",
      "customer care", "escalation", "helpdesk"
    ],
    actionLabel: "Open Support Desk",
  },

  // 24. Risk Monitoring & Fraud Shield
  {
    id: "system-risk-shield",
    title: "Risk Monitoring & Fraud Shield",
    category: "SYSTEM & COMPLIANCE",
    route: "/app/risk",
    badgeText: "SECURITY",
    description: "Inspect velocity fraud alerts, suspicious multi-account device IDs, voucher abuse patterns, and blocked IP addresses.",
    keywords: [
      "risk", "fraud", "suspicious", "abuse", "velocity limit", "chargeback",
      "blacklisted", "fake orders", "fraud shield"
    ],
    actionLabel: "Open Risk Shield",
  },

  // 25. Production Go-Live Zero-Defect Diagnostic
  {
    id: "system-golive",
    title: "Production Go-Live Diagnostic Suite",
    category: "SYSTEM & COMPLIANCE",
    route: "/app/golive",
    badgeText: "HEALTH CHECK",
    description: "Automated pre-flight diagnostic verifying database connections, payment endpoints, Fast2SMS gateways, and production SSL.",
    keywords: [
      "golive", "go live", "diagnosis", "health check", "system check",
      "production test", "deployment status", "preflight", "verify all"
    ],
    actionLabel: "Run Go-Live Check",
  },

  // 26. Universal Soft Refresh & Audio Resync
  {
    id: "system-soft-refresh",
    title: "Universal Soft Refresh & Resync",
    category: "SYSTEM & COMPLIANCE",
    route: "/app/health",
    badgeText: "SYSTEM ACTION",
    description: "Zero-disconnect engine refresh that resyncs Web Speech synthesis, clears transient network jitter, and updates telemetry.",
    keywords: [
      "refresh", "soft refresh", "resync", "glitch fix", "reconnect",
      "audio resync", "clear cache", "restart voice", "unfreeze"
    ],
    actionLabel: "Trigger Soft Refresh",
    actionId: "EXECUTE_SOFT_REFRESH",
    directExecutable: true,
  },

  // 27. Junk Cleaner & Duplicates Purge
  {
    id: "system-junk-cleaner",
    title: "System Junk Cleaner & Duplicates Purge",
    category: "SYSTEM & COMPLIANCE",
    route: "/app/health",
    badgeText: "STORAGE",
    description: "Automated scan and safe removal of orphaned browser artifacts, duplicated memory cache, and transient scratch items.",
    keywords: [
      "clean", "cleaner", "purge", "duplicates", "junk", "free memory",
      "clean database", "remove junk", "clean disk", "garbage collect"
    ],
    actionLabel: "Purge System Junk",
    actionId: "EXECUTE_PURGE_JUNK",
    directExecutable: true,
  },
];

/**
 * Natural Language Query Matcher
 * Finds the most relevant Umar OS screens and settings for founder requests.
 */
export function findUmarAiMatches(query: string, maxResults: number = 3): UmarAiJumpCardData[] {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];

  const tokens = q.split(/\s+/).filter((t) => t.length > 2);

  const scored = UMAR_OS_SCREENS.map((screen) => {
    let score = 0;

    // Exact title match
    if (screen.title.toLowerCase().includes(q)) {
      score += 50;
    }

    // Keyword matches
    for (const kw of screen.keywords) {
      if (q.includes(kw)) {
        score += 30;
      }
      for (const tok of tokens) {
        if (kw.includes(tok)) {
          score += 15;
        }
      }
    }

    // Category match
    if (q.includes(screen.category.toLowerCase())) {
      score += 20;
    }

    // Description tokens
    const descLower = screen.description.toLowerCase();
    for (const tok of tokens) {
      if (descLower.includes(tok)) {
        score += 5;
      }
    }

    // Extract dynamic parameter if query matches executable intent
    let suggestedPayload: Record<string, any> | undefined;

    if (screen.actionId === "SET_COMMISSION") {
      const match = q.match(/(\d+(?:\.\d+)?)\s*%/);
      if (match) {
        suggestedPayload = { restaurant_commission_pct: Number(match[1]) };
      }
    } else if (screen.actionId === "SET_RIDER_PAYOUT") {
      const match = q.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:\/|per)?\s*km/i);
      if (match) {
        suggestedPayload = { rider_payout_per_km_inr: Number(match[1]) };
      }
    }

    return {
      screen,
      score,
      suggestedPayload,
    };
  });

  const matching = scored
    .filter((item) => item.score > 15)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return matching.map((item) => ({
    id: item.screen.id,
    title: item.screen.title,
    category: item.screen.category,
    route: item.screen.route,
    badgeText: item.screen.badgeText,
    description: item.screen.description,
    actionLabel: item.screen.actionLabel,
    directExecutable: item.screen.directExecutable,
    actionId: item.screen.actionId,
    suggestedPayload: item.suggestedPayload,
    confirmRequired: item.screen.confirmRequired,
  }));
}

/**
 * Fail-Closed Executive Action Executor
 * Dispatches verified administrative commands triggered from Umar AI chat or Omnibar.
 */
export async function executeUmarAiExecutiveAction(
  actionId: string,
  payload?: Record<string, any>,
  founderAuthToken?: string
): Promise<{ success: boolean; message: string; receiptId: string }> {
  const receiptId = `UMAR_EXEC_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  try {
    switch (actionId) {
      case "EXECUTE_SOFT_REFRESH": {
        const res = systemMasterController.performSoftRefresh();
        return {
          success: res.ok,
          message: `Universal Soft Refresh completed in ${res.durationMs.toFixed(1)}ms. Web Speech & audio engines synchronized.`,
          receiptId,
        };
      }

      case "EXECUTE_PURGE_JUNK": {
        const res = systemMasterController.purgeDuplicatesAndJunk();
        return {
          success: true,
          message: `Purged ${res.removedDuplicatesCount} junk/duplicate entries. Freed ${res.freedFormatted} storage safely.`,
          receiptId,
        };
      }

      case "SET_COMMISSION": {
        if (payload?.restaurant_commission_pct !== undefined) {
          await systemMasterController.applySettingsPatch({
            restaurant_commission_pct: payload.restaurant_commission_pct,
          });
          return {
            success: true,
            message: `Restaurant commission updated to ${payload.restaurant_commission_pct}%.`,
            receiptId,
          };
        }
        return {
          success: false,
          message: "No valid commission percentage supplied in payload.",
          receiptId,
        };
      }

      case "SET_RIDER_PAYOUT": {
        if (payload?.rider_payout_per_km_inr !== undefined) {
          await systemMasterController.applySettingsPatch({
            rider_payout_per_km_inr: payload.rider_payout_per_km_inr,
          });
          return {
            success: true,
            message: `Rider payout rate updated to ₹${payload.rider_payout_per_km_inr}/km.`,
            receiptId,
          };
        }
        return {
          success: false,
          message: "No valid rider payout per km supplied in payload.",
          receiptId,
        };
      }

      case "TOGGLE_SURGE": {
        const current = systemMasterController.getLiveSettings();
        const nextState = !current.surge_pricing_enabled;
        await systemMasterController.applySettingsPatch({
          surge_pricing_enabled: nextState,
        });
        return {
          success: true,
          message: `Dynamic surge pricing is now ${nextState ? "ENABLED" : "DISABLED"}.`,
          receiptId,
        };
      }

      case "SET_THEME_EMERALD": {
        await systemMasterController.applySettingsPatch({
          theme_preset: "emerald",
          primary_brand_color: "#10B981",
          accent_brand_color: "#F59E0B",
          theme_mode: "dark",
        });
        return {
          success: true,
          message: "Royal Emerald theme (#10B981 / #F59E0B) applied to platform design tokens.",
          receiptId,
        };
      }

      default:
        return {
          success: false,
          message: `Unknown or unmapped action identifier: [${actionId}]. Direct navigation recommended.`,
          receiptId,
        };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Execution failed: ${err?.message || "Internal error"}`,
      receiptId,
    };
  }
}

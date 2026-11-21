import type { Permission } from "./permissions";

export type NavItem = {
  id: string;
  path: string;
  i18n: string;
  permission: Permission | Permission[];
  icon:
    | "layout"
    | "sparkles"
    | "radio"
    | "receipt"
    | "bike"
    | "map"
    | "utensils"
    | "users"
    | "user"
    | "shield"
    | "lifeBuoy"
    | "wallet"
    | "scale"
    | "calculator"
    | "percent"
    | "gift"
    | "megaphone"
    | "panels"
    | "chart"
    | "file"
    | "alert"
    | "spark"
    | "id"
    | "palette"
    | "flag"
    | "settings"
    | "bell"
    | "scroll"
    | "activity";
};

export type NavGroup = { id: string; i18n: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    id: "operations",
    i18n: "groups.operations",
    items: [
      { id: "dashboard", path: "/app", i18n: "Overview", permission: "view_analytics", icon: "layout" },
      { id: "orders", path: "/app/orders", i18n: "Orders", permission: "view_orders", icon: "receipt" },
      { id: "restaurants", path: "/app/restaurants", i18n: "Restaurants", permission: "view_restaurants", icon: "utensils" },
      { id: "riders", path: "/app/riders", i18n: "Riders", permission: "view_riders", icon: "bike" },
      { id: "settlements", path: "/app/settlements", i18n: "Payouts", permission: "view_finance", icon: "scale" },
      { id: "support", path: "/app/support", i18n: "Support", permission: "manage_support", icon: "lifeBuoy" },
      { id: "settings", path: "/app/settings", i18n: "Settings", permission: "manage_platform_settings", icon: "settings" },
    ],
  },
];

export function itemAllowed(item: NavItem, perms: readonly string[]): boolean {
  const need = Array.isArray(item.permission) ? item.permission : [item.permission];
  if (perms.includes("view_analytics") && item.id === "dashboard") return true;
  return need.some((p) => perms.includes(p));
}

export type BottomNavOption = {
  id: string;
  subCategory: string;
  label: string;
  description: string;
  to: string;
  hash?: string;
  query?: Record<string, string>;
  badge: string;
};

export type BottomNavCategory = {
  id: string;
  label: string;
  summary: string;
  badge: string;
  options: BottomNavOption[];
};

export type BottomNavHub = {
  id:
    | "orderking_core"
    | "b2b_revenue"
    | "umar_ai_teams"
    | "security_infra"
    | "executive_settings";
  label: string;
  emoji: string;
  badge: string;
  isPrimary?: boolean;
  tagline: string;
  categories: BottomNavCategory[];
};

/** Legacy compatibility export — consolidated into UMAR_OS_10_WORLDS with zero duplicates. */
export const UMAR_OS_BOTTOM_HUBS: BottomNavHub[] = [];

export type BottomNavWorldId =
  | "home"
  | "orderking"
  | "kingpay"
  | "travel_work"
  | "b2b_crm"
  | "umar_ai"
  | "studios"
  | "connectors"
  | "alerts"
  | "settings";

export type BottomNavWorld = {
  id: BottomNavWorldId;
  worldNumber: number;
  label: string;
  shortTitle: string;
  emoji: string;
  badge: string;
  defaultTo: string;
  settingsTo: string;
  isPrimary?: boolean;
  tagline: string;
  categories: BottomNavCategory[];
};

/**
 * Umar OS 10-World Command Directory.
 * Strict zero-duplicate invariant: every operational route appears once in its canonical world.
 */
export const UMAR_OS_10_WORLDS: BottomNavWorld[] = [
  {
    id: "home",
    worldNumber: 1,
    label: "1. Home",
    shortTitle: "Overview & Daily Operations",
    emoji: "HQ",
    badge: "Overview",
    defaultTo: "/app",
    settingsTo: "/app/settings",
    tagline: "Live order telemetry, revenue metrics, rider locations, and executive summaries.",
    categories: [
      {
        id: "home_dashboard",
        label: "Operations Overview",
        summary: "Real-time metrics, rider positions, and daily reports.",
        badge: "Live",
        options: [
          {
            id: "home-pulse",
            subCategory: "Overview",
            label: "Live Dashboard",
            description: "Today's orders, GMV, active restaurants, online riders, and SLA status.",
            to: "/app",
            badge: "Home",
          },
          {
            id: "home-live-map",
            subCategory: "Telemetry",
            label: "Live Rider Map",
            description: "Active order states and GPS telemetry positions.",
            to: "/app/live",
            badge: "Map",
          },
          {
            id: "home-analytics",
            subCategory: "Metrics",
            label: "Order Analytics & CSV",
            description: "Order volume trends and CSV ledger exports.",
            to: "/app/analytics",
            badge: "Analytics",
          },
          {
            id: "home-ceo",
            subCategory: "Executive",
            label: "Executive Summary",
            description: "Unit economics, margin breakdown, and platform summary.",
            to: "/app/ceo",
            badge: "Executive",
          },
          {
            id: "home-reports",
            subCategory: "Exports",
            label: "Operational Reports",
            description: "Scheduled financial, order, and rider CSV/JSON exports.",
            to: "/app/reports",
            badge: "Reports",
          },
        ],
      },
    ],
  },
  {
    id: "orderking",
    worldNumber: 2,
    label: "2. OrderKing",
    shortTitle: "Food Delivery Operations",
    emoji: "OK",
    badge: "Delivery",
    isPrimary: true,
    defaultTo: "/app/orders",
    settingsTo: "/app/settings",
    tagline: "Food delivery orders, dispatch, partner kitchens, menus, riders, and customers.",
    categories: [
      {
        id: "ok_fulfillment",
        label: "Orders & Dispatch",
        summary: "Live order lifecycle, dispatch assignment, delivery zones, and refunds.",
        badge: "Fulfillment",
        options: [
          {
            id: "ok-orders",
            subCategory: "Orders",
            label: "Live Orders Queue",
            description: "Monitor kitchen prep states, pickup handoffs, and delivery SLA timers.",
            to: "/app/orders",
            badge: "Orders",
          },
          {
            id: "ok-dispatch",
            subCategory: "Dispatch",
            label: "Rider Dispatch Board",
            description: "Assign riders, balance zone load, and adjust prep buffers.",
            to: "/app/dispatch",
            badge: "Dispatch",
          },
          {
            id: "ok-zones",
            subCategory: "Serviceability",
            label: "Delivery Zones & Polygons",
            description: "City delivery polygons, service radii, and weather surge rules.",
            to: "/app/zones",
            badge: "Zones",
          },
          {
            id: "ok-refunds",
            subCategory: "Disputes",
            label: "SLA & Refund Desk",
            description: "Deterministic integer-paise customer refunds and claim resolution.",
            to: "/app/refunds",
            badge: "Refunds",
          },
        ],
      },
      {
        id: "ok_partners",
        label: "Restaurants & Catalog",
        summary: "Partner kitchens, menu catalog, KYC verification, and POS printers.",
        badge: "Partners",
        options: [
          {
            id: "ok-restaurants",
            subCategory: "Merchants",
            label: "Restaurant Directory",
            description: "Active partner kitchens, prep-time accuracy, and outlet status.",
            to: "/app/restaurants",
            badge: "Outlets",
          },
          {
            id: "ok-catalog",
            subCategory: "Menus",
            label: "Menu Catalog & Pricing",
            description: "Dish pricing in paise, packaging fees, add-ons, and stockouts.",
            to: "/app/catalog",
            badge: "Catalog",
          },
          {
            id: "ok-kyc",
            subCategory: "Compliance",
            label: "FSSAI & GSTIN Verification",
            description: "14-digit FSSAI FoSCoS licenses, PAN, and bank account verification.",
            to: "/app/kyc",
            badge: "KYC",
          },
          {
            id: "ok-pos",
            subCategory: "Hardware",
            label: "POS & Thermal Printers",
            description: "ESC/POS 58mm/80mm KOT spooler and Soundbox voice alerts.",
            to: "/app/pos-terminals",
            badge: "POS",
          },
        ],
      },
      {
        id: "ok_fleet_customers",
        label: "Riders & Customers",
        summary: "Fleet roster, shift attendance, customer accounts, and support.",
        badge: "Network",
        options: [
          {
            id: "ok-riders",
            subCategory: "Fleet",
            label: "Rider Fleet Roster",
            description: "Active riders, COD float limits (₹1,500 cap), and KYC status.",
            to: "/app/riders",
            badge: "Riders",
          },
          {
            id: "ok-shifts",
            subCategory: "Attendance",
            label: "Rider Shifts & Safety Gates",
            description: "Shift check-ins, battery health (>=15%), and velocity verification.",
            to: "/app/shifts",
            badge: "Shifts",
          },
          {
            id: "ok-customers",
            subCategory: "Accounts",
            label: "Customer Directory",
            description: "Order history, delivery addresses, and account status.",
            to: "/app/customers",
            badge: "Customers",
          },
          {
            id: "ok-support",
            subCategory: "Helpdesk",
            label: "Support Ticket Desk",
            description: "Customer, restaurant, and rider dispute tickets.",
            to: "/app/support",
            badge: "Support",
          },
        ],
      },
    ],
  },
  {
    id: "kingpay",
    worldNumber: 3,
    label: "3. KingPay",
    shortTitle: "Settlements, Ledger & Tax",
    emoji: "KP",
    badge: "Finance",
    defaultTo: "/app/settlements",
    settingsTo: "/app/settings",
    tagline: "Integer-paise double-entry ledger, T+1 payouts, GST/TCS/TDS, and UPI rails.",
    categories: [
      {
        id: "kp_settlements",
        label: "Settlements & Reconciliation",
        summary: "Merchant and rider payouts, reconciliation, and unit economics.",
        badge: "Ledger",
        options: [
          {
            id: "kp-settlements",
            subCategory: "Payouts",
            label: "Merchant & Rider Settlements",
            description: "T+1 payout batches, commission deductions, and bank transfers.",
            to: "/app/settlements",
            badge: "Payouts",
          },
          {
            id: "kp-reconciliation",
            subCategory: "Accounting",
            label: "Double-Entry Reconciliation",
            description: "Verify Sum(Debits) == Sum(Credits) in integer paise.",
            to: "/app/reconciliation",
            badge: "Recon",
          },
          {
            id: "kp-economics",
            subCategory: "Margins",
            label: "Unit Economics Calculator",
            description: "Per-order commission, delivery fee, and net margin calculation.",
            to: "/app/economics",
            badge: "Economics",
          },
        ],
      },
      {
        id: "kp_tax_compliance",
        label: "Tax & Payment Rails",
        summary: "Statutory GSTIN 18AFXPH9838M1Z9 compliance, RBI escrow, and UPI/Razorpay.",
        badge: "Statutory",
        options: [
          {
            id: "kp-tax",
            subCategory: "Taxation",
            label: "GST, TCS & TDS Tax Desk",
            description: "Section 9(5) CGST (5%), Section 52 TCS, Section 194-O TDS, and GSTR exports.",
            to: "/app/tax",
            badge: "Tax",
          },
          {
            id: "kp-rbi",
            subCategory: "Escrow",
            label: "RBI PA/PG & Nodal Escrow",
            description: "Nodal escrow ledger and direct NPCI UPI VPAs (orderking@ybl).",
            to: "/app/rbi-compliance-hub",
            badge: "Escrow",
          },
          {
            id: "kp-connectors",
            subCategory: "Gateways",
            label: "Razorpay & BharatQR Rails",
            description: "Razorpay checkout, webhooks, and dynamic BharatQR routing.",
            to: "/app/fintech-connectors",
            badge: "Rails",
          },
        ],
      },
    ],
  },
  {
    id: "travel_work",
    worldNumber: 4,
    label: "4. Travel & Tutor",
    shortTitle: "Travel, Academic Tutor & Jobs",
    emoji: "TV",
    badge: "Services",
    defaultTo: "/app/travel",
    settingsTo: "/app/settings",
    tagline: "Travelpayouts GDS white-label, IRCTC direct handoff, Gemini academic tutor, and fleet onboarding.",
    categories: [
      {
        id: "tv_verticals",
        label: "Integrated Verticals",
        summary: "Official carrier travel comparison, CBSE/State tutor, and recruitment.",
        badge: "Active",
        options: [
          {
            id: "tv-travel",
            subCategory: "GDS Travel",
            label: "Travel Desk (Travelpayouts & IRCTC)",
            description: "Official carrier fare comparison and ₹0 markup IRCTC handoff.",
            to: "/app/travel",
            badge: "Travel",
          },
          {
            id: "tv-education",
            subCategory: "Academic",
            label: "AI Academic Tutor & Hygiene SOPs",
            description: "Gemini 2.5 Flash curriculum solver metrics and FSSAI training modules.",
            to: "/app/education",
            badge: "Tutor",
          },
          {
            id: "tv-jobs",
            subCategory: "Onboarding",
            label: "Fleet & Kitchen Recruitment",
            description: "Zero-fee delivery partner and kitchen staff onboarding board.",
            to: "/app/jobs",
            badge: "Jobs",
          },
        ],
      },
    ],
  },
  {
    id: "b2b_crm",
    worldNumber: 5,
    label: "5. Growth",
    shortTitle: "Promos, Loyalty & Campaigns",
    emoji: "GR",
    badge: "Growth",
    defaultTo: "/app/promos",
    settingsTo: "/app/settings",
    tagline: "Merchant-funded offers, coupon rules, loyalty points, and customer notifications.",
    categories: [
      {
        id: "gr_campaigns",
        label: "Offers & Retention",
        summary: "Promotions, loyalty ledger, and targeted notifications.",
        badge: "Promos",
        options: [
          {
            id: "gr-promos",
            subCategory: "Discounts",
            label: "Restaurant Promo Campaigns",
            description: "Co-funded merchant discounts and minimum cart rules.",
            to: "/app/promos",
            badge: "Promos",
          },
          {
            id: "gr-marketing",
            subCategory: "Campaigns",
            label: "Platform Coupon Engine",
            description: "Platform-wide coupon codes, usage limits, and budget caps.",
            to: "/app/marketing",
            badge: "Coupons",
          },
          {
            id: "gr-loyalty",
            subCategory: "Rewards",
            label: "King Coins Loyalty Ledger",
            description: "Points earned from completed orders and redemption rules.",
            to: "/app/loyalty",
            badge: "Loyalty",
          },
          {
            id: "gr-notifications",
            subCategory: "Messaging",
            label: "Push & SMS Notifications",
            description: "Operational order alerts via Fast2SMS and web push.",
            to: "/app/notifications",
            badge: "Alerts",
          },
        ],
      },
    ],
  },
  {
    id: "umar_ai",
    worldNumber: 6,
    label: "6. AI Ops",
    shortTitle: "AI Command & Approvals",
    emoji: "AI",
    badge: "AI",
    defaultTo: "/app/ai",
    settingsTo: "/app/settings",
    tagline: "Operational AI assistant and human-in-the-loop approval queue.",
    categories: [
      {
        id: "ai_command",
        label: "AI Operations",
        summary: "Live operational queries and pending admin approvals.",
        badge: "Ops AI",
        options: [
          {
            id: "ai-console",
            subCategory: "Assistant",
            label: "AI Operations Console",
            description: "Query live orders, settlements, and diagnostics.",
            to: "/app/ai",
            badge: "AI",
          },
          {
            id: "ai-approvals",
            subCategory: "Governance",
            label: "Approval Queue",
            description: "Review and approve restaurant KYC, refunds, and payouts.",
            to: "/app/approvals",
            badge: "Approvals",
          },
        ],
      },
    ],
  },
  {
    id: "studios",
    worldNumber: 7,
    label: "7. Design",
    shortTitle: "App Content & Branding",
    emoji: "UI",
    badge: "Design",
    defaultTo: "/app/cms",
    settingsTo: "/app/settings",
    tagline: "Manage storefront banners, app layout sections, and brand tokens.",
    categories: [
      {
        id: "ui_content",
        label: "Storefront & Identity",
        summary: "CMS blocks, app branding, and theme configuration.",
        badge: "CMS",
        options: [
          {
            id: "ui-cms",
            subCategory: "Content",
            label: "Storefront CMS & Banners",
            description: "Manage customer app banners and operational notices.",
            to: "/app/cms",
            badge: "CMS",
          },
          {
            id: "ui-branding",
            subCategory: "Theme",
            label: "Brand Tokens & Visual Studio",
            description: "Configure primary colors, typography, and app identity.",
            to: "/app/branding",
            badge: "Branding",
          },
          {
            id: "ui-brand",
            subCategory: "Assets",
            label: "Brand Assets & Metadata",
            description: "Logos, icons, and statutory business metadata.",
            to: "/app/brand",
            badge: "Assets",
          },
        ],
      },
    ],
  },
  {
    id: "connectors",
    worldNumber: 8,
    label: "8. Systems",
    shortTitle: "Infrastructure & Health",
    emoji: "SYS",
    badge: "Infra",
    defaultTo: "/app/health",
    settingsTo: "/app/settings",
    tagline: "Database pooler status, external APIs, and production readiness checks.",
    categories: [
      {
        id: "sys_health",
        label: "Infrastructure & Registry",
        summary: "PostgreSQL pooler health, verified connectors, and go-live gates.",
        badge: "Health",
        options: [
          {
            id: "sys-health",
            subCategory: "Diagnostics",
            label: "System Health & DB Pooler",
            description: "Supabase PostgreSQL 17.6 latency, API uptime, and worker health.",
            to: "/app/health",
            badge: "Health",
          },
          {
            id: "sys-registry",
            subCategory: "Stack",
            label: "Platform Service Registry",
            description: "Verified active integrations (Supabase, Razorpay, Fast2SMS, Gemini).",
            to: "/app/tech-registry",
            badge: "Registry",
          },
          {
            id: "sys-golive",
            subCategory: "Readiness",
            label: "Production Go-Live Checklist",
            description: "Verify env keys, migrations, DNS, and security gates.",
            to: "/app/golive",
            badge: "Go-Live",
          },
        ],
      },
    ],
  },
  {
    id: "alerts",
    worldNumber: 9,
    label: "9. Security",
    shortTitle: "Incidents, Fraud & Audit",
    emoji: "SEC",
    badge: "Security",
    defaultTo: "/app/incidents",
    settingsTo: "/app/settings",
    tagline: "Incident triage, anti-fraud controls, and append-only forensic audit logs.",
    categories: [
      {
        id: "sec_ops",
        label: "Security & Risk",
        summary: "CERT-In incident response, fraud rules, and immutable audit trail.",
        badge: "Shield",
        options: [
          {
            id: "sec-incidents",
            subCategory: "Incidents",
            label: "Incident Triage & SOS Desk",
            description: "6-tier incident severity tracking and rider 112/108 SOS alerts.",
            to: "/app/incidents",
            badge: "Incidents",
          },
          {
            id: "sec-fraud",
            subCategory: "Risk",
            label: "Anti-Fraud Shield",
            description: "GPS velocity checks (<120 km/h), COD limits, and duplicate claim flags.",
            to: "/app/fraud",
            badge: "Fraud",
          },
          {
            id: "sec-audit",
            subCategory: "Forensics",
            label: "Immutable Audit Trail",
            description: "Append-only log of all administrative and financial mutations.",
            to: "/app/audit",
            badge: "Audit",
          },
        ],
      },
    ],
  },
  {
    id: "settings",
    worldNumber: 10,
    label: "10. Settings",
    shortTitle: "Platform Rules, Flags & Staff",
    emoji: "SET",
    badge: "Settings",
    defaultTo: "/app/settings",
    settingsTo: "/app/settings",
    tagline: "Commission rules, delivery fees, feature switches, staff accounts, and RBAC.",
    categories: [
      {
        id: "set_core",
        label: "Configuration & Access",
        summary: "Fee schedules, feature flags, employees, and role permissions.",
        badge: "Config",
        options: [
          {
            id: "set-platform",
            subCategory: "Rules",
            label: "Platform Settings & Fee Rules",
            description: "Commission rates, base delivery fees, surge, and SLA timers.",
            to: "/app/settings",
            badge: "Settings",
          },
          {
            id: "set-flags",
            subCategory: "Switches",
            label: "Feature Switches & Kill-Switches",
            description: "Enable or disable checkout, COD, tracking, and module switches.",
            to: "/app/flags",
            badge: "Flags",
          },
          {
            id: "set-employees",
            subCategory: "Team",
            label: "Employees & Accounts",
            description: "Manage staff access, city assignments, and active sessions.",
            to: "/app/employees",
            badge: "Staff",
          },
          {
            id: "set-roles",
            subCategory: "RBAC",
            label: "Roles & Permissions Matrix",
            description: "Fail-closed role permission definitions across Umar OS.",
            to: "/app/roles",
            badge: "RBAC",
          },
        ],
      },
    ],
  },
];

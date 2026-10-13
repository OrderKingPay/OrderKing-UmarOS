import type { Permission } from "./permissions";

export type NavItem = {
  id: string;
  path: string;
  i18n: string;
  permission: Permission | Permission[];
  icon:
    | "layout"
    | "crown"
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
    id: "today",
    i18n: "groups.today",
    items: [{ id: "dashboard", path: "/app", i18n: "nav.dashboard", permission: "view_analytics", icon: "layout" }],
  },
  {
    id: "executive",
    i18n: "groups.executive",
    items: [
      { id: "ceo", path: "/app/ceo", i18n: "nav.ceo", permission: "access_CEO_dashboard", icon: "crown" },
      { id: "founder-command", path: "/app/founder-command", i18n: "nav.founderCommand", permission: "access_CEO_dashboard", icon: "spark" },
      { id: "approvals", path: "/app/approvals", i18n: "nav.approvals", permission: "manage_ai_workforce", icon: "shield" },
      { id: "education", path: "/app/education", i18n: "nav.education", permission: "access_CEO_dashboard", icon: "spark" },
    ],
  },
  {
    id: "operations",
    i18n: "groups.operations",
    items: [
      { id: "live", path: "/app/live", i18n: "nav.live", permission: "view_orders", icon: "radio" },
      { id: "orders", path: "/app/orders", i18n: "nav.orders", permission: "view_orders", icon: "receipt" },
      { id: "dispatch", path: "/app/dispatch", i18n: "nav.dispatch", permission: "view_orders", icon: "bike" },
      { id: "zones", path: "/app/zones", i18n: "nav.zones", permission: "manage_delivery_zones", icon: "map" },
    ],
  },
  {
    id: "network",
    i18n: "groups.network",
    items: [
      { id: "restaurants", path: "/app/restaurants", i18n: "nav.restaurants", permission: "view_restaurants", icon: "utensils" },
      { id: "riders", path: "/app/riders", i18n: "nav.riders", permission: "view_riders", icon: "bike" },
      { id: "customers", path: "/app/customers", i18n: "nav.customers", permission: "view_customers", icon: "users" },
      { id: "kyc", path: "/app/kyc", i18n: "nav.kyc", permission: "view_kyc", icon: "shield" },
    ],
  },
  {
    id: "support",
    i18n: "groups.support",
    items: [{ id: "support", path: "/app/support", i18n: "nav.support", permission: "manage_support", icon: "lifeBuoy" }],
  },
  {
    id: "finance",
    i18n: "groups.finance",
    items: [
      { id: "finance", path: "/app/finance", i18n: "nav.finance", permission: "view_finance", icon: "wallet" },
      { id: "settlements", path: "/app/settlements", i18n: "nav.settlements", permission: "view_finance", icon: "scale" },
      { id: "economics", path: "/app/economics", i18n: "nav.economics", permission: "view_finance", icon: "calculator" },
    ],
  },
  {
    id: "growth",
    i18n: "groups.growth",
    items: [
      { id: "promotions", path: "/app/promotions", i18n: "nav.promotions", permission: "manage_promotions", icon: "percent" },
      { id: "loyalty", path: "/app/loyalty", i18n: "nav.loyalty", permission: "manage_promotions", icon: "gift" },
      { id: "marketing", path: "/app/marketing", i18n: "nav.marketing", permission: "manage_cms", icon: "megaphone" },
      { id: "cms", path: "/app/cms", i18n: "nav.cms", permission: "manage_cms", icon: "panels" },
    ],
  },
  {
    id: "intelligence",
    i18n: "groups.intelligence",
    items: [
      { id: "analytics", path: "/app/analytics", i18n: "nav.analytics", permission: "view_analytics", icon: "chart" },
      { id: "reports", path: "/app/reports", i18n: "nav.reports", permission: "view_analytics", icon: "file" },
      { id: "risk", path: "/app/risk", i18n: "nav.risk", permission: "view_risk", icon: "alert" },
      { id: "ai", path: "/app/ai", i18n: "nav.ai", permission: "access_AI", icon: "spark" },
    ],
  },
  {
    id: "kingpay",
    i18n: "groups.kingpay",
    items: [
      { id: "travel", path: "/app/travel", i18n: "nav.travel", permission: "view_finance", icon: "map" },
    ],
  },
  {
    id: "advertising",
    i18n: "Advertising",
    items: [
      { id: "telecom-arbitrage", path: "/app/telecom-arbitrage", i18n: "Telecom Arbitrage", permission: "manage_cms", icon: "radio" },
      { id: "jio-airtel", path: "/app/jio-airtel", i18n: "Jio/Airtel Ad Network", permission: "manage_cms", icon: "radio" },
      { id: "meta-dm", path: "/app/meta-dm", i18n: "Meta DM Blasts", permission: "manage_cms", icon: "megaphone" },
      { id: "wifi-interception", path: "/app/wifi-interception", i18n: "Wi-Fi Interception", permission: "manage_cms", icon: "shield" },
      { id: "oem-lockscreen", path: "/app/oem-lockscreen", i18n: "OEM Lock Screen", permission: "manage_cms", icon: "panels" }
    ],
  },
  {
    id: 'banking', 
    i18n: 'Banking Infrastructure', 
    items: [
      { id: 'fintech-connectors', path: '/app/fintech-connectors', i18n: 'API Gateways', permission: 'manage_platform_settings', icon: 'wallet' },
      { id: 'baas-hijack-hub', path: '/app/baas-hijack-hub', i18n: 'BaaS White-Label Hub', permission: 'manage_platform_settings', icon: 'shield' },
      { id: 'rbi-compliance-hub', path: '/app/rbi-compliance-hub', i18n: 'RBI Compliance Hub', permission: 'manage_platform_settings', icon: 'shield' },
      { id: 'pos-terminals', path: '/app/pos-terminals', i18n: 'POS Terminals', permission: 'manage_platform_settings', icon: 'calculator' }
    ]
  }, { id: "system",
    i18n: "groups.system",
    items: [
      { id: "employees", path: "/app/employees", i18n: "nav.employees", permission: "manage_users", icon: "id" },
      { id: "branding", path: "/app/branding", i18n: "nav.branding", permission: "manage_branding", icon: "palette" },
      { id: "flags", path: "/app/flags", i18n: "nav.flags", permission: "manage_feature_flags", icon: "flag" },
      { id: "settings", path: "/app/settings", i18n: "nav.settings", permission: "manage_platform_settings", icon: "settings" },
      { id: "golive", path: "/app/golive", i18n: "nav.golive", permission: "manage_platform_settings", icon: "activity" },
      { id: "notifications", path: "/app/notifications", i18n: "nav.notifications", permission: "manage_notifications", icon: "bell" },
      { id: "audit", path: "/app/audit", i18n: "nav.audit", permission: "view_audit_logs", icon: "scroll" },
      { id: "health", path: "/app/health", i18n: "nav.health", permission: "view_analytics", icon: "activity" },
      { id: "tech-registry", path: "/app/tech-registry", i18n: "Tech Registry", permission: "view_analytics", icon: "spark" },
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

export const UMAR_OS_BOTTOM_HUBS: BottomNavHub[] = [
  {
    id: "orderking_core",
    label: "OrderKing Core",
    emoji: "👑",
    badge: "8 Platforms",
    isPrimary: true,
    tagline:
      "Primary 8-Platform Marketplace Operations: Delivery, Restaurants, Riders, Customers, Tutor & Jobs, King Pay, Crown Wallet & Travel",
    categories: [
      {
        id: "delivery",
        label: "Delivery",
        summary: "Live order fulfillment, dispatch routing, polygon geofencing, and SLA dispute refunds.",
        badge: "Live Ops",
        options: [
          {
            id: "del-orders",
            subCategory: "Order Fulfillment",
            label: "Live Order Stream & SLA Monitor",
            description: "Real-time kitchen prep states, pickup handoffs, and delivery SLA tracking.",
            to: "/app/orders",
            query: { view: "live" },
            badge: "SLA Active",
          },
          {
            id: "del-dispatch",
            subCategory: "Dispatch Routing",
            label: "Fleet Dispatch & Prep Buffer Engine",
            description: "Assign riders, balance zone load, and apply rain/dinner peak prep buffers.",
            to: "/app/dispatch",
            query: { mode: "auto-balance" },
            badge: "Dispatch",
          },
          {
            id: "del-zones",
            subCategory: "Geofencing",
            label: "Polygon Delivery Zones & Surge Rules",
            description: "Configure city delivery polygons, serviceability radii, and weather surge rules.",
            to: "/app/zones",
            query: { layer: "polygons" },
            badge: "Geofence",
          },
          {
            id: "del-refunds",
            subCategory: "Dispute Resolution",
            label: "Delivery SLA Breach & Refund Desk",
            description: "Deterministic integer-paise customer refunds and spillage claim verification.",
            to: "/app/refunds",
            query: { filter: "sla-breach" },
            badge: "Refunds",
          },
        ],
      },
      {
        id: "restaurants",
        label: "Restaurants",
        summary: "Restaurant partner onboarding, 14-digit FSSAI compliance, catalog studio, and promos.",
        badge: "Merchants",
        options: [
          {
            id: "rest-directory",
            subCategory: "Partner Network",
            label: "Restaurant Directory & Outlet Health",
            description: "Manage active partner kitchens, prep-time accuracy, and outlet availability.",
            to: "/app/restaurants",
            query: { status: "active" },
            badge: "Outlets",
          },
          {
            id: "rest-catalog",
            subCategory: "Menu Engineering",
            label: "Menu Catalog, Variants & Dish Studio",
            description: "Manage item pricing in paise, packaging charges, add-on groups, and 4:3 dish media.",
            to: "/app/catalog",
            query: { studio: "4x3" },
            badge: "Catalog",
          },
          {
            id: "rest-kyc",
            subCategory: "Statutory KYC",
            label: "FSSAI 14-Digit FoSCoS & GSTIN Verification",
            description: "Verify mandatory 14-digit FSSAI licenses (Food Safety Act 2006) and bank accounts.",
            to: "/app/kyc",
            query: { check: "fssai-14" },
            badge: "FSSAI Act",
          },
          {
            id: "rest-promos",
            subCategory: "Merchant Growth",
            label: "Partner Co-Funded Promotional Campaigns",
            description: "Configure restaurant discount slabs, happy-hour offers, and visibility boosts.",
            to: "/app/promos",
            query: { scope: "merchant" },
            badge: "Promos",
          },
        ],
      },
      {
        id: "riders",
        label: "Riders",
        summary: "Delivery partner fleet roster, shift scheduling, waiting compensation, and gig welfare.",
        badge: "Fleet",
        options: [
          {
            id: "rider-roster",
            subCategory: "Fleet Directory",
            label: "Delivery Partner Roster & Telemetry",
            description: "View active delivery partners, vehicle type (EV/Bike), and zone assignments.",
            to: "/app/riders",
            query: { status: "verified" },
            badge: "Fleet",
          },
          {
            id: "rider-shifts",
            subCategory: "Shift & Welfare",
            label: "Shift Roster & Code on Social Security 2020",
            description: "Manage gig shift bookings, rest-break guardrails, and accidental insurance coverage.",
            to: "/app/shifts",
            query: { act: "social-security-2020" },
            badge: "CoSS 2020",
          },
          {
            id: "rider-dispatch",
            subCategory: "Live Assignment",
            label: "Zone Dispatch & Merchant Wait-Time Guard",
            description: "Monitor kitchen handoff delays and automated rider wait-time payouts.",
            to: "/app/dispatch",
            query: { view: "rider-wait" },
            badge: "Live",
          },
          {
            id: "rider-kyc",
            subCategory: "Partner Compliance",
            label: "Driving License, RC & Background KYC",
            description: "Verify rider identity documents, vehicle registration, and bank payout rails.",
            to: "/app/kyc",
            query: { entity: "rider" },
            badge: "KYC",
          },
        ],
      },
      {
        id: "customers",
        label: "Customers",
        summary: "Customer CRM, omnichannel grievance redressal, instant refunds, and retention campaigns.",
        badge: "Consumer",
        options: [
          {
            id: "cust-crm",
            subCategory: "Customer Directory",
            label: "Customer Accounts & Order Ledger",
            description: "Inspect verified customer profiles, lifetime order frequency, and saved addresses.",
            to: "/app/customers",
            query: { segment: "all" },
            badge: "CRM",
          },
          {
            id: "cust-support",
            subCategory: "Grievance Desk",
            label: "Omnichannel Support & Escalation Queue",
            description: "Consumer Protection (E-Commerce) Rules compliant ticket resolution and SLA tracking.",
            to: "/app/support",
            query: { queue: "priority" },
            badge: "Support",
          },
          {
            id: "cust-refunds",
            subCategory: "Refund Processing",
            label: "Instant Refund & Credit Note Ledger",
            description: "Issue traceable integer-paise refunds to source UPI/Card or customer wallet.",
            to: "/app/refunds",
            query: { mode: "instant" },
            badge: "Paise Ledger",
          },
          {
            id: "cust-marketing",
            subCategory: "Lifecycle Growth",
            label: "Segmented Customer Retention Campaigns",
            description: "Orchestrate opt-in push, WhatsApp, and regional festival dining campaigns.",
            to: "/app/marketing",
            query: { channel: "push" },
            badge: "Growth",
          },
        ],
      },
      {
        id: "tutor_jobs",
        label: "Tutor & Jobs",
        summary: "Partner skill certification, culinary hygiene modules, and gig/operations recruitment.",
        badge: "Workforce",
        options: [
          {
            id: "tj-riders",
            subCategory: "Fleet Recruitment",
            label: "Delivery Partner Onboarding & Job Board",
            description: "Manage city-wise rider hiring pipelines, safety modules, and onboarding cohorts.",
            to: "/app/riders",
            query: { tab: "recruitment" },
            badge: "Hiring",
          },
          {
            id: "tj-restaurants",
            subCategory: "Culinary Academy",
            label: "Kitchen Hygiene & Packaging SOP Tutor",
            description: "FSSAI hygiene certification modules and packaging quality training for kitchens.",
            to: "/app/restaurants",
            query: { tab: "training" },
            badge: "SOPs",
          },
          {
            id: "tj-shifts",
            subCategory: "Vocational Shifts",
            label: "Part-Time & Student Gig Slot Allocation",
            description: "Flexible slot scheduling and skill-tier incentives for certified partners.",
            to: "/app/shifts",
            query: { tier: "certified" },
            badge: "Slots",
          },
          {
            id: "tj-support",
            subCategory: "Support QA Academy",
            label: "Support Specialist Training & Playbooks",
            description: "Standardized resolution playbooks and empathy coaching for support agents.",
            to: "/app/support",
            query: { tab: "qa-training" },
            badge: "Academy",
          },
        ],
      },
      {
        id: "king_pay",
        label: "King Pay",
        summary: "Integer-paise payment gateway routing, NEFT/IMPS merchant settlements, and promo rails.",
        badge: "Fintech Rail",
        options: [
          {
            id: "kp-settlements",
            subCategory: "Merchant Payouts",
            label: "Integer-Paise Settlement Batches",
            description: "Execute verified T+2/Weekly restaurant payouts with bank reference reconciliation.",
            to: "/app/settlements",
            query: { rail: "neft-imps" },
            badge: "Integer Paise",
          },
          {
            id: "kp-settings",
            subCategory: "Gateway Routing",
            label: "UPI, Razorpay & Cashfree Rail Settings",
            description: "Configure payment gateway webhooks, HMAC secrets, and failover routing rules.",
            to: "/app/settings",
            query: { section: "gateways" },
            badge: "RBI PA/PG",
          },
          {
            id: "kp-refunds",
            subCategory: "Settlement Reversals",
            label: "Automated Refund & Chargeback Ledger",
            description: "Track payment gateway refund acknowledgements and dispute adjustments.",
            to: "/app/refunds",
            query: { rail: "kingpay" },
            badge: "Reversals",
          },
          {
            id: "kp-promos",
            subCategory: "Payment Offers",
            label: "UPI & Bank Co-Branded Instant Discounts",
            description: "Manage cart-level payment method discount rules and voucher redemptions.",
            to: "/app/promos",
            query: { rail: "kingpay" },
            badge: "Offers",
          },
        ],
      },
      {
        id: "crown_wallet",
        label: "Crown Wallet",
        summary: "Crown membership rewards, closed-loop customer credits, and loyalty tier governance.",
        badge: "Loyalty",
        options: [
          {
            id: "cw-loyalty",
            subCategory: "Membership Tiers",
            label: "Crown Loyalty Tiers & Free-Delivery Rules",
            description: "Configure Crown membership benefits, reward accrual rates, and renewal rules.",
            to: "/app/loyalty",
            query: { tier: "crown" },
            badge: "Crown Tier",
          },
          {
            id: "cw-customers",
            subCategory: "Wallet Balances",
            label: "Customer Crown Wallet Credit Ledger",
            description: "Audit customer promotional credits, refund top-ups, and redemption logs.",
            to: "/app/customers",
            query: { view: "wallet-ledger" },
            badge: "Ledger",
          },
          {
            id: "cw-marketing",
            subCategory: "VIP Retention",
            label: "Crown Member Exclusive Dining Campaigns",
            description: "Run targeted high-frequency diner rewards and partner milestone campaigns.",
            to: "/app/marketing",
            query: { program: "crown-wallet" },
            badge: "VIP",
          },
          {
            id: "cw-settlements",
            subCategory: "Liability Accounting",
            label: "Loyalty Point Liability & Settlement Desk",
            description: "Reconcile redeemed Crown credits against platform and merchant co-funding.",
            to: "/app/settlements",
            query: { book: "wallet-escrow" },
            badge: "Reconciled",
          },
        ],
      },
      {
        id: "travel",
        label: "Travel",
        summary: "Transit hub food delivery, highway dining corridors, and station/airport zone dispatch.",
        badge: "Transit Ops",
        options: [
          {
            id: "trv-zones",
            subCategory: "Transit Hubs",
            label: "Railway, Airport & Highway Zone Mapping",
            description: "Manage pickup points and scheduled delivery polygons across transit corridors.",
            to: "/app/zones",
            query: { type: "highway-hub" },
            badge: "Corridors",
          },
          {
            id: "trv-orders",
            subCategory: "Scheduled Pre-Orders",
            label: "Transit Pre-Order Queue & Handoff SLA",
            description: "Track scheduled passenger meal orders with strict arrival-window SLAs.",
            to: "/app/orders",
            query: { vertical: "travel" },
            badge: "Pre-Order",
          },
          {
            id: "trv-settlements",
            subCategory: "Transit Settlements",
            label: "Transit Partner & Lounge Payouts",
            description: "Settle highway dhabas, station kitchens, and transit partner commissions.",
            to: "/app/settlements",
            query: { vertical: "travel" },
            badge: "Payouts",
          },
          {
            id: "trv-support",
            subCategory: "Traveler Desk",
            label: "24x7 Transit Traveler Support Escalations",
            description: "Priority resolution desk for delayed transit deliveries and route changes.",
            to: "/app/support",
            query: { vertical: "travel" },
            badge: "24x7 SLA",
          },
        ],
      },
    ],
  },
  {
    id: "b2b_revenue",
    label: "B2B & Revenue",
    emoji: "💼",
    badge: "Sales & Profit",
    tagline:
      "B2B SaaS Enterprise Sales Desk, 15-Stage CRM Pipeline, Statutory GST/TDS Invoices & Integer-Paise Profit Reconciliation",
    categories: [
      {
        id: "b2b_sales_desk",
        label: "B2B SaaS Sales Desk",
        summary: "Enterprise restaurant chains, cloud-kitchen groups, and regional franchise onboarding.",
        badge: "B2B SaaS",
        options: [
          {
            id: "b2b-deck",
            subCategory: "Enterprise Sales",
            label: "B2B Sales Deck & Franchise Onboarding",
            description: "Launch commercial SaaS proposals, territory licensing, and enterprise onboarding.",
            to: "/app",
            hash: "b2b-sales-desk",
            badge: "Enterprise",
          },
          {
            id: "b2b-franchise-settlements",
            subCategory: "Franchise Royalties",
            label: "Franchise Territory Revenue Share Desk",
            description: "Manage city franchise commission splits and automated royalty settlements.",
            to: "/app/settlements",
            query: { desk: "franchise" },
            badge: "Royalties",
          },
          {
            id: "b2b-saas-reports",
            subCategory: "SaaS Metrics",
            label: "Enterprise ARR, Churn & Cohort Reports",
            description: "Track B2B subscription billings, active kitchen seats, and expansion revenue.",
            to: "/app/reports",
            query: { type: "b2b-saas" },
            badge: "ARR / MRR",
          },
        ],
      },
      {
        id: "crm_pipeline_15",
        label: "15-Stage CRM Pipeline",
        summary: "End-to-end 15-stage merchant acquisition from lead capture to FSSAI verification and go-live.",
        badge: "15 Stages",
        options: [
          {
            id: "crm-15-board",
            subCategory: "Pipeline Command",
            label: "15-Stage Enterprise CRM Deal Board",
            description: "Track merchant prospects across all 15 commercial, KYC, and menu-seeding stages.",
            to: "/app",
            hash: "crm-15-stage",
            badge: "15 Stages",
          },
          {
            id: "crm-funnel-reports",
            subCategory: "Conversion Analytics",
            label: "Stage-by-Stage Velocity & Drop-Off Report",
            description: "Analyze lead-to-live turnaround times and territory sales rep conversion rates.",
            to: "/app/reports",
            query: { funnel: "15-stage-crm" },
            badge: "Funnel",
          },
          {
            id: "crm-contract-recon",
            subCategory: "Commercial Onboarding",
            label: "Commission Rate & Onboarding Fee Audit",
            description: "Verify signed merchant take-rate slabs against live billing configuration.",
            to: "/app/reconciliation",
            query: { stage: "contract-kyc" },
            badge: "Verified",
          },
        ],
      },
      {
        id: "contracts_gst_invoices",
        label: "Contracts & GST Invoices",
        summary: "Indian statutory tax compliance: CGST Sec 9(5), TCS Sec 52, and Income Tax TDS Sec 194-O.",
        badge: "GST / TDS",
        options: [
          {
            id: "gst-sec-9-5",
            subCategory: "Statutory Tax Engine",
            label: "CGST Sec 9(5), TCS Sec 52 & TDS 194-O Desk",
            description: "Deterministic 5% ECO restaurant GST, 0.5% net TCS, and 0.1% Sec 194-O TDS ledger.",
            to: "/app/tax",
            query: { section: "9-5-194o" },
            badge: "Statutory",
          },
          {
            id: "gst-einvoice-reports",
            subCategory: "GSTR Filings",
            label: "Monthly GSTR-1 / GSTR-3B & Tax Invoices",
            description: "Export HSN/SAC 996331 compliant tax invoices and merchant TDS certificates.",
            to: "/app/reports",
            query: { report: "gstr-einvoice" },
            badge: "GSTN",
          },
          {
            id: "gst-contract-settlements",
            subCategory: "Merchant Statements",
            label: "Tax-Deducted Settlement Advice Statements",
            description: "Review itemized order commission, packaging GST, and statutory deductions.",
            to: "/app/settlements",
            query: { view: "tax-advice" },
            badge: "Statements",
          },
        ],
      },
      {
        id: "revenue_profit",
        label: "Revenue and Profit",
        summary: "Double-entry integer-paise ledger reconciliation, net take-rate, and contribution margin.",
        badge: "Paise Ledger",
        options: [
          {
            id: "rev-reconciliation",
            subCategory: "Double-Entry Audit",
            label: "Gateway-to-Payout Paise Reconciliation",
            description: "Zero-discrepancy reconciliation between PG collections, refunds, and payouts.",
            to: "/app/reconciliation",
            query: { precision: "paise" },
            badge: "Reconciled",
          },
          {
            id: "rev-settlements",
            subCategory: "Platform Take-Rate",
            label: "Net Commission & Delivery Fee Realization",
            description: "Inspect realized platform revenue per order after rider payouts and promos.",
            to: "/app/settlements",
            query: { view: "take-rate" },
            badge: "Net Margin",
          },
          {
            id: "rev-pnl-reports",
            subCategory: "Financial Reporting",
            label: "City & Zone Contribution P&L Statements",
            description: "Download audit-ready revenue, cost-of-delivery, and EBITDA margin reports.",
            to: "/app/reports",
            query: { view: "unit-economics" },
            badge: "P&L",
          },
          {
            id: "rev-tax-liability",
            subCategory: "Tax Escrow",
            label: "Statutory Tax Payable & Challan Ledger",
            description: "Track collected CGST/SGST and TDS liabilities prior to treasury remittance.",
            to: "/app/tax",
            query: { view: "withholding" },
            badge: "Treasury",
          },
        ],
      },
    ],
  },
  {
    id: "umar_ai_teams",
    label: "UMAR AI & Teams",
    emoji: "🤖",
    badge: "16 Depts",
    tagline:
      "Sovereign UMAR AI Command, 16 Specialist Departments, Role-Based Access Governance & Plugin Connectors",
    categories: [
      {
        id: "umar_ai_command",
        label: "UMAR AI Command",
        summary: "Sovereign AI copilot, deterministic operations triage, and token budget governance.",
        badge: "AI Core",
        options: [
          {
            id: "ai-console",
            subCategory: "Sovereign Copilot",
            label: "UMAR AI Operations & Analytics Console",
            description: "Query live order bottlenecks, settlement anomalies, and partner health via AI.",
            to: "/app/ai",
            query: { mode: "command" },
            badge: "UMAR AI",
          },
          {
            id: "ai-governance",
            subCategory: "Model Governance",
            label: "Model Routing, Guardrails & Audit Logs",
            description: "Configure human-in-the-loop approval thresholds and deterministic tool policies.",
            to: "/app/ai",
            query: { tab: "routing-governance" },
            badge: "Guardrails",
          },
          {
            id: "ai-exec-brief",
            subCategory: "Founder Synthesis",
            label: "Daily Executive Briefing & Action Queue",
            description: "Synthesized cross-department operational priorities on the main command deck.",
            to: "/app",
            hash: "ai-executive-brief",
            badge: "Briefing",
          },
        ],
      },
      {
        id: "specialist_teams",
        label: "Specialist Teams & Workforce",
        summary: "16 specialized operational departments, employee directory, and RBAC role permissions.",
        badge: "16 Depts",
        options: [
          {
            id: "team-employees",
            subCategory: "16 Departments",
            label: "Employee Directory & Department Pods",
            description: "Manage operators across Dispatch, KYC, Finance, Support, Trust & Safety, and Growth.",
            to: "/app/employees",
            query: { view: "departments" },
            badge: "16 Depts",
          },
          {
            id: "team-roles",
            subCategory: "Access Control",
            label: "RBAC Role Matrix & Least-Privilege Policy",
            description: "Configure granular permissions and role-preview boundaries across all modules.",
            to: "/app/roles",
            query: { mode: "rbac-matrix" },
            badge: "RBAC",
          },
          {
            id: "team-provisioning",
            subCategory: "Operator Onboarding",
            label: "Staff Invitations & Session Governance",
            description: "Approve pending staff invitations, enforce MFA, and audit assumed-role sessions.",
            to: "/app/employees",
            query: { action: "provision" },
            badge: "IAM",
          },
        ],
      },
      {
        id: "plugins_connectors",
        label: "Plugins and Connectors",
        summary: "Verified external integrations for payments, maps, SMS/WhatsApp, and statutory APIs.",
        badge: "Connectors",
        options: [
          {
            id: "conn-registry",
            subCategory: "Integration Hub",
            label: "PluginConnectors & Capability Registry",
            description: "Inspect active connectors for Razorpay, Cashfree, FoSCoS, GSTN, and map routing.",
            to: "/app",
            hash: "plugin-connectors",
            badge: "Registry",
          },
          {
            id: "conn-ai-tools",
            subCategory: "AI Tool Bindings",
            label: "Verified AI Agent Connector Bindings",
            description: "Control which database and webhook connectors AI workflows are permitted to invoke.",
            to: "/app/ai",
            query: { tab: "integrations" },
            badge: "Scoped",
          },
          {
            id: "conn-role-scopes",
            subCategory: "Connector Security",
            label: "Role-Scoped API & Webhook Permissions",
            description: "Restrict connector key rotation and webhook replay permissions to authorized roles.",
            to: "/app/roles",
            query: { scope: "connectors" },
            badge: "Security",
          },
        ],
      },
      {
        id: "autonomous_workflows",
        label: "Autonomous Workflows",
        summary: "Zero-harassment self-healing workflows for SLA buffers, KYC checks, and ledger audits.",
        badge: "Automation",
        options: [
          {
            id: "wf-self-healing",
            subCategory: "Zero-Harassment Ops",
            label: "Autonomous Self-Healing Playbooks",
            description: "Automated rain-buffer activation, stuck-order pings, and webhook retry pipelines.",
            to: "/app/ai",
            query: { tab: "workflows" },
            badge: "Self-Healing",
          },
          {
            id: "wf-dept-escalation",
            subCategory: "SLA Routing",
            label: "16-Department Automated Escalation Rules",
            description: "Route unresolved P1/P2 operational tickets directly to the owning specialist pod.",
            to: "/app/employees",
            query: { view: "sla-workflows" },
            badge: "Auto-Triage",
          },
          {
            id: "wf-capability-deck",
            subCategory: "Execution Engine",
            label: "Capability Registry & Runbook Matrix",
            description: "Review verified automation runbooks and execution telemetry on the command deck.",
            to: "/app",
            hash: "capability-registry",
            badge: "Runbooks",
          },
        ],
      },
    ],
  },
  {
    id: "security_infra",
    label: "Security & Infra",
    emoji: "🛡️",
    badge: "Red/Blue",
    tagline:
      "6-Tier Incident Response, Red/Blue Team Fraud Shield, ACID Ledger Health, Go-Live Gates & Immutable Audit Logs",
    categories: [
      {
        id: "incidents_6_tier",
        label: "Notifications and Incidents (6-Tier)",
        summary: "6-Tier severity incident command (EMERGENCY to LOW) and CERT-In statutory compliance.",
        badge: "6-Tier",
        options: [
          {
            id: "sec-incidents",
            subCategory: "Incident Command",
            label: "6-Tier Incident Response & Root-Cause Desk",
            description: "Triage EMERGENCY, DANGER, CRITICAL, HIGH, MEDIUM, and LOW operational incidents.",
            to: "/app/incidents",
            query: { tier: "all" },
            badge: "6-Tier",
          },
          {
            id: "sec-cert-in",
            subCategory: "Statutory Reporting",
            label: "CERT-In 6-Hour Cyber Incident Readiness",
            description: "IT Act 2000 & CERT-In compliant incident timeline logging and forensic export.",
            to: "/app/incidents",
            query: { compliance: "cert-in" },
            badge: "IT Act 2000",
          },
          {
            id: "sec-telemetry",
            subCategory: "Realtime Watchdog",
            label: "Service Uptime & Latency Watchdog",
            description: "Monitor API p95 latency, worker queue depth, and error rates across endpoints.",
            to: "/app/health",
            query: { view: "telemetry" },
            badge: "Watchdog",
          },
        ],
      },
      {
        id: "security_red_team",
        label: "Security & Red-Team Shield",
        summary: "Collusion prevention, promo abuse velocity shields, and Red/Blue team posture controls.",
        badge: "Red/Blue",
        options: [
          {
            id: "sec-fraud-shield",
            subCategory: "Anti-Fraud Engine",
            label: "Refund Abuse, Promo Velocity & GPS Spoof Shield",
            description: "Detect anomalous refund claims, duplicate device fingerprints, and collusion rings.",
            to: "/app/fraud",
            query: { mode: "velocity-shield" },
            badge: "Anti-Fraud",
          },
          {
            id: "sec-red-blue",
            subCategory: "Defensive Posture",
            label: "Red-Team / Blue-Team Posture & WAF Rules",
            description: "Inspect rate-limiting rules, SQLi/XSS defenses, and zero-trust session boundaries.",
            to: "/app/fraud",
            query: { tab: "red-blue-shield" },
            badge: "Zero-Trust",
          },
          {
            id: "sec-containment",
            subCategory: "Threat Response",
            label: "Active Security Incident Containment",
            description: "Isolate compromised credentials, revoke tokens, and lock suspicious payout accounts.",
            to: "/app/incidents",
            query: { filter: "security" },
            badge: "Containment",
          },
        ],
      },
      {
        id: "database_ledger",
        label: "Database & Ledger",
        summary: "PostgreSQL ACID cluster health, connection pooling, and immutable paise ledger verification.",
        badge: "ACID DB",
        options: [
          {
            id: "db-cluster-health",
            subCategory: "Database Telemetry",
            label: "PostgreSQL Cluster, Pool & Migration Health",
            description: "Verify primary/replica connectivity, Drizzle schema parity, and query performance.",
            to: "/app/health",
            query: { subsystem: "database" },
            badge: "PostgreSQL",
          },
          {
            id: "db-ledger-audit",
            subCategory: "Ledger Integrity",
            label: "Immutable Double-Entry Ledger Checksum",
            description: "Verify that all order debits, tax withholdings, and payouts balance to zero paise.",
            to: "/app/audit",
            query: { scope: "ledger-integrity" },
            badge: "Double-Entry",
          },
          {
            id: "db-pitr-backups",
            subCategory: "Disaster Recovery",
            label: "Point-in-Time Recovery & Snapshot Readiness",
            description: "Monitor automated encrypted backups and DPDP Act 2023 data retention compliance.",
            to: "/app/health",
            query: { subsystem: "backups" },
            badge: "DPDP 2023",
          },
        ],
      },
      {
        id: "deployments_golive",
        label: "Deployments & Go-Live",
        summary: "Production go-live checklist, webhook HMAC verification, and runtime health gates.",
        badge: "Go-Live",
        options: [
          {
            id: "dep-golive-gate",
            subCategory: "Launch Readiness",
            label: "Production Go-Live Readiness Gate",
            description: "Verify environment keys, database connectivity, and statutory configuration before launch.",
            to: "/app/golive",
            query: { gate: "production" },
            badge: "Pre-Flight",
          },
          {
            id: "dep-webhooks",
            subCategory: "Webhook Security",
            label: "HMAC-SHA256 Payment & Logistics Webhooks",
            description: "Validate live webhook endpoints and idempotency keys for zero duplicate charges.",
            to: "/app/golive",
            query: { check: "webhooks" },
            badge: "HMAC-SHA256",
          },
          {
            id: "dep-probes",
            subCategory: "Runtime Probes",
            label: "Edge & Server Function Health Probes",
            description: "Inspect SSR build status, response headers, and runtime dependency readiness.",
            to: "/app/health",
            query: { probe: "canary" },
            badge: "Healthy",
          },
        ],
      },
      {
        id: "audit_logs",
        label: "Audit Logs",
        summary: "Tamper-evident audit trail for every administrative action, role change, and payout mutation.",
        badge: "Immutable",
        options: [
          {
            id: "aud-admin-trail",
            subCategory: "Governance Log",
            label: "Immutable Administrative Mutation Log",
            description: "Inspect actor ID, timestamp, IP, and before/after diffs for all system changes.",
            to: "/app/audit",
            query: { filter: "admin-mutations" },
            badge: "Immutable",
          },
          {
            id: "aud-financial",
            subCategory: "Financial Forensics",
            label: "Settlement, Refund & Tax Rule Audit Trail",
            description: "Complete statutory audit history for payouts, refunds, and commission changes.",
            to: "/app/audit",
            query: { filter: "payouts" },
            badge: "RBI / GST",
          },
          {
            id: "aud-fraud-forensics",
            subCategory: "Security Forensics",
            label: "Fraud Flag & Account Suspension History",
            description: "Review evidence logs and reviewer notes for every risk and KYC decision.",
            to: "/app/fraud",
            query: { tab: "forensics" },
            badge: "Forensics",
          },
        ],
      },
    ],
  },
  {
    id: "executive_settings",
    label: "Executive & Settings",
    emoji: "⚙️",
    badge: "Master Control",
    tagline:
      "Executive Operations Dashboard, White-Label Design & Branding, 23-Language Indian Localization & Founder Settings",
    categories: [
      {
        id: "exec_ops_dashboard",
        label: "Executive Operations Dashboard",
        summary: "Master Founder overview, progressive feature flags, and platform-wide alert routing.",
        badge: "Executive",
        options: [
          {
            id: "exec-command-home",
            subCategory: "Founder Deck",
            label: "Sovereign Founder Command Dashboard",
            description: "Unified executive cockpit with live GMV, active fleet, and 6-tier health indicators.",
            to: "/app",
            hash: "executive-overview",
            badge: "Master Deck",
          },
          {
            id: "exec-feature-flags",
            subCategory: "Release Toggles",
            label: "Feature Flags & Operational Circuit Breakers",
            description: "Toggle rain surge, instant refunds, AI dispatch, and new city modules safely.",
            to: "/app/flags",
            query: { scope: "global" },
            badge: "Flags",
          },
          {
            id: "exec-notifications",
            subCategory: "Broadcast Center",
            label: "Executive & Partner Notification Rules",
            description: "Configure transactional SMS, push alerts, and founder escalation channels.",
            to: "/app/notifications",
            query: { channel: "all" },
            badge: "Channels",
          },
        ],
      },
      {
        id: "design_branding",
        label: "Design and Branding",
        summary: "Custom CSS color tokens, white-label tenant identity, and customer app CMS banners.",
        badge: "Brand & CMS",
        options: [
          {
            id: "brand-tokens",
            subCategory: "Visual Identity",
            label: "Brand Color Tokens, Logos & Typography",
            description: "Customize primary/accent palette, app name, and white-label theme variables.",
            to: "/app/brand",
            query: { panel: "theme-tokens" },
            badge: "Design System",
          },
          {
            id: "brand-cms",
            subCategory: "App Merchandising",
            label: "Home Hero Banners, Collections & CMS",
            description: "Publish curated restaurant collections, seasonal banners, and announcements.",
            to: "/app/cms",
            query: { surface: "customer-app" },
            badge: "CMS",
          },
          {
            id: "brand-whitelabel",
            subCategory: "Multi-Tenant Brand",
            label: "B2B White-Label Tenant Branding",
            description: "Configure custom domain branding and receipt headers for enterprise franchises.",
            to: "/app/brand",
            query: { panel: "white-label" },
            badge: "White-Label",
          },
        ],
      },
      {
        id: "localization_23",
        label: "23-Language Localization",
        summary: "All 22 Eighth Schedule Indian Constitutional Languages plus English across every surface.",
        badge: "23 Languages",
        options: [
          {
            id: "loc-matrix",
            subCategory: "Constitutional Languages",
            label: "23-Language Dictionary & Script Governance",
            description: "Manage Hindi, Bengali, Telugu, Marathi, Tamil, Urdu, Gujarati, Kannada, Malayalam & more.",
            to: "/app/settings",
            query: { tab: "localization-23" },
            badge: "22 + English",
          },
          {
            id: "loc-cms",
            subCategory: "Regional Content",
            label: "Localized CMS Banners & Dish Categories",
            description: "Manage regional language strings for customer banners and menu categories.",
            to: "/app/cms",
            query: { tab: "translations" },
            badge: "Regional CMS",
          },
          {
            id: "loc-notifications",
            subCategory: "Multilingual Alerts",
            label: "23-Language Rider & Customer Alert Templates",
            description: "Deliver order status and dispatch notifications in the user's preferred language.",
            to: "/app/notifications",
            query: { tab: "templates-i18n" },
            badge: "Multilingual",
          },
        ],
      },
      {
        id: "founder_settings",
        label: "Founder Settings",
        summary: "Global statutory rates, platform fee slabs, city launch gates, and master security controls.",
        badge: "Sovereign",
        options: [
          {
            id: "fnd-platform-settings",
            subCategory: "Master Parameters",
            label: "Global Platform Fees, SLA & Statutory Config",
            description: "Configure base delivery fees, rain buffers, GST/TDS defaults, and support contacts.",
            to: "/app/settings",
            query: { tab: "statutory" },
            badge: "Master Config",
          },
          {
            id: "fnd-city-gates",
            subCategory: "Expansion Control",
            label: "City Launch & Module Rollout Gates",
            description: "Enable or pause platform verticals per city and operating zone.",
            to: "/app/flags",
            query: { view: "city-gates" },
            badge: "City Gates",
          },
          {
            id: "fnd-escalation-matrix",
            subCategory: "Founder Escalations",
            label: "6-Tier Founder Alert & Remediation Routing",
            description: "Configure thresholds for EMERGENCY and CRITICAL alerts in the Founder Bell Drawer.",
            to: "/app/notifications",
            query: { tier: "founder" },
            badge: "6-Tier Rules",
          },
        ],
      },
    ],
  },
];



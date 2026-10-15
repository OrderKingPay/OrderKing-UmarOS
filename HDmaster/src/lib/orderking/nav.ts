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
      { id: "commercial-dials", path: "/app/commercial-dials", i18n: "Commercial Master Dials", permission: "access_CEO_dashboard", icon: "activity" },
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

export const UMAR_OS_10_WORLDS: BottomNavWorld[] = [
  {
    id: "home",
    worldNumber: 1,
    label: "1. Home",
    shortTitle: "Main Dashboard & Daily Actions",
    emoji: "🏠",
    badge: "Daily Pulse",
    defaultTo: "/app",
    settingsTo: "/app/settings",
    tagline:
      "Main Dashboard & Daily Actions — Live orders, today's revenue, zone health, and founder approvals.",
    categories: [
      {
        id: "home_dashboard",
        label: "Main Dashboard",
        summary: "Today's live numbers, active orders, and city delivery zones.",
        badge: "Live Result",
        options: [
          {
            id: "home-pulse",
            subCategory: "Daily Overview",
            label: "Today's Live Dashboard & Pulse",
            description: "See today's orders, GMV, active restaurants, online riders, and delayed orders.",
            to: "/app",
            badge: "Home",
          },
          {
            id: "home-live-map",
            subCategory: "Real-Time Ops",
            label: "Live Control & Rider Positions",
            description: "Track active order states and last-known rider GPS positions in real time.",
            to: "/app/live",
            badge: "Live Map",
          },
          {
            id: "home-analytics",
            subCategory: "Daily Trends",
            label: "Daily Order Volume & CSV Exports",
            description: "Review daily order volume trends and download orders or finance CSV files.",
            to: "/app/analytics",
            badge: "Analytics",
          },
        ],
      },
      {
        id: "home_actions",
        label: "Daily Actions",
        summary: "What action to take right now: approvals, CEO deck, and daily reports.",
        badge: "Take Action",
        options: [
          {
            id: "home-ceo",
            subCategory: "Founder Deck",
            label: "Founder Command & Profit Deck",
            description: "Open executive profit summary, unit economics, and founder controls.",
            to: "/app/ceo",
            badge: "CEO Deck",
          },
          {
            id: "home-approvals",
            subCategory: "Pending Sign-Offs",
            label: "Founder Approval Queue",
            description: "Approve or reject pending payouts and high-impact operational actions.",
            to: "/app/approvals",
            badge: "Approvals",
          },
          {
            id: "home-reports",
            subCategory: "City Breakdown",
            label: "City & Order Status Reports",
            description: "Compare order count and GMV across Karimganj, Silchar, and other cities.",
            to: "/app/reports",
            badge: "Reports",
          },
        ],
      },
      {
        id: "home_settings",
        label: "Settings & Customizations",
        summary: "Customize home dashboard layout, default city filter, and feature switches.",
        badge: "Customize",
        options: [
          {
            id: "home-cfg-general",
            subCategory: "Dashboard Rules",
            label: "Home Dashboard & SLA Settings",
            description: "Customize default refresh intervals, SLA thresholds, and platform rules.",
            to: "/app/settings",
            query: { section: "dashboard" },
            badge: "Settings",
          },
          {
            id: "home-cfg-flags",
            subCategory: "Feature Switches",
            label: "Turn Features On or Off",
            description: "Toggle live tracking, surge rules, and module switches in 1 click.",
            to: "/app/flags",
            badge: "Switches",
          },
        ],
      },
    ],
  },
  {
    id: "orderking",
    worldNumber: 2,
    label: "2. OrderKing",
    shortTitle: "Orders, Restaurants, Riders & Customers",
    emoji: "👑",
    badge: "Core Ops",
    defaultTo: "/app/orders",
    settingsTo: "/app/settings",
    isPrimary: true,
    tagline:
      "Orders, Restaurants, Riders & Customers — Full marketplace operations, dispatch, FSSAI KYC, and support.",
    categories: [
      {
        id: "ok_orders",
        label: "Orders & Dispatch",
        summary: "Manage live customer orders, assign riders, and adjust delivery zones.",
        badge: "Orders",
        options: [
          {
            id: "ok-order-board",
            subCategory: "Order Board",
            label: "All Orders & Delayed Filter",
            description: "Inspect live orders, cancel or refund orders, and check item breakdowns.",
            to: "/app/orders",
            badge: "Live Orders",
          },
          {
            id: "ok-dispatch",
            subCategory: "Rider Assignment",
            label: "Dispatch Monitor & Unassigned Queue",
            description: "Match unassigned orders with available riders and monitor busy fleet.",
            to: "/app/dispatch",
            badge: "Dispatch",
          },
          {
            id: "ok-zones",
            subCategory: "Delivery Zones",
            label: "City Delivery Zones, Fees & ETA",
            description: "Set zone radius in km, base delivery fee in paise, and promised ETA minutes.",
            to: "/app/zones",
            badge: "Zones",
          },
        ],
      },
      {
        id: "ok_restaurants",
        label: "Restaurants",
        summary: "Onboard partner kitchens, verify 14-digit FSSAI licenses, and manage menus.",
        badge: "Kitchens",
        options: [
          {
            id: "ok-rest-list",
            subCategory: "Partner Kitchens",
            label: "Restaurant Directory & Menus",
            description: "Approve, pause, or inspect partner restaurants, ratings, and menu pricing.",
            to: "/app/restaurants",
            badge: "Restaurants",
          },
          {
            id: "ok-rest-kyc",
            subCategory: "Statutory KYC",
            label: "FSSAI 14-Digit & GSTIN Verification",
            description: "Review restaurant KYC documents under Food Safety & Standards Act 2006.",
            to: "/app/kyc",
            query: { entity: "restaurant" },
            badge: "FSSAI KYC",
          },
          {
            id: "ok-rest-promos",
            subCategory: "Discounts",
            label: "Restaurant Discount & Promo Rules",
            description: "Create percentage or flat discount codes with minimum order value rules.",
            to: "/app/promotions",
            badge: "Promos",
          },
        ],
      },
      {
        id: "ok_riders",
        label: "Riders",
        summary: "Manage delivery partner fleet, KYC verification, and cash-on-delivery balances.",
        badge: "Fleet",
        options: [
          {
            id: "ok-rider-list",
            subCategory: "Fleet Roster",
            label: "Delivery Partners & Cash Collected",
            description: "View rider status, vehicle type, KYC state, and COD cash in hand.",
            to: "/app/riders",
            badge: "Riders",
          },
          {
            id: "ok-rider-kyc",
            subCategory: "Rider KYC",
            label: "Driving License & Vehicle RC Check",
            description: "Verify rider identity and vehicle documents before activating shifts.",
            to: "/app/kyc",
            query: { entity: "rider" },
            badge: "Rider KYC",
          },
          {
            id: "ok-rider-live",
            subCategory: "GPS Tracking",
            label: "Live Rider Map & Status",
            description: "Check online riders and last-reported GPS coordinates across zones.",
            to: "/app/live",
            badge: "GPS Live",
          },
        ],
      },
      {
        id: "ok_customers",
        label: "Customers & Support",
        summary: "View customer accounts, resolve support tickets, and manage loyalty rewards.",
        badge: "Customers",
        options: [
          {
            id: "ok-cust-list",
            subCategory: "Customer Accounts",
            label: "Customer Directory & Order History",
            description: "Inspect customer references, order counts, loyalty tiers, and risk scores.",
            to: "/app/customers",
            badge: "Customers",
          },
          {
            id: "ok-support-desk",
            subCategory: "Help Desk",
            label: "Support Tickets & SLA Resolution",
            description: "Resolve customer, rider, and restaurant support tickets with audit notes.",
            to: "/app/support",
            badge: "Support",
          },
          {
            id: "ok-loyalty",
            subCategory: "Loyalty Program",
            label: "Customer Loyalty Tiers & Points",
            description: "Configure loyalty point multipliers and free-delivery membership rules.",
            to: "/app/loyalty",
            badge: "Loyalty",
          },
        ],
      },
      {
        id: "ok_settings",
        label: "Settings & Customizations",
        summary: "Customize order SLA timers, delivery fees, packaging caps, and cancellation rules.",
        badge: "Customize",
        options: [
          {
            id: "ok-cfg-ops",
            subCategory: "Operations Rules",
            label: "Order SLA, Prep Buffer & Fee Settings",
            description: "Edit delivery fees, kitchen prep buffers, and refund rules.",
            to: "/app/settings",
            query: { section: "orderking" },
            badge: "Settings",
          },
        ],
      },
    ],
  },
  {
    id: "kingpay",
    worldNumber: 3,
    label: "3. King Pay",
    shortTitle: "Wallet, Payouts, Commissions & Fees",
    emoji: "💳",
    badge: "Paise Ledger",
    defaultTo: "/app/settlements",
    settingsTo: "/app/settings",
    tagline:
      "Wallet, Payouts, Commissions & Fees — Integer-paise ledger, weekly settlements, CGST Sec 9(5), and TDS Sec 194-O.",
    categories: [
      {
        id: "kp_wallet_ledger",
        label: "Wallet & Finance Ledger",
        summary: "Double-entry integer-paise financial ledger, customer credits, and refunds.",
        badge: "Ledger",
        options: [
          {
            id: "kp-finance-home",
            subCategory: "Double-Entry Ledger",
            label: "Platform Finance & Paise Ledger",
            description: "Inspect gross collections, platform revenue, refunds, and ledger entries.",
            to: "/app/finance",
            badge: "Finance",
          },
          {
            id: "kp-crown-wallet",
            subCategory: "Customer Wallet",
            label: "Crown Wallet & Loyalty Credits",
            description: "Manage closed-loop customer reward credits and tier benefits.",
            to: "/app/loyalty",
            badge: "Wallet",
          },
          {
            id: "kp-refund-orders",
            subCategory: "Refund Ledger",
            label: "Refunded Orders & Reversals",
            description: "Audit completed customer refunds and payment reversals.",
            to: "/app/orders",
            query: { status: "REFUNDED" },
            badge: "Refunds",
          },
        ],
      },
      {
        id: "kp_payouts",
        label: "Payouts & Settlements",
        summary: "Weekly restaurant and rider payout batches with zero-discrepancy checks.",
        badge: "Payouts",
        options: [
          {
            id: "kp-settlements-desk",
            subCategory: "Settlement Batches",
            label: "Restaurant & Rider Payouts",
            description: "Review, verify, and approve settlement batches in integer paise.",
            to: "/app/settlements",
            badge: "Settlements",
          },
          {
            id: "kp-payout-approvals",
            subCategory: "Founder Sign-Off",
            label: "Pending Payout Approvals & Reconciler",
            description: "Calculate deterministic payouts and verify batch balances before release.",
            to: "/app/approvals",
            badge: "Approve",
          },
        ],
      },
      {
        id: "kp_commissions_fees",
        label: "Commissions, Fees & Taxes",
        summary: "Platform commission bps, delivery fees, unit economics, and RBI/GST compliance.",
        badge: "Fees & Tax",
        options: [
          {
            id: "kp-economics",
            subCategory: "Unit Economics",
            label: "Commission, Delivery Fee & Margin Calculator",
            description: "Model order AOV, commission bps, rider payout, and net contribution margin.",
            to: "/app/economics",
            badge: "Economics",
          },
          {
            id: "kp-rbi-gst",
            subCategory: "Statutory Compliance",
            label: "RBI PA/PG & GST Sec 9(5) / TDS 194-O Hub",
            description: "Verify statutory 5% restaurant GST, 0.5% TCS, and 0.1% TDS rules.",
            to: "/app/rbi-compliance-hub",
            badge: "RBI & GST",
          },
          {
            id: "kp-gateways",
            subCategory: "Payment Rails",
            label: "UPI, Razorpay & Cashfree Connectors",
            description: "Configure payment gateway fees, settlement timelines, and webhooks.",
            to: "/app/fintech-connectors",
            badge: "Gateways",
          },
        ],
      },
      {
        id: "kp_settings",
        label: "Settings & Customizations",
        summary: "Customize commission rates, delivery fees, payment fee bps, and tax settings.",
        badge: "Customize",
        options: [
          {
            id: "kp-cfg-fees",
            subCategory: "Fee & Tax Rules",
            label: "Commission, Payout & Tax Settings",
            description: "Update default commission bps, rider base pay, and tax rules.",
            to: "/app/settings",
            query: { section: "kingpay" },
            badge: "Settings",
          },
        ],
      },
    ],
  },
  {
    id: "travel_work",
    worldNumber: 4,
    label: "4. Travel & Work",
    shortTitle: "Travel Bookings, Tutor & Jobs",
    emoji: "✈️",
    badge: "Transit & Jobs",
    defaultTo: "/app/travel",
    settingsTo: "/app/settings",
    tagline:
      "Travel Bookings, Tutor & Jobs — Transit meal bookings, partner skill training academy, and local jobs.",
    categories: [
      {
        id: "tw_travel",
        label: "Travel Bookings",
        summary: "Railway station, airport, and highway corridor meal pre-orders and transit hubs.",
        badge: "Travel",
        options: [
          {
            id: "tw-travel-desk",
            subCategory: "Transit Orders",
            label: "Travel Bookings & Transit Meal Desk",
            description: "Manage passenger pre-orders, station/airport handoffs, and travel partners.",
            to: "/app/travel",
            badge: "Travel",
          },
          {
            id: "tw-transit-zones",
            subCategory: "Transit Zones",
            label: "Highway & Railway Delivery Zones",
            description: "Configure delivery radii and ETA rules around stations and highways.",
            to: "/app/zones",
            query: { type: "highway-hub" },
            badge: "Corridors",
          },
        ],
      },
      {
        id: "tw_tutor",
        label: "Tutor & Training",
        summary: "Kitchen hygiene SOPs, rider road-safety training, and skill certification.",
        badge: "Tutor",
        options: [
          {
            id: "tw-education",
            subCategory: "Skill Academy",
            label: "Tutor & Partner Education Center",
            description: "Manage training courses, hygiene SOP modules, and partner certifications.",
            to: "/app/education",
            badge: "Tutor",
          },
        ],
      },
      {
        id: "tw_jobs",
        label: "Jobs & Workforce",
        summary: "Local delivery partner recruitment, kitchen staff jobs, and employee roster.",
        badge: "Jobs",
        options: [
          {
            id: "tw-jobs-board",
            subCategory: "Work Marketplace",
            label: "Jobs & Local Workforce Board",
            description: "Manage open rider and kitchen roles, applicant pipelines, and shift slots.",
            to: "/app/jobs",
            badge: "Jobs",
          },
          {
            id: "tw-employees",
            subCategory: "Internal Team",
            label: "Staff Directory & Role Assignments",
            description: "Invite staff, assign city scopes, and manage role permissions.",
            to: "/app/employees",
            badge: "Staff",
          },
        ],
      },
      {
        id: "tw_settings",
        label: "Settings & Customizations",
        summary: "Customize travel booking lead times, training requirements, and job board rules.",
        badge: "Customize",
        options: [
          {
            id: "tw-cfg-rules",
            subCategory: "Vertical Rules",
            label: "Travel, Tutor & Job Settings",
            description: "Configure transit cutoff windows and workforce onboarding rules.",
            to: "/app/settings",
            query: { section: "travel-work" },
            badge: "Settings",
          },
        ],
      },
    ],
  },
  {
    id: "b2b_crm",
    worldNumber: 5,
    label: "5. B2B & CRM",
    shortTitle: "B2B Sales, ROI & 15-Stage CRM",
    emoji: "💼",
    badge: "15-Stage CRM",
    defaultTo: "/app/ceo",
    settingsTo: "/app/settings",
    tagline:
      "B2B Sales, ROI & 15-Stage CRM — Enterprise kitchen sales, franchise ROI calculator, and 15-stage onboarding.",
    categories: [
      {
        id: "b2b_sales_roi",
        label: "B2B Sales & ROI",
        summary: "Enterprise restaurant chains, franchise ROI math, and white-label B2B hubs.",
        badge: "B2B Sales",
        options: [
          {
            id: "b2b-ceo-desk",
            subCategory: "Sales & Profit",
            label: "B2B Sales Desk & Franchise ROI Calculator",
            description: "Compare direct platform take-rates, calculate store savings, and track B2B revenue.",
            to: "/app/ceo",
            hash: "b2b-sales-desk",
            badge: "B2B & ROI",
          },
          {
            id: "b2b-whitelabel",
            subCategory: "White-Label Hub",
            label: "B2B White-Label Partner Hub",
            description: "Manage enterprise white-label deployments and partner billing.",
            to: "/app/baas-hijack-hub",
            badge: "White-Label",
          },
          {
            id: "b2b-pos-hardware",
            subCategory: "Kitchen Hardware",
            label: "POS Terminals & Soundbox Devices",
            description: "Manage restaurant POS integrations and hardware terminal inventory.",
            to: "/app/pos-terminals",
            badge: "POS",
          },
        ],
      },
      {
        id: "b2b_crm_15",
        label: "15-Stage CRM Pipeline",
        summary: "Track every merchant deal from lead capture to FSSAI verification and go-live.",
        badge: "15 Stages",
        options: [
          {
            id: "b2b-crm-board",
            subCategory: "Deal Pipeline",
            label: "15-Stage CRM Deal Board",
            description: "Inspect verified CRM records, scenario templates, and onboarding progress.",
            to: "/app/ceo",
            hash: "crm-15-stage",
            badge: "15-Stage CRM",
          },
          {
            id: "b2b-crm-kyc",
            subCategory: "Contract & KYC",
            label: "Merchant KYC & License Verification",
            description: "Complete FSSAI and GST verification to move merchants to live status.",
            to: "/app/kyc",
            badge: "KYC",
          },
          {
            id: "b2b-crm-marketing",
            subCategory: "Growth & Grants",
            label: "Campaigns & Government Grant Dossiers",
            description: "Manage local acquisition campaigns and startup grant applications.",
            to: "/app/marketing",
            badge: "Growth",
          },
        ],
      },
      {
        id: "b2b_settings",
        label: "Settings & Customizations",
        summary: "Customize B2B contract slabs, CRM pipeline stages, and franchise pricing.",
        badge: "Customize",
        options: [
          {
            id: "b2b-cfg-rules",
            subCategory: "CRM & B2B Rules",
            label: "B2B Pricing & CRM Stage Settings",
            description: "Configure default B2B commission tiers and onboarding checklists.",
            to: "/app/settings",
            query: { section: "b2b-crm" },
            badge: "Settings",
          },
        ],
      },
    ],
  },
  {
    id: "umar_ai",
    worldNumber: 6,
    label: "6. UMAR AI",
    shortTitle: "AI Assistant & 16 Teams",
    emoji: "🤖",
    badge: "16 Teams",
    defaultTo: "/app/ai",
    settingsTo: "/app/ai",
    tagline:
      "AI Assistant & 16 Teams — Plain-English AI copilot, 16 specialist departments, and human-approved actions.",
    categories: [
      {
        id: "ai_copilot",
        label: "AI Assistant",
        summary: "Ask questions in plain English, diagnose delays, and see what action to take.",
        badge: "AI Console",
        options: [
          {
            id: "ai-main-console",
            subCategory: "Command Console",
            label: "UMAR AI Assistant & Daily Checks",
            description: "Run 1-click checks on delayed orders, ledger balance, and kitchen SLAs.",
            to: "/app/ai",
            badge: "UMAR AI",
          },
          {
            id: "ai-signoffs",
            subCategory: "Human-in-the-Loop",
            label: "AI Action Approvals & Workforce",
            description: "Review and authorize money-sensitive or operational actions proposed by AI.",
            to: "/app/approvals",
            badge: "Approvals",
          },
        ],
      },
      {
        id: "ai_16_teams",
        label: "16 Specialist Teams",
        summary: "Switch between all 16 specialist departments from Architecture to Finance and Support.",
        badge: "16 Teams",
        options: [
          {
            id: "ai-dept-switchboard",
            subCategory: "16 Departments",
            label: "16 AI Teams Switchboard",
            description: "Select any of the 16 departments to inspect owned modules and run team checks.",
            to: "/app/ai",
            query: { tab: "console" },
            badge: "16 Teams",
          },
          {
            id: "ai-repos",
            subCategory: "5 Connected Apps",
            label: "5-Repository Workspace & Feature Checklist",
            description: "Verify status across HDmaster, Customers, Riders, Partners, and Integration apps.",
            to: "/app/ai",
            query: { tab: "ecosystem" },
            badge: "5 Apps",
          },
        ],
      },
      {
        id: "ai_settings",
        label: "Settings & Customizations",
        summary: "Choose AI model provider, set approval rules, and review audit logs.",
        badge: "Customize",
        options: [
          {
            id: "ai-cfg-governance",
            subCategory: "AI Safety & Models",
            label: "AI Model Provider & Governance Rules",
            description: "Switch between local deterministic engine and external models with strict RBAC.",
            to: "/app/ai",
            query: { tab: "governance" },
            badge: "AI Settings",
          },
        ],
      },
    ],
  },
  {
    id: "studios",
    worldNumber: 7,
    label: "7. App & Design",
    shortTitle: "App Look, Banners & Studios",
    emoji: "🎨",
    badge: "Brand & CMS",
    defaultTo: "/app/cms",
    settingsTo: "/app/branding",
    tagline:
      "App Look, Banners & Studios — Customize brand colors, customer app banners, copy, and local campaigns.",
    categories: [
      {
        id: "st_app_look",
        label: "App Look & Brand",
        summary: "Customize app name, logo, primary/accent colors, and white-label styling.",
        badge: "Branding",
        options: [
          {
            id: "st-branding",
            subCategory: "Theme & Colors",
            label: "Brand Colors, Logo & App Name",
            description: "Edit background, foreground, primary, and accent colors with live preview.",
            to: "/app/branding",
            badge: "Brand",
          },
          {
            id: "st-app-copy",
            subCategory: "App Text",
            label: "Ecosystem App Copy & Text Studio",
            description: "Manage customer, rider, and partner app headlines and messages.",
            to: "/app/cms",
            badge: "App Copy",
          },
        ],
      },
      {
        id: "st_banners_ads",
        label: "Banners & Ad Studios",
        summary: "Publish home screen banners, promotional slots, and local ad campaigns.",
        badge: "Banners",
        options: [
          {
            id: "st-banners",
            subCategory: "Promotional Slots",
            label: "Customer, Rider & Partner Banners",
            description: "Publish and label promotional banners across all platform apps.",
            to: "/app/cms",
            query: { tab: "banners" },
            badge: "Banners",
          },
          {
            id: "st-marketing",
            subCategory: "Local Campaigns",
            label: "Marketing & Local Ad Studio",
            description: "Create local push, WhatsApp, and geofenced promotional campaigns.",
            to: "/app/marketing",
            badge: "Campaigns",
          },
        ],
      },
      {
        id: "st_settings",
        label: "Settings & Customizations",
        summary: "Customize theme tokens, 23 Indian languages, and banner display rules.",
        badge: "Customize",
        options: [
          {
            id: "st-cfg-brand",
            subCategory: "Design Rules",
            label: "Theme & 23-Language Customizations",
            description: "Configure default app colors, typography, and regional language options.",
            to: "/app/branding",
            badge: "Settings",
          },
        ],
      },
    ],
  },
  {
    id: "connectors",
    worldNumber: 8,
    label: "8. Connections",
    shortTitle: "API Keys, Payments & Map Zones",
    emoji: "🔌",
    badge: "APIs & Maps",
    defaultTo: "/app/golive",
    settingsTo: "/app/golive",
    tagline:
      "API Keys, Payments & Map Zones — Connect Razorpay, Cashfree, SMS OTP, Google Maps, POS printers, and zones.",
    categories: [
      {
        id: "cn_api_keys",
        label: "API Keys & Go-Live",
        summary: "Enter and test production API keys for database, payments, SMS, and maps.",
        badge: "API Keys",
        options: [
          {
            id: "cn-golive",
            subCategory: "Go-Live Setup",
            label: "API Keys, Webhooks & Go-Live Checklist",
            description: "Test and save Cloud DB, Razorpay, SMS DLT, Maps, and GST/FSSAI settings.",
            to: "/app/golive",
            badge: "Go-Live",
          },
          {
            id: "cn-fintech",
            subCategory: "Payment Gateways",
            label: "Payment & Banking API Gateways",
            description: "Inspect UPI, Razorpay, and Cashfree gateway connections and webhooks.",
            to: "/app/fintech-connectors",
            badge: "Payments",
          },
        ],
      },
      {
        id: "cn_maps_plugins",
        label: "Map Zones & Plugins",
        summary: "Configure city delivery polygons, external plugin switches, and POS printers.",
        badge: "Maps & POS",
        options: [
          {
            id: "cn-zones",
            subCategory: "Map Polygons",
            label: "Delivery Map Zones, Radius & Fees",
            description: "Edit city delivery zones, maximum radius in km, and delivery fees.",
            to: "/app/zones",
            badge: "Map Zones",
          },
          {
            id: "cn-plugins",
            subCategory: "Plugin Switchboard",
            label: "External Plugins & POS Connectors",
            description: "Manage external integrations, POS bridges, and capability registry.",
            to: "/app/tech-registry",
            badge: "Plugins",
          },
          {
            id: "cn-health",
            subCategory: "Connection Status",
            label: "Database & Service Uptime Health",
            description: "Verify live database connectivity, environment keys, and service health.",
            to: "/app/health",
            badge: "Health",
          },
        ],
      },
      {
        id: "cn_settings",
        label: "Settings & Customizations",
        summary: "Customize webhook timeouts, connection retries, and rollout switches.",
        badge: "Customize",
        options: [
          {
            id: "cn-cfg-golive",
            subCategory: "Connection Rules",
            label: "API Key & Webhook Security Settings",
            description: "Manage production environment modes, pilot limits, and webhook secrets.",
            to: "/app/golive",
            badge: "Settings",
          },
        ],
      },
    ],
  },
  {
    id: "alerts",
    worldNumber: 9,
    label: "9. Alerts",
    shortTitle: "Notifications & 6-Tier Action Center",
    emoji: "🚨",
    badge: "6-Tier",
    defaultTo: "/app/notifications",
    settingsTo: "/app/notifications",
    tagline:
      "Notifications & 6-Tier Action Center — Emergency to Low alerts, fraud risk monitor, and audit history.",
    categories: [
      {
        id: "al_action_center",
        label: "6-Tier Action Center",
        summary: "Monitor Emergency, Danger, Critical, High, Medium, and Low alerts with 1-click actions.",
        badge: "6-Tier Alerts",
        options: [
          {
            id: "al-notifications",
            subCategory: "Notification Outbox",
            label: "Notifications & Broadcast Center",
            description: "View queued push, SMS, and WhatsApp alerts and send operational notices.",
            to: "/app/notifications",
            badge: "Notifications",
          },
          {
            id: "al-health",
            subCategory: "System Watchdog",
            label: "System Health & Uptime Checks",
            description: "Check database status, order volume health, and runtime readiness.",
            to: "/app/health",
            badge: "Health",
          },
        ],
      },
      {
        id: "al_risk_audit",
        label: "Risk, Fraud & Audit",
        summary: "Review fraud signals, pending approvals, and immutable administrative logs.",
        badge: "Risk & Audit",
        options: [
          {
            id: "al-risk",
            subCategory: "Fraud Signals",
            label: "Fraud & Risk Signal Monitor",
            description: "Review customer, rider, and order risk signals before taking action.",
            to: "/app/risk",
            badge: "Risk",
          },
          {
            id: "al-approvals",
            subCategory: "Escalations",
            label: "Pending Founder Approvals",
            description: "Authorize or reject high-risk actions and payout requests.",
            to: "/app/approvals",
            badge: "Approvals",
          },
          {
            id: "al-audit",
            subCategory: "Audit Trail",
            label: "Immutable System Audit Log",
            description: "Inspect every recorded admin action, role change, and reason note.",
            to: "/app/audit",
            badge: "Audit Log",
          },
        ],
      },
      {
        id: "al_settings",
        label: "Settings & Customizations",
        summary: "Customize alert severity rules, notification channels, and escalation contacts.",
        badge: "Customize",
        options: [
          {
            id: "al-cfg-rules",
            subCategory: "Alert Rules",
            label: "Notification & Escalation Settings",
            description: "Configure when Emergency and Critical alerts notify the Founder.",
            to: "/app/settings",
            query: { section: "alerts" },
            badge: "Settings",
          },
        ],
      },
    ],
  },
  {
    id: "settings",
    worldNumber: 10,
    label: "10. Settings",
    shortTitle: "Master Settings & Customizations",
    emoji: "⚙️",
    badge: "Customize",
    defaultTo: "/app/settings",
    settingsTo: "/app/settings",
    tagline:
      "Master Settings & Customizations — Control platform fees, SLA timers, feature switches, staff access, and branding.",
    categories: [
      {
        id: "st_master_rules",
        label: "Platform Fees & SLA Rules",
        summary: "Edit commission bps, delivery fees, kitchen prep buffers, and statutory tax settings.",
        badge: "Master Rules",
        options: [
          {
            id: "cfg-platform",
            subCategory: "Global Settings",
            label: "Master Platform Settings & Fee Rules",
            description: "Customize commission rates, base delivery fees, rain surge, and SLA timers.",
            to: "/app/settings",
            badge: "Settings",
          },
          {
            id: "cfg-economics",
            subCategory: "Fee Simulator",
            label: "Unit Economics & Margin Simulator",
            description: "Test how fee or commission changes impact net profit per order.",
            to: "/app/economics",
            badge: "Simulator",
          },
        ],
      },
      {
        id: "st_switches_golive",
        label: "Feature Switches & Go-Live",
        summary: "Turn modules on or off safely and verify production launch readiness.",
        badge: "Switches",
        options: [
          {
            id: "cfg-flags",
            subCategory: "Feature Flags",
            label: "Feature Switches & Circuit Breakers",
            description: "Enable or pause live tracking, promos, AI assistant, and city features.",
            to: "/app/flags",
            badge: "Flags",
          },
          {
            id: "cfg-golive",
            subCategory: "Launch Gate",
            label: "Production Go-Live Configuration",
            description: "Manage database, payment gateway, SMS, and map keys for production.",
            to: "/app/golive",
            badge: "Go-Live",
          },
        ],
      },
      {
        id: "st_team_brand",
        label: "Team Roles, Brand & Audit",
        summary: "Manage employee permissions, customize app colors, and inspect audit logs.",
        badge: "Governance",
        options: [
          {
            id: "cfg-employees",
            subCategory: "Staff & RBAC",
            label: "Employees, Roles & Permissions",
            description: "Invite staff, assign roles, set city boundaries, and manage MFA status.",
            to: "/app/employees",
            badge: "Employees",
          },
          {
            id: "cfg-branding",
            subCategory: "App Identity",
            label: "Brand Colors, Logo & App Name",
            description: "Customize primary colors, theme tokens, and white-label app title.",
            to: "/app/branding",
            badge: "Branding",
          },
          {
            id: "cfg-audit",
            subCategory: "Security Log",
            label: "Administrative Audit Log",
            description: "Review tamper-evident history of all setting and role changes.",
            to: "/app/audit",
            badge: "Audit",
          },
        ],
      },
    ],
  },
];




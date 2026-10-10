import { useState, useEffect, useMemo } from "react";
import {
  DEFAULT_ECOSYSTEM_CMS,
  type EcosystemCmsConfig,
} from "@/lib/orderking/cms-connectors";
import {
  loadEcosystemCmsFn,
  saveEcosystemCmsFn,
} from "@/lib/orderking/actions";
import {
  FileText,
  Search,
  Save,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Layers,
  ArrowRight,
  Eye,
  Smartphone,
  Cpu,
  Calculator,
  Megaphone,
  SlidersHorizontal,
} from "lucide-react";
import { AlgorithmSettings } from "@/components/dashboard/AlgorithmSettings";

interface FieldDefinition {
  key: keyof EcosystemCmsConfig;
  label: string;
  category: "branding" | "pricing" | "fintech" | "orders" | "compliance" | "growth" | "connectors";
  description: string;
  placeholder: string;
  customerSurface: string;
  multiline?: boolean;
}

const FIELD_DEFINITIONS: FieldDefinition[] = [
  // 1. Branding & Hero
  {
    key: "homepageHeroText",
    label: "Homepage Hero Headline",
    category: "branding",
    description: "Primary promotional headline shown on the customer app home screen above the kitchen discovery feed.",
    placeholder: "From local master kitchens to your doorstep.",
    customerSurface: "Customer Home / Hero Viewport",
  },
  {
    key: "homepageHeroSubtitle",
    label: "Homepage Hero Subtitle",
    category: "branding",
    description: "Supporting descriptive narrative highlighting local provenance, hygiene standards, and kitchen authenticity.",
    placeholder: "Authentic culinary selections, zero artificial markup, and community-first delivery.",
    customerSurface: "Customer Home / Sub-Hero Deck",
    multiline: true,
  },
  {
    key: "brandTagline",
    label: "Core Brand Tagline",
    category: "branding",
    description: "Institutional brand motto displayed on header badges, splash screens, and official web manifests.",
    placeholder: "Have It Your Way",
    customerSurface: "Customer Global Header & Splash Screen",
  },
  {
    key: "searchPlaceholderText",
    label: "Search Bar Placeholder Text",
    category: "branding",
    description: "Interactive placeholder inside the global search input across merchant menus and item catalog.",
    placeholder: "Search restaurants, regional specialties, dishes, or groceries...",
    customerSurface: "Discovery Search Input Bar",
  },
  {
    key: "deliveryLocationPrompt",
    label: "Delivery Address Selector Prompt",
    category: "branding",
    description: "Top bar location selector greeting before geolocation geocode resolves.",
    placeholder: "Delivering fresh to your location",
    customerSurface: "Global Navigation Location Bar",
  },
  {
    key: "badgeGuaranteeText",
    label: "Quality & Packaging Guarantee Badge",
    category: "branding",
    description: "Trust badge displayed below search to reassure customers regarding kitchen hygiene and packaging safety.",
    placeholder: "100% Hygiene-Inspected Kitchens & Tamper-Evident Packaging",
    customerSurface: "Customer Home / Trust Assurance Ribbon",
  },
  {
    key: "closedHoursNoticeText",
    label: "Off-Hours Resting State Notice",
    category: "branding",
    description: "Message rendered when customer browses during late-night hours when commercial kitchen bays are closed.",
    placeholder: "Partner kitchens are currently offline for resting hours. Dispatch opens at 06:00 AM.",
    customerSurface: "Store Closed / Resting Modal",
    multiline: true,
  },

  // 2. Pricing & Anti-Surge
  {
    key: "zomatoSurgeWarningText",
    label: "Zomato Surge Warning & Zero-Surge Guarantee",
    category: "pricing",
    description: "High-visibility banner clarifying that OrderKing strictly refuses dynamic price surging during peak hours or rainfall.",
    placeholder: "Zero Dynamic Surge Guarantee: Our delivery fees are strictly fixed regardless of peak hours or bad weather.",
    customerSurface: "Checkout Surge Comparison Banner & Cart",
    multiline: true,
  },
  {
    key: "surgeDisclaimerSubtext",
    label: "Menu Dine-in Parity Notice",
    category: "pricing",
    description: "Explains that restaurant menu rates match physical dine-in cards without inflated aggregator markups.",
    placeholder: "Unlike aggregator surge models, restaurant menu rates remain authentic without inflated commission markups.",
    customerSurface: "Merchant Menu Header & Cart Subtext",
    multiline: true,
  },
  {
    key: "transparentFeeHeader",
    label: "Transparent Bill Breakdown Headline",
    category: "pricing",
    description: "Headline for the fee transparency modal showing itemized delivery, packaging, and government taxes.",
    placeholder: "Complete Operational Fee Transparency",
    customerSurface: "Cart / Bill Breakdown Accordion",
  },
  {
    key: "freeDeliveryThresholdNotice",
    label: "Free Delivery Incentive Banner",
    category: "pricing",
    description: "Notice displayed in cart encouraging cart additions to unlock complimentary local dispatch.",
    placeholder: "Free delivery unlocked for orders above ₹399",
    customerSurface: "Cart / Dynamic Progress Tracker",
  },
  {
    key: "platformFeeDescription",
    label: "Platform Convenience Fee Explanation",
    category: "pricing",
    description: "Informational tooltip text explaining the nominal pass-through platform fee.",
    placeholder: "Direct operational pass-through fee supporting local rider partner dispatch safety.",
    customerSurface: "Bill Summary / Platform Fee Tooltip",
    multiline: true,
  },
  {
    key: "packagingFeeDisclaimer",
    label: "Packaging Fee Regulatory Disclaimer",
    category: "pricing",
    description: "Mandatory compliance disclaimer regarding restaurant packaging material costs.",
    placeholder: "Mandatory food-grade tamper-evident container packaging tariff.",
    customerSurface: "Bill Summary / Container Packaging Row",
  },

  // 3. Fintech & KingPay
  {
    key: "kingPayOfflineMessage",
    label: "KingPay Offline Maintenance Notice",
    category: "fintech",
    description: "Critical broadcast message displayed on customer checkout if the KingPay ledger node or switch is temporarily paused.",
    placeholder: "KingPay digital wallet switch is undergoing scheduled reserve settlement maintenance. Instant UPI and card rails remain fully active.",
    customerSurface: "Payment Selection Viewport / Offline Alert",
    multiline: true,
  },
  {
    key: "kingPayHeroHeadline",
    label: "KingPay Sovereign Wallet Promotion Title",
    category: "fintech",
    description: "Headline introducing the KingPay 1-tap checkout wallet in the payments tab.",
    placeholder: "Instant 1-Tap Checkout with Zero Payment Failure Rate",
    customerSurface: "Customer Payment Methods Drawer",
  },
  {
    key: "kingPayWalletBalanceLabel",
    label: "Wallet Balance Display Label",
    category: "fintech",
    description: "Terminology used to display the customer's prepaid balance.",
    placeholder: "Available Sovereign Balance",
    customerSurface: "User Account / Wallet Hub",
  },
  {
    key: "kingPayInstantCheckoutCta",
    label: "KingPay 1-Tap CTA Button Text",
    category: "fintech",
    description: "High-conversion action button text when customer selects KingPay as payment source.",
    placeholder: "Pay with KingPay (1-Tap Instant Checkout)",
    customerSurface: "Checkout Payment Action Button",
  },
  {
    key: "kingPayCashbackPromoText",
    label: "Cashback Reward Announcement",
    category: "fintech",
    description: "Announcement text promoting instant wallet cashback deposited post-delivery.",
    placeholder: "Earn instant cash rewards deposited directly into your verified wallet on every meal order.",
    customerSurface: "Checkout Perks & Wallet Card",
    multiline: true,
  },
  {
    key: "kingPayLaterNotice",
    label: "KingPay Later / Credit Facility Disclaimer",
    category: "fintech",
    description: "Disclosure text outlining 15-day interest-free deferred settlement terms.",
    placeholder: "0% Interest 15-Day Flexible Credit Line powered by RBI-regulated banking partners.",
    customerSurface: "Deferred Payment Terms Modal",
  },
  {
    key: "kingPaySecurityGuaranteeText",
    label: "Payment Security & RBI Compliance Guarantee",
    category: "fintech",
    description: "Security footnote assuring bank-grade tokenization and data privacy compliance.",
    placeholder: "PCI-DSS Level 1 v4.0 & RBI Compliant End-to-End Encrypted Settlement Vault",
    customerSurface: "Checkout Footer / Security Seal",
  },

  // 4. Order Lifecycle
  {
    key: "cartEmptyHeadline",
    label: "Cart Empty State Title",
    category: "orders",
    description: "Headline displayed when customer visits cart without any selected items.",
    placeholder: "Your order basket is currently empty",
    customerSurface: "Cart Modal / Empty State",
  },
  {
    key: "cartEmptySubtext",
    label: "Cart Empty State Subtext",
    category: "orders",
    description: "Engaging call-to-action guiding the customer back to explore local merchant options.",
    placeholder: "Discover authentic culinary specialties from verified neighborhood kitchens.",
    customerSurface: "Cart Modal / Empty State Body",
  },
  {
    key: "orderConfirmationModalText",
    label: "Order Confirmation Modal Headline",
    category: "orders",
    description: "Appreciative greeting shown immediately upon order authorization.",
    placeholder: "Thank you for supporting independent local restaurants.",
    customerSurface: "Order Placed / Success Modal",
  },
  {
    key: "kitchenConfirmedStatusText",
    label: "Order Stage: Kitchen Preparing",
    category: "orders",
    description: "Live order telemetry text when kitchen accepts ticket and begins culinary prep.",
    placeholder: "Kitchen has accepted your order and initiated fresh culinary preparation.",
    customerSurface: "Live Tracking Timeline Stage 1",
  },
  {
    key: "riderAssignedStatusText",
    label: "Order Stage: Rider Partner Assigned",
    category: "orders",
    description: "Live tracking update when the autonomous dispatch engine assigns a nearby rider.",
    placeholder: "Delivery partner has been assigned and is heading to the pickup station.",
    customerSurface: "Live Tracking Timeline Stage 2",
  },
  {
    key: "riderEnRouteStatusText",
    label: "Order Stage: Rider En Route",
    category: "orders",
    description: "Telemetry notification when rider collects food and initiates travel to customer destination.",
    placeholder: "Rider is en route to your doorstep with insulated thermal temperature control.",
    customerSurface: "Live Tracking Timeline Stage 3",
  },
  {
    key: "riderArrivedStatusText",
    label: "Order Stage: Rider Arrived at Doorstep",
    category: "orders",
    description: "Arrival alert reminding customer to provide the delivery verification OTP.",
    placeholder: "Rider partner has arrived outside. Please present your delivery verification code.",
    customerSurface: "Live Tracking Arrival Sheet",
  },
  {
    key: "orderCompletedSuccessText",
    label: "Order Stage: Successfully Delivered",
    category: "orders",
    description: "Final completion status message on order fulfillment.",
    placeholder: "Order successfully delivered. Enjoy your meal!",
    customerSurface: "Order History / Completed Screen",
  },
  {
    key: "cancellationGracePeriodNotice",
    label: "Order Cancellation Grace Period Policy",
    category: "orders",
    description: "Clear notification regarding the 60-second operational cancellation grace period.",
    placeholder: "Orders can be amended or cancelled within 60 seconds of merchant confirmation.",
    customerSurface: "Order Tracking Footer / Cancellation Action",
  },

  // 5. Compliance, FSSAI & Support
  {
    key: "supportAssistantGreeting",
    label: "Customer Support Initial Welcome Greeting",
    category: "compliance",
    description: "Introductory message generated when customer opens the 24/7 in-app support chat.",
    placeholder: "Welcome to 24/7 Enterprise Customer Care. How may we assist your dining experience today?",
    customerSurface: "Customer Support Chat Window",
    multiline: true,
  },
  {
    key: "supportEscalationButtonLabel",
    label: "Operations Escalation Button Label",
    category: "compliance",
    description: "Label on button allowing user to request instant supervisor intervention.",
    placeholder: "Request Executive Escalation Officer",
    customerSurface: "Support Chat Escalation Action",
  },
  {
    key: "fssaiComplianceBannerText",
    label: "FSSAI Food Safety Network Disclaimer",
    category: "compliance",
    description: "Regulatory compliance note confirming all merchant kitchens operate under active FSSAI credentials.",
    placeholder: "Food Safety and Standards Authority of India (FSSAI) verified merchant network.",
    customerSurface: "Restaurant Page / License Footer",
  },
  {
    key: "grievanceOfficerContactText",
    label: "Grievance Redressal Officer Notice",
    category: "compliance",
    description: "Mandatory statutory notice complying with Consumer Protection (E-Commerce) Rules 2020.",
    placeholder: "Designated Grievance Redressal Officer: compliance@orderkingpay.com (SLA 24 Hours)",
    customerSurface: "Legal / Terms & Grievance Modal",
  },
  {
    key: "refundGuaranteeNotice",
    label: "Instant Refund Guarantee Policy",
    category: "compliance",
    description: "Customer assurance policy regarding prompt reimbursement for order defects.",
    placeholder: "100% Instant Resolution Guarantee: Immediate wallet reimbursement for missing or compromised items.",
    customerSurface: "Support Policy & Bill Summary",
    multiline: true,
  },

  // 6. Growth & Loyalty
  {
    key: "referralHeadline",
    label: "Viral Referral Program Headline",
    category: "growth",
    description: "Headline on the customer referral dashboard promoting neighbor invite rewards.",
    placeholder: "Invite Neighborhood Friends & Earn Cash Credits",
    customerSurface: "Referral & Earn Dashboard",
  },
  {
    key: "referralShareBodyTemplate",
    label: "Social Share Text Template",
    category: "growth",
    description: "Pre-filled text copied when user shares via WhatsApp, SMS, or Telegram. Use {LINK} as link placeholder.",
    placeholder: "Order authentic food with zero markup and zero surge pricing on OrderKing: {LINK}",
    customerSurface: "WhatsApp / Share Dialog",
    multiline: true,
  },
  {
    key: "goldPassMembershipTitle",
    label: "Gold Priority Pass Subscription Title",
    category: "growth",
    description: "Branding title for the zero-surge priority delivery membership program.",
    placeholder: "Gold Priority Pass: Zero-Surge Guarantee & Priority Dispatch Allocation",
    customerSurface: "Loyalty Pass Subscription Card",
  },
  {
    key: "dailySpecialsSectionTitle",
    label: "Daily Kitchen Specials Section Header",
    category: "growth",
    description: "Section header for daily chef specials curated directly from partner kitchens.",
    placeholder: "Curated Chef Specials & Direct-from-Kitchen Selections",
    customerSurface: "Home Screen Featured Horizontal Carousel",
  },

  // 7. Connectors Hub & Global Integrations Copy
  {
    key: "connectorsHubTitle",
    label: "Connectors Hub Main Title",
    category: "connectors",
    description: "Main header headline for the Plugin Switchboard & External Connectors matrix.",
    placeholder: "Plugin Switchboard & External Connectors",
    customerSurface: "Plugin Connectors Hub Header",
  },
  {
    key: "connectorsHubSubtitle",
    label: "Connectors Hub Subtitle",
    category: "connectors",
    description: "Descriptive overview of integrated external gateways and institutional telemetry.",
    placeholder: "Institutional integration management. Securely configure Razorpay payment rails, WhatsApp Business API, FSSAI regulatory verification, Mapbox geospatial telemetry, ClearTax automated GST calculation, and Automated WhatsApp Marketing.",
    customerSurface: "Plugin Connectors Hub Subtitle",
    multiline: true,
  },
  {
    key: "connectorClearTaxTitle",
    label: "ClearTax Connector Headline",
    category: "connectors",
    description: "Display name for the Automated Tax Calculation (ClearTax) gateway integration.",
    placeholder: "Automated Tax Calculation (ClearTax)",
    customerSurface: "Plugin Connectors Matrix / ClearTax Card Title",
  },
  {
    key: "connectorClearTaxSubtitle",
    label: "ClearTax Connector Description",
    category: "connectors",
    description: "Descriptive copy highlighting automated GST computation, e-invoicing, and compliance.",
    placeholder: "Statutory automated GST calculation, real-time e-invoicing, reverse charge determination, and seamless automated tax reconciliation for compliant restaurant operations.",
    customerSurface: "Plugin Connectors Matrix / ClearTax Card Deck",
    multiline: true,
  },
  {
    key: "connectorClearTaxToggleLabel",
    label: "ClearTax Active Switch Label",
    category: "connectors",
    description: "1-Click toggle switch label to enable or disable the ClearTax tax calculation engine.",
    placeholder: "Tax Engine Active",
    customerSurface: "Plugin Connectors Matrix / ClearTax Switch",
  },
  {
    key: "connectorClearTaxTestBtnText",
    label: "ClearTax Diagnostic Action Label",
    category: "connectors",
    description: "Action button label to run connection diagnostics with ClearTax GSTN servers.",
    placeholder: "Test ClearTax Diagnostic",
    customerSurface: "Plugin Connectors Matrix / ClearTax Action Button",
  },
  {
    key: "connectorClearTaxPolicyTitle",
    label: "ClearTax Statutory Policy Header",
    category: "connectors",
    description: "Compliance header for GST & e-invoicing enforcement rules.",
    placeholder: "Statutory GST & E-Invoicing Enforcement",
    customerSurface: "Plugin Connectors Matrix / ClearTax Policy Box Title",
  },
  {
    key: "connectorClearTaxPolicyNotice",
    label: "ClearTax Statutory Policy Notice",
    category: "connectors",
    description: "Detailed compliance policy text for IRN generation and GSTIN validation upon order fulfillment.",
    placeholder: "Generates IRN & QR-coded e-invoices instantly via ClearTax APIs upon order fulfillment, verifying restaurant GSTIN active status.",
    customerSurface: "Plugin Connectors Matrix / ClearTax Policy Box Body",
    multiline: true,
  },
  {
    key: "connectorClearTaxWebhookNotice",
    label: "ClearTax Webhook Instructions",
    category: "connectors",
    description: "Information notice explaining GSTN reconciliation callback listener events.",
    placeholder: "ClearTax GSTN Reconciliation Webhook: Automatically imports GSTR-1 & GSTR-3B monthly outward supply filings.",
    customerSurface: "Plugin Connectors Matrix / ClearTax Webhook Info",
    multiline: true,
  },
  {
    key: "connectorWhatsappMarketingTitle",
    label: "WhatsApp Marketing Connector Headline",
    category: "connectors",
    description: "Display name for the Automated WhatsApp Marketing engine integration.",
    placeholder: "Automated WhatsApp Marketing",
    customerSurface: "Plugin Connectors Matrix / WhatsApp Marketing Card Title",
  },
  {
    key: "connectorWhatsappMarketingSubtitle",
    label: "WhatsApp Marketing Connector Description",
    category: "connectors",
    description: "Descriptive copy highlighting automated customer re-engagement, promotional drops, and cart recovery.",
    placeholder: "High-conversion automated customer re-engagement, promotional drops, festival banquet offers, and personalized loyalty cart recovery campaigns with full TRAI/DND compliance.",
    customerSurface: "Plugin Connectors Matrix / WhatsApp Marketing Card Deck",
    multiline: true,
  },
  {
    key: "connectorWhatsappMarketingToggleLabel",
    label: "WhatsApp Marketing Active Switch Label",
    category: "connectors",
    description: "1-Click toggle switch label to enable or disable automated promotional marketing campaigns.",
    placeholder: "Marketing Engine Active",
    customerSurface: "Plugin Connectors Matrix / WhatsApp Marketing Switch",
  },
  {
    key: "connectorWhatsappMarketingTestBtnText",
    label: "WhatsApp Marketing Diagnostic Action Label",
    category: "connectors",
    description: "Action button label to run connection diagnostics with WhatsApp marketing dispatch gateway.",
    placeholder: "Test Broadcast Dispatch",
    customerSurface: "Plugin Connectors Matrix / WhatsApp Marketing Action Button",
  },
  {
    key: "connectorWhatsappMarketingPolicyTitle",
    label: "WhatsApp Marketing Policy Header",
    category: "connectors",
    description: "Compliance header for anti-spam and TRAI marketing delivery hours.",
    placeholder: "Strict DND & Anti-Spam Marketing Policy",
    customerSurface: "Plugin Connectors Matrix / WhatsApp Marketing Policy Box Title",
  },
  {
    key: "connectorWhatsappMarketingPolicyNotice",
    label: "WhatsApp Marketing Policy Notice",
    category: "connectors",
    description: "Detailed compliance policy text explaining 10 AM - 9 PM regulatory windows and opt-out processing.",
    placeholder: "Ensures all automated promotional broadcasts respect 10:00 AM - 09:00 PM regulatory delivery windows and honour instant opt-out requests without exception.",
    customerSurface: "Plugin Connectors Matrix / WhatsApp Marketing Policy Box Body",
    multiline: true,
  },
  {
    key: "connectorWhatsappMarketingOptInNotice",
    label: "WhatsApp Marketing Opt-Out Instructions",
    category: "connectors",
    description: "Information notice explaining automatic opt-out handling upon receiving STOP/UNSUBSCRIBE.",
    placeholder: "Automatic Unsubscribe Handler: Customers replying STOP or UNSUBSCRIBE are instantly purged from promotional broadcast audiences.",
    customerSurface: "Plugin Connectors Matrix / WhatsApp Marketing Opt-Out Info",
    multiline: true,
  },
  {
    key: "connectorRazorpayTitle",
    label: "Razorpay Gateway Title",
    category: "connectors",
    description: "Display name for the Razorpay Payment Gateway integration.",
    placeholder: "Razorpay Payment Gateway Integration",
    customerSurface: "Plugin Connectors Matrix / Razorpay Card Title",
  },
  {
    key: "connectorRazorpaySubtitle",
    label: "Razorpay Gateway Description",
    category: "connectors",
    description: "Descriptive copy for customer UPI, card tokenization, and settlements.",
    placeholder: "Handles instant customer UPI, credit/debit card tokenization, auto-capture, and merchant settlement transfers.",
    customerSurface: "Plugin Connectors Matrix / Razorpay Card Deck",
    multiline: true,
  },
  {
    key: "connectorWhatsappTitle",
    label: "WhatsApp Operational API Title",
    category: "connectors",
    description: "Display name for WhatsApp Business transactional messaging.",
    placeholder: "WhatsApp Business API Connector",
    customerSurface: "Plugin Connectors Matrix / WhatsApp Card Title",
  },
  {
    key: "connectorWhatsappSubtitle",
    label: "WhatsApp Operational API Description",
    category: "connectors",
    description: "Descriptive copy for order receipts, OTP delivery, and merchant alerts.",
    placeholder: "Transmits real-time order receipts, OTP delivery handshakes, and merchant alerts via Meta Cloud API or Gupshup.",
    customerSurface: "Plugin Connectors Matrix / WhatsApp Card Deck",
    multiline: true,
  },
  {
    key: "connectorFssaiTitle",
    label: "FSSAI Gateway Title",
    category: "connectors",
    description: "Display name for the FSSAI Regulatory Verification Gateway.",
    placeholder: "FSSAI Government Regulatory Verification Gateway",
    customerSurface: "Plugin Connectors Matrix / FSSAI Card Title",
  },
  {
    key: "connectorFssaiSubtitle",
    label: "FSSAI Gateway Description",
    category: "connectors",
    description: "Descriptive copy for FoSCoS portal verification of restaurant licenses.",
    placeholder: "Direct integration with the FoSCoS Government Portal. Verifies 14-digit restaurant food licenses and enforces statutory onboarding rules.",
    customerSurface: "Plugin Connectors Matrix / FSSAI Card Deck",
    multiline: true,
  },
  {
    key: "connectorFssaiPolicyTitle",
    label: "FSSAI Regulatory Policy Title",
    category: "connectors",
    description: "Header for strict regulatory onboarding gating rules.",
    placeholder: "Strict Regulatory Onboarding Gate",
    customerSurface: "Plugin Connectors Matrix / FSSAI Policy Box Title",
  },
  {
    key: "connectorFssaiPolicyNotice",
    label: "FSSAI Regulatory Policy Notice",
    category: "connectors",
    description: "Detailed compliance notice explaining automatic order blocking for unverified food licenses.",
    placeholder: "Automatically block merchant kitchens from taking live customer orders if their 14-digit FSSAI license is absent, lapsed, or rejected by the FoSCoS gateway.",
    customerSurface: "Plugin Connectors Matrix / FSSAI Policy Box Body",
    multiline: true,
  },
  {
    key: "connectorMapboxTitle",
    label: "Mapbox Matrix Title",
    category: "connectors",
    description: "Display name for Mapbox Geospatial Matrix & Routing Telemetry.",
    placeholder: "Mapbox Geospatial Matrix & Routing Telemetry",
    customerSurface: "Plugin Connectors Matrix / Mapbox Card Title",
  },
  {
    key: "connectorMapboxSubtitle",
    label: "Mapbox Matrix Description",
    category: "connectors",
    description: "Descriptive copy for distance matrix, congestion avoidance, and rider GPS estimation.",
    placeholder: "Powers multi-point distance matrix calculations, live congestion avoidance, and real-time rider GPS vector estimation.",
    customerSurface: "Plugin Connectors Matrix / Mapbox Card Deck",
    multiline: true,
  },
];

type CategoryId = "all" | "algorithm" | "branding" | "pricing" | "fintech" | "orders" | "compliance" | "growth" | "connectors";

export function EcosystemCMS() {
  const [formData, setFormData] = useState<EcosystemCmsConfig>(DEFAULT_ECOSYSTEM_CMS);
  const [initialData, setInitialData] = useState<EcosystemCmsConfig>(DEFAULT_ECOSYSTEM_CMS);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [previewFieldKey, setPreviewFieldKey] = useState<keyof EcosystemCmsConfig>("homepageHeroText");

  // Load config on mount
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);
        // Try server function first, fallback to REST API
        let data: EcosystemCmsConfig | null = null;
        try {
          const res = await loadEcosystemCmsFn();
          if (res && res.ok && res.data) {
            data = res.data;
          }
        } catch {
          // fallback to REST
          const resp = await fetch("/api/v1/admin/settings");
          if (resp.ok) {
            const json = await resp.json();
            if (json.cms) data = json.cms;
          }
        }

        if (mounted && data) {
          const merged = { ...DEFAULT_ECOSYSTEM_CMS, ...data };
          setFormData(merged);
          setInitialData(merged);
        }
      } catch (err) {
        console.error("Error loading Ecosystem CMS configuration:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  // Filtered fields based on category and search
  const filteredFields = useMemo(() => {
    return FIELD_DEFINITIONS.filter((f) => {
      const matchCat = selectedCategory === "all" || f.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        f.label.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.customerSurface.toLowerCase().includes(q) ||
        (formData[f.key] || "").toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery, formData]);

  // Check if form has unsaved modifications
  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  // Count modified fields
  const changedCount = useMemo(() => {
    let count = 0;
    for (const def of FIELD_DEFINITIONS) {
      if (formData[def.key] !== initialData[def.key]) count++;
    }
    return count;
  }, [formData, initialData]);

  const handleChange = (key: keyof EcosystemCmsConfig, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetField = (key: keyof EcosystemCmsConfig) => {
    setFormData((prev) => ({ ...prev, [key]: DEFAULT_ECOSYSTEM_CMS[key] }));
  };

  const handleClearField = (key: keyof EcosystemCmsConfig) => {
    setFormData((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatusMessage(null);

      // Save via server function or REST API
      let success = false;
      try {
        const res = await saveEcosystemCmsFn({ data: { cms: formData } });
        if (res && res.ok) success = true;
      } catch {
        const resp = await fetch("/api/v1/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cms: formData }),
        });
        if (resp.ok) success = true;
      }

      if (success) {
        setInitialData(formData);
        setStatusMessage({
          type: "success",
          text: `Ecosystem CMS successfully synchronized. ${changedCount} content fields updated across customer mobile surfaces.`,
        });
        setTimeout(() => setStatusMessage(null), 6000);
      } else {
        setStatusMessage({
          type: "error",
          text: "Failed to persist CMS modifications to platform configuration. Please check network logs.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Unexpected exception during CMS synchronization.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetAllToOriginal = () => {
    if (confirm("Revert all pending modifications back to current production values?")) {
      setFormData(initialData);
      setStatusMessage({ type: "info", text: "Modifications discarded. Production values restored." });
    }
  };

  const handleResetAllToSystemDefaults = () => {
    if (confirm("Reset ALL fields to official platform default copy? You will still need to click 'Publish & Synchronize' to apply.")) {
      setFormData(DEFAULT_ECOSYSTEM_CMS);
      setStatusMessage({ type: "info", text: "Reset to default platform copy. Review and save when ready." });
    }
  };

  const categories = [
    { id: "all" as const, label: "All Copy", count: FIELD_DEFINITIONS.length, icon: Layers },
    { id: "algorithm" as const, label: "Algorithmic Matrix", count: 4, icon: SlidersHorizontal },
    { id: "connectors" as const, label: "Plugin & Connectors", count: FIELD_DEFINITIONS.filter(f => f.category === "connectors").length, icon: Cpu },
    { id: "branding" as const, label: "Hero & Brand Positioning", count: 7, icon: Sparkles },
    { id: "pricing" as const, label: "Surge & Pricing Notices", count: 6, icon: ShieldCheck },
    { id: "fintech" as const, label: "KingPay & Fintech Rails", count: 7, icon: CreditCard },
    { id: "orders" as const, label: "Order Journey & Status", count: 9, icon: Truck },
    { id: "compliance" as const, label: "Regulatory & Support", count: 5, icon: AlertTriangle },
    { id: "growth" as const, label: "Loyalty & Growth", count: 4, icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Global Ecosystem CMS
                </h2>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 border border-emerald-500/20">
                  Live Customer Sync
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Authoritative content management switchboard. Direct customization of customer app copy, pricing disclaimers, and fintech alerts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetAllToSystemDefaults}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            title="Reset all inputs to platform standard defaults"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Defaults
          </button>

          {hasChanges && (
            <button
              type="button"
              onClick={handleResetAllToOriginal}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Discard Changes
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-all ${
              hasChanges
                ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Publishing Updates..." : hasChanges ? `Publish & Synchronize (${changedCount})` : "All Strings In Sync"}
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between rounded-lg border p-4 text-sm ${
            statusMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : statusMessage.type === "error"
              ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
              : "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {statusMessage.type === "error" && <AlertTriangle className="h-4 w-4 shrink-0" />}
            {statusMessage.type === "info" && <HelpCircle className="h-4 w-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Operational Mode Switcher: Content CMS vs Algorithmic Matrix */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-2.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              selectedCategory !== "algorithm"
                ? "bg-secondary text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Content & Messaging CMS</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-mono">
              {FIELD_DEFINITIONS.length} Strings
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("algorithm")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              selectedCategory === "algorithm"
                ? "bg-emerald-500 text-slate-950 shadow-md font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Algorithmic Settings Matrix</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
              selectedCategory === "algorithm" ? "bg-slate-950/20 text-slate-950" : "bg-emerald-500/10 text-emerald-500"
            }`}>
              4 Engine Sliders
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-muted-foreground pr-2">
          <span>Active Layer:</span>
          <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-500 font-semibold">
            {selectedCategory === "algorithm" ? "OPERATIONAL DISPATCH MATH" : "CUSTOMER SURFACES"}
          </span>
        </div>
      </div>

      {selectedCategory === "algorithm" ? (
        <AlgorithmSettings />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center Section: Category Tabs & Form Fields */}
        <div className="lg:col-span-8 space-y-6">
          {/* Search & Category Filter Toolbar */}
          <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search strings by name, content, surface or keyword (e.g. 'surge', 'hero', 'kingpay')..."
                className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{cat.label}</span>
                    <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                      isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Cards List */}
          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
              <div className="flex flex-col items-center gap-2 text-muted-foreground text-sm">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Synchronizing Ecosystem Content Schema...</span>
              </div>
            </div>
          ) : filteredFields.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/60 mb-2" />
              <p className="text-sm font-medium text-foreground">No matching content strings found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for a different keyword or select "All Copy" to view all content domains.
              </p>
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
                className="mt-3 text-xs font-medium text-primary hover:underline"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFields.map((field) => {
                const currentValue = formData[field.key] || "";
                const isModified = currentValue !== initialData[field.key];
                const isDefault = currentValue === DEFAULT_ECOSYSTEM_CMS[field.key];
                const isSelectedForPreview = previewFieldKey === field.key;

                return (
                  <div
                    key={field.key}
                    className={`rounded-xl border transition-all p-5 shadow-xs ${
                      isSelectedForPreview
                        ? "border-primary/50 bg-card ring-1 ring-primary/20"
                        : isModified
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-border bg-card hover:border-border/80"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="text-sm font-semibold text-foreground">
                          {field.label}
                        </label>
                        {isModified ? (
                          <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 border border-amber-500/20">
                            Unsaved Change
                          </span>
                        ) : !currentValue ? (
                          <span className="rounded-md bg-zinc-500/10 px-2 py-0.5 text-[10px] font-medium text-zinc-500 border border-zinc-500/20">
                            Blank / Not Configured
                          </span>
                        ) : isDefault ? (
                          <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            System Default
                          </span>
                        ) : (
                          <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 border border-emerald-500/20">
                            Customized
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setPreviewFieldKey(field.key)}
                          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                            isSelectedForPreview
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                          title="Simulate this string in Mobile Customer Viewport"
                        >
                          <Eye className="h-3 w-3" />
                          Simulate
                        </button>

                        {!isDefault && (
                          <button
                            type="button"
                            onClick={() => handleResetField(field.key)}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                            title="Reset this field to standard platform default"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reset Default
                          </button>
                        )}

                        {currentValue && (
                          <button
                            type="button"
                            onClick={() => handleClearField(field.key)}
                            className="rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-secondary hover:text-red-500 transition-colors"
                            title="Clear string value (empty state)"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      {field.description}
                    </p>

                    {/* Input Element */}
                    {field.multiline ? (
                      <textarea
                        rows={3}
                        value={currentValue}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary leading-normal resize-y"
                      />
                    ) : (
                      <input
                        type="text"
                        value={currentValue}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    )}

                    {/* Footer Info Row */}
                    <div className="mt-2.5 flex flex-wrap items-center justify-between text-[11px] text-muted-foreground gap-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-muted-foreground/80 bg-secondary/80 px-1.5 py-0.5 rounded">
                          {field.key}
                        </span>
                        <span>•</span>
                        <span className="text-muted-foreground">
                          Surface: <strong className="font-medium text-foreground/80">{field.customerSurface}</strong>
                        </span>
                      </div>
                      <span className="font-mono text-[10px]">
                        {currentValue.length} characters
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Section: Mobile Customer Viewport Simulation */}
        <div className="lg:col-span-4 space-y-4">
          <div className="sticky top-6 rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Customer App Telemetry Simulator
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                100% Native Render
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Real-time rendering of active copy across customer interaction viewports. Select any field to inspect its appearance.
            </p>

            {/* Mock Phone Frame */}
            <div className="mx-auto max-w-[280px] rounded-2xl border-4 border-zinc-800 bg-zinc-950 p-3 shadow-xl text-zinc-100 font-sans">
              {/* Phone Status Bar */}
              <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-2 px-1">
                <span>09:41</span>
                <span className="font-semibold tracking-tighter">OrderKing Pay</span>
                <span>5G 100%</span>
              </div>

              {/* In-app Notification / Banner preview */}
              <div className="space-y-3 py-1">
                {/* Brand Header */}
                <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400">
                      {formData.brandTagline || "Have It Your Way"}
                    </span>
                    <span className="text-[9px] text-zinc-400">Karimganj Town</span>
                  </div>
                  <div className="text-[10px] text-zinc-300">
                    📍 {formData.deliveryLocationPrompt || "Delivering fresh to your location"}
                  </div>
                </div>

                {/* Hero Showcase */}
                <div className="rounded-lg bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-3 space-y-1.5">
                  <h4 className="text-xs font-bold leading-tight text-white">
                    {formData.homepageHeroText || "[Homepage Hero Text Unconfigured]"}
                  </h4>
                  <p className="text-[10px] text-zinc-400 leading-snug">
                    {formData.homepageHeroSubtitle || "[Hero Subtitle Unconfigured]"}
                  </p>
                  <div className="pt-1">
                    <span className="inline-block rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-medium text-amber-300 border border-amber-500/30">
                      {formData.badgeGuaranteeText || "100% Hygienic Packaging"}
                    </span>
                  </div>
                </div>

                {/* Zomato Surge Warning Mock Card */}
                <div className="rounded-lg bg-emerald-950/60 border border-emerald-800/50 p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                    <ShieldCheck className="h-3 w-3 shrink-0" />
                    <span>ZERO SURGE ASSURANCE</span>
                  </div>
                  <p className="text-[9px] text-emerald-200 leading-tight">
                    {formData.zomatoSurgeWarningText || "[Surge Warning Text Unconfigured]"}
                  </p>
                </div>

                {/* KingPay Offline / Online Switch Card */}
                <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-amber-400">KingPay 1-Tap Node</span>
                    <span className="text-[9px] text-zinc-400">Status Check</span>
                  </div>
                  <p className="text-[9px] text-zinc-300 leading-snug">
                    {formData.kingPayOfflineMessage || "[KingPay Offline Message Unconfigured]"}
                  </p>
                </div>

                {/* Live Order Timeline Snippet */}
                <div className="rounded-lg bg-zinc-900/80 border border-zinc-800/80 p-2.5 space-y-1.5">
                  <div className="text-[10px] font-semibold text-zinc-200">Live Delivery Telemetry</div>
                  <div className="flex items-start gap-1.5 text-[9px] text-zinc-300">
                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{formData.riderEnRouteStatusText || "[Rider En Route Status Unconfigured]"}</span>
                  </div>
                </div>

                {/* Regulatory Footer */}
                <div className="text-center pt-1 text-[8px] text-zinc-500">
                  {formData.fssaiComplianceBannerText || "FSSAI Food Safety Network"}
                </div>
              </div>
            </div>

            {/* Currently Focused Field Breakdown */}
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                Active Simulation Focus
              </span>
              <div className="text-xs font-semibold text-foreground">
                {FIELD_DEFINITIONS.find((f) => f.key === previewFieldKey)?.label}
              </div>
              <p className="text-xs font-mono text-primary bg-background/80 p-2 rounded border border-border/80 break-words">
                {formData[previewFieldKey] || "[Value is currently blank]"}
              </p>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

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
  Layers,
  Eye,
  Smartphone,
  Cpu,
  Megaphone,
  SlidersHorizontal,
  Plus,
  Trash2,
  Link as LinkIcon,
} from "lucide-react";
import { AlgorithmSettings } from "@/components/dashboard/AlgorithmSettings";

interface FieldDefinition {
  key: keyof EcosystemCmsConfig;
  label: string;
  category:
    | "branding"
    | "pricing"
    | "fintech"
    | "orders"
    | "compliance"
    | "growth"
    | "connectors";
  description: string;
  placeholder: string;
  customerSurface: string;
  multiline?: boolean;
}

export interface CustomAppBanner {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  linkUrl: string;
  bgColor: string;
  enabled: boolean;
}

const BANNERS_STORAGE_KEY = "orderking_custom_banners_v1";
const CMS_STORAGE_KEY = "orderking_cms_strings_v1";

const DEFAULT_CUSTOM_BANNERS: CustomAppBanner[] = [
  {
    id: "banner-1",
    title: "Flat 25% Off Local Kitchens",
    subtitle: "Order fresh biryani, rolls, and thalis with zero surge fees.",
    buttonText: "Order Now",
    linkUrl: "/offers/local-specials",
    bgColor: "#E23744",
    enabled: true,
  },
  {
    id: "banner-2",
    title: "Free Delivery Above ₹399",
    subtitle: "Add items worth ₹399 or more to unlock free doorstep delivery.",
    buttonText: "View Menu",
    linkUrl: "/collections/free-delivery",
    bgColor: "#0D9488",
    enabled: true,
  },
  {
    id: "banner-3",
    title: "Pay with KingPay Wallet",
    subtitle: "Enjoy 1-tap instant checkout and instant cashback on every meal.",
    buttonText: "Open Wallet",
    linkUrl: "/wallet/kingpay",
    bgColor: "#2563EB",
    enabled: true,
  },
];

const FIELD_DEFINITIONS: FieldDefinition[] = [
  // 1. Branding & Home Banner
  {
    key: "homepageHeroText",
    label: "Home Screen Main Title",
    category: "branding",
    description: "The main big headline customers see at the top of the app home screen.",
    placeholder: "From local master kitchens to your doorstep.",
    customerSurface: "Home Screen Top Banner",
  },
  {
    key: "homepageHeroSubtitle",
    label: "Home Screen Subtitle",
    category: "branding",
    description: "A short line below the main headline explaining your fresh local food promise.",
    placeholder: "Authentic meals, honest menu prices, and fast local delivery.",
    customerSurface: "Home Screen Sub-Banner",
    multiline: true,
  },
  {
    key: "brandTagline",
    label: "App Core Value Proposition",
    category: "branding",
    description: "Clear brand proposition shown next to the logo in the top header and splash screen.",
    placeholder: "Fast Delivery · Honest Prices · Genuine Quality",
    customerSurface: "App Top Header",
  },
  {
    key: "searchPlaceholderText",
    label: "Search Box Hint Text",
    category: "branding",
    description: "Hint text shown inside the search bar before a customer types.",
    placeholder: "Search restaurants, dishes, or groceries...",
    customerSurface: "Home Search Bar",
  },
  {
    key: "deliveryLocationPrompt",
    label: "Delivery Address Bar Label",
    category: "branding",
    description: "Short label shown next to the customer's chosen delivery address.",
    placeholder: "Delivering fresh to your location",
    customerSurface: "Top Location Bar",
  },
  {
    key: "badgeGuaranteeText",
    label: "Hygiene & Safety Badge Text",
    category: "branding",
    description: "Trust badge shown below the search bar to highlight clean kitchens and sealed boxes.",
    placeholder: "100% Hygiene-Inspected Kitchens & Tamper-Evident Packaging",
    customerSurface: "Home Screen Trust Badge",
  },
  {
    key: "closedHoursNoticeText",
    label: "Night Closing Notice",
    category: "branding",
    description: "Message shown late at night when partner restaurants are closed for rest.",
    placeholder: "Partner kitchens are currently closed for the night. Ordering opens at 6:00 AM.",
    customerSurface: "Store Closed Notice",
    multiline: true,
  },

  // 2. Pricing & No-Surge Notices
  {
    key: "zeroSurgeWarningText",
    label: "No-Surge Price Promise Banner",
    category: "pricing",
    description: "Tells customers that delivery fees stay fair and fixed even during rain or peak hours.",
    placeholder: "Zero Surge Guarantee: Our delivery fees stay fixed during busy hours and rain.",
    customerSurface: "Cart & Checkout Banner",
    multiline: true,
  },
  {
    key: "surgeDisclaimerSubtext",
    label: "Honest Menu Price Notice",
    category: "pricing",
    description: "Explains that food prices on the app match the restaurant's real dine-in menu.",
    placeholder: "Menu prices match restaurant dine-in prices without hidden markups.",
    customerSurface: "Restaurant Menu Header",
    multiline: true,
  },
  {
    key: "transparentFeeHeader",
    label: "Bill Breakdown Title",
    category: "pricing",
    description: "Heading shown above the itemized delivery, packaging, and tax breakdown in the cart.",
    placeholder: "Clear Bill Breakdown",
    customerSurface: "Cart Bill Summary",
  },
  {
    key: "freeDeliveryThresholdNotice",
    label: "Free Delivery Offer Text",
    category: "pricing",
    description: "Message in the cart reminding customers how to get free delivery.",
    placeholder: "Free delivery unlocked for orders above ₹399",
    customerSurface: "Cart Progress Bar",
  },
  {
    key: "platformFeeDescription",
    label: "Platform Fee Note",
    category: "pricing",
    description: "One-line note explaining what the small platform fee covers.",
    placeholder: "Supports local delivery partner safety and live order support.",
    customerSurface: "Bill Summary Tooltip",
    multiline: true,
  },
  {
    key: "packagingFeeDisclaimer",
    label: "Packaging Charge Note",
    category: "pricing",
    description: "Explains that the packaging fee goes toward clean, food-grade containers.",
    placeholder: "Food-grade sealed container charge set by the restaurant.",
    customerSurface: "Bill Summary Packaging Row",
  },

  // 3. KingPay & Payment Messages
  {
    key: "kingPayOfflineMessage",
    label: "KingPay Maintenance Notice",
    category: "fintech",
    description: "Shown at checkout if KingPay wallet is paused while UPI and cards stay active.",
    placeholder: "KingPay wallet is under brief maintenance. UPI and cards are working normally.",
    customerSurface: "Checkout Payment Screen",
    multiline: true,
  },
  {
    key: "kingPayHeroHeadline",
    label: "KingPay Wallet Banner Title",
    category: "fintech",
    description: "Headline inviting customers to use the 1-tap KingPay wallet.",
    placeholder: "Instant 1-Tap Checkout with Zero Payment Failures",
    customerSurface: "Payment Methods Screen",
  },
  {
    key: "kingPayWalletBalanceLabel",
    label: "Wallet Balance Label",
    category: "fintech",
    description: "Label shown above the customer's available wallet money.",
    placeholder: "Available Wallet Balance",
    customerSurface: "Account Wallet Screen",
  },
  {
    key: "kingPayInstantCheckoutCta",
    label: "KingPay Pay Button Text",
    category: "fintech",
    description: "Text shown on the main payment button when KingPay is selected.",
    placeholder: "Pay with KingPay (1-Tap Checkout)",
    customerSurface: "Checkout Pay Button",
  },
  {
    key: "kingPayCashbackPromoText",
    label: "Wallet Cashback Offer Text",
    category: "fintech",
    description: "Message telling customers about wallet cashback earned on food orders.",
    placeholder: "Earn instant wallet cashback on every delivered meal order.",
    customerSurface: "Checkout Perks Card",
    multiline: true,
  },
  {
    key: "kingPayLaterNotice",
    label: "Pay Later Terms Note",
    category: "fintech",
    description: "Short note explaining the 15-day interest-free pay-later option.",
    placeholder: "0% interest 15-day bill settlement powered by regulated banking partners.",
    customerSurface: "Pay Later Info Box",
  },
  {
    key: "kingPaySecurityGuaranteeText",
    label: "Payment Security Footer Text",
    category: "fintech",
    description: "Reassures customers at checkout that all payments are encrypted and RBI-compliant.",
    placeholder: "100% Encrypted & RBI-Compliant Payment Security",
    customerSurface: "Checkout Bottom Note",
  },

  // 4. Order Status Messages
  {
    key: "cartEmptyHeadline",
    label: "Empty Cart Title",
    category: "orders",
    description: "Headline shown when a customer opens the cart before adding any food.",
    placeholder: "Your food basket is empty",
    customerSurface: "Empty Cart Screen",
  },
  {
    key: "cartEmptySubtext",
    label: "Empty Cart Subtitle",
    category: "orders",
    description: "Friendly line encouraging customers to browse nearby kitchens.",
    placeholder: "Explore fresh dishes from verified neighborhood kitchens.",
    customerSurface: "Empty Cart Screen",
  },
  {
    key: "orderConfirmationModalText",
    label: "Order Placed Thank-You Message",
    category: "orders",
    description: "Thank-you message shown as soon as an order is placed.",
    placeholder: "Thank you for ordering from a local restaurant!",
    customerSurface: "Order Confirmed Screen",
  },
  {
    key: "kitchenConfirmedStatusText",
    label: "Status: Kitchen is Cooking",
    category: "orders",
    description: "Status text shown when the restaurant accepts the order and starts cooking.",
    placeholder: "The kitchen has accepted your order and started cooking fresh food.",
    customerSurface: "Live Order Tracker Step 1",
  },
  {
    key: "riderAssignedStatusText",
    label: "Status: Rider Assigned",
    category: "orders",
    description: "Status text shown when a delivery rider is assigned to pick up the food.",
    placeholder: "A delivery partner has been assigned and is heading to the restaurant.",
    customerSurface: "Live Order Tracker Step 2",
  },
  {
    key: "riderEnRouteStatusText",
    label: "Status: Rider On the Way",
    category: "orders",
    description: "Status text shown when the rider picks up the order and rides toward the customer.",
    placeholder: "Your rider has picked up your food and is on the way to you.",
    customerSurface: "Live Order Tracker Step 3",
  },
  {
    key: "riderArrivedStatusText",
    label: "Status: Rider Arrived Outside",
    category: "orders",
    description: "Alert reminding the customer to share the delivery OTP code with the rider.",
    placeholder: "Your rider has arrived! Please share your delivery code to receive your order.",
    customerSurface: "Live Order Tracker Step 4",
  },
  {
    key: "orderCompletedSuccessText",
    label: "Status: Order Delivered",
    category: "orders",
    description: "Final message shown once the food is handed over to the customer.",
    placeholder: "Order delivered! Enjoy your meal.",
    customerSurface: "Order Completed Screen",
  },
  {
    key: "cancellationGracePeriodNotice",
    label: "60-Second Cancellation Rule Note",
    category: "orders",
    description: "Lets customers know they can cancel for free within 60 seconds of placing an order.",
    placeholder: "You can change or cancel your order within 60 seconds of confirmation.",
    customerSurface: "Order Tracking Footer",
  },

  // 5. Support & Food Safety Rules
  {
    key: "supportAssistantGreeting",
    label: "Help Chat Welcome Message",
    category: "compliance",
    description: "First message customers see when they open the in-app help chat.",
    placeholder: "Hi! Welcome to 24/7 OrderKing Help. How can we help with your order today?",
    customerSurface: "Help Chat Window",
    multiline: true,
  },
  {
    key: "supportEscalationButtonLabel",
    label: "Talk to Senior Support Button",
    category: "compliance",
    description: "Button text letting customers ask for a support manager right away.",
    placeholder: "Speak to a Support Manager",
    customerSurface: "Help Chat Button",
  },
  {
    key: "fssaiComplianceBannerText",
    label: "FSSAI Food Safety Footer Text",
    category: "compliance",
    description: "Confirms that all listed restaurants hold valid FSSAI food safety licenses.",
    placeholder: "All partner restaurants are verified with FSSAI food safety licenses.",
    customerSurface: "Restaurant Page Footer",
  },
  {
    key: "grievanceOfficerContactText",
    label: "Grievance Officer Contact Line",
    category: "compliance",
    description: "Official contact email required by Indian e-commerce consumer rules.",
    placeholder: "Grievance Officer: compliance@orderkingpay.com (Response within 24 hours)",
    customerSurface: "Legal & Help Screen",
  },
  {
    key: "refundGuaranteeNotice",
    label: "Missing Item Refund Promise",
    category: "compliance",
    description: "Reassures customers that missing or damaged items get refunded quickly.",
    placeholder: "Instant refund to your wallet if any item is missing or damaged.",
    customerSurface: "Help & Bill Screen",
    multiline: true,
  },

  // 6. Referrals & Offers
  {
    key: "referralHeadline",
    label: "Refer-a-Friend Title",
    category: "growth",
    description: "Headline inviting customers to share the app with friends for reward credits.",
    placeholder: "Invite Friends & Earn Free Meal Credits",
    customerSurface: "Refer & Earn Screen",
  },
  {
    key: "referralShareBodyTemplate",
    label: "WhatsApp Invite Message",
    category: "growth",
    description: "Pre-written message sent when a customer invites a friend on WhatsApp.",
    placeholder: "Order fresh local food with zero surge fees on OrderKing: {LINK}",
    customerSurface: "WhatsApp Share Message",
    multiline: true,
  },
  {
    key: "goldPassMembershipTitle",
    label: "Gold Pass Membership Title",
    category: "growth",
    description: "Title for the free-delivery and priority dispatch membership card.",
    placeholder: "Gold Pass: Free Delivery & Priority Rider Dispatch",
    customerSurface: "Membership Card",
  },
  {
    key: "dailySpecialsSectionTitle",
    label: "Daily Specials Row Heading",
    category: "growth",
    description: "Heading above the daily chef specials row on the home screen.",
    placeholder: "Today's Fresh Kitchen Specials",
    customerSurface: "Home Screen Specials Row",
  },

  // 7. Connected Services Labels
  {
    key: "connectorsHubTitle",
    label: "Connected Services Page Title",
    category: "connectors",
    description: "Main heading for the payment, tax, WhatsApp, and map connections screen.",
    placeholder: "Connected Services & Gateways",
    customerSurface: "Admin Connectors Header",
  },
  {
    key: "connectorsHubSubtitle",
    label: "Connected Services Page Subtitle",
    category: "connectors",
    description: "One-line summary explaining what external services are connected.",
    placeholder: "Manage Razorpay, WhatsApp alerts, FSSAI license checks, Mapbox maps, and ClearTax GST.",
    customerSurface: "Admin Connectors Subtitle",
    multiline: true,
  },
  {
    key: "connectorClearTaxTitle",
    label: "ClearTax GST Card Title",
    category: "connectors",
    description: "Title shown on the ClearTax GST tax calculation card.",
    placeholder: "Automated GST Calculation (ClearTax)",
    customerSurface: "ClearTax Card",
  },
  {
    key: "connectorClearTaxSubtitle",
    label: "ClearTax GST Card Description",
    category: "connectors",
    description: "Short description of how GST invoices and tax filings are handled.",
    placeholder: "Automatically calculates restaurant GST and prepares GST-ready order invoices.",
    customerSurface: "ClearTax Card",
    multiline: true,
  },
  {
    key: "connectorClearTaxToggleLabel",
    label: "ClearTax Switch Label",
    category: "connectors",
    description: "Label next to the on/off switch for ClearTax GST.",
    placeholder: "GST Calculation On",
    customerSurface: "ClearTax Card Switch",
  },
  {
    key: "connectorClearTaxTestBtnText",
    label: "ClearTax Test Button Text",
    category: "connectors",
    description: "Text on the button that checks the ClearTax connection.",
    placeholder: "Test ClearTax Connection",
    customerSurface: "ClearTax Card Button",
  },
  {
    key: "connectorClearTaxPolicyTitle",
    label: "ClearTax Rule Box Heading",
    category: "connectors",
    description: "Heading for the GST invoice rule box.",
    placeholder: "GST Invoice Verification",
    customerSurface: "ClearTax Policy Box",
  },
  {
    key: "connectorClearTaxPolicyNotice",
    label: "ClearTax Rule Box Text",
    category: "connectors",
    description: "Explains that GST numbers are checked before generating tax invoices.",
    placeholder: "Creates GST-compliant invoices on every completed order and checks restaurant GSTIN.",
    customerSurface: "ClearTax Policy Box",
    multiline: true,
  },
  {
    key: "connectorClearTaxWebhookNotice",
    label: "ClearTax Monthly Sync Note",
    category: "connectors",
    description: "Explains how monthly GST return summaries are synced.",
    placeholder: "Syncs monthly GSTR-1 and GSTR-3B tax summaries automatically.",
    customerSurface: "ClearTax Webhook Note",
    multiline: true,
  },
  {
    key: "connectorWhatsappMarketingTitle",
    label: "WhatsApp Offers Card Title",
    category: "connectors",
    description: "Title shown on the WhatsApp promotional offers card.",
    placeholder: "WhatsApp Promotional Offers",
    customerSurface: "WhatsApp Offers Card",
  },
  {
    key: "connectorWhatsappMarketingSubtitle",
    label: "WhatsApp Offers Card Description",
    category: "connectors",
    description: "Explains how festival and discount offers are sent on WhatsApp.",
    placeholder: "Send festival deals and discount coupons to opted-in customers on WhatsApp.",
    customerSurface: "WhatsApp Offers Card",
    multiline: true,
  },
  {
    key: "connectorWhatsappMarketingToggleLabel",
    label: "WhatsApp Offers Switch Label",
    category: "connectors",
    description: "Label next to the on/off switch for WhatsApp offers.",
    placeholder: "WhatsApp Offers On",
    customerSurface: "WhatsApp Offers Switch",
  },
  {
    key: "connectorWhatsappMarketingTestBtnText",
    label: "WhatsApp Offers Test Button",
    category: "connectors",
    description: "Button text for sending a test WhatsApp message.",
    placeholder: "Send Test Message",
    customerSurface: "WhatsApp Offers Button",
  },
  {
    key: "connectorWhatsappMarketingPolicyTitle",
    label: "WhatsApp Timing Rule Heading",
    category: "connectors",
    description: "Heading for the daytime-only messaging rule.",
    placeholder: "Daytime Messaging & Opt-Out Rule",
    customerSurface: "WhatsApp Rule Box",
  },
  {
    key: "connectorWhatsappMarketingPolicyNotice",
    label: "WhatsApp Timing Rule Text",
    category: "connectors",
    description: "Confirms offers are only sent between 10 AM and 9 PM per TRAI rules.",
    placeholder: "Promotional messages are only sent between 10:00 AM and 9:00 PM as required by TRAI.",
    customerSurface: "WhatsApp Rule Box",
    multiline: true,
  },
  {
    key: "connectorWhatsappMarketingOptInNotice",
    label: "WhatsApp STOP Reply Rule",
    category: "connectors",
    description: "Explains that replying STOP immediately unsubscribes a customer.",
    placeholder: "Customers who reply STOP are immediately removed from future offer lists.",
    customerSurface: "WhatsApp Opt-Out Note",
    multiline: true,
  },
  {
    key: "connectorRazorpayTitle",
    label: "Razorpay Payments Card Title",
    category: "connectors",
    description: "Title for the Razorpay UPI and card payment gateway card.",
    placeholder: "Razorpay UPI & Card Payments",
    customerSurface: "Razorpay Card",
  },
  {
    key: "connectorRazorpaySubtitle",
    label: "Razorpay Payments Description",
    category: "connectors",
    description: "Short explanation of UPI, cards, and restaurant payouts via Razorpay.",
    placeholder: "Processes customer UPI, debit/credit cards, and direct restaurant bank payouts.",
    customerSurface: "Razorpay Card",
    multiline: true,
  },
  {
    key: "connectorWhatsappTitle",
    label: "WhatsApp Order Alerts Title",
    category: "connectors",
    description: "Title for the WhatsApp order receipt and OTP alert service.",
    placeholder: "WhatsApp Order Receipts & OTP Alerts",
    customerSurface: "WhatsApp Alerts Card",
  },
  {
    key: "connectorWhatsappSubtitle",
    label: "WhatsApp Order Alerts Description",
    category: "connectors",
    description: "Short explanation of order receipts and login codes sent on WhatsApp.",
    placeholder: "Sends instant order bills, delivery OTPs, and kitchen alerts over WhatsApp.",
    customerSurface: "WhatsApp Alerts Card",
    multiline: true,
  },
  {
    key: "connectorFssaiTitle",
    label: "FSSAI License Check Title",
    category: "connectors",
    description: "Title for the FSSAI food license verification card.",
    placeholder: "FSSAI Food License Verification",
    customerSurface: "FSSAI Card",
  },
  {
    key: "connectorFssaiSubtitle",
    label: "FSSAI License Check Description",
    category: "connectors",
    description: "Explains how 14-digit FSSAI restaurant licenses are verified.",
    placeholder: "Checks 14-digit restaurant FSSAI food safety licenses before activating menus.",
    customerSurface: "FSSAI Card",
    multiline: true,
  },
  {
    key: "connectorFssaiPolicyTitle",
    label: "FSSAI License Rule Heading",
    category: "connectors",
    description: "Heading for the mandatory food license rule.",
    placeholder: "Mandatory Food Safety License Rule",
    customerSurface: "FSSAI Policy Box",
  },
  {
    key: "connectorFssaiPolicyNotice",
    label: "FSSAI License Rule Text",
    category: "connectors",
    description: "Explains that kitchens without an active FSSAI license cannot take orders.",
    placeholder: "Blocks restaurants from taking customer orders if their 14-digit FSSAI license is expired.",
    customerSurface: "FSSAI Policy Box",
    multiline: true,
  },
  {
    key: "connectorMapboxTitle",
    label: "Mapbox Live Maps Title",
    category: "connectors",
    description: "Title for the Mapbox delivery distance and route map service.",
    placeholder: "Mapbox Delivery Maps & Distance Calculator",
    customerSurface: "Mapbox Card",
  },
  {
    key: "connectorMapboxSubtitle",
    label: "Mapbox Live Maps Description",
    category: "connectors",
    description: "Short explanation of road distance calculation and live rider map pins.",
    placeholder: "Calculates road distance between kitchens and customers and displays live rider pins.",
    customerSurface: "Mapbox Card",
    multiline: true,
  },
];

type CategoryId =
  | "banners"
  | "all"
  | "algorithm"
  | "branding"
  | "pricing"
  | "fintech"
  | "orders"
  | "compliance"
  | "growth"
  | "connectors";

export function EcosystemCMS() {
  const [formData, setFormData] = useState<EcosystemCmsConfig>(DEFAULT_ECOSYSTEM_CMS);
  const [initialData, setInitialData] = useState<EcosystemCmsConfig>(DEFAULT_ECOSYSTEM_CMS);

  const [banners, setBanners] = useState<CustomAppBanner[]>(DEFAULT_CUSTOM_BANNERS);
  const [initialBanners, setInitialBanners] = useState<CustomAppBanner[]>(DEFAULT_CUSTOM_BANNERS);

  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("banners");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [previewFieldKey, setPreviewFieldKey] =
    useState<keyof EcosystemCmsConfig>("homepageHeroText");

  // Load config and banners on mount
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);

        // 1. Load custom banners from localStorage
        try {
          const savedBanners = localStorage.getItem(BANNERS_STORAGE_KEY);
          if (savedBanners) {
            const parsed = JSON.parse(savedBanners);
            if (Array.isArray(parsed) && parsed.length > 0 && mounted) {
              setBanners(parsed);
              setInitialBanners(parsed);
            }
          }
        } catch {
          // Ignore storage error
        }

        // 2. Load CMS strings from localStorage + server
        let localCms: Partial<EcosystemCmsConfig> = {};
        try {
          const savedCms = localStorage.getItem(CMS_STORAGE_KEY);
          if (savedCms) localCms = JSON.parse(savedCms);
        } catch {
          // Ignore
        }

        let serverData: EcosystemCmsConfig | null = null;
        try {
          const res = await loadEcosystemCmsFn();
          if (res && res.ok && res.data) {
            serverData = res.data;
          }
        } catch {
          const resp = await fetch("/api/v1/admin/settings");
          if (resp.ok) {
            const json = await resp.json();
            if (json.cms) serverData = json.cms;
          }
        }

        if (mounted) {
          const merged = {
            ...DEFAULT_ECOSYSTEM_CMS,
            ...localCms,
            ...(serverData || {}),
          };
          setFormData(merged);
          setInitialData(merged);
        }
      } catch (err) {
        console.error("Error loading banners & announcements:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredFields = useMemo(() => {
    return FIELD_DEFINITIONS.filter((f) => {
      const matchCat =
        selectedCategory === "all" ||
        selectedCategory === "banners" ||
        f.category === selectedCategory;
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

  const hasChanges = useMemo(() => {
    return (
      JSON.stringify(formData) !== JSON.stringify(initialData) ||
      JSON.stringify(banners) !== JSON.stringify(initialBanners)
    );
  }, [formData, initialData, banners, initialBanners]);

  const changedCount = useMemo(() => {
    let count = 0;
    for (const def of FIELD_DEFINITIONS) {
      if (formData[def.key] !== initialData[def.key]) count++;
    }
    if (JSON.stringify(banners) !== JSON.stringify(initialBanners)) {
      count += 1;
    }
    return count;
  }, [formData, initialData, banners, initialBanners]);

  const handleChange = (key: keyof EcosystemCmsConfig, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetField = (key: keyof EcosystemCmsConfig) => {
    setFormData((prev) => ({ ...prev, [key]: DEFAULT_ECOSYSTEM_CMS[key] }));
  };

  const handleClearField = (key: keyof EcosystemCmsConfig) => {
    setFormData((prev) => ({ ...prev, [key]: "" }));
  };

  const updateBanner = (id: string, updates: Partial<CustomAppBanner>) => {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const addBanner = () => {
    const nextNum = banners.length + 1;
    setBanners((prev) => [
      ...prev,
      {
        id: `banner-${Date.now()}`,
        title: `New Offer Banner #${nextNum}`,
        subtitle: "Tap to view this special offer in the app.",
        buttonText: "View Offer",
        linkUrl: "/offers",
        bgColor: "#E23744",
        enabled: true,
      },
    ]);
  };

  const removeBanner = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatusMessage(null);

      // 1. Save to localStorage
      try {
        localStorage.setItem(BANNERS_STORAGE_KEY, JSON.stringify(banners));
        localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(formData));
      } catch {
        // Ignore storage error
      }

      // 2. Save via server function or REST API
      let success = false;
      try {
        const res = await saveEcosystemCmsFn({ data: { cms: formData } });
        if (res && res.ok) success = true;
      } catch {
        // Fallback below
      }

      try {
        const resp = await fetch("/api/v1/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cms: formData, banners }),
        });
        if (resp.ok) success = true;
      } catch {
        // Handled by success check
      }

      if (success) {
        setInitialData(formData);
        setInitialBanners(banners);
        setStatusMessage({
          type: "success",
          text: `Saved! Your app banners and announcements are now live for customers.`,
        });
      } else {
        setStatusMessage({
          type: "error",
          text: "Could not save changes to the server. Please check your connection and try again.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Error while saving banners and announcements.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetAllToOriginal = () => {
    setFormData(initialData);
    setBanners(initialBanners);
    setStatusMessage({ type: "info", text: "Unsaved changes were undone." });
  };

  const handleResetAllToSystemDefaults = () => {
    setFormData(DEFAULT_ECOSYSTEM_CMS);
    setBanners(DEFAULT_CUSTOM_BANNERS);
    setStatusMessage({
      type: "info",
      text: "Restored default banners and messages. Click 'Save Banners & Text (1-Click)' to publish.",
    });
  };

  const categories = [
    {
      id: "banners" as const,
      label: "Promo Banners",
      count: banners.length,
      icon: Megaphone,
    },
    {
      id: "all" as const,
      label: "All App Text",
      count: FIELD_DEFINITIONS.length,
      icon: Layers,
    },
    {
      id: "branding" as const,
      label: "Home & Header",
      count: FIELD_DEFINITIONS.filter((f) => f.category === "branding").length,
      icon: Sparkles,
    },
    {
      id: "pricing" as const,
      label: "Price & No-Surge",
      count: FIELD_DEFINITIONS.filter((f) => f.category === "pricing").length,
      icon: ShieldCheck,
    },
    {
      id: "fintech" as const,
      label: "KingPay Wallet",
      count: FIELD_DEFINITIONS.filter((f) => f.category === "fintech").length,
      icon: CreditCard,
    },
    {
      id: "orders" as const,
      label: "Order Tracking",
      count: FIELD_DEFINITIONS.filter((f) => f.category === "orders").length,
      icon: Truck,
    },
    {
      id: "compliance" as const,
      label: "Help & FSSAI",
      count: FIELD_DEFINITIONS.filter((f) => f.category === "compliance").length,
      icon: AlertTriangle,
    },
    {
      id: "growth" as const,
      label: "Referrals & Gold",
      count: FIELD_DEFINITIONS.filter((f) => f.category === "growth").length,
      icon: FileText,
    },
    {
      id: "connectors" as const,
      label: "Gateway Labels",
      count: FIELD_DEFINITIONS.filter((f) => f.category === "connectors").length,
      icon: Cpu,
    },
    {
      id: "algorithm" as const,
      label: "Delivery Rules",
      count: 4,
      icon: SlidersHorizontal,
    },
  ];

  const activeBannersCount = banners.filter((b) => b.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 shrink-0">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                App Banners &amp; Announcements
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Create promotional banners, edit home screen headlines, and customize every customer notice.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetAllToSystemDefaults}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Defaults
            </button>

            {hasChanges && (
              <button
                type="button"
                onClick={handleResetAllToOriginal}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Undo Changes
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {saving
                ? "Saving..."
                : hasChanges
                ? `Save Banners & Text (${changedCount})`
                : "Save Banners & Text (1-Click)"}
            </button>
          </div>
        </div>

        {/* Clear Current Result & What Action To Take */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Current Result
            </div>
            <p className="text-xs font-semibold text-slate-900 mt-1">
              {activeBannersCount} promo banners are switched ON, home headline is &ldquo;
              {formData.homepageHeroText}&rdquo;, and {FIELD_DEFINITIONS.length} app messages are configured.
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              What Action To Take
            </div>
            <p className="text-xs font-medium text-emerald-950 mt-1">
              {hasChanges
                ? "You have unsaved banner or text edits—click 'Save Banners & Text' in the top right to publish."
                : "Edit any promo banner title, link, color, or app announcement below and click 'Save Banners & Text (1-Click)'."}
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`flex items-center justify-between rounded-xl border p-3.5 text-xs font-medium ${
              statusMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : statusMessage.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {statusMessage.type === "error" && <AlertTriangle className="h-4 w-4 shrink-0" />}
              {statusMessage.type === "info" && <HelpCircle className="h-4 w-4 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-xs font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {selectedCategory === "algorithm" ? (
        <AlgorithmSettings compact />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Center Section: Banners Manager + Text Fields */}
          <div className="lg:col-span-8 space-y-6">
            {/* Interactive Promo Banners Builder */}
            {(selectedCategory === "banners" || selectedCategory === "all") && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-emerald-600" />
                      Home Screen Promo Banners (Title, Link &amp; Color)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Add or edit promotional offer cards shown at the top of the customer app.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addBanner}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add New Banner
                  </button>
                </div>

                <div className="space-y-4">
                  {banners.map((banner, index) => (
                    <div
                      key={banner.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            Banner #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateBanner(banner.id, { enabled: !banner.enabled })}
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                              banner.enabled
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {banner.enabled ? "ACTIVE ON APP" : "HIDDEN"}
                          </button>
                        </div>

                        {banners.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBanner(banner.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Banner Headline
                          </label>
                          <input
                            type="text"
                            value={banner.title}
                            onChange={(e) => updateBanner(banner.id, { title: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Banner Subtitle
                          </label>
                          <input
                            type="text"
                            value={banner.subtitle}
                            onChange={(e) => updateBanner(banner.id, { subtitle: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Button Label &amp; Tap Link
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={banner.buttonText}
                              onChange={(e) =>
                                updateBanner(banner.id, { buttonText: e.target.value })
                              }
                              placeholder="Order Now"
                              className="w-28 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900"
                            />
                            <div className="relative flex-1">
                              <LinkIcon className="h-3 w-3 text-slate-400 absolute left-2.5 top-2" />
                              <input
                                type="text"
                                value={banner.linkUrl}
                                onChange={(e) =>
                                  updateBanner(banner.id, { linkUrl: e.target.value })
                                }
                                placeholder="/offers"
                                className="w-full pl-7 pr-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 bg-white text-slate-900"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Banner Background Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={banner.bgColor}
                              onChange={(e) =>
                                updateBanner(banner.id, { bgColor: e.target.value.toUpperCase() })
                              }
                              className="h-8 w-10 rounded cursor-pointer border border-slate-300"
                            />
                            <input
                              type="text"
                              value={banner.bgColor}
                              onChange={(e) =>
                                updateBanner(banner.id, { bgColor: e.target.value.toUpperCase() })
                              }
                              className="flex-1 px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white text-slate-900"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Toolbar for App Text & Announcements */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search any app banner, notice, or message (e.g. 'surge', 'wallet', 'FSSAI')..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-14 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Text Input Cards List */}
            {loading ? (
              <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <span className="text-xs text-slate-500">
                  Loading app banners and announcements...
                </span>
              </div>
            ) : filteredFields.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
                <p className="text-sm font-semibold text-slate-800">No matching messages found</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
                >
                  Show All App Messages
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
                      className={`rounded-2xl border transition-all p-5 shadow-xs bg-white ${
                        isSelectedForPreview
                          ? "border-emerald-500 ring-2 ring-emerald-500/15"
                          : isModified
                          ? "border-amber-400 bg-amber-50/20"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="text-sm font-bold text-slate-900">{field.label}</label>
                          {isModified ? (
                            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              Unsaved Edit
                            </span>
                          ) : !isDefault ? (
                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              Customized
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewFieldKey(field.key)}
                            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold cursor-pointer ${
                              isSelectedForPreview
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            <Eye className="h-3 w-3" />
                            Preview
                          </button>

                          {!isDefault && (
                            <button
                              type="button"
                              onClick={() => handleResetField(field.key)}
                              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Default
                            </button>
                          )}

                          {currentValue && (
                            <button
                              type="button"
                              onClick={() => handleClearField(field.key)}
                              className="rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 mb-3">{field.description}</p>

                      {field.multiline ? (
                        <textarea
                          rows={2}
                          value={currentValue}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                        />
                      ) : (
                        <input
                          type="text"
                          value={currentValue}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                        />
                      )}

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          Shown on: <strong className="text-slate-600">{field.customerSurface}</strong>
                        </span>
                        <span className="font-mono text-[10px]">{currentValue.length} chars</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Section: Live Customer Phone Preview */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Live Phone Preview
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                  LIVE TEXT
                </span>
              </div>

              <p className="text-xs text-slate-500">
                See how your active banners and announcements look inside the customer mobile app.
              </p>

              {/* Phone Frame */}
              <div className="mx-auto max-w-[280px] rounded-3xl border-4 border-slate-800 bg-slate-950 p-3 shadow-xl text-slate-100 font-sans">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2 px-1">
                  <span>09:41</span>
                  <span className="font-bold text-white">OrderKing</span>
                  <span>5G</span>
                </div>

                <div className="space-y-2.5 py-1">
                  {/* Brand Header */}
                  <div className="rounded-xl bg-slate-900 border border-slate-800 p-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-400">
                        {formData.brandTagline || "Fast Delivery · Honest Prices"}
                      </span>
                      <span className="text-[9px] text-slate-400">Sribhumi</span>
                    </div>
                    <div className="text-[10px] text-slate-300">
                      📍 {formData.deliveryLocationPrompt || "Delivering fresh to your location"}
                    </div>
                  </div>

                  {/* Active Promo Banners */}
                  {banners
                    .filter((b) => b.enabled)
                    .slice(0, 2)
                    .map((b) => (
                      <div
                        key={b.id}
                        className="rounded-xl p-2.5 text-white space-y-1"
                        style={{ backgroundColor: b.bgColor }}
                      >
                        <div className="text-xs font-extrabold leading-tight">{b.title}</div>
                        <div className="text-[9px] opacity-90 leading-snug">{b.subtitle}</div>
                        <div className="pt-1 flex items-center justify-between">
                          <span className="inline-block rounded bg-black/25 px-2 py-0.5 text-[9px] font-bold">
                            {b.buttonText}
                          </span>
                          <span className="text-[8px] font-mono opacity-75">{b.linkUrl}</span>
                        </div>
                      </div>
                    ))}

                  {/* Hero Showcase */}
                  <div className="rounded-xl bg-slate-900 border border-slate-800 p-2.5 space-y-1">
                    <h4 className="text-xs font-bold leading-tight text-white">
                      {formData.homepageHeroText || "Home Headline"}
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-snug">
                      {formData.homepageHeroSubtitle || "Home Subtitle"}
                    </p>
                  </div>

                  {/* Zero Surge Promise Card */}
                  <div className="rounded-xl bg-emerald-950/60 border border-emerald-800/50 p-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                      <ShieldCheck className="h-3 w-3 shrink-0" />
                      <span>NO-SURGE PROMISE</span>
                    </div>
                    <p className="text-[9px] text-emerald-200 leading-tight">
                      {formData.zeroSurgeWarningText}
                    </p>
                  </div>

                  {/* Regulatory Footer */}
                  <div className="text-center pt-1 text-[8px] text-slate-500">
                    {formData.fssaiComplianceBannerText}
                  </div>
                </div>
              </div>

              {/* Selected Text Preview Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Selected Text Preview
                </span>
                <div className="text-xs font-bold text-slate-800">
                  {FIELD_DEFINITIONS.find((f) => f.key === previewFieldKey)?.label}
                </div>
                <p className="text-xs font-mono text-emerald-800 bg-white p-2 rounded-lg border border-slate-200 break-words">
                  {formData[previewFieldKey] || "[Currently empty]"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

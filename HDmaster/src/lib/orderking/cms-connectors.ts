import { getSql } from "@/lib/db";

export interface EcosystemCmsConfig {
  // 1. Homepage & Global Branding
  homepageHeroText: string;
  homepageHeroSubtitle: string;
  brandTagline: string;
  searchPlaceholderText: string;
  deliveryLocationPrompt: string;
  badgeGuaranteeText: string;
  closedHoursNoticeText: string;

  // 2. Surge Protection & Competitive Pricing
  zomatoSurgeWarningText: string;
  surgeDisclaimerSubtext: string;
  transparentFeeHeader: string;
  freeDeliveryThresholdNotice: string;
  platformFeeDescription: string;
  packagingFeeDisclaimer: string;

  // 3. KingPay Fintech & Payment Switch
  kingPayOfflineMessage: string;
  kingPayHeroHeadline: string;
  kingPayWalletBalanceLabel: string;
  kingPayInstantCheckoutCta: string;
  kingPayCashbackPromoText: string;
  kingPayLaterNotice: string;
  kingPaySecurityGuaranteeText: string;

  // 4. Cart, Checkout & Order Fulfillment Lifecycle
  cartEmptyHeadline: string;
  cartEmptySubtext: string;
  orderConfirmationModalText: string;
  kitchenConfirmedStatusText: string;
  riderAssignedStatusText: string;
  riderEnRouteStatusText: string;
  riderArrivedStatusText: string;
  orderCompletedSuccessText: string;
  cancellationGracePeriodNotice: string;

  // 5. Support, Safety, FSSAI & Grievance
  supportAssistantGreeting: string;
  supportEscalationButtonLabel: string;
  fssaiComplianceBannerText: string;
  grievanceOfficerContactText: string;
  refundGuaranteeNotice: string;

  // 6. Growth, Referrals & Loyalty
  referralHeadline: string;
  referralShareBodyTemplate: string;
  goldPassMembershipTitle: string;
  dailySpecialsSectionTitle: string;

  // 7. Connectors Hub & Global Integrations Copy
  connectorsHubTitle: string;
  connectorsHubSubtitle: string;
  connectorRazorpayTitle: string;
  connectorRazorpaySubtitle: string;
  connectorWhatsappTitle: string;
  connectorWhatsappSubtitle: string;
  connectorFssaiTitle: string;
  connectorFssaiSubtitle: string;
  connectorFssaiPolicyTitle: string;
  connectorFssaiPolicyNotice: string;
  connectorMapboxTitle: string;
  connectorMapboxSubtitle: string;
  connectorClearTaxTitle: string;
  connectorClearTaxSubtitle: string;
  connectorClearTaxToggleLabel: string;
  connectorClearTaxTestBtnText: string;
  connectorClearTaxPolicyTitle: string;
  connectorClearTaxPolicyNotice: string;
  connectorClearTaxWebhookNotice: string;
  connectorWhatsappMarketingTitle: string;
  connectorWhatsappMarketingSubtitle: string;
  connectorWhatsappMarketingToggleLabel: string;
  connectorWhatsappMarketingTestBtnText: string;
  connectorWhatsappMarketingPolicyTitle: string;
  connectorWhatsappMarketingPolicyNotice: string;
  connectorWhatsappMarketingOptInNotice: string;

  // 8. B2B Franchise Lead Generation (Apollo / LinkedIn API)
  connectorB2bLeadGenTitle: string;
  connectorB2bLeadGenSubtitle: string;
  connectorB2bLeadGenToggleLabel: string;
  connectorB2bLeadGenTestBtnText: string;
  connectorB2bLeadGenPolicyTitle: string;
  connectorB2bLeadGenPolicyNotice: string;
  connectorB2bLeadGenWebhookNotice: string;

  // 9. Global USD Payment Router (Stripe Atlas Delaware C-Corp)
  connectorStripeAtlasTitle: string;
  connectorStripeAtlasSubtitle: string;
  connectorStripeAtlasToggleLabel: string;
  connectorStripeAtlasTestBtnText: string;
  connectorStripeAtlasPolicyTitle: string;
  connectorStripeAtlasPolicyNotice: string;
  connectorStripeAtlasWebhookNotice: string;

  // 10. Global Cross-Border Routing (Payoneer Multi-Currency Virtual Routing)
  connectorPayoneerTitle: string;
  connectorPayoneerSubtitle: string;
  connectorPayoneerToggleLabel: string;
  connectorPayoneerTestBtnText: string;
  connectorPayoneerPolicyTitle: string;
  connectorPayoneerPolicyNotice: string;
  connectorPayoneerWebhookNotice: string;

  // 11. AI Telemarketing Connector (Bland.ai / Twilio Voice Autonomous Restaurant Pitching)
  connectorTelemarketingTitle: string;
  connectorTelemarketingSubtitle: string;
  connectorTelemarketingToggleLabel: string;
  connectorTelemarketingTestBtnText: string;
  connectorTelemarketingPolicyTitle: string;
  connectorTelemarketingPolicyNotice: string;
  connectorTelemarketingWebhookNotice: string;
}

export const DEFAULT_ECOSYSTEM_CMS: EcosystemCmsConfig = {
  // 1. Homepage & Global Branding
  homepageHeroText: "From local master kitchens to your doorstep.",
  homepageHeroSubtitle: "Authentic culinary selections, zero artificial markup, and community-first delivery.",
  brandTagline: "Have It Your Way",
  searchPlaceholderText: "Search restaurants, regional specialties, dishes, or groceries...",
  deliveryLocationPrompt: "Delivering fresh to your location",
  badgeGuaranteeText: "100% Hygiene-Inspected Kitchens & Tamper-Evident Packaging",
  closedHoursNoticeText: "Partner kitchens are currently offline for resting hours. Dispatch opens at 06:00 AM.",

  // 2. Surge Protection & Competitive Pricing
  zomatoSurgeWarningText: "Zero Dynamic Surge Guarantee: Our delivery fees are strictly fixed regardless of peak hours or bad weather.",
  surgeDisclaimerSubtext: "Unlike aggregator surge models, restaurant menu rates remain authentic without inflated commission markups.",
  transparentFeeHeader: "Complete Operational Fee Transparency",
  freeDeliveryThresholdNotice: "Free delivery unlocked for orders above ₹399",
  platformFeeDescription: "Direct operational pass-through fee supporting local rider partner dispatch safety.",
  packagingFeeDisclaimer: "Mandatory food-grade tamper-evident container packaging tariff.",

  // 3. KingPay Fintech & Payment Switch
  kingPayOfflineMessage: "KingPay digital wallet switch is undergoing scheduled reserve settlement maintenance. Instant UPI and card rails remain fully active.",
  kingPayHeroHeadline: "Instant 1-Tap Checkout with Zero Payment Failure Rate",
  kingPayWalletBalanceLabel: "Available Sovereign Balance",
  kingPayInstantCheckoutCta: "Pay with KingPay (1-Tap Instant Checkout)",
  kingPayCashbackPromoText: "Earn instant cash rewards deposited directly into your verified wallet on every meal order.",
  kingPayLaterNotice: "0% Interest 15-Day Flexible Credit Line powered by RBI-regulated banking partners.",
  kingPaySecurityGuaranteeText: "PCI-DSS Level 1 v4.0 & RBI Compliant End-to-End Encrypted Settlement Vault",

  // 4. Cart, Checkout & Order Fulfillment Lifecycle
  cartEmptyHeadline: "Your order basket is currently empty",
  cartEmptySubtext: "Discover authentic culinary specialties from verified neighborhood kitchens.",
  orderConfirmationModalText: "Thank you for supporting independent local restaurants.",
  kitchenConfirmedStatusText: "Kitchen has accepted your order and initiated fresh culinary preparation.",
  riderAssignedStatusText: "Delivery partner has been assigned and is heading to the pickup station.",
  riderEnRouteStatusText: "Rider is en route to your doorstep with insulated thermal temperature control.",
  riderArrivedStatusText: "Rider partner has arrived outside. Please present your delivery verification code.",
  orderCompletedSuccessText: "Order successfully delivered. Enjoy your meal!",
  cancellationGracePeriodNotice: "Orders can be amended or cancelled within 60 seconds of merchant confirmation.",

  // 5. Support, Safety, FSSAI & Grievance
  supportAssistantGreeting: "Welcome to 24/7 Enterprise Customer Care. How may we assist your dining experience today?",
  supportEscalationButtonLabel: "Request Executive Escalation Officer",
  fssaiComplianceBannerText: "Food Safety and Standards Authority of India (FSSAI) verified merchant network.",
  grievanceOfficerContactText: "Designated Grievance Redressal Officer: compliance@orderkingpay.com (SLA 24 Hours)",
  refundGuaranteeNotice: "100% Instant Resolution Guarantee: Immediate wallet reimbursement for missing or compromised items.",

  // 6. Growth, Referrals & Loyalty
  referralHeadline: "Invite Neighborhood Friends & Earn Cash Credits",
  referralShareBodyTemplate: "Order authentic food with zero markup and zero surge pricing on OrderKing: {LINK}",
  goldPassMembershipTitle: "Gold Priority Pass: Zero-Surge Guarantee & Priority Dispatch Allocation",
  dailySpecialsSectionTitle: "Curated Chef Specials & Direct-from-Kitchen Selections",

  // 7. Connectors Hub & Global Integrations Copy
  connectorsHubTitle: "Plugin Switchboard & External Connectors",
  connectorsHubSubtitle: "Institutional integration management. Securely configure Razorpay payment rails, WhatsApp Business API, FSSAI regulatory verification, Mapbox geospatial telemetry, ClearTax automated GST calculation, and Automated WhatsApp Marketing.",
  connectorRazorpayTitle: "Razorpay Payment Gateway Integration",
  connectorRazorpaySubtitle: "Handles instant customer UPI, credit/debit card tokenization, auto-capture, and merchant settlement transfers.",
  connectorWhatsappTitle: "WhatsApp Business API Connector",
  connectorWhatsappSubtitle: "Transmits real-time order receipts, OTP delivery handshakes, and merchant alerts via Meta Cloud API or Gupshup.",
  connectorFssaiTitle: "FSSAI Government Regulatory Verification Gateway",
  connectorFssaiSubtitle: "Direct integration with the FoSCoS Government Portal. Verifies 14-digit restaurant food licenses and enforces statutory onboarding rules.",
  connectorFssaiPolicyTitle: "Strict Regulatory Onboarding Gate",
  connectorFssaiPolicyNotice: "Automatically block merchant kitchens from taking live customer orders if their 14-digit FSSAI license is absent, lapsed, or rejected by the FoSCoS gateway.",
  connectorMapboxTitle: "Mapbox Geospatial Matrix & Routing Telemetry",
  connectorMapboxSubtitle: "Powers multi-point distance matrix calculations, live congestion avoidance, and real-time rider GPS vector estimation.",
  connectorClearTaxTitle: "Automated Tax Calculation (ClearTax)",
  connectorClearTaxSubtitle: "Statutory automated GST calculation, real-time e-invoicing, reverse charge determination, and seamless automated tax reconciliation for compliant restaurant operations.",
  connectorClearTaxToggleLabel: "Tax Engine Active",
  connectorClearTaxTestBtnText: "Test ClearTax Diagnostic",
  connectorClearTaxPolicyTitle: "Statutory GST & E-Invoicing Enforcement",
  connectorClearTaxPolicyNotice: "Generates IRN & QR-coded e-invoices instantly via ClearTax APIs upon order fulfillment, verifying restaurant GSTIN active status.",
  connectorClearTaxWebhookNotice: "ClearTax GSTN Reconciliation Webhook: Automatically imports GSTR-1 & GSTR-3B monthly outward supply filings.",
  connectorWhatsappMarketingTitle: "Automated WhatsApp Marketing",
  connectorWhatsappMarketingSubtitle: "High-conversion automated customer re-engagement, promotional drops, festival banquet offers, and personalized loyalty cart recovery campaigns with full TRAI/DND compliance.",
  connectorWhatsappMarketingToggleLabel: "Marketing Engine Active",
  connectorWhatsappMarketingTestBtnText: "Test Broadcast Dispatch",
  connectorWhatsappMarketingPolicyTitle: "Strict DND & Anti-Spam Marketing Policy",
  connectorWhatsappMarketingPolicyNotice: "Ensures all automated promotional broadcasts respect 10:00 AM - 09:00 PM regulatory delivery windows and honour instant opt-out requests without exception.",
  connectorWhatsappMarketingOptInNotice: "Automatic Unsubscribe Handler: Customers replying STOP or UNSUBSCRIBE are instantly purged from promotional broadcast audiences.",

  // 8. B2B Franchise Lead Generation (Apollo / LinkedIn API)
  connectorB2bLeadGenTitle: "B2B Franchise Lead Generation (Apollo / LinkedIn API)",
  connectorB2bLeadGenSubtitle: "Enterprise B2B prospecting rail. Automatically query Apollo.io and LinkedIn Sales Navigator to identify multi-unit restaurant operators and franchise owners across Saudi Arabia and the United States to sell the SaaS engine directly.",
  connectorB2bLeadGenToggleLabel: "Lead Gen Engine Active",
  connectorB2bLeadGenTestBtnText: "Verify Prospecting Handshake",
  connectorB2bLeadGenPolicyTitle: "High-Ticket Enterprise Outreach & Compliance Guard",
  connectorB2bLeadGenPolicyNotice: "Automated prospecting strictly targeting enterprise Multi-Unit Franchisees & C-Suite restaurant groups. Compliant with US CAN-SPAM and Saudi CITC electronic communications frameworks.",
  connectorB2bLeadGenWebhookNotice: "Apollo & LinkedIn Lead Enrichment Ingestion Webhook: Receives enriched franchise profiles, verified direct dials, and corporate emails.",

  // 9. Global USD Payment Router (Stripe Atlas Delaware C-Corp)
  connectorStripeAtlasTitle: "Stripe Atlas (USD B2B SaaS)",
  connectorStripeAtlasSubtitle: "Delaware C-Corp global USD merchant rail. Powers recurring B2B SaaS licensing, monthly franchise subscriptions, automated W-8BEN/W-9 invoices, and Stripe Billing across US and overseas operators.",
  connectorStripeAtlasToggleLabel: "Stripe Atlas Router Active",
  connectorStripeAtlasTestBtnText: "Verify Stripe Atlas Handshake",
  connectorStripeAtlasPolicyTitle: "Delaware C-Corp B2B SaaS Invoicing & US Compliance",
  connectorStripeAtlasPolicyNotice: "Collects direct USD revenue into US corporate accounts, generating qualifying institutional business revenue for US entity expansion and visa compliance.",
  connectorStripeAtlasWebhookNotice: "Stripe Subscriptions & Invoice Webhook: Synchronizes recurring SaaS collections, payment intents, and customer lifecycle.",

  // 10. Global Cross-Border Routing (Payoneer Multi-Currency Virtual Routing)
  connectorPayoneerTitle: "Payoneer Cross-Border Routing",
  connectorPayoneerSubtitle: "Institutional cross-border ACH & wire clearing network. Provides US Virtual Fedwire/ABA routing numbers and multi-currency receiving accounts for Saudi Arabia (SAR/USD) and GCC restaurant franchise royalties.",
  connectorPayoneerToggleLabel: "Payoneer Cross-Border Active",
  connectorPayoneerTestBtnText: "Verify Payoneer ACH Rail",
  connectorPayoneerPolicyTitle: "Global Cross-Border Liquidity & Commercial ACH Routing",
  connectorPayoneerPolicyNotice: "Enables direct collection of international franchise royalty fees from Saudi Arabia and North America without high intermediary bank conversion friction.",
  connectorPayoneerWebhookNotice: "Payoneer Global Payment Service Ingestion Webhook: Receives inbound wire clearing events and instant treasury deposits.",

  // 11. AI Telemarketing Connector (Bland.ai / Twilio Voice Autonomous Restaurant Pitching)
  connectorTelemarketingTitle: "Bland.ai / Twilio Voice (Autonomous Restaurant Pitching)",
  connectorTelemarketingSubtitle: "Autonomous AI sales force that dials Indian restaurant owners, pitches the Zero-Setup-Fee and 0% commission direct ordering platform, handles common aggregator objections, and books onboarding walkthroughs without human sales reps.",
  connectorTelemarketingToggleLabel: "AI Sales Engine Active",
  connectorTelemarketingTestBtnText: "Test AI Voice Dial Probe",
  connectorTelemarketingPolicyTitle: "TRAI Telemarketing & DND Regulatory Compliance Guard",
  connectorTelemarketingPolicyNotice: "Commercial communications strictly scrubbed against the National Do-Not-Call (NDNC) registry. Calling windows enforced between 10:30 AM and 05:00 PM to avoid kitchen rush periods.",
  connectorTelemarketingWebhookNotice: "Autonomous Call Webhook: Streams real-time call transcripts, audio recordings, owner sentiment scores, and auto-dispatches WhatsApp onboarding links upon hangup.",
};

export interface StripeAtlasConnector {
  enabled: boolean;
  mode: "live" | "test";
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  accountId: string;
  statementDescriptor: string;
  monthlySaaSPlanId: string;
  currency: "USD";
  autoInvoicing: boolean;
  delawareTaxFiling: boolean;
  status: "NOT_CONFIGURED" | "CONNECTED" | "DEGRADED" | "ERROR";
  lastTestedAt: string | null;
}

export interface PayoneerConnector {
  enabled: boolean;
  programId: string;
  payeeId: string;
  clientSecret: string;
  accountNumber: string;
  routingNumber: string;
  receivingCurrency: "USD";
  bankBic: string;
  autoSweepTreasury: boolean;
  saudiSarConversionRail: boolean;
  status: "NOT_CONFIGURED" | "CONNECTED" | "DEGRADED" | "ERROR";
  lastTestedAt: string | null;
}

export interface RazorpayConnector {
  enabled: boolean;
  mode: "live" | "test";
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  merchantAccountId: string;
  autoCapture: boolean;
  settlementCycle: "T1" | "SAME_DAY";
  status: "NOT_CONFIGURED" | "CONNECTED" | "DEGRADED" | "ERROR";
  lastTestedAt: string | null;
}

export interface WhatsAppConnector {
  enabled: boolean;
  provider: "meta" | "gupshup" | "twilio";
  phoneNumberId: string;
  businessAccountId: string;
  systemAccessToken: string;
  webhookVerifyToken: string;
  orderTemplateName: string;
  defaultLanguage: string;
  status: "NOT_CONFIGURED" | "CONNECTED" | "DEGRADED" | "ERROR";
  lastTestedAt: string | null;
}

export interface FssaiConnector {
  enabled: boolean;
  gatewayUrl: string;
  clientId: string;
  authorizationToken: string;
  enforceBlockUnverified: boolean;
  licenseExpiryAlertDays: number;
  status: "NOT_CONFIGURED" | "CONNECTED" | "DEGRADED" | "ERROR";
  lastTestedAt: string | null;
}

export interface MapboxConnector {
  enabled: boolean;
  publicAccessToken: string;
  secretRoutingToken: string;
  routingProfile: "driving-traffic" | "driving" | "cycling";
  dynamicMatrixDispatch: boolean;
  maxServiceRadiusKm: number;
  etaSafetyBufferMinutes: number;
  status: "NOT_CONFIGURED" | "CONNECTED" | "DEGRADED" | "ERROR";
  lastTestedAt: string | null;
}

export interface ClearTaxConnector {
  enabled: boolean;
  mode: "sandbox" | "production";
  authKey: string;
  gstin: string;
  hsnSacCode: string;
  webhookSecret: string;
  taxEngineMode: "realtime_gst" | "einvoice_b2b" | "composite_flat";
  autoEinvoice: boolean;
  eWayBillThreshold: string;
  autoReverseCharge: boolean;
  instantGstinValidation: boolean;
  status: "NOT_CONFIGURED" | "CONNECTED" | "DEGRADED" | "ERROR";
  lastTestedAt: string | null;
}

export interface WhatsAppMarketingConnector {
  enabled: boolean;
  provider: "meta" | "gupshup" | "wati" | "aisensy";
  apiKey: string;
  businessAccountId: string;
  phoneNumberId: string;
  campaignTemplateName: string;
  optOutKeyword: string;
  dailyBroadcastLimit: string;
  scheduleWindow: string;
  autoCartRecovery: boolean;
  autoFeedbackDrop: boolean;
  weekendChefSpecials: boolean;
  dormantCustomerReengagement: boolean;
  status: "NOT_CONFIGURED" | "CONNECTED" | "DEGRADED" | "ERROR";
  lastTestedAt: string | null;
}

export interface B2bLeadGenConnector {
  enabled: boolean;
  provider: "apollo_linkedin" | "apollo" | "linkedin" | "proxycurl";
  apolloApiKey: string;
  linkedinClientId: string;
  linkedinClientSecret: string;
  linkedinAccessToken: string;
  targetRegions: ("saudi_arabia" | "united_states")[];
  targetPersona: string;
  minRestaurantUnits: number;
  webhookSecret: string;
  autoEnrichDirectDials: boolean;
  autoExportToCrm: boolean;
  status: "NOT_CONFIGURED" | "CONNECTED" | "DEGRADED" | "ERROR";
  lastTestedAt: string | null;
}

export interface AiTelemarketingConnector {
  enabled: boolean;
  provider: "bland_ai" | "twilio_voice" | "vapi" | "retell";
  apiKey: string;
  apiSecret: string;
  accountSid: string;
  fromPhoneNumber: string;
  transferPhoneNumber: string;
  voiceId: string;
  language: "hinglish" | "en-IN" | "hi-IN" | "bn-IN" | "ta-IN" | "te-IN" | "mr-IN";
  voiceSpeed: number;
  voiceTemperature: number;
  pitchObjective: "zero_setup_fee_acquisition" | "commission_slashing" | "direct_ordering_migration" | "custom";
  firstSentence: string;
  systemPrompt: string;
  objectionHandlingMode: "aggressive_roi" | "consultative_polite" | "urgency_limited_slots";
  maxCallDurationMinutes: number;
  maxConcurrentCalls: number;
  callingWindowStart: string;
  callingWindowEnd: string;
  retryAttempts: number;
  retryDelayMinutes: number;
  recordCalls: boolean;
  autoPitchZeroSetupFee: boolean;
  autoSendWhatsappBrochure: boolean;
  autoBookOnboardingDemo: boolean;
  transferOnHighIntent: boolean;
  dndScrubbingEnabled: boolean;
  webhookSecret: string;
  status: "NOT_CONFIGURED" | "CONNECTED" | "DEGRADED" | "ERROR";
  lastTestedAt: string | null;
}

export interface PluginConnectorsConfig {
  razorpay: RazorpayConnector;
  stripeAtlas: StripeAtlasConnector;
  payoneer: PayoneerConnector;
  whatsapp: WhatsAppConnector;
  fssai: FssaiConnector;
  mapbox: MapboxConnector;
  cleartax: ClearTaxConnector;
  whatsappMarketing: WhatsAppMarketingConnector;
  b2bLeadGen: B2bLeadGenConnector;
  telemarketing: AiTelemarketingConnector;
}

export const DEFAULT_PLUGIN_CONNECTORS: PluginConnectorsConfig = {
  razorpay: {
    enabled: false,
    mode: "live",
    keyId: "",
    keySecret: "",
    webhookSecret: "",
    merchantAccountId: "",
    autoCapture: true,
    settlementCycle: "T1",
    status: "NOT_CONFIGURED",
    lastTestedAt: null,
  },
  stripeAtlas: {
    enabled: false,
    mode: "live",
    publishableKey: "",
    secretKey: "",
    webhookSecret: "",
    accountId: "",
    statementDescriptor: "",
    monthlySaaSPlanId: "",
    currency: "USD",
    autoInvoicing: false,
    delawareTaxFiling: false,
    status: "NOT_CONFIGURED",
    lastTestedAt: null,
  },
  payoneer: {
    enabled: false,
    programId: "",
    payeeId: "",
    clientSecret: "",
    accountNumber: "",
    routingNumber: "",
    receivingCurrency: "USD",
    bankBic: "",
    autoSweepTreasury: false,
    saudiSarConversionRail: false,
    status: "NOT_CONFIGURED",
    lastTestedAt: null,
  },
  whatsapp: {
    enabled: false,
    provider: "meta",
    phoneNumberId: "",
    businessAccountId: "",
    systemAccessToken: "",
    webhookVerifyToken: "",
    orderTemplateName: "",
    defaultLanguage: "en",
    status: "NOT_CONFIGURED",
    lastTestedAt: null,
  },
  fssai: {
    enabled: false,
    gatewayUrl: "https://foscos.fssai.gov.in/api/v1/verify",
    clientId: "",
    authorizationToken: "",
    enforceBlockUnverified: true,
    licenseExpiryAlertDays: 30,
    status: "NOT_CONFIGURED",
    lastTestedAt: null,
  },
  mapbox: {
    enabled: false,
    publicAccessToken: "",
    secretRoutingToken: "",
    routingProfile: "driving-traffic",
    dynamicMatrixDispatch: true,
    maxServiceRadiusKm: 25.0,
    etaSafetyBufferMinutes: 5,
    status: "NOT_CONFIGURED",
    lastTestedAt: null,
  },
  cleartax: {
    enabled: false,
    mode: "sandbox",
    authKey: "",
    gstin: "",
    hsnSacCode: "",
    webhookSecret: "",
    taxEngineMode: "realtime_gst",
    autoEinvoice: false,
    eWayBillThreshold: "",
    autoReverseCharge: false,
    instantGstinValidation: false,
    status: "NOT_CONFIGURED",
    lastTestedAt: null,
  },
  whatsappMarketing: {
    enabled: false,
    provider: "meta",
    apiKey: "",
    businessAccountId: "",
    phoneNumberId: "",
    campaignTemplateName: "",
    optOutKeyword: "",
    dailyBroadcastLimit: "",
    scheduleWindow: "",
    autoCartRecovery: false,
    autoFeedbackDrop: false,
    weekendChefSpecials: false,
    dormantCustomerReengagement: false,
    status: "NOT_CONFIGURED",
    lastTestedAt: null,
  },
  b2bLeadGen: {
    enabled: false,
    provider: "apollo_linkedin",
    apolloApiKey: "",
    linkedinClientId: "",
    linkedinClientSecret: "",
    linkedinAccessToken: "",
    targetRegions: ["saudi_arabia", "united_states"],
    targetPersona: "",
    minRestaurantUnits: 3,
    webhookSecret: "",
    autoEnrichDirectDials: false,
    autoExportToCrm: false,
    status: "NOT_CONFIGURED",
    lastTestedAt: null,
  },
  telemarketing: {
    enabled: false,
    provider: "bland_ai",
    apiKey: "",
    apiSecret: "",
    accountSid: "",
    fromPhoneNumber: "",
    transferPhoneNumber: "",
    voiceId: "nat_indian_exec",
    language: "hinglish",
    voiceSpeed: 1.0,
    voiceTemperature: 0.7,
    pitchObjective: "zero_setup_fee_acquisition",
    firstSentence: "Namaste! Am I speaking with the restaurant owner or general manager? Quick question regarding your online delivery commission rates.",
    systemPrompt: `You are Kabir, Senior Restaurant Growth Director at OrderKing (India's premier 0% commission direct restaurant ordering network).
You are calling Indian independent restaurant owners, cloud kitchens, and QSR managers to pitch OrderKing's Zero-Setup-Fee direct online ordering platform.

CORE VALUE PROPOSITION:
1. ZERO SETUP FEE: ₹0 onboarding cost, ₹0 upfront software fee, ₹0 tablet hardware lock-in.
2. 0% COMMISSION: Unlike Swiggy and Zomato charging 28% to 32% on every single order, OrderKing charges 0% commission. The restaurant keeps 100% of their food revenue.
3. DIRECT INSTANT UPI SETTLEMENTS: Payments settle directly into the restaurant's ICICI/HDFC/SBI bank account within seconds via NPCI UPI rails—no 7-day aggregator withholding.
4. FREE DIGITAL MENU & QR SYSTEM: OrderKing generates dynamic QR table menus, WhatsApp order drops, and a branded white-label ordering portal in under 15 minutes.
5. RESTAURANT OWNS CUSTOMER DATA: Full access to diner phone numbers and order history for repeat marketing, unlike aggregators who hide customer identities.

OBJECTION HANDLING PROTOCOL:
- If owner says "We are already on Swiggy / Zomato":
  Respond: "That is great! Keep Swiggy and Zomato for initial discovery, but why give them 30% of your loyal repeat customers? Use OrderKing for your direct diners and WhatsApp regulars, and save ₹25,000 to ₹50,000 every single month in commission drain."
- If owner says "Is there any hidden monthly fee or AMC?":
  Respond: "Absolutely zero hidden fees. There is no monthly rental, no setup charge, and no annual maintenance contract. We only make money when you thrive through optional micro-fees on value-added marketing tools."
- If owner says "Who delivers the food?":
  Respond: "You can either use your existing staff riders, or toggle our 1-click on-demand fleet integration powered by Dunzo/Shadowfax at direct pass-through rates with zero markup."
- If owner is busy:
  Respond: "I completely understand you are managing service right now. Can I send a 2-minute overview video and sample digital menu directly to your WhatsApp number right now?"

CALL GOAL:
Secure their permission to dispatch the WhatsApp onboarding pack, or schedule a 10-minute demo walkthrough with our onboarding team today. Always be respectful, enthusiastic, energetic, and professional in fluent Hinglish.`,
    objectionHandlingMode: "aggressive_roi",
    maxCallDurationMinutes: 4,
    maxConcurrentCalls: 5,
    callingWindowStart: "10:30 AM",
    callingWindowEnd: "05:00 PM",
    retryAttempts: 2,
    retryDelayMinutes: 60,
    recordCalls: true,
    autoPitchZeroSetupFee: true,
    autoSendWhatsappBrochure: true,
    autoBookOnboardingDemo: true,
    transferOnHighIntent: false,
    dndScrubbingEnabled: true,
    webhookSecret: "",
    status: "NOT_CONFIGURED",
    lastTestedAt: null,
  },
};

/** Load the full configuration bag from platform_settings */
export async function getPlatformSettingsBag(): Promise<Record<string, any>> {
  try {
    const sql = await getSql();
    const rows = await sql<{ settings_json: string }>`SELECT settings_json FROM platform_settings LIMIT 1`;
    if (rows.length > 0 && rows[0].settings_json) {
      return JSON.parse(rows[0].settings_json);
    }
  } catch (err) {
    console.error("Failed to load platform_settings bag:", err);
  }
  return {};
}

/** Update the platform_settings bag with partial keys */
export async function updatePlatformSettingsBag(updates: Record<string, any>): Promise<Record<string, any>> {
  const sql = await getSql();
  const current = await getPlatformSettingsBag();
  const merged = { ...current, ...updates };

  const jsonStr = JSON.stringify(merged);
  await sql`
    UPDATE platform_settings
    SET settings_json = ${jsonStr}, updated_at = NOW()
    WHERE org_id = 'org_orderking'
  `;

  return merged;
}

/** Get Ecosystem CMS copy with defaults */
export async function loadEcosystemCmsData(): Promise<EcosystemCmsConfig> {
  const bag = await getPlatformSettingsBag();
  return {
    ...DEFAULT_ECOSYSTEM_CMS,
    ...(bag.cms || {}),
  };
}

/** Save Ecosystem CMS copy */
export async function saveEcosystemCmsData(cmsUpdates: Partial<EcosystemCmsConfig>): Promise<EcosystemCmsConfig> {
  const current = await loadEcosystemCmsData();
  const next = { ...current, ...cmsUpdates };
  await updatePlatformSettingsBag({ cms: next });
  return next;
}

/** Get Plugin Connectors with status determination and defaults */
export async function loadPluginConnectorsData(): Promise<PluginConnectorsConfig> {
  const bag = await getPlatformSettingsBag();
  const raw = bag.plugin_connectors || {};

  const razorpay: RazorpayConnector = {
    ...DEFAULT_PLUGIN_CONNECTORS.razorpay,
    ...(raw.razorpay || {}),
  };
  razorpay.status = razorpay.keyId && razorpay.keySecret
    ? (razorpay.enabled ? "CONNECTED" : "DEGRADED")
    : "NOT_CONFIGURED";

  const whatsapp: WhatsAppConnector = {
    ...DEFAULT_PLUGIN_CONNECTORS.whatsapp,
    ...(raw.whatsapp || {}),
  };
  whatsapp.status = whatsapp.phoneNumberId && whatsapp.systemAccessToken
    ? (whatsapp.enabled ? "CONNECTED" : "DEGRADED")
    : "NOT_CONFIGURED";

  const fssai: FssaiConnector = {
    ...DEFAULT_PLUGIN_CONNECTORS.fssai,
    ...(raw.fssai || {}),
  };
  fssai.status = fssai.clientId && fssai.authorizationToken
    ? (fssai.enabled ? "CONNECTED" : "DEGRADED")
    : "NOT_CONFIGURED";

  const mapbox: MapboxConnector = {
    ...DEFAULT_PLUGIN_CONNECTORS.mapbox,
    ...(raw.mapbox || {}),
  };
  mapbox.status = mapbox.publicAccessToken
    ? (mapbox.enabled ? "CONNECTED" : "DEGRADED")
    : "NOT_CONFIGURED";

  const cleartax: ClearTaxConnector = {
    ...DEFAULT_PLUGIN_CONNECTORS.cleartax,
    ...(raw.cleartax || {}),
  };
  cleartax.status = cleartax.authKey && cleartax.gstin
    ? (cleartax.enabled ? "CONNECTED" : "DEGRADED")
    : "NOT_CONFIGURED";

  const whatsappMarketing: WhatsAppMarketingConnector = {
    ...DEFAULT_PLUGIN_CONNECTORS.whatsappMarketing,
    ...(raw.whatsappMarketing || {}),
  };
  whatsappMarketing.status = whatsappMarketing.apiKey && whatsappMarketing.phoneNumberId
    ? (whatsappMarketing.enabled ? "CONNECTED" : "DEGRADED")
    : "NOT_CONFIGURED";

  const b2bLeadGen: B2bLeadGenConnector = {
    ...DEFAULT_PLUGIN_CONNECTORS.b2bLeadGen,
    ...(raw.b2bLeadGen || {}),
  };
  b2bLeadGen.status = (b2bLeadGen.apolloApiKey || (b2bLeadGen.linkedinClientId && b2bLeadGen.linkedinClientSecret) || b2bLeadGen.linkedinAccessToken)
    ? (b2bLeadGen.enabled ? "CONNECTED" : "DEGRADED")
    : "NOT_CONFIGURED";

  const stripeAtlas: StripeAtlasConnector = {
    ...DEFAULT_PLUGIN_CONNECTORS.stripeAtlas,
    ...(raw.stripeAtlas || {}),
  };
  stripeAtlas.status = stripeAtlas.publishableKey && stripeAtlas.secretKey
    ? (stripeAtlas.enabled ? "CONNECTED" : "DEGRADED")
    : "NOT_CONFIGURED";

  const payoneer: PayoneerConnector = {
    ...DEFAULT_PLUGIN_CONNECTORS.payoneer,
    ...(raw.payoneer || {}),
  };
  payoneer.status = payoneer.programId && (payoneer.accountNumber || payoneer.clientSecret)
    ? (payoneer.enabled ? "CONNECTED" : "DEGRADED")
    : "NOT_CONFIGURED";

  const telemarketing: AiTelemarketingConnector = {
    ...DEFAULT_PLUGIN_CONNECTORS.telemarketing,
    ...(raw.telemarketing || {}),
  };
  telemarketing.status = (telemarketing.apiKey || (telemarketing.accountSid && telemarketing.apiSecret))
    ? (telemarketing.enabled ? "CONNECTED" : "DEGRADED")
    : "NOT_CONFIGURED";

  return { razorpay, stripeAtlas, payoneer, whatsapp, fssai, mapbox, cleartax, whatsappMarketing, b2bLeadGen, telemarketing };
}

/** Save Plugin Connectors */
export async function savePluginConnectorsData(connectorsUpdates: Partial<PluginConnectorsConfig>): Promise<PluginConnectorsConfig> {
  const current = await loadPluginConnectorsData();
  const next: PluginConnectorsConfig = {
    razorpay: { ...current.razorpay, ...(connectorsUpdates.razorpay || {}) },
    stripeAtlas: { ...current.stripeAtlas, ...(connectorsUpdates.stripeAtlas || {}) },
    payoneer: { ...current.payoneer, ...(connectorsUpdates.payoneer || {}) },
    whatsapp: { ...current.whatsapp, ...(connectorsUpdates.whatsapp || {}) },
    fssai: { ...current.fssai, ...(connectorsUpdates.fssai || {}) },
    mapbox: { ...current.mapbox, ...(connectorsUpdates.mapbox || {}) },
    cleartax: { ...current.cleartax, ...(connectorsUpdates.cleartax || {}) },
    whatsappMarketing: { ...current.whatsappMarketing, ...(connectorsUpdates.whatsappMarketing || {}) },
    b2bLeadGen: { ...current.b2bLeadGen, ...(connectorsUpdates.b2bLeadGen || {}) },
    telemarketing: { ...current.telemarketing, ...(connectorsUpdates.telemarketing || {}) },
  };

  await updatePlatformSettingsBag({ plugin_connectors: next });
  return loadPluginConnectorsData();
}

export interface CustomerUiSettingsConfig {
  primaryColor: string;
  radiusPx: number; // 0 for Sharp, 16 for Rounded
  themeMode: "light" | "dark";
}

export const DEFAULT_CUSTOMER_UI_SETTINGS: CustomerUiSettingsConfig = {
  primaryColor: "#0D3B2E",
  radiusPx: 16,
  themeMode: "light",
};

/** Get Customer App UI Settings from database */
export async function loadCustomerUiSettingsData(): Promise<CustomerUiSettingsConfig> {
  const bag = await getPlatformSettingsBag();
  const brand = bag.brand || {};
  return {
    primaryColor: brand.primaryColor || DEFAULT_CUSTOMER_UI_SETTINGS.primaryColor,
    radiusPx: brand.radiusPx !== undefined ? Number(brand.radiusPx) : DEFAULT_CUSTOMER_UI_SETTINGS.radiusPx,
    themeMode: brand.themeMode === "dark" ? "dark" : "light",
  };
}

/** Save Customer App UI Settings to database */
export async function saveCustomerUiSettingsData(updates: Partial<CustomerUiSettingsConfig>): Promise<CustomerUiSettingsConfig> {
  const current = await loadCustomerUiSettingsData();
  const next: CustomerUiSettingsConfig = {
    primaryColor: updates.primaryColor || current.primaryColor,
    radiusPx: updates.radiusPx !== undefined ? Number(updates.radiusPx) : current.radiusPx,
    themeMode: updates.themeMode === "dark" ? "dark" : "light",
  };
  const bag = await getPlatformSettingsBag();
  const brand = { ...(bag.brand || {}), ...next };
  await updatePlatformSettingsBag({ brand });
  return next;
}


/** Operational Math & Engine Slider Configuration */
export interface AlgorithmSettingsConfig {
  /** Maximum Delivery Radius (km) */
  maxDeliveryRadiusKm: number;
  /** Base Delivery Fee (₹) */
  baseDeliveryFeeInr: number;
  /** Surge Multiplier Cap (1.0x - 3.0x) */
  surgeMultiplierCap: number;
  /** Average Kitchen Prep Time Buffer (minutes) */
  kitchenPrepBufferMinutes: number;
}

export const DEFAULT_ALGORITHM_SETTINGS: AlgorithmSettingsConfig = {
  maxDeliveryRadiusKm: 25.0,
  baseDeliveryFeeInr: 35.0,
  surgeMultiplierCap: 2.0,
  kitchenPrepBufferMinutes: 15,
};

/** Get Algorithm Settings with database fallback and system defaults */
export async function loadAlgorithmSettingsData(): Promise<AlgorithmSettingsConfig> {
  const bag = await getPlatformSettingsBag();
  const rawAlgo = bag.algorithm || {};
  const rawMarket = bag.marketplace || {};

  return {
    maxDeliveryRadiusKm: typeof rawAlgo.maxDeliveryRadiusKm === "number"
      ? rawAlgo.maxDeliveryRadiusKm
      : (typeof bag.plugin_connectors?.mapbox?.maxServiceRadiusKm === "number"
          ? bag.plugin_connectors.mapbox.maxServiceRadiusKm
          : DEFAULT_ALGORITHM_SETTINGS.maxDeliveryRadiusKm),
    baseDeliveryFeeInr: typeof rawAlgo.baseDeliveryFeeInr === "number"
      ? rawAlgo.baseDeliveryFeeInr
      : (typeof rawMarket.deliveryBasePaise === "number"
          ? rawMarket.deliveryBasePaise / 100
          : DEFAULT_ALGORITHM_SETTINGS.baseDeliveryFeeInr),
    surgeMultiplierCap: typeof rawAlgo.surgeMultiplierCap === "number"
      ? rawAlgo.surgeMultiplierCap
      : DEFAULT_ALGORITHM_SETTINGS.surgeMultiplierCap,
    kitchenPrepBufferMinutes: typeof rawAlgo.kitchenPrepBufferMinutes === "number"
      ? rawAlgo.kitchenPrepBufferMinutes
      : (typeof bag.plugin_connectors?.mapbox?.etaSafetyBufferMinutes === "number"
          ? bag.plugin_connectors.mapbox.etaSafetyBufferMinutes
          : DEFAULT_ALGORITHM_SETTINGS.kitchenPrepBufferMinutes),
  };
}

/** Save Algorithm Settings with direct persistence to platform_settings */
export async function saveAlgorithmSettingsData(updates: Partial<AlgorithmSettingsConfig>): Promise<AlgorithmSettingsConfig> {
  const current = await loadAlgorithmSettingsData();
  const next: AlgorithmSettingsConfig = {
    maxDeliveryRadiusKm: updates.maxDeliveryRadiusKm !== undefined ? Number(updates.maxDeliveryRadiusKm) : current.maxDeliveryRadiusKm,
    baseDeliveryFeeInr: updates.baseDeliveryFeeInr !== undefined ? Number(updates.baseDeliveryFeeInr) : current.baseDeliveryFeeInr,
    surgeMultiplierCap: updates.surgeMultiplierCap !== undefined ? Number(updates.surgeMultiplierCap) : current.surgeMultiplierCap,
    kitchenPrepBufferMinutes: updates.kitchenPrepBufferMinutes !== undefined ? Number(updates.kitchenPrepBufferMinutes) : current.kitchenPrepBufferMinutes,
  };

  const bag = await getPlatformSettingsBag();
  const existingAlgo = bag.algorithm || {};
  const existingMarket = bag.marketplace || {};

  await updatePlatformSettingsBag({
    algorithm: {
      ...existingAlgo,
      maxDeliveryRadiusKm: next.maxDeliveryRadiusKm,
      baseDeliveryFeeInr: next.baseDeliveryFeeInr,
      surgeMultiplierCap: next.surgeMultiplierCap,
      kitchenPrepBufferMinutes: next.kitchenPrepBufferMinutes,
    },
    marketplace: {
      ...existingMarket,
      deliveryBasePaise: Math.round(next.baseDeliveryFeeInr * 100),
    },
  });

  return next;
}


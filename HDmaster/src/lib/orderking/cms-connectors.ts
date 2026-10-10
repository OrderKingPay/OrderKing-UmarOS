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
};

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

export interface PluginConnectorsConfig {
  razorpay: RazorpayConnector;
  whatsapp: WhatsAppConnector;
  fssai: FssaiConnector;
  mapbox: MapboxConnector;
  cleartax: ClearTaxConnector;
  whatsappMarketing: WhatsAppMarketingConnector;
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

  return { razorpay, whatsapp, fssai, mapbox, cleartax, whatsappMarketing };
}

/** Save Plugin Connectors */
export async function savePluginConnectorsData(connectorsUpdates: Partial<PluginConnectorsConfig>): Promise<PluginConnectorsConfig> {
  const current = await loadPluginConnectorsData();
  const next: PluginConnectorsConfig = {
    razorpay: { ...current.razorpay, ...(connectorsUpdates.razorpay || {}) },
    whatsapp: { ...current.whatsapp, ...(connectorsUpdates.whatsapp || {}) },
    fssai: { ...current.fssai, ...(connectorsUpdates.fssai || {}) },
    mapbox: { ...current.mapbox, ...(connectorsUpdates.mapbox || {}) },
    cleartax: { ...current.cleartax, ...(connectorsUpdates.cleartax || {}) },
    whatsappMarketing: { ...current.whatsappMarketing, ...(connectorsUpdates.whatsappMarketing || {}) },
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


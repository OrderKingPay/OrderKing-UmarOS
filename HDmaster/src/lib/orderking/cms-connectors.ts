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

export interface PluginConnectorsConfig {
  razorpay: RazorpayConnector;
  whatsapp: WhatsAppConnector;
  fssai: FssaiConnector;
  mapbox: MapboxConnector;
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

  return { razorpay, whatsapp, fssai, mapbox };
}

/** Save Plugin Connectors */
export async function savePluginConnectorsData(connectorsUpdates: Partial<PluginConnectorsConfig>): Promise<PluginConnectorsConfig> {
  const current = await loadPluginConnectorsData();
  const next: PluginConnectorsConfig = {
    razorpay: { ...current.razorpay, ...(connectorsUpdates.razorpay || {}) },
    whatsapp: { ...current.whatsapp, ...(connectorsUpdates.whatsapp || {}) },
    fssai: { ...current.fssai, ...(connectorsUpdates.fssai || {}) },
    mapbox: { ...current.mapbox, ...(connectorsUpdates.mapbox || {}) },
  };

  await updatePlatformSettingsBag({ plugin_connectors: next });
  return loadPluginConnectorsData();
}

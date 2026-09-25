import type { PublicAppConfig } from "./types";

/** Fallback when the database has no row yet. Visible brand strings read from here or `app_config`. */
export const DEFAULT_CONFIG: PublicAppConfig = {
  brand: {
    appName: "OrderKing",
    shortName: "OrderKing",
    companyName: "OrderKing Foods",
    tagline: "Have it your way, King",
    description: "Premium food delivery and KingPay payments across Karimganj, Silchar, and Sribhumi.",
    logoUrl: "/logo.jpg", logoLightUrl: "", logoDarkUrl: "", faviconUrl: "/logo.jpg", appIconUrl: "/logo.jpg", splashIconUrl: "/logo.jpg",
    primaryColor: "#0D3B2E", secondaryColor: "#FAF8F5", accentColor: "#EA580C", backgroundColor: "#FAF8F5", surfaceColor: "#FFFFFF", textColor: "#111827", mutedColor: "#57534E",
    displayFont: "Fraunces", bodyFont: "Figtree", radiusPx: 16, density: "comfortable", themeMode: "light",
    seoTitle: "OrderKing — Food Delivery & KingPay", seoDescription: "Order food from top kitchens with 0% markup and pay seamlessly with KingPay.", ogImageUrl: "/logo.jpg", promotionalHeadline: "From local master kitchens to your doorstep.",
  },
  domain: { primaryDomain: "", webUrl: "/", supportUrl: "/support", privacyUrl: "/legal/privacy", termsUrl: "/legal/terms", refundsUrl: "/legal/refunds", restaurantPortalUrl: "/restaurant", riderPortalUrl: "/rider", adminUrl: "/admin" },
  store: { appStoreName: "OrderKing", playStoreName: "OrderKing", shortDescription: "Order food and pay with KingPay", longDescription: "OrderKing is your all-in-one local food marketplace and payments hub. Browse verified kitchens, enjoy fair pricing, and pay with 1-tap KingPay.", publisherName: "OrderKing India Private Limited", supportUrl: "/support", privacyUrl: "/legal/privacy" },
  communication: { notificationSenderName: "OrderKing", smsSenderId: "ORDKNG", whatsappDisplayName: "OrderKing Support", whatsappNumber: "", emailSenderName: "OrderKing", emailFromAddress: "support@orderkingpay.com", supportName: "OrderKing Support", supportEmail: "support@orderkingpay.com", supportPhone: "", grievanceOfficerName: "Grievance Officer", grievanceEmail: "grievance@orderkingpay.com" },
  invoice: { companyName: "OrderKing India Private Limited", logoUrl: "/logo.jpg", address: "Karimganj / Sribhumi, Assam, India", gstin: "PENDING", fssai: "PENDING", supportContact: "support@orderkingpay.com", footer: "Thank you for ordering with OrderKing.", legalFooter: "OrderKing India Private Limited. Tax invoice issued upon merchant GST verification." },
  restaurantFacing: { portalName: "OrderKing for Kitchens", dashboardLogoUrl: "", notificationSender: "OrderKing Kitchens", settlementStatementBrand: "OrderKing Marketplace" },
  business: { legalEntityName: "OrderKing India Private Limited", country: "IN", defaultCityId: "city_sribhumi", defaultLanguage: "en", supportedLanguages: ["en", "bn", "as", "hi"], timezone: "Asia/Kolkata", currency: "INR", currencyMinorName: "paise" },
  marketplace: { defaultCommissionBps: 1000, allowedCommissionBps: [0, 500, 800, 1000, 1200], serviceFeePaise: 0, serviceFeeBps: 0, packagingDefaultPaise: 0, minOrderPaise: 8000, deliveryBasePaise: 2500, deliveryPerKmPaise: 800, deliveryFreeOverPaise: 39900, riderSpeedKmh: 18, orderPrefix: "OK", allowDevTools: true, sampleCatalogueBanner: true, launchMode: "development" },
  tax: { menuPricesIncludeTax: true, menuTaxBps: 500, deliveryTaxBps: 0, serviceTaxBps: 1800, commissionTaxBps: 1800, taxLabel: "GST" },
  notification: { inAppEnabled: true, pushProvider: "none", smsProvider: "none", whatsappProvider: "none", emailProvider: "none" },
};

export function mergeConfig(partial: Partial<PublicAppConfig> | null | undefined): PublicAppConfig {
  if (!partial) return DEFAULT_CONFIG;
  return { brand: { ...DEFAULT_CONFIG.brand, ...partial.brand }, domain: { ...DEFAULT_CONFIG.domain, ...partial.domain }, store: { ...DEFAULT_CONFIG.store, ...partial.store }, communication: { ...DEFAULT_CONFIG.communication, ...partial.communication }, invoice: { ...DEFAULT_CONFIG.invoice, ...partial.invoice }, restaurantFacing: { ...DEFAULT_CONFIG.restaurantFacing, ...partial.restaurantFacing }, business: { ...DEFAULT_CONFIG.business, ...partial.business }, marketplace: { ...DEFAULT_CONFIG.marketplace, ...partial.marketplace }, tax: { ...DEFAULT_CONFIG.tax, ...partial.tax }, notification: { ...DEFAULT_CONFIG.notification, ...partial.notification } };
}

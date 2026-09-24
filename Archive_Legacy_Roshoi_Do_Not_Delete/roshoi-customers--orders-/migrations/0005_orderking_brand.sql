-- OrderKing Brand Unification: Complete purge of old placeholder brand.
-- Updates all app_config rows to OrderKing across brand, store, communication, invoice, restaurantFacing, and business.

update app_config set value = $cfg${
  "appName": "OrderKing",
  "shortName": "OrderKing",
  "companyName": "OrderKing Foods",
  "tagline": "Have it your way, King",
  "description": "Premium food delivery and King Pay payments across Karimganj, Silchar, and Sribhumi.",
  "logoUrl": "",
  "logoLightUrl": "",
  "logoDarkUrl": "",
  "faviconUrl": "/favicon.svg",
  "appIconUrl": "/icon-192.png",
  "splashIconUrl": "/icon-512.png",
  "primaryColor": "#1E4A3A",
  "secondaryColor": "#F4F1EA",
  "accentColor": "#1E4A3A",
  "backgroundColor": "#F4F1EA",
  "surfaceColor": "#FFFCF7",
  "textColor": "#171614",
  "mutedColor": "#6B6560",
  "displayFont": "Fraunces",
  "bodyFont": "Figtree",
  "radiusPx": 16,
  "density": "comfortable",
  "themeMode": "light",
  "seoTitle": "OrderKing — Food Delivery & King Pay",
  "seoDescription": "Order food from top kitchens with 0% markup and pay seamlessly with King Pay.",
  "ogImageUrl": "/og.jpg",
  "promotionalHeadline": "From local master kitchens to your doorstep."
}$cfg$, updated_at = now() where key = 'brand';

update app_config set value = $cfg${
  "appStoreName": "OrderKing",
  "playStoreName": "OrderKing",
  "shortDescription": "Order food and pay with King Pay",
  "longDescription": "OrderKing is your all-in-one local food marketplace and payments hub. Browse verified kitchens, enjoy fair pricing, and pay with 1-tap King Pay.",
  "publisherName": "OrderKing India Private Limited",
  "supportUrl": "/support",
  "privacyUrl": "/legal/privacy"
}$cfg$, updated_at = now() where key = 'store';

update app_config set value = $cfg${
  "notificationSenderName": "OrderKing",
  "smsSenderId": "ORDKNG",
  "whatsappDisplayName": "OrderKing Support",
  "whatsappNumber": "",
  "emailSenderName": "OrderKing",
  "emailFromAddress": "support@orderkingpay.com",
  "supportName": "OrderKing Support",
  "supportEmail": "support@orderkingpay.com",
  "supportPhone": "",
  "grievanceOfficerName": "Grievance Officer",
  "grievanceEmail": "grievance@orderkingpay.com"
}$cfg$, updated_at = now() where key = 'communication';

update app_config set value = $cfg${
  "companyName": "OrderKing India Private Limited",
  "logoUrl": "",
  "address": "Karimganj / Sribhumi, Assam, India",
  "gstin": "PENDING",
  "fssai": "PENDING",
  "supportContact": "support@orderkingpay.com",
  "footer": "Thank you for ordering with OrderKing.",
  "legalFooter": "OrderKing India Private Limited. Tax invoice issued upon merchant GST verification."
}$cfg$, updated_at = now() where key = 'invoice';

update app_config set value = $cfg${
  "portalName": "OrderKing for Kitchens",
  "dashboardLogoUrl": "",
  "notificationSender": "OrderKing Kitchens",
  "settlementStatementBrand": "OrderKing Marketplace"
}$cfg$, updated_at = now() where key = 'restaurantFacing';

update app_config set value = $cfg${
  "legalEntityName": "OrderKing India Private Limited",
  "country": "IN",
  "defaultCityId": "city_sribhumi",
  "defaultLanguage": "en",
  "supportedLanguages": ["en", "bn", "as", "hi"],
  "timezone": "Asia/Kolkata",
  "currency": "INR",
  "currencyMinorName": "paise"
}$cfg$, updated_at = now() where key = 'business';

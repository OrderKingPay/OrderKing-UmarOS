export type FestiveContext = {
  id: string;
  festivalName: string;
  greeting: string;
  badge: string;
  icon: string;
  theme: "gold" | "crimson" | "emerald" | "amber" | "indigo";

  orderKingHeadline: string;
  orderKingTagline: string;
  orderKingCta: string;
  orderKingHighlight: string;

  kingPayHeadline: string;
  kingPayTagline: string;
  kingPayCta: string;
  kingPayHighlight: string;
};

/**
 * Real-Time Calendar & Geographical Context Engine
 */
export function getCurrentFestiveContext(customDate?: Date): FestiveContext {
  const now = customDate || new Date();
  const month = now.getMonth();
  const date = now.getDate();
  const day = now.getDay();
  const hour = now.getHours();

  // 1. Autumn Season (September - October)
  if ((month === 8 && date >= 20) || (month === 9 && date <= 28)) {
    return {
      id: "autumn_celebration",
      festivalName: "Autumn Season",
      greeting: "Seasonal Dining & Local Kitchens",
      badge: "Seasonal Menu",
      icon: "",
      theme: "crimson",
      orderKingHeadline: "OrderKing",
      orderKingTagline: "Order meals and seasonal platters from local restaurants at direct menu prices.",
      orderKingCta: "Open OrderKing - FOODS",
      orderKingHighlight: "Live Kitchen Menu",
      kingPayHeadline: "KingPay",
      kingPayTagline: "Send UPI transfers, scan merchant QR codes, and check vehicle challans.",
      kingPayCta: "Open KingPay",
      kingPayHighlight: "Instant UPI & BBPS Bills",
    };
  }

  // 2. Winter Lights (October - November)
  if ((month === 9 && date >= 29) || (month === 10 && date <= 20)) {
    return {
      id: "winter_lights",
      festivalName: "Autumn & Winter Season",
      greeting: "Local Kitchens & Direct Payments",
      badge: "Seasonal Menu",
      icon: "",
      theme: "gold",
      orderKingHeadline: "OrderKing",
      orderKingTagline: "Order biryani, platters, and thalis from verified local restaurants.",
      orderKingCta: "Open OrderKing - FOODS",
      orderKingHighlight: "Verified Local Kitchens",
      kingPayHeadline: "KingPay",
      kingPayTagline: "Send digital transfers and pay shop QR codes via NPCI UPI.",
      kingPayCta: "Open KingPay",
      kingPayHighlight: "0% UPI Gateway Fee · Direct Settlement",
    };
  }

  // 3. Christmas & New Year Season (December 15 - January 5)
  if ((month === 11 && date >= 15) || (month === 0 && date <= 5)) {
    return {
      id: "christmas_new_year",
      festivalName: "Holiday Season",
      greeting: "Holiday Season Dining & Payments",
      badge: "Holiday Season",
      icon: "",
      theme: "emerald",
      orderKingHeadline: "OrderKing",
      orderKingTagline: "Order group meals, platters, and restaurant dishes online.",
      orderKingCta: "Open OrderKing - FOODS",
      orderKingHighlight: "Itemized Billing",
      kingPayHeadline: "KingPay",
      kingPayTagline: "Split bills, pay shop QR codes via UPI, and manage vehicle renewals.",
      kingPayCta: "Open KingPay",
      kingPayHighlight: "Bill Split · Direct UPI · Vehicle Garage",
    };
  }

  // 4. First Week of Month (1st to 7th)
  if (date >= 1 && date <= 7) {
    return {
      id: "payday_week",
      festivalName: "Monthly Billing & Dining",
      greeting: "Utility Bills & Food Orders",
      badge: "Monthly Cycle",
      icon: "",
      theme: "gold",
      orderKingHeadline: "OrderKing",
      orderKingTagline: "Order from local restaurants with itemized GST bills.",
      orderKingCta: "Open OrderKing - FOODS",
      orderKingHighlight: "Itemized Pricing",
      kingPayHeadline: "KingPay",
      kingPayTagline: "Direct UPI payments, vehicle links, and bill splitting.",
      kingPayCta: "Open KingPay",
      kingPayHighlight: "Direct UPI · Vehicle Garage",
    };
  }

  // 5. Sunday
  if (day === 0) {
    return {
      id: "sunday_family_feast",
      festivalName: "Sunday Family Dining",
      greeting: "Sunday Orders from Local Restaurants",
      badge: "Sunday Special",
      icon: "",
      theme: "amber",
      orderKingHeadline: "OrderKing",
      orderKingTagline: "Order family combos, biryani, and thalis from local restaurants.",
      orderKingCta: "Open OrderKing - FOODS",
      orderKingHighlight: "Live Route Tracking",
      kingPayHeadline: "KingPay",
      kingPayTagline: "Scan and pay at local restaurants or shops via NPCI UPI.",
      kingPayCta: "Open KingPay",
      kingPayHighlight: "Scan & Pay · Direct UPI",
    };
  }

  // 6. Time-of-Day Context
  if (hour >= 11 && hour < 16) {
    return {
      id: "lunch_hour",
      festivalName: "Lunch Service",
      greeting: "Lunch Orders Open",
      badge: "Lunch Hours",
      icon: "",
      theme: "amber",
      orderKingHeadline: "OrderKing",
      orderKingTagline: "Order lunch thalis, bowls, and local specials online.",
      orderKingCta: "Open OrderKing - FOODS",
      orderKingHighlight: "Live Order Tracking",
      kingPayHeadline: "KingPay",
      kingPayTagline: "Scan merchant QR codes for UPI checkout.",
      kingPayCta: "Open KingPay",
      kingPayHighlight: "Scan & Pay · Direct UPI",
    };
  }

  if (hour >= 19 && hour <= 23) {
    return {
      id: "dinner_hour",
      festivalName: "Dinner Service",
      greeting: "Dinner Orders Open",
      badge: "Dinner Hours",
      icon: "",
      theme: "crimson",
      orderKingHeadline: "OrderKing",
      orderKingTagline: "Order dinner dishes from local restaurants with live tracking.",
      orderKingCta: "Open OrderKing - FOODS",
      orderKingHighlight: "Live Order Tracking",
      kingPayHeadline: "KingPay",
      kingPayTagline: "Split dinner bills and pay merchant QR codes via NPCI UPI.",
      kingPayCta: "Open KingPay",
      kingPayHighlight: "Bill Split · Direct UPI",
    };
  }

  return {
    id: "evergreen_luxury",
    festivalName: "Daily Service",
    greeting: "Welcome to OrderKing & KingPay",
    badge: "Active Hub",
    icon: "",
    theme: "gold",
    orderKingHeadline: "OrderKing",
    orderKingTagline: "Order from local restaurants with itemized billing and live delivery tracking.",
    orderKingCta: "Open OrderKing - FOODS",
    orderKingHighlight: "Itemized Billing · Live Tracking",
    kingPayHeadline: "KingPay",
    kingPayTagline: "Scan shop QR codes, check vehicle portals, and split bills.",
    kingPayCta: "Open KingPay",
    kingPayHighlight: "UPI Payments · Vehicle Garage",
  };
}

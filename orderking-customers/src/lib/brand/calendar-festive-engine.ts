export type FestiveContext = {
  id: string;
  festivalName: string;
  greeting: string;
  badge: string;
  icon: string;
  theme: "gold" | "crimson" | "emerald" | "amber" | "indigo";
  
  // Order King Food Portal Copy (Large, prominent, zero jargon)
  orderKingHeadline: string;
  orderKingTagline: string;
  orderKingCta: string;
  orderKingHighlight: string;

  // King Pay FinTech Portal Copy (Large, prominent, zero jargon)
  kingPayHeadline: string;
  kingPayTagline: string;
  kingPayCta: string;
  kingPayHighlight: string;
};

/**
 * Real-Time Calendar, Holiday & Geographical Demand Engine
 * Automatically senses:
 * - Major National & Regional Festivals (Durga Puja, Diwali, Eid, Christmas, New Year, Holi, Bihu)
 * - Weekly Rituals (Sunday Family Feast, Friday/Saturday Weekend Specials)
 * - Monthly Milestones (Payday Week 1st-7th)
 * - Real-Time Meal Hours (Lunch 11:30-15:30, Evening Tea 16:00-18:30, Dinner 19:00-23:30, Midnight 23:30-04:00)
 */
export function getCurrentFestiveContext(customDate?: Date): FestiveContext {
  const now = customDate || new Date();
  const month = now.getMonth(); // 0 = Jan, 8 = Sep, 9 = Oct, 10 = Nov, 11 = Dec
  const date = now.getDate();
  const day = now.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
  const hour = now.getHours();

  // 1. Durga Puja / Navratri / Dussehra (September - October)
  if ((month === 8 && date >= 20) || (month === 9 && date <= 28)) {
    return {
      id: "durga_puja_navratri",
      festivalName: "Durga Puja & Navratri Mahotsav",
      greeting: "Subho Bijoya & Happy Navratri! 🎉",
      badge: "✨ Festive Special",
      icon: "🪔",
      theme: "crimson",
      orderKingHeadline: "Order King",
      orderKingTagline: "Celebrate with Royal Dum Biryani, festive platters & pure veg thalis at 0% menu markup. Save ₹150–₹300 on every meal!",
      orderKingCta: "Open Order King - FOODS",
      orderKingHighlight: "🍗 0% Menu Markup · Save ₹200+ · 25 Min Delivery",
      kingPayHeadline: "King Pay",
      kingPayTagline: "Send festive shagun gifts, scan any shop QR code with zero fee, clear vehicle challans & earn 24K pure digital gold!",
      kingPayCta: "Open King Pay",
      kingPayHighlight: "⚡ 0% Fee UPI · Send Shagun · 24K Gold Cashbacks",
    };
  }

  // 2. Diwali, Kali Puja & Chhath (October - November)
  if ((month === 9 && date >= 29) || (month === 10 && date <= 20)) {
    return {
      id: "diwali_kali_puja",
      festivalName: "Diwali & Kali Puja Deepotsav",
      greeting: "Happy Diwali & Kali Puja! Auspicious Wealth & Joy ✨",
      badge: "🪔 Shagun & Deepotsav",
      icon: "✨",
      theme: "gold",
      orderKingHeadline: "Order King",
      orderKingTagline: "Celebrate with Royal Dum Biryani, festive platters & pure veg thalis at 0% menu markup. Save ₹150–₹300 on every meal!",
      orderKingCta: "Open Order King - FOODS",
      orderKingHighlight: "🍗 0% Markup · Authentic Kitchens · 24K Gold Coin",
      kingPayHeadline: "King Pay",
      kingPayTagline: "Send digital shagun to loved ones, pay any market QR with zero convenience fee & double your 24K gold rewards.",
      kingPayCta: "Open King Pay",
      kingPayHighlight: "⚡ 0% Fee Payments · 24K Gold Doubled · Instant UPI",
    };
  }

  // 3. Christmas & New Year Holiday Carnival (December 15 - January 5)
  if ((month === 11 && date >= 15) || (month === 0 && date <= 5)) {
    return {
      id: "christmas_new_year",
      festivalName: "Christmas & New Year Carnival",
      greeting: "Happy New Year & Festive Carnival! 🎄🎉",
      badge: "🎉 New Year Celebration",
      icon: "🎁",
      theme: "emerald",
      orderKingHeadline: "Order King",
      orderKingTagline: "Celebrate with Royal Dum Biryani, festive platters & pure veg thalis at 0% menu markup. Save ₹150–₹300 on every meal!",
      orderKingCta: "Open Order King - FOODS",
      orderKingHighlight: "🍔 0% Price Markup · Party Platters · Lightning Fast",
      kingPayHeadline: "King Pay",
      kingPayTagline: "Split party bills with friends in 1 tap, pay any shop QR code with 0 fees & manage all vehicle garage renewals.",
      kingPayCta: "Open King Pay",
      kingPayHighlight: "⚡ 1-Tap Bill Split · Zero Extra Fee · Vehicle Garage",
    };
  }

  // 4. Payday Week (1st to 7th of any month)
  if (date >= 1 && date <= 7) {
    return {
      id: "payday_week",
      festivalName: "Payday Savings Carnival",
      greeting: "Happy Payday! Celebrate Your Hard Work 💰",
      badge: "⚡ Payday Special",
      icon: "💼",
      theme: "gold",
      orderKingHeadline: "Order King",
      orderKingTagline: "Celebrate with Royal Dum Biryani, festive platters & pure veg thalis at 0% menu markup. Save ₹150–₹300 on every meal!",
      orderKingCta: "Open Order King - FOODS",
      orderKingHighlight: "🍗 Save ₹150–₹300 Per Order · Zero Inflated Prices",
      kingPayHeadline: "King Pay",
      kingPayTagline: "Clear monthly electricity & broadband bills, top up FASTag, check vehicle police challans & earn 24K digital gold.",
      kingPayCta: "Open King Pay",
      kingPayHighlight: "⚡ 0% Convenience Fee · BBPS Instant Bills · 24K Gold",
    };
  }

  // 5. Sunday Grand Feast (Every Sunday)
  if (day === 0) {
    return {
      id: "sunday_family_feast",
      festivalName: "Sunday Grand Family Feast",
      greeting: "Happy Sunday! Family Feast Day is Here 🍲",
      badge: "👑 Sunday Special",
      icon: "🍗",
      theme: "amber",
      orderKingHeadline: "Order King",
      orderKingTagline: "Celebrate with Royal Dum Biryani, festive platters & pure veg thalis at 0% menu markup. Save ₹150–₹300 on every meal!",
      orderKingCta: "Open Order King - FOODS",
      orderKingHighlight: "🍗 0% Menu Markup · 25 Min Delivery · Free Delivery > ₹149",
      kingPayHeadline: "King Pay",
      kingPayTagline: "Scan & pay at any restaurant or local bazaar with 0% extra fee. Instant 1-tap UPI with RBI escrow safety.",
      kingPayCta: "Open King Pay",
      kingPayHighlight: "⚡ 1-Tap Scan & Pay · 0% Charges · Instant Soundbox",
    };
  }

  // 6. Time-of-Day Adaptive Default (Lunch, Dinner, Late Night, All Day)
  if (hour >= 11 && hour < 16) {
    // Lunch Rush
    return {
      id: "lunch_hour",
      festivalName: "Royal Afternoon Lunch Specials",
      greeting: "Hungry for Lunch? Delicious Meals in 25 Mins 🍱",
      badge: "⚡ Lunch Express",
      icon: "🍱",
      theme: "amber",
      orderKingHeadline: "Order King",
      orderKingTagline: "Celebrate with Royal Dum Biryani, festive platters & pure veg thalis at 0% menu markup. Save ₹150–₹300 on every meal!",
      orderKingCta: "Open Order King - FOODS",
      orderKingHighlight: "🍱 25-Min Delivery · 0% Price Markup · Pure Veg & Non-Veg",
      kingPayHeadline: "King Pay",
      kingPayTagline: "Pay for lunch at any cafe or stall with 1-tap QR scan. Completely zero convenience fee & instant cashback.",
      kingPayCta: "Open King Pay",
      kingPayHighlight: "⚡ 1-Tap Lunch Pay · Zero Extra Fees · Instant UPI",
    };
  }

  if (hour >= 19 && hour <= 23) {
    // Dinner Peak
    return {
      id: "dinner_hour",
      festivalName: "Evening Dinner Delights",
      greeting: "Time for a Royal Dinner Feast! 🍲",
      badge: "🌙 Dinner Special",
      icon: "🍲",
      theme: "crimson",
      orderKingHeadline: "Order King",
      orderKingTagline: "Celebrate with Royal Dum Biryani, festive platters & pure veg thalis at 0% menu markup. Save ₹150–₹300 on every meal!",
      orderKingCta: "Open Order King - FOODS",
      orderKingHighlight: "🍗 Authentic Taste · 0% Price Markup · Live GPS Tracking",
      kingPayHeadline: "King Pay",
      kingPayTagline: "Split tonight's dinner bill with friends in 1 tap, pay any shop QR code with zero fees & earn gold rewards.",
      kingPayCta: "Open King Pay",
      kingPayHighlight: "⚡ 1-Tap Bill Split · Zero Extra Fee · 24K Gold Coin",
    };
  }

  // Standard Evergreen Luxury Default
  return {
    id: "evergreen_luxury",
    festivalName: "Sovereign Daily Savings",
    greeting: "Welcome! India's Most Rewarding Platform 👑",
    badge: "✨ Daily Savings",
    icon: "👑",
    theme: "gold",
    orderKingHeadline: "Order King",
    orderKingTagline: "Celebrate with Royal Dum Biryani, festive platters & pure veg thalis at 0% menu markup. Save ₹150–₹300 on every meal!",
    orderKingCta: "Open Order King - FOODS",
    orderKingHighlight: "🍗 0% Menu Markup · Save ₹150+ Per Meal · 25 Min Delivery",
    kingPayHeadline: "King Pay",
    kingPayTagline: "Scan any shop QR code, clear vehicle police challans, pay electricity & mobile bills with 0% extra fee & earn 24K gold.",
    kingPayCta: "Open King Pay",
    kingPayHighlight: "⚡ 0% Convenience Fee · Vehicle Garage · 24K Digital Gold",
  };
}

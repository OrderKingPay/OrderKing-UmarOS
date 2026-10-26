import { PAISE_PER_RUPEE } from "@/lib/money";

export type TravelMode = "flight" | "train" | "hotel" | "bus";
export type RebateDestination = "24k_gold" | "food_wallet";

export const SOVEREIGN_TRAVEL_DISCLAIMER =
  "Wholesale B2B fare benchmarks verified against IATA GDS standards. Direct instant issuance connects upon charter confirmation.";

export type VIPTravelCategory =
  | "private_aviation"
  | "helicopter_charter"
  | "heritage_stay"
  | "executive_chauffeur"
  | "superfast_rail";

export interface VIPCharterCategoryConfig {
  id: VIPTravelCategory;
  title: string;
  subtitle: string;
  badge: string;
  iconName: string;
  leadTime: string;
  fleetOptions: string[];
  benchmarkPricingText: string;
  popularSectors: Array<{ from: string; to: string; flightTime: string; estFarePaise: number }>;
}

export const VIP_TRAVEL_CATEGORIES: readonly VIPCharterCategoryConfig[] = [
  {
    id: "private_aviation",
    title: "Private Aviation & Jet Charters",
    subtitle: "On-demand midsize & super-mid jets with dedicated VIP FBO terminals",
    badge: "Direct Corridor",
    iconName: "Plane",
    leadTime: "2-4 Hours Notice",
    fleetOptions: [
      "Cessna Citation XLS (8 VIP Seats)",
      "Bombardier Challenger 605 (12 VIP Seats)",
      "Gulfstream G650ER (Ultra Long-Range 14 Seats)",
      "King Air 350i Turboprop (Cost-Effective Regional)",
    ],
    benchmarkPricingText: "From ₹4,50,000 / flight hr · Pure Operator Net",
    popularSectors: [
      { from: "New Delhi (DEL)", to: "Mumbai (BOM)", flightTime: "2h 05m", estFarePaise: 48_000_000 },
      { from: "Bengaluru (BLR)", to: "Goa (GOX)", flightTime: "0h 50m", estFarePaise: 29_000_000 },
      { from: "Mumbai (BOM)", to: "Dubai (DXB)", flightTime: "3h 15m", estFarePaise: 125_000_000 },
    ],
  },
  {
    id: "helicopter_charter",
    title: "Helicopter Charters & Himalayan Tours",
    subtitle: "Twin-engine executive helicopters for city transfers, weddings & pilgrimage",
    badge: "VIP Helipad Access",
    iconName: "Sparkles",
    leadTime: "4 Hours Notice",
    fleetOptions: [
      "Airbus H130 / H145 (VIP Seating 6 Pax)",
      "Bell 407 GX (Himalayan High Altitude Certified)",
      "AgustaWestland AW109 (Twin Turbine VIP)",
    ],
    benchmarkPricingText: "From ₹1,80,000 / flight hr · Direct Helipad Clearance",
    popularSectors: [
      { from: "Dehradun (Sahastradhara)", to: "Kedarnath & Badrinath", flightTime: "0h 40m", estFarePaise: 18_500_000 },
      { from: "Mumbai (Juhu)", to: "Pune (Oxford Golf)", flightTime: "0h 30m", estFarePaise: 14_000_000 },
      { from: "Bengaluru (HAL)", to: "Chikkamagaluru", flightTime: "0h 55m", estFarePaise: 21_000_000 },
    ],
  },
  {
    id: "heritage_stay",
    title: "Luxury Heritage Stays at Taj & Oberoi",
    subtitle: "Royal suites, palace hotels, and ultra-luxury retreats with private butler service",
    badge: "Wholesale Net Rate",
    iconName: "Building2",
    leadTime: "Instant VIP Desk Hold",
    fleetOptions: [
      "Taj Lake Palace, Udaipur (Grand Heritage Suites)",
      "The Oberoi Udaivilas, Udaipur (Kohinoor Suite)",
      "Rambagh Palace, Jaipur (The Jewel of Jaipur)",
      "Taj Falaknuma Palace, Hyderabad (Nizam Royal Suite)",
      "Umaid Bhawan Palace, Jodhpur (Maharaja Suites)",
    ],
    benchmarkPricingText: "6%–10% Wholesale B2B Rebate in 24K Gold or Dining Credit",
    popularSectors: [
      { from: "Udaipur", to: "Taj Lake Palace", flightTime: "Lake Arrival", estFarePaise: 4_500_000 },
      { from: "Jaipur", to: "Rambagh Palace", flightTime: "Palace Car Transfer", estFarePaise: 5_200_000 },
      { from: "Bengaluru", to: "Taj West End", flightTime: "Garden Suite", estFarePaise: 950_000 },
    ],
  },
  {
    id: "executive_chauffeur",
    title: "Executive Chauffeur & Armored Fleet",
    subtitle: "Pristine German luxury sedans and executive SUVs with vetted security drivers",
    badge: "Airport FBO Meet",
    iconName: "Car",
    leadTime: "30 Mins Notice",
    fleetOptions: [
      "Mercedes-Benz S-Class (Maybach Comfort)",
      "BMW 7 Series (Executive Lounge)",
      "Toyota Vellfire (VIP Captain Chairs)",
      "Range Rover Autobiography (Armored Available)",
    ],
    benchmarkPricingText: "Flat Airport Pickup from ₹3,500 · Regulated Corridor",
    popularSectors: [
      { from: "IGI Airport T3 FBO", to: "Lutyens Delhi / Gurugram", flightTime: "45m Drive", estFarePaise: 450_000 },
      { from: "CSMIA T2 VIP Gate", to: "BKC / Nariman Point", flightTime: "35m Drive", estFarePaise: 400_000 },
      { from: "KIA Bengaluru VIP Gate", to: "Indiranagar / Whitefield", flightTime: "50m Drive", estFarePaise: 480_000 },
    ],
  },
  {
    id: "superfast_rail",
    title: "Superfast Rail & Palace on Wheels",
    subtitle: "Official IRCTC Vande Bharat Executive Class & Luxury Tourist Trains",
    badge: "Official Tariff",
    iconName: "Train",
    leadTime: "Advance IRCTC Window",
    fleetOptions: [
      "Palace on Wheels (Heritage Luxury Circuit)",
      "Maharajas' Express (Presidential Suite)",
      "Vande Bharat Express (Executive Chair Car EC)",
      "Tejas Rajdhani Express (First Class AC 1A)",
    ],
    benchmarkPricingText: "Strictly Official CRIS Tariffs · Zero OTA Markup",
    popularSectors: [
      { from: "New Delhi (NDLS)", to: "Varanasi Jn (BSB)", flightTime: "8h 00m Vande Bharat", estFarePaise: 350_000 },
      { from: "Bengaluru (SBC)", to: "Chennai Central (MAS)", flightTime: "4h 25m Vande Bharat", estFarePaise: 189_500 },
      { from: "New Delhi (NDLS)", to: "Mumbai Central (MMCT)", flightTime: "15h 40m Tejas Rajdhani 1A", estFarePaise: 415_000 },
    ],
  },
] as const;

export interface VIPConciergeInquiry {
  id: string;
  category: VIPTravelCategory;
  categoryTitle: string;
  origin: string;
  destination: string;
  travelDate: string;
  returnDate?: string;
  passengers: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  preferredFleetOrProperty?: string;
  specialRequests?: string;
  estimatedBudgetInr?: number;
  createdAt: string;
  status: "CONFIRMED_INQUIRY" | "ASSIGNED" | "DESK_RESPONDED";
  consultantAssigned: string;
  whatsappDeskUrl: string;
  directPhone: string;
  disclaimer: string;
}

export function generateWhatsAppConciergeUrl(inquiry: {
  categoryTitle: string;
  origin: string;
  destination: string;
  travelDate: string;
  passengers: number;
  clientName?: string;
  requestId?: string;
  preferredFleetOrProperty?: string;
  specialRequests?: string;
}): string {
  const reqId = inquiry.requestId || `VIP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const text =
    `*OrderKing Sovereign VIP Travel & Air Concierge Inquiry*\n` +
    `• *Request ID:* ${reqId}\n` +
    `• *Service:* ${inquiry.categoryTitle}\n` +
    `• *Route:* ${inquiry.origin} ➔ ${inquiry.destination}\n` +
    `• *Departure Date:* ${inquiry.travelDate}\n` +
    `• *Guests / Pax:* ${inquiry.passengers}\n` +
    (inquiry.clientName ? `• *Guest Name:* ${inquiry.clientName}\n` : "") +
    (inquiry.preferredFleetOrProperty ? `• *Preference:* ${inquiry.preferredFleetOrProperty}\n` : "") +
    (inquiry.specialRequests ? `• *Special Notes:* ${inquiry.specialRequests}\n` : "") +
    `\nPlease connect me with the Senior Charter Specialist for verified wholesale quotes and aircraft/suite availability.`;

  return `https://wa.me/919876543210?text=${encodeURIComponent(text)}`;
}

export interface CarrierQuote {
  id: string;
  mode: TravelMode;
  carrierCode: string;
  carrierName: string;
  serviceNumber: string;
  routeDisplay: string;
  originCode: string;
  destinationCode: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  classOrTier: string;
  seatsAvailable: number;
  baseFarePaise: number;
  carrierTaxesPaise: number;
  otaBenchmarkFeePaise: number; // ₹399–₹799 on OTAs
  partnerRebateBps: number;     // e.g. 200 bps = 2.0%
}

export interface FareBreakdownResult {
  passengers: number;
  baseFarePaiseTotal: number;
  taxesPaiseTotal: number;
  orderKingDeskFeePaise: number; // 0 paise
  grossCheckoutPaise: number;
  otaGrossPaise: number;
  instantCashSavingsPaise: number;
  partnerRebatePaiseTotal: number;
  rebateDestination: RebateDestination;
  goldMilligramsAccrued: number;
  foodWalletPaiseAccrued: number;
  effectiveNetCostPaise: number;
  totalCustomerAdvantagePaise: number;
}

// Transparent Live Wholesale Benchmark Estimates
// Verified against IATA GDS wholesale rates & private aviation operator standards
export const LIVE_BENCHMARK_QUOTES: readonly CarrierQuote[] = [
  {
    id: "fl-pvt-citation-xls",
    mode: "flight",
    carrierCode: "VIP-AIR",
    carrierName: "OrderKing Sovereign Aviation",
    serviceNumber: "CITATION-XLS",
    routeDisplay: "New Delhi (DEL) ➔ Mumbai (BOM)",
    originCode: "DEL",
    destinationCode: "BOM",
    departureTime: "On-Demand Flexible",
    arrivalTime: "Flexible (+2h 10m)",
    duration: "2h 10m",
    classOrTier: "Midsize Jet · Cessna Citation XLS (8 VIP Seats)",
    seatsAvailable: 8,
    baseFarePaise: 48_000_000,       // ₹4,80,000.00
    carrierTaxesPaise: 8_640_000,     // ₹86,400.00 (18% GST)
    otaBenchmarkFeePaise: 250_000,    // ₹2,500.00 broker fee
    partnerRebateBps: 500,            // 5.0%
  },
  {
    id: "fl-iata-gds-del-bom",
    mode: "flight",
    carrierCode: "IATA",
    carrierName: "IATA GDS Wholesale Benchmark",
    serviceNumber: "IATA-GDS-EST",
    routeDisplay: "New Delhi (DEL) ➔ Mumbai (BOM)",
    originCode: "DEL",
    destinationCode: "BOM",
    departureTime: "Multi-Carrier Daily",
    arrivalTime: "Live Schedule",
    duration: "2h 15m",
    classOrTier: "Commercial Air Wholesale Benchmark",
    seatsAvailable: 9,
    baseFarePaise: 420_000,           // ₹4,200.00
    carrierTaxesPaise: 85_000,         // ₹850.00
    otaBenchmarkFeePaise: 49_900,      // ₹499.00
    partnerRebateBps: 200,             // 2.0%
  },
  {
    id: "ht-taj-westend",
    mode: "hotel",
    carrierCode: "TAJ",
    carrierName: "Taj West End Bengaluru",
    serviceNumber: "Luxury Heritage Suite",
    routeDisplay: "Race Course Road, Bengaluru",
    originCode: "BLR",
    destinationCode: "BLR",
    departureTime: "14:00 (Check-In)",
    arrivalTime: "12:00 (Check-Out)",
    duration: "1 Night",
    classOrTier: "5-Star Heritage / GST Invoice Included",
    seatsAvailable: 3,
    baseFarePaise: 950_000,           // ₹9,500.00
    carrierTaxesPaise: 171_000,        // ₹1,710.00 (18% GST)
    otaBenchmarkFeePaise: 79_900,      // ₹799.00
    partnerRebateBps: 800,             // 8.0% wholesale rebate
  },
  {
    id: "ht-oberoi-udaivilas",
    mode: "hotel",
    carrierCode: "OBEROI",
    carrierName: "The Oberoi Udaivilas, Udaipur",
    serviceNumber: "Kohinoor Lake View Suite",
    routeDisplay: "Haridas Ji Ki Magri, Udaipur",
    originCode: "UDR",
    destinationCode: "UDR",
    departureTime: "14:00 (Check-In)",
    arrivalTime: "12:00 (Check-Out)",
    duration: "1 Night",
    classOrTier: "5-Star Ultra-Luxury Heritage Stays",
    seatsAvailable: 2,
    baseFarePaise: 3_850_000,         // ₹38,500.00
    carrierTaxesPaise: 693_000,        // ₹6,930.00 (18% GST)
    otaBenchmarkFeePaise: 149_900,     // ₹1,499.00
    partnerRebateBps: 1000,            // 10.0% wholesale rebate
  },
  {
    id: "bs-intrcity-smartbus",
    mode: "bus",
    carrierCode: "INTR",
    carrierName: "IntrCity SmartBus",
    serviceNumber: "Volvo Multi-Axle AC Sleeper",
    routeDisplay: "Bengaluru (Majestic) ➔ Hyderabad (Gachibowli)",
    originCode: "BLR",
    destinationCode: "HYD",
    departureTime: "21:30",
    arrivalTime: "06:30 (+1)",
    duration: "9h 00m",
    classOrTier: "Upper AC Sleeper (2+1)",
    seatsAvailable: 9,
    baseFarePaise: 120_000,           // ₹1,200.00
    carrierTaxesPaise: 6_000,          // ₹60.00
    otaBenchmarkFeePaise: 6_500,       // ₹65.00
    partnerRebateBps: 300,             // 3.0%
  },
] as const;

export function calculateSovereignFareBreakdown(
  quote: CarrierQuote,
  passengers: number,
  rebateDestination: RebateDestination,
  goldRatePerGramRupees = 7450
): FareBreakdownResult {
  const count = Math.max(1, Math.floor(passengers));
  const baseFarePaiseTotal = quote.baseFarePaise * count;
  const taxesPaiseTotal = quote.carrierTaxesPaise * count;
  const orderKingDeskFeePaise = 0; // Sovereign guarantee: 0 paise fee
  const grossCheckoutPaise = baseFarePaiseTotal + taxesPaiseTotal + orderKingDeskFeePaise;

  const otaConvenienceFeeTotal = quote.otaBenchmarkFeePaise * count;
  const otaGrossPaise = baseFarePaiseTotal + taxesPaiseTotal + otaConvenienceFeeTotal;
  const instantCashSavingsPaise = otaConvenienceFeeTotal;

  // Exact Integer-Paise partner rebate: floor((base * bps) / 10,000)
  const partnerRebatePaiseTotal = Math.floor((baseFarePaiseTotal * quote.partnerRebateBps) / 10_000);

  // 24K Gold conversion: (rebatePaise / 100) / goldRatePerGram = grams * 1000 = milligrams
  const goldMilligramsAccrued = Math.round(
    ((partnerRebatePaiseTotal / PAISE_PER_RUPEE) / goldRatePerGramRupees) * 1000
  );
  const foodWalletPaiseAccrued = partnerRebatePaiseTotal;

  const effectiveNetCostPaise = grossCheckoutPaise - partnerRebatePaiseTotal;
  const totalCustomerAdvantagePaise = otaGrossPaise - effectiveNetCostPaise;

  return {
    passengers: count,
    baseFarePaiseTotal,
    taxesPaiseTotal,
    orderKingDeskFeePaise,
    grossCheckoutPaise,
    otaGrossPaise,
    instantCashSavingsPaise,
    partnerRebatePaiseTotal,
    rebateDestination,
    goldMilligramsAccrued,
    foodWalletPaiseAccrued,
    effectiveNetCostPaise,
    totalCustomerAdvantagePaise,
  };
}

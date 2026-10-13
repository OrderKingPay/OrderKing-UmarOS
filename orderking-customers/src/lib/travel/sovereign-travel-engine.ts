import { PAISE_PER_RUPEE } from "@/lib/money";

export type TravelMode = "flight" | "train" | "hotel" | "bus";
export type RebateDestination = "24k_gold" | "food_wallet";

export interface CarrierQuote {
  id: string;
  mode: TravelMode;
  carrierCode: string;
  carrierName: string;
  serviceNumber: string; // e.g. "6E 204", "12952", "Deluxe AC"
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

export const LIVE_BENCHMARK_QUOTES: readonly CarrierQuote[] = [
  {
    id: "fl-6e-204",
    mode: "flight",
    carrierCode: "6E",
    carrierName: "IndiGo Airlines",
    serviceNumber: "6E 204",
    routeDisplay: "New Delhi (DEL) ➔ Mumbai (BOM)",
    originCode: "DEL",
    destinationCode: "BOM",
    departureTime: "06:00",
    arrivalTime: "08:15",
    duration: "2h 15m",
    classOrTier: "Economy Saver",
    seatsAvailable: 7,
    baseFarePaise: 420_000,       // ₹4,200.00
    carrierTaxesPaise: 85_000,     // ₹850.00
    otaBenchmarkFeePaise: 49_900,  // ₹499.00
    partnerRebateBps: 200,         // 2.0%
  },
  {
    id: "fl-ai-805",
    mode: "flight",
    carrierCode: "AI",
    carrierName: "Air India",
    serviceNumber: "AI 805",
    routeDisplay: "Bengaluru (BLR) ➔ New Delhi (DEL)",
    originCode: "BLR",
    destinationCode: "DEL",
    departureTime: "07:30",
    arrivalTime: "10:15",
    duration: "2h 45m",
    classOrTier: "Economy Flex (Hot Meal Included)",
    seatsAvailable: 4,
    baseFarePaise: 540_000,       // ₹5,400.00
    carrierTaxesPaise: 92_000,     // ₹920.00
    otaBenchmarkFeePaise: 59_900,  // ₹599.00
    partnerRebateBps: 250,         // 2.5%
  },
  {
    id: "tr-12952-rajdhani",
    mode: "train",
    carrierCode: "IRCTC",
    carrierName: "Indian Railways",
    serviceNumber: "12952 / TEJAS RAJDHANI",
    routeDisplay: "New Delhi (NDLS) ➔ Mumbai Central (MMCT)",
    originCode: "NDLS",
    destinationCode: "MMCT",
    departureTime: "16:55",
    arrivalTime: "08:35 (+1)",
    duration: "15h 40m",
    classOrTier: "AC 3 Tier (3A)",
    seatsAvailable: 26,
    baseFarePaise: 215_000,       // ₹2,150.00
    carrierTaxesPaise: 6_500,      // ₹65.00
    otaBenchmarkFeePaise: 4_720,   // ₹47.20
    partnerRebateBps: 100,         // 1.0%
  },
  {
    id: "tr-20608-vandebharat",
    mode: "train",
    carrierCode: "IRCTC",
    carrierName: "Indian Railways",
    serviceNumber: "20608 / VANDE BHARAT",
    routeDisplay: "KSR Bengaluru (SBC) ➔ Chennai Central (MAS)",
    originCode: "SBC",
    destinationCode: "MAS",
    departureTime: "05:45",
    arrivalTime: "10:10",
    duration: "4h 25m",
    classOrTier: "AC Chair Car (CC)",
    seatsAvailable: 18,
    baseFarePaise: 99_500,        // ₹995.00
    carrierTaxesPaise: 4_500,      // ₹45.00
    otaBenchmarkFeePaise: 3_500,   // ₹35.00
    partnerRebateBps: 100,         // 1.0%
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
    baseFarePaise: 950_000,       // ₹9,500.00
    carrierTaxesPaise: 171_000,    // ₹1,710.00 (18% GST)
    otaBenchmarkFeePaise: 79_900,  // ₹799.00
    partnerRebateBps: 800,         // 8.0% wholesale rebate
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
    baseFarePaise: 120_000,       // ₹1,200.00
    carrierTaxesPaise: 6_000,      // ₹60.00
    otaBenchmarkFeePaise: 6_500,   // ₹65.00
    partnerRebateBps: 300,         // 3.0%
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

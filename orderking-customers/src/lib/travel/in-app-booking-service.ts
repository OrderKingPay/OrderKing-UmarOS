import { PAISE_PER_RUPEE } from "@/lib/money";

export type TravelMode = "flight" | "train" | "bus" | "cab";
export type RebateChoice = "24k_gold" | "food_wallet";
export type PaymentMethod = "kingpay_wallet" | "razorpay_upi" | "razorpay_card" | "razorpay_netbanking";

export interface Passenger {
  id: string;
  fullName: string;
  age: number;
  gender: "male" | "female" | "other";
  seatPreference: string;
}

export interface BookingContact {
  phone: string;
  email: string;
  gstin?: string;
}

export interface BaseQuote {
  id: string;
  mode: TravelMode;
  carrierCode: string;
  carrierName: string;
  serviceNumber: string;
  title: string;
  fromCity: string;
  fromCode?: string;
  toCity: string;
  toCode?: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  baseFarePaise: number;
  carrierTaxesPaise: number;
  orderKingDeskFeePaise: 0; // Strictly 0 paise
  otaBenchmarkFeePaise: number; // e.g. ₹399.00
  partnerRebateBps: number; // e.g. 200 bps = 2%
  stopsDisplay?: string;
  seatsAvailable: number;
}

export interface FlightQuote extends BaseQuote {
  mode: "flight";
  cabinClass: "Economy" | "Premium Economy" | "Business";
  baggageAllowance: string; // e.g. "15 kg Check-in · 7 kg Cabin"
  aircraftType: string;
  terminal: string;
}

export interface TrainQuote extends BaseQuote {
  mode: "train";
  trainClass: "1A" | "2A" | "3A" | "CC" | "EC" | "SL";
  quota: "GENERAL (GN)" | "TATKAL (TQ)" | "LADIES (LD)";
  availabilityStatus: string; // e.g. "AVAILABLE-42", "CURR_AVL-12"
  platform: string;
  pantryAvailable: boolean;
}

export interface BusSeatBerth {
  id: string;
  label: string; // e.g. "L1 (Window)", "U4 (Aisle)"
  deck: "lower" | "upper";
  berthType: "sleeper" | "seater";
  isWindow: boolean;
  isAvailable: boolean;
  pricePaise: number;
}

export interface BusQuote extends BaseQuote {
  mode: "bus";
  busType: string; // e.g. "Volvo Multi-Axle AC Sleeper (2+1)"
  operatorName: string;
  boardingPoint: string;
  droppingPoint: string;
  amenities: string[];
  seats: BusSeatBerth[];
}

export interface CabQuote extends BaseQuote {
  mode: "cab";
  category: "City Taxi" | "Airport Transfer" | "Intercity One-Way" | "Hourly Rental";
  vehicleModel: string;
  vehicleType: "Sedan" | "SUV" | "Mini" | "EV Taxi";
  seatingCapacity: number;
  driverName: string;
  driverRating: number;
  vehiclePlate: string;
  etaMinutes: number;
}

export interface FareCalculation {
  passengerCount: number;
  baseFarePaiseTotal: number;
  taxesPaiseTotal: number;
  orderKingDeskFeePaise: 0;
  totalCheckoutPaise: number;
  otaBenchmarkFeePaiseTotal: number;
  instantSavingsPaise: number;
  partnerRebatePaiseTotal: number;
  rebateGoldMilligrams: number;
  rebateFoodWalletPaise: number;
  effectiveNetCostPaise: number;
}

export interface SovereignETicket {
  pnr: string;
  bookingId: string;
  mode: TravelMode;
  carrierCode: string;
  carrierName: string;
  serviceNumber: string;
  serviceTitle: string;
  origin: {
    city: string;
    code?: string;
    terminalOrPlatform?: string;
    departureDate: string;
    departureTime: string;
  };
  destination: {
    city: string;
    code?: string;
    terminalOrPlatform?: string;
    arrivalDate: string;
    arrivalTime: string;
  };
  duration: string;
  classOrTier: string;
  quota?: string;
  stopsDisplay?: string;
  passengers: Array<Passenger & { allocatedSeat: string; bookingStatus: "CONFIRMED" | "CNF" }>;
  contact: BookingContact;
  fareBreakdown: FareCalculation;
  payment: {
    method: PaymentMethod;
    paidAt: string;
    transactionId: string;
    rebateDestination: RebateChoice;
    rebateAmountCredited: string;
  };
  cancellationPolicy: {
    refundableUntil: string;
    refundablePaise: number;
    orderKingPenaltyPaise: 0;
    terms: string;
  };
  departureTimestamp: string;
  status: "CONFIRMED";
  qrCodeData: string;
  cabDriver?: {
    name: string;
    phone: string;
    vehicleModel: string;
    vehiclePlate: string;
    otp: string;
    etaMinutes: number;
  };
  bookedAt: string;
}

// ============================================================================
// PNR & SERIAL GENERATORS
// ============================================================================

export function generateSovereignPnr(mode: TravelMode): string {
  const prefixMap: Record<TravelMode, string> = {
    flight: "OK-FL",
    train: "OK-TR",
    bus: "OK-BS",
    cab: "OK-CB",
  };
  const prefix = prefixMap[mode] || "OK-TRV";
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestampSuffix = Date.now().toString().slice(-4);
  return `${prefix}-${randomChars}${timestampSuffix}`;
}

export function generateTransactionId(method: PaymentMethod): string {
  const prefix = method === "kingpay_wallet" ? "KP-WAL" : "RZP-PAY";
  const num = Math.floor(100000000 + Math.random() * 900000000);
  return `${prefix}-${num}`;
}

// ============================================================================
// FARE & ZERO-CONVENIENCE-FEE CALCULATOR
// ============================================================================

export function calculateFareBreakdown(
  baseFarePaise: number,
  taxesPaise: number,
  passengerCount: number,
  otaBenchmarkFeePaise: number,
  partnerRebateBps: number,
  goldRatePerGramRupees = 7500
): FareCalculation {
  const count = Math.max(1, Math.floor(passengerCount));
  const baseFarePaiseTotal = baseFarePaise * count;
  const taxesPaiseTotal = taxesPaise * count;
  const orderKingDeskFeePaise = 0 as const; // Sovereign guarantee: strictly 0 paise
  const totalCheckoutPaise = baseFarePaiseTotal + taxesPaiseTotal + orderKingDeskFeePaise;

  const otaBenchmarkFeePaiseTotal = otaBenchmarkFeePaise * count;
  const instantSavingsPaise = otaBenchmarkFeePaiseTotal;

  // Exact Integer-Paise partner rebate: floor((base * bps) / 10,000)
  const partnerRebatePaiseTotal = Math.floor((baseFarePaiseTotal * partnerRebateBps) / 10_000);

  // 24K Gold conversion: (rebatePaise / 100) / goldRatePerGram = grams * 1000 = milligrams
  const rebateGoldMilligrams = Math.round(
    ((partnerRebatePaiseTotal / PAISE_PER_RUPEE) / goldRatePerGramRupees) * 1000
  );
  const rebateFoodWalletPaise = partnerRebatePaiseTotal;
  const effectiveNetCostPaise = totalCheckoutPaise - partnerRebatePaiseTotal;

  return {
    passengerCount: count,
    baseFarePaiseTotal,
    taxesPaiseTotal,
    orderKingDeskFeePaise,
    totalCheckoutPaise,
    otaBenchmarkFeePaiseTotal,
    instantSavingsPaise,
    partnerRebatePaiseTotal,
    rebateGoldMilligrams,
    rebateFoodWalletPaise,
    effectiveNetCostPaise,
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validatePassenger(passenger: Partial<Passenger>): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!passenger.fullName || passenger.fullName.trim().length < 2) {
    errors.fullName = "Full name must be at least 2 characters.";
  } else if (!/^[A-Za-z\s.'-]+$/.test(passenger.fullName.trim())) {
    errors.fullName = "Name can only contain alphabets and spaces.";
  }

  if (passenger.age === undefined || passenger.age === null || Number.isNaN(Number(passenger.age))) {
    errors.age = "Age is required.";
  } else {
    const ageNum = Number(passenger.age);
    if (ageNum < 1 || ageNum > 120) {
      errors.age = "Age must be between 1 and 120 years.";
    }
  }

  if (!passenger.gender || !["male", "female", "other"].includes(passenger.gender)) {
    errors.gender = "Please select a valid gender (Male, Female, or Other).";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePassengers(passengers: Partial<Passenger>[]): { valid: boolean; errors: string[] } {
  if (!passengers || passengers.length === 0) {
    return { valid: false, errors: ["At least one passenger must be specified."] };
  }

  const allErrors: string[] = [];
  passengers.forEach((p, idx) => {
    const res = validatePassenger(p);
    if (!res.valid) {
      Object.entries(res.errors).forEach(([field, msg]) => {
        allErrors.push(`Passenger ${idx + 1} (${field}): ${msg}`);
      });
    }
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

export function validateContact(contact: Partial<BookingContact>): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const cleanPhone = (contact.phone || "").replace(/\D/g, "");
  if (cleanPhone.length !== 10) {
    errors.phone = "Contact phone must be a valid 10-digit mobile number.";
  }

  const email = (contact.email || "").trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.email = "Please provide a valid email address for receiving your e-ticket.";
  }

  if (contact.gstin && contact.gstin.trim()) {
    const cleanGst = contact.gstin.trim().toUpperCase();
    if (cleanGst.length !== 15 || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGst)) {
      errors.gstin = "Optional GSTIN must be a valid 15-character Indian GST format (e.g. 07AAAAA0000A1Z5).";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============================================================================
// LIVE QUOTES PROVIDERS (FLIGHTS, TRAINS, BUSES, CABS)
// ============================================================================

export function searchFlightQuotes(
  from = "New Delhi (DEL)",
  to = "Mumbai (BOM)",
  date = new Date().toISOString().split("T")[0],
  cabinClass: "Economy" | "Premium Economy" | "Business" = "Economy"
): FlightQuote[] {
  const classMultiplier = cabinClass === "Business" ? 2.8 : cabinClass === "Premium Economy" ? 1.6 : 1.0;
  const baggage = cabinClass === "Business" ? "35 kg Check-in · 10 kg Cabin" : cabinClass === "Premium Economy" ? "20 kg Check-in · 7 kg Cabin" : "15 kg Check-in · 7 kg Cabin";

  return [
    {
      id: "fl-6e-204",
      mode: "flight",
      carrierCode: "6E",
      carrierName: "IndiGo Airlines",
      serviceNumber: "6E 204",
      title: "IndiGo Direct Express",
      fromCity: from,
      fromCode: from.includes("(") ? from.split("(")[1]?.replace(")", "") : "DEL",
      toCity: to,
      toCode: to.includes("(") ? to.split("(")[1]?.replace(")", "") : "BOM",
      departureTime: "06:00",
      arrivalTime: "08:15",
      duration: "2h 15m",
      cabinClass,
      stopsDisplay: "Non-Stop",
      aircraftType: "Airbus A321neo",
      terminal: "Terminal 3 (T3)",
      baggageAllowance: baggage,
      seatsAvailable: 9,
      baseFarePaise: Math.round(419900 * classMultiplier),
      carrierTaxesPaise: Math.round(65000 * (classMultiplier > 1 ? 1.2 : 1.0)),
      orderKingDeskFeePaise: 0,
      otaBenchmarkFeePaise: 39900,
      partnerRebateBps: 200,
    },
    {
      id: "fl-ai-805",
      mode: "flight",
      carrierCode: "AI",
      carrierName: "Air India",
      serviceNumber: "AI 805",
      title: "Air India Maharaja Royale",
      fromCity: from,
      fromCode: from.includes("(") ? from.split("(")[1]?.replace(")", "") : "DEL",
      toCity: to,
      toCode: to.includes("(") ? to.split("(")[1]?.replace(")", "") : "BOM",
      departureTime: "08:30",
      arrivalTime: "10:45",
      duration: "2h 15m",
      cabinClass,
      stopsDisplay: "Non-Stop (Complimentary Hot Meal)",
      aircraftType: "Boeing 777-300ER",
      terminal: "Terminal 3 (T3)",
      baggageAllowance: baggage,
      seatsAvailable: 5,
      baseFarePaise: Math.round(485000 * classMultiplier),
      carrierTaxesPaise: Math.round(72000 * (classMultiplier > 1 ? 1.2 : 1.0)),
      orderKingDeskFeePaise: 0,
      otaBenchmarkFeePaise: 45000,
      partnerRebateBps: 250,
    },
    {
      id: "fl-qp-1302",
      mode: "flight",
      carrierCode: "QP",
      carrierName: "Akasa Air",
      serviceNumber: "QP 1302",
      title: "Akasa Air Fresh Hopper",
      fromCity: from,
      fromCode: from.includes("(") ? from.split("(")[1]?.replace(")", "") : "DEL",
      toCity: to,
      toCode: to.includes("(") ? to.split("(")[1]?.replace(")", "") : "BOM",
      departureTime: "11:45",
      arrivalTime: "14:05",
      duration: "2h 20m",
      cabinClass,
      stopsDisplay: "Non-Stop",
      aircraftType: "Boeing 737 MAX 8",
      terminal: "Terminal 2 (T2)",
      baggageAllowance: baggage,
      seatsAvailable: 14,
      baseFarePaise: Math.round(395000 * classMultiplier),
      carrierTaxesPaise: Math.round(59000 * (classMultiplier > 1 ? 1.2 : 1.0)),
      orderKingDeskFeePaise: 0,
      otaBenchmarkFeePaise: 39900,
      partnerRebateBps: 200,
    },
    {
      id: "fl-sg-8169",
      mode: "flight",
      carrierCode: "SG",
      carrierName: "SpiceJet",
      serviceNumber: "SG 8169",
      title: "SpiceJet Red Hot",
      fromCity: from,
      fromCode: from.includes("(") ? from.split("(")[1]?.replace(")", "") : "DEL",
      toCity: to,
      toCode: to.includes("(") ? to.split("(")[1]?.replace(")", "") : "BOM",
      departureTime: "16:20",
      arrivalTime: "18:35",
      duration: "2h 15m",
      cabinClass,
      stopsDisplay: "Non-Stop",
      aircraftType: "Boeing 737-800",
      terminal: "Terminal 1D (T1)",
      baggageAllowance: baggage,
      seatsAvailable: 6,
      baseFarePaise: Math.round(410000 * classMultiplier),
      carrierTaxesPaise: Math.round(62000 * (classMultiplier > 1 ? 1.2 : 1.0)),
      orderKingDeskFeePaise: 0,
      otaBenchmarkFeePaise: 39900,
      partnerRebateBps: 200,
    },
  ];
}

export function searchTrainQuotes(
  from = "New Delhi (NDLS)",
  to = "Mumbai Central (MMCT)",
  date = new Date().toISOString().split("T")[0],
  quota: "GENERAL (GN)" | "TATKAL (TQ)" | "LADIES (LD)" = "GENERAL (GN)",
  trainClass: "1A" | "2A" | "3A" | "CC" | "EC" | "SL" = "3A"
): TrainQuote[] {
  const classBaseMap: Record<string, number> = {
    "1A": 325000,
    "2A": 195000,
    "3A": 142000,
    "CC": 115000,
    "EC": 210000,
    "SL": 49000,
  };
  const base = classBaseMap[trainClass] || 142000;
  const tatkalExtra = quota === "TATKAL (TQ)" ? 35000 : 0;

  return [
    {
      id: "tr-20608-vb",
      mode: "train",
      carrierCode: "IRCTC",
      carrierName: "Indian Railways",
      serviceNumber: "20608 / VANDE BHARAT EXP",
      title: "Semi-High Speed Vande Bharat Express",
      fromCity: from,
      fromCode: from.includes("(") ? from.split("(")[1]?.replace(")", "") : "NDLS",
      toCity: to,
      toCode: to.includes("(") ? to.split("(")[1]?.replace(")", "") : "MMCT",
      departureTime: "06:00",
      arrivalTime: "14:15",
      duration: "8h 15m",
      trainClass: trainClass === "1A" || trainClass === "2A" || trainClass === "3A" || trainClass === "SL" ? "CC" : trainClass,
      quota,
      stopsDisplay: "5 Stops · High Speed 130 km/h",
      platform: "Platform 1",
      pantryAvailable: true,
      availabilityStatus: quota === "TATKAL (TQ)" ? "TATKAL AVL 14" : "AVAILABLE 54",
      seatsAvailable: 54,
      baseFarePaise: (classBaseMap[trainClass === "1A" || trainClass === "2A" || trainClass === "3A" || trainClass === "SL" ? "CC" : trainClass] || 115000) + tatkalExtra,
      carrierTaxesPaise: 4500,
      orderKingDeskFeePaise: 0,
      otaBenchmarkFeePaise: 4000,
      partnerRebateBps: 100,
    },
    {
      id: "tr-12952-rajdhani",
      mode: "train",
      carrierCode: "IRCTC",
      carrierName: "Indian Railways",
      serviceNumber: "12952 / TEJAS RAJDHANI",
      title: "Mumbai Tejas Rajdhani Express",
      fromCity: from,
      fromCode: from.includes("(") ? from.split("(")[1]?.replace(")", "") : "NDLS",
      toCity: to,
      toCode: to.includes("(") ? to.split("(")[1]?.replace(")", "") : "MMCT",
      departureTime: "16:55",
      arrivalTime: "08:35 (+1)",
      duration: "15h 40m",
      trainClass,
      quota,
      stopsDisplay: "6 Stops · Smart Coach with Dynamic Lighting",
      platform: "Platform 3",
      pantryAvailable: true,
      availabilityStatus: quota === "TATKAL (TQ)" ? "TATKAL AVL 08" : "AVAILABLE 32",
      seatsAvailable: 32,
      baseFarePaise: base + tatkalExtra,
      carrierTaxesPaise: 6500,
      orderKingDeskFeePaise: 0,
      otaBenchmarkFeePaise: 4000,
      partnerRebateBps: 100,
    },
    {
      id: "tr-12002-shatabdi",
      mode: "train",
      carrierCode: "IRCTC",
      carrierName: "Indian Railways",
      serviceNumber: "12002 / BHOPAL SHATABDI",
      title: "New Delhi Bhopal Shatabdi Express",
      fromCity: from,
      fromCode: from.includes("(") ? from.split("(")[1]?.replace(")", "") : "NDLS",
      toCity: to,
      toCode: to.includes("(") ? to.split("(")[1]?.replace(")", "") : "MMCT",
      departureTime: "06:15",
      arrivalTime: "14:20",
      duration: "8h 05m",
      trainClass: trainClass === "1A" || trainClass === "EC" ? "EC" : "CC",
      quota,
      stopsDisplay: "4 Stops · Complimentary Breakfast & Meal",
      platform: "Platform 2",
      pantryAvailable: true,
      availabilityStatus: quota === "TATKAL (TQ)" ? "TATKAL AVL 06" : "AVAILABLE 24",
      seatsAvailable: 24,
      baseFarePaise: (trainClass === "1A" || trainClass === "EC" ? 210000 : 115000) + tatkalExtra,
      carrierTaxesPaise: 4000,
      orderKingDeskFeePaise: 0,
      otaBenchmarkFeePaise: 4000,
      partnerRebateBps: 100,
    },
    {
      id: "tr-12628-superfast",
      mode: "train",
      carrierCode: "IRCTC",
      carrierName: "Indian Railways",
      serviceNumber: "12628 / KARNATAKA EXPRESS",
      title: "Karnataka Superfast Express",
      fromCity: from,
      fromCode: from.includes("(") ? from.split("(")[1]?.replace(")", "") : "NDLS",
      toCity: to,
      toCode: to.includes("(") ? to.split("(")[1]?.replace(")", "") : "MMCT",
      departureTime: "20:20",
      arrivalTime: "13:40 (+1)",
      duration: "17h 20m",
      trainClass,
      quota,
      stopsDisplay: "12 Stops · Superfast Express Corridor",
      platform: "Platform 5",
      pantryAvailable: true,
      availabilityStatus: quota === "TATKAL (TQ)" ? "TATKAL AVL 12" : "CURR_AVL 18",
      seatsAvailable: 18,
      baseFarePaise: Math.round(base * 0.85) + tatkalExtra,
      carrierTaxesPaise: 3500,
      orderKingDeskFeePaise: 0,
      otaBenchmarkFeePaise: 4000,
      partnerRebateBps: 100,
    },
  ];
}

export function generateBusSeats(baseFarePaise: number): BusSeatBerth[] {
  const seats: BusSeatBerth[] = [];
  // 12 Lower Berths (L1 to L12)
  for (let i = 1; i <= 12; i++) {
    const isWindow = i % 3 === 1 || i % 3 === 0;
    seats.push({
      id: `L${i}`,
      label: `L${i} (${isWindow ? "Window" : "Aisle"})`,
      deck: "lower",
      berthType: "sleeper",
      isWindow,
      isAvailable: i !== 3 && i !== 7, // deterministic availability
      pricePaise: baseFarePaise + (isWindow ? 5000 : 0),
    });
  }
  // 12 Upper Berths (U1 to U12)
  for (let i = 1; i <= 12; i++) {
    const isWindow = i % 3 === 1 || i % 3 === 0;
    seats.push({
      id: `U${i}`,
      label: `U${i} (${isWindow ? "Window" : "Aisle"})`,
      deck: "upper",
      berthType: "sleeper",
      isWindow,
      isAvailable: i !== 5 && i !== 10,
      pricePaise: baseFarePaise + (isWindow ? 5000 : 0),
    });
  }
  return seats;
}

export function searchBusQuotes(
  from = "Bengaluru (Kempegowda)",
  to = "Goa (Panaji)",
  date = new Date().toISOString().split("T")[0]
): BusQuote[] {
  return [
    {
      id: "bs-intrcity-volvo",
      mode: "bus",
      carrierCode: "INTR",
      carrierName: "IntrCity SmartBus",
      serviceNumber: "KA-01-AK-9021",
      title: "IntrCity Volvo Multi-Axle AC Sleeper",
      fromCity: from,
      toCity: to,
      departureTime: "20:30",
      arrivalTime: "06:45 (+1)",
      duration: "10h 15m",
      busType: "Volvo Multi-Axle AC Sleeper (2+1)",
      operatorName: "IntrCity SmartBus",
      boardingPoint: "Kempegowda Majestic Bus Station, Bay 4",
      droppingPoint: "Panaji Bus Stand, Platform 1",
      amenities: ["Free High-Speed WiFi", "Charging Ports at Each Berth", "Sanitized Blanket & Pillow", "Complimentary Water Bottle", "Live GPS Tracking"],
      seatsAvailable: 19,
      seats: generateBusSeats(135000),
      baseFarePaise: 135000,
      carrierTaxesPaise: 6750,
      orderKingDeskFeePaise: 0,
      otaBenchmarkFeePaise: 4500,
      partnerRebateBps: 300,
    },
    {
      id: "bs-vrl-scania",
      mode: "bus",
      carrierCode: "VRL",
      carrierName: "VRL Travels",
      serviceNumber: "KA-25-AA-5544",
      title: "VRL I-Shift Multi-Axle Scania Sleeper",
      fromCity: from,
      toCity: to,
      departureTime: "21:15",
      arrivalTime: "07:30 (+1)",
      duration: "10h 15m",
      busType: "Scania Multi-Axle AC Sleeper",
      operatorName: "VRL Travels",
      boardingPoint: "Anand Rao Circle / Majestic",
      droppingPoint: "Mapusa & Panaji Bus Stand",
      amenities: ["Scania Air Suspension", "USB Fast Chargers", "Individual Reading Light", "Emergency SOS Button"],
      seatsAvailable: 16,
      seats: generateBusSeats(145000),
      baseFarePaise: 145000,
      carrierTaxesPaise: 7250,
      orderKingDeskFeePaise: 0,
      otaBenchmarkFeePaise: 4500,
      partnerRebateBps: 250,
    },
    {
      id: "bs-nuego-electric",
      mode: "bus",
      carrierCode: "NUE",
      carrierName: "NueGo (GreenCell)",
      serviceNumber: "DL-01-EV-2026",
      title: "NueGo 100% Electric Luxury AC Coach",
      fromCity: from,
      toCity: to,
      departureTime: "18:00",
      arrivalTime: "04:30 (+1)",
      duration: "10h 30m",
      busType: "Electric Multi-Axle AC Sleeper",
      operatorName: "NueGo Electric",
      boardingPoint: "Shantinagar Bus Station",
      droppingPoint: "Panaji Central Terminal",
      amenities: ["Zero Tailpipe Emissions", "Whisper Quiet Cabin", "Air-Purified Airflow", "Speed Limiter & CCTV"],
      seatsAvailable: 22,
      seats: generateBusSeats(120000),
      baseFarePaise: 120000,
      carrierTaxesPaise: 6000,
      orderKingDeskFeePaise: 0,
      otaBenchmarkFeePaise: 4500,
      partnerRebateBps: 350,
    },
    {
      id: "bs-zingbus-bharatbenz",
      mode: "bus",
      carrierCode: "ZING",
      carrierName: "Zingbus Premium",
      serviceNumber: "HR-55-AN-7711",
      title: "Zingbus Premium BharatBenz AC Sleeper",
      fromCity: from,
      toCity: to,
      departureTime: "22:00",
      arrivalTime: "08:00 (+1)",
      duration: "10h 00m",
      busType: "BharatBenz Luxury AC Sleeper (2+1)",
      operatorName: "Zingbus",
      boardingPoint: "Madiwala Silk Board Junction",
      droppingPoint: "Panaji Kadamba Bus Stand",
      amenities: ["Zingbus Executive Lounge Access", "Live Location Tracking", "Clean Bedroll Kit", "Water Bottle"],
      seatsAvailable: 14,
      seats: generateBusSeats(128000),
      baseFarePaise: 128000,
      carrierTaxesPaise: 6400,
      orderKingDeskFeePaise: 0,
      otaBenchmarkFeePaise: 4500,
      partnerRebateBps: 300,
    },
  ];
}

export function searchCabQuotes(
  pickup = "Terminal 3, IGI Airport (DEL)",
  drop = "Connaught Place, New Delhi",
  category: "City Taxi" | "Airport Transfer" | "Intercity One-Way" | "Hourly Rental" = "Airport Transfer"
): CabQuote[] {
  const baseRate = category === "Airport Transfer" ? 95000 : category === "Intercity One-Way" ? 285000 : category === "Hourly Rental" ? 165000 : 55000;

  return [
    {
      id: "cb-sedan-dzire",
      mode: "cab",
      carrierCode: "OK-CAB",
      carrierName: "OrderKing Chauffeur",
      serviceNumber: "SEDAN-01",
      title: "Prime Sedan (Maruti Dzire / Etios)",
      category,
      fromCity: pickup,
      toCity: drop,
      departureTime: "Instant Dispatch",
      arrivalTime: "Estimated 45m trip",
      duration: "45 mins",
      vehicleModel: "Maruti Suzuki Dzire AC",
      vehicleType: "Sedan",
      seatingCapacity: 4,
      driverName: "Rajesh Kumar Sharma",
      driverRating: 4.92,
      vehiclePlate: "DL-1Z-9281",
      etaMinutes: 4,
      seatsAvailable: 4,
      baseFarePaise: baseRate,
      carrierTaxesPaise: Math.round(baseRate * 0.05),
      orderKingDeskFeePaise: 0,
      otaBenchmarkFeePaise: 5000,
      partnerRebateBps: 250,
    },
    {
      id: "cb-suv-innova",
      mode: "cab",
      carrierCode: "OK-CAB",
      carrierName: "OrderKing Chauffeur",
      serviceNumber: "SUV-02",
      title: "Prime SUV (Toyota Innova Crysta)",
      category,
      fromCity: pickup,
      toCity: drop,
      departureTime: "Instant Dispatch",
      arrivalTime: "Estimated 45m trip",
      duration: "45 mins",
      vehicleModel: "Toyota Innova Crysta AC",
      vehicleType: "SUV",
      seatingCapacity: 6,
      driverName: "Gurpreet Singh",
      driverRating: 4.95,
      vehiclePlate: "DL-1Z-3849",
      etaMinutes: 6,
      seatsAvailable: 6,
      baseFarePaise: Math.round(baseRate * 1.55),
      carrierTaxesPaise: Math.round(baseRate * 1.55 * 0.05),
      orderKingDeskFeePaise: 0,
      otaBenchmarkFeePaise: 7500,
      partnerRebateBps: 300,
    },
    {
      id: "cb-ev-tigor",
      mode: "cab",
      carrierCode: "OK-CAB",
      carrierName: "OrderKing Green Fleet",
      serviceNumber: "EV-03",
      title: "Electric Green Taxi (Tata Tigor EV)",
      category,
      fromCity: pickup,
      toCity: drop,
      departureTime: "Instant Dispatch",
      arrivalTime: "Estimated 45m trip",
      duration: "45 mins",
      vehicleModel: "Tata Tigor EV Electric",
      vehicleType: "EV Taxi",
      seatingCapacity: 4,
      driverName: "Amitabh Verma",
      driverRating: 4.88,
      vehiclePlate: "DL-1Z-EV-8820",
      etaMinutes: 3,
      seatsAvailable: 4,
      baseFarePaise: Math.round(baseRate * 0.95),
      carrierTaxesPaise: Math.round(baseRate * 0.95 * 0.05),
      orderKingDeskFeePaise: 0,
      otaBenchmarkFeePaise: 5000,
      partnerRebateBps: 350,
    },
    {
      id: "cb-mini-wagonr",
      mode: "cab",
      carrierCode: "OK-CAB",
      carrierName: "OrderKing Chauffeur",
      serviceNumber: "MINI-04",
      title: "Compact Mini (Maruti WagonR)",
      category,
      fromCity: pickup,
      toCity: drop,
      departureTime: "Instant Dispatch",
      arrivalTime: "Estimated 45m trip",
      duration: "45 mins",
      vehicleModel: "Maruti WagonR AC",
      vehicleType: "Mini",
      seatingCapacity: 4,
      driverName: "Sunil Yadav",
      driverRating: 4.82,
      vehiclePlate: "DL-1Z-4412",
      etaMinutes: 5,
      seatsAvailable: 4,
      baseFarePaise: Math.round(baseRate * 0.8),
      carrierTaxesPaise: Math.round(baseRate * 0.8 * 0.05),
      orderKingDeskFeePaise: 0,
      otaBenchmarkFeePaise: 4000,
      partnerRebateBps: 200,
    },
  ];
}

// ============================================================================
// SOVEREIGN DIGITAL E-TICKET ISSUANCE & PERSISTENCE
// ============================================================================

export const SOVEREIGN_ETICKETS_STORAGE_KEY = "orderking_sovereign_etickets_v1";
export const SAVED_TRIPS_STORAGE_KEY = "orderking_saved_trips_v1";

export function issueSovereignETicket(params: {
  quote: BaseQuote & Record<string, any>;
  passengers: Passenger[];
  contact: BookingContact;
  paymentMethod: PaymentMethod;
  rebateDestination: RebateChoice;
  selectedSeats?: string[];
  travelDate?: string;
}): SovereignETicket {
  const pnr = generateSovereignPnr(params.quote.mode);
  const bookingId = `BK-${Date.now().toString().slice(-8)}`;
  const dateStr = params.travelDate || new Date().toISOString().split("T")[0];

  const fareCalc = calculateFareBreakdown(
    params.quote.baseFarePaise,
    params.quote.carrierTaxesPaise,
    params.passengers.length,
    params.quote.otaBenchmarkFeePaise,
    params.quote.partnerRebateBps
  );

  // Seat allocations
  const allocatedPassengers = params.passengers.map((p, idx) => {
    let seat = "Confirmed";
    if (params.selectedSeats && params.selectedSeats[idx]) {
      seat = params.selectedSeats[idx];
    } else if (params.quote.mode === "flight") {
      seat = `${12 + idx}${["A", "B", "C", "D", "E", "F"][idx % 6]}`;
    } else if (params.quote.mode === "train") {
      seat = `B2-${21 + idx} (${p.seatPreference || "Lower"})`;
    } else if (params.quote.mode === "bus") {
      seat = `Berth L${idx + 1} (${p.seatPreference || "Window"})`;
    } else {
      seat = `Seat ${idx + 1}`;
    }
    return {
      ...p,
      allocatedSeat: seat,
      bookingStatus: "CONFIRMED" as const,
    };
  });

  const transactionId = generateTransactionId(params.paymentMethod);
  const rebateCreditedStr =
    params.rebateDestination === "24k_gold"
      ? `${fareCalc.rebateGoldMilligrams} mg 24K Digital Gold`
      : `₹${(fareCalc.rebateFoodWalletPaise / 100).toFixed(2)} Food Wallet Cashback`;

  let departureTimestamp: string;
  try {
    const rawTime = (params.quote.departureTime || "").split(" ")[0];
    if (rawTime && /^\d{1,2}:\d{2}$/.test(rawTime)) {
      departureTimestamp = new Date(`${dateStr}T${rawTime.padStart(5, "0")}:00`).toISOString();
    } else {
      departureTimestamp = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    }
  } catch {
    departureTimestamp = new Date().toISOString();
  }

  // QR Code payload data
  const qrCodeData = JSON.stringify({
    pnr,
    carrier: params.quote.serviceNumber,
    paxCount: params.passengers.length,
    origin: params.quote.fromCity,
    destination: params.quote.toCity,
    date: dateStr,
    totalPaise: fareCalc.totalCheckoutPaise,
    sovereignGuarantee: "0% Convenience Fee",
  });

  const ticket: SovereignETicket = {
    pnr,
    bookingId,
    mode: params.quote.mode,
    carrierCode: params.quote.carrierCode,
    carrierName: params.quote.carrierName,
    serviceNumber: params.quote.serviceNumber,
    serviceTitle: params.quote.title,
    origin: {
      city: params.quote.fromCity,
      code: params.quote.fromCode,
      terminalOrPlatform: params.quote.terminal || params.quote.platform || params.quote.boardingPoint || "Main Terminal",
      departureDate: dateStr,
      departureTime: params.quote.departureTime,
    },
    destination: {
      city: params.quote.toCity,
      code: params.quote.toCode,
      terminalOrPlatform: params.quote.droppingPoint || "Arrival Terminal",
      arrivalDate: dateStr,
      arrivalTime: params.quote.arrivalTime,
    },
    duration: params.quote.duration,
    classOrTier: params.quote.cabinClass || params.quote.trainClass || params.quote.busType || params.quote.vehicleType || "Confirmed",
    quota: params.quote.quota,
    stopsDisplay: params.quote.stopsDisplay,
    passengers: allocatedPassengers,
    contact: params.contact,
    fareBreakdown: fareCalc,
    payment: {
      method: params.paymentMethod,
      paidAt: new Date().toISOString(),
      transactionId,
      rebateDestination: params.rebateDestination,
      rebateAmountCredited: rebateCreditedStr,
    },
    cancellationPolicy: {
      refundableUntil: "Up to 4 hours before scheduled departure",
      refundablePaise: fareCalc.totalCheckoutPaise,
      orderKingPenaltyPaise: 0,
      terms: "100% full refund directly credited back to KingPay Loyalty Wallet with ₹0 OrderKing cancellation penalty.",
    },
    departureTimestamp,
    status: "CONFIRMED",
    qrCodeData,
    cabDriver: params.quote.mode === "cab" ? {
      name: params.quote.driverName || "Rajesh Kumar",
      phone: "+91 98765 43210",
      vehicleModel: params.quote.vehicleModel || "Maruti Dzire",
      vehiclePlate: params.quote.vehiclePlate || "DL-1Z-9281",
      otp: `${Math.floor(1000 + Math.random() * 9000)}`,
      etaMinutes: params.quote.etaMinutes || 4,
    } : undefined,
    bookedAt: new Date().toISOString(),
  };

  saveETicketToStorage(ticket);
  syncTicketToSavedTrips(ticket);

  return ticket;
}

export function getStoredETickets(): SovereignETicket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SOVEREIGN_ETICKETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveETicketToStorage(ticket: SovereignETicket): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredETickets();
    const updated = [ticket, ...current.filter((t) => t.pnr !== ticket.pnr)];
    window.localStorage.setItem(SOVEREIGN_ETICKETS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore quota
  }
}

function syncTicketToSavedTrips(ticket: SovereignETicket): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(SAVED_TRIPS_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const modeName =
      ticket.mode === "flight" ? "Flight" :
      ticket.mode === "train" ? "Train" :
      ticket.mode === "bus" ? "Bus" : "Cab";

    const tripEntry = {
      id: `trip-${ticket.pnr}`,
      bookingType: modeName,
      providerName: `${ticket.carrierName} (${ticket.serviceNumber})`,
      bookingRef: ticket.pnr,
      travelDate: ticket.origin.departureDate,
      routeOrLocation: `${ticket.origin.city} ➔ ${ticket.destination.city}`,
      notes: `${ticket.passengers.length} Pax · Total ₹${(ticket.fareBreakdown.totalCheckoutPaise / 100).toFixed(2)} · In-App Confirmed`,
      createdAt: ticket.bookedAt,
      sovereignETicket: ticket,
    };

    const nextTrips = [tripEntry, ...(Array.isArray(existing) ? existing.filter((t: any) => t.bookingRef !== ticket.pnr) : [])];
    window.localStorage.setItem(SAVED_TRIPS_STORAGE_KEY, JSON.stringify(nextTrips));
  } catch {
    // ignore
  }
}
